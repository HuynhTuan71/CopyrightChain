/**
 * Tiện ích chuẩn hóa Metadata (IPFS CID + pHash) và đo độ dài UTF-8 bytes
 * Hỗ trợ:
 * 1. Đọc trực tiếp trường ipfsCid và pHash từ Smart Contract bản nâng cấp
 * 2. Tương thích ngược với các bản ghi cũ có nhúng thẻ [meta:ipfs=...|phash=...] trong description
 */

import { isNonZeroPHash, normalizePHashBytes8 } from "./phash";

const META_PREFIX = "[meta:";
const META_SUFFIX = "]";

/**
 * Đếm chính xác số byte UTF-8 của một chuỗi (khớp 100% với bytes(str).length trong Solidity)
 * @param {string} str
 * @returns {number}
 */
export function getUtf8ByteLength(str = "") {
  return new TextEncoder().encode(str || "").length;
}

/**
 * Cắt chuỗi sao cho độ dài UTF-8 không vượt quá maxBytes
 * @param {string} str
 * @param {number} maxBytes
 * @returns {string}
 */
export function truncateToUtf8Bytes(str = "", maxBytes = 100) {
  let result = str || "";
  while (getUtf8ByteLength(result) > maxBytes && result.length > 0) {
    result = result.slice(0, -1);
  }
  return result;
}

/**
 * Đóng gói mô tả kèm Metadata (giữ lại cho tương thích ngược nếu cần)
 */
export function encodeDescriptionWithMetadata(userDescription = "", { ipfsHash = "", pHash = "" } = {}) {
  const cleanDesc = (userDescription || "").trim();

  if (!ipfsHash && !pHash) {
    return truncateToUtf8Bytes(cleanDesc, 500);
  }

  const parts = [];
  if (ipfsHash) parts.push(`ipfs=${ipfsHash.trim()}`);
  if (pHash && isNonZeroPHash(pHash)) parts.push(`phash=${normalizePHashBytes8(pHash)}`);

  if (parts.length === 0) {
    return truncateToUtf8Bytes(cleanDesc, 500);
  }

  const metaTag = `${META_PREFIX}${parts.join("|")}${META_SUFFIX}`;
  const metaTagBytes = getUtf8ByteLength(metaTag);
  const maxDescBytes = 490 - metaTagBytes;
  const truncatedDesc = truncateToUtf8Bytes(cleanDesc, Math.max(0, maxDescBytes));

  return truncatedDesc ? `${truncatedDesc}\n${metaTag}` : metaTag;
}

/**
 * Chuẩn hóa đối tượng Work từ Smart Contract thành định dạng thống nhất cho Frontend
 * @param {Object} work
 * @returns {Object}
 */
export function parseWorkMetadata(work) {
  if (!work) return work;

  const rawDescription = work.description || "";
  let cleanDescription = rawDescription;
  let ipfsHash = (work.ipfsCid || work.ipfsHash || "").trim();
  let pHash = isNonZeroPHash(work.pHash) ? normalizePHashBytes8(work.pHash) : "";

  // Tương thích ngược: bóc tách thẻ [meta:...] nếu có trong dữ liệu cũ
  const metaRegex = /\[meta:(.*?)\]/s;
  const match = rawDescription.match(metaRegex);

  if (match) {
    cleanDescription = rawDescription.replace(metaRegex, "").trim();
    const pairs = match[1].split("|");
    for (const pair of pairs) {
      const [key, value] = pair.split("=");
      if (key === "ipfs" && value && !ipfsHash) {
        ipfsHash = value.trim();
      } else if (key === "phash" && value && !pHash && isNonZeroPHash(value)) {
        pHash = normalizePHashBytes8(value);
      }
    }
  }

  return {
    ...work,
    cleanDescription,
    ipfsCid: ipfsHash,
    ipfsHash,
    pHash,
  };
}

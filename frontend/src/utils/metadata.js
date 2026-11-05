/**
 * Tiện ích mã hóa & giải mã Metadata (IPFS Hash + pHash Visual Fingerprint)
 * Đóng gói an toàn vào trường description của Smart Contract (tối đa 500 bytes)
 * Giúp tương thích 100% với Smart Contract đã deploy sẵn trên Sepolia mà không cần migrate!
 */

const META_PREFIX = "[meta:";
const META_SUFFIX = "]";

/**
 * Đóng gói mô tả của người dùng kèm mã IPFS và pHash
 * @param {string} userDescription Mô tả do người dùng nhập
 * @param {{ ipfsHash?: string, pHash?: string }} metadata
 * @returns {string} Chuỗi description đã đóng gói (đảm bảo <= 500 bytes)
 */
export function encodeDescriptionWithMetadata(userDescription = "", { ipfsHash = "", pHash = "" } = {}) {
  const cleanDesc = (userDescription || "").trim();

  // Nếu không có cả IPFS và pHash thì trả về mô tả gốc
  if (!ipfsHash && !pHash) {
    return cleanDesc.slice(0, 500);
  }

  // Đóng gói dạng tag gọn nhẹ: [meta:ipfs=Qm...|phash=0x...]
  const parts = [];
  if (ipfsHash) parts.push(`ipfs=${ipfsHash.trim()}`);
  if (pHash) parts.push(`phash=${pHash.trim()}`);

  const metaTag = `${META_PREFIX}${parts.join("|")}${META_SUFFIX}`;

  // Giới hạn tổng độ dài không vượt quá 500 byte (theo require của Smart Contract)
  // Tính độ dài byte UTF-8
  const metaTagBytes = new TextEncoder().encode(metaTag).length;
  const maxDescBytes = 490 - metaTagBytes;

  let truncatedDesc = cleanDesc;
  while (new TextEncoder().encode(truncatedDesc).length > maxDescBytes && truncatedDesc.length > 0) {
    truncatedDesc = truncatedDesc.slice(0, -1);
  }

  return truncatedDesc ? `${truncatedDesc}\n${metaTag}` : metaTag;
}

/**
 * Giải mã trường description để bóc tách mô tả gốc, IPFS CID và pHash
 * @param {Object} work Đối tượng tác phẩm từ Smart Contract { description, ... }
 * @returns {Object} Đối tượng tác phẩm đã bổ sung { cleanDescription, ipfsHash, pHash }
 */
export function parseWorkMetadata(work) {
  if (!work) return work;

  const rawDescription = work.description || "";
  let cleanDescription = rawDescription;
  let ipfsHash = work.ipfsHash || "";
  let pHash = work.pHash || "";

  // Tìm kiếm thẻ [meta:...]
  const metaRegex = /\[meta:(.*?)\]/s;
  const match = rawDescription.match(metaRegex);

  if (match) {
    // Tách phần mô tả sạch
    cleanDescription = rawDescription.replace(metaRegex, "").trim();

    // Bóc tách các cặp key=value
    const metaContent = match[1];
    const pairs = metaContent.split("|");

    for (const pair of pairs) {
      const [key, value] = pair.split("=");
      if (key === "ipfs" && value) {
        ipfsHash = value.trim();
      } else if (key === "phash" && value) {
        pHash = value.trim();
      }
    }
  }

  return {
    ...work,
    cleanDescription,
    ipfsHash,
    pHash,
  };
}

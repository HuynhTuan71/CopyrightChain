import { ethers } from "ethers";
import contractConfig from "../contract/CopyrightRegistry.json";
import { parseWorkMetadata } from "./metadata";
import {
  isNonZeroPHash,
  normalizePHashBytes8,
  evaluatePlagiarismFromDistance,
  checkVisualPlagiarism,
  MEDIUM_SIMILAR_HAMMING_DISTANCE,
} from "./phash";

export const CONTRACT_ADDRESS = contractConfig.address;
export const CONTRACT_ABI = contractConfig.abi;
export const TARGET_CHAIN_ID = Number(contractConfig.chainId) || 11155111;
export const TARGET_CHAIN_ID_HEX = `0x${TARGET_CHAIN_ID.toString(16)}`;
export const TARGET_NETWORK_NAME = contractConfig.networkName || "sepolia";

// URL RPC công khai dự phòng để đọc dữ liệu khi người dùng chưa cài hoặc chưa kết nối ví
const PUBLIC_RPC_URL =
  TARGET_CHAIN_ID === 31337
    ? "http://127.0.0.1:8545"
    : import.meta.env.VITE_RPC_URL || "https://ethereum-sepolia-rpc.publicnode.com";

/**
 * Chuyển đổi struct Work trả về từ Ethers v6 thành plain object chuẩn hóa
 */
function normalizeWorkStruct(work) {
  return parseWorkMetadata({
    fileHash: work.fileHash,
    owner: work.owner,
    title: work.title,
    description: work.description,
    ipfsCid: work.ipfsCid || "",
    pHash: work.pHash || "",
    timestamp: Number(work.timestamp),
  });
}

/**
 * Khởi tạo Provider chỉ-đọc thông qua RPC URL
 * Cho phép trang Xác minh và Thống kê hoạt động mà KHÔNG cần ví MetaMask
 */
export function getReadOnlyProvider() {
  return new ethers.JsonRpcProvider(PUBLIC_RPC_URL);
}

/**
 * Lấy đối tượng Contract ở chế độ chỉ đọc (View-only)
 */
export function getReadOnlyContract() {
  const provider = getReadOnlyProvider();
  return new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);
}

/**
 * Lấy đối tượng Contract có gắn Signer để gửi giao dịch ghi lên Blockchain
 * @param {ethers.Signer} signer
 */
export function getSignerContract(signer) {
  return new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
}

/**
 * Lấy tổng số lượng tác phẩm đã đăng ký trên toàn hệ thống
 * @returns {Promise<number>}
 */
export async function fetchTotalWorks() {
  try {
    const contract = getReadOnlyContract();
    const total = await contract.totalWorks();
    return Number(total);
  } catch (error) {
    console.error("Lỗi khi đọc totalWorks:", error);
    return 0;
  }
}

/**
 * Kiểm tra xem một mã băm đã được đăng ký trên Blockchain hay chưa
 * @param {string} fileHash Mã hash bytes32
 * @returns {Promise<boolean>}
 */
export async function checkIsRegistered(fileHash) {
  try {
    const contract = getReadOnlyContract();
    return await contract.isRegistered(fileHash);
  } catch (error) {
    console.error("Lỗi khi kiểm tra isRegistered:", error);
    return false;
  }
}

/**
 * Lấy thông tin chi tiết một tác phẩm theo mã hash
 * @param {string} fileHash Mã hash bytes32
 * @returns {Promise<Object | null>}
 */
export async function fetchWork(fileHash) {
  try {
    const contract = getReadOnlyContract();
    const work = await contract.getWork(fileHash);
    return normalizeWorkStruct(work);
  } catch (error) {
    console.warn("Không tìm thấy tác phẩm hoặc lỗi khi gọi getWork:", error);
    return null;
  }
}

/**
 * Lấy danh sách các tác phẩm thuộc sở hữu của một địa chỉ ví
 * @param {string} ownerAddress
 * @returns {Promise<Array<Object>>}
 */
export async function fetchWorksByOwner(ownerAddress) {
  try {
    const contract = getReadOnlyContract();
    const hashes = await contract.getWorksByOwner(ownerAddress);

    if (!hashes || hashes.length === 0) return [];

    const worksPromises = hashes.map(async (hash) => {
      try {
        const item = await contract.getWork(hash);
        return normalizeWorkStruct(item);
      } catch (e) {
        console.error("Lỗi khi lấy chi tiết tác phẩm:", hash, e);
        return null;
      }
    });

    const results = await Promise.all(worksPromises);
    return results
      .filter((w) => w !== null)
      .sort((a, b) => b.timestamp - a.timestamp);
  } catch (error) {
    console.error("Lỗi khi fetchWorksByOwner:", error);
    return [];
  }
}

/**
 * Lấy toàn bộ danh sách tác phẩm trực tiếp từ state Smart Contract (KHÔNG dùng eth_getLogs)
 * Dùng phân trang getWorksPaginated để tránh timeout RPC khi dữ liệu lớn.
 * @returns {Promise<Array<Object>>}
 */
export async function fetchAllWorksOnChain() {
  try {
    const contract = getReadOnlyContract();
    const total = Number(await contract.totalWorks());
    if (total === 0) return [];

    const pageSize = 50;
    const allWorks = [];
    for (let offset = 0; offset < total; offset += pageSize) {
      const page = await contract.getWorksPaginated(offset, pageSize);
      for (const item of page) {
        allWorks.push(normalizeWorkStruct(item));
      }
    }
    return allWorks;
  } catch (error) {
    console.warn("Không thể tải danh sách tác phẩm bằng getWorksPaginated:", error);
    return [];
  }
}

/**
 * Quét tìm tác phẩm hình ảnh tương đồng trực tiếp trên Smart Contract (1 RPC view call duy nhất, miễn phí gas).
 * Không phụ thuộc localStorage hay eth_getLogs (không bao giờ bị lỗi pruned history!).
 *
 * @param {string} targetPHash Mã dHash 64-bit dạng bytes8 (0x...)
 * @param {number} [maxDistance=14] Khoảng cách Hamming tối đa tìm kiếm (9 => >=85.9%, 14 => >=78.1%)
 * @param {string | null} [excludeFileHash] Bỏ qua nếu trùng chính fileHash đang kiểm tra
 * @returns {Promise<Object>} Kết quả đánh giá từ evaluatePlagiarismFromDistance()
 */
export async function findSimilarWorkOnChain(
  targetPHash,
  maxDistance = MEDIUM_SIMILAR_HAMMING_DISTANCE,
  excludeFileHash = null
) {
  if (!isNonZeroPHash(targetPHash)) {
    return evaluatePlagiarismFromDistance(64, null);
  }

  const normalizedPHash = normalizePHashBytes8(targetPHash);

  try {
    const contract = getReadOnlyContract();
    const [found, matchedFileHash, minDistance] = await contract.findSimilarWork(
      normalizedPHash,
      maxDistance
    );

    if (!found || !matchedFileHash || matchedFileHash === ethers.ZeroHash) {
      return evaluatePlagiarismFromDistance(64, null);
    }

    // Nếu tác phẩm khớp nhất chính là fileHash đang loại trừ, đối chiếu qua danh sách đầy đủ
    if (excludeFileHash && matchedFileHash.toLowerCase() === excludeFileHash.toLowerCase()) {
      const allWorks = await fetchAllWorksOnChain();
      return checkVisualPlagiarism(normalizedPHash, allWorks, excludeFileHash);
    }

    const matchedWork = await fetchWork(matchedFileHash);
    return evaluatePlagiarismFromDistance(Number(minDistance), matchedWork);
  } catch (error) {
    console.warn("Lỗi khi gọi findSimilarWork on-chain, thử đọc danh sách tác phẩm dự phòng:", error);
    const allWorks = await fetchAllWorksOnChain();
    return checkVisualPlagiarism(normalizedPHash, allWorks, excludeFileHash);
  }
}

// Giữ alias tương thích ngược
export const fetchAllKnownWorks = fetchAllWorksOnChain;

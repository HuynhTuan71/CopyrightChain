import { ethers } from "ethers";
import contractConfig from "../contract/CopyrightRegistry.json";
import { parseWorkMetadata } from "./metadata";

export const CONTRACT_ADDRESS = contractConfig.address;
export const CONTRACT_ABI = contractConfig.abi;
export const TARGET_CHAIN_ID = 11155111; // Ethereum Sepolia Testnet
export const TARGET_CHAIN_ID_HEX = "0xaa36a7";

// URL RPC công khai dự phòng để đọc dữ liệu khi người dùng chưa cài hoặc chưa kết nối ví
const PUBLIC_RPC_URL =
  import.meta.env.VITE_RPC_URL ||
  "https://ethereum-sepolia-rpc.publicnode.com";

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
 * Lấy thông tin chi tiết một tác phẩm theo mã hash (tự động phân giải IPFS và pHash)
 * @param {string} fileHash Mã hash bytes32
 * @returns {Promise<{ fileHash: string, owner: string, title: string, description: string, cleanDescription: string, ipfsHash: string, pHash: string, timestamp: number } | null>}
 */
export async function fetchWork(fileHash) {
  try {
    const contract = getReadOnlyContract();
    const work = await contract.getWork(fileHash);
    const parsed = parseWorkMetadata({
      fileHash: work.fileHash,
      owner: work.owner,
      title: work.title,
      description: work.description,
      timestamp: Number(work.timestamp),
    });

    // Lưu vào bộ nhớ tạm known works để hỗ trợ tính năng chống đạo nhái pHash
    saveKnownWorkToCache(parsed);

    return parsed;
  } catch (error) {
    console.warn("Không tìm thấy tác phẩm hoặc lỗi khi gọi getWork:", error);
    return null;
  }
}

/**
 * Lấy danh sách các tác phẩm thuộc sở hữu của một địa chỉ ví
 * @param {string} ownerAddress
 * @returns {Promise<Array<{ fileHash: string, owner: string, title: string, description: string, cleanDescription: string, ipfsHash: string, pHash: string, timestamp: number }>>}
 */
export async function fetchWorksByOwner(ownerAddress) {
  try {
    const contract = getReadOnlyContract();
    const hashes = await contract.getWorksByOwner(ownerAddress);

    if (!hashes || hashes.length === 0) return [];

    // Gọi đồng thời thông tin chi tiết của từng hash
    const worksPromises = hashes.map(async (hash) => {
      try {
        const item = await contract.getWork(hash);
        const parsed = parseWorkMetadata({
          fileHash: item.fileHash,
          owner: item.owner,
          title: item.title,
          description: item.description,
          timestamp: Number(item.timestamp),
        });
        saveKnownWorkToCache(parsed);
        return parsed;
      } catch (e) {
        console.error("Lỗi khi lấy chi tiết tác phẩm:", hash, e);
        return null;
      }
    });

    const results = await Promise.all(worksPromises);
    // Sắp xếp tác phẩm mới nhất lên đầu
    return results
      .filter((w) => w !== null)
      .sort((a, b) => b.timestamp - a.timestamp);
  } catch (error) {
    console.error("Lỗi khi fetchWorksByOwner:", error);
    return [];
  }
}

/**
 * Lưu tác phẩm đã biết vào LocalStorage Cache để phục vụ tra cứu pHash nhanh chóng
 */
function saveKnownWorkToCache(work) {
  if (!work || !work.fileHash) return;
  try {
    const cacheKey = "copyright_known_works";
    const existing = JSON.parse(localStorage.getItem(cacheKey) || "{}");
    existing[work.fileHash] = {
      fileHash: work.fileHash,
      title: work.title,
      owner: work.owner,
      pHash: work.pHash,
      ipfsHash: work.ipfsHash,
      timestamp: work.timestamp,
    };
    localStorage.setItem(cacheKey, JSON.stringify(existing));
  } catch (e) {
    console.warn("Lỗi lưu cache known work:", e);
  }
}

/**
 * Lấy danh sách toàn bộ các tác phẩm đã biết trên hệ thống (để kiểm tra đạo nhái thị giác pHash)
 * @returns {Promise<Array<Object>>}
 */
export async function fetchAllKnownWorks() {
  const cacheKey = "copyright_known_works";
  let cachedList = [];

  try {
    const stored = JSON.parse(localStorage.getItem(cacheKey) || "{}");
    cachedList = Object.values(stored);
  } catch {
    cachedList = [];
  }

  try {
    const contract = getReadOnlyContract();
    // Lấy event WorkRegistered từ block gần nhất
    const filter = contract.filters.WorkRegistered();
    // Giới hạn trong khoảng 50,000 blocks gần đây để tránh timeout RPC
    const events = await contract.queryFilter(filter, -50000).catch(() => []);

    for (const evt of events) {
      const hash = evt.args?.fileHash || evt.args?.[0];
      if (hash && !cachedList.some((w) => w.fileHash === hash)) {
        try {
          const detail = await fetchWork(hash);
          if (detail) {
            cachedList.push(detail);
          }
        } catch {}
      }
    }
  } catch (err) {
    console.warn("Không thể query logs WorkRegistered từ RPC, sử dụng cached list:", err);
  }

  return cachedList;
}

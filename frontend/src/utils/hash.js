/**
 * Tiện ích băm file bằng Web Crypto API trực tiếp trên trình duyệt
 * Đảm bảo file gốc KHÔNG bị gửi lên máy chủ hay blockchain
 */

/**
 * Tính toán mã băm SHA-256 của một File hoặc Blob
 * @param {File | Blob} file Đối tượng file cần tính hash
 * @param {Function} [onProgress] Callback cập nhật tiến độ (0 - 100)
 * @returns {Promise<{ hash: string, fileSize: number, fileName: string }>} Chuỗi hash định dạng bytes32 (0x + 64 ký tự hex)
 */
export async function calculateFileHash(file, onProgress) {
  if (!file) {
    throw new Error("Không có file nào được chọn.");
  }

  if (file.size === 0) {
    throw new Error("File được chọn có dung lượng rỗng (0 byte).");
  }

  if (onProgress) onProgress(20);

  // Đọc nội dung file dưới dạng ArrayBuffer
  const buffer = await file.arrayBuffer();
  if (onProgress) onProgress(60);

  // Tính hash bằng thuật toán SHA-256 của Web Crypto API chuẩn
  const hashBuffer = await crypto.subtle.digest("SHA-256", buffer);
  if (onProgress) onProgress(90);

  // Chuyển đổi ArrayBuffer kết quả thành chuỗi Hexadecimal 64 ký tự
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  if (onProgress) onProgress(100);

  // Trả về định dạng bytes32 tương thích chuẩn của Solidity (0x...)
  return {
    hash: `0x${hashHex}`,
    fileSize: file.size,
    fileName: file.name,
  };
}

/**
 * Kiểm tra xem một chuỗi có phải là mã băm bytes32 (0x + 64 ký tự hex) hợp lệ hay không
 * @param {string} hash
 * @returns {boolean}
 */
export function isValidBytes32Hash(hash) {
  if (!hash || typeof hash !== "string") return false;
  return /^0x[0-9a-fA-F]{64}$/.test(hash.trim());
}

/**
 * Các hàm tiện ích định dạng dữ liệu hiển thị cho người dùng
 */

/**
 * Rút gọn địa chỉ ví Ethereum (Ví dụ: 0x12ab...89cd)
 * @param {string} address Địa chỉ đầy đủ (42 ký tự)
 * @param {number} start Số ký tự đầu muốn giữ lại
 * @param {number} end Số ký tự cuối muốn giữ lại
 * @returns {string}
 */
export function formatAddress(address, start = 6, end = 4) {
  if (!address) return "";
  if (address.length <= start + end) return address;
  return `${address.slice(0, start)}...${address.slice(-end)}`;
}

/**
 * Rút gọn chuỗi mã băm bytes32 (Ví dụ: 0x8a9f...3c21)
 * @param {string} hash Chuỗi hash 66 ký tự (bao gồm 0x)
 * @param {number} start
 * @param {number} end
 * @returns {string}
 */
export function formatHash(hash, start = 10, end = 8) {
  if (!hash) return "";
  if (hash.length <= start + end) return hash;
  return `${hash.slice(0, start)}...${hash.slice(-end)}`;
}

/**
 * Định dạng thời gian Unix timestamp thành giờ Việt Nam chuẩn (dd/MM/yyyy HH:mm:ss)
 * @param {number | bigint | string} timestamp Số giây Unix
 * @returns {string}
 */
export function formatTimestamp(timestamp) {
  if (!timestamp || Number(timestamp) === 0) return "Chưa xác định";

  const date = new Date(Number(timestamp) * 1000);

  // Định dạng theo múi giờ Việt Nam (UTC+7)
  const pad = (num) => String(num).padStart(2, "0");
  const day = pad(date.getDate());
  const month = pad(date.getMonth() + 1);
  const year = date.getFullYear();
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());
  const seconds = pad(date.getSeconds());

  return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
}

/**
 * Chuyển đổi dung lượng bytes thành đơn vị thân thiện (B, KB, MB, GB)
 * @param {number} bytes
 * @returns {string}
 */
export function formatFileSize(bytes) {
  if (bytes === 0) return "0 B";
  if (!bytes) return "0 B";

  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

/**
 * Sao chép văn bản vào bộ nhớ tạm Clipboard
 * @param {string} text
 * @returns {Promise<boolean>}
 */
export async function copyToClipboard(text) {
  try {
    if (navigator?.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
    // Fallback cho trình duyệt cũ
    const textArea = document.createElement("textarea");
    textArea.value = text;
    textArea.style.position = "fixed";
    textArea.style.opacity = "0";
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    const successful = document.execCommand("copy");
    document.body.removeChild(textArea);
    return successful;
  } catch (err) {
    console.error("Lỗi khi sao chép:", err);
    return false;
  }
}

/**
 * Tạo link tra cứu địa chỉ trên Sepolia Etherscan
 * @param {string} address
 * @returns {string}
 */
export function getEtherscanAddressUrl(address) {
  return `https://sepolia.etherscan.io/address/${address}`;
}

/**
 * Tạo link tra cứu giao dịch trên Sepolia Etherscan
 * @param {string} txHash
 * @returns {string}
 */
export function getEtherscanTxUrl(txHash) {
  return `https://sepolia.etherscan.io/tx/${txHash}`;
}

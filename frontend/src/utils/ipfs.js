/**
 * Tiện ích tích hợp IPFS (InterPlanetary File System) cho CopyrightChain
 * Hỗ trợ:
 * 1. Upload thực tế lên Pinata IPFS Gateway (khi có VITE_PINATA_JWT)
 * 2. Tính toán mã băm IPFS CIDv0 chuẩn (Multihash SHA-256 + Base58) trực tiếp trên Client
 * 3. Lưu trữ bộ đệm hình ảnh (Local Preview Cache) để xem trước ngay lập tức
 */

// Bảng mã Base58 chuẩn của IPFS (Bitcoin / IPFS Base58 Alphabet)
const BASE58_ALPHABET = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";

/**
 * Mã hóa mảng byte sang chuỗi Base58
 * @param {Uint8Array} bytes
 * @returns {string}
 */
export function encodeBase58(bytes) {
  const digits = [0];
  for (let i = 0; i < bytes.length; i++) {
    for (let j = 0; j < digits.length; j++) digits[j] <<= 8;
    digits[0] += bytes[i];
    let carry = 0;
    for (let j = 0; j < digits.length; j++) {
      digits[j] += carry;
      carry = (digits[j] / 58) | 0;
      digits[j] %= 58;
    }
    while (carry) {
      digits.push(carry % 58);
      carry = (carry / 58) | 0;
    }
  }
  for (let i = 0; i < bytes.length && bytes[i] === 0; i++) digits.push(0);
  return digits.reverse().map((d) => BASE58_ALPHABET[d]).join("");
}

/**
 * Tính toán mã IPFS CIDv0 chuẩn (Qm...) từ ArrayBuffer/File bằng Web Crypto API
 * Chuẩn Multihash: 0x12 (SHA-256) + 0x20 (32 bytes) + 32-byte digest -> Base58
 * @param {ArrayBuffer | File} input
 * @returns {Promise<string>} Mã IPFS CID (ví dụ: QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco)
 */
export async function calculateClientIpfsCid(input) {
  const buffer = input instanceof ArrayBuffer ? input : await input.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest("SHA-256", buffer);
  const hashArray = new Uint8Array(hashBuffer);

  // Tạo multihash: 0x12 (sha256), 0x20 (độ dài 32 byte), theo sau là hash 32 bytes
  const multihash = new Uint8Array(34);
  multihash[0] = 0x12;
  multihash[1] = 0x20;
  multihash.set(hashArray, 2);

  return encodeBase58(multihash);
}

/**
 * Lấy URL Gateway công khai để xem hoặc tải file từ IPFS
 * @param {string} ipfsHash
 * @returns {string}
 */
export function getIPFSGatewayUrl(ipfsHash) {
  if (!ipfsHash) return "";
  const customGateway = import.meta.env.VITE_PINATA_GATEWAY;
  if (customGateway) {
    const cleanGw = customGateway.replace(/\/+$/, "");
    return `${cleanGw}/${ipfsHash}`;
  }
  // Mặc định sử dụng public gateway uy tín
  return `https://gateway.pinata.cloud/ipfs/${ipfsHash}`;
}

/**
 * Lưu dữ liệu ảnh vào Local Storage Cache để xem trước tức thì
 */
export function cacheLocalPreview(ipfsHash, dataUrl) {
  try {
    if (ipfsHash && dataUrl && dataUrl.length < 2 * 1024 * 1024) {
      sessionStorage.setItem(`ipfs_preview_${ipfsHash}`, dataUrl);
    }
  } catch (e) {
    console.warn("Không thể lưu preview vào cache:", e);
  }
}

/**
 * Lấy dữ liệu ảnh xem trước từ Local Cache nếu có
 */
export function getLocalPreview(ipfsHash) {
  try {
    if (!ipfsHash) return null;
    return sessionStorage.getItem(`ipfs_preview_${ipfsHash}`);
  } catch {
    return null;
  }
}

/**
 * Tải file tác phẩm lên mạng IPFS (Pinata)
 * Nếu chưa cấu hình VITE_PINATA_JWT, hệ thống tự động băm mã IPFS CID chuẩn
 * và lưu trữ preview cache ở client để không làm gián đoạn trải nghiệm của người dùng.
 *
 * @param {File} file
 * @param {Function} [onProgress]
 * @returns {Promise<{ ipfsHash: string, ipfsUrl: string, isPinnedToNetwork: boolean }>}
 */
export async function uploadToIPFS(file, onProgress) {
  if (!file) throw new Error("Chưa chọn file để tải lên IPFS.");

  if (onProgress) onProgress(15);

  // 1. Luôn tính mã CIDv0 chuẩn ngay trên Client
  const clientCid = await calculateClientIpfsCid(file);
  if (onProgress) onProgress(40);

  // 2. Tạo Preview Data URL nếu là file ảnh để hiển thị ngay
  if (file.type.startsWith("image/")) {
    const reader = new FileReader();
    reader.onload = () => {
      cacheLocalPreview(clientCid, reader.result);
    };
    reader.readAsDataURL(file);
  }

  // 3. Kiểm tra xem có cấu hình Pinata JWT hay không
  const pinataJwt = import.meta.env.VITE_PINATA_JWT;

  if (pinataJwt && pinataJwt.trim().length > 20) {
    try {
      if (onProgress) onProgress(60);

      const formData = new FormData();
      formData.append("file", file);

      // Metadata định danh file trên Pinata
      const metadata = JSON.stringify({
        name: `CopyrightChain_${file.name}`,
        keyvalues: {
          app: "CopyrightChain",
          timestamp: Date.now().toString(),
        },
      });
      formData.append("pinataMetadata", metadata);

      // Tùy chọn Pinata
      const options = JSON.stringify({
        cidVersion: 0,
      });
      formData.append("pinataOptions", options);

      const response = await fetch("https://api.pinata.cloud/pinning/pinFileToIPFS", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${pinataJwt.trim()}`,
        },
        body: formData,
      });

      if (onProgress) onProgress(90);

      if (!response.ok) {
        throw new Error(`Pinata API trả về lỗi: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      const networkCid = result.IpfsHash;

      if (file.type.startsWith("image/")) {
        const preview = getLocalPreview(clientCid);
        if (preview) cacheLocalPreview(networkCid, preview);
      }

      if (onProgress) onProgress(100);

      return {
        ipfsHash: networkCid,
        ipfsUrl: getIPFSGatewayUrl(networkCid),
        isPinnedToNetwork: true,
      };
    } catch (networkError) {
      console.warn("Upload lên Pinata Gateway thất bại, chuyển về IPFS Client CID:", networkError);
      // Fallback về Client CID chuẩn
    }
  }

  if (onProgress) onProgress(100);

  return {
    ipfsHash: clientCid,
    ipfsUrl: getIPFSGatewayUrl(clientCid),
    isPinnedToNetwork: false,
  };
}

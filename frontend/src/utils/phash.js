/**
 * Tiện ích Perceptual Hashing (aHash - Average Hash & Visual Fingerprint)
 * Phát hiện đạo nhái và tương đồng hình ảnh thị giác (Visual Plagiarism Detection)
 *
 * Nguyên lý hoạt động:
 * 1. Chuyển ảnh về độ phân giải chuẩn 8x8 pixels (64 pixels) và thang độ xám (Grayscale).
 * 2. Tính toán độ sáng trung bình (average luminance) của toàn bộ 64 pixels.
 * 3. So sánh độ sáng từng pixel với mức trung bình: nếu pixel > avg -> gán bit 1, ngược lại bit 0.
 * 4. Đóng gói 64 bit thành chuỗi Hexadecimal 16 ký tự (Visual Fingerprint).
 * 5. Đo khoảng cách Hamming (Hamming Distance) để xác định tỷ lệ tương đồng (%).
 */

/**
 * Kiểm tra xem một đối tượng file có phải là hình ảnh hay không
 * @param {File | Blob | string} fileOrName
 * @returns {boolean}
 */
export function isImageFile(fileOrName) {
  if (!fileOrName) return false;
  if (typeof fileOrName === "object" && fileOrName.type) {
    return fileOrName.type.startsWith("image/");
  }
  const name = typeof fileOrName === "string" ? fileOrName : fileOrName.name || "";
  return /\.(png|jpe?g|webp|bmp|gif|svg)$/i.test(name);
}

/**
 * Đọc file hoặc URL thành đối tượng HTMLImageElement
 * @param {File | Blob | string} source
 * @returns {Promise<HTMLImageElement>}
 */
function loadImage(source) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = (e) => reject(new Error("Không thể load hình ảnh để phân tích pHash: " + e));

    if (typeof source === "string") {
      img.src = source;
    } else if (source instanceof Blob || source instanceof File) {
      img.src = URL.createObjectURL(source);
    } else {
      reject(new Error("Định dạng nguồn ảnh không hợp lệ."));
    }
  });
}

/**
 * Tính toán Perceptual Hash (64-bit aHash) từ một file ảnh hoặc URL
 * @param {File | Blob | string} imageSource
 * @returns {Promise<{ dHash: string, binaryString: string, matrix: boolean[][] }>}
 */
export async function calculateDHash(imageSource) {
  const img = await loadImage(imageSource);

  // Thu nhỏ ảnh về kích thước chuẩn 8x8 (64 pixels)
  const canvas = document.createElement("canvas");
  canvas.width = 8;
  canvas.height = 8;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });

  ctx.drawImage(img, 0, 0, 8, 8);
  const imgData = ctx.getImageData(0, 0, 8, 8).data;

  // Tính thang độ xám (Grayscale) và giá trị trung bình
  // Công thức chuẩn ITU-R BT.601: 0.299*R + 0.587*G + 0.114*B
  const grays = [];
  let sum = 0;
  for (let i = 0; i < imgData.length; i += 4) {
    const r = imgData[i];
    const g = imgData[i + 1];
    const b = imgData[i + 2];
    const gray = 0.299 * r + 0.587 * g + 0.114 * b;
    grays.push(gray);
    sum += gray;
  }

  const avg = sum / 64;

  // So sánh từng pixel với độ sáng trung bình để tạo 64 bits
  let binaryString = "";
  const matrix = [];

  for (let row = 0; row < 8; row++) {
    const rowMatrix = [];
    for (let col = 0; col < 8; col++) {
      const val = grays[row * 8 + col];
      const bit = val >= avg ? 1 : 0;
      binaryString += bit;
      rowMatrix.push(bit === 1);
    }
    matrix.push(rowMatrix);
  }

  // Chuyển 64 bit nhị phân thành chuỗi Hexadecimal 16 ký tự
  let hexString = "";
  for (let i = 0; i < 64; i += 4) {
    const nibble = binaryString.slice(i, i + 4);
    hexString += parseInt(nibble, 2).toString(16);
  }

  // Giải phóng URL nếu là object URL
  if (typeof imageSource !== "string" && img.src.startsWith("blob:")) {
    URL.revokeObjectURL(img.src);
  }

  return {
    dHash: `0x${hexString}`,
    binaryString,
    matrix,
  };
}

/**
 * Tính khoảng cách Hamming giữa hai chuỗi mã băm Hex 64-bit
 * Khoảng cách Hamming là số lượng bit khác nhau giữa hai chuỗi (0 -> 64)
 * @param {string} hashA Chuỗi hex dạng 0x... hoặc không có 0x
 * @param {string} hashB
 * @returns {number} Số lượng bit khác nhau (0 = giống hệt 100%, 64 = khác biệt hoàn toàn)
 */
export function calculateHammingDistance(hashA, hashB) {
  if (!hashA || !hashB) return 64;

  const cleanA = hashA.replace(/^0x/i, "").padStart(16, "0").slice(0, 16);
  const cleanB = hashB.replace(/^0x/i, "").padStart(16, "0").slice(0, 16);

  try {
    const bigA = BigInt(`0x${cleanA}`);
    const bigB = BigInt(`0x${cleanB}`);
    let xor = bigA ^ bigB;

    let distance = 0;
    while (xor > 0n) {
      if (xor & 1n) distance++;
      xor >>= 1n;
    }
    return distance;
  } catch (err) {
    console.error("Lỗi khi tính khoảng cách Hamming:", err);
    return 64;
  }
}

/**
 * Tính phần trăm độ tương đồng thị giác dựa trên khoảng cách Hamming
 * @param {string} hashA
 * @param {string} hashB
 * @returns {number} Tỷ lệ tương đồng (%) từ 0.0% đến 100.0%
 */
export function calculateSimilarity(hashA, hashB) {
  const distance = calculateHammingDistance(hashA, hashB);
  const similarity = ((64 - distance) / 64) * 100;
  return Math.max(0, Math.min(100, Math.round(similarity * 10) / 10));
}

/**
 * Quét đối chiếu mã pHash hiện tại với danh sách các tác phẩm đã đăng ký
 * để phát hiện đạo nhái hoặc chỉnh sửa ảnh (thay đổi pixel, chỉnh sáng, nén...)
 *
 * @param {string} targetPHash Mã pHash của file đang kiểm tra
 * @param {Array<Object>} registeredWorks Danh sách tác phẩm đã có trên hệ thống
 * @param {string} [excludeFileHash] Mã hash file gốc cần bỏ qua (nếu là chính nó)
 * @returns {{
 *   hasPlagiarismRisk: boolean,
 *   highestSimilarity: number,
 *   matchedWork: Object | null,
 *   riskLevel: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'NONE',
 *   hammingDistance: number
 * }}
 */
export function checkVisualPlagiarism(targetPHash, registeredWorks = [], excludeFileHash = null) {
  if (!targetPHash || !registeredWorks || registeredWorks.length === 0) {
    return {
      hasPlagiarismRisk: false,
      highestSimilarity: 0,
      matchedWork: null,
      riskLevel: "NONE",
      hammingDistance: 64,
    };
  }

  let bestMatch = null;
  let highestSimilarity = 0;
  let minDistance = 64;

  for (const work of registeredWorks) {
    if (excludeFileHash && work.fileHash?.toLowerCase() === excludeFileHash?.toLowerCase()) {
      continue;
    }

    const workPHash = work.pHash;
    if (!workPHash) continue;

    const distance = calculateHammingDistance(targetPHash, workPHash);
    const similarity = ((64 - distance) / 64) * 100;

    if (similarity > highestSimilarity) {
      highestSimilarity = similarity;
      minDistance = distance;
      bestMatch = work;
    }
  }

  highestSimilarity = Math.round(highestSimilarity * 10) / 10;

  // Xác định mức độ rủi ro:
  // - >= 92% (distance <= 5): CRITICAL (Gần như bản sao, đổi vài pixel hoặc chỉnh màu)
  // - >= 85% (distance <= 9): HIGH (Tương đồng cấu trúc thị giác rất cao)
  // - >= 78% (distance <= 14): MEDIUM (Nghi vấn tương đồng)
  let riskLevel = "NONE";
  let hasPlagiarismRisk = false;

  if (highestSimilarity >= 92) {
    riskLevel = "CRITICAL";
    hasPlagiarismRisk = true;
  } else if (highestSimilarity >= 85) {
    riskLevel = "HIGH";
    hasPlagiarismRisk = true;
  } else if (highestSimilarity >= 78) {
    riskLevel = "MEDIUM";
  }

  return {
    hasPlagiarismRisk,
    highestSimilarity,
    matchedWork: bestMatch,
    riskLevel,
    hammingDistance: minDistance,
  };
}

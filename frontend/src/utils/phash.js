/**
 * Tiện ích Perceptual Hashing (pHash 64-bit Lai - Luminance Structure + YCbCr Chroma)
 * Phát hiện đạo nhái và ảnh chỉnh sửa (sửa 1 pixel, nén JPEG, resize, chỉnh sáng, chèn watermark)
 *
 * Nguyên lý thuật toán 64-bit (tương thích chuẩn bytes8 của Solidity):
 * 1. Vẽ ảnh lên nền trắng kích thước chuẩn 8x6 (48 pixels) để xử lý đồng nhất cả ảnh PNG trong suốt.
 * 2. 48 bit cấu trúc độ sáng (Luminance Structure):
 *    - Tính độ sáng chuẩn ITU-R BT.601: Y = 0.299*R + 0.587*G + 0.114*B cho 48 ô.
 *    - So sánh từng ô với độ sáng trung bình avgY (Y >= avgY => 1, ngược lại 0).
 *    - Bền vững trước thay đổi độ sáng/độ tương phản toàn cục, nén ảnh, resize và sửa vài pixel.
 * 3. 16 bit đặc trưng màu sắc vùng (2x2 Quadrant YCbCr Chroma với mã Gray 3 mức):
 *    - Chia lưới 8x6 thành 4 vùng 4x3 (góc trên-trái, trên-phải, dưới-trái, dưới-phải).
 *    - Tính giá trị trung bình kênh màu Cb, Cr của từng vùng và lượng tử hóa mã Gray 2 bit:
 *      < 118 => "00", 118..138 => "01", > 138 => "11" (nhiễu nhẹ tối đa chỉ lệch 1 bit).
 *    - Chống báo nhầm giữa hai ảnh khác màu nhưng có bố cục sáng-tối tương tự.
 * 4. Tổng cộng 48 + 8 + 8 = 64 bit (bytes8), đối chiếu trực tiếp bằng hammingDistance64() on-chain.
 */

export const ZERO_PHASH = "0x0000000000000000";

// Đồng bộ 100% với hằng số MAX_SIMILAR_HAMMING_DISTANCE = 9 trên Smart Contract
// (64 - 9) / 64 = 85.9375% (>= 85%)
export const MAX_SIMILAR_HAMMING_DISTANCE = 9;
export const MEDIUM_SIMILAR_HAMMING_DISTANCE = 14;

/**
 * Chuẩn hóa chuỗi pHash về đúng định dạng bytes8 của Solidity (0x + 16 ký tự hex)
 * @param {string} pHash
 * @returns {string}
 */
export function normalizePHashBytes8(pHash) {
  if (!pHash || typeof pHash !== "string") return ZERO_PHASH;
  const clean = pHash.trim().replace(/^0x/i, "").toLowerCase();
  if (!/^[0-9a-f]{1,16}$/.test(clean)) return ZERO_PHASH;
  return `0x${clean.padStart(16, "0")}`;
}

/**
 * Kiểm tra xem pHash có khác giá trị rỗng bytes8(0) hay không
 * @param {string} pHash
 * @returns {boolean}
 */
export function isNonZeroPHash(pHash) {
  const normalized = normalizePHashBytes8(pHash);
  return normalized !== ZERO_PHASH;
}

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
 * Lượng tử hóa kênh màu Cb/Cr sang mã Gray 2-bit (3 mức: thấp / trung tính / cao)
 * Mã Gray giúp dao động nhỏ quanh ngưỡng chỉ làm thay đổi tối đa 1 bit.
 */
function quantizeChromaGray2(val) {
  if (val < 118) return "00";
  if (val <= 138) return "01";
  return "11";
}

/**
 * Tính toán Perceptual Hash 64-bit (48-bit Luminance 8x6 + 16-bit YCbCr Chroma 2x2)
 * @param {File | Blob | string} imageSource
 * @returns {Promise<{ dHash: string, pHash: string, binaryString: string, matrix: boolean[][] }>}
 */
export async function calculatePHash(imageSource) {
  const img = await loadImage(imageSource);

  const width = 8;
  const height = 6;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });

  // Tô nền trắng trước khi vẽ để xử lý nhất quán ảnh PNG có nền trong suốt
  ctx.fillStyle = "#FFFFFF";
  ctx.fillRect(0, 0, width, height);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(img, 0, 0, width, height);

  const imgData = ctx.getImageData(0, 0, width, height).data;

  // 1. Tính 48 bit cấu trúc độ sáng (Luminance 8x6)
  const luminances = new Float64Array(48);
  let sumY = 0;
  for (let i = 0; i < 48; i++) {
    const idx = i * 4;
    const y = 0.299 * imgData[idx] + 0.587 * imgData[idx + 1] + 0.114 * imgData[idx + 2];
    luminances[i] = y;
    sumY += y;
  }

  const avgY = sumY / 48;
  let lumBits = "";
  const matrix = [];

  for (let row = 0; row < height; row++) {
    const rowMatrix = [];
    for (let col = 0; col < width; col++) {
      const bit = luminances[row * width + col] >= avgY ? 1 : 0;
      lumBits += bit;
      rowMatrix.push(bit === 1);
    }
    matrix.push(rowMatrix);
  }

  // 2. Tính 16 bit đặc trưng màu sắc YCbCr trên 4 góc phần tư 2x2 (mỗi vùng gồm 4x3 = 12 pixel)
  let cbBits = "";
  let crBits = "";
  for (let qy = 0; qy < 2; qy++) {
    for (let qx = 0; qx < 2; qx++) {
      let sumCb = 0;
      let sumCr = 0;
      for (let dy = 0; dy < 3; dy++) {
        for (let dx = 0; dx < 4; dx++) {
          const idx = ((qy * 3 + dy) * width + (qx * 4 + dx)) * 4;
          const r = imgData[idx];
          const g = imgData[idx + 1];
          const b = imgData[idx + 2];
          sumCb += 128 - 0.168736 * r - 0.331264 * g + 0.5 * b;
          sumCr += 128 + 0.5 * r - 0.418688 * g - 0.081312 * b;
        }
      }
      cbBits += quantizeChromaGray2(sumCb / 12);
      crBits += quantizeChromaGray2(sumCr / 12);
    }
  }

  let binaryString = lumBits + cbBits + crBits; // Đúng 64 bit

  // 3. Đóng gói 64 bit thành Hexadecimal 16 ký tự (bytes8)
  let hexString = "";
  for (let i = 0; i < 64; i += 4) {
    const nibble = binaryString.slice(i, i + 4);
    hexString += parseInt(nibble, 2).toString(16);
  }

  // Tránh trùng sentinel bytes8(0) dành cho file không phải ảnh
  if (hexString === "0000000000000000") {
    hexString = "0000000000000001";
    binaryString = binaryString.slice(0, 63) + "1";
  }

  if (typeof imageSource !== "string" && img.src.startsWith("blob:")) {
    URL.revokeObjectURL(img.src);
  }

  const finalHash = `0x${hexString}`;
  return {
    pHash: finalHash,
    dHash: finalHash, // Giữ alias tương thích ngược
    binaryString,
    matrix,
  };
}

// Giữ alias tương thích với các component đang gọi calculateDHash
export const calculateDHash = calculatePHash;

/**
 * Tính khoảng cách Hamming giữa hai chuỗi mã băm Hex 64-bit
 * @param {string} hashA
 * @param {string} hashB
 * @returns {number} Số bit khác nhau (0..64)
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
 * Tính phần trăm độ tương đồng thị giác từ khoảng cách Hamming
 * @param {number} distance Số bit khác biệt (0..64)
 * @returns {number} Tỷ lệ tương đồng (%) từ 0.0% đến 100.0%
 */
export function similarityFromDistance(distance) {
  const safeDist = Math.max(0, Math.min(64, Number(distance)));
  const similarity = ((64 - safeDist) / 64) * 100;
  return Math.round(similarity * 10) / 10;
}

/**
 * Tính phần trăm độ tương đồng thị giác giữa 2 chuỗi pHash
 */
export function calculateSimilarity(hashA, hashB) {
  return similarityFromDistance(calculateHammingDistance(hashA, hashB));
}

/**
 * Đánh giá mức độ rủi ro đạo nhái từ khoảng cách Hamming và tác phẩm khớp nhất
 * Đồng bộ tuyệt đối với Smart Contract: distance <= 9 (tương đồng >= 85.9%) bị chặn đăng ký.
 */
export function evaluatePlagiarismFromDistance(distance, matchedWork = null) {
  if (!matchedWork || distance === null || distance === undefined || distance > MEDIUM_SIMILAR_HAMMING_DISTANCE) {
    return {
      hasPlagiarismRisk: false,
      hasModerateSimilarity: false,
      highestSimilarity: matchedWork ? similarityFromDistance(distance) : 0,
      matchedWork: null,
      riskLevel: "NONE",
      hammingDistance: 64,
    };
  }

  const highestSimilarity = similarityFromDistance(distance);
  let riskLevel = "NONE";
  let hasPlagiarismRisk = false;
  let hasModerateSimilarity = false;

  if (distance <= 5) {
    riskLevel = "CRITICAL";
    hasPlagiarismRisk = true;
    hasModerateSimilarity = true;
  } else if (distance <= MAX_SIMILAR_HAMMING_DISTANCE) {
    riskLevel = "HIGH";
    hasPlagiarismRisk = true;
    hasModerateSimilarity = true;
  } else if (distance <= MEDIUM_SIMILAR_HAMMING_DISTANCE) {
    riskLevel = "MEDIUM";
    hasModerateSimilarity = true;
  }

  return {
    hasPlagiarismRisk,
    hasModerateSimilarity,
    highestSimilarity,
    matchedWork,
    riskLevel,
    hammingDistance: distance,
  };
}

/**
 * Quét đối chiếu mã pHash với danh sách tác phẩm (dự phòng phía client)
 */
export function checkVisualPlagiarism(targetPHash, registeredWorks = [], excludeFileHash = null) {
  if (!isNonZeroPHash(targetPHash) || !registeredWorks || registeredWorks.length === 0) {
    return evaluatePlagiarismFromDistance(64, null);
  }

  let bestMatch = null;
  let minDistance = 64;

  for (const work of registeredWorks) {
    if (excludeFileHash && work.fileHash?.toLowerCase() === excludeFileHash?.toLowerCase()) {
      continue;
    }

    if (!isNonZeroPHash(work.pHash)) continue;

    const distance = calculateHammingDistance(targetPHash, work.pHash);
    if (distance < minDistance) {
      minDistance = distance;
      bestMatch = work;
    }
  }

  return evaluatePlagiarismFromDistance(minDistance, bestMatch);
}

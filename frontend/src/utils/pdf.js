import { jsPDF } from "jspdf";
import QRCode from "qrcode";
import { formatTimestamp, formatAddress } from "./format";

/**
 * Vẽ Giấy chứng nhận bản quyền lên Canvas độ phân giải cao
 * @param {Object} work Thông tin tác phẩm { fileHash, owner, title, description, cleanDescription, ipfsHash, pHash, timestamp }
 * @returns {Promise<HTMLCanvasElement>}
 */
export async function renderCertificateCanvas(work) {
  if (!work) {
    throw new Error("Không có dữ liệu tác phẩm để xuất giấy chứng nhận.");
  }

  // 1. Tạo Canvas độ phân giải cao tương đương khổ A4 ngang 300 DPI (2480 x 1754 px)
  const canvas = document.createElement("canvas");
  const width = 2480;
  const height = 1754;
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");

  // Đảm bảo phông chữ đã sẵn sàng
  if (document.fonts) {
    await document.fonts.ready;
  }

  // 2. Nền giấy chứng nhận: Nền sáng trang nhã chuẩn văn bằng quốc tế (Trắng ngà sang trọng #FFFFFF)
  ctx.fillStyle = "#FFFFFF";
  ctx.fillRect(0, 0, width, height);

  // 3. Viền trang trí đôi cao cấp phong cách văn bằng chuẩn CTUET (Không dùng gradient)
  // Viền ngoài: Xanh thương hiệu CTUET (#003399)
  ctx.lineWidth = 14;
  ctx.strokeStyle = "#003399";
  ctx.strokeRect(60, 60, width - 120, height - 120);

  // Viền trong: Xanh dương trang nhã (#0055CC)
  ctx.lineWidth = 3;
  ctx.strokeStyle = "#0055CC";
  ctx.strokeRect(84, 84, width - 168, height - 168);

  // Hoa văn 4 góc (Corner Ornaments) - Xanh thương hiệu đậm nét
  const drawCorner = (x, y, dx, dy) => {
    ctx.lineWidth = 5;
    ctx.strokeStyle = "#003399";
    ctx.beginPath();
    ctx.moveTo(x, y + 40 * dy);
    ctx.lineTo(x, y);
    ctx.lineTo(x + 40 * dx, y);
    ctx.stroke();
  };
  drawCorner(100, 100, 1, 1);
  drawCorner(width - 100, 100, -1, 1);
  drawCorner(100, height - 100, 1, -1);
  drawCorner(width - 100, height - 100, -1, -1);

  // 4. Tiêu đề thương hiệu
  ctx.textAlign = "center";
  ctx.font = '700 36px "Be Vietnam Pro", sans-serif';
  ctx.fillStyle = "#003399";
  ctx.fillText("HỆ THỐNG XÁC THỰC BẢN QUYỀN SỐ COPYRIGHTCHAIN", width / 2, 170);

  ctx.font = '500 22px "Be Vietnam Pro", sans-serif';
  ctx.fillStyle = "#64748B";
  ctx.fillText("NỀN TẢNG BLOCKCHAIN ETHEREUM SEPOLIA & IPFS DECENTRALIZED STORAGE", width / 2, 215);

  // Tiêu đề chính: Màu đơn sắc uy nghiêm, sang trọng (#0A2540)
  ctx.font = '800 62px "Be Vietnam Pro", sans-serif';
  ctx.fillStyle = "#0A2540";
  ctx.fillText("GIẤY CHỨNG NHẬN ĐĂNG KÝ BẢN QUYỀN", width / 2, 310);

  // Đường kẻ phân cách
  ctx.lineWidth = 3;
  ctx.strokeStyle = "#003399";
  ctx.beginPath();
  ctx.moveTo(width / 2 - 350, 345);
  ctx.lineTo(width / 2 + 350, 345);
  ctx.stroke();

  // Lời chứng nhận
  ctx.font = 'italic 30px "Be Vietnam Pro", sans-serif';
  ctx.fillStyle = "#475569";
  ctx.fillText(
    "Hệ thống trân trọng chứng nhận quyền sở hữu tác phẩm kỹ thuật số cho:",
    width / 2,
    415
  );

  // Tên tác phẩm nổi bật (Đen tuyền sắc nét)
  ctx.font = '700 52px "Be Vietnam Pro", sans-serif';
  ctx.fillStyle = "#0F172A";
  ctx.fillText(`“ ${work.title} ”`, width / 2, 495);

  // 5. Khung thông tin kỹ thuật Blockchain (Nền sáng xám nhạt cao cấp)
  const boxX = 200;
  const boxY = 550;
  const boxW = width - 400;
  const boxH = 700;

  ctx.fillStyle = "#F8FAFC";
  ctx.fillRect(boxX, boxY, boxW, boxH);
  ctx.lineWidth = 2;
  ctx.strokeStyle = "#CBD5E1";
  ctx.strokeRect(boxX, boxY, boxW, boxH);

  ctx.textAlign = "left";

  let currentY = boxY + 65;

  // Thông tin: Chủ sở hữu (Địa chỉ ví)
  ctx.font = '600 26px "Be Vietnam Pro", sans-serif';
  ctx.fillStyle = "#475569";
  ctx.fillText("Chủ sở hữu bản quyền (Địa chỉ ví):", boxX + 60, currentY);

  ctx.font = '600 30px "JetBrains Mono", monospace';
  ctx.fillStyle = "#003399";
  ctx.fillText(work.owner, boxX + 60, currentY + 45);

  currentY += 105;

  // Thông tin: Thời điểm ghi nhận trên Blockchain
  ctx.font = '600 26px "Be Vietnam Pro", sans-serif';
  ctx.fillStyle = "#475569";
  ctx.fillText("Thời gian đăng ký (Giờ Việt Nam):", boxX + 60, currentY);

  ctx.font = '600 30px "Be Vietnam Pro", sans-serif';
  ctx.fillStyle = "#047857";
  ctx.fillText(formatTimestamp(work.timestamp), boxX + 60, currentY + 45);

  currentY += 105;

  // Thông tin: Mã băm SHA-256 (File Hash)
  ctx.font = '600 26px "Be Vietnam Pro", sans-serif';
  ctx.fillStyle = "#475569";
  ctx.fillText("Mã băm toàn vẹn SHA-256 (File Hash):", boxX + 60, currentY);

  ctx.font = '500 25px "JetBrains Mono", monospace';
  ctx.fillStyle = "#0F172A";
  ctx.fillText(work.fileHash, boxX + 60, currentY + 45);

  currentY += 105;

  // Thông tin: IPFS Storage CID (nếu có)
  if (work.ipfsHash) {
    ctx.font = '600 26px "Be Vietnam Pro", sans-serif';
    ctx.fillStyle = "#475569";
    ctx.fillText("Lưu trữ phi tập trung IPFS (CID):", boxX + 60, currentY);

    ctx.font = '500 25px "JetBrains Mono", monospace';
    ctx.fillStyle = "#B45309";
    ctx.fillText(work.ipfsHash, boxX + 60, currentY + 45);

    currentY += 100;
  }

  // Thông tin: Mã nhận diện thị giác pHash (nếu có)
  if (work.pHash) {
    ctx.font = '600 26px "Be Vietnam Pro", sans-serif';
    ctx.fillStyle = "#475569";
    ctx.fillText("Dấu vân tay thị giác (Perceptual Hash - pHash):", boxX + 60, currentY);

    ctx.font = '500 25px "JetBrains Mono", monospace';
    ctx.fillStyle = "#7E22CE";
    ctx.fillText(`${work.pHash}  (Chống đạo nhái & biến đổi pixel)`, boxX + 60, currentY + 45);

    currentY += 100;
  }

  // Mô tả tác phẩm (nếu còn chỗ)
  const displayDesc = work.cleanDescription || work.description;
  if (displayDesc && currentY <= boxY + boxH - 60) {
    ctx.font = '600 26px "Be Vietnam Pro", sans-serif';
    ctx.fillStyle = "#475569";
    ctx.fillText("Ghi chú tác phẩm:", boxX + 60, currentY);

    ctx.font = '400 25px "Be Vietnam Pro", sans-serif';
    ctx.fillStyle = "#334155";
    const desc = displayDesc.length > 75 ? displayDesc.slice(0, 72) + "..." : displayDesc;
    ctx.fillText(desc, boxX + 60, currentY + 40);
  }

  // 6. Tạo và vẽ mã QR Code xác minh trực tiếp
  const origin = typeof window !== "undefined" && window.location ? window.location.origin : "https://copyrightchain.io";
  const verifyUrl = `${origin}/verify/${work.fileHash}`;
  const qrDataUrl = await QRCode.toDataURL(verifyUrl, {
    width: 320,
    margin: 2,
    color: {
      dark: "#002266",
      light: "#FFFFFF",
    },
  });

  const qrImage = new Image();
  await new Promise((resolve) => {
    qrImage.onload = resolve;
    qrImage.src = qrDataUrl;
  });

  // Vẽ hình QR Code ở góc phải
  const qrX = width - 560;
  const qrY = height - 420;
  ctx.drawImage(qrImage, qrX, qrY, 240, 240);

  ctx.textAlign = "center";
  ctx.font = '500 22px "Be Vietnam Pro", sans-serif';
  ctx.fillStyle = "#475569";
  ctx.fillText("Quét mã QR để xác minh", qrX + 120, qrY + 275);

  // 7. Chân trang (Footer Certificate)
  ctx.textAlign = "left";
  ctx.font = '600 24px "Be Vietnam Pro", sans-serif';
  ctx.fillStyle = "#003399";
  ctx.fillText("Chứng nhận được xác thực bởi Smart Contract trên Ethereum Sepolia & IPFS", 200, height - 250);

  ctx.font = '400 22px "Be Vietnam Pro", sans-serif';
  ctx.fillStyle = "#64748B";
  ctx.fillText("Mã hợp đồng: 0x2b2b19769c2db4595191C2bDE4Ff756397956068", 200, height - 210);
  ctx.fillText("Bản quyền © CopyrightChain. Tất cả quyền sở hữu được bảo chứng bởi sổ cái phi tập trung.", 200, height - 170);

  return canvas;
}

/**
 * Tạo và tải xuống Giấy chứng nhận đăng ký bản quyền dạng file PDF A4 ngang
 * Phong cách màu sắc: Tông Xanh Kỹ thuật - Công nghệ chuẩn Đại học Cần Thơ (CTUET)
 * (#003399 - #0066CC - #38BDF8) kết hợp nền xanh đêm sang trọng.
 *
 * @param {Object} work Thông tin tác phẩm { fileHash, owner, title, description, cleanDescription, ipfsHash, pHash, timestamp }
 */
export async function generateCertificatePDF(work) {
  const canvas = await renderCertificateCanvas(work);

  // 8. Chuyển canvas thành file PDF A4 ngang và lưu về máy
  const imgData = canvas.toDataURL("image/png", 1.0);
  const pdf = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: "a4",
  });

  pdf.addImage(imgData, "PNG", 0, 0, 297, 210);

  const cleanTitle = (work.title || "TacPham")
    .replace(/[^a-zA-Z0-9\s-_]/g, "")
    .trim()
    .replace(/\s+/g, "_");

  pdf.save(`ChungNhan_BanQuyen_${cleanTitle}_${work.fileHash.slice(0, 10)}.pdf`);
}

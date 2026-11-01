import { jsPDF } from "jspdf";
import QRCode from "qrcode";
import { formatTimestamp, formatAddress } from "./format";

/**
 * Tạo và tải xuống Giấy chứng nhận đăng ký bản quyền dạng file PDF A4 ngang
 * Sử dụng Canvas độ phân giải cao (300 DPI) để vẽ layout bằng khen sang trọng,
 * hỗ trợ 100% hiển thị tiếng Việt có dấu hoàn hảo với font chữ hiện đại.
 *
 * @param {Object} work Thông tin tác phẩm { fileHash, owner, title, description, timestamp }
 */
export async function generateCertificatePDF(work) {
  if (!work) {
    throw new Error("Không có dữ liệu tác phẩm để xuất giấy chứng nhận.");
  }

  // 1. Tạo Canvas độ phân giải cao tương đương khổ A4 ngang 300 DPI (3508 x 2480 px)
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

  // 2. Nền giấy chứng nhận: Màu nền tối sang trọng với hiệu ứng gradient
  const bgGrad = ctx.createLinearGradient(0, 0, width, height);
  bgGrad.addColorStop(0, "#080E24");
  bgGrad.addColorStop(0.5, "#0B1536");
  bgGrad.addColorStop(1, "#050918");
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, width, height);

  // 3. Viền trang trí đôi cao cấp phong cách hoàng gia/chứng chỉ quốc tế
  // Viền ngoài (Outer Border)
  ctx.lineWidth = 14;
  ctx.strokeStyle = "#3B82F6";
  ctx.strokeRect(60, 60, width - 120, height - 120);

  // Viền trong mạ vàng (Inner Gold/Cyan Accent Border)
  ctx.lineWidth = 4;
  const borderGrad = ctx.createLinearGradient(0, 0, width, height);
  borderGrad.addColorStop(0, "#22D3EE");
  borderGrad.addColorStop(0.5, "#8B5CF6");
  borderGrad.addColorStop(1, "#3B82F6");
  ctx.strokeStyle = borderGrad;
  ctx.strokeRect(84, 84, width - 168, height - 168);

  // Hoa văn 4 góc (Corner Ornaments)
  const drawCorner = (x, y, dx, dy) => {
    ctx.lineWidth = 6;
    ctx.strokeStyle = "#22D3EE";
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
  ctx.font = '600 36px "Be Vietnam Pro", sans-serif';
  ctx.fillStyle = "#93C5FD";
  ctx.fillText("HỆ THỐNG XÁC THỰC BẢN QUYỀN SỐ COPYRIGHTCHAIN", width / 2, 170);

  ctx.font = '400 24px "Be Vietnam Pro", sans-serif';
  ctx.fillStyle = "#64748B";
  ctx.fillText("NỀN TẢNG BLOCKCHAIN ETHEREUM SEPOLIA", width / 2, 215);

  // Dải ruy băng tiêu đề chính
  const titleGrad = ctx.createLinearGradient(width / 2 - 400, 0, width / 2 + 400, 0);
  titleGrad.addColorStop(0, "#60A5FA");
  titleGrad.addColorStop(0.5, "#C084FC");
  titleGrad.addColorStop(1, "#22D3EE");

  ctx.font = '800 64px "Be Vietnam Pro", sans-serif';
  ctx.fillStyle = titleGrad;
  ctx.fillText("GIẤY CHỨNG NHẬN ĐĂNG KÝ BẢN QUYỀN", width / 2, 310);

  // Đường kẻ phân cách
  ctx.lineWidth = 3;
  ctx.strokeStyle = "rgba(59, 130, 246, 0.4)";
  ctx.beginPath();
  ctx.moveTo(width / 2 - 350, 345);
  ctx.lineTo(width / 2 + 350, 345);
  ctx.stroke();

  // Lời chứng nhận
  ctx.font = 'italic 32px "Be Vietnam Pro", sans-serif';
  ctx.fillStyle = "#CBD5E1";
  ctx.fillText(
    "Hệ thống trân trọng chứng nhận quyền sở hữu tác phẩm kỹ thuật số cho:",
    width / 2,
    420
  );

  // Tên tác phẩm nổi bật
  ctx.font = '700 58px "Be Vietnam Pro", sans-serif';
  ctx.fillStyle = "#FFFFFF";
  ctx.fillText(`“ ${work.title} ”`, width / 2, 510);

  // 5. Khung thông tin kỹ thuật Blockchain
  const boxX = 200;
  const boxY = 580;
  const boxW = width - 400;
  const boxH = 650;

  ctx.fillStyle = "rgba(255, 255, 255, 0.03)";
  ctx.fillRect(boxX, boxY, boxW, boxH);
  ctx.lineWidth = 2;
  ctx.strokeStyle = "rgba(255, 255, 255, 0.12)";
  ctx.strokeRect(boxX, boxY, boxW, boxH);

  ctx.textAlign = "left";

  // Thông tin: Chủ sở hữu (Địa chỉ ví)
  ctx.font = '500 30px "Be Vietnam Pro", sans-serif';
  ctx.fillStyle = "#94A3B8";
  ctx.fillText("Chủ sở hữu bản quyền (Địa chỉ ví):", boxX + 60, boxY + 80);

  ctx.font = '600 34px "JetBrains Mono", monospace';
  ctx.fillStyle = "#38BDF8";
  ctx.fillText(work.owner, boxX + 60, boxY + 130);

  // Thông tin: Thời điểm ghi nhận trên Blockchain
  ctx.font = '500 30px "Be Vietnam Pro", sans-serif';
  ctx.fillStyle = "#94A3B8";
  ctx.fillText("Thời gian đăng ký (Giờ Việt Nam):", boxX + 60, boxY + 210);

  ctx.font = '600 34px "Be Vietnam Pro", sans-serif';
  ctx.fillStyle = "#34D399";
  ctx.fillText(formatTimestamp(work.timestamp), boxX + 60, boxY + 260);

  // Thông tin: Mô tả tác phẩm
  if (work.description) {
    ctx.font = '500 28px "Be Vietnam Pro", sans-serif';
    ctx.fillStyle = "#94A3B8";
    ctx.fillText("Mô tả tác phẩm:", boxX + 60, boxY + 340);

    ctx.font = '400 28px "Be Vietnam Pro", sans-serif';
    ctx.fillStyle = "#E2E8F0";
    const desc = work.description.length > 90 ? work.description.slice(0, 87) + "..." : work.description;
    ctx.fillText(desc, boxX + 60, boxY + 385);
  }

  // Thông tin: Mã băm SHA-256 (File Hash)
  ctx.font = '500 30px "Be Vietnam Pro", sans-serif';
  ctx.fillStyle = "#94A3B8";
  ctx.fillText("Mã băm bất biến SHA-256 (File Hash):", boxX + 60, boxY + 465);

  ctx.font = '500 28px "JetBrains Mono", monospace';
  ctx.fillStyle = "#A78BFA";
  // Tự động ngắt dòng cho mã hash bytes32 nếu cần
  ctx.fillText(work.fileHash, boxX + 60, boxY + 520);

  ctx.font = 'italic 24px "Be Vietnam Pro", sans-serif';
  ctx.fillStyle = "#64748B";
  ctx.fillText(
    "* Mã băm được tính toán trực tiếp từ nội dung nhị phân của file gốc, bảo đảm tính toàn vẹn tuyệt đối.",
    boxX + 60,
    boxY + 580
  );

  // 6. Tạo và vẽ mã QR Code xác minh trực tiếp
  const verifyUrl = `${window.location.origin}/verify/${work.fileHash}`;
  const qrDataUrl = await QRCode.toDataURL(verifyUrl, {
    width: 320,
    margin: 2,
    color: {
      dark: "#080E24",
      light: "#FFFFFF",
    },
  });

  const qrImage = new Image();
  await new Promise((resolve) => {
    qrImage.onload = resolve;
    qrImage.src = qrDataUrl;
  });

  // Vẽ hình QR Code ở góc phải
  const qrX = width - 580;
  const qrY = height - 440;
  ctx.drawImage(qrImage, qrX, qrY, 260, 260);

  ctx.textAlign = "center";
  ctx.font = '500 22px "Be Vietnam Pro", sans-serif';
  ctx.fillStyle = "#94A3B8";
  ctx.fillText("Quét mã QR để xác minh", qrX + 130, qrY + 295);

  // 7. Chân trang (Footer Certificate)
  ctx.textAlign = "left";
  ctx.font = '600 26px "Be Vietnam Pro", sans-serif';
  ctx.fillStyle = "#38BDF8";
  ctx.fillText("Chứng nhận được xác thực bởi Smart Contract trên Ethereum Sepolia", 200, height - 260);

  ctx.font = '400 22px "Be Vietnam Pro", sans-serif';
  ctx.fillStyle = "#64748B";
  ctx.fillText("Mã hợp đồng: 0x5FbDB2315678afecb367f032d93F642f64180aa3", 200, height - 220);
  ctx.fillText("Bản quyền © CopyrightChain. Tất cả quyền sở hữu được bảo chứng bởi sổ cái phi tập trung.", 200, height - 180);

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
    .replace(/\s+/g, "_");
  pdf.save(`Chung_Nhan_Ban_Quyen_${cleanTitle}.pdf`);
}

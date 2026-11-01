import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
import {
  UploadCloud,
  FileCheck2,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  Copy,
  ExternalLink,
  Download,
  Wallet,
  ShieldCheck,
  FileText,
  RotateCcw,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import toast from "react-hot-toast";
import { useWallet } from "../context/WalletContext";
import { calculateFileHash } from "../utils/hash";
import { checkIsRegistered, fetchWork, getSignerContract, CONTRACT_ADDRESS } from "../utils/contract";
import { formatAddress, formatFileSize, copyToClipboard, getEtherscanTxUrl } from "../utils/format";
import { generateCertificatePDF } from "../utils/pdf";

export default function Register() {
  const { account, signer, isCorrectNetwork, connectWallet, switchToSepolia } = useWallet();

  // Trạng thái file & form
  const [file, setFile] = useState(null);
  const [fileHash, setFileHash] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [isHashing, setIsHashing] = useState(false);
  const [hashProgress, setHashProgress] = useState(0);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  // Kiểm tra trùng lặp bản quyền
  const [isCheckingDuplicate, setIsCheckingDuplicate] = useState(false);
  const [duplicateWork, setDuplicateWork] = useState(null);

  // Tiến trình gửi transaction (0: Idle, 1: Chờ ký ví, 2: Đang xác nhận block, 3: Hoàn tất)
  const [txStep, setTxStep] = useState(0);
  const [txHash, setTxHash] = useState("");
  const [registeredData, setRegisteredData] = useState(null);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  // Xử lý kéo thả và tính toán hash
  const processFile = async (selectedFile) => {
    if (!selectedFile) return;

    if (selectedFile.size === 0) {
      toast.error("File tải lên có dung lượng rỗng (0 byte).");
      return;
    }

    if (selectedFile.size > 100 * 1024 * 1024) {
      toast("File dung lượng lớn (>100MB), quá trình tính toán có thể mất vài giây...", {
        icon: "⚠️",
      });
    }

    setFile(selectedFile);
    setIsHashing(true);
    setHashProgress(10);
    setDuplicateWork(null);

    // Tự động gợi ý tên tác phẩm từ tên file (bỏ đuôi mở rộng)
    if (!title) {
      const suggestedName = selectedFile.name.replace(/\.[^/.]+$/, "");
      setTitle(suggestedName.slice(0, 100));
    }

    try {
      const { hash } = await calculateFileHash(selectedFile, (p) => setHashProgress(p));
      setFileHash(hash);

      // Kiểm tra ngay trên Blockchain xem hash này đã tồn tại chưa
      setIsCheckingDuplicate(true);
      const isReg = await checkIsRegistered(hash);
      if (isReg) {
        const existing = await fetchWork(hash);
        setDuplicateWork(existing);
        toast.error("Tác phẩm này đã được đăng ký trên Blockchain từ trước!", { duration: 5000 });
      } else {
        toast.success("Đã tính mã băm SHA-256 thành công. Tác phẩm chưa từng đăng ký!");
      }
    } catch (err) {
      console.error("Lỗi khi băm file:", err);
      toast.error("Không thể tính mã băm: " + err.message);
    } finally {
      setIsHashing(false);
      setIsCheckingDuplicate(false);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  // Gửi giao dịch ghi nhận bản quyền lên Smart Contract
  const handleSubmitRegister = async (e) => {
    e.preventDefault();

    if (!account || !signer) {
      toast.error("Vui lòng kết nối ví MetaMask trước!");
      return;
    }

    if (!isCorrectNetwork) {
      toast.error("Vui lòng chuyển sang mạng Sepolia!");
      await switchToSepolia();
      return;
    }

    if (!fileHash) {
      toast.error("Vui lòng chọn file để tính mã băm!");
      return;
    }

    if (duplicateWork) {
      toast.error("Tác phẩm này đã có bản quyền, không thể đăng ký lại!");
      return;
    }

    const cleanTitle = title.trim();
    if (!cleanTitle) {
      toast.error("Vui lòng nhập tên tác phẩm!");
      return;
    }

    if (new TextEncoder().encode(cleanTitle).length > 100) {
      toast.error("Tên tác phẩm không được vượt quá 100 byte!");
      return;
    }

    const cleanDesc = description.trim();
    if (new TextEncoder().encode(cleanDesc).length > 500) {
      toast.error("Mô tả không được vượt quá 500 byte!");
      return;
    }

    try {
      const contract = getSignerContract(signer);

      // Bước 1: Chờ ký ví
      setTxStep(1);
      toast.loading("Vui lòng xác nhận giao dịch trên ví MetaMask...", { id: "register-tx" });

      const tx = await contract.registerWork(fileHash, cleanTitle, cleanDesc);
      setTxHash(tx.hash);

      // Bước 2: Đang xác nhận trên block
      setTxStep(2);
      toast.loading("Giao dịch đang được thợ đào xác nhận trên Sepolia...", { id: "register-tx" });

      const receipt = await tx.wait(1);

      // Bước 3: Hoàn tất
      setTxStep(3);
      toast.success("🎉 Đăng ký bản quyền thành công!", { id: "register-tx" });

      // Kích hoạt hiệu ứng pháo hoa chúc mừng
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      });

      // Lưu lại dữ liệu vừa đăng ký để phục vụ xuất PDF
      setRegisteredData({
        fileHash: fileHash,
        owner: account,
        title: cleanTitle,
        description: cleanDesc,
        timestamp: Math.floor(Date.now() / 1000),
      });
    } catch (err) {
      console.error("Lỗi đăng ký:", err);
      setTxStep(0);
      let errorMsg = "Đăng ký bản quyền thất bại.";
      if (err.code === 4001 || err.action === "sendTransaction") {
        errorMsg = "Bạn đã từ chối ký giao dịch trên MetaMask.";
      } else if (err.reason) {
        errorMsg = err.reason;
      }
      toast.error(errorMsg, { id: "register-tx" });
    }
  };

  const handleDownloadCertificate = async () => {
    if (!registeredData) return;
    setIsGeneratingPDF(true);
    try {
      toast.loading("Đang khởi tạo Giấy chứng nhận PDF...", { id: "pdf-reg" });
      await generateCertificatePDF(registeredData);
      toast.success("Đã tải Giấy chứng nhận về máy!", { id: "pdf-reg" });
    } catch (err) {
      console.error("Lỗi tạo PDF:", err);
      toast.error("Không thể xuất file PDF: " + err.message, { id: "pdf-reg" });
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const handleResetForm = () => {
    setFile(null);
    setFileHash("");
    setTitle("");
    setDescription("");
    setDuplicateWork(null);
    setTxStep(0);
    setTxHash("");
    setRegisteredData(null);
  };

  // NẾU CHƯA KẾT NỐI VÍ: HIỂN THỊ THẺ MỜI KẾT NỐI
  if (!account) {
    return (
      <div className="max-w-xl mx-auto py-12">
        <div className="glass-card bg-[#051126]/90 border-white/10 rounded-3xl p-8 sm:p-10 text-center space-y-6 shadow-glass">
          <div className="w-16 h-16 rounded-3xl bg-[#003399]/20 border border-[#003399]/40 text-[#38BDF8] mx-auto flex items-center justify-center shadow-glow-blue">
            <Wallet className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-white">Yêu cầu kết nối Ví MetaMask</h2>
            <p className="text-sm text-slate-300 leading-relaxed max-w-md mx-auto">
              Để ghi nhận bản quyền chính chủ lên Smart Contract, bạn cần kết nối ví Web3 để xác thực quyền tác giả và thanh toán phí gas mạng Sepolia.
            </p>
          </div>

          <button
            onClick={connectWallet}
            className="px-6 py-3.5 rounded-xl bg-gradient-to-r from-[#003399] via-[#0066CC] to-[#38BDF8] hover:opacity-90 text-white font-semibold shadow-glow-blue flex items-center justify-center gap-2.5 mx-auto transition active:scale-95"
          >
            <Wallet className="w-4 h-4" />
            <span>Kết nối MetaMask ngay</span>
          </button>
        </div>
      </div>
    );
  }

  // MÀN HÌNH CHÚC MỪNG KHI ĐĂNG KÝ THÀNH CÔNG (STEP 3)
  if (txStep === 3 && registeredData) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-2xl mx-auto space-y-6"
      >
        <div className="glass-card bg-emerald-950/40 border-emerald-500/30 rounded-3xl p-8 sm:p-10 text-center space-y-6 shadow-2xl relative overflow-hidden">
          <div className="w-20 h-20 rounded-full bg-emerald-500/20 border-2 border-emerald-500 text-emerald-400 mx-auto flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <div className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">Giao dịch thành công</span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
              Chúc mừng! Bản quyền đã được xác lập
            </h2>
            <p className="text-sm text-slate-300 max-w-md mx-auto">
              Tác phẩm <strong className="text-white">"{registeredData.title}"</strong> đã chính thức thuộc quyền sở hữu của bạn trên mạng Ethereum Sepolia.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-black/40 border border-white/10 text-left space-y-2 text-xs">
            <div className="flex justify-between items-center text-slate-400">
              <span>Mã giao dịch (Tx Hash):</span>
              <a
                href={getEtherscanTxUrl(txHash)}
                target="_blank"
                rel="noreferrer"
                className="font-mono text-[#38BDF8] hover:underline flex items-center gap-1"
              >
                {formatAddress(txHash, 8, 6)}
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            <div className="flex justify-between items-center text-slate-400">
              <span>Mã SHA-256:</span>
              <span className="font-mono text-[#60A5FA]">{formatAddress(registeredData.fileHash, 10, 8)}</span>
            </div>
            <div className="flex justify-between items-center text-slate-400">
              <span>Chủ sở hữu:</span>
              <span className="font-mono text-slate-200">{formatAddress(registeredData.owner, 8, 6)}</span>
            </div>
          </div>

          {/* Các nút hành động sau khi thành công */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
            <button
              onClick={handleDownloadCertificate}
              disabled={isGeneratingPDF}
              className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:opacity-90 text-white font-bold text-sm shadow-lg flex items-center justify-center gap-2 transition active:scale-95 disabled:opacity-50"
            >
              {isGeneratingPDF ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              <span>Tải Giấy chứng nhận PDF</span>
            </button>

            <button
              onClick={handleResetForm}
              className="w-full sm:w-auto px-6 py-3.5 rounded-xl glass-card hover:bg-white/10 text-slate-200 hover:text-white font-semibold text-sm flex items-center justify-center gap-2 transition"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Đăng ký tác phẩm khác</span>
            </button>
          </div>

          <div className="pt-2">
            <Link
              to="/my-works"
              className="text-xs text-[#38BDF8] hover:underline inline-flex items-center gap-1"
            >
              Xem danh sách tác phẩm của tôi <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      {/* Tiêu đề trang */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#0066CC]/15 border border-[#0066CC]/35 text-[#38BDF8] text-xs font-semibold">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Ghi nhận quyền tác giả On-Chain</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white">
          Đăng Ký Bản Quyền Tác Phẩm
        </h1>
        <p className="text-sm sm:text-base text-slate-400 max-w-lg mx-auto">
          Tải file lên để băm SHA-256 trực tiếp trên máy bạn và lưu trữ thông tin sở hữu vĩnh viễn trên Ethereum Sepolia.
        </p>
      </div>

      <form onSubmit={handleSubmitRegister} className="glass-card bg-[#051126]/90 rounded-3xl p-6 sm:p-8 border-white/10 space-y-6 shadow-glass">
        {/* 1. KHU VỰC KÉO THẢ FILE */}
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-slate-200">
            File tác phẩm số <span className="text-rose-400">*</span>
          </label>

          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`relative border-2 border-dashed rounded-2xl p-7 text-center transition-all cursor-pointer ${
              isDragging
                ? "border-[#38BDF8] bg-[#38BDF8]/10 scale-[1.01]"
                : "border-white/15 hover:border-[#0066CC]/50 hover:bg-white/[0.02]"
            }`}
            onClick={() => document.getElementById("register-file-input")?.click()}
          >
            <input
              id="register-file-input"
              type="file"
              className="hidden"
              onChange={(e) => {
                if (e.target.files?.[0]) processFile(e.target.files[0]);
              }}
            />

            <div className="flex flex-col items-center justify-center space-y-2.5">
              <div className="w-12 h-12 rounded-2xl bg-[#003399]/20 border border-[#003399]/40 text-[#38BDF8] flex items-center justify-center shadow-glow-blue">
                {isHashing ? (
                  <Loader2 className="w-6 h-6 animate-spin text-[#38BDF8]" />
                ) : (
                  <UploadCloud className="w-6 h-6" />
                )}
              </div>

              <div>
                <p className="text-sm font-semibold text-white">
                  {isHashing
                    ? "Đang tính mã băm SHA-256..."
                    : file
                    ? "Bấm để đổi file khác"
                    : "Kéo thả file tác phẩm vào đây hoặc bấm để chọn"}
                </p>
                <p className="text-xs text-slate-400 mt-0.5">
                  File của bạn chỉ được đọc nhị phân trong RAM trình duyệt, tuyệt đối không bị tải lên mạng
                </p>
              </div>

              {file && (
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-white/5 border border-white/10 text-xs text-slate-300 font-mono">
                  <FileText className="w-3.5 h-3.5 text-[#38BDF8]" />
                  <span>{file.name}</span>
                  <span className="text-slate-500">({formatFileSize(file.size)})</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Khung hiển thị Hash SHA-256 sau khi băm */}
        {fileHash && (
          <div className="p-4 rounded-2xl bg-black/40 border border-white/10 space-y-1.5 animate-in fade-in">
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-400 font-medium">Mã băm SHA-256 (32 bytes):</span>
              <button
                type="button"
                onClick={() => {
                  copyToClipboard(fileHash);
                  toast.success("Đã sao chép mã băm!");
                }}
                className="text-[#38BDF8] hover:underline flex items-center gap-1"
              >
                <Copy className="w-3 h-3" /> Sao chép
              </button>
            </div>
            <p className="font-mono text-xs text-[#38BDF8] break-all leading-relaxed">
              {fileHash}
            </p>
          </div>
        )}

        {/* CẢNH BÁO NẾU HASH ĐÃ TỒN TẠI TRÊN BLOCKCHAIN */}
        {duplicateWork && (
          <div className="p-4 rounded-2xl bg-amber-950/40 border border-amber-500/40 text-amber-300 text-xs space-y-2 animate-in fade-in">
            <div className="flex items-center gap-2 font-bold text-sm text-amber-200">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              CẢNH BÁO: TÁC PHẨM ĐÃ ĐƯỢC ĐĂNG KÝ BẢN QUYỀN!
            </div>
            <p>
              File này đã được đăng ký trước đó với tên: <strong className="text-white">"{duplicateWork.title}"</strong>.
            </p>
            <p className="font-mono text-[11px] text-amber-400">
              Chủ sở hữu hiện tại: {duplicateWork.owner}
            </p>
            <p className="text-slate-400">
              * Smart Contract sẽ từ chối giao dịch đăng ký trùng lặp để bảo vệ quyền tác giả ban đầu.
            </p>
          </div>
        )}

        {/* 2. THÔNG TIN TÁC PHẨM */}
        <div className="space-y-4">
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="text-sm font-semibold text-slate-200">
                Tên tác phẩm <span className="text-rose-400">*</span>
              </label>
              <span className={`text-xs ${title.length > 90 ? "text-amber-400" : "text-slate-500"}`}>
                {title.length}/100 ký tự
              </span>
            </div>
            <input
              type="text"
              maxLength={100}
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ví dụ: Bức tranh kỹ thuật số Hoàng Hôn Cyberpunk"
              className="w-full glass-input px-4 py-3 rounded-xl text-white text-sm placeholder:text-slate-500"
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="text-sm font-semibold text-slate-200">
                Mô tả chi tiết tác phẩm <span className="text-slate-500 text-xs">(Tùy chọn)</span>
              </label>
              <span className={`text-xs ${description.length > 450 ? "text-amber-400" : "text-slate-500"}`}>
                {description.length}/500 ký tự
              </span>
            </div>
            <textarea
              rows={3}
              maxLength={500}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Thông tin thêm về công cụ sáng tác, bối cảnh, phiên bản hoặc thông điệp của tác phẩm..."
              className="w-full glass-input px-4 py-3 rounded-xl text-white text-sm placeholder:text-slate-500 resize-none"
            />
          </div>
        </div>

        {/* 3. STEPPER TIẾN TRÌNH GIAO DỊCH NẾU ĐANG GỬI */}
        {txStep > 0 && txStep < 3 && (
          <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 space-y-3">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider text-center">
              Tiến trình đăng ký Blockchain
            </p>
            <div className="grid grid-cols-3 gap-2 text-center text-xs font-medium">
              <div className={`p-2 rounded-xl flex items-center justify-center gap-1.5 ${txStep === 1 ? "bg-[#003399]/30 text-[#38BDF8] border border-[#0066CC]/40" : "text-slate-500"}`}>
                {txStep === 1 ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <span className="w-3.5 h-3.5 rounded-full border border-current inline-flex items-center justify-center text-[9px]">1</span>}
                <span>Chờ ký ví</span>
              </div>
              <div className={`p-2 rounded-xl flex items-center justify-center gap-1.5 ${txStep === 2 ? "bg-[#0066CC]/30 text-[#93C5FD] border border-[#0066CC]/40" : "text-slate-500"}`}>
                {txStep === 2 ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <span className="w-3.5 h-3.5 rounded-full border border-current inline-flex items-center justify-center text-[9px]">2</span>}
                <span>Đang xác nhận</span>
              </div>
              <div className="p-2 rounded-xl flex items-center justify-center gap-1.5 text-slate-500">
                <span className="w-3.5 h-3.5 rounded-full border border-current inline-flex items-center justify-center text-[9px]">3</span>
                <span>Hoàn tất</span>
              </div>
            </div>
          </div>
        )}

        {/* NÚT SUBMIT */}
        <button
          type="submit"
          disabled={!fileHash || !!duplicateWork || isHashing || txStep > 0}
          className="w-full py-4 rounded-2xl bg-gradient-to-r from-[#003399] via-[#0066CC] to-[#38BDF8] hover:opacity-95 text-white font-bold text-base shadow-glow-blue flex items-center justify-center gap-2.5 transition active:scale-[0.99] disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {txStep > 0 ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Đang xử lý giao dịch Blockchain...</span>
            </>
          ) : (
            <>
              <ShieldCheck className="w-5 h-5" />
              <span>Đăng ký bản quyền ngay</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
}

import React, { useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
import {
  UploadCloud,
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
  ArrowRight,
  Database,
  Fingerprint,
  Image as ImageIcon,
  ShieldAlert,
  Sparkles,
  Info,
} from "lucide-react";
import toast from "react-hot-toast";
import { useWallet } from "../context/WalletContext";
import { calculateFileHash } from "../utils/hash";
import {
  checkIsRegistered,
  fetchWork,
  getSignerContract,
  fetchAllKnownWorks,
} from "../utils/contract";
import {
  formatAddress,
  formatFileSize,
  copyToClipboard,
  getEtherscanTxUrl,
} from "../utils/format";
import { generateCertificatePDF } from "../utils/pdf";
import IPFSPreviewModal from "../components/IPFSPreviewModal";
import { uploadToIPFS, getIPFSGatewayUrl } from "../utils/ipfs";
import {
  isImageFile,
  calculateDHash,
  checkVisualPlagiarism,
} from "../utils/phash";
import { encodeDescriptionWithMetadata } from "../utils/metadata";

export default function Register() {
  const { account, signer, connectWallet } = useWallet();

  // Trạng thái file & form
  const [file, setFile] = useState(null);
  const [fileHash, setFileHash] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [isHashing, setIsHashing] = useState(false);
  const [hashProgress, setHashProgress] = useState(0);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  // NÂNG CẤP 1: IPFS Lưu trữ phi tập trung
  const [enableIPFS, setEnableIPFS] = useState(true);
  const [isUploadingIPFS, setIsUploadingIPFS] = useState(false);
  const [ipfsCid, setIpfsCid] = useState("");
  const [ipfsUrl, setIpfsUrl] = useState("");
  const [isPinnedToNetwork, setIsPinnedToNetwork] = useState(false);
  const [filePreviewUrl, setFilePreviewUrl] = useState(null);

  // NÂNG CẤP 4: Perceptual Hash (pHash) & Chống đạo nhái thị giác
  const [isAnalyzingPHash, setIsAnalyzingPHash] = useState(false);
  const [pHashData, setPHashData] = useState(null);
  const [plagiarismWarning, setPlagiarismWarning] = useState(null);

  // Kiểm tra trùng lặp bản quyền SHA-256
  const [isCheckingDuplicate, setIsCheckingDuplicate] = useState(false);
  const [duplicateWork, setDuplicateWork] = useState(null);

  // Tiến trình gửi transaction (0: Idle, 1: Chờ ký ví, 2: Đang xác nhận block, 3: Hoàn tất)
  const [txStep, setTxStep] = useState(0);
  const [txHash, setTxHash] = useState("");
  const [registeredData, setRegisteredData] = useState(null);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [showIpfsModal, setShowIpfsModal] = useState(false);

  // Xử lý kéo thả và tính toán hash + IPFS + pHash
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
    setPlagiarismWarning(null);
    setPHashData(null);
    setIpfsCid("");
    setIpfsUrl("");

    // Tạo preview nếu là file ảnh
    if (isImageFile(selectedFile)) {
      const preview = URL.createObjectURL(selectedFile);
      setFilePreviewUrl(preview);
    } else {
      setFilePreviewUrl(null);
    }

    // Tự động gợi ý tên tác phẩm từ tên file (bỏ đuôi mở rộng)
    if (!title) {
      const suggestedName = selectedFile.name.replace(/\.[^/.]+$/, "");
      setTitle(suggestedName.slice(0, 100));
    }

    try {
      // 1. Tính toán mã băm mật mã học SHA-256 (Toàn vẹn tuyệt đối)
      const { hash } = await calculateFileHash(selectedFile, (p) => setHashProgress(p));
      setFileHash(hash);

      // 2. Kiểm tra trùng lặp mã hash SHA-256 trên Blockchain
      setIsCheckingDuplicate(true);
      const isReg = await checkIsRegistered(hash);
      if (isReg) {
        const existing = await fetchWork(hash);
        setDuplicateWork(existing);
        toast.error("Tác phẩm này đã được đăng ký trên Blockchain từ trước!", { duration: 5000 });
      } else {
        toast.success("Đã tính mã băm SHA-256 thành công.");
      }

      // 3. NÂNG CẤP 4: Phân tích Perceptual Hash (dHash 64-bit) nếu là file hình ảnh
      if (isImageFile(selectedFile)) {
        setIsAnalyzingPHash(true);
        try {
          const phashResult = await calculateDHash(selectedFile);
          setPHashData(phashResult);

          // Quét đối chiếu với các tác phẩm đã biết trên hệ thống
          const knownWorks = await fetchAllKnownWorks();
          const plagResult = checkVisualPlagiarism(phashResult.dHash, knownWorks, hash);

          if (plagResult.hasPlagiarismRisk) {
            setPlagiarismWarning(plagResult);
            toast(
              `CẢNH BÁO ĐẠO NHÁI: Tương đồng ${plagResult.highestSimilarity}% với tác phẩm đã đăng ký!`,
              {
                icon: "⚠️",
                duration: 6000,
                style: { background: "#FEF3C7", color: "#92400E", border: "1px solid #F59E0B" },
              }
            );
          }
        } catch (phashErr) {
          console.warn("Lỗi khi phân tích pHash ảnh:", phashErr);
        } finally {
          setIsAnalyzingPHash(false);
        }
      }
    } catch (err) {
      console.error("Lỗi khi xử lý file:", err);
      toast.error("Không thể xử lý file: " + err.message);
    } finally {
      setIsHashing(false);
      setIsCheckingDuplicate(false);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  // Submit đăng ký tác phẩm lên Smart Contract
  const handleSubmitRegister = async (e) => {
    e.preventDefault();

    if (!account || !signer) {
      toast.error("Vui lòng kết nối ví MetaMask trước!");
      return;
    }

    if (!fileHash) {
      toast.error("Vui lòng chọn file tác phẩm để tính toán mã SHA-256!");
      return;
    }

    if (!title.trim()) {
      toast.error("Vui lòng nhập tên tác phẩm.");
      return;
    }

    if (duplicateWork) {
      toast.error("Tác phẩm này đã có trên hệ thống, không thể đăng ký lại!");
      return;
    }

    let finalIpfsCid = ipfsCid;
    let finalIpfsUrl = ipfsUrl;

    // NÂNG CẤP 1: Tải lên IPFS nếu được bật và chưa upload
    if (enableIPFS && !finalIpfsCid && file) {
      setIsUploadingIPFS(true);
      const ipfsToastId = toast.loading("Đang tải file lên mạng IPFS phi tập trung...");
      try {
        const ipfsResult = await uploadToIPFS(file);
        finalIpfsCid = ipfsResult.ipfsHash;
        finalIpfsUrl = ipfsResult.ipfsUrl;
        setIpfsCid(finalIpfsCid);
        setIpfsUrl(finalIpfsUrl);
        setIsPinnedToNetwork(ipfsResult.isPinnedToNetwork);
        toast.success("Đã tải lên mạng IPFS thành công!", { id: ipfsToastId });
      } catch (ipfsErr) {
        console.warn("Lỗi tải lên IPFS:", ipfsErr);
        toast.error("Lỗi IPFS, tiếp tục đăng ký On-Chain...", { id: ipfsToastId });
      } finally {
        setIsUploadingIPFS(false);
      }
    }

    setTxStep(1); // Bước 1: Chờ ký MetaMask
    toast.loading("Vui lòng xác nhận giao dịch trên MetaMask...", { id: "register-tx" });

    try {
      const contract = getSignerContract(signer);

      // Đóng gói mô tả kèm Metadata (IPFS Hash + pHash) vào description (chuẩn hóa <= 500 byte)
      const packedDescription = encodeDescriptionWithMetadata(description.trim(), {
        ipfsHash: finalIpfsCid,
        pHash: pHashData?.dHash || "",
      });

      // Gửi giao dịch lên Ethereum Sepolia
      const tx = await contract.registerWork(fileHash, title.trim(), packedDescription);

      setTxStep(2); // Bước 2: Đang xác nhận khối
      setTxHash(tx.hash);
      toast.loading("Đang chờ mạng Sepolia xác nhận khối...", { id: "register-tx" });

      await tx.wait(1);

      // Lấy dữ liệu vừa đăng ký
      const newlyRegistered = await fetchWork(fileHash);
      setRegisteredData(
        newlyRegistered || {
          fileHash,
          title: title.trim(),
          description: description.trim(),
          cleanDescription: description.trim(),
          ipfsHash: finalIpfsCid,
          pHash: pHashData?.dHash || "",
          owner: account,
          timestamp: Math.floor(Date.now() / 1000),
        }
      );

      setTxStep(3); // Bước 3: Hoàn tất
      toast.success("Đăng ký bản quyền tác phẩm thành công!", { id: "register-tx" });

      // Hiệu ứng pháo hoa chúc mừng
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.6 },
      });
    } catch (err) {
      console.error("Lỗi đăng ký:", err);
      setTxStep(0);

      let errorMsg = "Giao dịch đăng ký thất bại.";
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
    setPlagiarismWarning(null);
    setPHashData(null);
    setIpfsCid("");
    setIpfsUrl("");
    setFilePreviewUrl(null);
    setTxStep(0);
    setTxHash("");
    setRegisteredData(null);
  };

  // NẾU CHƯA KẾT NỐI VÍ
  if (!account) {
    return (
      <div className="max-w-xl mx-auto py-12">
        <div className="glass-card rounded-3xl p-8 sm:p-10 text-center space-y-6">
          <div className="w-16 h-16 rounded-3xl bg-blue-50 dark:bg-[#003399]/20 border border-blue-200 dark:border-[#003399]/40 text-[#0052CC] dark:text-[#38BDF8] mx-auto flex items-center justify-center">
            <Wallet className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
              Yêu cầu kết nối Ví MetaMask
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed max-w-md mx-auto">
              Để ghi nhận bản quyền chính chủ lên Smart Contract, bạn cần kết nối ví Web3 để xác thực quyền tác giả và thanh toán phí gas mạng Sepolia.
            </p>
          </div>

          <button
            onClick={connectWallet}
            className="px-6 py-3.5 rounded-xl btn-primary font-semibold flex items-center justify-center gap-2.5 mx-auto transition active:scale-95 shadow-sm"
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
        <div className="glass-card bg-emerald-50/80 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-500/30 rounded-2xl sm:rounded-3xl p-5 sm:p-10 text-center space-y-5 sm:space-y-6 shadow-xl relative overflow-hidden">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-emerald-100 dark:bg-emerald-500/20 border-2 border-emerald-500 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center">
            <CheckCircle2 className="w-8 h-8 sm:w-10 sm:h-10" />
          </div>

          <div className="space-y-1.5 sm:space-y-2">
            <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              Giao dịch thành công
            </span>
            <h2 className="text-xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
              Chúc mừng! Bản quyền đã được xác lập
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 max-w-md mx-auto leading-relaxed">
              Tác phẩm <strong className="text-slate-900 dark:text-white">"{registeredData.title}"</strong> đã chính thức thuộc quyền sở hữu của bạn trên mạng Ethereum Sepolia & IPFS.
            </p>
          </div>

          {/* Chi tiết dữ liệu xác lập */}
          <div className="p-3.5 sm:p-4 rounded-xl sm:rounded-2xl bg-white dark:bg-black/40 border border-slate-200 dark:border-white/10 text-left space-y-2 text-xs">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center text-slate-500 dark:text-slate-400 gap-1">
              <span>Mã giao dịch (Tx Hash):</span>
              <a
                href={getEtherscanTxUrl(txHash)}
                target="_blank"
                rel="noreferrer"
                className="font-mono text-[#0066CC] dark:text-[#38BDF8] hover:underline flex items-center gap-1 break-all"
              >
                {formatAddress(txHash, 8, 6)}
                <ExternalLink className="w-3 h-3 flex-shrink-0" />
              </a>
            </div>
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center text-slate-500 dark:text-slate-400 gap-1">
              <span>Mã SHA-256 bất biến:</span>
              <span className="font-mono text-[#0066CC] dark:text-[#60A5FA] break-all">
                {formatAddress(registeredData.fileHash, 10, 8)}
              </span>
            </div>

            {registeredData.ipfsHash && (
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center text-slate-500 dark:text-slate-400 gap-1">
                <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400 font-semibold">
                  <Database className="w-3.5 h-3.5" /> Mã lưu trữ IPFS (CID):
                </span>
                <button
                  type="button"
                  onClick={() => setShowIpfsModal(true)}
                  className="font-mono text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1.5 break-all font-semibold text-left transition hover:opacity-85"
                  title="Bấm để xem chi tiết ảnh và CID trên IPFS"
                >
                  <span>{formatAddress(registeredData.ipfsHash, 10, 8)}</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/10 border border-amber-500/20 font-sans font-medium">
                    Xem chi tiết
                  </span>
                </button>
              </div>
            )}

            {registeredData.pHash && (
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center text-slate-500 dark:text-slate-400 gap-1">
                <span className="flex items-center gap-1 text-purple-600 dark:text-purple-400 font-semibold">
                  <Fingerprint className="w-3.5 h-3.5" /> Dấu vân tay thị giác (pHash):
                </span>
                <span className="font-mono text-purple-600 dark:text-purple-400 font-semibold break-all">
                  {registeredData.pHash}
                </span>
              </div>
            )}

            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center text-slate-500 dark:text-slate-400 gap-1">
              <span>Chủ sở hữu:</span>
              <span className="font-mono text-slate-800 dark:text-slate-200 break-all">
                {formatAddress(registeredData.owner, 8, 6)}
              </span>
            </div>
          </div>

          {/* Các nút hành động */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 pt-2">
            <button
              onClick={handleDownloadCertificate}
              disabled={isGeneratingPDF}
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-sm flex items-center justify-center gap-2 transition active:scale-95 disabled:opacity-50"
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
              className="w-full sm:w-auto px-6 py-3 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/10 hover:bg-slate-50 dark:hover:bg-white/15 text-slate-700 dark:text-white font-semibold text-sm flex items-center justify-center gap-2 transition"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Đăng ký tác phẩm khác</span>
            </button>
          </div>

          <div className="pt-2">
            <Link
              to="/my-works"
              className="text-xs text-[#0066CC] dark:text-[#38BDF8] hover:underline inline-flex items-center gap-1"
            >
              Xem danh sách tác phẩm của tôi <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          <IPFSPreviewModal
            isOpen={showIpfsModal}
            onClose={() => setShowIpfsModal(false)}
            ipfsHash={registeredData.ipfsHash}
            title={registeredData.title}
            isPinnedToNetwork={isPinnedToNetwork}
            previewUrl={filePreviewUrl}
          />
        </div>
      </motion.div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 sm:space-y-8">
      {/* Tiêu đề trang */}
      <div className="text-center space-y-2 sm:space-y-3 px-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 dark:bg-[#0066CC]/15 border border-blue-200 dark:border-[#0066CC]/35 text-[#0066CC] dark:text-[#38BDF8] text-[11px] sm:text-xs font-semibold">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Ghi nhận quyền tác giả On-Chain & IPFS Storage</span>
        </div>
        <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900 dark:text-white">
          Đăng Ký Bản Quyền Tác Phẩm
        </h1>
        <p className="text-xs sm:text-base text-slate-500 dark:text-slate-400 max-w-lg mx-auto">
          Tính toán mã băm SHA-256 và Perceptual Hash (chống đạo nhái) trực tiếp trên trình duyệt, lưu trữ file lên IPFS và ghi nhận bất biến trên Ethereum Sepolia.
        </p>
      </div>

      <form
        onSubmit={handleSubmitRegister}
        className="glass-card rounded-2xl sm:rounded-3xl p-4 sm:p-8 space-y-5 sm:space-y-6"
      >
        {/* 1. KHU VỰC KÉO THẢ FILE */}
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-slate-800 dark:text-slate-200">
            File tác phẩm số <span className="text-rose-500">*</span>
          </label>

          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`relative border-2 border-dashed rounded-2xl p-7 text-center transition-all cursor-pointer ${
              isDragging
                ? "border-[#0066CC] bg-blue-50/50 dark:bg-[#38BDF8]/10 scale-[1.01]"
                : "border-slate-300 dark:border-white/15 hover:border-[#0066CC] hover:bg-slate-50/50 dark:hover:bg-white/[0.02]"
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
              <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-[#003399]/20 border border-blue-200 dark:border-[#003399]/40 text-[#0052CC] dark:text-[#38BDF8] flex items-center justify-center">
                {isHashing || isAnalyzingPHash ? (
                  <Loader2 className="w-6 h-6 animate-spin text-[#0066CC] dark:text-[#38BDF8]" />
                ) : (
                  <UploadCloud className="w-6 h-6" />
                )}
              </div>

              <div>
                <p className="text-sm font-semibold text-slate-800 dark:text-white">
                  {isHashing
                    ? "Đang tính toán mã băm SHA-256..."
                    : isAnalyzingPHash
                    ? "Đang phân tích dấu vân tay thị giác pHash..."
                    : file
                    ? "Bấm để đổi file khác"
                    : "Kéo thả file tác phẩm vào đây hoặc bấm để chọn"}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Đảm bảo quyền riêng tư: File chỉ đọc nhị phân trong RAM máy bạn để lấy mã băm
                </p>
              </div>

              {file && (
                <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs text-slate-700 dark:text-slate-300 font-mono">
                    <FileText className="w-3.5 h-3.5 text-[#0066CC] dark:text-[#38BDF8]" />
                    <span>{file.name}</span>
                    <span className="text-slate-500">({formatFileSize(file.size)})</span>
                  </div>

                  {isImageFile(file) && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300 text-xs font-semibold">
                      <ImageIcon className="w-3 h-3" /> Định dạng Hình ảnh
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Khung hiển thị Hash SHA-256 & pHash */}
        {fileHash && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 animate-in fade-in">
            {/* SHA-256 */}
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-black/40 border border-slate-200 dark:border-white/10 space-y-1">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500 dark:text-slate-400 font-medium">
                  Mã SHA-256 (Toàn vẹn tuyệt đối):
                </span>
                <button
                  type="button"
                  onClick={() => {
                    copyToClipboard(fileHash);
                    toast.success("Đã sao chép mã SHA-256!");
                  }}
                  className="text-[#0066CC] dark:text-[#38BDF8] hover:underline flex items-center gap-1 font-medium"
                >
                  <Copy className="w-3 h-3" /> Sao chép
                </button>
              </div>
              <p className="font-mono text-xs text-[#0066CC] dark:text-[#38BDF8] break-all">
                {fileHash}
              </p>
            </div>

            {/* pHash (Visual Fingerprint) */}
            <div className="p-3.5 rounded-2xl bg-purple-50/50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800/30 space-y-1">
              <div className="flex justify-between items-center text-xs">
                <span className="text-purple-700 dark:text-purple-300 font-medium flex items-center gap-1">
                  <Fingerprint className="w-3.5 h-3.5" /> Dấu vân tay pHash (64-bit):
                </span>
                {pHashData?.dHash && (
                  <button
                    type="button"
                    onClick={() => {
                      copyToClipboard(pHashData.dHash);
                      toast.success("Đã sao chép pHash!");
                    }}
                    className="text-purple-600 dark:text-purple-400 hover:underline flex items-center gap-1 font-medium"
                  >
                    <Copy className="w-3 h-3" /> Sao chép
                  </button>
                )}
              </div>
              <p className="font-mono text-xs text-purple-700 dark:text-purple-300 break-all font-semibold">
                {pHashData?.dHash ? pHashData.dHash : "Chỉ áp dụng cho file hình ảnh"}
              </p>
            </div>
          </div>
        )}

        {/* NÂNG CẤP 4: CẢNH BÁO ĐẠO NHÁI THỊ GIÁC (PERCEPTUAL HASH) */}
        {plagiarismWarning && plagiarismWarning.hasPlagiarismRisk && (
          <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/50 border-2 border-amber-400 dark:border-amber-500 text-xs space-y-3 animate-in fade-in shadow-md">
            <div className="flex items-center gap-2 font-bold text-sm text-amber-800 dark:text-amber-200">
              <ShieldAlert className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0" />
              <span>
                CẢNH BÁO ĐẠO NHÁI THỊ GIÁC (Tương đồng {plagiarismWarning.highestSimilarity}%)
              </span>
            </div>
            <p className="text-slate-700 dark:text-slate-200 leading-relaxed">
              Thuật toán Perceptual Hash phát hiện bức tranh này có cấu trúc thị giác tương đồng{" "}
              <strong className="text-amber-700 dark:text-amber-300">
                {plagiarismWarning.highestSimilarity}%
              </strong>{" "}
              với một tác phẩm đã được đăng ký trước đó:
            </p>
            {plagiarismWarning.matchedWork && (
              <div className="p-3 rounded-xl bg-white dark:bg-black/40 border border-amber-300 dark:border-amber-700/50 space-y-1">
                <div className="font-bold text-slate-900 dark:text-white">
                  "{plagiarismWarning.matchedWork.title}"
                </div>
                <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                  Tác giả gốc: {plagiarismWarning.matchedWork.owner}
                </div>
              </div>
            )}
            <p className="text-[11px] text-amber-700 dark:text-amber-400 italic">
              * Ngay cả khi bức ảnh bị sửa đổi 1 vài pixel, đổi độ sáng hoặc nén lại, thuật toán pHash vẫn nhận diện được sự tương đồng để bảo vệ bản quyền tác giả ban đầu.
            </p>
          </div>
        )}

        {/* CẢNH BÁO NẾU TRÙNG LẶP HASH 100% (SHA-256) */}
        {duplicateWork && (
          <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-500/40 text-rose-800 dark:text-rose-300 text-xs space-y-2 animate-in fade-in">
            <div className="flex items-center gap-2 font-bold text-sm text-rose-700 dark:text-rose-200">
              <AlertTriangle className="w-4 h-4 text-rose-500" />
              CẢNH BÁO: TÁC PHẨM ĐÃ ĐƯỢC ĐĂNG KÝ BẢN QUYỀN TRÊN BLOCKCHAIN!
            </div>
            <p>
              Mã băm SHA-256 của file này trùng khớp 100% với tác phẩm:{" "}
              <strong className="text-slate-900 dark:text-white">"{duplicateWork.title}"</strong>.
            </p>
            <p className="font-mono text-[11px] text-rose-700 dark:text-rose-400">
              Chủ sở hữu hiện tại: {duplicateWork.owner}
            </p>
            <p className="text-slate-500 dark:text-slate-400">
              * Smart Contract sẽ từ chối giao dịch đăng ký trùng lặp để bảo vệ quyền tác giả đầu tiên.
            </p>
          </div>
        )}

        {/* 2. THÔNG TIN TÁC PHẨM */}
        <div className="space-y-4">
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                Tên tác phẩm <span className="text-rose-500">*</span>
              </label>
              <span
                className={`text-xs ${
                  title.length > 90 ? "text-amber-500" : "text-slate-500"
                }`}
              >
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
              className="w-full glass-input px-4 py-3 rounded-xl text-sm placeholder:text-slate-400"
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                Mô tả chi tiết tác phẩm <span className="text-slate-500 text-xs">(Tùy chọn)</span>
              </label>
              <span
                className={`text-xs ${
                  description.length > 380 ? "text-amber-500" : "text-slate-500"
                }`}
              >
                {description.length}/400 ký tự
              </span>
            </div>
            <textarea
              rows={3}
              maxLength={400}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Thông tin thêm về công cụ sáng tác, bối cảnh, phiên bản hoặc thông điệp của tác phẩm..."
              className="w-full glass-input px-4 py-3 rounded-xl text-sm placeholder:text-slate-400 resize-none"
            />
          </div>
        </div>

        {/* NÂNG CẤP 1: TÙY CHỌN LƯU TRỮ PHI TẬP TRUNG IPFS */}
        <div className="p-4 rounded-2xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/40 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                <Database className="w-4 h-4" />
              </div>
              <div>
                <span className="text-sm font-semibold text-slate-800 dark:text-white">
                  Lưu trữ phi tập trung IPFS (Pinata Web3)
                </span>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Lưu trữ vĩnh viễn file trên mạng IPFS, cấp mã CID và xem trước trực tuyến
                </p>
              </div>
            </div>

            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={enableIPFS}
                onChange={(e) => setEnableIPFS(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-white/10 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
            </label>
          </div>

          {enableIPFS && filePreviewUrl && (
            <div className="flex items-center gap-3 pt-1 border-t border-amber-200 dark:border-amber-800/30">
              <img
                src={filePreviewUrl}
                alt="Preview"
                className="w-12 h-12 object-cover rounded-xl border border-slate-200 dark:border-white/10"
              />
              <div className="text-xs text-slate-600 dark:text-slate-300">
                <span className="font-semibold text-amber-700 dark:text-amber-300">
                  Hình ảnh xem trước sẵn sàng
                </span>
                <p className="text-[11px] text-slate-400">
                  File sẽ được đính kèm mã IPFS CID khi ghi vào Smart Contract
                </p>
              </div>
            </div>
          )}
        </div>

        {/* 3. STEPPER TIẾN TRÌNH GIAO DỊCH NẾU ĐANG GỬI */}
        {txStep > 0 && txStep < 3 && (
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 space-y-3">
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-center">
              Tiến trình đăng ký Blockchain & IPFS
            </p>
            <div className="grid grid-cols-3 gap-2 text-center text-xs font-medium">
              <div
                className={`p-2 rounded-xl flex items-center justify-center gap-1.5 ${
                  txStep === 1
                    ? "bg-blue-100 dark:bg-[#003399]/30 text-[#0052CC] dark:text-[#38BDF8] border border-blue-300 dark:border-[#0066CC]/40"
                    : "text-slate-400"
                }`}
              >
                {txStep === 1 ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <span className="w-3.5 h-3.5 rounded-full border border-current inline-flex items-center justify-center text-[9px]">
                    1
                  </span>
                )}
                <span>Chờ ký ví</span>
              </div>
              <div
                className={`p-2 rounded-xl flex items-center justify-center gap-1.5 ${
                  txStep === 2
                    ? "bg-blue-100 dark:bg-[#0066CC]/30 text-[#0052CC] dark:text-[#93C5FD] border border-blue-300 dark:border-[#0066CC]/40"
                    : "text-slate-400"
                }`}
              >
                {txStep === 2 ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <span className="w-3.5 h-3.5 rounded-full border border-current inline-flex items-center justify-center text-[9px]">
                    2
                  </span>
                )}
                <span>Xác nhận Block</span>
              </div>
              <div className="p-2 rounded-xl flex items-center justify-center gap-1.5 text-slate-400">
                <span className="w-3.5 h-3.5 rounded-full border border-current inline-flex items-center justify-center text-[9px]">
                  3
                </span>
                <span>Hoàn tất</span>
              </div>
            </div>
          </div>
        )}

        {/* NÚT SUBMIT */}
        <button
          type="submit"
          disabled={!fileHash || !!duplicateWork || isHashing || txStep > 0 || isUploadingIPFS}
          className="w-full py-4 rounded-2xl btn-primary font-bold text-base shadow-sm flex items-center justify-center gap-2.5 transition active:scale-[0.99] disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {isUploadingIPFS ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Đang tải file lên mạng IPFS...</span>
            </>
          ) : txStep > 0 ? (
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

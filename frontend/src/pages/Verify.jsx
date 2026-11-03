import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  UploadCloud,
  XCircle,
  Copy,
  ExternalLink,
  Download,
  CheckCircle2,
  ShieldAlert,
  Loader2,
  FileText,
  Info,
  ShieldCheck,
} from "lucide-react";
import toast from "react-hot-toast";
import { calculateFileHash, isValidBytes32Hash } from "../utils/hash";
import { fetchWork, checkIsRegistered } from "../utils/contract";
import { formatAddress, formatTimestamp, formatFileSize, copyToClipboard, getEtherscanAddressUrl } from "../utils/format";
import { generateCertificatePDF } from "../utils/pdf";

export default function Verify() {
  const { hash: urlHash } = useParams();
  const navigate = useNavigate();

  const [inputHash, setInputHash] = useState(urlHash || "");
  const [selectedFile, setSelectedFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isHashing, setIsHashing] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  // Kết quả xác minh: null (chưa tra), 'FOUND' (đã đăng ký), 'NOT_FOUND' (chưa có)
  const [verifyStatus, setVerifyStatus] = useState(null);
  const [verifiedWork, setVerifiedWork] = useState(null);
  const [searchedHash, setSearchedHash] = useState("");

  // Nếu có hash trên URL (/verify/:hash), tự động tra cứu ngay
  useEffect(() => {
    if (urlHash) {
      setInputHash(urlHash);
      handleVerifyHash(urlHash);
    }
  }, [urlHash]);

  // Hàm tra cứu bản quyền theo mã băm bytes32
  const handleVerifyHash = async (hashToVerify) => {
    const cleanHash = (hashToVerify || inputHash).trim();

    if (!cleanHash) {
      toast.error("Vui lòng nhập mã băm hoặc tải file lên!");
      return;
    }

    if (!isValidBytes32Hash(cleanHash)) {
      toast.error("Mã băm không đúng định dạng bytes32 (phải bắt đầu bằng 0x và gồm 64 ký tự hex)!");
      return;
    }

    setIsSearching(true);
    setVerifyStatus(null);
    setVerifiedWork(null);
    setSearchedHash(cleanHash);

    try {
      const isReg = await checkIsRegistered(cleanHash);
      if (isReg) {
        const workData = await fetchWork(cleanHash);
        if (workData) {
          setVerifiedWork(workData);
          setVerifyStatus("FOUND");
          toast.success("Đã tìm thấy bản quyền hợp lệ trên Blockchain!");
        } else {
          setVerifyStatus("NOT_FOUND");
        }
      } else {
        setVerifyStatus("NOT_FOUND");
      }
    } catch (err) {
      console.error("Lỗi khi xác minh:", err);
      toast.error("Không thể kết nối đến mạng Blockchain RPC để kiểm tra.");
    } finally {
      setIsSearching(false);
    }
  };

  // Xử lý khi chọn hoặc kéo thả file
  const handleFileProcess = async (file) => {
    if (!file) return;

    if (file.size === 0) {
      toast.error("File tải lên có dung lượng rỗng (0 byte).");
      return;
    }

    if (file.size > 100 * 1024 * 1024) {
      toast("File dung lượng lớn (>100MB), quá trình băm SHA-256 có thể mất vài giây...", {
        icon: "⚠️",
      });
    }

    setSelectedFile(file);
    setIsHashing(true);

    try {
      const { hash } = await calculateFileHash(file);
      setInputHash(hash);
      await handleVerifyHash(hash);
    } catch (err) {
      console.error("Lỗi khi băm file:", err);
      toast.error("Không thể tính mã SHA-256 của file: " + err.message);
    } finally {
      setIsHashing(false);
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
      handleFileProcess(e.dataTransfer.files[0]);
    }
  };

  const handleCopy = async (text, label) => {
    const success = await copyToClipboard(text);
    if (success) {
      toast.success(`Đã sao chép ${label}!`);
    }
  };

  const handleDownloadPDF = async () => {
    if (!verifiedWork) return;
    setIsGeneratingPDF(true);
    try {
      toast.loading("Đang xuất file Giấy chứng nhận PDF...", { id: "pdf-verify" });
      await generateCertificatePDF(verifiedWork);
      toast.success("Đã tải Giấy chứng nhận về máy!", { id: "pdf-verify" });
    } catch (err) {
      console.error("Lỗi xuất PDF:", err);
      toast.error("Không thể xuất file PDF: " + err.message, { id: "pdf-verify" });
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 sm:space-y-8">
      {/* TIÊU ĐỀ TRANG */}
      <div className="text-center space-y-2 sm:space-y-3 px-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 dark:bg-[#0066CC]/15 border border-blue-200 dark:border-[#0066CC]/35 text-[#0066CC] dark:text-[#38BDF8] text-[11px] sm:text-xs font-semibold">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Xác minh công khai 100% On-Chain</span>
        </div>
        <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900 dark:text-white">
          Xác Minh Quyền Sở Hữu Tác Phẩm
        </h1>
        <p className="text-xs sm:text-base text-slate-500 dark:text-slate-400 max-w-xl mx-auto leading-relaxed">
          Tra cứu tính nguyên bản và thông tin quyền sở hữu trí tuệ đã ghi nhận bất biến trên mạng Ethereum Sepolia.
        </p>
      </div>

      {/* KHU VỰC NHẬP LIỆU: KÉO THẢ HOẶC DÁN HASH */}
      <div className="glass-card rounded-2xl sm:rounded-3xl p-4 sm:p-8 space-y-5 sm:space-y-6">
        {/* Vùng kéo thả file để tự băm và tra cứu */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`relative border-2 border-dashed rounded-2xl p-8 text-center transition-all cursor-pointer ${
            isDragging
              ? "border-[#0066CC] bg-blue-50/50 dark:bg-[#38BDF8]/10 scale-[1.01]"
              : "border-slate-300 dark:border-white/15 hover:border-[#0066CC] hover:bg-slate-50/50 dark:hover:bg-white/[0.02]"
          }`}
          onClick={() => document.getElementById("verify-file-input")?.click()}
        >
          <input
            id="verify-file-input"
            type="file"
            className="hidden"
            onChange={(e) => {
              if (e.target.files?.[0]) handleFileProcess(e.target.files[0]);
            }}
          />

          <div className="flex flex-col items-center justify-center space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-[#0066CC]/15 border border-blue-200 dark:border-[#0066CC]/30 text-[#0052CC] dark:text-[#38BDF8] flex items-center justify-center">
              {isHashing ? (
                <Loader2 className="w-7 h-7 animate-spin text-[#0066CC] dark:text-[#38BDF8]" />
              ) : (
                <UploadCloud className="w-7 h-7" />
              )}
            </div>

            <div>
              <p className="text-sm sm:text-base font-semibold text-slate-800 dark:text-white">
                {isHashing
                  ? "Đang tính toán mã băm SHA-256 trên trình duyệt..."
                  : "Kéo thả file vào đây hoặc bấm để chọn"}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Hỗ trợ mọi định dạng: Hình ảnh, Video, MP3, PDF, Mã nguồn,... (File KHÔNG bị tải lên máy chủ)
              </p>
            </div>

            {selectedFile && (
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs text-slate-700 dark:text-slate-300 font-mono">
                <FileText className="w-3.5 h-3.5 text-[#0066CC] dark:text-[#38BDF8]" />
                <span>{selectedFile.name}</span>
                <span className="text-slate-500">({formatFileSize(selectedFile.size)})</span>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="h-px bg-slate-200 dark:bg-white/10 flex-1" />
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">hoặc nhập mã băm</span>
          <div className="h-px bg-slate-200 dark:bg-white/10 flex-1" />
        </div>

        {/* Ô nhập trực tiếp mã SHA-256 */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleVerifyHash();
          }}
          className="flex flex-col sm:flex-row gap-3"
        >
          <div className="relative flex-1">
            <input
              type="text"
              value={inputHash}
              onChange={(e) => setInputHash(e.target.value)}
              placeholder="Dán mã băm bytes32 (0x7f83b165...)"
              className="w-full glass-input px-4 py-3.5 rounded-xl font-mono text-xs sm:text-sm placeholder:text-slate-400"
            />
          </div>
          <button
            type="submit"
            disabled={isSearching || isHashing}
            className="px-6 py-3.5 rounded-xl btn-primary text-sm font-semibold flex items-center justify-center gap-2 transition disabled:opacity-50 active:scale-95 shadow-sm"
          >
            {isSearching ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Đang tra cứu...</span>
              </>
            ) : (
              <>
                <Search className="w-4 h-4" />
                <span>Kiểm tra ngay</span>
              </>
            )}
          </button>
        </form>
      </div>

      {/* KẾT QUẢ XÁC MINH */}
      <AnimatePresence mode="wait">
        {verifyStatus === "FOUND" && verifiedWork && (
          <motion.div
            key="found"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="glass-card bg-emerald-50/80 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-500/30 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl relative overflow-hidden"
          >
            {/* Header kết quả thành công */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-emerald-300 dark:border-emerald-500/20 pb-4 sm:pb-5">
              <div className="flex items-start sm:items-center gap-3">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-emerald-100 dark:bg-emerald-500/20 border border-emerald-400 dark:border-emerald-500/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center flex-shrink-0">
                  <CheckCircle2 className="w-6 h-6 sm:w-7 sm:h-7" />
                </div>
                <div>
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-[11px] sm:text-xs font-semibold uppercase tracking-wider mb-1">
                    Bản quyền hợp lệ 100%
                  </div>
                  <h3 className="text-lg sm:text-2xl font-bold text-slate-900 dark:text-white leading-snug">
                    Tác phẩm đã được đăng ký trên Blockchain
                  </h3>
                </div>
              </div>

              {/* Nút tải Giấy chứng nhận PDF */}
              <button
                onClick={handleDownloadPDF}
                disabled={isGeneratingPDF}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-sm transition active:scale-95 disabled:opacity-50"
              >
                {isGeneratingPDF ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Download className="w-4 h-4" />
                )}
                <span>Tải Giấy chứng nhận PDF</span>
              </button>
            </div>

            {/* Chi tiết thông tin bản quyền */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 text-sm">
              <div className="p-3.5 sm:p-4 rounded-xl sm:rounded-2xl bg-white dark:bg-black/30 border border-slate-200 dark:border-white/5 space-y-1">
                <span className="text-xs text-slate-500 dark:text-slate-400">Tên tác phẩm:</span>
                <p className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">{verifiedWork.title}</p>
              </div>

              <div className="p-3.5 sm:p-4 rounded-xl sm:rounded-2xl bg-white dark:bg-black/30 border border-slate-200 dark:border-white/5 space-y-1">
                <span className="text-xs text-slate-500 dark:text-slate-400">Thời gian đăng ký (Giờ VN):</span>
                <p className="text-sm sm:text-base font-bold text-emerald-600 dark:text-emerald-300">
                  {formatTimestamp(verifiedWork.timestamp)}
                </p>
              </div>

              <div className="p-3.5 sm:p-4 rounded-xl sm:rounded-2xl bg-white dark:bg-black/30 border border-slate-200 dark:border-white/5 space-y-1.5 md:col-span-2">
                <span className="text-xs text-slate-500 dark:text-slate-400">Chủ sở hữu hiện tại (Địa chỉ ví):</span>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <span className="font-mono text-xs sm:text-sm text-[#0066CC] dark:text-[#38BDF8] break-all font-semibold">
                    {verifiedWork.owner}
                  </span>
                  <div className="flex items-center gap-2 self-end sm:self-auto flex-shrink-0">
                    <button
                      onClick={() => handleCopy(verifiedWork.owner, "địa chỉ ví")}
                      className="p-1.5 rounded-lg bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-600 dark:text-slate-300 transition"
                      title="Sao chép"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                    <a
                      href={getEtherscanAddressUrl(verifiedWork.owner)}
                      target="_blank"
                      rel="noreferrer"
                      className="p-1.5 rounded-lg bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-600 dark:text-slate-300 transition"
                      title="Xem trên Sepolia Etherscan"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>
              </div>

              {verifiedWork.description && (
                <div className="p-4 rounded-2xl bg-white dark:bg-black/30 border border-slate-200 dark:border-white/5 space-y-1 md:col-span-2">
                  <span className="text-xs text-slate-500 dark:text-slate-400">Mô tả tác phẩm:</span>
                  <p className="text-slate-700 dark:text-slate-300 text-xs sm:text-sm leading-relaxed">{verifiedWork.description}</p>
                </div>
              )}

              <div className="p-4 rounded-2xl bg-white dark:bg-black/30 border border-slate-200 dark:border-white/5 space-y-1.5 md:col-span-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500 dark:text-slate-400">Mã băm SHA-256 (File Hash):</span>
                  <button
                    onClick={() => handleCopy(verifiedWork.fileHash, "mã băm")}
                    className="inline-flex items-center gap-1 text-[#0066CC] dark:text-[#38BDF8] hover:underline font-medium"
                  >
                    <Copy className="w-3 h-3" /> Sao chép
                  </button>
                </div>
                <p className="font-mono text-xs text-[#0066CC] dark:text-[#38BDF8] break-all bg-slate-100 dark:bg-black/40 p-2.5 rounded-xl border border-slate-200 dark:border-white/5 font-medium">
                  {verifiedWork.fileHash}
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {verifyStatus === "NOT_FOUND" && (
          <motion.div
            key="not_found"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="glass-card bg-rose-50 dark:bg-rose-950/30 border-rose-300 dark:border-rose-500/30 rounded-3xl p-6 sm:p-8 space-y-4 shadow-xl"
          >
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-500/20 border border-rose-300 dark:border-rose-500/40 text-rose-600 dark:text-rose-400 flex items-center justify-center flex-shrink-0">
                <XCircle className="w-7 h-7" />
              </div>
              <div className="space-y-1.5">
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">Chưa có bản ghi trên Blockchain</h3>
                <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                  Mã băm này chưa từng được đăng ký trong Smart Contract của CopyrightChain trên Ethereum Sepolia.
                </p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-black/30 border border-slate-200 dark:border-white/5 space-y-2 text-xs text-slate-500 dark:text-slate-400">
              <p className="font-semibold text-rose-600 dark:text-rose-300 flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4 text-rose-500" />
                Lưu ý quan trọng về tính toàn vẹn file:
              </p>
              <p>
                Nếu file đã từng được đăng ký trước đó nhưng bị chỉnh sửa (dù chỉ thay đổi 1 dấu chấm, 1 pixel hoặc 1 byte metadata), mã SHA-256 sẽ hoàn toàn khác biệt và hệ thống sẽ không nhận diện được.
              </p>
              <div className="pt-1 font-mono text-[11px] text-slate-500 dark:text-slate-400 break-all">
                Hash vừa kiểm tra: <span className="text-slate-800 dark:text-slate-200 font-medium">{searchedHash}</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* KHỐI GIẢI THÍCH TRỰC QUAN: HIỆU ỨNG TUYẾT LỞ (AVALANCHE EFFECT) */}
      <div className="glass-card rounded-2xl p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-blue-50 dark:bg-[#0066CC]/15 text-[#0066CC] dark:text-[#38BDF8]">
            <Info className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-900 dark:text-white">
              Vì sao chỉ thay đổi 1 byte làm mã băm biến đổi hoàn toàn?
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400">Nguyên lý mật mã học SHA-256 (Hiệu ứng Tuyết lở - Avalanche Effect)</p>
          </div>
        </div>

        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
          Thuật toán mật mã học SHA-256 được thiết kế với cơ chế khuếch tán nghiêm ngặt. Khi nội dung file thay đổi dù chỉ một bit (0 sang 1), hơn 50% các ký tự trong chuỗi băm 64 chữ số hex sẽ bị đảo lộn. Do đó, không ai có thể làm giả hoặc sửa đổi bất kỳ nội dung nào của tác phẩm sau khi đã được cấp chứng nhận.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[11px] font-mono">
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-black/30 border border-slate-200 dark:border-white/5 space-y-1">
            <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Nội dung: "TacPhamGoc"</span>
            <p className="text-slate-500 dark:text-slate-400 break-all">Hash: 0x9f83a...3b21</p>
          </div>
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-black/30 border border-slate-200 dark:border-white/5 space-y-1">
            <span className="text-rose-600 dark:text-rose-400 font-semibold">Nội dung: "TacPhamGoc." (thêm 1 dấu chấm)</span>
            <p className="text-slate-500 dark:text-slate-400 break-all">Hash: 0x4e12c...99fd (khác hoàn toàn)</p>
          </div>
        </div>
      </div>
    </div>
  );
}

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Database,
  ExternalLink,
  Copy,
  CheckCircle2,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Image as ImageIcon,
  KeyRound,
  Globe,
  AlertTriangle,
} from "lucide-react";
import toast from "react-hot-toast";
import { copyToClipboard } from "../utils/format";
import { getIPFSGatewayUrl, getLocalPreview, isPinataConfigured } from "../utils/ipfs";

export default function IPFSPreviewModal({
  isOpen,
  onClose,
  ipfsHash,
  title = "Tác phẩm",
  isPinnedToNetwork = false,
  previewUrl = null,
}) {
  const [copied, setCopied] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [imageFailed, setImageFailed] = useState(false);

  // 1. Khoá cuộn trang bên dưới khi mở Modal (Chống tràn trang / cuộn chuột nền)
  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen]);

  // 2. Nhấn phím Escape để đóng Modal
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !ipfsHash) return null;

  const gatewayUrl = getIPFSGatewayUrl(ipfsHash);

  // Nguồn ảnh: Ưu tiên bộ đệm cục bộ (Cache), nếu không có thì thử tải từ Gateway
  const cachedImage = previewUrl || getLocalPreview(ipfsHash);
  const displayImage = cachedImage || (!imageFailed ? gatewayUrl : null);

  // Trạng thái đã ghim thực tế: có cờ pinned hoặc cấu hình Pinata
  const isPinned = Boolean(isPinnedToNetwork || isPinataConfigured());

  const handleCopyCID = async () => {
    const success = await copyToClipboard(ipfsHash);
    if (success) {
      setCopied(true);
      toast.success("Đã sao chép mã IPFS CID!");
      setTimeout(() => setCopied(false), 2000);
    } else {
      toast.error("Không thể sao chép vào bộ nhớ tạm.");
    }
  };

  // Sử dụng createPortal để gắn trực tiếp Modal vào document.body, tránh bị Footer hay các thẻ cha đè z-index
  return createPortal(
    <AnimatePresence>
      <div
        className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-6 bg-black/75 backdrop-blur-md overflow-hidden"
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative w-full max-w-xl max-h-[85vh] flex flex-col bg-white dark:bg-[#061129] border border-slate-200 dark:border-white/15 rounded-3xl shadow-2xl overflow-hidden overscroll-contain"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header (Cố định ở đỉnh Modal) */}
          <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-200 dark:border-white/10 bg-slate-50/80 dark:bg-black/30 flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400">
                <Database className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-tight">
                  Chi tiết lưu trữ IPFS
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-xs sm:max-w-md">
                  Tác phẩm: <strong className="text-slate-700 dark:text-slate-200">{title}</strong>
                </p>
              </div>
            </div>

            {/* Nút đóng */}
            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-xl hover:bg-slate-200/60 dark:hover:bg-white/10 transition"
              title="Đóng (Esc)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body nội dung (Có thanh cuộn riêng biệt bên trong modal) */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 overscroll-contain">
            {/* Trạng thái ghim IPFS */}
            <div
              className={`p-3.5 rounded-2xl border flex items-start gap-3 ${
                isPinned
                  ? "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800/40 text-emerald-800 dark:text-emerald-300"
                  : "bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800/40 text-amber-800 dark:text-amber-300"
              }`}
            >
              {isPinned ? (
                <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-emerald-600 dark:text-emerald-400 mt-0.5" />
              ) : (
                <AlertCircle className="w-5 h-5 flex-shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
              )}
              <div className="text-xs space-y-1">
                <p className="font-semibold text-sm">
                  {isPinned
                    ? "Đã ghim an toàn trên IPFS (Pinata Cloud)"
                    : "Mã CID tính toán cục bộ (Client-Side Hash)"}
                </p>
                <p className="opacity-90 leading-relaxed">
                  {isPinned
                    ? "Dữ liệu được lưu trữ phân tán, vĩnh viễn trên mạng lưới IPFS toàn cầu và có thể truy cập qua Dedicated Gateway."
                    : "Mã CIDv0 chuẩn SHA-256 đã được xác lập trên Smart Contract. Hiện tại file đang hiển thị qua bộ đệm tạm do dự án chưa cấu hình VITE_PINATA_JWT."}
                </p>
              </div>
            </div>

            {/* Khung hiển thị ảnh xem trước */}
            <div className="rounded-2xl overflow-hidden border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-black/40">
              {displayImage ? (
                <div className="relative group flex items-center justify-center p-3 max-h-60 sm:max-h-72">
                  <img
                    src={displayImage}
                    alt={title}
                    onError={() => setImageFailed(true)}
                    className="max-h-56 max-w-full object-contain rounded-xl shadow-md"
                  />
                  <span className="absolute bottom-4 right-4 text-[10px] font-medium px-2 py-1 rounded-md bg-black/75 text-white backdrop-blur-sm">
                    {cachedImage ? "Local Cache" : "IPFS Dedicated Gateway"}
                  </span>
                </div>
              ) : (
                <div className="py-8 px-4 text-center text-slate-400 space-y-2">
                  <ImageIcon className="w-8 h-8 mx-auto opacity-40" />
                  <p className="text-xs">
                    Không tìm thấy ảnh xem trước trong bộ đệm. Bạn có thể mở link Gateway bên dưới để xem file gốc.
                  </p>
                </div>
              )}
            </div>

            {/* Hộp mã băm CID */}
            <div className="p-3.5 rounded-2xl bg-slate-100 dark:bg-black/50 border border-slate-200 dark:border-white/10 space-y-2">
              <div className="flex justify-between items-center text-xs text-slate-500 dark:text-slate-400">
                <span className="font-semibold uppercase tracking-wider text-[10px]">
                  IPFS Content Identifier (CIDv0)
                </span>
                <button
                  type="button"
                  onClick={handleCopyCID}
                  className="inline-flex items-center gap-1 text-[#0066CC] dark:text-[#38BDF8] font-semibold hover:underline"
                >
                  {copied ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Đã chép
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" /> Sao chép CID
                    </>
                  )}
                </button>
              </div>
              <p className="font-mono text-xs text-amber-700 dark:text-amber-400 break-all select-all font-semibold bg-white dark:bg-black/40 p-2.5 rounded-xl border border-slate-200 dark:border-white/5">
                {ipfsHash}
              </p>
            </div>

            {/* Phần cảnh báo và hướng dẫn cấu hình Pinata khi chưa ghim */}
            {!isPinned && (
              <div className="space-y-3">
                <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/25 flex items-start gap-2.5 text-amber-800 dark:text-amber-300 text-xs">
                  <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <strong className="block font-semibold mb-0.5">Vì sao Gateway ngoài có thể báo lỗi 502?</strong>
                    Vì file chưa được đẩy lên mạng Pinata Cloud (thiếu JWT), nên các cổng công cộng sẽ báo lỗi <em>No providers found</em>.
                  </div>
                </div>

                <div className="rounded-2xl border border-blue-200 dark:border-blue-900/50 bg-blue-50/60 dark:bg-blue-950/20 overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setShowGuide(!showGuide)}
                    className="w-full p-3 text-left flex items-center justify-between text-xs font-semibold text-[#0052CC] dark:text-[#38BDF8] hover:bg-blue-100/50 dark:hover:bg-blue-900/20 transition"
                  >
                    <span className="flex items-center gap-2">
                      <KeyRound className="w-4 h-4" />
                      Xem hướng dẫn bật lưu trữ IPFS thật với Pinata (3 phút)
                    </span>
                    {showGuide ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>

                  {showGuide && (
                    <div className="p-3.5 pt-0 border-t border-blue-200/60 dark:border-blue-900/40 text-xs text-slate-600 dark:text-slate-300 space-y-2 mt-2">
                      <ol className="list-decimal pl-5 space-y-1.5 leading-relaxed">
                        <li>
                          Đăng ký tài khoản tại{" "}
                          <a
                            href="https://app.pinata.cloud/register"
                            target="_blank"
                            rel="noreferrer"
                            className="text-[#0066CC] dark:text-[#38BDF8] underline font-medium"
                          >
                            app.pinata.cloud
                          </a>.
                        </li>
                        <li>
                          Vào <strong>API Keys</strong> &rarr; Tạo <strong>New Key</strong> (quyền Admin).
                        </li>
                        <li>
                          Sao chép mã <strong>JWT</strong> (bắt đầu bằng <code className="bg-white dark:bg-black/40 px-1 py-0.5 rounded font-mono">eyJ...</code>).
                        </li>
                        <li>
                          Dán vào file <code className="bg-white dark:bg-black/40 px-1 py-0.5 rounded font-mono">frontend/.env</code> dòng:
                          <div className="mt-1 font-mono text-[11px] p-2 bg-slate-900 text-slate-100 rounded-lg select-all">
                            VITE_PINATA_JWT=eyJhbGciOi...
                          </div>
                        </li>
                        <li>Khởi động lại frontend để áp dụng.</li>
                      </ol>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Footer nút hành động (Cố định ở đáy Modal) */}
          <div className="flex items-center justify-end gap-2.5 p-3.5 sm:p-4 border-t border-slate-200 dark:border-white/10 bg-slate-50/80 dark:bg-black/30 flex-shrink-0">
            {isPinned ? (
              <a
                href={gatewayUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary px-4 py-2 rounded-xl text-xs font-semibold inline-flex items-center justify-center gap-1.5 shadow-sm"
              >
                <Globe className="w-3.5 h-3.5" />
                Mở trên IPFS Gateway
                <ExternalLink className="w-3 h-3" />
              </a>
            ) : (
              <button
                type="button"
                onClick={() => {
                  toast.error(
                    "Tác phẩm này chưa được ghim lên mạng IPFS nên Gateway ngoài không có dữ liệu (báo lỗi 502). Vui lòng cấu hình Pinata JWT để tải lên thật!",
                    { duration: 5000 }
                  );
                  setShowGuide(true);
                }}
                className="px-3.5 py-2 rounded-xl text-xs font-medium text-amber-700 dark:text-amber-300 bg-amber-500/10 border border-amber-500/25 hover:bg-amber-500/20 inline-flex items-center justify-center gap-1.5 transition"
              >
                <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
                Mở Gateway ngoài (Chưa ghim)
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-200 dark:bg-white/10 hover:bg-slate-300 dark:hover:bg-white/20 text-slate-700 dark:text-slate-200 transition"
            >
              Đóng
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>,
    document.body
  );
}

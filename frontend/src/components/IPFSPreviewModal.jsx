import React, { useState } from "react";
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

  if (!isOpen || !ipfsHash) return null;

  // Tìm ảnh xem trước: từ prop truyền vào hoặc từ sessionStorage cache
  const cachedImage = previewUrl || getLocalPreview(ipfsHash);

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

  const gatewayUrl = getIPFSGatewayUrl(ipfsHash);

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 dark:bg-black/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative w-full max-w-xl max-h-[90vh] overflow-y-auto bg-white dark:bg-[#061129] border border-slate-200 dark:border-white/15 rounded-3xl p-5 sm:p-6 shadow-2xl"
        >
          {/* Nút đóng */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Header */}
          <div className="flex items-center gap-3.5 mb-5">
            <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400">
              <Database className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
                Chi tiết lưu trữ IPFS
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Tác phẩm: <strong className="text-slate-700 dark:text-slate-200">{title}</strong>
              </p>
            </div>
          </div>

          {/* Trạng thái ghim IPFS */}
          <div
            className={`p-3.5 rounded-2xl border mb-5 flex items-start gap-3 ${
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
                  ? "Dữ liệu được lưu trữ phân tán, vĩnh viễn trên mạng lưới IPFS toàn cầu và có thể tải thông qua Dedicated Gateway."
                  : "Mã CIDv0 chuẩn SHA-256 đã được xác lập trên Smart Contract. Hiện tại file đang hiển thị qua bộ đệm tạm do dự án chưa cấu hình VITE_PINATA_JWT."}
              </p>
            </div>
          </div>

          {/* Khung hiển thị ảnh xem trước */}
          <div className="mb-5 rounded-2xl overflow-hidden border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-black/40">
            {cachedImage ? (
              <div className="relative group flex items-center justify-center p-3 max-h-72">
                <img
                  src={cachedImage}
                  alt={title}
                  className="max-h-64 max-w-full object-contain rounded-xl shadow-md"
                />
                <span className="absolute bottom-5 right-5 text-[10px] font-medium px-2 py-1 rounded-md bg-black/70 text-white backdrop-blur-sm">
                  {isPinned ? "IPFS Network" : "Local Preview Cache"}
                </span>
              </div>
            ) : (
              <div className="py-10 px-4 text-center text-slate-400 space-y-2">
                <ImageIcon className="w-10 h-10 mx-auto opacity-40" />
                <p className="text-xs">
                  Không tìm thấy ảnh xem trước trong bộ đệm trình duyệt này.
                </p>
              </div>
            )}
          </div>

          {/* Hộp mã băm CID */}
          <div className="p-3.5 rounded-2xl bg-slate-100 dark:bg-black/50 border border-slate-200 dark:border-white/10 space-y-2 mb-5">
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
            <div className="mb-5 space-y-3">
              {/* Lưu ý tại sao không nên mở gateway ngoài */}
              <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/25 flex items-start gap-2.5 text-amber-800 dark:text-amber-300 text-xs">
                <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                <div>
                  <strong className="block font-semibold mb-0.5">Vì sao không nên mở Gateway ngoài lúc này?</strong>
                  Vì file chưa được đẩy lên mạng IPFS toàn cầu (thiếu Pinata JWT), nên nếu mở các cổng công cộng như ipfs.io, hệ thống sẽ báo lỗi <code className="bg-amber-100 dark:bg-amber-900/50 px-1 py-0.5 rounded font-mono font-bold">502 Bad Gateway / No providers found</code>.
                </div>
              </div>

              {/* Accordion hướng dẫn cài đặt */}
              <div className="rounded-2xl border border-blue-200 dark:border-blue-900/50 bg-blue-50/60 dark:bg-blue-950/20 overflow-hidden">
                <button
                  type="button"
                  onClick={() => setShowGuide(!showGuide)}
                  className="w-full p-3.5 text-left flex items-center justify-between text-xs font-semibold text-[#0052CC] dark:text-[#38BDF8] hover:bg-blue-100/50 dark:hover:bg-blue-900/20 transition"
                >
                  <span className="flex items-center gap-2">
                    <KeyRound className="w-4 h-4" />
                    Hướng dẫn bật lưu trữ IPFS thật với Pinata (Miễn phí 3 phút)
                  </span>
                  {showGuide ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>

                {showGuide && (
                  <div className="p-3.5 pt-0 border-t border-blue-200/60 dark:border-blue-900/40 text-xs text-slate-600 dark:text-slate-300 space-y-2 mt-2">
                    <ol className="list-decimal pl-5 space-y-1.5 leading-relaxed">
                      <li>
                        Đăng ký tài khoản miễn phí tại{" "}
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
                        Vào mục <strong>API Keys</strong> &rarr; Bấm <strong>New Key</strong> &rarr; Chọn quyền <strong>Admin</strong> &rarr; Bấm Tạo.
                      </li>
                      <li>
                        Sao chép mã <strong>JWT</strong> (bắt đầu bằng <code className="bg-white dark:bg-black/40 px-1 py-0.5 rounded font-mono">eyJ...</code>).
                      </li>
                      <li>
                        Mở file <code className="bg-white dark:bg-black/40 px-1 py-0.5 rounded font-mono">frontend/.env</code>, dán vào:
                        <div className="mt-1 font-mono text-[11px] p-2 bg-slate-900 text-slate-100 rounded-lg select-all">
                          VITE_PINATA_JWT=eyJhbGciOi...
                        </div>
                      </li>
                      <li>Khởi động lại frontend (<code className="bg-white dark:bg-black/40 px-1 py-0.5 rounded font-mono">npm run dev</code>). Sau đó các tác phẩm đăng ký mới sẽ tải thẳng lên IPFS thật.</li>
                    </ol>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row gap-2.5 sm:justify-end pt-2 border-t border-slate-200 dark:border-white/10">
            {isPinned ? (
              <a
                href={gatewayUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary px-4 py-2.5 rounded-xl text-xs font-semibold inline-flex items-center justify-center gap-2"
              >
                <Globe className="w-4 h-4" />
                Mở trên IPFS Gateway
                <ExternalLink className="w-3.5 h-3.5" />
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
                className="px-4 py-2 rounded-xl text-xs font-medium text-amber-700 dark:text-amber-300 bg-amber-500/10 border border-amber-500/25 hover:bg-amber-500/20 inline-flex items-center justify-center gap-1.5 transition"
                title="Bấm để xem lý do Gateway ngoài chưa mở được file này"
              >
                <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
                Mở Gateway ngoài (Chưa ghim)
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/20 text-slate-700 dark:text-slate-200 transition"
            >
              Đóng
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

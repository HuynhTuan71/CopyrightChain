import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  FolderOpen,
  Search,
  Download,
  Send,
  Copy,
  Plus,
  Wallet,
  Clock,
  FileCheck2,
  Loader2,
  RefreshCw,
} from "lucide-react";
import toast from "react-hot-toast";
import { useWallet } from "../context/WalletContext";
import { fetchWorksByOwner } from "../utils/contract";
import { formatHash, formatTimestamp, copyToClipboard } from "../utils/format";
import { generateCertificatePDF } from "../utils/pdf";
import TransferModal from "../components/TransferModal";
import { CardSkeleton } from "../components/LoadingSkeleton";

export default function MyWorks() {
  const { account, signer, connectWallet } = useWallet();

  const [works, setWorks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedWorkForTransfer, setSelectedWorkForTransfer] = useState(null);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [downloadingHash, setDownloadingHash] = useState(null);

  // Tải danh sách tác phẩm của ví đang kết nối
  const loadWorks = useCallback(async () => {
    if (!account) return;
    setIsLoading(true);
    try {
      const data = await fetchWorksByOwner(account);
      setWorks(data);
    } catch (err) {
      console.error("Lỗi khi tải tác phẩm:", err);
      toast.error("Không thể tải danh sách tác phẩm từ mạng Sepolia.");
    } finally {
      setIsLoading(false);
    }
  }, [account]);

  useEffect(() => {
    if (account) {
      loadWorks();
    } else {
      setWorks([]);
      setIsLoading(false);
    }
  }, [account, loadWorks]);

  // Lọc tác phẩm theo ô tìm kiếm
  const filteredWorks = works.filter((w) =>
    w.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCopy = async (text, label) => {
    const ok = await copyToClipboard(text);
    if (ok) toast.success(`Đã sao chép ${label}!`);
  };

  const handleDownloadPDF = async (work) => {
    setDownloadingHash(work.fileHash);
    try {
      toast.loading("Đang xuất file Giấy chứng nhận PDF...", { id: "pdf-item" });
      await generateCertificatePDF(work);
      toast.success("Tải Giấy chứng nhận thành công!", { id: "pdf-item" });
    } catch (err) {
      console.error("Lỗi tải PDF:", err);
      toast.error("Lỗi khi tạo PDF: " + err.message, { id: "pdf-item" });
    } finally {
      setDownloadingHash(null);
    }
  };

  const handleOpenTransfer = (work) => {
    setSelectedWorkForTransfer(work);
    setIsTransferModalOpen(true);
  };

  // NẾU CHƯA KẾT NỐI VÍ: HIỂN THỊ THẺ MỜI KẾT NỐI
  if (!account) {
    return (
      <div className="max-w-xl mx-auto py-12">
        <div className="glass-card rounded-3xl p-8 sm:p-10 text-center space-y-6">
          <div className="w-16 h-16 rounded-3xl bg-blue-50 dark:bg-[#003399]/20 border border-blue-200 dark:border-[#003399]/40 text-[#0052CC] dark:text-[#38BDF8] mx-auto flex items-center justify-center">
            <Wallet className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Xem tác phẩm của bạn</h2>
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed max-w-md mx-auto">
              Vui lòng kết nối ví MetaMask để xem danh mục tất cả tác phẩm số đã được xác thực quyền sở hữu của bạn.
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

  return (
    <div className="space-y-8">
      {/* HEADER & TÌM KIẾM */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 sm:gap-6 border-b border-slate-200 dark:border-white/10 pb-4 sm:pb-6">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 dark:bg-[#0066CC]/15 border border-blue-200 dark:border-[#0066CC]/35 text-[#0066CC] dark:text-[#93C5FD] text-[11px] sm:text-xs font-semibold">
            <FolderOpen className="w-3.5 h-3.5" />
            <span>Bộ sưu tập cá nhân ({works.length} tác phẩm)</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">Tác Phẩm Của Tôi</h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Quản lý quyền sở hữu, xuất giấy chứng nhận PDF và thực hiện chuyển nhượng bản quyền.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3">
          {/* Ô tìm kiếm */}
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm theo tên tác phẩm..."
              className="w-full glass-input pl-10 pr-4 py-2.5 rounded-xl text-xs sm:text-sm placeholder:text-slate-400"
            />
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* Nút làm mới danh sách */}
            <button
              onClick={loadWorks}
              disabled={isLoading}
              className="p-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 hover:bg-slate-50 dark:hover:bg-white/10 text-slate-600 dark:text-slate-300 transition disabled:opacity-50 flex-shrink-0"
              title="Làm mới dữ liệu từ Blockchain"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
            </button>

            {/* Nút đăng ký mới */}
            <Link
              to="/register"
              className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl btn-primary text-xs sm:text-sm font-semibold flex items-center justify-center gap-1.5 transition active:scale-95 shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Đăng ký mới</span>
            </Link>
          </div>
        </div>
      </div>

      {/* DANH SÁCH TÁC PHẨM */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
      ) : filteredWorks.length === 0 ? (
        /* Empty State */
        <div className="glass-card rounded-3xl p-12 text-center space-y-5 max-w-lg mx-auto">
          <div className="w-16 h-16 rounded-3xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-400 mx-auto flex items-center justify-center">
            <FolderOpen className="w-8 h-8" />
          </div>

          <div className="space-y-1.5">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">
              {searchTerm ? "Không tìm thấy tác phẩm phù hợp" : "Chưa có tác phẩm nào"}
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
              {searchTerm
                ? `Không có tác phẩm nào khớp với từ khoá "${searchTerm}". Hãy thử từ khoá khác.`
                : "Địa chỉ ví của bạn hiện chưa sở hữu bất kỳ chứng nhận bản quyền nào trên CopyrightChain."}
            </p>
          </div>

          {!searchTerm && (
            <Link
              to="/register"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl btn-primary text-sm font-semibold transition active:scale-95 shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Đăng ký tác phẩm đầu tiên</span>
            </Link>
          )}
        </div>
      ) : (
        /* Lưới các thẻ tác phẩm */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredWorks.map((work) => (
            <motion.div
              key={work.fileHash}
              layout
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              className="glass-card glass-card-hover rounded-3xl p-6 flex flex-col justify-between space-y-5 relative overflow-hidden"
            >
              <div className="space-y-3">
                {/* Header card: Icon + Ngày */}
                <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                  <div className="flex items-center gap-1.5 text-[#0066CC] dark:text-[#38BDF8] font-mono font-medium">
                    <FileCheck2 className="w-4 h-4" />
                    <span>On-Chain</span>
                  </div>
                  <div className="flex items-center gap-1 text-[11px]">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>{formatTimestamp(work.timestamp)}</span>
                  </div>
                </div>

                {/* Tên tác phẩm */}
                <h3 className="text-lg font-bold text-slate-900 dark:text-white line-clamp-2 leading-snug">
                  {work.title}
                </h3>

                {/* Mô tả ngắn */}
                {work.description && (
                  <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed">
                    {work.description}
                  </p>
                )}

                {/* Mã Hash */}
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-black/40 border border-slate-200 dark:border-white/5 space-y-1">
                  <div className="flex justify-between items-center text-[10px] text-slate-400">
                    <span>MÃ BĂM SHA-256</span>
                    <button
                      onClick={() => handleCopy(work.fileHash, "mã băm")}
                      className="text-[#0066CC] dark:text-[#38BDF8] hover:underline flex items-center gap-0.5 font-medium"
                    >
                      <Copy className="w-2.5 h-2.5" /> Chép
                    </button>
                  </div>
                  <p className="font-mono text-xs text-[#0066CC] dark:text-[#38BDF8] truncate font-medium">
                    {formatHash(work.fileHash, 14, 10)}
                  </p>
                </div>
              </div>

              {/* Hàng nút thao tác: PDF & Chuyển quyền */}
              <div className="pt-3 border-t border-slate-200 dark:border-white/5 grid grid-cols-2 gap-2 text-xs">
                <button
                  onClick={() => handleDownloadPDF(work)}
                  disabled={downloadingHash === work.fileHash}
                  className="px-3 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 text-slate-700 dark:text-slate-200 font-medium flex items-center justify-center gap-1.5 transition active:scale-95 disabled:opacity-50"
                  title="Xuất file PDF Giấy chứng nhận"
                >
                  {downloadingHash === work.fileHash ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Download className="w-3.5 h-3.5 text-[#0066CC] dark:text-[#38BDF8]" />
                  )}
                  <span>Chứng nhận</span>
                </button>

                <button
                  onClick={() => handleOpenTransfer(work)}
                  className="px-3 py-2.5 rounded-xl bg-blue-50 dark:bg-[#0066CC]/20 hover:bg-blue-100 dark:hover:bg-[#0066CC]/30 text-[#0052CC] dark:text-[#93C5FD] font-medium flex items-center justify-center gap-1.5 transition border border-blue-200 dark:border-[#0066CC]/35 active:scale-95"
                  title="Chuyển nhượng quyền sở hữu sang ví khác"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Chuyển quyền</span>
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* MODAL CHUYỂN QUYỀN SỞ HỮU */}
      <TransferModal
        isOpen={isTransferModalOpen}
        onClose={() => setIsTransferModalOpen(false)}
        work={selectedWorkForTransfer}
        signer={signer}
        currentAccount={account}
        onSuccess={loadWorks}
      />
    </div>
  );
}

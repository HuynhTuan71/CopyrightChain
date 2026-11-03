import React, { useState } from "react";
import { ethers } from "ethers";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, ArrowRight, CheckCircle2, Loader2, X, Send } from "lucide-react";
import toast from "react-hot-toast";
import { getSignerContract } from "../utils/contract";
import { formatAddress } from "../utils/format";

export default function TransferModal({ isOpen, onClose, work, signer, currentAccount, onSuccess }) {
  const [newOwner, setNewOwner] = useState("");
  const [isConfirmStep, setIsConfirmStep] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen || !work) return null;

  const handleValidateAndProceed = (e) => {
    e.preventDefault();
    const cleanAddress = newOwner.trim();

    if (!cleanAddress) {
      toast.error("Vui lòng nhập địa chỉ ví người nhận.");
      return;
    }

    if (!ethers.isAddress(cleanAddress)) {
      toast.error("Địa chỉ ví Ethereum không hợp lệ!");
      return;
    }

    if (cleanAddress.toLowerCase() === currentAccount.toLowerCase()) {
      toast.error("Địa chỉ người nhận phải khác địa chỉ ví hiện tại của bạn!");
      return;
    }

    setIsConfirmStep(true);
  };

  const handleExecuteTransfer = async () => {
    if (!signer) {
      toast.error("Không tìm thấy kết nối ví!");
      return;
    }

    setIsLoading(true);
    try {
      const contract = getSignerContract(signer);
      toast.loading("Vui lòng xác nhận giao dịch trên MetaMask...", { id: "transfer-tx" });

      const tx = await contract.transferOwnership(work.fileHash, newOwner.trim());
      toast.loading("Đang ghi nhận giao dịch chuyển nhượng lên Sepolia...", { id: "transfer-tx" });

      await tx.wait(1);
      toast.success("Chuyển nhượng quyền sở hữu bản quyền thành công!", { id: "transfer-tx" });

      if (onSuccess) onSuccess();
      handleClose();
    } catch (err) {
      console.error("Lỗi khi chuyển quyền sở hữu:", err);
      let errorMsg = "Giao dịch chuyển nhượng thất bại.";
      if (err.code === 4001 || err.action === "sendTransaction") {
        errorMsg = "Bạn đã từ chối ký giao dịch.";
      } else if (err.reason) {
        errorMsg = err.reason;
      }
      toast.error(errorMsg, { id: "transfer-tx" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (isLoading) return;
    setNewOwner("");
    setIsConfirmStep(false);
    onClose();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 dark:bg-black/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="relative w-full max-w-lg bg-white dark:bg-[#061129] border border-slate-200 dark:border-white/15 rounded-2xl p-6 shadow-2xl"
        >
          {/* Nút đóng */}
          <button
            onClick={handleClose}
            disabled={isLoading}
            className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-white/5 transition"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Tiêu đề Modal */}
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 rounded-xl bg-blue-50 dark:bg-[#003399]/20 border border-blue-200 dark:border-[#0066CC]/35 text-[#0066CC] dark:text-[#38BDF8]">
              <Send className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">Chuyển nhượng Bản quyền</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Tác phẩm: <span className="font-medium text-slate-900 dark:text-white">{work.title}</span></p>
            </div>
          </div>

          {!isConfirmStep ? (
            /* BƯỚC 1: Nhập địa chỉ ví */
            <form onSubmit={handleValidateAndProceed} className="space-y-4">
              <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 flex gap-3 text-amber-800 dark:text-amber-300 text-xs">
                <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5 text-amber-500" />
                <p>
                  <strong>Lưu ý quan trọng:</strong> Hành động này sẽ chuyển vĩnh viễn quyền sở hữu tác phẩm sang địa chỉ ví mới. Bạn sẽ không còn quyền quản lý tác phẩm này.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  Địa chỉ ví người nhận (Ethereum Address)
                </label>
                <input
                  type="text"
                  value={newOwner}
                  onChange={(e) => setNewOwner(e.target.value)}
                  placeholder="0x..."
                  className="w-full glass-input px-4 py-3 rounded-xl font-mono text-sm placeholder:text-slate-400"
                  autoFocus
                />
              </div>

              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/5 text-sm font-medium text-slate-700 dark:text-slate-300 transition"
                >
                  Huỷ bỏ
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl btn-primary text-sm font-semibold flex items-center gap-2 transition shadow-sm"
                >
                  Tiếp tục <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </form>
          ) : (
            /* BƯỚC 2: Xác nhận hành động */
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 text-red-700 dark:text-red-300 text-xs flex gap-3">
                <AlertTriangle className="w-5 h-5 flex-shrink-0 text-red-500 mt-0.5" />
                <div>
                  <p className="font-semibold text-red-800 dark:text-red-200">Xác nhận hành động KHÔNG THỂ HOÀN TÁC</p>
                  <p className="mt-1">
                    Bạn có chắc chắn muốn chuyển giao tác phẩm <span className="font-bold text-slate-900 dark:text-white">"{work.title}"</span> từ ví của bạn sang ví mới dưới đây?
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 space-y-2 text-xs">
                <div className="flex justify-between items-center text-slate-500 dark:text-slate-400">
                  <span>Chủ sở hữu hiện tại:</span>
                  <span className="font-mono text-slate-800 dark:text-slate-200">{formatAddress(currentAccount, 8, 6)}</span>
                </div>
                <div className="flex justify-between items-center text-slate-500 dark:text-slate-400">
                  <span>Chủ sở hữu mới:</span>
                  <span className="font-mono text-[#0066CC] dark:text-[#38BDF8] font-bold break-all">{newOwner}</span>
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-3">
                <button
                  type="button"
                  disabled={isLoading}
                  onClick={() => setIsConfirmStep(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/5 text-sm font-medium text-slate-700 dark:text-slate-300 transition"
                >
                  Quay lại
                </button>
                <button
                  type="button"
                  disabled={isLoading}
                  onClick={handleExecuteTransfer}
                  className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-sm font-semibold text-white shadow-sm flex items-center gap-2 transition disabled:opacity-50"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Đang xử lý...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      Xác nhận chuyển quyền
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

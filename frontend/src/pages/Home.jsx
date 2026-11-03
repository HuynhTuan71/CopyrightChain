import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ShieldCheck,
  FileCheck2,
  Lock,
  Search,
  Upload,
  Cpu,
  Database,
  ArrowRight,
  Sparkles,
  Layers,
  Clock,
  Share2,
} from "lucide-react";
import StatCounter from "../components/StatCounter";
import { fetchTotalWorks } from "../utils/contract";

export default function Home() {
  const [totalWorks, setTotalWorks] = useState(0);
  const [isLoadingStats, setIsLoadingStats] = useState(true);

  useEffect(() => {
    async function loadStats() {
      try {
        const count = await fetchTotalWorks();
        setTotalWorks(count);
      } catch (err) {
        console.error("Lỗi tải thống kê:", err);
      } finally {
        setIsLoadingStats(false);
      }
    }
    loadStats();
  }, []);

  return (
    <div className="space-y-16 sm:space-y-24 md:space-y-32">
      {/* ================================================================= */}
      {/* 1. HERO SECTION (Tối ưu cho cả Mobile và Desktop)                 */}
      {/* ================================================================= */}
      <section className="relative pt-2 sm:pt-6 md:pt-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* Cột trái: Tiêu đề & Kêu gọi hành động */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="lg:col-span-7 space-y-4 sm:space-y-6 text-left"
          >
            {/* Tag nhỏ trên đầu */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 dark:bg-[#0066CC]/15 border border-blue-200 dark:border-[#0066CC]/35 text-[#0066CC] dark:text-[#38BDF8] text-[11px] sm:text-xs font-semibold leading-normal max-w-full">
              <Sparkles className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="truncate sm:whitespace-normal">Chuẩn băm SHA-256 & Smart Contract Sepolia</span>
            </div>

            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-tight sm:leading-[1.15] text-slate-900 dark:text-white">
              Bảo vệ bản quyền <br className="hidden sm:inline" />
              <span className="text-gradient">tác phẩm số của bạn</span> <br className="hidden sm:inline" />
              trên Blockchain
            </h1>

            <p className="text-sm sm:text-lg text-slate-600 dark:text-slate-300 max-w-xl leading-relaxed">
              Tạo chứng nhận sở hữu tác phẩm số không thể chối cãi. File gốc của bạn
              <strong> không bao giờ rời khỏi trình duyệt</strong>; chỉ mã băm SHA-256
              và bằng chứng thời gian được ghi vĩnh viễn trên mạng Ethereum Sepolia.
            </p>

            {/* Các nút bấm hành động chính */}
            <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
              <Link
                to="/register"
                className="w-full sm:w-auto px-6 py-3.5 rounded-xl btn-primary font-semibold text-center flex items-center justify-center gap-2.5 transition active:scale-95 shadow-sm text-sm sm:text-base"
              >
                <Upload className="w-4 h-4" />
                <span>Đăng ký bản quyền</span>
                <ArrowRight className="w-4 h-4" />
              </Link>

              <Link
                to="/verify"
                className="w-full sm:w-auto px-6 py-3.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 text-slate-700 dark:text-slate-200 font-semibold text-center flex items-center justify-center gap-2 transition shadow-sm text-sm sm:text-base"
              >
                <Search className="w-4 h-4 text-[#0066CC] dark:text-[#38BDF8]" />
                <span>Xác minh tác phẩm</span>
              </Link>
            </div>

            {/* Thông tin nhanh về an toàn */}
            <div className="pt-2 flex flex-wrap items-center gap-4 sm:gap-6 text-xs text-slate-500 dark:text-slate-400">
              <div className="flex items-center gap-1.5">
                <Lock className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                <span>Bảo mật 100% Client-side</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Database className="w-4 h-4 text-[#0066CC] dark:text-[#38BDF8] flex-shrink-0" />
                <span>Không lưu file trên Server</span>
              </div>
            </div>
          </motion.div>

          {/* Cột phải: Thẻ demo On-chain */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="lg:col-span-5 relative mt-4 lg:mt-0"
          >
            <div className="relative mx-auto max-w-md w-full">
              <div className="relative glass-card rounded-2xl sm:rounded-3xl p-5 sm:p-7 space-y-4 sm:space-y-5 overflow-hidden">
                {/* Header card */}
                <div className="flex items-center justify-between border-b border-slate-200 dark:border-white/10 pb-3 sm:pb-4">
                  <div className="flex items-center gap-2.5 sm:gap-3">
                    <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-blue-50 dark:bg-[#0066CC]/20 border border-blue-200 dark:border-[#0066CC]/40 flex items-center justify-center text-[#0066CC] dark:text-[#38BDF8]">
                      <FileCheck2 className="w-4 h-4 sm:w-5 sm:h-5" />
                    </div>
                    <div>
                      <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate max-w-[160px] sm:max-w-none">Chung_Nhan_So_01.png</h4>
                      <p className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400">4.2 MB • Đã băm SHA-256</p>
                    </div>
                  </div>
                  <span className="flex items-center gap-1 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[11px] sm:text-xs font-semibold">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
                    Hợp lệ
                  </span>
                </div>

                {/* Khung mã băm SHA-256 */}
                <div className="space-y-1">
                  <div className="flex justify-between items-center text-[11px] sm:text-xs">
                    <span className="text-slate-500 dark:text-slate-400 font-medium">Mã băm SHA-256 (32 bytes):</span>
                    <span className="text-[10px] text-[#0066CC] dark:text-[#38BDF8] font-mono font-semibold">BẤT BIẾN</span>
                  </div>
                  <div className="p-2.5 sm:p-3 rounded-xl bg-slate-100 dark:bg-black/40 border border-slate-200 dark:border-white/10 font-mono text-[11px] sm:text-xs text-[#0066CC] dark:text-[#38BDF8] break-all leading-relaxed">
                    0x7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069
                  </div>
                </div>

                {/* Metadata của tác phẩm */}
                <div className="grid grid-cols-2 gap-2 sm:gap-3 text-xs">
                  <div className="p-2.5 sm:p-3 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 space-y-0.5 sm:space-y-1">
                    <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1 text-[11px]">
                      <Clock className="w-3 h-3 text-[#0066CC] dark:text-[#60A5FA]" /> Thời gian block
                    </span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200 text-xs">Vừa đăng ký</span>
                  </div>
                  <div className="p-2.5 sm:p-3 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 space-y-0.5 sm:space-y-1">
                    <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1 text-[11px]">
                      <Layers className="w-3 h-3 text-[#0066CC] dark:text-[#38BDF8]" /> Mạng
                    </span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200 text-xs">Sepolia Testnet</span>
                  </div>
                </div>

                {/* Huy hiệu bảo chứng */}
                <div className="p-2.5 sm:p-3 rounded-xl bg-blue-50 dark:bg-[#003399]/25 border border-blue-200 dark:border-[#0066CC]/30 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <ShieldCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#0066CC] dark:text-[#38BDF8]" />
                    <span className="font-medium text-slate-800 dark:text-slate-200 text-[11px] sm:text-xs">Chứng nhận bản quyền số</span>
                  </div>
                  <span className="text-[#0052CC] dark:text-[#38BDF8] font-bold text-[11px] sm:text-xs">100% On-Chain</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ================================================================= */}
      {/* 2. THANH THỐNG KÊ (STATS BAR)                                     */}
      {/* ================================================================= */}
      <section>
        <div className="glass-card rounded-2xl p-4 sm:p-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-6 text-center">
            {/* Stat 1: Tổng tác phẩm */}
            <div className="p-3 sm:p-4 rounded-xl bg-slate-50/70 dark:bg-white/[0.02] border border-slate-200/60 dark:border-white/5">
              <p className="text-2xl sm:text-4xl font-extrabold text-[#0052CC] dark:text-[#38BDF8]">
                {isLoadingStats ? "..." : <StatCounter value={totalWorks} />}
              </p>
              <p className="text-[11px] sm:text-sm text-slate-500 dark:text-slate-400 mt-1 font-medium">Tác phẩm đã đăng ký</p>
            </div>

            {/* Stat 2: Thuật toán */}
            <div className="p-3 sm:p-4 rounded-xl bg-slate-50/70 dark:bg-white/[0.02] border border-slate-200/60 dark:border-white/5">
              <p className="text-2xl sm:text-4xl font-extrabold text-slate-900 dark:text-white font-mono">
                SHA-256
              </p>
              <p className="text-[11px] sm:text-sm text-slate-500 dark:text-slate-400 mt-1 font-medium">Chuẩn mã hoá mật mã</p>
            </div>

            {/* Stat 3: Mạng Blockchain */}
            <div className="p-3 sm:p-4 rounded-xl bg-slate-50/70 dark:bg-white/[0.02] border border-slate-200/60 dark:border-white/5">
              <p className="text-2xl sm:text-4xl font-extrabold text-[#0052CC] dark:text-[#38BDF8]">
                Sepolia
              </p>
              <p className="text-[11px] sm:text-sm text-slate-500 dark:text-slate-400 mt-1 font-medium">Ethereum PoS Testnet</p>
            </div>

            {/* Stat 4: Kiến trúc */}
            <div className="p-3 sm:p-4 rounded-xl bg-slate-50/70 dark:bg-white/[0.02] border border-slate-200/60 dark:border-white/5">
              <p className="text-2xl sm:text-4xl font-extrabold text-emerald-600 dark:text-emerald-400">
                100%
              </p>
              <p className="text-[11px] sm:text-sm text-slate-500 dark:text-slate-400 mt-1 font-medium">Phi tập trung, không Server</p>
            </div>
          </div>
        </div>
      </section>

      {/* ================================================================= */}
      {/* 3. HOẠT ĐỘNG NHƯ THẾ NÀO (3 BƯỚC)                                  */}
      {/* ================================================================= */}
      <section className="space-y-8 sm:space-y-12">
        <div className="text-center space-y-2 sm:space-y-3 px-2">
          <span className="text-xs font-bold uppercase tracking-wider text-[#0066CC] dark:text-[#38BDF8]">Quy trình đơn giản & an toàn</span>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 dark:text-white">Hoạt động như thế nào?</h2>
          <p className="text-xs sm:text-base text-slate-500 dark:text-slate-400 max-w-xl mx-auto leading-relaxed">
            Hệ thống kết hợp sức mạnh của Web Crypto API và Smart Contract để bảo vệ tài sản số chỉ trong 3 bước.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-8 relative">
          {/* Bước 1 */}
          <div className="glass-card glass-card-hover rounded-2xl p-5 sm:p-7 flex flex-col items-center text-center space-y-3 sm:space-y-4">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-blue-50 dark:bg-[#003399]/20 border border-blue-200 dark:border-[#003399]/40 text-[#0052CC] dark:text-[#38BDF8] flex items-center justify-center font-bold text-xl">
              <Upload className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div className="space-y-1.5 sm:space-y-2">
              <div className="inline-block px-2.5 py-0.5 rounded text-[10px] font-bold uppercase bg-blue-100 dark:bg-[#003399]/30 text-[#0052CC] dark:text-[#93C5FD]">
                Bước 1
              </div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">Chọn file tác phẩm</h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Bạn kéo thả hình ảnh, bài hát, video hoặc tài liệu vào trình duyệt. File hoàn toàn được giữ lại trên máy bạn.
              </p>
            </div>
          </div>

          {/* Bước 2 */}
          <div className="glass-card glass-card-hover rounded-2xl p-5 sm:p-7 flex flex-col items-center text-center space-y-3 sm:space-y-4">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-blue-50 dark:bg-[#0066CC]/20 border border-blue-200 dark:border-[#0066CC]/40 text-[#0052CC] dark:text-[#38BDF8] flex items-center justify-center font-bold text-xl">
              <Cpu className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div className="space-y-1.5 sm:space-y-2">
              <div className="inline-block px-2.5 py-0.5 rounded text-[10px] font-bold uppercase bg-blue-100 dark:bg-[#0066CC]/30 text-[#0052CC] dark:text-[#93C5FD]">
                Bước 2
              </div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">Băm SHA-256 trên trình duyệt</h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Web Crypto API tính toán mã băm nhị phân 32 bytes duy nhất của file. Không ai có thể suy ngược ra nội dung gốc từ mã băm này.
              </p>
            </div>
          </div>

          {/* Bước 3 */}
          <div className="glass-card glass-card-hover rounded-2xl p-5 sm:p-7 flex flex-col items-center text-center space-y-3 sm:space-y-4">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-blue-50 dark:bg-[#2979FF]/20 border border-blue-200 dark:border-[#2979FF]/40 text-[#0052CC] dark:text-[#38BDF8] flex items-center justify-center font-bold text-xl">
              <Database className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div className="space-y-1.5 sm:space-y-2">
              <div className="inline-block px-2.5 py-0.5 rounded text-[10px] font-bold uppercase bg-blue-100 dark:bg-[#2979FF]/30 text-[#0052CC] dark:text-[#93C5FD]">
                Bước 3
              </div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">Ghi lên Blockchain Sepolia</h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Mã hash cùng tiêu đề, địa chỉ ví và dấu mốc thời gian (timestamp) được ghi vĩnh viễn vào Smart Contract, tạo bằng chứng sở hữu pháp lý số.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ================================================================= */}
      {/* 4. VÌ SAO TIN CẬY (4 CARDS)                                       */}
      {/* ================================================================= */}
      <section className="space-y-8 sm:space-y-12">
        <div className="text-center space-y-2 sm:space-y-3 px-2">
          <span className="text-xs font-bold uppercase tracking-wider text-[#0066CC] dark:text-[#38BDF8]">Ưu điểm vượt trội</span>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 dark:text-white">Vì sao bạn có thể hoàn toàn tin cậy?</h2>
          <p className="text-xs sm:text-base text-slate-500 dark:text-slate-400 max-w-xl mx-auto leading-relaxed">
            Không lo rò rỉ ý tưởng, không sợ bị đánh cắp bản quyền và không phụ thuộc vào bất kỳ bên trung gian nào.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          {/* Card 1 */}
          <div className="glass-card glass-card-hover p-5 sm:p-7 rounded-2xl flex gap-3.5 sm:gap-5 items-start">
            <div className="p-2.5 sm:p-3.5 rounded-xl bg-blue-50 dark:bg-[#003399]/20 border border-blue-200 dark:border-[#003399]/40 text-[#0052CC] dark:text-[#38BDF8] flex-shrink-0">
              <Lock className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">File không bao giờ rời máy bạn</h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Khác với các dịch vụ lưu trữ đám mây truyền thống, CopyrightChain không bao giờ tải file của bạn lên mạng. Bạn giữ 100% quyền riêng tư và tài sản trí tuệ.
              </p>
            </div>
          </div>

          {/* Card 2 */}
          <div className="glass-card glass-card-hover p-5 sm:p-7 rounded-2xl flex gap-3.5 sm:gap-5 items-start">
            <div className="p-2.5 sm:p-3.5 rounded-xl bg-blue-50 dark:bg-[#0066CC]/20 border border-blue-200 dark:border-[#0066CC]/40 text-[#0052CC] dark:text-[#60A5FA] flex-shrink-0">
              <Clock className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">Bất biến theo thời gian (Timestamped)</h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Thời gian đăng ký được lưu trực tiếp vào block của Ethereum. Bất kỳ ai cố tình đăng ký lại một file tương tự sau đó đều bị hệ thống phát hiện và từ chối.
              </p>
            </div>
          </div>

          {/* Card 3 */}
          <div className="glass-card glass-card-hover p-5 sm:p-7 rounded-2xl flex gap-3.5 sm:gap-5 items-start">
            <div className="p-2.5 sm:p-3.5 rounded-xl bg-blue-50 dark:bg-[#2979FF]/20 border border-blue-200 dark:border-[#2979FF]/40 text-[#0052CC] dark:text-[#38BDF8] flex-shrink-0">
              <Search className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">Xác minh công khai không cần đăng nhập</h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Người mua, đối tác hoặc công chúng có thể tự kiểm chứng quyền sở hữu và tính toàn vẹn của tác phẩm ngay trên trình duyệt mà không cần cài MetaMask hay có ví điện tử.
              </p>
            </div>
          </div>

          {/* Card 4 */}
          <div className="glass-card glass-card-hover p-5 sm:p-7 rounded-2xl flex gap-3.5 sm:gap-5 items-start">
            <div className="p-2.5 sm:p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex-shrink-0">
              <Share2 className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">Chuyển nhượng quyền sở hữu minh bạch</h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Khi bán tác phẩm hoặc chuyển giao bản quyền, bạn có thể chuyển quyền sở hữu sang ví người mua trực tiếp trên Smart Contract với thuật toán swap-and-pop tiết kiệm gas.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ================================================================= */}
      {/* 5. CALL TO ACTION                                                 */}
      {/* ================================================================= */}
      <section className="relative overflow-hidden rounded-2xl sm:rounded-3xl glass-card bg-gradient-to-br from-blue-50/80 to-slate-50 dark:from-[#071329] dark:to-[#040B1A] p-6 sm:p-12 text-center space-y-4 sm:space-y-6">
        <h2 className="text-xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 dark:text-white">
          Sẵn sàng bảo vệ tác phẩm số đầu tiên của bạn?
        </h2>
        <p className="text-xs sm:text-base text-slate-600 dark:text-slate-300 max-w-xl mx-auto leading-relaxed">
          Chỉ mất chưa đầy 30 giây để xác lập bản quyền không thể xóa bỏ trên Ethereum Sepolia.
        </p>
        <div className="pt-2 flex justify-center">
          <Link
            to="/register"
            className="w-full sm:w-auto px-8 py-3.5 rounded-xl btn-primary font-bold shadow-md transition active:scale-95 flex items-center justify-center gap-2 text-sm sm:text-base"
          >
            <span>Bắt đầu đăng ký ngay</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}

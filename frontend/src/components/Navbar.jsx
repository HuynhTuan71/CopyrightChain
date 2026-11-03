import React, { useState, useRef, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Shield, Wallet, Copy, ExternalLink, LogOut, ChevronDown, Menu, X, AlertCircle, Sun, Moon } from "lucide-react";
import toast from "react-hot-toast";
import { useWallet } from "../context/WalletContext";
import { useTheme } from "../context/ThemeContext";
import { formatAddress, copyToClipboard, getEtherscanAddressUrl } from "../utils/format";

export default function Navbar() {
  const {
    account,
    balance,
    isConnecting,
    isCorrectNetwork,
    connectWallet,
    disconnectWallet,
    switchToSepolia,
  } = useWallet();

  const { theme, toggleTheme, isDark } = useTheme();
  const location = useLocation();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Đóng dropdown khi click bên ngoài
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Đóng menu mobile khi chuyển route
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const navLinks = [
    { name: "Trang chủ", path: "/" },
    { name: "Đăng ký", path: "/register" },
    { name: "Xác minh", path: "/verify" },
    { name: "Tác phẩm của tôi", path: "/my-works" },
  ];

  const handleCopy = async () => {
    const success = await copyToClipboard(account);
    if (success) {
      toast.success("Đã sao chép địa chỉ ví!");
    }
    setDropdownOpen(false);
  };

  return (
    <nav className="sticky top-0 z-50 w-full backdrop-blur-xl bg-white/95 dark:bg-[#040B1A]/95 border-b border-slate-200 dark:border-white/[0.08] transition-colors duration-250">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          {/* Logo & Tên dự án */}
          <Link to="/" className="flex items-center gap-2.5 sm:gap-3 group">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-[#0052CC] p-0.5 shadow-sm transition-transform group-hover:scale-105 flex items-center justify-center flex-shrink-0">
              <Shield className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-base sm:text-xl tracking-tight text-slate-900 dark:text-white leading-tight">
                Copyright<span className="text-[#0066CC] dark:text-[#38BDF8]">Chain</span>
              </span>
              <span className="text-[9px] sm:text-[10px] uppercase tracking-wider sm:tracking-widest text-slate-500 dark:text-[#93C5FD] font-semibold">
                Bản quyền Blockchain
              </span>
            </div>
          </Link>

          {/* Menu máy tính (Desktop Links) */}
          <div className="hidden md:flex items-center gap-1 bg-slate-100/90 dark:bg-white/[0.03] p-1.5 rounded-full border border-slate-200 dark:border-white/[0.06]">
            {navLinks.map((link) => {
              const isActive = location.pathname === link.path;
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                    isActive
                      ? "btn-primary shadow-sm"
                      : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-white/[0.04]"
                  }`}
                >
                  {link.name}
                </Link>
              );
            })}
          </div>

          {/* Khu vực ví người dùng & Nút đổi giao diện Sáng / Tối */}
          <div className="hidden md:flex items-center gap-3">
            {/* Nút chuyển Sáng / Tối */}
            <button
              onClick={toggleTheme}
              className="p-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.04] hover:bg-slate-100 dark:hover:bg-white/[0.08] text-slate-700 dark:text-slate-300 transition"
              title={isDark ? "Chuyển sang giao diện Sáng" : "Chuyển sang giao diện Tối"}
              aria-label="Toggle Theme"
            >
              {isDark ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-slate-700" />
              )}
            </button>

            {!account ? (
              <button
                onClick={connectWallet}
                disabled={isConnecting}
                className="px-5 py-2.5 rounded-xl btn-primary text-sm font-semibold transition active:scale-95 disabled:opacity-50"
              >
                <span className="flex items-center gap-2">
                  <Wallet className="w-4 h-4" />
                  {isConnecting ? "Đang kết nối..." : "Kết nối MetaMask"}
                </span>
              </button>
            ) : !isCorrectNetwork ? (
              <button
                onClick={switchToSepolia}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500/15 border border-amber-500/40 text-amber-600 dark:text-amber-300 text-sm font-medium hover:bg-amber-500/25 transition shadow-sm"
              >
                <AlertCircle className="w-4 h-4 animate-bounce text-amber-500" />
                <span>Đổi sang Sepolia</span>
              </button>
            ) : (
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center gap-3 pl-3 pr-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#071329] hover:bg-slate-50 dark:hover:bg-white/[0.08] transition shadow-sm"
                >
                  <div className="flex items-center gap-2">
                    <span className="relative flex h-2.5 w-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                    </span>
                    <span className="text-xs font-mono text-slate-600 dark:text-slate-300">
                      {parseFloat(balance).toFixed(3)} SEP
                    </span>
                  </div>

                  <div className="h-4 w-px bg-slate-200 dark:bg-white/10" />

                  <span className="text-sm font-mono font-medium text-slate-800 dark:text-white">
                    {formatAddress(account)}
                  </span>
                  <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${dropdownOpen ? "rotate-180" : ""}`} />
                </button>

                {/* Dropdown thông tin ví */}
                {dropdownOpen && (
                  <div className="absolute right-0 mt-2 w-72 bg-white dark:bg-[#061129] border border-slate-200 dark:border-white/15 rounded-2xl shadow-xl dark:shadow-2xl dark:shadow-black/80 p-2.5 z-50 animate-in fade-in slide-in-from-top-2">
                    <div className="px-3 py-2.5 rounded-xl bg-slate-100/80 dark:bg-white/[0.04] border border-slate-200 dark:border-white/5 mb-1.5">
                      <div className="flex items-center justify-between">
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Đã kết nối Sepolia</p>
                        <span className="flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                          Online
                        </span>
                      </div>
                      <p className="text-xs font-mono text-slate-900 dark:text-white truncate mt-1 select-all" title={account}>{account}</p>
                    </div>

                    <button
                      onClick={handleCopy}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/10 transition"
                    >
                      <Copy className="w-3.5 h-3.5 text-[#0066CC] dark:text-[#38BDF8]" />
                      Sao chép địa chỉ ví
                    </button>

                    <a
                      href={getEtherscanAddressUrl(account)}
                      target="_blank"
                      rel="noreferrer"
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/10 transition"
                    >
                      <ExternalLink className="w-3.5 h-3.5 text-[#0066CC] dark:text-[#38BDF8]" />
                      Xem trên Sepolia Etherscan
                    </a>

                    <div className="h-px bg-slate-200 dark:bg-white/10 my-1.5" />

                    <button
                      onClick={() => {
                        disconnectWallet();
                        setDropdownOpen(false);
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/15 transition"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      Ngắt kết nối
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Nút Hamburger & Toggle Theme cho Mobile */}
          <div className="flex md:hidden items-center gap-1.5">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-slate-700 dark:text-slate-300 active:scale-95 transition"
              title={isDark ? "Chuyển sang giao diện Sáng" : "Chuyển sang giao diện Tối"}
              aria-label="Toggle Theme"
            >
              {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-700" />}
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-slate-700 dark:text-slate-300 active:scale-95 transition"
              aria-label="Menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Menu thả xuống trên Mobile */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white dark:bg-[#040B1A] border-t border-slate-200 dark:border-white/[0.08] px-4 pt-3 pb-6 space-y-3 shadow-2xl animate-in slide-in-from-top-2">
          {/* Danh sách liên kết điều hướng */}
          <div className="flex flex-col space-y-1">
            {navLinks.map((link) => {
              const isActive = location.pathname === link.path;
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`px-4 py-2.5 rounded-xl text-sm font-medium transition ${
                    isActive
                      ? "bg-[#0052CC]/10 text-[#0052CC] dark:bg-[#0066CC]/20 dark:text-[#38BDF8] font-bold"
                      : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5"
                  }`}
                >
                  {link.name}
                </Link>
              );
            })}
          </div>

          {/* Vùng ví trên Mobile */}
          <div className="pt-2 border-t border-slate-200 dark:border-white/10">
            {!account ? (
              <button
                onClick={connectWallet}
                disabled={isConnecting}
                className="w-full py-3 rounded-xl btn-primary text-sm font-semibold flex items-center justify-center gap-2 shadow-sm"
              >
                <Wallet className="w-4 h-4" />
                {isConnecting ? "Đang kết nối..." : "Kết nối MetaMask"}
              </button>
            ) : !isCorrectNetwork ? (
              <button
                onClick={switchToSepolia}
                className="w-full py-3 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-300 text-sm font-medium border border-amber-500/30 flex items-center justify-center gap-2"
              >
                <AlertCircle className="w-4 h-4" />
                Chuyển sang mạng Sepolia
              </button>
            ) : (
              <div className="space-y-2 p-3 rounded-2xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/10">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500 dark:text-slate-400">Số dư ví:</span>
                  <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold">{parseFloat(balance).toFixed(3)} SEP</span>
                </div>
                <div className="text-xs font-mono text-slate-800 dark:text-slate-200 truncate py-1">
                  {account}
                </div>
                <div className="grid grid-cols-2 gap-2 pt-1 text-xs">
                  <button
                    onClick={handleCopy}
                    className="p-2 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 text-slate-700 dark:text-slate-300 flex items-center justify-center gap-1.5"
                  >
                    <Copy className="w-3.5 h-3.5 text-[#0066CC] dark:text-[#38BDF8]" />
                    <span>Sao chép</span>
                  </button>
                  <a
                    href={getEtherscanAddressUrl(account)}
                    target="_blank"
                    rel="noreferrer"
                    className="p-2 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 text-slate-700 dark:text-slate-300 flex items-center justify-center gap-1.5"
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-[#0066CC] dark:text-[#38BDF8]" />
                    <span>Etherscan</span>
                  </a>
                </div>
                <button
                  onClick={disconnectWallet}
                  className="w-full mt-1 py-2 text-xs text-rose-600 dark:text-rose-400 border border-rose-300 dark:border-rose-500/20 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-500/10 font-medium"
                >
                  Ngắt kết nối ví
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}

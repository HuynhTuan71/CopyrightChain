import React, { useState, useRef, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Shield, Wallet, Copy, ExternalLink, LogOut, ChevronDown, Menu, X, AlertCircle } from "lucide-react";
import toast from "react-hot-toast";
import { useWallet } from "../context/WalletContext";
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
    <nav className="sticky top-0 z-40 w-full backdrop-blur-xl bg-[#070B1A]/80 border-b border-white/[0.08] transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo & Tên dự án */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-blue via-brand-purple to-brand-cyan p-0.5 shadow-glow-blue transition-transform group-hover:scale-105">
              <div className="w-full h-full bg-[#070B1A] rounded-[10px] flex items-center justify-center">
                <Shield className="w-5 h-5 text-brand-cyan" />
              </div>
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent">
                Copyright<span className="text-brand-cyan">Chain</span>
              </span>
              <span className="text-[10px] uppercase tracking-widest text-slate-400 font-semibold -mt-1">
                Bảo quyền Blockchain
              </span>
            </div>
          </Link>

          {/* Menu máy tính (Desktop Links) */}
          <div className="hidden md:flex items-center gap-1 bg-white/[0.03] p-1.5 rounded-full border border-white/[0.06]">
            {navLinks.map((link) => {
              const isActive = location.pathname === link.path;
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                    isActive
                      ? "bg-gradient-to-r from-brand-blue/30 to-brand-purple/30 text-white border border-brand-blue/40 shadow-glow-blue"
                      : "text-slate-300 hover:text-white hover:bg-white/[0.04]"
                  }`}
                >
                  {link.name}
                </Link>
              );
            })}
          </div>

          {/* Khu vực ví người dùng (Desktop Wallet Area) */}
          <div className="hidden md:flex items-center gap-3">
            {!account ? (
              <button
                onClick={connectWallet}
                disabled={isConnecting}
                className="relative group overflow-hidden px-5 py-2.5 rounded-xl bg-gradient-to-r from-brand-blue via-brand-purple to-brand-cyan text-white text-sm font-semibold shadow-glow-blue hover:shadow-glow-purple transition-all active:scale-95 disabled:opacity-50"
              >
                <span className="relative flex items-center gap-2">
                  <Wallet className="w-4 h-4" />
                  {isConnecting ? "Đang kết nối..." : "Kết nối MetaMask"}
                </span>
              </button>
            ) : !isCorrectNetwork ? (
              <button
                onClick={switchToSepolia}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-300 text-sm font-medium hover:bg-amber-500/30 transition shadow-lg"
              >
                <AlertCircle className="w-4 h-4 animate-bounce text-amber-400" />
                <span>Đổi sang Sepolia</span>
              </button>
            ) : (
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center gap-3 pl-3 pr-2.5 py-1.5 rounded-xl glass-card hover:bg-white/[0.08] transition border-white/10"
                >
                  <div className="flex items-center gap-2">
                    <span className="relative flex h-2.5 w-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                    </span>
                    <span className="text-xs font-mono text-slate-300">
                      {parseFloat(balance).toFixed(3)} SEP
                    </span>
                  </div>

                  <div className="h-4 w-px bg-white/10" />

                  <span className="text-sm font-mono font-medium text-white">
                    {formatAddress(account)}
                  </span>
                  <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${dropdownOpen ? "rotate-180" : ""}`} />
                </button>

                {/* Dropdown thông tin ví */}
                {dropdownOpen && (
                  <div className="absolute right-0 mt-2 w-64 glass-card bg-[#0A1026]/95 border-white/10 rounded-2xl shadow-2xl p-2 z-50 animate-in fade-in slide-in-from-top-2">
                    <div className="px-3 py-2 border-b border-white/5 mb-1">
                      <p className="text-[11px] text-slate-400 font-medium">Đã kết nối với Sepolia</p>
                      <p className="text-xs font-mono text-white truncate mt-0.5">{account}</p>
                    </div>

                    <button
                      onClick={handleCopy}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-slate-200 hover:bg-white/5 hover:text-white transition"
                    >
                      <Copy className="w-3.5 h-3.5 text-brand-cyan" />
                      Sao chép địa chỉ ví
                    </button>

                    <a
                      href={getEtherscanAddressUrl(account)}
                      target="_blank"
                      rel="noreferrer"
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-slate-200 hover:bg-white/5 hover:text-white transition"
                    >
                      <ExternalLink className="w-3.5 h-3.5 text-brand-blue" />
                      Xem trên Sepolia Etherscan
                    </a>

                    <div className="h-px bg-white/5 my-1" />

                    <button
                      onClick={() => {
                        disconnectWallet();
                        setDropdownOpen(false);
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-rose-400 hover:bg-rose-500/10 transition"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      Ngắt kết nối
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Nút Hamburger cho Mobile */}
          <div className="flex md:hidden items-center gap-2">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg glass-card text-slate-300 hover:text-white transition"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Menu thả xuống trên Mobile */}
      {mobileMenuOpen && (
        <div className="md:hidden glass-card border-t border-white/[0.08] px-4 pt-3 pb-6 space-y-3">
          <div className="flex flex-col space-y-1">
            {navLinks.map((link) => {
              const isActive = location.pathname === link.path;
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`px-4 py-2.5 rounded-xl text-sm font-medium ${
                    isActive
                      ? "bg-brand-blue/20 text-brand-cyan border border-brand-blue/30"
                      : "text-slate-300 hover:text-white hover:bg-white/5"
                  }`}
                >
                  {link.name}
                </Link>
              );
            })}
          </div>

          <div className="pt-2 border-t border-white/10">
            {!account ? (
              <button
                onClick={connectWallet}
                disabled={isConnecting}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-brand-blue to-brand-purple text-white text-sm font-semibold flex items-center justify-center gap-2"
              >
                <Wallet className="w-4 h-4" />
                {isConnecting ? "Đang kết nối..." : "Kết nối MetaMask"}
              </button>
            ) : !isCorrectNetwork ? (
              <button
                onClick={switchToSepolia}
                className="w-full py-2.5 rounded-xl bg-amber-500/20 text-amber-300 text-sm font-medium border border-amber-500/30 flex items-center justify-center gap-2"
              >
                <AlertCircle className="w-4 h-4" />
                Chuyển sang mạng Sepolia
              </button>
            ) : (
              <div className="space-y-2">
                <div className="p-3 rounded-xl bg-white/[0.03] border border-white/10 flex items-center justify-between text-xs">
                  <span className="text-slate-400">Ví: {formatAddress(account)}</span>
                  <span className="font-mono text-emerald-400">{parseFloat(balance).toFixed(3)} SEP</span>
                </div>
                <button
                  onClick={disconnectWallet}
                  className="w-full py-2 text-xs text-rose-400 border border-rose-500/20 rounded-lg hover:bg-rose-500/10"
                >
                  Ngắt kết nối
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}

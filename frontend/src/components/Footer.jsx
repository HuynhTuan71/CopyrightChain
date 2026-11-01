import React from "react";
import { Link } from "react-router-dom";
import { Shield, ExternalLink, Github, Heart } from "lucide-react";
import { CONTRACT_ADDRESS } from "../utils/contract";
import { formatAddress, getEtherscanAddressUrl } from "../utils/format";

export default function Footer() {
  return (
    <footer className="w-full border-t border-white/[0.08] bg-[#050814]/90 mt-24 py-12 relative z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Cột 1: Thông tin thương hiệu */}
          <div className="md:col-span-2 space-y-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-brand-blue to-brand-cyan p-0.5 flex items-center justify-center">
                <Shield className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold text-lg text-white">
                Copyright<span className="text-brand-cyan">Chain</span>
              </span>
            </div>
            <p className="text-sm text-slate-400 max-w-sm leading-relaxed">
              DApp đăng ký và xác thực bản quyền tác phẩm kỹ thuật số phi tập trung trên nền tảng Ethereum Sepolia. An toàn, minh bạch, bất biến.
            </p>
            <div className="flex items-center gap-2 text-xs text-slate-400 pt-1">
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>Mạng: Ethereum Sepolia Testnet (Chain ID: 11155111)</span>
            </div>
          </div>

          {/* Cột 2: Điều hướng nhanh */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold text-slate-200 uppercase tracking-wider">Tính năng</h4>
            <ul className="space-y-2 text-sm text-slate-400">
              <li>
                <Link to="/" className="hover:text-brand-cyan transition">Trang chủ</Link>
              </li>
              <li>
                <Link to="/register" className="hover:text-brand-cyan transition">Đăng ký bản quyền</Link>
              </li>
              <li>
                <Link to="/verify" className="hover:text-brand-cyan transition">Xác minh tác phẩm</Link>
              </li>
              <li>
                <Link to="/my-works" className="hover:text-brand-cyan transition">Tác phẩm của tôi</Link>
              </li>
            </ul>
          </div>

          {/* Cột 3: Smart Contract Info */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold text-slate-200 uppercase tracking-wider">Hợp đồng thông minh</h4>
            <p className="text-xs text-slate-400">Địa chỉ Contract:</p>
            <a
              href={getEtherscanAddressUrl(CONTRACT_ADDRESS)}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 font-mono text-xs text-brand-cyan hover:underline bg-white/[0.03] p-2 rounded-lg border border-white/5"
            >
              {formatAddress(CONTRACT_ADDRESS, 10, 8)}
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
            <p className="text-[11px] text-slate-500">
              Tất cả dữ liệu được lưu vĩnh viễn và không thể xoá bỏ hay sửa đổi.
            </p>
          </div>
        </div>

        {/* Chân trang đáy */}
        <div className="pt-8 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          <p>
            © {new Date().getFullYear()} CopyrightChain - Đồ án tốt nghiệp môn Công nghệ Blockchain.
          </p>
          <div className="flex items-center gap-1 text-slate-400">
            <span>Xây dựng bằng</span>
            <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500 inline" />
            <span>trên Solidity & React + Vite</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

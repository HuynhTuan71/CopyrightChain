import React from "react";
import { Link } from "react-router-dom";
import { ShieldAlert, ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4 space-y-6">
      <div className="w-20 h-20 rounded-3xl bg-brand-blue/15 border border-brand-blue/30 text-brand-cyan flex items-center justify-center shadow-glow-blue">
        <ShieldAlert className="w-10 h-10" />
      </div>

      <div className="space-y-2">
        <h1 className="text-6xl sm:text-7xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-brand-blue via-brand-purple to-brand-cyan">
          404
        </h1>
        <h2 className="text-xl sm:text-2xl font-bold text-white">
          Trang không tồn tại
        </h2>
        <p className="text-sm text-slate-400 max-w-md mx-auto">
          Đường dẫn bạn đang tìm kiếm không tồn tại hoặc đã được di chuyển trên CopyrightChain.
        </p>
      </div>

      <Link
        to="/"
        className="px-6 py-3 rounded-xl bg-gradient-to-r from-brand-blue to-brand-purple text-white font-semibold text-sm shadow-glow-blue hover:opacity-90 transition active:scale-95 flex items-center gap-2"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Về trang chủ</span>
      </Link>
    </div>
  );
}

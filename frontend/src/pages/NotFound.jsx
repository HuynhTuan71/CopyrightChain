import React from "react";
import { Link } from "react-router-dom";
import { ShieldAlert, ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4 space-y-6">
      <div className="w-20 h-20 rounded-3xl bg-blue-50 dark:bg-[#003399]/20 border border-blue-200 dark:border-[#003399]/30 text-[#0052CC] dark:text-[#38BDF8] flex items-center justify-center">
        <ShieldAlert className="w-10 h-10" />
      </div>

      <div className="space-y-2">
        <h1 className="text-6xl sm:text-7xl font-extrabold text-[#0052CC] dark:text-[#38BDF8]">
          404
        </h1>
        <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
          Trang không tồn tại
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">
          Đường dẫn bạn đang tìm kiếm không tồn tại hoặc đã được di chuyển trên CopyrightChain.
        </p>
      </div>

      <Link
        to="/"
        className="px-6 py-3 rounded-xl btn-primary font-semibold text-sm shadow-sm flex items-center gap-2 transition active:scale-95"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Về trang chủ</span>
      </Link>
    </div>
  );
}

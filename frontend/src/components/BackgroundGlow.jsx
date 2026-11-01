import React from "react";

export default function BackgroundGlow() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {/* Nền lưới vi mô (Subtle Dot/Grid Pattern) */}
      <div className="absolute inset-0 bg-grid-pattern opacity-60" />

      {/* Quầng sáng Gradient Xanh Dương */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-brand-blue/20 rounded-full blur-[130px] animate-pulse" />

      {/* Quầng sáng Gradient Tím */}
      <div className="absolute top-1/4 -right-40 w-[30rem] h-[30rem] bg-brand-purple/15 rounded-full blur-[150px]" />

      {/* Quầng sáng Cyan trung tâm */}
      <div className="absolute bottom-10 left-1/3 w-[26rem] h-[26rem] bg-brand-cyan/10 rounded-full blur-[140px]" />
    </div>
  );
}

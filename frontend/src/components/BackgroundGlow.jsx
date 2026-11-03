import React from "react";

export default function BackgroundGlow() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {/* Nền lưới vi mô kỹ thuật */}
      <div className="absolute inset-0 bg-grid-pattern opacity-70" />

      {/* Ánh sáng nền nhẹ nhàng thanh lịch, không bị chói hay lòe loẹt */}
      <div className="absolute -top-32 -left-32 w-80 h-80 rounded-full bg-blue-500/10 dark:bg-[#003399]/15 blur-[120px]" />
      <div className="absolute top-1/3 -right-32 w-96 h-96 rounded-full bg-cyan-500/10 dark:bg-[#0066CC]/12 blur-[140px]" />
    </div>
  );
}

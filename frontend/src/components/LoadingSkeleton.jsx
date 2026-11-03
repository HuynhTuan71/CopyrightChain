import React from "react";

export function CardSkeleton() {
  return (
    <div className="glass-card p-6 rounded-2xl animate-pulse flex flex-col gap-4">
      <div className="h-6 bg-slate-200 dark:bg-white/10 rounded-md w-3/4" />
      <div className="h-4 bg-slate-100 dark:bg-white/5 rounded-md w-1/2" />
      <div className="h-16 bg-slate-100 dark:bg-white/5 rounded-xl w-full" />
      <div className="flex justify-between items-center pt-2">
        <div className="h-8 bg-slate-200 dark:bg-white/10 rounded-lg w-28" />
        <div className="h-8 bg-slate-200 dark:bg-white/10 rounded-lg w-24" />
      </div>
    </div>
  );
}

export function TableRowSkeleton() {
  return (
    <div className="animate-pulse flex items-center justify-between p-4 border-b border-slate-200 dark:border-white/5">
      <div className="h-4 bg-slate-200 dark:bg-white/10 rounded w-1/3" />
      <div className="h-4 bg-slate-200 dark:bg-white/10 rounded w-1/4" />
      <div className="h-4 bg-slate-200 dark:bg-white/10 rounded w-1/6" />
    </div>
  );
}

import React from 'react';
import { Sparkles, ShieldCheck, Zap, Lock, Cpu } from 'lucide-react';

export default function HeroBanner({ displayLang }) {
  return (
    <div className="relative overflow-hidden pt-12 pb-8 px-4 text-center">
      {/* Glow background accents */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-gradient-to-tr from-emerald-500/10 via-teal-500/15 to-cyan-500/10 blur-[120px] pointer-events-none -z-10 rounded-full" />

      <div className="max-w-3xl mx-auto space-y-4">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-800/80 border border-slate-700/80 text-xs font-semibold text-emerald-400 shadow-sm backdrop-blur-md">
          <Sparkles size={14} className="text-emerald-400" />
          <span>Tất cả công cụ trong một — Miễn phí & Không tải lên server</span>
        </div>

        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-100 tracking-tight leading-tight">
          Bộ Công Cụ Xử Lý <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent">PDF, Ảnh & Văn Bản</span> Thông Minh
        </h1>

        <p className="text-slate-400 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">
          Nén & chuyển đổi ảnh WebP, tách/gộp PDF, lập hợp đồng pháp lý, xử lý hóa đơn và dịch thuật tài liệu tự động ngay trên trình duyệt của bạn.
        </p>

        {/* Feature Badges */}
        <div className="pt-2 flex flex-wrap items-center justify-center gap-4 text-xs text-slate-400">
          <div className="flex items-center gap-1.5">
            <Lock size={14} className="text-emerald-400" />
            <span>100% Bảo mật Private</span>
          </div>
          <div className="h-3 w-px bg-slate-800" />
          <div className="flex items-center gap-1.5">
            <Zap size={14} className="text-amber-400" />
            <span>Tốc độ xử lý tức thì</span>
          </div>
          <div className="h-3 w-px bg-slate-800" />
          <div className="flex items-center gap-1.5">
            <Cpu size={14} className="text-cyan-400" />
            <span>Tích hợp AI Tiên tiến</span>
          </div>
        </div>
      </div>
    </div>
  );
}

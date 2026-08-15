import React from 'react';
import {
  Image, Scissors, Combine, Printer, Scale, Globe,
  Award, FileSpreadsheet, LayoutTemplate, Receipt, ArrowRight, Sparkles,
  BarChart3, HelpCircle, Calculator, Minimize2
} from 'lucide-react';

const iconMap = {
  Image,
  Scissors,
  Combine,
  Minimize2,
  Printer,
  Scale,
  Globe,
  Award,
  FileSpreadsheet,
  LayoutTemplate,
  Receipt,
  BarChart3,
  HelpCircle,
  Calculator
};

export default function ToolCard({ tool, onSelectTool, displayLang }) {
  const Icon = iconMap[tool.icon] || Sparkles;
  const isDisabled = tool.readiness === 'in-development';

  const readinessLabel = {
    beta: 'BETA',
    experimental: 'THỬ NGHIỆM',
    'in-development': 'ĐANG PHÁT TRIỂN'
  }[tool.readiness] || 'THỬ NGHIỆM';

  const readinessClass = {
    beta: 'border-cyan-500/30 bg-cyan-500/10 text-cyan-300',
    experimental: 'border-amber-500/30 bg-amber-500/10 text-amber-300',
    'in-development': 'border-slate-500/40 bg-slate-500/10 text-slate-300'
  }[tool.readiness];

  const getName = () => {
    if (displayLang === 'en') return tool.name_en;
    if (displayLang === 'ja') return tool.name_ja;
    return tool.name_vn;
  };

  const getDesc = () => {
    if (displayLang === 'en') return tool.desc_en;
    if (displayLang === 'ja') return tool.desc_ja;
    return tool.desc_vn;
  };

  return (
    <button
      type="button"
      disabled={isDisabled}
      onClick={() => onSelectTool(tool.id)}
      className={`group relative w-full text-left bg-slate-900/60 border border-slate-800/80 rounded-3xl p-6 flex flex-col justify-between transition-all duration-300 overflow-hidden backdrop-blur-sm ${
        isDisabled
          ? 'cursor-not-allowed opacity-60'
          : 'hover:bg-slate-800/80 hover:border-slate-700 hover:-translate-y-1.5 hover:shadow-2xl hover:shadow-black/50 cursor-pointer'
      }`}
    >
      {/* Top ambient glow on hover */}
      <div
        className="absolute -top-12 -right-12 w-32 h-32 rounded-full blur-3xl opacity-0 group-hover:opacity-30 transition-opacity pointer-events-none"
        style={{ backgroundColor: tool.color }}
      />

      <div>
        {/* Top Header Row with Icon & Badge */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <div
            className={`w-14 h-14 rounded-2xl bg-gradient-to-tr ${tool.gradient} flex items-center justify-center text-white shadow-lg shadow-black/30 group-hover:scale-110 transition-transform duration-300`}
          >
            <Icon size={26} strokeWidth={2.2} />
          </div>

          <div className="flex flex-col items-end gap-1.5">
            <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${readinessClass}`}>
              {readinessLabel}
            </span>
            {tool.priority && (
              <span className="text-[10px] font-bold text-emerald-400">Ưu tiên {tool.priority}</span>
            )}
          </div>
        </div>

        {/* Tool Name & Description */}
        <h3 className="font-bold text-lg text-slate-100 group-hover:text-white tracking-tight leading-snug">
          {getName()}
        </h3>
        <p className="text-xs text-slate-400 mt-2 line-clamp-2 leading-relaxed">
          {getDesc()}
        </p>
        {isDisabled && tool.unavailableReason && (
          <p className="mt-3 text-[11px] leading-relaxed text-slate-400">
            {tool.unavailableReason}
          </p>
        )}
      </div>

      {/* Card Action Footer */}
      <div className="mt-6 pt-4 border-t border-slate-800/60 flex items-center justify-between text-xs font-bold text-slate-400 group-hover:text-emerald-400 transition-colors">
        <span>{isDisabled ? 'Chưa mở lại' : 'Sử dụng công cụ'}</span>
        <div className="w-7 h-7 rounded-full bg-slate-800 group-hover:bg-emerald-500/20 flex items-center justify-center text-slate-400 group-hover:text-emerald-400 group-hover:translate-x-1 transition-all">
          <ArrowRight size={14} />
        </div>
      </div>
    </button>
  );
}

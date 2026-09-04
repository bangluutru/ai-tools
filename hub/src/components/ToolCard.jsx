import React from 'react';
import {
  Image, Scissors, Combine, Printer, Scale, Globe,
  Award, FileSpreadsheet, LayoutTemplate, Receipt, ArrowRight, ArrowUpRight, Sparkles,
  BarChart3, HelpCircle, Calculator, Minimize2, Camera, QrCode, Barcode, UserCheck,
  ShieldCheck, Cpu, HardDrive, Lock
} from 'lucide-react';

const iconMap = {
  Image,
  Scissors,
  Combine,
  Minimize2,
  Camera,
  QrCode,
  Barcode,
  Printer,
  Scale,
  Globe,
  Award,
  FileSpreadsheet,
  LayoutTemplate,
  Receipt,
  BarChart3,
  HelpCircle,
  Calculator,
  UserCheck
};

export default function ToolCard({ tool, onSelectTool, displayLang = 'vi' }) {
  const Icon = iconMap[tool.icon] || Sparkles;
  const isDisabled = tool.readiness === 'in-development';

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

  const getCategoryTag = () => {
    if (tool.category === 'pdf') return 'PDF';
    if (tool.category === 'image') return 'ẢNH';
    if (tool.category === 'office') return tool.id.includes('invoice') ? 'HÓA ĐƠN' : 'EXCEL';
    if (tool.category === 'ai') return 'AI / BI';
    return 'TIỆN ÍCH';
  };

  const getProcessingInfo = () => {
    if (tool.processing === 'browser') {
      return {
        label: displayLang === 'en' ? 'Client-side Safe' : displayLang === 'ja' ? '端末内ローカル処理' : 'Client-side Safe',
        color: 'text-secondary',
        dot: 'bg-secondary',
        icon: ShieldCheck
      };
    }
    if (tool.processing === 'hybrid') {
      return {
        label: displayLang === 'en' ? 'Hybrid Engine' : displayLang === 'ja' ? 'ハイブリッド処理' : 'Hybrid Engine',
        color: 'text-brand-cyan-bright',
        dot: 'bg-brand-cyan-bright',
        icon: HardDrive
      };
    }
    return {
      label: displayLang === 'en' ? 'Antigravity AI' : displayLang === 'ja' ? 'Antigravity AI' : 'Antigravity AI',
      color: 'text-primary',
      dot: 'bg-primary',
      icon: Cpu
    };
  };

  const proc = getProcessingInfo();

  return (
    <article
      data-category={tool.category}
      className={`tool-card flex flex-col justify-between p-5 rounded-xl bg-surface-container hover:bg-surface-container-high border border-border-subtle hover:border-primary-container/50 transition-all duration-200 shadow-sm group relative overflow-hidden ${
        isDisabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'
      }`}
      onClick={() => !isDisabled && onSelectTool(tool.id)}
    >
      {/* Top subtle ambient glow */}
      <div
        className="absolute -top-12 -right-12 w-28 h-28 rounded-full blur-2xl opacity-0 group-hover:opacity-20 transition-opacity pointer-events-none"
        style={{ backgroundColor: tool.color || '#0ea5e9' }}
      />

      <div className="space-y-3 relative z-10">
        {/* Header with Icon and Badges */}
        <div className="flex items-start justify-between">
          <div
            className="w-11 h-11 rounded-lg bg-surface-subtle border border-border-subtle flex items-center justify-center transition-transform duration-200 group-hover:scale-105 shadow-inner"
            style={{ color: tool.color || '#38BDF8' }}
          >
            <Icon size={22} />
          </div>

          <div className="flex items-center gap-1.5 flex-wrap justify-end">
            {tool.priority && (
              <span className="px-2 py-0.5 rounded bg-secondary/15 border border-secondary/30 text-secondary font-label-sm text-[11px] font-semibold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-secondary" />
                ƯU TIÊN {tool.priority}
              </span>
            )}
            {tool.readiness === 'beta' && !tool.priority && (
              <span className="px-2 py-0.5 rounded bg-primary-container/15 border border-primary-container/30 text-primary font-label-sm text-[11px] font-semibold">
                BETA
              </span>
            )}
            {isDisabled ? (
              <span className="px-2 py-0.5 rounded bg-surface-subtle border border-border-subtle text-outline font-label-sm text-[11px]">
                ĐANG PHÁT TRIỂN
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded bg-surface-subtle border border-border-subtle text-outline font-label-sm text-[11px]">
                {getCategoryTag()}
              </span>
            )}
          </div>
        </div>

        {/* Title & Description */}
        <div>
          <h3 className="font-title-sm text-base font-semibold text-on-surface group-hover:text-primary transition-colors flex items-center gap-1.5 leading-snug">
            <span>{getName()}</span>
            {!isDisabled && (
              <ArrowUpRight size={15} className="text-outline opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
            )}
          </h3>
          <p className="font-body-sm text-xs text-on-surface-variant mt-1.5 line-clamp-2 leading-relaxed">
            {getDesc()}
          </p>
          {isDisabled && tool.unavailableReason && (
            <p className="mt-2 text-[11px] text-outline italic leading-tight">
              {tool.unavailableReason}
            </p>
          )}
        </div>
      </div>

      {/* Card Action Footer */}
      <div className="pt-4 mt-3 border-t border-border-subtle/70 flex items-center justify-between relative z-10">
        <span className={`flex items-center gap-1.5 font-label-sm text-[11px] ${proc.color}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${proc.dot}`} />
          {proc.label}
        </span>
        <span className="font-label-sm text-xs text-outline group-hover:text-primary group-hover:translate-x-0.5 transition-all flex items-center gap-1">
          {isDisabled ? 'Chưa mở lại' : (
            <>
              <span>Mở Tool</span>
              <ArrowRight size={13} />
            </>
          )}
        </span>
      </div>
    </article>
  );
}

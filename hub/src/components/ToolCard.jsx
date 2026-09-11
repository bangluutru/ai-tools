import React from 'react';
import { ArrowRight, ArrowUpRight, ShieldCheck, Cpu, HardDrive } from 'lucide-react';
import { renderToolIcon } from '../config/toolIcons.js';

export default function ToolCard({
  tool,
  onSelectTool,
  displayLang = 'vi',
  showGroupContext = false,
}) {
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

  const getSemanticBadge = () => {
    // 1. Japan Life Tools: Semantic Domain Badges
    if (tool.group === 'japan-life') {
      const domainBadges = {
        tax: { vi: 'THUẾ', en: 'TAX', ja: '税金' },
        insurance: { vi: 'BẢO HIỂM', en: 'INSURANCE', ja: '保険・年金' },
        employment: { vi: 'VIỆC LÀM', en: 'EMPLOYMENT', ja: '労働・雇用' },
        family: { vi: 'GIA ĐÌNH', en: 'FAMILY', ja: '子育て' },
        housing: { vi: 'NHÀ Ở', en: 'HOUSING', ja: '住まい' },
        immigration: { vi: 'CƯ TRÚ', en: 'IMMIGRATION', ja: '在留・入管' },
        'procedures-documents': { vi: 'THỦ TỤC', en: 'PROCEDURES', ja: '行政手続' },
        navigator: { vi: 'ĐIỀU PHỐI', en: 'NAVIGATOR', ja: 'ナビ' },
      };
      const badgeObj = domainBadges[tool.domain] || { vi: 'NHẬT BẢN', en: 'JAPAN', ja: '日本' };
      return badgeObj[displayLang] || badgeObj.vi;
    }

    // 2. Vietnam Life Tools
    if (tool.group === 'vietnam-life') {
      const vnBadge = { vi: 'VIỆT NAM', en: 'VIETNAM', ja: 'ベトナム' };
      return vnBadge[displayLang] || vnBadge.vi;
    }

    // 3. Common Tools: Purpose/Category Badges
    if (tool.category === 'pdf') return 'PDF';
    if (tool.category === 'image') return displayLang === 'ja' ? '画像' : displayLang === 'en' ? 'IMAGE' : 'ẢNH';
    if (tool.id.includes('invoice')) return displayLang === 'ja' ? '請求書' : displayLang === 'en' ? 'INVOICE' : 'HÓA ĐƠN';
    if (tool.id.includes('accounting')) return displayLang === 'ja' ? '会計' : displayLang === 'en' ? 'FINANCE' : 'KẾ TOÁN';
    if (tool.id.includes('card')) return displayLang === 'ja' ? '名刺' : displayLang === 'en' ? 'BIZ CARD' : 'DANH THIẾP';
    if (tool.category === 'office') return 'EXCEL';
    if (tool.category === 'ai') return 'AI / BI';
    return displayLang === 'ja' ? '便利' : displayLang === 'en' ? 'UTILITY' : 'TIỆN ÍCH';
  };

  const getGroupContextBadge = () => {
    if (tool.group === 'japan-life') {
      return {
        label: displayLang === 'ja' ? '日本生活' : displayLang === 'en' ? 'Japan Life' : 'Cuộc sống Nhật',
        className: 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/25',
      };
    }
    if (tool.group === 'vietnam-life') {
      return {
        label: displayLang === 'ja' ? 'ベトナム生活' : displayLang === 'en' ? 'Vietnam Life' : 'Cuộc sống VN',
        className: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/25',
      };
    }
    return {
      label: displayLang === 'ja' ? 'ツール' : displayLang === 'en' ? 'Tools' : 'Công cụ',
      className: 'bg-primary/15 text-primary border-primary/25',
    };
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
  const groupContext = showGroupContext ? getGroupContextBadge() : null;

  return (
    <article
      data-category={tool.category}
      className={`tool-card flex flex-col justify-between p-5 sm:p-6 rounded-2xl bg-surface-container hover:bg-surface-container-high border border-border-subtle hover:border-primary-container/50 transition-all duration-200 shadow-xs hover:shadow-md group relative overflow-hidden ${
        isDisabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'
      }`}
      onClick={() => !isDisabled && onSelectTool(tool.id)}
    >
      {/* Top subtle ambient glow */}
      <div
        className="absolute -top-12 -right-12 w-28 h-28 rounded-full blur-2xl opacity-0 group-hover:opacity-20 transition-opacity pointer-events-none"
        style={{ backgroundColor: tool.color || '#0ea5e9' }}
      />

      <div className="space-y-3.5 relative z-10">
        {/* Header with Icon and Badges */}
        <div className="flex items-start justify-between gap-2">
          <div
            className="w-12 h-12 rounded-xl bg-surface-subtle border border-border-subtle flex items-center justify-center transition-transform duration-200 group-hover:scale-105 shadow-inner shrink-0"
            style={{ color: tool.color || '#38BDF8' }}
          >
            {renderToolIcon(tool.icon, { size: 24 })}
          </div>

          <div className="flex items-center gap-1.5 flex-wrap justify-end">
            {/* Cross-domain Search Context Pill */}
            {groupContext && (
              <span className={`px-2 py-0.5 rounded-full font-label-sm text-[10px] font-bold border ${groupContext.className}`}>
                {groupContext.label}
              </span>
            )}

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
              <span className="px-2 py-0.5 rounded bg-surface-subtle border border-border-subtle text-outline font-label-sm text-[11px] font-medium tracking-tight">
                {getSemanticBadge()}
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
          <p className="font-body-sm text-xs sm:text-[13px] text-on-surface-variant mt-1.5 line-clamp-3 leading-relaxed">
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
              <span>{displayLang === 'ja' ? '開く' : displayLang === 'en' ? 'Open' : 'Mở Tool'}</span>
              <ArrowRight size={13} />
            </>
          )}
        </span>
      </div>
    </article>
  );
}

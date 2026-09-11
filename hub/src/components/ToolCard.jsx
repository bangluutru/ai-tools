import React from 'react';
import { ArrowRight, ChevronRight, ArrowUpRight } from 'lucide-react';
import { renderToolIcon } from '../config/toolIcons.js';

/**
 * ToolCard — Thẻ hiển thị miniapp của Toolio
 * Hỗ trợ 2 chế độ hiển thị:
 * 1. variant="grid" (Mặc định cho Desktop/Tablet): Thẻ vuông bo góc 2xl, icon viền màu, tiêu đề đậm, mô tả 2 dòng, mũi tên chân thẻ.
 * 2. variant="compact-list" (Dành cho Mobile): Dạng dòng ngang gọn gàng (Icon trái, Tiêu đề & mô tả giữa, Mũi tên phải) chuẩn trải nghiệm native app.
 */

export default function ToolCard({
  tool,
  onSelectTool,
  displayLang = 'vi',
  showGroupContext = false,
  variant = 'grid',
}) {
  const isDisabled = tool.readiness === 'in-development';

  const getName = () => {
    if (displayLang === 'en') return tool.name_en || tool.name_vn;
    if (displayLang === 'ja') return tool.name_ja || tool.name_vn;
    return tool.name_vn;
  };

  const getDesc = () => {
    if (displayLang === 'en') return tool.desc_en || tool.desc_vn;
    if (displayLang === 'ja') return tool.desc_ja || tool.desc_vn;
    return tool.desc_vn;
  };

  const handleClick = () => {
    if (!isDisabled && onSelectTool) {
      onSelectTool(tool.id);
    }
  };

  const handleKeyDown = (e) => {
    if ((e.key === 'Enter' || e.key === ' ') && !isDisabled && onSelectTool) {
      e.preventDefault();
      onSelectTool(tool.id);
    }
  };

  // Tone màu chủ đạo của icon miniapp
  const iconColor = tool.color || '#0284c7';

  const getGroupContextBadge = () => {
    if (!showGroupContext) return null;
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

  const groupBadge = getGroupContextBadge();

  // =========================================================================
  // BIẾN THỂ 1: COMPACT LIST ITEM (CHO MÀN HÌNH DI ĐỘNG THEO HÌNH 2)
  // =========================================================================
  if (variant === 'compact-list') {
    return (
      <article
        role="button"
        tabIndex={isDisabled ? -1 : 0}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        className={`flex items-center justify-between gap-3.5 p-3.5 rounded-xl bg-surface-container hover:bg-surface-container-high border border-border-subtle hover:border-primary-container/50 transition-all duration-150 shadow-2xs group select-none outline-none focus-visible:ring-2 focus-visible:ring-primary ${
          isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer active:scale-[0.99]'
        }`}
        aria-label={`${getName()} - ${getDesc()}`}
      >
        {/* Cột trái: Icon vuông viền màu sắc nét */}
        <div
          className="w-10 h-10 rounded-lg bg-surface-subtle/80 border border-border-subtle flex items-center justify-center shrink-0 transition-transform group-hover:scale-105"
          style={{ color: iconColor }}
        >
          {renderToolIcon(tool.icon, { size: 20 })}
        </div>

        {/* Cột giữa: Tiêu đề in đậm và mô tả 1 dòng ngắn gọn */}
        <div className="flex-1 min-w-0 pr-1">
          <div className="flex items-center gap-1.5 flex-wrap">
            <h3 className="font-title-sm text-sm font-bold text-on-surface truncate group-hover:text-primary transition-colors">
              {getName()}
            </h3>
            {groupBadge && (
              <span className={`px-1.5 py-[1px] rounded-full font-label-sm text-[9px] font-bold border ${groupBadge.className}`}>
                {groupBadge.label}
              </span>
            )}
            {tool.readiness === 'beta' && (
              <span className="px-1.5 py-[1px] rounded bg-primary/10 text-primary text-[10px] font-mono font-bold shrink-0">
                BETA
              </span>
            )}
          </div>
          <p className="font-body-sm text-[12px] text-on-surface-variant truncate mt-0.5">
            {getDesc()}
          </p>
        </div>

        {/* Cột phải: Mũi tên điều hướng chevron */}
        <div className="shrink-0 text-outline group-hover:text-primary group-hover:translate-x-0.5 transition-all">
          <ChevronRight size={18} />
        </div>
      </article>
    );
  }

  // =========================================================================
  // BIẾN THỂ 2: GRID CARD (CHUẨN DESKTOP / TABLET THEO HÌNH 1)
  // =========================================================================
  return (
    <article
      data-category={tool.category}
      role="button"
      tabIndex={isDisabled ? -1 : 0}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      className={`tool-card flex flex-col justify-between p-5 sm:p-6 rounded-2xl bg-surface-container hover:bg-surface-container-high border border-border-subtle hover:border-primary-container/50 transition-all duration-200 shadow-xs hover:shadow-md group relative overflow-hidden select-none outline-none focus-visible:ring-2 focus-visible:ring-primary ${
        isDisabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'
      }`}
      aria-label={`${getName()} - ${getDesc()}`}
    >
      {/* Vầng sáng ambient nhẹ nhàng khi hover */}
      <div
        className="absolute -top-10 -right-10 w-24 h-24 rounded-full blur-2xl opacity-0 group-hover:opacity-15 transition-opacity pointer-events-none"
        style={{ backgroundColor: iconColor }}
      />

      <div className="space-y-3.5 relative z-10">
        {/* Hàng trên: Icon vuông nổi bật và Badge trạng thái */}
        <div className="flex items-start justify-between gap-2">
          <div
            className="w-11 h-11 rounded-xl bg-surface-subtle border border-border-subtle flex items-center justify-center transition-transform duration-200 group-hover:scale-105 shadow-inner shrink-0"
            style={{ color: iconColor }}
          >
            {renderToolIcon(tool.icon, { size: 22 })}
          </div>

          <div className="flex items-center gap-1.5 flex-wrap justify-end">
            {groupBadge && (
              <span className={`px-2 py-0.5 rounded-full font-label-sm text-[10px] font-bold border ${groupBadge.className}`}>
                {groupBadge.label}
              </span>
            )}
            {tool.readiness === 'beta' && (
              <span className="px-2 py-0.5 rounded-full bg-primary/10 border border-primary/20 text-primary font-label-sm text-[10px] font-semibold tracking-wide">
                BETA
              </span>
            )}
            {isDisabled && (
              <span className="px-2 py-0.5 rounded-full bg-surface-subtle border border-border-subtle text-outline font-label-sm text-[10px]">
                ĐANG PHÁT TRIỂN
              </span>
            )}
          </div>
        </div>

        {/* Tiêu đề & Mô tả ngắn gọn */}
        <div>
          <h3 className="font-title-sm text-[15px] sm:text-base font-bold text-on-surface group-hover:text-primary transition-colors flex items-center gap-1.5 leading-snug">
            <span>{getName()}</span>
            {!isDisabled && (
              <ArrowUpRight size={14} className="text-outline opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
            )}
          </h3>
          <p className="font-body-sm text-xs sm:text-[13px] text-on-surface-variant mt-1.5 line-clamp-2 leading-relaxed">
            {getDesc()}
          </p>
        </div>
      </div>

      {/* Chân thẻ: Mũi tên tinh tế góc dưới bên phải */}
      <div className="pt-3.5 mt-2 border-t border-border-subtle/50 flex items-center justify-end relative z-10">
        <span className="font-label-sm text-xs text-outline group-hover:text-primary group-hover:translate-x-1 transition-all flex items-center gap-1">
          {!isDisabled && (
            <ArrowRight size={14} />
          )}
        </span>
      </div>
    </article>
  );
}

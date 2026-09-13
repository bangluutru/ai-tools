import React from 'react';
import { ChevronRight } from 'lucide-react';
import {
  ToolboxIcon,
  SakuraIcon,
  LotusIcon,
} from '../assets/illustrations/DomainIcons.jsx';

/**
 * HubDomainCard — Thẻ đại diện 3 nhóm công cụ chính của Toolio
 * Khớp chuẩn mực thẩm mỹ theo Mockup:
 * - Icon tròn thương hiệu sắc nét bên trái (Toolbox, Sakura, Lotus)
 * - Khối Tiêu đề & Phụ đề cân xứng
 * - Nút mũi tên tròn điều hướng bên phải
 * - Đoạn mô tả chi tiết dễ đọc bên dưới
 * - Chân thẻ: Pill badge hiển thị số lượng công cụ
 */

export default function HubDomainCard({
  id,
  title,
  subtitle,
  description,
  toolCount = 0,
  status,
  displayLang = 'vi',
  onSelect,
}) {
  const isComingSoon = status === 'coming_soon' || toolCount === 0;

  // Lựa chọn Icon tương ứng
  const renderIcon = () => {
    if (id === 'japan-life') {
      return (
        <div className="w-12 h-12 rounded-full bg-rose-500/15 flex items-center justify-center shrink-0">
          <SakuraIcon size={32} />
        </div>
      );
    }
    if (id === 'vietnam-life') {
      return (
        <div className="w-12 h-12 rounded-full bg-emerald-500/15 flex items-center justify-center shrink-0">
          <LotusIcon size={32} />
        </div>
      );
    }
    return (
      <div className="w-12 h-12 rounded-full bg-sky-500/15 flex items-center justify-center shrink-0">
        <ToolboxIcon size={32} />
      </div>
    );
  };

  // Nhãn badge chân thẻ
  const getBadgeLabel = () => {
    if (isComingSoon) {
      if (displayLang === 'ja') return '近日公開';
      if (displayLang === 'en') return 'Coming Soon';
      return 'Sắp ra mắt';
    }
    if (displayLang === 'ja') return `${toolCount} ツール`;
    if (displayLang === 'en') return `${toolCount} tools`;
    return `${toolCount} công cụ`;
  };

  // Thiết lập phong cách màu sắc riêng biệt theo từng Domain
  const getStyleTokens = () => {
    if (id === 'japan-life') {
      return {
        cardBg: 'bg-[#fff1f2]/70 dark:bg-[#2d121c]/70',
        cardBorder: 'border-[#fecdd3] hover:border-[#fb7185] dark:border-[#f43f5e]/30 dark:hover:border-[#fb7185]/60',
        titleHover: 'group-hover:text-[#e11d48] dark:group-hover:text-[#fda4af]',
        arrowBg: 'bg-rose-500/10 text-[#e11d48] dark:text-[#fb7185] group-hover:bg-rose-500/20',
        badgeBg: 'bg-[#ffe4e6] text-[#be123c] dark:bg-[#e11d48]/25 dark:text-[#fda4af] border border-[#fecdd3]/60 dark:border-[#f43f5e]/30',
      };
    }
    if (id === 'vietnam-life') {
      return {
        cardBg: 'bg-[#f0fdf4]/70 dark:bg-[#0c2419]/70',
        cardBorder: 'border-[#bbf7d0] hover:border-[#34d399] dark:border-[#10b981]/30 dark:hover:border-[#34d399]/60',
        titleHover: 'group-hover:text-[#059669] dark:group-hover:text-[#6ee7b7]',
        arrowBg: 'bg-emerald-500/10 text-[#059669] dark:text-[#34d399] group-hover:bg-emerald-500/20',
        badgeBg: 'bg-[#dcfce7] text-[#047857] dark:bg-[#059669]/25 dark:text-[#6ee7b7] border border-[#bbf7d0]/60 dark:border-[#10b981]/30',
      };
    }
    // Mặc định: Tools Domain
    return {
      cardBg: 'bg-[#f0f9ff]/70 dark:bg-[#0c1f38]/70',
      cardBorder: 'border-[#bae6fd] hover:border-[#38bdf8] dark:border-[#0284c7]/30 dark:hover:border-[#38bdf8]/60',
      titleHover: 'group-hover:text-[#0284c7] dark:group-hover:text-[#7dd3fc]',
      arrowBg: 'bg-sky-500/10 text-[#0284c7] dark:text-[#38bdf8] group-hover:bg-sky-500/20',
      badgeBg: 'bg-[#e0f2fe] text-[#0369a1] dark:bg-[#0284c7]/25 dark:text-[#7dd3fc] border border-[#bae6fd]/60 dark:border-[#0284c7]/30',
    };
  };

  const style = getStyleTokens();

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onSelect?.(id);
    }
  };

  return (
    <article
      role="button"
      tabIndex={0}
      onClick={() => onSelect?.(id)}
      onKeyDown={handleKeyDown}
      className={`group relative flex flex-col justify-between p-5 sm:p-6 rounded-2xl ${style.cardBg} border ${style.cardBorder} transition-all duration-200 shadow-xs hover:shadow-md cursor-pointer overflow-hidden select-none outline-none focus-visible:ring-2 focus-visible:ring-primary`}
      aria-label={`${title} - ${subtitle}`}
    >
      <div className="space-y-3">
        {/* Hàng trên: Icon tròn bên trái, Tiêu đề + Phụ đề ở giữa, Mũi tên tròn bên phải */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="shrink-0 transition-transform duration-200 group-hover:scale-105">
              {renderIcon()}
            </div>

            <div className="space-y-0.5">
              <h2 className={`text-xl sm:text-2xl font-bold text-on-surface tracking-tight transition-colors ${style.titleHover}`}>
                {title}
              </h2>
              {subtitle && (
                <p className="text-xs sm:text-sm text-outline font-medium">
                  {subtitle}
                </p>
              )}
            </div>
          </div>

          <div className={`w-9 h-9 rounded-full ${style.arrowBg} flex items-center justify-center shrink-0 transition-all duration-200 group-hover:translate-x-0.5`}>
            <ChevronRight size={18} />
          </div>
        </div>

        {/* Mô tả chi tiết */}
        <p className="text-xs sm:text-[13px] text-on-surface-variant line-clamp-2 sm:line-clamp-3 leading-relaxed pt-1">
          {description}
        </p>
      </div>

      {/* Chân thẻ: Pill badge hiển thị số lượng công cụ */}
      <div className="pt-4 mt-3 border-t border-border-subtle/50 flex items-center justify-between">
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold tracking-wide ${style.badgeBg}`}>
          {getBadgeLabel()}
        </span>
        <span className="text-[11px] font-medium text-outline group-hover:text-primary transition-colors flex items-center gap-1">
          <span>Khám phá domain</span>
          <ChevronRight size={12} />
        </span>
      </div>
    </article>
  );
}

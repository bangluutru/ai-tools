import React from 'react';
import { ArrowRight } from 'lucide-react';
import {
  ToolboxIcon,
  SakuraIcon,
  LotusIcon,
} from '../assets/illustrations/DomainIcons.jsx';

/**
 * HubDomainCard — Thẻ đại diện 3 nhóm công cụ chính của Toolio
 * Chuẩn mực thẩm mỹ theo Mockup:
 * - Icon thương hiệu sắc nét bên trái (Toolbox, Sakura, Lotus)
 * - Khối Tiêu đề & Mô tả cân xứng bên phải
 * - Chân thẻ: Pill badge hiển thị số lượng công cụ bên trái, Mũi tên điều hướng bên phải
 * - Nền pastel dịu nhẹ và viền tinh tế, tối ưu cho cả Light & Dark mode
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
      return <SakuraIcon size={46} />;
    }
    if (id === 'vietnam-life') {
      return <LotusIcon size={46} />;
    }
    return <ToolboxIcon size={46} />;
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

  // Thiết lập phong cách màu sắc Pastel riêng biệt
  const getStyleTokens = () => {
    if (id === 'japan-life') {
      return {
        cardBg: 'bg-[#fff1f2] dark:bg-[#2d121c]/70',
        cardBorder: 'border-[#fecdd3] hover:border-[#fb7185] dark:border-[#f43f5e]/30 dark:hover:border-[#fb7185]/60',
        titleHover: 'group-hover:text-[#e11d48] dark:group-hover:text-[#fda4af]',
        badgeBg: 'bg-[#ffe4e6] text-[#be123c] dark:bg-[#e11d48]/25 dark:text-[#fda4af] border border-[#fecdd3]/60 dark:border-[#f43f5e]/30',
        arrowColor: 'text-[#e11d48] dark:text-[#fb7185]',
      };
    }
    if (id === 'vietnam-life') {
      return {
        cardBg: 'bg-[#f0fdf4] dark:bg-[#0c2419]/70',
        cardBorder: 'border-[#bbf7d0] hover:border-[#34d399] dark:border-[#10b981]/30 dark:hover:border-[#34d399]/60',
        titleHover: 'group-hover:text-[#059669] dark:group-hover:text-[#6ee7b7]',
        badgeBg: 'bg-[#dcfce7] text-[#047857] dark:bg-[#059669]/25 dark:text-[#6ee7b7] border border-[#bbf7d0]/60 dark:border-[#10b981]/30',
        arrowColor: 'text-[#059669] dark:text-[#34d399]',
      };
    }
    // Mặc định: Tools Domain
    return {
      cardBg: 'bg-[#f0f9ff] dark:bg-[#0c1f38]/70',
      cardBorder: 'border-[#bae6fd] hover:border-[#38bdf8] dark:border-[#0284c7]/30 dark:hover:border-[#38bdf8]/60',
      titleHover: 'group-hover:text-[#0284c7] dark:group-hover:text-[#7dd3fc]',
      badgeBg: 'bg-[#e0f2fe] text-[#0369a1] dark:bg-[#0284c7]/25 dark:text-[#7dd3fc] border border-[#bae6fd]/60 dark:border-[#0284c7]/30',
      arrowColor: 'text-[#0284c7] dark:text-[#38bdf8]',
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
      className={`group relative flex-1 flex flex-col justify-between p-6 sm:p-7 rounded-2xl ${style.cardBg} border ${style.cardBorder} transition-all duration-200 shadow-xs hover:shadow-md cursor-pointer overflow-hidden select-none outline-none focus-visible:ring-2 focus-visible:ring-primary`}
      aria-label={`${title} - ${getBadgeLabel()}`}
    >
      <div className="space-y-4">
        {/* Hàng trên: Icon lớn và Tiêu đề */}
        <div className="flex items-start gap-4">
          {/* Icon nổi bật bo góc */}
          <div className="shrink-0 transition-transform duration-200 group-hover:scale-105">
            {renderIcon()}
          </div>

          <div className="space-y-1 pt-0.5">
            <h2 className={`font-title-lg text-xl sm:text-2xl font-bold text-on-surface tracking-tight transition-colors ${style.titleHover}`}>
              {title}
            </h2>
            {/* Phụ đề/Mô tả ngắn */}
            <p className="font-body-sm text-xs sm:text-[13px] text-on-surface-variant line-clamp-3 leading-relaxed">
              {description}
            </p>
          </div>
        </div>
      </div>

      {/* Chân thẻ: Pill badge bên trái, Mũi tên bên phải */}
      <div className="pt-6 mt-4 border-t border-border-subtle/50 flex items-center justify-between">
        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold tracking-wide ${style.badgeBg}`}>
          {getBadgeLabel()}
        </span>

        <span className={`inline-flex items-center transition-transform duration-200 group-hover:translate-x-1 ${style.arrowColor}`}>
          <ArrowRight size={18} />
        </span>
      </div>
    </article>
  );
}

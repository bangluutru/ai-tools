import React from 'react';
import { DOMAIN_SHORTCUTS } from '../config/domainShortcuts.js';
import { iconMap } from '../config/toolIcons.js';
import { HelpCircle } from 'lucide-react';

/**
 * Phong cách điểm xuyết màu sắc nhẹ nhàng riêng theo từng Domain
 */
const DOMAIN_STYLES = {
  common: {
    iconBg: 'bg-sky-500/15 text-[#0284c7] dark:text-[#38bdf8]',
    borderHover: 'hover:border-[#38bdf8]/60 dark:hover:border-[#0284c7]/60 hover:bg-[#f0f9ff]/60 dark:hover:bg-[#0c1f38]/50',
  },
  'japan-life': {
    iconBg: 'bg-rose-500/15 text-[#e11d48] dark:text-[#fb7185]',
    borderHover: 'hover:border-[#fb7185]/60 dark:hover:border-[#f43f5e]/60 hover:bg-[#fff1f2]/60 dark:hover:bg-[#2d121c]/50',
  },
  'vietnam-life': {
    iconBg: 'bg-emerald-500/15 text-[#059669] dark:text-[#34d399]',
    borderHover: 'hover:border-[#34d399]/60 dark:hover:border-[#10b981]/60 hover:bg-[#f0fdf4]/60 dark:hover:bg-[#0c2419]/50',
  },
};

/**
 * DomainQuickShortcuts — Lưới 2x2 (4 nút) truy cập nhanh miniapp
 * Kích thước mỗi nút chiếm xấp xỉ 1/4 diện tích của Thẻ Domain
 */
export default function DomainQuickShortcuts({
  domainId = 'common',
  onSelectTool,
  displayLang = 'vi',
}) {
  const shortcuts = DOMAIN_SHORTCUTS[domainId] || [];
  const style = DOMAIN_STYLES[domainId] || DOMAIN_STYLES.common;

  return (
    <div className="grid grid-cols-2 gap-2 sm:gap-2.5 w-full">
      {shortcuts.map((tool) => {
        const IconComponent = iconMap[tool.icon] || HelpCircle;
        const toolTitle = tool.names[displayLang] || tool.names.vi;

        return (
          <button
            key={tool.id}
            type="button"
            onClick={() => onSelectTool?.(tool.id)}
            className={`flex items-center gap-2 px-2.5 py-2 sm:py-2.5 rounded-xl bg-surface-container/50 hover:bg-surface-container border border-border-subtle/80 ${style.borderHover} transition-all duration-150 cursor-pointer group shadow-2xs hover:shadow-xs active:scale-[0.98] outline-none focus-visible:ring-2 focus-visible:ring-primary select-none text-left`}
            title={toolTitle}
            aria-label={toolTitle}
          >
            <div className={`w-7 h-7 rounded-lg ${style.iconBg} flex items-center justify-center shrink-0 transition-transform duration-150 group-hover:scale-105`}>
              <IconComponent size={15} />
            </div>
            <span className="text-[11.5px] sm:text-xs font-semibold text-on-surface group-hover:text-primary transition-colors truncate">
              {toolTitle}
            </span>
          </button>
        );
      })}
    </div>
  );
}

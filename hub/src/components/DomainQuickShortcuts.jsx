import React from 'react';
import { DOMAIN_SHORTCUTS } from '../config/domainShortcuts.js';
import { tools } from '../config/toolsRegistry.js';
import { iconMap } from '../config/toolIcons.js';
import { HelpCircle, Sparkles } from 'lucide-react';

const toolRegistryMap = new Map(tools.map((t) => [t.id, t]));

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

const TOTAL_GRID_SLOTS = 8;

/**
 * DomainQuickShortcuts — Lưới 2 cột x 4 dòng (8 slots) truy cập nhanh miniapp
 * Đảm bảo các cột domain đồng đều chiều cao, hỗ trợ mở rộng miniapp dễ dàng
 */
export default function DomainQuickShortcuts({
  domainId = 'common',
  onSelectTool,
  displayLang = 'vi',
}) {
  const shortcuts = DOMAIN_SHORTCUTS[domainId] || [];
  const style = DOMAIN_STYLES[domainId] || DOMAIN_STYLES.common;
  const placeholderCount = Math.max(0, TOTAL_GRID_SLOTS - shortcuts.length);

  return (
    <div className="grid grid-cols-2 gap-2 sm:gap-2.5 w-full">
      {shortcuts.map((tool) => {
        const canonicalIcon = toolRegistryMap.get(tool.id)?.icon || tool.icon;
        const IconComponent = iconMap[canonicalIcon] || HelpCircle;
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

      {/* Các slot giữ chỗ để hoàn thiện lưới 2 cột x 4 dòng (8 slots) khi chưa đủ miniapp */}
      {Array.from({ length: placeholderCount }).map((_, idx) => {
        const placeholderText =
          displayLang === 'ja'
            ? '準備中...'
            : displayLang === 'en'
            ? 'Coming soon...'
            : 'Sắp ra mắt...';

        return (
          <div
            key={`placeholder-${domainId}-${idx}`}
            className="flex items-center gap-2 px-2.5 py-2 sm:py-2.5 rounded-xl bg-surface-container/20 border border-dashed border-border-subtle/60 text-outline/40 select-none"
            aria-hidden="true"
          >
            <div className="w-7 h-7 rounded-lg bg-surface-container-high/30 flex items-center justify-center shrink-0 text-outline/35">
              <Sparkles size={13} className="opacity-50" />
            </div>
            <span className="text-[11.5px] sm:text-xs font-medium text-outline/50 truncate italic">
              {placeholderText}
            </span>
          </div>
        );
      })}
    </div>
  );
}

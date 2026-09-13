import React from 'react';
import {
  DOMAIN_SHORTCUTS,
  JAPAN_LIFE_SECTIONS,
} from '../config/domainShortcuts.js';
import { tools } from '../config/toolsRegistry.js';
import { iconMap } from '../config/toolIcons.js';
import {
  HelpCircle,
  ChevronRight,
  Compass,
  ArrowRight,
  Building2,
  Landmark,
} from 'lucide-react';

const toolRegistryMap = new Map(tools.map((t) => [t.id, t]));

/**
 * Phong cách điểm xuyết màu sắc riêng theo từng Domain
 */
const DOMAIN_STYLES = {
  common: {
    iconBg: 'bg-sky-500/15 text-[#0284c7] dark:text-[#38bdf8]',
    borderHover: 'hover:border-[#38bdf8]/60 dark:hover:border-[#0284c7]/60 hover:bg-[#f0f9ff]/70 dark:hover:bg-[#0c1f38]/50',
    chevronColor: 'text-sky-500/70 group-hover:text-sky-600 dark:text-sky-400',
  },
  'japan-life': {
    iconBg: 'bg-rose-500/15 text-[#e11d48] dark:text-[#fb7185]',
    borderHover: 'hover:border-[#fb7185]/60 dark:hover:border-[#f43f5e]/60 hover:bg-[#fff1f2]/70 dark:hover:bg-[#2d121c]/50',
    chevronColor: 'text-rose-500/70 group-hover:text-rose-600 dark:text-rose-400',
  },
  'vietnam-life': {
    iconBg: 'bg-emerald-500/15 text-[#059669] dark:text-[#34d399]',
    borderHover: 'hover:border-[#34d399]/60 dark:hover:border-[#10b981]/60 hover:bg-[#f0fdf4]/70 dark:hover:bg-[#0c2419]/50',
    chevronColor: 'text-emerald-500/70 group-hover:text-emerald-600 dark:text-emerald-400',
  },
};

/**
 * DomainQuickShortcuts — Thiết kế giao diện theo sát Mockup hình ảnh người dùng:
 * 1. Japan Life: Banner Navigator + 2 cột (🇯🇵 Thủ tục tại Nhật & 🇻🇳 Lãnh sự Việt Nam)
 * 2. Tools & Vietnam Life: Lưới 2 cột x 4 dòng có tiêu đề, mô tả phụ và mũi tên điều hướng
 */
export default function DomainQuickShortcuts({
  domainId = 'common',
  onSelectTool,
  onSelectDomain,
  displayLang = 'vi',
}) {
  const shortcuts = DOMAIN_SHORTCUTS[domainId] || [];
  const style = DOMAIN_STYLES[domainId] || DOMAIN_STYLES.common;

  // Xử lý riêng cho JAPAN LIFE theo Mockup 2 cột + Banner Navigator
  if (domainId === 'japan-life') {
    const { japan_procedures, consular_vn } = JAPAN_LIFE_SECTIONS;

    return (
      <div className="w-full space-y-3.5">
        {/* Banner Japan Life Navigator: "Không biết bắt đầu từ đâu?" */}
        <div className="bg-[#fff1f2]/90 dark:bg-[#2d121c]/90 border border-rose-200 dark:border-rose-900/60 rounded-2xl p-3.5 sm:p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-rose-500/15 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
              <Compass size={18} />
            </div>
            <div className="space-y-0.5">
              <div className="text-xs sm:text-sm font-bold text-on-surface">
                {displayLang === 'ja'
                  ? 'どこから始めればよいか分かりませんか？'
                  : displayLang === 'en'
                  ? 'Not sure where to start?'
                  : 'Không biết bắt đầu từ đâu?'}
              </div>
              <p className="text-[11px] sm:text-xs text-on-surface-variant leading-snug">
                {displayLang === 'ja'
                  ? 'Japan Life Navigatorがご案内します！状況を教えていただければ、必要な手続きを提案します。'
                  : displayLang === 'en'
                  ? 'Let Japan Life Navigator help you! Just describe your situation and we will suggest needed procedures.'
                  : 'Hãy để Japan Life Navigator giúp bạn! Chỉ cần mô tả tình huống, chúng tôi sẽ gợi ý các thủ tục cần thiết.'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onSelectTool?.('japan-life-navigator')}
            className="self-end sm:self-auto px-4 py-1.5 sm:py-2 rounded-full text-xs font-bold bg-[#e11d48] hover:bg-[#be123c] text-white shadow-xs hover:shadow transition-all duration-150 flex items-center gap-1.5 shrink-0 cursor-pointer whitespace-nowrap active:scale-98"
          >
            <span>
              {displayLang === 'ja'
                ? '今すぐ始める'
                : displayLang === 'en'
                ? 'Start now'
                : 'Bắt đầu ngay'}
            </span>
            <ArrowRight size={13} />
          </button>
        </div>

        {/* 2 Cột bên dưới: 🇯🇵 Thủ tục tại Nhật & 🇻🇳 Lãnh sự Việt Nam */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {/* CỘT 1: 🇯🇵 THỦ TỤC TẠI NHẬT */}
          <div className="bg-surface-container-low/60 border border-border-subtle/80 rounded-2xl p-3 sm:p-3.5 flex flex-col justify-between space-y-3 shadow-2xs">
            <div className="space-y-2.5">
              {/* Header cột */}
              <div className="flex items-center gap-2 pb-1.5 border-b border-border-subtle/50">
                <span className="text-base">{japan_procedures.flag}</span>
                <div>
                  <h3 className="text-xs sm:text-sm font-bold text-on-surface">
                    {japan_procedures.title[displayLang] || japan_procedures.title.vi}
                  </h3>
                  <p className="text-[10.5px] text-outline">
                    {japan_procedures.subtitle[displayLang] || japan_procedures.subtitle.vi}
                  </p>
                </div>
              </div>

              {/* 4 Thẻ chức năng */}
              <div className="space-y-1.5">
                {japan_procedures.items.map((item) => {
                  const canonicalIcon = toolRegistryMap.get(item.id)?.icon || item.icon;
                  const IconComp = iconMap[canonicalIcon] || HelpCircle;
                  const title = item.title[displayLang] || item.title.vi;
                  const subtitle = item.subtitle[displayLang] || item.subtitle.vi;

                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => onSelectTool?.(item.id)}
                      className="w-full flex items-center justify-between p-2.5 rounded-xl bg-surface-container/50 hover:bg-surface-container border border-border-subtle/70 hover:border-rose-400/60 transition-all duration-150 text-left group cursor-pointer shadow-2xs"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-7 h-7 rounded-lg bg-rose-500/15 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                          <IconComp size={14} />
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-on-surface group-hover:text-primary transition-colors truncate">
                            {title}
                          </div>
                          <div className="text-[10.5px] text-outline truncate">
                            {subtitle}
                          </div>
                        </div>
                      </div>
                      <ChevronRight size={14} className="text-outline/70 group-hover:text-primary group-hover:translate-x-0.5 transition-all shrink-0 ml-1" />
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Nút chân cột */}
            <button
              type="button"
              onClick={() => onSelectDomain?.('japan-life')}
              className="w-full py-2 px-3 rounded-xl bg-rose-500/10 hover:bg-rose-500/15 text-rose-700 dark:text-rose-300 font-bold text-xs text-center border border-rose-300/40 dark:border-rose-800/40 transition-colors cursor-pointer flex items-center justify-center gap-1"
            >
              <span>{japan_procedures.actionText[displayLang] || japan_procedures.actionText.vi}</span>
            </button>
          </div>

          {/* CỘT 2: 🇻🇳 LÃNH SỰ VIỆT NAM */}
          <div className="bg-surface-container-low/60 border border-border-subtle/80 rounded-2xl p-3 sm:p-3.5 flex flex-col justify-between space-y-3 shadow-2xs">
            <div className="space-y-2.5">
              {/* Header cột */}
              <div className="flex items-center gap-2 pb-1.5 border-b border-border-subtle/50">
                <span className="text-base">{consular_vn.flag}</span>
                <div>
                  <h3 className="text-xs sm:text-sm font-bold text-on-surface">
                    {consular_vn.title[displayLang] || consular_vn.title.vi}
                  </h3>
                  <p className="text-[10.5px] text-outline">
                    {consular_vn.subtitle[displayLang] || consular_vn.subtitle.vi}
                  </p>
                </div>
              </div>

              {/* 4 Thẻ chức năng */}
              <div className="space-y-1.5">
                {consular_vn.items.map((item, idx) => {
                  const IconComp = iconMap[item.icon] || Landmark;
                  const title = item.title[displayLang] || item.title.vi;
                  const subtitle = item.subtitle[displayLang] || item.subtitle.vi;

                  return (
                    <button
                      key={`consular-${idx}`}
                      type="button"
                      onClick={() => onSelectTool?.('vietnam-consular-jp')}
                      className="w-full flex items-center justify-between p-2.5 rounded-xl bg-surface-container/50 hover:bg-surface-container border border-border-subtle/70 hover:border-amber-400/60 transition-all duration-150 text-left group cursor-pointer shadow-2xs"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-7 h-7 rounded-lg bg-amber-500/15 text-amber-700 dark:text-amber-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                          <IconComp size={14} />
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-on-surface group-hover:text-primary transition-colors truncate">
                            {title}
                          </div>
                          <div className="text-[10.5px] text-outline truncate">
                            {subtitle}
                          </div>
                        </div>
                      </div>
                      <ChevronRight size={14} className="text-outline/70 group-hover:text-primary group-hover:translate-x-0.5 transition-all shrink-0 ml-1" />
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Nút chân cột */}
            <button
              type="button"
              onClick={() => onSelectTool?.('vietnam-consular-jp')}
              className="w-full py-2 px-3 rounded-xl bg-amber-500/10 hover:bg-amber-500/15 text-amber-800 dark:text-amber-300 font-bold text-xs text-center border border-amber-300/40 dark:border-amber-800/40 transition-colors cursor-pointer flex items-center justify-center gap-1"
            >
              <span>{consular_vn.actionText[displayLang] || consular_vn.actionText.vi}</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // BỐ CỤC CHUẨN 2 CỘT X 4 DÒNG CHO TOOLS VÀ VIETNAM LIFE (Khớp Mockup)
  return (
    <div className="grid grid-cols-2 gap-2 sm:gap-2.5 w-full">
      {shortcuts.map((tool) => {
        const canonicalIcon = toolRegistryMap.get(tool.id)?.icon || tool.icon;
        const IconComponent = iconMap[canonicalIcon] || HelpCircle;
        const toolTitle = tool.names[displayLang] || tool.names.vi;
        const toolSubtitle = tool.subtitles?.[displayLang] || tool.subtitles?.vi || '';

        return (
          <button
            key={tool.id}
            type="button"
            onClick={() => onSelectTool?.(tool.id)}
            className={`flex items-center justify-between p-2.5 sm:p-3 rounded-xl bg-surface-container/50 hover:bg-surface-container border border-border-subtle/80 ${style.borderHover} transition-all duration-150 cursor-pointer group shadow-2xs hover:shadow-xs active:scale-[0.98] outline-none focus-visible:ring-2 focus-visible:ring-primary select-none text-left`}
            title={toolTitle}
            aria-label={toolTitle}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className={`w-8 h-8 rounded-lg ${style.iconBg} flex items-center justify-center shrink-0 transition-transform duration-150 group-hover:scale-105`}>
                <IconComponent size={16} />
              </div>
              <div className="min-w-0">
                <div className="text-[11.5px] sm:text-xs font-bold text-on-surface group-hover:text-primary transition-colors truncate">
                  {toolTitle}
                </div>
                {toolSubtitle && (
                  <div className="text-[10px] sm:text-[10.5px] text-outline truncate">
                    {toolSubtitle}
                  </div>
                )}
              </div>
            </div>
            <ChevronRight size={14} className={`${style.chevronColor} transition-transform duration-150 group-hover:translate-x-0.5 shrink-0 ml-1 opacity-70 group-hover:opacity-100`} />
          </button>
        );
      })}
    </div>
  );
}

import React from 'react';
import { ArrowLeft, Compass, SearchX } from 'lucide-react';
import ToolCard from './ToolCard.jsx';
import { HUB_DOMAINS } from '../config/hubPresentation.js';
import {
  ToolboxIllustration,
  SakuraBranchIllustration,
  TurtleTowerIllustration,
  LotusIllustration,
} from '../assets/illustrations/index.jsx';

export default function DomainCatalogue({
  group = 'common',
  tools = [],
  displayLang = 'vi',
  activeFilter = 'all',
  onSelectFilter,
  onSelectTool,
  onBackToHome,
}) {
  const domainConfig = HUB_DOMAINS[group] || HUB_DOMAINS.common;
  const isJapanLife = group === 'japan-life';
  const isVietnamLife = group === 'vietnam-life';

  const title = domainConfig.name[displayLang] || domainConfig.name.vi;
  const subtitle = domainConfig.subtitle[displayLang] || domainConfig.subtitle.vi;

  // Filter tools based on activeFilter
  const filteredTools = React.useMemo(() => {
    if (activeFilter === 'all') return tools;
    return tools.filter((tool) => {
      if (isJapanLife) {
        return tool.domain === activeFilter;
      }
      return tool.category === activeFilter;
    });
  }, [tools, activeFilter, isJapanLife]);

  // If Vietnam Life has no active tools yet, show Coming Soon state
  if (isVietnamLife && tools.length === 0) {
    return (
      <main className="flex-1 max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        {/* Back Button */}
        <button
          type="button"
          onClick={onBackToHome}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold text-on-surface-variant hover:text-on-surface bg-surface-subtle hover:bg-surface-container border border-border-subtle transition-colors mb-6 cursor-pointer"
        >
          <ArrowLeft size={14} />
          <span>{displayLang === 'ja' ? 'ホームへ戻る' : displayLang === 'en' ? 'Back to Home' : 'Quay lại Trang chủ'}</span>
        </button>

        {/* Coming Soon Empty State */}
        <div className="rounded-2xl border border-dashed border-border-subtle bg-surface-container/60 p-8 sm:p-14 text-center flex flex-col items-center justify-center space-y-5">
          <div className="w-28 h-28 sm:w-36 sm:h-36 text-emerald-500/80 mb-2">
            <TurtleTowerIllustration />
          </div>
          <div className="space-y-2 max-w-md">
            <span className="inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 mb-2">
              {displayLang === 'ja' ? '近日公開' : displayLang === 'en' ? 'Coming Soon' : 'Đang phát triển'}
            </span>
            <h2 className="font-title-lg text-2xl font-bold text-on-surface">
              {displayLang === 'ja'
                ? 'ベトナム生活ツールは準備中です'
                : displayLang === 'en'
                ? 'Vietnam Life is under development'
                : 'Vietnam Life đang được phát triển'}
            </h2>
            <p className="font-body-sm text-sm text-on-surface-variant leading-relaxed">
              {displayLang === 'ja'
                ? 'ベトナムでの税金、行政手続き、生活サポートツールを順次追加予定です。'
                : displayLang === 'en'
                ? 'Tools supporting procedures, tax calculations, and daily life in Vietnam will be added here soon.'
                : 'Các công cụ hỗ trợ cuộc sống, thủ tục hành chính và tài chính tại Việt Nam sẽ được bổ sung tại đây.'}
            </p>
          </div>
          <button
            type="button"
            onClick={onBackToHome}
            className="px-5 py-2.5 rounded-xl bg-primary text-on-primary font-label-sm text-xs font-semibold hover:bg-primary/90 transition-colors shadow-sm"
          >
            {displayLang === 'ja' ? 'すべてのツールを見る' : displayLang === 'en' ? 'Explore other tools' : 'Khám phá các công cụ khác'}
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full space-y-6">
      {/* Domain Header */}
      <div className="relative overflow-hidden rounded-2xl bg-surface-container border border-border-subtle p-6 sm:p-8">
        {/* Subtle Decorative Vector background in header */}
        <div className="absolute right-0 top-0 bottom-0 w-64 sm:w-80 opacity-15 pointer-events-none flex items-center justify-end overflow-hidden pr-4">
          {isJapanLife ? (
            <SakuraBranchIllustration className="w-full h-auto text-rose-400" />
          ) : isVietnamLife ? (
            <TurtleTowerIllustration className="w-full h-auto text-emerald-500" />
          ) : (
            <ToolboxIllustration className="w-full h-auto text-primary" />
          )}
        </div>

        <div className="relative z-10 space-y-3 max-w-2xl">
          {/* Back to Home Button */}
          <button
            type="button"
            onClick={onBackToHome}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-on-surface-variant hover:text-on-surface bg-surface-subtle hover:bg-surface-container-high border border-border-subtle transition-colors cursor-pointer"
          >
            <ArrowLeft size={14} />
            <span>{displayLang === 'ja' ? 'ホーム' : displayLang === 'en' ? 'Home' : 'Trang chủ'}</span>
          </button>

          {/* Title & Subtitle */}
          <div className="flex flex-wrap items-baseline gap-3 pt-1">
            <h1 className="font-title-lg text-2xl sm:text-3xl font-bold text-on-surface tracking-tight">
              {title}
            </h1>
            <span className="text-xs sm:text-sm font-semibold text-outline font-mono">
              ({tools.length} {displayLang === 'ja' ? 'ツール' : displayLang === 'en' ? 'tools' : 'công cụ'})
            </span>
          </div>

          <p className="font-body-sm text-xs sm:text-sm text-on-surface-variant leading-relaxed">
            {subtitle}
          </p>
        </div>
      </div>

      {/* Optional Japan Life Navigator Shortcut Callout */}
      {isJapanLife && (
        <div
          onClick={() => onSelectTool?.('japan-life-navigator')}
          className="flex items-center justify-between gap-3 px-4 py-3 rounded-xl bg-surface-subtle hover:bg-surface-container border border-border-subtle hover:border-primary-container/60 transition-all cursor-pointer group shadow-2xs"
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              onSelectTool?.('japan-life-navigator');
            }
          }}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-primary/15 text-primary border border-primary/25 flex items-center justify-center shrink-0">
              <Compass size={17} />
            </div>
            <div className="min-w-0">
              <p className="font-title-sm text-xs sm:text-sm font-semibold text-on-surface group-hover:text-primary transition-colors">
                {displayLang === 'ja'
                  ? 'どこから始めればよいかわからないですか？'
                  : displayLang === 'en'
                  ? 'Not sure where to start?'
                  : 'Không biết bắt đầu từ đâu?'}
              </p>
              <p className="font-body-sm text-[11px] text-on-surface-variant truncate">
                {displayLang === 'ja'
                  ? 'Japan Life Navigator を開いて手続き全体のロードマップを確認 →'
                  : displayLang === 'en'
                  ? 'Open Japan Life Navigator for an integrated lifecycle guide →'
                  : 'Mở Japan Life Navigator để xem lộ trình thủ tục cuộc sống toàn diện →'}
              </p>
            </div>
          </div>
          <span className="hidden sm:inline-flex items-center gap-1 text-xs font-semibold text-primary shrink-0 group-hover:translate-x-0.5 transition-transform">
            {displayLang === 'ja' ? '開く →' : displayLang === 'en' ? 'Open →' : 'Mở ngay →'}
          </span>
        </div>
      )}

      {/* Content Filter Chips */}
      <div className="border-b border-border-subtle/70 pb-3">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none" role="tablist">
          {domainConfig.filters.map((filter) => {
            const isSelected = activeFilter === filter.id;
            const label = filter.label[displayLang] || filter.label.vi;
            return (
              <button
                key={filter.id}
                type="button"
                role="tab"
                aria-selected={isSelected}
                onClick={() => onSelectFilter?.(filter.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors cursor-pointer shrink-0 border ${
                  isSelected
                    ? 'bg-primary text-on-primary border-primary font-semibold shadow-xs'
                    : 'bg-surface-subtle text-on-surface-variant hover:text-on-surface hover:bg-surface-container border-border-subtle'
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Full-width Miniapp Grid (3 cards/row on desktop, 2 on tablet, 1 on mobile) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredTools.map((tool) => (
          <ToolCard
            key={tool.id}
            tool={tool}
            onSelectTool={onSelectTool}
            displayLang={displayLang}
          />
        ))}
      </div>

      {/* Empty Filter State */}
      {filteredTools.length === 0 && (
        <div className="rounded-xl border border-dashed border-border-subtle bg-surface-container/50 px-6 py-12 text-center flex flex-col items-center justify-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-surface-subtle flex items-center justify-center text-outline">
            <SearchX size={24} />
          </div>
          <p className="font-title-sm text-sm font-semibold text-on-surface">
            {displayLang === 'ja'
              ? '該当するツールがありません'
              : displayLang === 'en'
              ? 'No tools found for this filter'
              : 'Không có công cụ nào trong bộ lọc này'}
          </p>
          <button
            type="button"
            onClick={() => onSelectFilter?.('all')}
            className="px-4 py-2 rounded-lg bg-surface-container-high hover:bg-surface-variant text-primary font-label-sm text-xs font-semibold border border-border-subtle transition-colors"
          >
            {displayLang === 'ja' ? 'すべてのツールを表示' : displayLang === 'en' ? 'Show all tools' : 'Xem tất cả công cụ'}
          </button>
        </div>
      )}
    </main>
  );
}

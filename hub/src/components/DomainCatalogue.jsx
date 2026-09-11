import React, { useMemo } from 'react';
import { ArrowLeft, ChevronDown, Compass, SearchX, ArrowRight } from 'lucide-react';
import ToolCard from './ToolCard.jsx';
import { HUB_DOMAINS } from '../config/hubPresentation.js';
import {
  ToolboxIcon,
  SakuraIcon,
  LotusIcon,
  ToolsWatermark,
  JapanLifeWatermark,
  VietnamLifeHeroIllustration,
} from '../assets/illustrations/index.jsx';

/**
 * DomainCatalogue — Trang hiển thị chi tiết các miniapp theo từng nhóm (Tools, Japan Life, Vietnam Life)
 * Đạt chuẩn thiết kế theo Hình 1 & Hình 2:
 * - Header với nút quay lại, Icon lớn, Tiêu đề, Badge số lượng, Mô tả ngắn
 * - Desktop: Tabs danh mục ngang; Mobile: Dropdown Selector [ Tất cả ⌵ ] tránh tràn viền
 * - Desktop: Lưới Card Grid 3 cột; Mobile: Danh sách Compact List Items tối ưu ngón cái
 * - Watermark chìm nghệ thuật ở nền trang
 * - Nút liên kết "Xem tất cả công cụ ->" ở chân danh sách
 */

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

  // Render Icon đại diện nhóm
  const renderHeaderIcon = () => {
    if (isJapanLife) {
      return <SakuraIcon size={42} />;
    }
    if (isVietnamLife) {
      return <LotusIcon size={42} />;
    }
    return <ToolboxIcon size={42} />;
  };

  // Lọc công cụ thông minh theo tab
  const filteredTools = useMemo(() => {
    if (activeFilter === 'all') return tools;

    if (isJapanLife) {
      if (activeFilter === 'procedures-documents') {
        return tools.filter((t) => t.domain === 'procedures-documents' || t.domain === 'navigator');
      }
      return tools.filter((t) => t.domain === activeFilter);
    }

    if (isVietnamLife) {
      return tools.filter((t) => (t.domain || t.category) === activeFilter);
    }

    // Nhóm Tools (Common)
    return tools.filter((t) => {
      const cat = t.category || '';
      const id = t.id || '';
      if (activeFilter === 'pdf') {
        return cat === 'pdf' || id.includes('pdf');
      }
      if (activeFilter === 'image') {
        return cat === 'image' || id.includes('screen') || id.includes('photo') || id.includes('watermark');
      }
      if (activeFilter === 'office') {
        return cat === 'office' || id.includes('excel') || id.includes('invoice') || id.includes('accounting') || id.includes('bi');
      }
      if (activeFilter === 'text') {
        return id.includes('editor') || cat === 'text' || cat === 'ai' || id.includes('legal') || id.includes('translate');
      }
      if (activeFilter === 'qr') {
        return id.includes('barcode') || id.includes('qr') || id.includes('card');
      }
      if (activeFilter === 'utils') {
        return cat === 'utils' || id.includes('bird') || id.includes('ninja');
      }
      return cat === activeFilter;
    });
  }, [tools, activeFilter, isJapanLife, isVietnamLife]);

  // Nhãn badge số lượng công cụ
  const getBadgeLabel = () => {
    if (isVietnamLife) {
      if (displayLang === 'ja') return '近日公開';
      if (displayLang === 'en') return 'Coming Soon';
      return 'Sắp ra mắt';
    }
    if (displayLang === 'ja') return `${tools.length} ツール`;
    if (displayLang === 'en') return `${tools.length} tools`;
    return `${tools.length} công cụ`;
  };

  // Nhãn nút xem tất cả ở cuối
  const getAllLinkText = () => {
    if (isJapanLife) {
      if (displayLang === 'ja') return 'すべての Japan Life ツールを表示 →';
      if (displayLang === 'en') return 'View all Japan Life tools →';
      return 'Xem tất cả công cụ Japan Life →';
    }
    if (displayLang === 'ja') return `すべての ${tools.length} ツールを表示 →`;
    if (displayLang === 'en') return `View all ${tools.length} tools →`;
    return `Xem tất cả ${tools.length} công cụ →`;
  };

  // =========================================================================
  // TRƯỜNG HỢP VIETNAM LIFE: TRẠNG THÁI ĐANG PHÁT TRIỂN (HÌNH 1 - MỤC 4)
  // =========================================================================
  if (isVietnamLife && tools.length === 0) {
    return (
      <main className="flex-1 max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full space-y-6 relative">
        {/* Header Vietnam Life */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border-subtle/70">
          <div className="flex items-center gap-3.5">
            <button
              type="button"
              onClick={onBackToHome}
              className="p-2 rounded-xl text-on-surface-variant hover:text-on-surface hover:bg-surface-container border border-border-subtle transition-colors cursor-pointer"
              title="Quay lại Trang chủ"
              aria-label="Quay lại Trang chủ"
            >
              <ArrowLeft size={18} />
            </button>
            <div className="flex items-center gap-3">
              <div className="shrink-0">{renderHeaderIcon()}</div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="font-title-lg text-xl sm:text-2xl font-bold text-on-surface tracking-tight">
                    {title}
                  </h1>
                </div>
                <p className="font-body-sm text-xs sm:text-sm text-on-surface-variant mt-0.5">
                  {subtitle}
                </p>
              </div>
            </div>
          </div>

          <span className="self-start sm:self-auto px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25 tracking-wide">
            {getBadgeLabel()}
          </span>
        </div>

        {/* Filter tabs theo mockup */}
        <div className="hidden sm:flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none" role="tablist">
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
                className={`px-3.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors cursor-pointer shrink-0 border ${
                  isSelected
                    ? 'bg-emerald-600 text-white border-emerald-600 font-semibold shadow-xs'
                    : 'bg-surface-subtle text-on-surface-variant hover:text-on-surface hover:bg-surface-container border-border-subtle'
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>

        {/* Centerpiece Artwork Khuê Văn Các / Chùa Một Cột */}
        <div className="rounded-3xl border border-dashed border-emerald-500/30 bg-emerald-50/40 dark:bg-emerald-950/20 p-8 sm:p-16 text-center flex flex-col items-center justify-center space-y-5 my-4">
          <div className="w-36 h-36 sm:w-44 sm:h-44 transition-transform hover:scale-105 duration-300">
            <VietnamLifeHeroIllustration size="100%" />
          </div>

          <div className="space-y-2 max-w-lg mx-auto">
            <h2 className="font-title-lg text-2xl sm:text-3xl font-extrabold text-on-surface tracking-tight">
              {displayLang === 'ja'
                ? 'Vietnam Life は現在開発中です'
                : displayLang === 'en'
                ? 'Vietnam Life is under development'
                : 'Vietnam Life đang được phát triển'}
            </h2>
            <p className="font-body-sm text-xs sm:text-sm text-on-surface-variant leading-relaxed">
              {displayLang === 'ja'
                ? '私たちはベトナムでの生活に役立つ実用的なツールを構築しています。近日公開予定ですので、どうぞお楽しみに！'
                : displayLang === 'en'
                ? 'We are actively building purpose-built tools for everyday life and procedures in Vietnam. Please check back soon!'
                : 'Chúng tôi đang xây dựng các công cụ hữu ích cho cuộc sống tại Việt Nam. Hãy quay lại sớm nhé!'}
            </p>
          </div>

          <button
            type="button"
            onClick={onBackToHome}
            className="px-5 py-2.5 rounded-xl bg-primary text-on-primary font-label-sm text-xs font-semibold hover:bg-primary/90 transition-colors shadow-xs cursor-pointer"
          >
            {displayLang === 'ja' ? 'すべてのツールを見る' : displayLang === 'en' ? 'Explore other tools' : 'Khám phá các công cụ khác'}
          </button>
        </div>
      </main>
    );
  }

  // =========================================================================
  // TRƯỜNG HỢP TOOLS HOẶC JAPAN LIFE: CÓ DANH SÁCH CÔNG CỤ HOÀN CHỈNH
  // =========================================================================
  return (
    <main className="flex-1 max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full space-y-6 relative">
      {/* 1. NÉT VẼ CHÌM NGHỆ THUẬT NỀN TRANG (WATERMARK) */}
      <div className="absolute right-4 bottom-10 pointer-events-none z-0 overflow-hidden">
        {isJapanLife ? (
          <JapanLifeWatermark className="w-80 h-80 opacity-60" />
        ) : (
          <ToolsWatermark className="w-72 h-72 opacity-60" />
        )}
      </div>

      {/* 2. HEADER TRANG CON CHUẨN MOCKUP */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border-subtle/70 relative z-10">
        <div className="flex items-center gap-3.5">
          {/* Nút quay lại */}
          <button
            type="button"
            onClick={onBackToHome}
            className="p-2 rounded-xl text-on-surface-variant hover:text-on-surface hover:bg-surface-container border border-border-subtle transition-colors cursor-pointer"
            title="Quay lại Trang chủ"
            aria-label="Quay lại Trang chủ"
          >
            <ArrowLeft size={18} />
          </button>

          {/* Icon lớn và Tiêu đề */}
          <div className="flex items-center gap-3">
            <div className="shrink-0">{renderHeaderIcon()}</div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-title-lg text-xl sm:text-2xl font-bold text-on-surface tracking-tight">
                  {title}
                </h1>
              </div>
              <p className="font-body-sm text-xs sm:text-sm text-on-surface-variant mt-0.5">
                {subtitle}
              </p>
            </div>
          </div>
        </div>

        {/* Badge đếm số lượng công cụ */}
        <span
          className={`self-start sm:self-auto px-3 py-1 rounded-full text-xs font-semibold tracking-wide border ${
            isJapanLife
              ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/25'
              : 'bg-primary/10 text-primary border-primary/25'
          }`}
        >
          {getBadgeLabel()}
        </span>
      </div>

      {/* 3. LỜI KHUYÊN ĐIỀU HƯỚNG JAPAN LIFE NAVIGATOR (NẾU Ở JAPAN LIFE) */}
      {isJapanLife && (
        <div
          onClick={() => onSelectTool?.('japan-life-navigator')}
          className="relative z-10 flex items-center justify-between gap-3 px-4 py-3 rounded-xl bg-surface-subtle hover:bg-surface-container border border-border-subtle hover:border-primary-container/60 transition-all cursor-pointer group shadow-2xs"
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

      {/* 4. BỘ LỌC DANH MỤC (TABS TRÊN DESKTOP, DROPDOWN TRÊN MOBILE) */}
      <div className="relative z-10">
        {/* A. Desktop Tabs: Thanh lọc ngang với pills bo góc đẹp mắt */}
        <div className="hidden sm:flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none" role="tablist">
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
                className={`px-3.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors cursor-pointer shrink-0 border ${
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

        {/* B. Mobile Dropdown Select: Chuẩn Mockup Hình 2, tránh tràn viền */}
        <div className="block sm:hidden">
          <div className="relative">
            <select
              value={activeFilter}
              onChange={(e) => onSelectFilter?.(e.target.value)}
              className="w-full appearance-none px-4 py-2.5 rounded-xl bg-surface-container border border-border-subtle text-on-surface font-semibold text-xs pr-10 focus:outline-none focus:border-primary cursor-pointer shadow-xs"
            >
              {domainConfig.filters.map((filter) => (
                <option key={filter.id} value={filter.id}>
                  {filter.label[displayLang] || filter.label.vi}
                </option>
              ))}
            </select>
            <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-on-surface-variant">
              <ChevronDown size={16} />
            </div>
          </div>
        </div>
      </div>

      {/* 5. HIỂN THỊ DANH SÁCH MINIAPP */}
      <div className="relative z-10">
        {/* A. Desktop & Tablet: Lưới Card Grid 2 đến 3 cột */}
        <div className="hidden sm:grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredTools.map((tool) => (
            <ToolCard
              key={tool.id}
              tool={tool}
              onSelectTool={onSelectTool}
              displayLang={displayLang}
              variant="grid"
            />
          ))}
        </div>

        {/* B. Mobile: Danh sách Compact List Items dạng hàng theo Hình 2 */}
        <div className="flex flex-col gap-2.5 sm:hidden">
          {filteredTools.map((tool) => (
            <ToolCard
              key={tool.id}
              tool={tool}
              onSelectTool={onSelectTool}
              displayLang={displayLang}
              variant="compact-list"
            />
          ))}
        </div>
      </div>

      {/* 6. TRẠNG THÁI KHÔNG TÌM THẤY TRONG BỘ LỌC */}
      {filteredTools.length === 0 && (
        <div className="relative z-10 rounded-2xl border border-dashed border-border-subtle bg-surface-container/50 px-6 py-12 text-center flex flex-col items-center justify-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-surface-subtle flex items-center justify-center text-outline">
            <SearchX size={24} />
          </div>
          <p className="font-title-sm text-sm font-semibold text-on-surface">
            {displayLang === 'ja'
              ? '該当するツールがありません'
              : displayLang === 'en'
              ? 'No tools found in this category'
              : 'Không có công cụ nào trong danh mục này'}
          </p>
          <button
            type="button"
            onClick={() => onSelectFilter?.('all')}
            className="px-4 py-2 rounded-lg bg-surface-container-high hover:bg-surface-variant text-primary font-label-sm text-xs font-semibold border border-border-subtle transition-colors cursor-pointer"
          >
            {displayLang === 'ja' ? 'すべてのツールを表示' : displayLang === 'en' ? 'Show all tools' : 'Xem tất cả công cụ'}
          </button>
        </div>
      )}

      {/* 7. LIÊN KẾT XEM TẤT CẢ CÔNG CỤ Ở CHÂN TRANG (THEO MOCKUP HÌNH 1) */}
      {filteredTools.length > 0 && activeFilter !== 'all' && (
        <div className="relative z-10 pt-4 pb-2 text-left">
          <button
            type="button"
            onClick={() => onSelectFilter?.('all')}
            className="inline-flex items-center gap-1.5 font-label-sm text-xs sm:text-sm font-bold text-primary hover:underline cursor-pointer group"
          >
            <span>{getAllLinkText()}</span>
          </button>
        </div>
      )}
    </main>
  );
}

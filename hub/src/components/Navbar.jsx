import React, { useState } from 'react';
import { Sparkles, Search, Globe, Settings2, Code2, User } from 'lucide-react';

export default function Navbar({
  displayLang,
  onLangChange,
  onOpenSearch,
  onOpenSettings,
  activeCategory,
  onSelectCategory,
  categoryIds,
}) {
  const [langDropdown, setLangDropdown] = useState(false);

  const categoryLabels = {
    all: { vi: 'Tất cả', en: 'All', ja: 'すべて' },
    pdf: { vi: 'Công cụ PDF', en: 'PDF Tools', ja: 'PDF ツール' },
    image: { vi: 'Hình ảnh & WebP', en: 'Image & WebP', ja: '画像＆WebP' },
    office: { vi: 'Excel & Hóa đơn', en: 'Excel & Invoices', ja: 'Excel・請求書' },
    utils: { vi: 'Tiện ích', en: 'Utilities', ja: '便利ツール' },
    ai: { vi: 'Dịch thuật & AI', en: 'AI & Translation', ja: 'AI・翻訳' },
    'in-development': { vi: 'Đang phát triển', en: 'In development', ja: '開発中' },
  };

  return (
    <header className="no-print bg-surface-canvas/90 backdrop-blur-xl border-b border-border-subtle sticky top-0 z-50 shadow-sm">
      <div className="max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand Logo */}
        <div
          onClick={() => {
            if (onSelectCategory) onSelectCategory('all');
          }}
          className="flex items-center gap-3 cursor-pointer select-none shrink-0"
        >
          <div className="w-8 h-8 rounded-lg bg-surface-container border border-border-subtle flex items-center justify-center text-primary-container shadow-sm">
            <Sparkles size={18} className="text-primary-container" />
          </div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-lg tracking-tight text-on-surface">
              AI-Tools
            </span>
            <span className="px-2 py-[2px] bg-primary-container text-on-primary-container font-mono text-[10px] font-bold rounded">
              HUB
            </span>
          </div>
        </div>

        {/* Center Search Bar Trigger */}
        <div className="hidden md:flex items-center flex-1 max-w-sm mx-4">
          <button
            type="button"
            onClick={onOpenSearch}
            className="w-full flex items-center px-3 py-1.5 bg-surface-subtle border border-border-subtle hover:border-primary-container text-on-surface-variant rounded-lg gap-2 cursor-pointer transition-colors shadow-inner text-left"
          >
            <Search size={16} className="text-outline shrink-0" />
            <span className="flex-1 text-xs text-outline font-normal truncate">
              {displayLang === 'vi'
                ? 'Tìm kiếm công cụ nhanh...'
                : displayLang === 'en'
                ? 'Quick search tools...'
                : 'ツールを検索...'}
            </span>
            <kbd className="px-1.5 py-[2px] bg-surface-container border border-border-subtle text-on-surface-variant font-mono text-[10px] rounded shrink-0">
              ⌘K
            </kbd>
          </button>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2.5 shrink-0">
          {/* Offline/Client Processing Trust Indicator */}
          <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 bg-surface-container border border-border-subtle rounded-full">
            <span className="w-2 h-2 rounded-full bg-secondary animate-pulse" />
            <span className="font-mono text-[11px] font-semibold text-secondary">
              Xử lý Offline/Client
            </span>
          </div>

          {/* Mobile Search Button */}
          <button
            onClick={onOpenSearch}
            className="md:hidden p-2 rounded-lg bg-surface-subtle border border-border-subtle text-on-surface-variant hover:text-on-surface"
            aria-label="Search"
          >
            <Search size={18} />
          </button>

          {/* Language Selector */}
          <div className="relative">
            <button
              onClick={() => setLangDropdown(!langDropdown)}
              className="flex items-center gap-1 px-2.5 py-1.5 bg-surface-subtle hover:bg-surface-container border border-border-subtle text-on-surface-variant hover:text-on-surface rounded-lg font-mono text-xs font-semibold transition-colors"
            >
              <Globe size={14} className="text-brand-cyan-bright" />
              <span>{displayLang.toUpperCase()}</span>
            </button>

            {langDropdown && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setLangDropdown(false)} />
                <div className="absolute right-0 mt-2 w-36 bg-surface-container border border-border-subtle rounded-xl shadow-xl z-50 p-1.5 overflow-hidden">
                  <button
                    onClick={() => { onLangChange('vi'); setLangDropdown(false); }}
                    className={`w-full text-left px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${displayLang === 'vi' ? 'bg-primary-container/20 text-primary font-bold' : 'text-on-surface-variant hover:bg-surface-subtle'}`}
                  >
                    Tiếng Việt
                  </button>
                  <button
                    onClick={() => { onLangChange('en'); setLangDropdown(false); }}
                    className={`w-full text-left px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${displayLang === 'en' ? 'bg-primary-container/20 text-primary font-bold' : 'text-on-surface-variant hover:bg-surface-subtle'}`}
                  >
                    English
                  </button>
                  <button
                    onClick={() => { onLangChange('ja'); setLangDropdown(false); }}
                    className={`w-full text-left px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${displayLang === 'ja' ? 'bg-primary-container/20 text-primary font-bold' : 'text-on-surface-variant hover:bg-surface-subtle'}`}
                  >
                    日本語
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Source Code Link */}
          <a
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 text-on-surface-variant hover:text-on-surface transition-colors flex items-center justify-center rounded"
            title="Mã nguồn"
            aria-label="Mã nguồn"
          >
            <Code2 size={18} />
          </a>

          {/* Settings Button */}
          <button
            onClick={onOpenSettings}
            className="p-2 rounded-lg bg-surface-subtle hover:bg-surface-container border border-border-subtle text-on-surface-variant hover:text-on-surface transition-colors flex items-center justify-center"
            title="Cài đặt miniapp"
            aria-label="Cài đặt miniapp"
          >
            <Settings2 size={16} />
          </button>

          {/* User Profile Avatar */}
          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-on-primary shrink-0 shadow-sm">
            <User size={16} />
          </div>
        </div>
      </div>

      {/* Secondary Category Navigation Sub-bar */}
      {onSelectCategory && (
        <div className="bg-surface-dim border-t border-border-subtle/30 shadow-[0_1px_8px_rgba(0,0,0,0.04)]">
          <div className="max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8 flex items-center">
            <nav className="flex items-center gap-6 overflow-x-auto py-1 scrollbar-none">
              {['all', 'pdf', 'image', 'office', 'utils']
                .filter((catId) => !categoryIds || (categoryIds.has ? categoryIds.has(catId) : categoryIds.includes(catId)))
                .map((catId) => {
                  const isActive = activeCategory === catId;
                  const label = categoryLabels[catId]?.[displayLang] || catId;
                  return (
                    <button
                      key={catId}
                      type="button"
                      onClick={() => onSelectCategory(catId)}
                      className={`py-2 text-xs sm:text-sm whitespace-nowrap transition-colors border-b-2 font-medium ${
                        isActive
                          ? 'border-primary-container text-primary font-semibold'
                          : 'border-transparent text-on-surface-variant hover:text-on-surface'
                      }`}
                    >
                      {label}
                    </button>
                  );
                })}
            </nav>
          </div>
        </div>
      )}
    </header>
  );
}


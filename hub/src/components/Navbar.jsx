import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, Search, Globe, Settings2, Code2, X } from 'lucide-react';
import ThemeToggle from './ThemeToggle';

export default function Navbar({
  displayLang,
  onLangChange,
  onOpenSettings,
  activeCategory,
  onSelectCategory,
  categoryIds,
  searchQuery = '',
  onSearchChange,
}) {
  const [langDropdown, setLangDropdown] = useState(false);
  const searchInputRef = useRef(null);

  const categoryLabels = {
    all: { vi: 'Tất cả', en: 'All', ja: 'すべて' },
    pdf: { vi: 'PDF', en: 'PDF', ja: 'PDF' },
    image: { vi: 'Hình ảnh & WebP', en: 'Image & WebP', ja: '画像＆WebP' },
    office: { vi: 'Excel & Hóa đơn', en: 'Excel & Invoices', ja: 'Excel・請求書' },
    utils: { vi: 'Tiện ích', en: 'Utilities', ja: '便利ツール' },
    ai: { vi: 'Dịch thuật & AI', en: 'AI & Translation', ja: 'AI・翻訳' },
    'in-development': { vi: 'Đang phát triển', en: 'In development', ja: '開発中' },
  };

  // Keyboard shortcut: pressing / or ⌘K focuses search
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (
        (e.key === '/' && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') ||
        ((e.metaKey || e.ctrlKey) && e.key === 'k')
      ) {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <header className="no-print bg-surface-canvas/95 backdrop-blur-xl border-b border-border-subtle sticky top-0 z-50 shadow-sm">
      <div className="max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3">
        {/* Brand Logo */}
        <div
          onClick={() => {
            if (onSelectCategory) onSelectCategory('all');
            if (onSearchChange) onSearchChange('');
          }}
          className="flex items-center gap-2.5 cursor-pointer select-none shrink-0"
        >
          <div className="w-8 h-8 rounded-lg bg-surface-container border border-border-subtle flex items-center justify-center text-primary-container shadow-sm">
            <Sparkles size={18} className="text-primary-container" />
          </div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-lg tracking-tight text-on-surface">
              AI-Tools
            </span>
            <span className="px-1.5 py-[2px] bg-primary-container text-on-primary-container font-mono text-[10px] font-bold rounded">
              HUB
            </span>
          </div>
        </div>

        {/* Global Live Search Bar */}
        <div className="flex-1 max-w-md mx-2 sm:mx-6">
          <div className="relative flex items-center w-full">
            <Search size={15} className="absolute left-3 text-outline pointer-events-none shrink-0" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange && onSearchChange(e.target.value)}
              placeholder={
                displayLang === 'vi'
                  ? 'Tìm kiếm công cụ nhanh (nhấn / để tìm)...'
                  : displayLang === 'en'
                  ? 'Search tools (/ to focus)...'
                  : 'ツールを検索 (/)...'
              }
              className="w-full pl-9 pr-14 py-1.5 bg-surface-subtle/80 hover:bg-surface-subtle focus:bg-surface-container border border-border-subtle focus:border-primary-container text-on-surface placeholder:text-outline text-xs rounded-lg transition-colors outline-none shadow-inner"
            />
            {searchQuery ? (
              <button
                type="button"
                onClick={() => {
                  if (onSearchChange) onSearchChange('');
                  searchInputRef.current?.focus();
                }}
                className="absolute right-2.5 p-1 text-outline hover:text-on-surface transition-colors"
                title="Xóa tìm kiếm"
              >
                <X size={14} />
              </button>
            ) : (
              <kbd className="hidden sm:inline-block absolute right-2.5 px-1.5 py-[2px] bg-surface-container border border-border-subtle/80 text-outline font-mono text-[10px] rounded pointer-events-none">
                /
              </kbd>
            )}
          </div>
        </div>

        {/* Essential Right Controls */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Theme Selector (Light/Dark/System) */}
          <ThemeToggle displayLang={displayLang} />

          {/* Language Selector */}
          <div className="relative">
            <button
              onClick={() => setLangDropdown(!langDropdown)}
              className="flex items-center gap-1 px-2.5 py-1.5 bg-surface-subtle hover:bg-surface-container border border-border-subtle text-on-surface-variant hover:text-on-surface rounded-lg font-mono text-xs font-semibold transition-colors"
              aria-label="Chọn ngôn ngữ"
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

          {/* Settings Button */}
          <button
            onClick={onOpenSettings}
            className="p-2 rounded-lg bg-surface-subtle hover:bg-surface-container border border-border-subtle text-on-surface-variant hover:text-on-surface transition-colors flex items-center justify-center"
            title="Cài đặt miniapp ẩn/hiện"
            aria-label="Cài đặt miniapp"
          >
            <Settings2 size={16} />
          </button>

          {/* Source Code Link */}
          <a
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 text-on-surface-variant hover:text-on-surface transition-colors flex items-center justify-center rounded"
            title="Mã nguồn"
            aria-label="Mã nguồn"
          >
            <Code2 size={17} />
          </a>
        </div>
      </div>

      {/* Primary Category Navigation Sub-bar */}
      {onSelectCategory && (
        <div className="bg-surface-dim/70 border-t border-border-subtle/40">
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


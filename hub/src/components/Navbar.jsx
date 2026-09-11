import React, { useState, useRef, useEffect } from 'react';
import { Search, Globe, SlidersHorizontal, Code2, X, Gamepad2, Swords, Menu } from 'lucide-react';
import ThemeToggle from './ThemeToggle';
import ToolioLogo from './ToolioLogo';

/**
 * Navbar — Thanh điều hướng chuẩn duy nhất (Single Source of Truth)
 * Thiết kế tinh tế theo Mockup Hình 1 & Hình 2:
 * - Logo Toolio với badge HUB và slogan "Tiện ích nhỏ, hiệu quả lớn."
 * - Ô tìm kiếm trực quan trung tâm: "Tìm kiếm công cụ, thủ tục, hoặc tình huống..." với phím tắt /
 * - Nút chuyển theme Sáng/Tối dạng pill, ngôn ngữ, cài đặt và mã nguồn
 * - Responsive Mobile: Nút tìm kiếm và nút menu hamburger tiện lợi
 */

export default function Navbar({
  displayLang = 'vi',
  onLangChange,
  onOpenSettings,
  searchQuery = '',
  onSearchChange,
  onGoHome,
  showFlappyBird = true,
  onOpenFlappyGame,
  showToolioNinja = true,
  onOpenNinjaGame,
}) {
  const [langDropdown, setLangDropdown] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const searchInputRef = useRef(null);
  const mobileInputRef = useRef(null);

  // Phím tắt / hoặc Cmd+K để focus vào ô tìm kiếm
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      } else if (e.key === '/' && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Tự động focus ô tìm kiếm mobile khi mở
  useEffect(() => {
    if (mobileSearchOpen) {
      setTimeout(() => mobileInputRef.current?.focus(), 100);
    }
  }, [mobileSearchOpen]);

  const searchPlaceholder =
    displayLang === 'vi'
      ? 'Tìm kiếm công cụ, thủ tục, hoặc tình huống...'
      : displayLang === 'en'
      ? 'Search tools, procedures, or situations...'
      : 'ツール、手続き、状況から検索...';

  return (
    <header className="no-print bg-surface-canvas/95 backdrop-blur-xl border-b border-border-subtle sticky top-0 z-50 shadow-xs">
      <div className="max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3">
        {/* 1. BRAND LOGO */}
        <div
          onClick={() => {
            if (onSearchChange) onSearchChange('');
            if (onGoHome) onGoHome();
          }}
          className="flex items-center gap-2.5 cursor-pointer select-none shrink-0 group"
          title={displayLang === 'vi' ? 'Toolio — Tiện ích nhỏ, hiệu quả lớn' : displayLang === 'ja' ? 'Toolio — 小さなツール、大きな効果' : 'Toolio — Tiny Tools. Huge Impact.'}
        >
          <ToolioLogo size={34} variant="app-icon" className="transition-transform group-hover:scale-105" />
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-base sm:text-lg tracking-tight text-on-surface">
                Toolio
              </span>
              <span className="inline-block px-1.5 py-[2px] bg-primary/15 text-primary border border-primary/25 font-mono text-[9px] font-bold rounded tracking-wider uppercase">
                HUB
              </span>
            </div>
            <span className="hidden xl:block text-[10px] text-on-surface-variant/80 font-medium tracking-tight -mt-0.5">
              {displayLang === 'vi' ? 'Tiện ích nhỏ, hiệu quả lớn.' : displayLang === 'ja' ? '小さなツール、大きな効果。' : 'Tiny Tools. Huge Impact.'}
            </span>
          </div>
        </div>

        {/* 2. GLOBAL LIVE SEARCH BAR (DESKTOP & TABLET - SOT) */}
        <div className="hidden md:flex flex-1 min-w-0 max-w-lg mx-4">
          <div className="relative flex items-center w-full">
            <Search size={15} className="absolute left-3.5 text-outline pointer-events-none shrink-0" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange && onSearchChange(e.target.value)}
              placeholder={searchPlaceholder}
              className="w-full min-w-0 pl-10 pr-12 py-2 bg-surface-subtle/80 hover:bg-surface-subtle focus:bg-surface-container border border-border-subtle focus:border-primary-container text-on-surface placeholder:text-outline text-xs rounded-xl transition-colors outline-none shadow-2xs"
            />
            {searchQuery ? (
              <button
                type="button"
                onClick={() => {
                  if (onSearchChange) onSearchChange('');
                  searchInputRef.current?.focus();
                }}
                className="absolute right-3 p-1 text-outline hover:text-on-surface transition-colors cursor-pointer"
                title="Xóa tìm kiếm"
              >
                <X size={14} />
              </button>
            ) : (
              <kbd className="hidden lg:inline-block absolute right-3 px-1.5 py-[2px] bg-surface-container border border-border-subtle/80 text-outline font-mono text-[10px] rounded pointer-events-none">
                /
              </kbd>
            )}
          </div>
        </div>

        {/* 3. RIGHT CONTROLS (DESKTOP) */}
        <div className="hidden md:flex items-center gap-2 shrink-0">
          {/* Theme Selector (Pill button: Sáng / Tối) */}
          <ThemeToggle displayLang={displayLang} />

          {/* Language Selector */}
          <div className="relative">
            <button
              onClick={() => setLangDropdown(!langDropdown)}
              className="flex items-center gap-1 px-2.5 py-1.5 bg-surface-subtle hover:bg-surface-container border border-border-subtle text-on-surface-variant hover:text-on-surface rounded-lg font-mono text-xs font-semibold transition-colors cursor-pointer"
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
                    className={`w-full text-left px-3 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer ${displayLang === 'vi' ? 'bg-primary-container/20 text-primary font-bold' : 'text-on-surface-variant hover:bg-surface-subtle'}`}
                  >
                    Tiếng Việt
                  </button>
                  <button
                    onClick={() => { onLangChange('en'); setLangDropdown(false); }}
                    className={`w-full text-left px-3 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer ${displayLang === 'en' ? 'bg-primary-container/20 text-primary font-bold' : 'text-on-surface-variant hover:bg-surface-subtle'}`}
                  >
                    English
                  </button>
                  <button
                    onClick={() => { onLangChange('ja'); setLangDropdown(false); }}
                    className={`w-full text-left px-3 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer ${displayLang === 'ja' ? 'bg-primary-container/20 text-primary font-bold' : 'text-on-surface-variant hover:bg-surface-subtle'}`}
                  >
                    日本語
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Flappy Bird shortcut (khi pet bị ẩn) */}
          {!showFlappyBird && onOpenFlappyGame && (
            <button
              type="button"
              onClick={onOpenFlappyGame}
              className="p-2 rounded-lg bg-surface-subtle hover:bg-surface-container border border-border-subtle text-amber-500 hover:text-amber-400 transition-colors flex items-center justify-center cursor-pointer"
              title={displayLang === 'vi' ? 'Chơi Flappy Bird' : displayLang === 'ja' ? 'フラッピーバードをプレイ' : 'Play Flappy Bird'}
              aria-label="Play Flappy Bird"
            >
              <Gamepad2 size={16} />
            </button>
          )}

          {/* Toolio Ninja shortcut (khi pet bị ẩn) */}
          {!showToolioNinja && onOpenNinjaGame && (
            <button
              type="button"
              onClick={onOpenNinjaGame}
              className="p-2 rounded-lg bg-surface-subtle hover:bg-surface-container border border-border-subtle text-primary hover:text-brand-cyan-bright transition-colors flex items-center justify-center cursor-pointer"
              title={displayLang === 'vi' ? 'Chơi Toolio Ninja Run' : displayLang === 'ja' ? 'ツーリオ・ニンジャをプレイ' : 'Play Toolio Ninja Run'}
              aria-label="Play Toolio Ninja Run"
            >
              <Swords size={16} />
            </button>
          )}

          {/* Settings / Filters Button */}
          <button
            onClick={onOpenSettings}
            className="p-2 rounded-lg bg-surface-subtle hover:bg-surface-container border border-border-subtle text-on-surface-variant hover:text-on-surface transition-colors flex items-center justify-center cursor-pointer"
            title="Cài đặt miniapp ẩn/hiện"
            aria-label="Cài đặt miniapp"
          >
            <SlidersHorizontal size={16} />
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

        {/* 4. MOBILE CONTROLS (THEO HÌNH 2: NÚT TÌM KIẾM & NÚT HAMBURGER MENU) */}
        <div className="flex md:hidden items-center gap-1.5">
          {/* Nút tìm kiếm mobile */}
          <button
            type="button"
            onClick={() => setMobileSearchOpen(!mobileSearchOpen)}
            className={`p-2 rounded-xl border transition-colors cursor-pointer ${
              mobileSearchOpen || searchQuery
                ? 'bg-primary/15 text-primary border-primary/30'
                : 'bg-surface-subtle text-on-surface-variant hover:text-on-surface border-border-subtle'
            }`}
            title="Tìm kiếm"
            aria-label="Tìm kiếm"
          >
            <Search size={18} />
          </button>

          {/* Nút Hamburger menu mobile */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-xl bg-surface-subtle hover:bg-surface-container border border-border-subtle text-on-surface-variant hover:text-on-surface transition-colors cursor-pointer"
            title="Menu"
            aria-label="Menu"
          >
            <Menu size={18} />
          </button>
        </div>
      </div>

      {/* 5. MOBILE EXPANDABLE SEARCH BAR */}
      {mobileSearchOpen && (
        <div className="md:hidden px-4 pb-3 pt-1 border-t border-border-subtle/60 bg-surface-canvas/98 animate-in slide-in-from-top-2 duration-150">
          <div className="relative flex items-center w-full">
            <Search size={15} className="absolute left-3.5 text-outline pointer-events-none" />
            <input
              ref={mobileInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange && onSearchChange(e.target.value)}
              placeholder={searchPlaceholder}
              className="w-full pl-10 pr-9 py-2 bg-surface-subtle border border-border-subtle focus:border-primary text-on-surface placeholder:text-outline text-xs rounded-xl outline-none shadow-2xs"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => onSearchChange && onSearchChange('')}
                className="absolute right-3 p-1 text-outline hover:text-on-surface"
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>
      )}

      {/* 6. MOBILE DRAWER MENU */}
      {mobileMenuOpen && (
        <>
          <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-xs md:hidden" onClick={() => setMobileMenuOpen(false)} />
          <div className="absolute right-4 top-16 w-60 p-3 bg-surface-container border border-border-subtle rounded-2xl shadow-xl z-50 md:hidden space-y-3 animate-in fade-in zoom-in-95 duration-100">
            <div className="flex items-center justify-between pb-2 border-b border-border-subtle/60">
              <span className="text-xs font-bold text-on-surface">Menu</span>
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                className="p-1 text-outline hover:text-on-surface"
              >
                <X size={14} />
              </button>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between py-1">
                <span className="text-xs text-on-surface-variant font-medium">Giao diện:</span>
                <ThemeToggle displayLang={displayLang} />
              </div>

              <div className="flex items-center justify-between py-1">
                <span className="text-xs text-on-surface-variant font-medium">Ngôn ngữ:</span>
                <div className="flex items-center gap-1">
                  {['vi', 'en', 'ja'].map((lang) => (
                    <button
                      key={lang}
                      type="button"
                      onClick={() => onLangChange(lang)}
                      className={`px-2 py-1 rounded text-[11px] font-mono font-semibold uppercase ${
                        displayLang === lang
                          ? 'bg-primary text-on-primary'
                          : 'bg-surface-subtle text-on-surface-variant hover:text-on-surface'
                      }`}
                    >
                      {lang}
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenSettings();
                }}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-xl bg-surface-subtle hover:bg-surface-container-high text-xs font-semibold text-on-surface transition-colors"
              >
                <SlidersHorizontal size={15} className="text-primary" />
                <span>Cài đặt Miniapp</span>
              </button>
            </div>
          </div>
        </>
      )}
    </header>
  );
}

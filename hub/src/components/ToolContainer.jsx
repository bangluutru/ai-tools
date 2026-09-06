import React, { useState, useRef, useEffect } from 'react';
import { ArrowLeft, ChevronDown, CheckCircle2, Globe, Sparkles } from 'lucide-react';
import ThemeToggle from './ThemeToggle';

export default function ToolContainer({
  currentTool,
  onBackToHub,
  onSelectTool,
  displayLang = 'vi',
  onLangChange,
  tools = [],
  children
}) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [langDropdown, setLangDropdown] = useState(false);
  const dropdownRef = useRef(null);
  const langDropdownRef = useRef(null);

  // Close dropdowns on outside click or escape
  useEffect(() => {
    if (!dropdownOpen && !langDropdown) return undefined;
    const handleOutsideClick = (e) => {
      if (dropdownOpen && dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
      if (langDropdown && langDropdownRef.current && !langDropdownRef.current.contains(e.target)) {
        setLangDropdown(false);
      }
    };
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setDropdownOpen(false);
        setLangDropdown(false);
      }
    };

    window.addEventListener('mousedown', handleOutsideClick);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('mousedown', handleOutsideClick);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [dropdownOpen, langDropdown]);

  const getToolName = (t) => {
    if (!t) return '';
    if (displayLang === 'en') return t.name_en || t.name_vn;
    if (displayLang === 'ja') return t.name_ja || t.name_vn;
    return t.name_vn;
  };

  return (
    <div className="min-h-screen flex flex-col bg-surface-canvas text-on-surface">
      {/* Top Tool Navigation Bar: Unified h-16 Header matching Navbar aesthetics */}
      <header className="no-print bg-surface-canvas/95 backdrop-blur-xl border-b border-border-subtle sticky top-0 z-50 shadow-sm">
        <div className="max-w-[1240px] mx-auto px-3 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-2 sm:gap-3">
          {/* Left Cluster: Logo -> Divider -> Back to Hub -> Quick Tool Switcher */}
          <div className="flex items-center gap-1.5 sm:gap-3 min-w-0">
            {/* Brand Logo */}
            <div
              onClick={onBackToHub}
              className="flex items-center gap-2 cursor-pointer select-none shrink-0"
              title={displayLang === 'vi' ? 'Về trang chủ AI-Tools HUB' : displayLang === 'en' ? 'Back to AI-Tools HUB' : 'AI-Tools HUB ホームへ'}
              aria-label={displayLang === 'vi' ? 'Về trang chủ AI-Tools HUB' : displayLang === 'en' ? 'Back to AI-Tools HUB' : 'AI-Tools HUB ホームへ'}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onBackToHub();
                }
              }}
            >
              <div className="w-8 h-8 rounded-lg bg-surface-container border border-border-subtle flex items-center justify-center text-primary-container shadow-sm">
                <Sparkles size={18} className="text-primary-container" />
              </div>
              <div className="hidden sm:flex items-center gap-1.5">
                <span className="font-bold text-base sm:text-lg tracking-tight text-on-surface">
                  AI-Tools
                </span>
                <span className="hidden md:inline-block px-1.5 py-[2px] bg-primary-container text-on-primary-container font-mono text-[10px] font-bold rounded">
                  HUB
                </span>
              </div>
            </div>

            {/* Vertical Separator */}
            <div className="h-5 w-px bg-border-subtle shrink-0 mx-0.5 sm:mx-1 hidden xs:block" />

            {/* Back to Hub Button */}
            <button
              type="button"
              onClick={onBackToHub}
              className="flex items-center gap-1.5 px-2 sm:px-3 py-1.5 rounded-lg bg-surface-subtle hover:bg-surface-container border border-border-subtle text-on-surface-variant hover:text-on-surface text-xs font-semibold transition-colors cursor-pointer shrink-0"
              title={displayLang === 'vi' ? 'Quay lại trung tâm' : displayLang === 'en' ? 'Back to Hub' : 'ハブに戻る'}
              aria-label={displayLang === 'vi' ? 'Quay lại trung tâm' : displayLang === 'en' ? 'Back to Hub' : 'ハブに戻る'}
            >
              <ArrowLeft size={14} className="text-outline shrink-0" />
              <span className="hidden sm:inline">
                {displayLang === 'vi' ? 'Về Trung Tâm' : displayLang === 'en' ? 'Back to Hub' : 'ハブに戻る'}
              </span>
            </button>

            {/* Quick Tool Switcher Dropdown */}
            <div className="relative min-w-0 shrink" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setDropdownOpen((prev) => !prev)}
                aria-haspopup="listbox"
                aria-expanded={dropdownOpen}
                aria-label="Chuyển nhanh công cụ"
                className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1.5 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface border border-border-subtle text-xs font-semibold transition-all cursor-pointer shadow-sm min-w-0"
              >
                <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: currentTool.color }} />
                <span className="truncate max-w-[90px] sm:max-w-[190px] font-semibold">{getToolName(currentTool)}</span>
                <ChevronDown size={13} className={`text-outline transition-transform duration-200 shrink-0 ${dropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {dropdownOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setDropdownOpen(false)} />
                  <div className="absolute left-0 mt-2 w-72 bg-surface-container border border-border-subtle rounded-xl shadow-2xl z-50 p-1.5 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                    <div className="px-3 py-2 font-label-sm text-[11px] font-bold text-outline uppercase tracking-wider border-b border-border-subtle flex items-center justify-between">
                      <span>
                        {displayLang === 'vi' ? 'Chuyển nhanh công cụ' : displayLang === 'en' ? 'Quick Switch Tool' : 'ツール切り替え'}
                      </span>
                      <span className="text-secondary text-[10px] font-mono">{tools.length}</span>
                    </div>
                    <div className="max-h-80 overflow-y-auto py-1 space-y-0.5">
                      {tools.filter((t) => t.readiness !== 'in-development').map((t) => (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => {
                            onSelectTool(t.id);
                            setDropdownOpen(false);
                          }}
                          className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs rounded-lg text-left transition-all cursor-pointer ${
                            t.id === currentTool.id
                              ? 'bg-surface-container-highest text-primary font-bold border border-primary/20'
                              : 'text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface'
                          }`}
                        >
                          <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: t.color }} />
                          <span className="truncate flex-1 font-body-sm">{getToolName(t)}</span>
                          {t.id === currentTool.id && <CheckCircle2 size={13} className="text-primary shrink-0" />}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Right Cluster: Theme Selector + Language Selector */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Theme Selector (Light/Dark/System) */}
            <ThemeToggle displayLang={displayLang} />

            {/* Language Selector Dropdown (VI, EN, JA) */}
            <div className="relative" ref={langDropdownRef}>
              <button
                type="button"
                onClick={() => setLangDropdown((prev) => !prev)}
                className="flex items-center gap-1 px-2 sm:px-2.5 py-1.5 bg-surface-subtle hover:bg-surface-container border border-border-subtle text-on-surface-variant hover:text-on-surface rounded-lg font-mono text-xs font-semibold transition-colors cursor-pointer"
                aria-label="Chọn ngôn ngữ"
                aria-haspopup="true"
                aria-expanded={langDropdown}
              >
                <Globe size={14} className="text-brand-cyan-bright" />
                <span>{displayLang.toUpperCase()}</span>
              </button>

              {langDropdown && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setLangDropdown(false)} />
                  <div className="absolute right-0 mt-2 w-36 bg-surface-container border border-border-subtle rounded-xl shadow-xl z-50 p-1.5 overflow-hidden">
                    <button
                      type="button"
                      onClick={() => {
                        onLangChange?.('vi');
                        setLangDropdown(false);
                      }}
                      className={`w-full text-left px-3 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
                        displayLang === 'vi' ? 'bg-primary-container/20 text-primary font-bold' : 'text-on-surface-variant hover:bg-surface-subtle'
                      }`}
                    >
                      Tiếng Việt
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        onLangChange?.('en');
                        setLangDropdown(false);
                      }}
                      className={`w-full text-left px-3 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
                        displayLang === 'en' ? 'bg-primary-container/20 text-primary font-bold' : 'text-on-surface-variant hover:bg-surface-subtle'
                      }`}
                    >
                      English
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        onLangChange?.('ja');
                        setLangDropdown(false);
                      }}
                      className={`w-full text-left px-3 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
                        displayLang === 'ja' ? 'bg-primary-container/20 text-primary font-bold' : 'text-on-surface-variant hover:bg-surface-subtle'
                      }`}
                    >
                      日本語
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Tool Content */}
      <main className="flex-1 w-full">
        {currentTool.outputPurpose === 'reference' && (
          <div className="no-print border-b border-tertiary/20 bg-tertiary/10 px-4 py-2 text-center font-body-sm text-xs text-tertiary">
            Đầu ra chỉ mang tính tham khảo và cần người có thẩm quyền kiểm tra trước khi sử dụng.
          </div>
        )}
        {children}
      </main>
    </div>
  );
}

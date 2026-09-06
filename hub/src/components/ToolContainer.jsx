import React, { useState, useRef, useEffect } from 'react';
import { ArrowLeft, ChevronDown, ChevronRight, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { categories } from '../config/toolsRegistry';
import ThemeToggle from './ThemeToggle';

export default function ToolContainer({ currentTool, onBackToHub, onSelectTool, displayLang, tools, children }) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    if (!dropdownOpen) return undefined;
    const handleOutsideClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setDropdownOpen(false);
    };

    window.addEventListener('mousedown', handleOutsideClick);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('mousedown', handleOutsideClick);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [dropdownOpen]);

  const getToolName = (t) => {
    if (!t) return '';
    if (displayLang === 'en') return t.name_en;
    if (displayLang === 'ja') return t.name_ja;
    return t.name_vn;
  };

  const getCategoryName = () => {
    const cat = categories.find((c) => c.id === currentTool.category);
    if (!cat) return 'Công cụ';
    if (displayLang === 'en') return cat.label_en;
    if (displayLang === 'ja') return cat.label_ja;
    return cat.label_vn;
  };

  // Subtle privacy note
  const isClientSide = currentTool.processing === 'browser';

  return (
    <div className="min-h-screen flex flex-col bg-surface-canvas text-on-surface">
      {/* Top Tool Navigation Bar */}
      <header className="no-print bg-surface-canvas/90 backdrop-blur-xl border-b border-border-subtle px-4 md:px-8 py-2.5 flex items-center justify-between sticky top-0 z-50 shadow-sm">
        <div className="flex items-center gap-3 sm:gap-4 min-w-0">
          {/* Back to Hub button */}
          <button
            onClick={onBackToHub}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-subtle hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface border border-border-subtle font-label-sm text-label-sm transition-all group shrink-0 cursor-pointer"
            title="Quay lại danh mục công cụ"
          >
            <ArrowLeft size={14} className="group-hover:-translate-x-0.5 transition-transform text-outline group-hover:text-primary" />
            <span className="hidden sm:inline">Về Trung Tâm</span>
            <span className="sm:hidden">Hub</span>
          </button>

          <div className="h-4 w-px bg-border-subtle shrink-0 hidden md:block" />

          {/* Breadcrumb Trail */}
          <nav className="hidden lg:flex items-center gap-1.5 font-label-sm text-label-sm text-outline shrink min-w-0 truncate">
            <button onClick={onBackToHub} className="hover:text-primary transition-colors cursor-pointer">
              AI-Tools Hub
            </button>
            <ChevronRight size={13} className="text-border-subtle shrink-0" />
            <span className="text-on-surface-variant shrink-0">{getCategoryName()}</span>
            <ChevronRight size={13} className="text-border-subtle shrink-0" />
            <span className="text-on-surface font-semibold truncate">{getToolName(currentTool)}</span>
          </nav>

          <div className="h-4 w-px bg-border-subtle shrink-0 hidden lg:block" />

          {/* Quick Tool Switcher Dropdown */}
          <div className="relative shrink-0" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setDropdownOpen((prev) => !prev)}
              aria-haspopup="listbox"
              aria-expanded={dropdownOpen}
              aria-label="Chuyển nhanh công cụ"
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface border border-border-subtle font-label-sm text-label-sm transition-all cursor-pointer shadow-sm"
            >
              <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: currentTool.color }} />
              <span className="truncate max-w-[140px] sm:max-w-[200px] font-semibold">{getToolName(currentTool)}</span>
              <ChevronDown size={13} className={`text-outline transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {dropdownOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setDropdownOpen(false)} />
                <div className="absolute left-0 mt-2 w-72 bg-surface-container border border-border-subtle rounded-xl shadow-2xl z-50 p-1.5 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                  <div className="px-3 py-2 font-label-sm text-[11px] font-bold text-outline uppercase tracking-wider border-b border-border-subtle flex items-center justify-between">
                    <span>Chuyển nhanh công cụ</span>
                    <span className="text-secondary text-[10px] font-mono">{tools.length} khả dụng</span>
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

        {/* Right Header: Theme Selector & Subtle Privacy Note */}
        <div className="flex items-center gap-3 shrink-0">
          <ThemeToggle displayLang={displayLang} />
          <div className="flex items-center gap-1.5 text-xs text-outline">
            <ShieldCheck size={14} className="text-secondary shrink-0" />
            <span className="hidden sm:inline">
              {isClientSide ? 'Xử lý trực tiếp trên trình duyệt' : 'Xử lý bảo mật'}
            </span>
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

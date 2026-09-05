import React, { useEffect } from 'react';
import { Eye, EyeOff, RotateCcw, Settings2, Wrench, X, Sun, Moon, Monitor } from 'lucide-react';
import { useTheme, THEMES } from '@ai-tools/core';

export default function SettingsModal({
  isOpen,
  onClose,
  tools,
  hiddenToolIds,
  onToggleTool,
  onShowAll,
  onReset,
  displayLang,
}) {
  const { themePreference, setTheme } = useTheme();

  useEffect(() => {
    if (!isOpen) return undefined;
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    // Khóa cuộn nền để danh sách dài trong modal không kéo theo trang chủ phía sau.
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const hiddenIds = new Set(hiddenToolIds);
  const activeTools = tools.filter((tool) => tool.readiness !== 'in-development');
  const pausedTools = tools.filter((tool) => tool.readiness === 'in-development');
  const visibleActiveCount = activeTools.filter((tool) => !hiddenIds.has(tool.id)).length;
  const getToolName = (tool) => {
    if (displayLang === 'en') return tool.name_en;
    if (displayLang === 'ja') return tool.name_ja;
    return tool.name_vn;
  };

  const renderToolRow = (tool) => {
    const isVisible = !hiddenIds.has(tool.id);
    return (
      <button
        key={tool.id}
        type="button"
        onClick={() => onToggleTool(tool.id)}
        className="flex w-full items-center gap-3 rounded-2xl border border-border-subtle bg-surface-subtle/50 p-3 text-left transition-colors hover:border-border-subtle hover:bg-surface-subtle"
        aria-pressed={isVisible}
      >
        <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${isVisible ? 'bg-secondary/15 text-secondary' : 'bg-surface-container-high text-outline'}`}>
          {isVisible ? <Eye size={17} /> : <EyeOff size={17} />}
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-bold text-on-surface">{getToolName(tool)}</div>
          <div className="mt-0.5 text-[10px] font-semibold uppercase tracking-wide text-outline">
            {tool.readiness}
          </div>
        </div>
        <span className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${isVisible ? 'bg-secondary' : 'bg-surface-container-highest'}`}>
          <span className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow transition-transform ${isVisible ? 'translate-x-6' : 'translate-x-1'}`} />
        </span>
      </button>
    );
  };

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/75 px-4 py-8 backdrop-blur-sm"
      onClick={onClose}
      role="presentation"
    >
      <section
        className="flex max-h-[85vh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl border border-border-subtle bg-surface-container shadow-2xl"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="hub-settings-title"
      >
        <header className="flex items-start justify-between gap-4 border-b border-border-subtle px-5 py-4 sm:px-6">
          <div className="flex gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-secondary/15 text-secondary">
              <Settings2 size={20} />
            </div>
            <div>
              <h2 id="hub-settings-title" className="font-bold text-on-surface">Cài đặt ứng dụng</h2>
              <p className="mt-1 text-xs leading-relaxed text-on-surface-variant">
                Tùy chỉnh giao diện hiển thị và ẩn/hiện công cụ trên trang chủ. Thiết lập được lưu trên trình duyệt này.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-2 text-outline transition-colors hover:bg-surface-subtle hover:text-on-surface"
            aria-label="Đóng cài đặt"
          >
            <X size={18} />
          </button>
        </header>

        {/* Theme Appearance Selector */}
        <div className="border-b border-border-subtle/80 bg-surface-subtle/40 px-5 py-3.5 sm:px-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="text-xs font-bold text-on-surface">Chế độ giao diện</div>
              <div className="text-[11px] text-outline mt-0.5">Tùy chọn nền sáng, tối hoặc tự động theo thiết bị</div>
            </div>
            <div className="flex items-center gap-1.5 bg-surface-container p-1 rounded-xl border border-border-subtle shrink-0">
              <button
                type="button"
                onClick={() => setTheme(THEMES.LIGHT)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  themePreference === THEMES.LIGHT
                    ? 'bg-primary-container text-white shadow-sm'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                <Sun size={14} className={themePreference === THEMES.LIGHT ? 'text-white' : 'text-amber-500'} />
                <span>Sáng</span>
              </button>
              <button
                type="button"
                onClick={() => setTheme(THEMES.DARK)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  themePreference === THEMES.DARK
                    ? 'bg-primary-container text-white shadow-sm'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                <Moon size={14} className={themePreference === THEMES.DARK ? 'text-white' : 'text-brand-cyan-bright'} />
                <span>Tối</span>
              </button>
              <button
                type="button"
                onClick={() => setTheme(THEMES.SYSTEM)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  themePreference === THEMES.SYSTEM
                    ? 'bg-primary-container text-white shadow-sm'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                <Monitor size={14} />
                <span>Hệ thống</span>
              </button>
            </div>
          </div>
        </div>

        {/* Tools count & reset bar */}
        <div className="flex items-center justify-between gap-3 border-b border-border-subtle/80 bg-surface-subtle/20 px-5 py-3 text-xs sm:px-6">
          <span className="font-semibold text-on-surface-variant">Đang hiển thị {visibleActiveCount}/{activeTools.length} miniapp hoạt động</span>
          <div className="flex gap-2">
            <button type="button" onClick={onShowAll} className="rounded-lg px-2.5 py-1.5 font-semibold text-secondary hover:bg-secondary/10">
              Hiện tất cả
            </button>
            <button type="button" onClick={onReset} className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 font-semibold text-outline hover:bg-surface-subtle hover:text-on-surface">
              <RotateCcw size={13} /> Mặc định
            </button>
          </div>
        </div>

        <div className="custom-scrollbar space-y-5 overflow-y-auto p-3 sm:p-4">
          <div className="space-y-2">{activeTools.map(renderToolRow)}</div>

          {pausedTools.length > 0 && (
            <section className="space-y-2">
              <div className="rounded-2xl border border-dashed border-border-subtle bg-surface-subtle/30 px-4 py-3">
                <h3 className="text-xs font-bold uppercase tracking-wide text-on-surface">
                  Đang phát triển ({pausedTools.length})
                </h3>
                <p className="mt-1 text-[11px] leading-relaxed text-outline">
                  Những miniapp này đã tạm dừng và không được build vào portal. Chúng nằm riêng trong
                  nhóm <span className="font-semibold text-on-surface-variant">Đang phát triển</span> trên trang chủ
                  để nhắc rằng đang có công cụ chờ làm tiếp, và không xuất hiện ở nhóm nào khác.
                </p>
              </div>
              {pausedTools.map((tool) => (
                <div
                  key={tool.id}
                  className="flex items-start gap-3 rounded-2xl border border-border-subtle bg-surface-subtle/30 p-3"
                >
                  <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-surface-container-high text-outline">
                    <Wrench size={16} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-bold text-on-surface">{getToolName(tool)}</div>
                    {tool.unavailableReason && (
                      <p className="mt-1 text-[11px] leading-relaxed text-outline">{tool.unavailableReason}</p>
                    )}
                  </div>
                </div>
              ))}
            </section>
          )}
        </div>
      </section>
    </div>
  );
}

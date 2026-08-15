import React, { useEffect } from 'react';
import { Eye, EyeOff, RotateCcw, Settings2, X } from 'lucide-react';

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
    const isPaused = tool.readiness === 'in-development';
    const isVisible = !hiddenIds.has(tool.id);
    return (
      <button
        key={tool.id}
        type="button"
        onClick={() => onToggleTool(tool.id)}
        className="flex w-full items-center gap-3 rounded-2xl border border-slate-800 bg-slate-950/35 p-3 text-left transition-colors hover:border-slate-700 hover:bg-slate-800/60"
        aria-pressed={isVisible}
      >
        <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${isVisible ? 'bg-emerald-500/15 text-emerald-400' : 'bg-slate-800 text-slate-500'}`}>
          {isVisible ? <Eye size={17} /> : <EyeOff size={17} />}
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-bold text-slate-200">{getToolName(tool)}</div>
          <div className="mt-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
            {isPaused ? 'Đang phát triển • không mở được' : tool.readiness}
          </div>
          {isPaused && tool.unavailableReason && (
            <p className="mt-1 text-[11px] leading-relaxed text-slate-500 normal-case">{tool.unavailableReason}</p>
          )}
        </div>
        <span className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${isVisible ? 'bg-emerald-500' : 'bg-slate-700'}`}>
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
        className="flex max-h-[85vh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl border border-slate-700/80 bg-slate-900 shadow-2xl"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="hub-settings-title"
      >
        <header className="flex items-start justify-between gap-4 border-b border-slate-800 px-5 py-4 sm:px-6">
          <div className="flex gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-emerald-500/15 text-emerald-400">
              <Settings2 size={20} />
            </div>
            <div>
              <h2 id="hub-settings-title" className="font-bold text-slate-100">Cài đặt miniapp</h2>
              <p className="mt-1 text-xs leading-relaxed text-slate-400">
                Chọn công cụ xuất hiện trên trang chủ, tìm kiếm và menu chuyển nhanh. Thiết lập được lưu trên trình duyệt này.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-2 text-slate-400 transition-colors hover:bg-slate-800 hover:text-white"
            aria-label="Đóng cài đặt"
          >
            <X size={18} />
          </button>
        </header>

        <div className="flex items-center justify-between gap-3 border-b border-slate-800/80 bg-slate-950/40 px-5 py-3 text-xs sm:px-6">
          <span className="font-semibold text-slate-300">Đang hiển thị {visibleActiveCount}/{activeTools.length} miniapp hoạt động</span>
          <div className="flex gap-2">
            <button type="button" onClick={onShowAll} className="rounded-lg px-2.5 py-1.5 font-semibold text-emerald-400 hover:bg-emerald-500/10">
              Hiện tất cả
            </button>
            <button type="button" onClick={onReset} className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 font-semibold text-slate-400 hover:bg-slate-800 hover:text-slate-200">
              <RotateCcw size={13} /> Mặc định
            </button>
          </div>
        </div>

        <div className="custom-scrollbar space-y-5 overflow-y-auto p-3 sm:p-4">
          <div className="space-y-2">{activeTools.map(renderToolRow)}</div>

          {pausedTools.length > 0 && (
            <section className="space-y-2">
              <div className="rounded-2xl border border-dashed border-slate-700/80 bg-slate-950/50 px-4 py-3">
                <h3 className="text-xs font-bold uppercase tracking-wide text-slate-300">
                  Khu vực đang phát triển ({pausedTools.length})
                </h3>
                <p className="mt-1 text-[11px] leading-relaxed text-slate-500">
                  Những miniapp này đã tạm dừng và không được build vào portal. Bật để xem trạng thái
                  trên trang chủ; thẻ sẽ hiển thị nhưng không mở được cho đến khi công cụ được phát triển lại.
                </p>
              </div>
              {pausedTools.map(renderToolRow)}
            </section>
          )}
        </div>
      </section>
    </div>
  );
}

import React, { useCallback, useEffect, useMemo } from 'react';
import { X } from 'lucide-react';
import { rankItems } from '@chotto/search';
import { ToolioSearchBox } from '@ai-tools/core/search/ToolioSearchBox.jsx';
import { pickLang, useToolioSearch } from '@ai-tools/core/search/toolioSearch.js';
import { renderToolIcon } from '../config/toolIcons.js';

const PLACEHOLDER = {
  vi: 'Tìm kiếm công cụ (PDF, WebP, Hóa đơn, Dịch thuật...)',
  en: 'Search tools (PDF, WebP, Invoice, Translation...)',
  ja: 'ツールを検索（PDF、WebP、請求書、翻訳…）',
};

const TOOL_FIELDS = [
  (t) => [t.name_vn, t.name_en, t.name_ja],
  (t) => t.tags,
  (t) => [t.desc_vn, t.desc_en, t.desc_ja],
];

function toolName(t, lang) {
  if (lang === 'en') return t.name_en;
  if (lang === 'ja') return t.name_ja;
  return t.name_vn;
}

function ToolIcon({ tool }) {
  return (
    <div className={`w-8 h-8 shrink-0 rounded-lg bg-gradient-to-tr ${tool.gradient} flex items-center justify-center text-white text-xs`}>
      {renderToolIcon(tool.icon, { size: 14 })}
    </div>
  );
}

/**
 * Bảng lệnh ⌘K khi đang trong một miniapp. Ô tìm là @chotto/search, bảng gợi ý nằm
 * liền trong modal (placement="inline") và hiện ngay cả khi chưa gõ (showOnEmpty),
 * nên mở ra là thấy danh sách, ↑/↓/Enter chạy như mọi ô Chotto khác.
 * Esc đóng cả modal, đúng như dòng chữ ở chân modal hứa.
 */
export default function CommandPalette({ isOpen, ...props }) {
  if (!isOpen) return null;
  // Gắn lại mỗi lần mở: ô trống, focus sẵn.
  return <CommandPaletteBody {...props} />;
}

function CommandPaletteBody({ onClose, onSelectTool, displayLang, tools }) {
  const openTool = useCallback(
    (toolId) => {
      onSelectTool(toolId);
      onClose();
    },
    [onSelectTool, onClose]
  );

  // Công cụ đang phát triển không mở được, nên không đưa vào gợi ý chọn bằng phím.
  const ready = useMemo(() => tools.filter((t) => t.readiness !== 'in-development'), [tools]);
  // Chưa gõ thì trả cả danh sách theo thứ tự gốc; gõ rồi thì xếp theo độ khớp.
  const find = useCallback(
    (q) =>
      rankItems(ready, q, { fields: TOOL_FIELDS }).map((tool) => ({
        key: tool.id,
        title: toolName(tool, displayLang),
        subtitle: tool.desc_vn,
        data: tool,
      })),
    [ready, displayLang]
  );

  const s = useToolioSearch({
    mode: 'filter',
    search: find,
    showOnEmpty: true,
    seeAll: false,
    onChoose: (item) => openTool(item.key),
    // Enter khi chưa chọn dòng nào: mở kết quả đầu tiên, như bảng lệnh quen thuộc.
    onSubmit: (q) => {
      const first = find(q)[0];
      if (first) openTool(first.key);
    },
  });

  // Gói chỉ đóng bảng gợi ý khi Esc; modal thì phải tự đóng. Nghe ở window (sau React),
  // nên Esc lúc bảng gợi ý đang mở cũng đóng luôn modal.
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape' && !e.isComposing) onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-start justify-center pt-20 px-4 animate-in fade-in" onClick={onClose}>
      <div
        className="w-full max-w-xl bg-surface-container border border-border-subtle rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search input header */}
        <div className="p-4 border-b border-border-subtle flex items-start gap-3">
          <div className="flex-1 min-w-0">
            <ToolioSearchBox
              state={s}
              lang={displayLang}
              size="md"
              placement="inline"
              hideSeeAll
              autoFocus
              placeholder={pickLang(PLACEHOLDER, displayLang)}
              ariaLabel={pickLang(PLACEHOLDER, displayLang)}
              className="[&_.cs-suggest]:max-h-80 [&_.cs-suggest]:overflow-y-auto"
              renderItem={(item) => (
                <span className="flex items-center gap-3 min-w-0">
                  <ToolIcon tool={item.data} />
                  <span className="min-w-0">
                    <span className="block text-xs font-bold text-on-surface truncate">{item.title}</span>
                    <span className="block text-[11px] text-on-surface-variant truncate">{item.subtitle}</span>
                  </span>
                </span>
              )}
            />
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng"
            className="mt-2.5 p-1 rounded-lg hover:bg-surface-subtle text-outline hover:text-on-surface"
          >
            <X size={16} />
          </button>
        </div>

        {/* Footer info */}
        <div className="px-4 py-2 bg-surface-subtle/50 border-t border-border-subtle flex items-center justify-between text-[11px] text-outline font-mono">
          <span>Nhấn ESC để đóng</span>
          <span>{tools.filter((tool) => tool.readiness !== 'in-development').length}/{tools.length} công cụ khả dụng</span>
        </div>
      </div>
    </div>
  );
}

import React, { useState, useEffect, useRef } from 'react';
import { Search, X, ArrowRight, Sparkles } from 'lucide-react';

export default function CommandPalette({ isOpen, onClose, onSelectTool, displayLang, tools }) {
  const [query, setQuery] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current.focus(), 50);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const filteredTools = tools.filter((t) => {
    const q = query.toLowerCase();
    return (
      t.name_vn.toLowerCase().includes(q) ||
      t.name_en.toLowerCase().includes(q) ||
      t.desc_vn.toLowerCase().includes(q) ||
      t.tags.some((tag) => tag.toLowerCase().includes(q))
    );
  });

  const getToolName = (t) => {
    if (displayLang === 'en') return t.name_en;
    if (displayLang === 'ja') return t.name_ja;
    return t.name_vn;
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-start justify-center pt-20 px-4 animate-in fade-in" onClick={onClose}>
      <div
        className="w-full max-w-xl bg-surface-container border border-border-subtle rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search input header */}
        <div className="p-4 border-b border-border-subtle flex items-center gap-3">
          <Search size={18} className="text-outline" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Tìm kiếm công cụ (PDF, WebP, Hóa đơn, Dịch thuật...)"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 bg-transparent border-none text-on-surface text-sm focus:outline-none placeholder:text-outline"
          />
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-surface-subtle text-outline hover:text-on-surface">
            <X size={16} />
          </button>
        </div>

        {/* Results list */}
        <div className="max-h-80 overflow-y-auto p-2 space-y-1 custom-scrollbar">
          {filteredTools.length > 0 ? (
            filteredTools.map((tool) => (
              <button
                key={tool.id}
                disabled={tool.readiness === 'in-development'}
                onClick={() => {
                  onSelectTool(tool.id);
                  onClose();
                }}
                className={`w-full p-3 rounded-xl text-left flex items-center justify-between group transition-colors ${
                  tool.readiness === 'in-development'
                    ? 'cursor-not-allowed opacity-50'
                    : 'hover:bg-surface-subtle'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg bg-gradient-to-tr ${tool.gradient} flex items-center justify-center text-white text-xs`}>
                    <Sparkles size={14} />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-on-surface group-hover:text-primary transition-colors">
                      {getToolName(tool)}
                    </div>
                    <div className="text-[11px] text-on-surface-variant line-clamp-1">{tool.desc_vn}</div>
                    <div className="mt-1 text-[10px] font-semibold uppercase tracking-wide text-outline">
                      {tool.readiness === 'in-development' ? 'Đang phát triển' : tool.readiness}
                    </div>
                  </div>
                </div>
                <ArrowRight size={14} className="text-outline group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
              </button>
            ))
          ) : (
            <div className="p-6 text-center text-xs text-outline">
              Không tìm thấy công cụ nào phù hợp với "{query}"
            </div>
          )}
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

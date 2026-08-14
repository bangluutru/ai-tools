import React, { useState } from 'react';
import { ArrowLeft, ChevronDown, ShieldCheck } from 'lucide-react';
import { tools } from '../config/toolsRegistry';

export default function ToolContainer({ currentTool, onBackToHub, onSelectTool, displayLang, children }) {
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const getToolName = (t) => {
    if (!t) return '';
    if (displayLang === 'en') return t.name_en;
    if (displayLang === 'ja') return t.name_ja;
    return t.name_vn;
  };

  const processingLabel = {
    browser: 'Xử lý trên trình duyệt',
    hybrid: 'Có thể tải lên backend',
    'backend-antigravity': 'Backend + Antigravity',
    manual: 'Quy trình thủ công'
  }[currentTool.processing] || 'Chưa xác định';

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100">
      {/* Top Tool Navigation Bar */}
      <header className="no-print bg-slate-900/90 backdrop-blur-md border-b border-slate-800 px-4 md:px-8 py-3 flex items-center justify-between sticky top-0 z-50 shadow-md">
        <div className="flex items-center gap-4">
          <button
            onClick={onBackToHub}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 text-xs font-semibold transition-all group"
          >
            <ArrowLeft size={14} className="group-hover:-translate-x-0.5 transition-transform" />
            <span>Về Trung Tâm</span>
          </button>

          <div className="h-4 w-px bg-slate-800 hidden sm:block" />

          {/* Quick Tool Switcher Dropdown */}
          <div className="relative">
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/60 hover:bg-slate-800 text-slate-200 border border-slate-700/60 text-xs font-bold transition-all"
            >
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: currentTool.color }} />
              <span className="truncate max-w-[200px]">{getToolName(currentTool)}</span>
              <ChevronDown size={13} className="text-slate-400" />
            </button>

            {dropdownOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setDropdownOpen(false)} />
                <div className="absolute left-0 mt-2 w-72 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl z-50 p-1.5 overflow-hidden">
                  <div className="px-3 py-2 text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800">
                    Chuyển nhanh công cụ
                  </div>
                  <div className="max-h-80 overflow-y-auto py-1 space-y-0.5">
                    {tools.filter((t) => t.readiness !== 'disabled').map((t) => (
                      <button
                        key={t.id}
                        onClick={() => {
                          onSelectTool(t.id);
                          setDropdownOpen(false);
                        }}
                        className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs rounded-lg text-left transition-all ${
                          t.id === currentTool.id
                            ? 'bg-emerald-600/20 text-emerald-300 font-bold'
                            : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                        }`}
                      >
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: t.color }} />
                        <span className="truncate flex-1">{getToolName(t)}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-[11px] font-medium text-cyan-300">
            <ShieldCheck size={13} />
            <span>{processingLabel}</span>
          </div>
        </div>
      </header>

      {/* Main Tool Content */}
      <main className="flex-1 w-full">
        {currentTool.outputPurpose === 'reference' && (
          <div className="no-print border-b border-amber-500/20 bg-amber-500/10 px-4 py-2 text-center text-xs font-medium text-amber-200">
            Đầu ra chỉ mang tính tham khảo và cần người có thẩm quyền kiểm tra trước khi sử dụng.
          </div>
        )}
        {children}
      </main>
    </div>
  );
}

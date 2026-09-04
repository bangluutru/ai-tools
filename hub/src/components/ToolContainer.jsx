import React, { useState } from 'react';
import { ArrowLeft, ChevronDown, ChevronRight, ShieldCheck, Cpu, HardDrive, CheckCircle2 } from 'lucide-react';
import { categories } from '../config/toolsRegistry';

export default function ToolContainer({ currentTool, onBackToHub, onSelectTool, displayLang, tools, children }) {
  const [dropdownOpen, setDropdownOpen] = useState(false);

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

  const isClientSide = currentTool.processing === 'browser';
  const isHybrid = currentTool.processing === 'hybrid';

  const processingBadge = isClientSide ? {
    label: 'Client-side Safe',
    detail: 'WebAssembly / Trình duyệt',
    icon: ShieldCheck,
    color: 'text-secondary border-secondary/20 bg-secondary/10'
  } : isHybrid ? {
    label: 'Hybrid Processing',
    detail: 'Xử lý hỗn hợp',
    icon: HardDrive,
    color: 'text-brand-cyan-bright border-primary-container/20 bg-primary-container/10'
  } : {
    label: 'Antigravity AI',
    detail: 'Cloud Computation',
    icon: Cpu,
    color: 'text-primary border-primary/20 bg-primary/10'
  };

  const BadgeIcon = processingBadge.icon;

  return (
    <div className="min-h-screen flex flex-col bg-surface-canvas text-on-surface">
      {/* Top Tool Navigation Bar */}
      <header className="no-print bg-surface-canvas/90 backdrop-blur-xl border-b border-border-subtle px-4 md:px-8 py-2.5 flex items-center justify-between sticky top-0 z-50 shadow-sm">
        <div className="flex items-center gap-3 sm:gap-4 overflow-hidden">
          {/* Back to Hub button */}
          <button
            onClick={onBackToHub}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-subtle hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface border border-border-subtle font-label-sm text-label-sm transition-all group shrink-0"
            title="Quay lại danh mục công cụ"
          >
            <ArrowLeft size={14} className="group-hover:-translate-x-0.5 transition-transform text-outline group-hover:text-primary" />
            <span className="hidden sm:inline">Về Trung Tâm</span>
            <span className="sm:hidden">Hub</span>
          </button>

          <div className="h-4 w-px bg-border-subtle shrink-0 hidden md:block" />

          {/* Breadcrumb Trail */}
          <nav className="hidden lg:flex items-center gap-1.5 font-label-sm text-label-sm text-outline shrink-0">
            <button onClick={onBackToHub} className="hover:text-primary transition-colors">
              AI-Tools Hub
            </button>
            <ChevronRight size={13} className="text-border-subtle" />
            <span className="text-on-surface-variant">{getCategoryName()}</span>
            <ChevronRight size={13} className="text-border-subtle" />
            <span className="text-on-surface font-semibold">{getToolName(currentTool)}</span>
          </nav>

          <div className="h-4 w-px bg-border-subtle shrink-0 hidden lg:block" />

          {/* Quick Tool Switcher Dropdown */}
          <div className="relative">
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface border border-border-subtle font-label-sm text-label-sm transition-all"
            >
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: currentTool.color }} />
              <span className="truncate max-w-[140px] sm:max-w-[200px] font-semibold">{getToolName(currentTool)}</span>
              <ChevronDown size={13} className="text-outline" />
            </button>

            {dropdownOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setDropdownOpen(false)} />
                <div className="absolute left-0 mt-2 w-72 bg-surface-container border border-border-subtle rounded-xl shadow-2xl z-50 p-1.5 overflow-hidden">
                  <div className="px-3 py-2 font-label-sm text-[11px] font-bold text-outline uppercase tracking-wider border-b border-border-subtle flex items-center justify-between">
                    <span>Chuyển nhanh công cụ</span>
                    <span className="text-secondary text-[10px] font-mono">{tools.length} khả dụng</span>
                  </div>
                  <div className="max-h-80 overflow-y-auto py-1 space-y-0.5">
                    {tools.filter((t) => t.readiness !== 'in-development').map((t) => (
                      <button
                        key={t.id}
                        onClick={() => {
                          onSelectTool(t.id);
                          setDropdownOpen(false);
                        }}
                        className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs rounded-lg text-left transition-all ${
                          t.id === currentTool.id
                            ? 'bg-primary-container/20 text-primary font-bold'
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

        {/* Right Header Status / Privacy Pill */}
        <div className="flex items-center gap-2.5 shrink-0">
          <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border font-label-sm text-label-sm ${processingBadge.color}`}>
            <BadgeIcon size={14} className="shrink-0" />
            <span className="font-semibold">{processingBadge.label}</span>
            <span className="hidden sm:inline text-[10px] text-outline font-normal">({processingBadge.detail})</span>
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

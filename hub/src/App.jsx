import React, { useState, useEffect, useCallback, useMemo, Suspense, lazy } from 'react';
import Navbar from './components/Navbar';
import ToolCard from './components/ToolCard';
import ToolContainer from './components/ToolContainer';
import ToolErrorBoundary from './components/ToolErrorBoundary';
import CommandPalette from './components/CommandPalette';
import DataPolicyModal from './components/DataPolicyModal';
import SettingsModal from './components/SettingsModal';
import { tools, isInDevelopment } from './config/toolsRegistry';
import { buildVersion } from './config/buildInfo';
import { resolveToolId, toolUrl } from './utils/toolRoute';
import {
  Loader2,
  SearchX
} from 'lucide-react';
import {
  defaultHiddenToolIds,
  loadHiddenToolIds,
  saveHiddenToolIds,
} from './utils/toolVisibility';
import {
  ALL_CATEGORY,
  IN_DEVELOPMENT_CATEGORY,
  partitionTools,
  toolsForCategory,
  visibleCategoryIds,
} from './utils/toolFilter';

// =========================================================================
// ISOLATED LAZY LOADED TOOLS (Code-Splitting)
// =========================================================================
const ImageConvertTool = lazy(() => import('./tools/image-convert/ImageConvertTool'));
const ScreenCaptureTool = lazy(() => import('./tools/screen-capture/ScreenCaptureTool'));
const BarcodeQrTool = lazy(() => import('./tools/barcode-qr/BarcodeQrTool'));
const PdfToolkitTool = lazy(() => import('./tools/pdf-toolkit/PdfToolkitTool'));
const OmniConvertTool = lazy(() => import('./tools/omniconvert/OmniConvertTool'));
const ExcelMappingTool = lazy(() => import('./tools/excel-mapping/ExcelMappingTool'));
const EditorStudioTool = lazy(() => import('./tools/editor-studio/EditorStudioTool'));
const InvoiceTool = lazy(() => import('./tools/invoice-studio/InvoiceTool'));
const AutoBiTool = lazy(() => import('./tools/auto-bi/AutoBiTool'));
const AccountingReconcileTool = lazy(() => import('./tools/accounting-reconcile/AccountingReconcileTool'));
const WatermarkStudioTool = lazy(() => import('./tools/watermark-studio/WatermarkStudioTool'));
const IdPhotoStudioTool = lazy(() => import('./tools/id-photo-studio/IdPhotoStudioTool'));

const toolComponentMap = {
  'image-convert': ImageConvertTool,
  'screen-capture': ScreenCaptureTool,
  'barcode-qr': BarcodeQrTool,
  'pdf-toolkit': PdfToolkitTool,
  'omniconvert': OmniConvertTool,
  'excel-mapping': ExcelMappingTool,
  'editor-studio': EditorStudioTool,
  'invoice-studio': InvoiceTool,
  'auto-bi': AutoBiTool,
  'accounting-reconcile': AccountingReconcileTool,
  'watermark-studio': WatermarkStudioTool,
  'id-photo-studio': IdPhotoStudioTool
};

export default function App() {
  const [displayLang, setDisplayLang] = useState(() => localStorage.getItem('hub_lang') || 'vi');
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeToolId, setActiveToolId] = useState(() =>
    resolveToolId(window.location.hash, tools)
  );
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isPolicyOpen, setIsPolicyOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [hiddenToolIds, setHiddenToolIds] = useState(() =>
    loadHiddenToolIds(window.localStorage, tools)
  );

  // Sync language
  useEffect(() => {
    localStorage.setItem('hub_lang', displayLang);
  }, [displayLang]);

  useEffect(() => {
    saveHiddenToolIds(window.localStorage, hiddenToolIds);
  }, [hiddenToolIds]);

  // Hash routes work on static hosting and preserve the selected miniapp on refresh/share.
  useEffect(() => {
    const syncToolFromUrl = () => {
      setActiveToolId(resolveToolId(window.location.hash, tools));
    };
    window.addEventListener('hashchange', syncToolFromUrl);
    window.addEventListener('popstate', syncToolFromUrl);
    return () => {
      window.removeEventListener('hashchange', syncToolFromUrl);
      window.removeEventListener('popstate', syncToolFromUrl);
    };
  }, []);

  // Cmd + K Shortcut: on Home, focus header search; in tool view, open CommandPalette
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (activeToolId) {
          setIsSearchOpen((prev) => !prev);
        } else {
          const input = document.querySelector('header input[type="text"]');
          input?.focus();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeToolId]);

  const selectTool = useCallback((toolId) => {
    const tool = tools.find((candidate) => candidate.id === toolId);
    if (!tool || isInDevelopment(tool) || !toolComponentMap[toolId]) return;
    window.history.pushState({ toolId }, '', toolUrl(window.location, toolId));
    setActiveToolId(toolId);
  }, []);

  const backToHub = useCallback(() => {
    window.history.pushState({ toolId: null }, '', toolUrl(window.location, null));
    setActiveToolId(null);
  }, []);

  const currentTool = tools.find((t) => t.id === activeToolId);
  const ActiveComponent = activeToolId ? toolComponentMap[activeToolId] : null;

  const { active: activeTools } = partitionTools(tools, hiddenToolIds);
  const filteredTools = toolsForCategory(tools, activeCategory, hiddenToolIds);
  const categoryIds = visibleCategoryIds(tools, hiddenToolIds);

  // Live search filtering
  const displayedTools = useMemo(() => {
    let list = filteredTools;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter((t) => {
        const nameVn = (t.name_vn || '').toLowerCase();
        const nameEn = (t.name_en || '').toLowerCase();
        const nameJa = (t.name_ja || '').toLowerCase();
        const descVn = (t.desc_vn || '').toLowerCase();
        const descEn = (t.desc_en || '').toLowerCase();
        const id = (t.id || '').toLowerCase();
        const category = (t.category || '').toLowerCase();
        return (
          nameVn.includes(q) ||
          nameEn.includes(q) ||
          nameJa.includes(q) ||
          descVn.includes(q) ||
          descEn.includes(q) ||
          id.includes(q) ||
          category.includes(q)
        );
      });
    }
    return list;
  }, [filteredTools, searchQuery]);

  const toggleToolVisibility = useCallback((toolId) => {
    const nextHiddenToolIds = hiddenToolIds.includes(toolId)
      ? hiddenToolIds.filter((id) => id !== toolId)
      : [...hiddenToolIds, toolId];
    setHiddenToolIds(nextHiddenToolIds);

    if (activeCategory === ALL_CATEGORY || activeCategory === IN_DEVELOPMENT_CATEGORY) return;
    const categoryStillVisible = toolsForCategory(tools, activeCategory, nextHiddenToolIds).length > 0;
    if (!categoryStillVisible) setActiveCategory(ALL_CATEGORY);
  }, [activeCategory, hiddenToolIds]);

  return (
    <div className="min-h-screen bg-surface-canvas text-on-surface font-sans selection:bg-primary-container selection:text-white flex flex-col">
      {/* CASE 1: TOOL VIEW (WHEN A TOOL IS ACTIVE) */}
      {activeToolId && currentTool && ActiveComponent ? (
        <ToolContainer
          currentTool={currentTool}
          onBackToHub={backToHub}
          onSelectTool={selectTool}
          displayLang={displayLang}
          tools={activeTools}
        >
          <ToolErrorBoundary
            toolName={currentTool.name_vn}
            onBackToHub={backToHub}
          >
            <Suspense
              fallback={
                <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3">
                  <Loader2 size={36} className="animate-spin text-primary" />
                  <p className="font-label-sm text-xs text-outline">Đang khởi tạo công cụ...</p>
                </div>
              }
            >
              <ActiveComponent displayLang={displayLang} />
            </Suspense>
          </ToolErrorBoundary>
        </ToolContainer>
      ) : (
        /* CASE 2: MAIN HUB DASHBOARD (Discovery Hub Flow) */
        <>
          <Navbar
            displayLang={displayLang}
            onLangChange={setDisplayLang}
            onOpenSettings={() => setIsSettingsOpen(true)}
            activeCategory={activeCategory}
            onSelectCategory={setActiveCategory}
            categoryIds={categoryIds}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
          />

          <main className="flex-1 max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full space-y-4">
            {/* Minimal 1-line tool count & privacy note */}
            <div className="flex items-center justify-between text-xs text-on-surface-variant pt-1 pb-1">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-on-surface">
                  {activeCategory === ALL_CATEGORY
                    ? 'Tất cả công cụ'
                    : `Danh mục: ${activeCategory.toUpperCase()}`}
                </span>
                <span className="text-outline font-mono">({displayedTools.length})</span>
              </div>
              <span className="hidden sm:inline-block text-outline font-normal">
                Xử lý trực tiếp trên trình duyệt — tệp không được tải lên máy chủ.
              </span>
            </div>

            {/* Main Tools Catalog Grid immediately above the fold */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {displayedTools.map((tool) => (
                <ToolCard
                  key={tool.id}
                  tool={tool}
                  onSelectTool={selectTool}
                  displayLang={displayLang}
                />
              ))}
            </div>

            {/* Empty state */}
            {displayedTools.length === 0 && (
              <div className="rounded-xl border border-dashed border-border-subtle bg-surface-container/50 px-6 py-12 text-center flex flex-col items-center justify-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-surface-subtle flex items-center justify-center text-outline">
                  <SearchX size={24} />
                </div>
                <p className="font-title-sm text-sm font-semibold text-on-surface">
                  Không tìm thấy công cụ phù hợp với từ khóa &ldquo;{searchQuery}&rdquo;
                </p>
                <p className="font-body-sm text-xs text-on-surface-variant max-w-sm">
                  Vui lòng thử từ khóa khác như &ldquo;PDF&rdquo;, &ldquo;WebP&rdquo;, &ldquo;Hóa đơn&rdquo;, hoặc xóa bộ lọc tìm kiếm.
                </p>
                <div className="flex items-center gap-3 pt-2">
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="px-3.5 py-1.5 rounded-lg bg-surface-container-high hover:bg-surface-variant text-primary font-label-sm text-xs font-semibold border border-border-subtle transition-colors"
                    >
                      Xóa tìm kiếm
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setIsSettingsOpen(true)}
                    className="px-3.5 py-1.5 rounded-lg bg-surface-subtle hover:bg-surface-container-high text-on-surface-variant font-label-sm text-xs border border-border-subtle transition-colors"
                  >
                    Cài đặt miniapp ẩn/hiện
                  </button>
                </div>
              </div>
            )}
          </main>

          {/* Footer */}
          <footer className="no-print mt-auto border-t border-border-subtle bg-surface-canvas py-8 px-4 text-center text-xs text-outline">
            <div className="max-w-[1240px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-2 flex-wrap justify-center font-label-sm text-xs">
                <span className="font-bold text-on-surface">AI-Tools Master Hub</span>
                <span>•</span>
                <span className="text-secondary font-semibold">Beta có kiểm soát</span>
                <span>•</span>
                <span className="font-mono">Build {buildVersion}</span>
              </div>
              <div className="flex items-center gap-4">
                <button
                  type="button"
                  onClick={() => setIsPolicyOpen(true)}
                  className="font-body-sm text-xs text-on-surface-variant hover:text-primary transition-colors underline decoration-border-subtle underline-offset-4"
                >
                  Chính sách xử lý dữ liệu
                </button>
                <button
                  type="button"
                  onClick={() => setIsSettingsOpen(true)}
                  className="font-body-sm text-xs text-on-surface-variant hover:text-primary transition-colors"
                >
                  Cài đặt miniapp
                </button>
              </div>
            </div>
          </footer>
        </>
      )}

      {/* Spotlight Search Modal */}
      <CommandPalette
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onSelectTool={selectTool}
        displayLang={displayLang}
        tools={activeTools}
      />
      <DataPolicyModal isOpen={isPolicyOpen} onClose={() => setIsPolicyOpen(false)} />
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        tools={tools}
        hiddenToolIds={hiddenToolIds}
        onToggleTool={toggleToolVisibility}
        onShowAll={() => setHiddenToolIds([])}
        onReset={() => setHiddenToolIds(defaultHiddenToolIds(tools))}
        displayLang={displayLang}
      />
    </div>
  );
}

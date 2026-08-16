import React, { useState, useEffect, useCallback, Suspense, lazy } from 'react';
import Navbar from './components/Navbar';
import HeroBanner from './components/HeroBanner';
import CategoryTabs from './components/CategoryTabs';
import ToolCard from './components/ToolCard';
import ToolContainer from './components/ToolContainer';
import ToolErrorBoundary from './components/ToolErrorBoundary';
import CommandPalette from './components/CommandPalette';
import DataPolicyModal from './components/DataPolicyModal';
import SettingsModal from './components/SettingsModal';
import { tools, isInDevelopment } from './config/toolsRegistry';
import { buildVersion } from './config/buildInfo';
import { resolveToolId, toolUrl } from './utils/toolRoute';
import { Loader2 } from 'lucide-react';
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
//
// Chỉ miniapp đang hoạt động mới có mặt ở đây. Miniapp tạm dừng nằm trong
// hub/src/tools-in-development/ và cố tình không được import để không lọt vào
// bundle production. Khi mở lại một công cụ, bỏ readiness 'in-development'
// trong toolsRegistry.js, chuyển wrapper về hub/src/tools/ rồi thêm vào
// toolComponentMap; hub/tests/tools-registry.test.js sẽ nhắc nếu thiếu bước nào.
// =========================================================================
const ImageConvertTool = lazy(() => import('./tools/image-convert/ImageConvertTool'));
const ScreenCaptureTool = lazy(() => import('./tools/screen-capture/ScreenCaptureTool'));
const BarcodeQrTool = lazy(() => import('./tools/barcode-qr/BarcodeQrTool'));
const PdfSplitTool = lazy(() => import('./tools/pdf-split/PdfSplitTool'));
const PdfMergeTool = lazy(() => import('./tools/pdf-merge/PdfMergeTool'));
const PdfCompressTool = lazy(() => import('./tools/pdf-compress/PdfCompressTool'));
const ExcelMappingTool = lazy(() => import('./tools/excel-mapping/ExcelMappingTool'));
const EditorStudioTool = lazy(() => import('./tools/editor-studio/EditorStudioTool'));
const InvoiceTool = lazy(() => import('./tools/invoice-webapp/InvoiceTool'));
const AutoBiTool = lazy(() => import('./tools/auto-bi/AutoBiTool'));
const AccountingReconcileTool = lazy(() => import('./tools/accounting-reconcile/AccountingReconcileTool'));

const toolComponentMap = {
  'image-convert': ImageConvertTool,
  'screen-capture': ScreenCaptureTool,
  'barcode-qr': BarcodeQrTool,
  'pdf-split': PdfSplitTool,
  'pdf-merge': PdfMergeTool,
  'pdf-compress': PdfCompressTool,
  'excel-mapping': ExcelMappingTool,
  'editor-studio': EditorStudioTool,
  'invoice-webapp': InvoiceTool,
  'auto-bi': AutoBiTool,
  'accounting-reconcile': AccountingReconcileTool
};

export default function App() {
  const [theme, setTheme] = useState(() => localStorage.getItem('hub_theme') || 'dark');
  const [displayLang, setDisplayLang] = useState(() => localStorage.getItem('hub_lang') || 'vi');
  const [activeCategory, setActiveCategory] = useState('all');
  const [activeToolId, setActiveToolId] = useState(() =>
    resolveToolId(window.location.hash, tools)
  );
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isPolicyOpen, setIsPolicyOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [hiddenToolIds, setHiddenToolIds] = useState(() =>
    loadHiddenToolIds(window.localStorage, tools)
  );

  // Sync theme attribute
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('hub_theme', theme);
  }, [theme]);

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

  // Cmd + K Shortcut
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

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

  // Miniapp đang phát triển chỉ nằm trong nhóm của riêng chúng; nơi khác trong
  // portal chỉ thấy công cụ mở được.
  const { active: activeTools } = partitionTools(tools, hiddenToolIds);
  const filteredTools = toolsForCategory(tools, activeCategory, hiddenToolIds);
  const categoryIds = visibleCategoryIds(tools, hiddenToolIds);

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
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-emerald-500 selection:text-white flex flex-col">
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
                  <Loader2 size={36} className="animate-spin text-emerald-400" />
                  <p className="text-xs font-semibold text-slate-400">Đang khởi tạo công cụ...</p>
                </div>
              }
            >
              <ActiveComponent displayLang={displayLang} />
            </Suspense>
          </ToolErrorBoundary>
        </ToolContainer>
      ) : (
        /* CASE 2: MAIN HUB DASHBOARD (iLovePDF Style) */
        <>
          <Navbar
            theme={theme}
            onToggleTheme={toggleTheme}
            displayLang={displayLang}
            onLangChange={setDisplayLang}
            onOpenSearch={() => setIsSearchOpen(true)}
            onOpenSettings={() => setIsSettingsOpen(true)}
          />

          <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full space-y-8">
            <HeroBanner displayLang={displayLang} />

            <CategoryTabs
              activeCategory={activeCategory}
              onSelectCategory={setActiveCategory}
              displayLang={displayLang}
              visibleCategoryIds={categoryIds}
            />

            {/* Tool Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pt-2">
              {filteredTools.map((tool) => (
                <ToolCard
                  key={tool.id}
                  tool={tool}
                  onSelectTool={selectTool}
                  displayLang={displayLang}
                />
              ))}
            </div>
            {filteredTools.length === 0 && (
              <div className="rounded-3xl border border-dashed border-slate-700 bg-slate-900/40 px-6 py-12 text-center">
                <p className="text-sm font-semibold text-slate-300">Không có miniapp nào đang hiển thị trong nhóm này.</p>
                <button type="button" onClick={() => setIsSettingsOpen(true)} className="mt-3 text-xs font-bold text-emerald-400 hover:text-emerald-300">
                  Mở Cài đặt miniapp
                </button>
              </div>
            )}
          </main>

          {/* Footer */}
          <footer className="no-print mt-auto border-t border-slate-800/80 bg-slate-950 py-8 px-4 text-center text-xs text-slate-500">
            <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-400">AI-Tools Master Hub</span>
                <span>• Beta có kiểm soát</span>
                <span>• Build {buildVersion}</span>
              </div>
              <button onClick={() => setIsPolicyOpen(true)} className="underline decoration-slate-700 underline-offset-4 hover:text-slate-300">
                Chính sách xử lý dữ liệu
              </button>
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

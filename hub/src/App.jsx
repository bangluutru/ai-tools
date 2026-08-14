import React, { useState, useEffect, Suspense, lazy } from 'react';
import Navbar from './components/Navbar';
import HeroBanner from './components/HeroBanner';
import CategoryTabs from './components/CategoryTabs';
import ToolCard from './components/ToolCard';
import ToolContainer from './components/ToolContainer';
import ToolErrorBoundary from './components/ToolErrorBoundary';
import CommandPalette from './components/CommandPalette';
import { tools } from './config/toolsRegistry';
import { Loader2 } from 'lucide-react';

// =========================================================================
// ISOLATED LAZY LOADED TOOLS (Code-Splitting)
// =========================================================================
const ImageConvertTool = lazy(() => import('./tools/image-convert/ImageConvertTool'));
const PdfSplitTool = lazy(() => import('./tools/pdf-split/PdfSplitTool'));
const PdfMergeTool = lazy(() => import('./tools/pdf-merge/PdfMergeTool'));
const PdfOverlayTool = lazy(() => import('./tools/pdf-overlay/PdfOverlayTool'));
const ExcelMappingTool = lazy(() => import('./tools/excel-mapping/ExcelMappingTool'));
const LegalStudioTool = lazy(() => import('./tools/legal-studio/LegalStudioTool'));
const LongTranslatorTool = lazy(() => import('./tools/long-translator/LongTranslatorTool'));
const CertificateStudioTool = lazy(() => import('./tools/certificate-studio/CertificateStudioTool'));
const EditorStudioTool = lazy(() => import('./tools/editor-studio/EditorStudioTool'));
const InvoiceTool = lazy(() => import('./tools/invoice-webapp/InvoiceTool'));
const ContractAuditorTool = lazy(() => import('./tools/contract-auditor/ContractAuditorTool'));
const AutoBiTool = lazy(() => import('./tools/auto-bi/AutoBiTool'));
const PolicyAssistantTool = lazy(() => import('./tools/policy-assistant/PolicyAssistantTool'));
const AccountingReconcileTool = lazy(() => import('./tools/accounting-reconcile/AccountingReconcileTool'));

const toolComponentMap = {
  'image-convert': ImageConvertTool,
  'pdf-split': PdfSplitTool,
  'pdf-merge': PdfMergeTool,
  'pdf-overlay': PdfOverlayTool,
  'excel-mapping': ExcelMappingTool,
  'legal-studio': LegalStudioTool,
  'long-translator': LongTranslatorTool,
  'certificate-studio': CertificateStudioTool,
  'editor-studio': EditorStudioTool,
  'invoice-webapp': InvoiceTool,
  'contract-auditor': ContractAuditorTool,
  'auto-bi': AutoBiTool,
  'policy-assistant': PolicyAssistantTool,
  'accounting-reconcile': AccountingReconcileTool
};

export default function App() {
  const [theme, setTheme] = useState(() => localStorage.getItem('hub_theme') || 'dark');
  const [displayLang, setDisplayLang] = useState(() => localStorage.getItem('hub_lang') || 'vi');
  const [activeCategory, setActiveCategory] = useState('all');
  const [activeToolId, setActiveToolId] = useState(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // Sync theme attribute
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('hub_theme', theme);
  }, [theme]);

  // Sync language
  useEffect(() => {
    localStorage.setItem('hub_lang', displayLang);
  }, [displayLang]);

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

  const currentTool = tools.find((t) => t.id === activeToolId);
  const ActiveComponent = activeToolId ? toolComponentMap[activeToolId] : null;

  const filteredTools =
    activeCategory === 'all'
      ? tools
      : tools.filter((t) => t.category === activeCategory);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-emerald-500 selection:text-white flex flex-col">
      {/* CASE 1: TOOL VIEW (WHEN A TOOL IS ACTIVE) */}
      {activeToolId && currentTool && ActiveComponent ? (
        <ToolContainer
          currentTool={currentTool}
          onBackToHub={() => setActiveToolId(null)}
          onSelectTool={setActiveToolId}
          displayLang={displayLang}
        >
          <ToolErrorBoundary
            toolName={currentTool.name_vn}
            onBackToHub={() => setActiveToolId(null)}
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
          />

          <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full space-y-8">
            <HeroBanner displayLang={displayLang} />

            <CategoryTabs
              activeCategory={activeCategory}
              onSelectCategory={setActiveCategory}
              displayLang={displayLang}
            />

            {/* Tool Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pt-2">
              {filteredTools.map((tool) => (
                <ToolCard
                  key={tool.id}
                  tool={tool}
                  onSelectTool={setActiveToolId}
                  displayLang={displayLang}
                />
              ))}
            </div>
          </main>

          {/* Footer */}
          <footer className="no-print mt-auto border-t border-slate-800/80 bg-slate-950 py-8 px-4 text-center text-xs text-slate-500">
            <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-400">AI-Tools Master Hub</span>
                <span>• 100% Client-Side Safe</span>
              </div>
              <div>Bảo mật tuyệt đối — Không lưu trữ dữ liệu người dùng trên máy chủ</div>
            </div>
          </footer>
        </>
      )}

      {/* Spotlight Search Modal */}
      <CommandPalette
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onSelectTool={setActiveToolId}
        displayLang={displayLang}
      />
    </div>
  );
}

import React, { useState, useEffect, useCallback, useMemo, Suspense } from 'react';
import Navbar from './components/Navbar';
import ToolCard from './components/ToolCard';
import ToolContainer from './components/ToolContainer';
import ToolErrorBoundary from './components/ToolErrorBoundary';
import CommandPalette from './components/CommandPalette';
import DataPolicyModal from './components/DataPolicyModal';
import SettingsModal from './components/SettingsModal';
import { tools, isInDevelopment, TOOL_GROUPS } from './config/toolsRegistry';
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
  ALL_GROUPS,
  partitionTools,
  toolsForCategory,
  visibleCategoryIds,
  visibleGroupIds,
} from './utils/toolFilter';
import { useTheme } from '@ai-tools/core';

import { lazyWithRetry as lazy } from './utils/lazyWithRetry';

// =========================================================================
// ISOLATED LAZY LOADED TOOLS (Code-Splitting with Auto-Retry on New Deploys)
// =========================================================================
const ImageConvertTool = lazy(() => import('./tools/image-convert/ImageConvertTool'));
const ScreenCaptureTool = lazy(() => import('./tools/screen-capture/ScreenCaptureTool'));
const ScreenRecorderTool = lazy(() => import('./tools/screen-recorder/ScreenRecorderTool'));
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
const BusinessCardStudioTool = lazy(() => import('./tools/business-card-studio/BusinessCardStudioTool'));
const TaxCalculatorTool = lazy(() => import('./tools/tax-calculator/TaxCalculatorTool'));
const JapanTaxSimulatorTool = lazy(() => import('./tools/japan-tax-simulator/JapanTaxSimulatorTool'));
const SocialInsuranceSimulatorTool = lazy(() => import('./tools/social-insurance-jp/SocialInsuranceSimulatorTool.jsx'));
const SocialInsuranceEligibilityTool = lazy(() => import('./tools/social-insurance-eligibility-jp/SocialInsuranceEligibilityTool.jsx'));
const NationalPensionTool = lazy(() => import('./tools/national-pension-jp/NationalPensionTool.jsx'));
const DependentInsuranceTool = lazy(() => import('./tools/dependent-insurance-jp/DependentInsuranceTool.jsx'));
const OvertimeCalculatorTool = lazy(() => import('./tools/overtime-calculator-jp/OvertimeCalculatorTool.jsx'));
const PaidLeaveCheckerTool = lazy(() => import('./tools/paid-leave-checker-jp/PaidLeaveCheckerTool.jsx'));
const UnemploymentEligibilityTool = lazy(() => import('./tools/unemployment-eligibility-jp/UnemploymentEligibilityTool.jsx'));
const UnemploymentBenefitTool = lazy(() => import('./tools/unemployment-benefit-jp/UnemploymentBenefitTool.jsx'));
const LeavingJobWizardTool = lazy(() => import('./tools/leaving-job-wizard-jp/LeavingJobWizardTool.jsx'));
const MaternityAllowanceTool = lazy(() => import('./tools/maternity-allowance-jp/MaternityAllowanceTool.jsx'));
const ChildcareLeaveEligibilityTool = lazy(() => import('./tools/childcare-leave-eligibility-jp/ChildcareLeaveEligibilityTool.jsx'));
const ChildcareBenefitTool = lazy(() => import('./tools/childcare-benefit-jp/ChildcareBenefitTool.jsx'));
const ChildAllowanceTool = lazy(() => import('./tools/child-allowance-jp/ChildAllowanceTool.jsx'));
const BirthWizardTool = lazy(() => import('./tools/birth-wizard-jp/BirthWizardTool.jsx'));
const MovingCostTool = lazy(() => import('./tools/moving-cost-jp/MovingCostTool.jsx'));
const MovingAdminCheckerTool = lazy(() => import('./tools/moving-admin-checker-jp/MovingAdminCheckerTool.jsx'));
const AddressChangeChecklistTool = lazy(() => import('./tools/address-change-checklist-jp/AddressChangeChecklistTool.jsx'));
const MovingWizardTool = lazy(() => import('./tools/moving-wizard-jp/MovingWizardTool.jsx'));
const WorkScopeCheckerTool = lazy(() => import('./tools/work-scope-checker-jp/WorkScopeCheckerTool.jsx'));
const ResidenceRenewalGuideTool = lazy(() => import('./tools/residence-renewal-guide-jp/ResidenceRenewalGuideTool.jsx'));
const AffiliationChangeCheckerTool = lazy(() => import('./tools/affiliation-change-checker-jp/AffiliationChangeCheckerTool.jsx'));
const StatusChangeGuideTool = lazy(() => import('./tools/status-change-guide-jp/StatusChangeGuideTool.jsx'));
const FamilyImmigrationGuideTool = lazy(() => import('./tools/family-immigration-guide-jp/FamilyImmigrationGuideTool.jsx'));
const PermanentResidenceReadinessTool = lazy(() => import('./tools/pr-readiness-checker-jp/PermanentResidenceReadinessTool.jsx'));
const ArrivingInJapanWizardTool = lazy(() => import('./tools/arriving-in-japan-wizard-jp/ArrivingInJapanWizardTool.jsx'));
const LeavingJapanWizardTool = lazy(() => import('./tools/leaving-japan-wizard-jp/LeavingJapanWizardTool.jsx'));
const DocumentFinderTool = lazy(() => import('./tools/document-finder-jp/DocumentFinderTool.jsx'));
const CertificateAcquisitionGuideTool = lazy(() => import('./tools/certificate-acquisition-guide-jp/CertificateAcquisitionGuideTool.jsx'));
const MyNumberProcedureGuideTool = lazy(() => import('./tools/mynumber-procedure-guide-jp/MyNumberProcedureGuideTool.jsx'));
const OfficialFormHelperTool = lazy(() => import('./tools/official-form-helper-jp/OfficialFormHelperTool.jsx'));
const ProcedureRequirementCheckerTool = lazy(() => import('./tools/procedure-requirement-checker-jp/ProcedureRequirementCheckerTool.jsx'));
const AdministrativeNavigatorTool = lazy(() => import('./tools/administrative-navigator-jp/AdministrativeNavigatorTool.jsx'));
const JapanLifeNavigatorTool = lazy(() => import('./tools/japan-life-navigator/JapanLifeNavigatorTool.jsx'));
const InvoiceXmlFetcherTool = lazy(() => import('./tools/invoice-xml-fetcher/InvoiceXmlFetcherTool'));
const FlappyBirdTool = lazy(() => import('./tools/flappy-bird/FlappyBirdTool'));
const FlappyBirdPet = lazy(() => import('./components/FlappyBirdPet'));
const FlappyGameModal = lazy(() => import('./components/FlappyGameModal'));
const ToolioNinjaTool = lazy(() => import('./tools/toolio-ninja/ToolioNinjaTool'));
const ToolioNinjaPet = lazy(() => import('./components/ToolioNinjaPet'));
const ToolioNinjaModal = lazy(() => import('./components/ToolioNinjaModal'));

const toolComponentMap = {
  'image-convert': ImageConvertTool,
  'screen-capture': ScreenCaptureTool,
  'screen-recorder': ScreenRecorderTool,
  'barcode-qr': BarcodeQrTool,
  'pdf-toolkit': PdfToolkitTool,
  'omniconvert': OmniConvertTool,
  'excel-mapping': ExcelMappingTool,
  'editor-studio': EditorStudioTool,
  'invoice-studio': InvoiceTool,
  'auto-bi': AutoBiTool,
  'accounting-reconcile': AccountingReconcileTool,
  'watermark-studio': WatermarkStudioTool,
  'id-photo-studio': IdPhotoStudioTool,
  'business-card-studio': BusinessCardStudioTool,
  'tax-calculator': TaxCalculatorTool,
  'japan-tax-simulator': JapanTaxSimulatorTool,
  'social-insurance-jp': SocialInsuranceSimulatorTool,
  'social-insurance-eligibility-jp': SocialInsuranceEligibilityTool,
  'national-pension-jp': NationalPensionTool,
  'dependent-insurance-jp': DependentInsuranceTool,
  'overtime-calculator-jp': OvertimeCalculatorTool,
  'paid-leave-checker-jp': PaidLeaveCheckerTool,
  'unemployment-eligibility-jp': UnemploymentEligibilityTool,
  'unemployment-benefit-jp': UnemploymentBenefitTool,
  'leaving-job-wizard-jp': LeavingJobWizardTool,
  'maternity-allowance-jp': MaternityAllowanceTool,
  'childcare-leave-eligibility-jp': ChildcareLeaveEligibilityTool,
  'childcare-benefit-jp': ChildcareBenefitTool,
  'child-allowance-jp': ChildAllowanceTool,
  'birth-wizard-jp': BirthWizardTool,
  'moving-cost-jp': MovingCostTool,
  'moving-admin-checker-jp': MovingAdminCheckerTool,
  'address-change-checklist-jp': AddressChangeChecklistTool,
  'moving-wizard-jp': MovingWizardTool,
  'work-scope-checker-jp': WorkScopeCheckerTool,
  'residence-renewal-guide-jp': ResidenceRenewalGuideTool,
  'affiliation-change-checker-jp': AffiliationChangeCheckerTool,
  'status-change-guide-jp': StatusChangeGuideTool,
  'family-immigration-guide-jp': FamilyImmigrationGuideTool,
  'pr-readiness-checker-jp': PermanentResidenceReadinessTool,
  'arriving-in-japan-wizard-jp': ArrivingInJapanWizardTool,
  'leaving-japan-wizard-jp': LeavingJapanWizardTool,
  'document-finder-jp': DocumentFinderTool,
  'certificate-acquisition-guide-jp': CertificateAcquisitionGuideTool,
  'mynumber-procedure-guide-jp': MyNumberProcedureGuideTool,
  'official-form-helper-jp': OfficialFormHelperTool,
  'procedure-requirement-checker-jp': ProcedureRequirementCheckerTool,
  'administrative-navigator-jp': AdministrativeNavigatorTool,
  'japan-life-navigator': JapanLifeNavigatorTool,
  'invoice-xml-fetcher': InvoiceXmlFetcherTool,
  'flappy-bird': FlappyBirdTool,
  'toolio-ninja': ToolioNinjaTool
};

export default function App() {
  useTheme();
  const [displayLang, setDisplayLang] = useState(() => localStorage.getItem('hub_lang') || 'vi');
  const [activeCategory, setActiveCategory] = useState('all');
  const [activeGroup, setActiveGroup] = useState('all');
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
  const [showFlappyBird, setShowFlappyBird] = useState(() => {
    try {
      return localStorage.getItem('hub_show_flappy_bird') !== 'false';
    } catch {
      return true;
    }
  });
  const [showFlappyGame, setShowFlappyGame] = useState(false);
  const [showToolioNinja, setShowToolioNinja] = useState(() => {
    try {
      return localStorage.getItem('hub_show_toolio_ninja') !== 'false';
    } catch {
      return true;
    }
  });
  const [showNinjaGame, setShowNinjaGame] = useState(false);

  // Sync language
  useEffect(() => {
    localStorage.setItem('hub_lang', displayLang);
  }, [displayLang]);

  useEffect(() => {
    saveHiddenToolIds(window.localStorage, hiddenToolIds);
  }, [hiddenToolIds]);

  useEffect(() => {
    try {
      localStorage.setItem('hub_show_flappy_bird', String(showFlappyBird));
    } catch {}
  }, [showFlappyBird]);

  useEffect(() => {
    try {
      localStorage.setItem('hub_show_toolio_ninja', String(showToolioNinja));
    } catch {}
  }, [showToolioNinja]);

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
  const groupIds = useMemo(() => visibleGroupIds(tools, hiddenToolIds), [hiddenToolIds]);

  // Live search and domain group filtering
  const displayedTools = useMemo(() => {
    let list = filteredTools;
    if (activeGroup !== ALL_GROUPS && !searchQuery.trim()) {
      list = list.filter((t) => (t.group || 'common') === activeGroup);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      // Search finds matching tools across all active tools regardless of active group
      list = activeTools.filter((t) => {
        const nameVn = (t.name_vn || '').toLowerCase();
        const nameEn = (t.name_en || '').toLowerCase();
        const nameJa = (t.name_ja || '').toLowerCase();
        const descVn = (t.desc_vn || '').toLowerCase();
        const descEn = (t.desc_en || '').toLowerCase();
        const id = (t.id || '').toLowerCase();
        const category = (t.category || '').toLowerCase();
        const group = (t.group || '').toLowerCase();
        const tags = Array.isArray(t.tags) ? t.tags.join(' ').toLowerCase() : '';
        return (
          nameVn.includes(q) ||
          nameEn.includes(q) ||
          nameJa.includes(q) ||
          descVn.includes(q) ||
          descEn.includes(q) ||
          (t.desc_ja || '').toLowerCase().includes(q) ||
          id.includes(q) ||
          category.includes(q) ||
          group.includes(q) ||
          tags.includes(q)
        );
      });
    }
    return list;
  }, [filteredTools, activeTools, activeGroup, searchQuery]);

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
          onLangChange={setDisplayLang}
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
            showFlappyBird={showFlappyBird}
            onOpenFlappyGame={() => setShowFlappyGame(true)}
            showToolioNinja={showToolioNinja}
            onOpenNinjaGame={() => setShowNinjaGame(true)}
          />

          <main className="flex-1 max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full space-y-4">
            {/* Minimal 1-line tool count, group filter & privacy note */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-on-surface-variant pt-1 pb-1">
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="font-semibold text-on-surface">
                  {activeCategory === ALL_CATEGORY
                    ? (activeGroup === ALL_GROUPS
                        ? (displayLang === 'ja' ? 'すべてのツール' : displayLang === 'en' ? 'All Tools' : 'Tất cả công cụ')
                        : (TOOL_GROUPS[activeGroup]?.name[displayLang] || activeGroup))
                    : `Danh mục: ${activeCategory.toUpperCase()}`}
                </span>
                <span className="text-outline font-mono">({displayedTools.length})</span>

                {/* Subtle Domain Group Filter (only visible when activeCategory is ALL and no search query) */}
                {activeCategory === ALL_CATEGORY && !searchQuery.trim() && (
                  <div
                    className="inline-flex items-center p-0.5 rounded-lg bg-surface-subtle border border-border-subtle text-[11px] font-medium"
                    role="tablist"
                    aria-label="Bộ lọc nhóm công cụ"
                  >
                    <button
                      type="button"
                      role="tab"
                      aria-selected={activeGroup === ALL_GROUPS}
                      onClick={() => setActiveGroup(ALL_GROUPS)}
                      className={`px-2 py-0.5 rounded-md transition-colors cursor-pointer ${
                        activeGroup === ALL_GROUPS
                          ? 'bg-surface-container-high text-primary font-semibold shadow-xs'
                          : 'text-on-surface-variant hover:text-on-surface'
                      }`}
                    >
                      {displayLang === 'ja' ? 'すべて' : displayLang === 'en' ? 'All' : 'Tất cả'}
                    </button>
                    {Object.values(TOOL_GROUPS)
                      .filter((g) => groupIds.has(g.id))
                      .map((g) => {
                        const isSelected = activeGroup === g.id;
                        const label = g.name[displayLang] || g.id;
                        return (
                          <button
                            key={g.id}
                            type="button"
                            role="tab"
                            aria-selected={isSelected}
                            onClick={() => setActiveGroup(g.id)}
                            className={`px-2 py-0.5 rounded-md transition-colors cursor-pointer ${
                              isSelected
                                ? 'bg-surface-container-high text-primary font-semibold shadow-xs'
                                : 'text-on-surface-variant hover:text-on-surface'
                            }`}
                          >
                            {label}
                          </button>
                        );
                      })}
                  </div>
                )}
              </div>
              <span className="hidden sm:inline-block text-outline font-normal">
                {displayLang === 'ja'
                  ? '100% ブラウザ内処理・ファイルは外部サーバーに送信されません。'
                  : displayLang === 'en'
                  ? 'Client-side processing — your files never leave your device.'
                  : 'Xử lý trực tiếp trên trình duyệt — tệp không được tải lên máy chủ.'}
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
                <span className="font-bold text-on-surface">Toolio</span>
                <span className="text-on-surface-variant/80 font-normal hidden sm:inline">— Tiny Tools. Huge Impact.</span>
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
        showFlappyBird={showFlappyBird}
        onToggleFlappyBird={() => setShowFlappyBird((prev) => !prev)}
        showToolioNinja={showToolioNinja}
        onToggleToolioNinja={() => setShowToolioNinja((prev) => !prev)}
      />

      {/* Floating Flappy Bird Easter Egg (only on Hub dashboard when enabled) */}
      {showFlappyBird && !activeToolId && (
        <Suspense fallback={null}>
          <FlappyBirdPet onOpenGame={() => setShowFlappyGame(true)} />
        </Suspense>
      )}

      {/* Flappy Bird Game Modal */}
      {showFlappyGame && (
        <Suspense fallback={null}>
          <FlappyGameModal onClose={() => setShowFlappyGame(false)} />
        </Suspense>
      )}

      {/* Floating Toolio Ninja Pet (only on Hub dashboard when enabled) */}
      {showToolioNinja && !activeToolId && (
        <Suspense fallback={null}>
          <ToolioNinjaPet
            displayLang={displayLang}
            onOpenGame={() => setShowNinjaGame(true)}
          />
        </Suspense>
      )}

      {/* Toolio Ninja Game Modal */}
      {showNinjaGame && (
        <Suspense fallback={null}>
          <ToolioNinjaModal
            displayLang={displayLang}
            onClose={() => setShowNinjaGame(false)}
          />
        </Suspense>
      )}
    </div>
  );
}

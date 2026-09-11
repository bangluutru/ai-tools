import React, { useState, useEffect, useCallback, useMemo, Suspense } from 'react';
import Navbar from './components/Navbar';
import ToolCard from './components/ToolCard';
import ToolContainer from './components/ToolContainer';
import ToolErrorBoundary from './components/ToolErrorBoundary';
import CommandPalette from './components/CommandPalette';
import DataPolicyModal from './components/DataPolicyModal';
import SettingsModal from './components/SettingsModal';
import HubDomainCard from './components/HubDomainCard';
import DomainCatalogue from './components/DomainCatalogue';
import HeroScenicBanner from './components/HeroScenicBanner';
import { tools, isInDevelopment } from './config/toolsRegistry';
import { buildVersion } from './config/buildInfo';
import {
  resolveHubRoute,
  buildDomainHash,
  saveLastBrowseContext,
  getLastBrowseContext,
} from './utils/hubRoute';
import { HUB_DOMAINS, getDomainName } from './config/hubPresentation';
import {
  Loader2,
  SearchX,
  ShieldCheck,
  Zap,
  Lock,
} from 'lucide-react';
import {
  defaultHiddenToolIds,
  loadHiddenToolIds,
  saveHiddenToolIds,
} from './utils/toolVisibility';
import { partitionTools } from './utils/toolFilter';
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
  'toolio-ninja': ToolioNinjaTool,
};

export default function App() {
  useTheme();
  const [displayLang, setDisplayLang] = useState(() => localStorage.getItem('hub_lang') || 'vi');
  const [route, setRoute] = useState(() => resolveHubRoute(window.location.hash, tools));
  const [searchQuery, setSearchQuery] = useState('');
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

  // Synchronize route from window location hash
  useEffect(() => {
    const syncRouteFromUrl = () => {
      setRoute(resolveHubRoute(window.location.hash, tools));
    };
    window.addEventListener('hashchange', syncRouteFromUrl);
    window.addEventListener('popstate', syncRouteFromUrl);
    return () => {
      window.removeEventListener('hashchange', syncRouteFromUrl);
      window.removeEventListener('popstate', syncRouteFromUrl);
    };
  }, []);

  // Cmd + K Shortcut: on Hub, focus global search; in tool view, open CommandPalette
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (route.type === 'tool') {
          setIsSearchOpen((prev) => !prev);
        } else {
          const input = document.querySelector('header input[type="text"]');
          input?.focus();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [route.type]);

  // Partition tools by visibility
  const { active: activeTools } = useMemo(() => partitionTools(tools, hiddenToolIds), [hiddenToolIds]);

  // Split active tools by Top-Level Domain
  const commonTools = useMemo(
    () => activeTools.filter((t) => (t.group || 'common') === 'common'),
    [activeTools]
  );
  const japanLifeTools = useMemo(
    () => activeTools.filter((t) => t.group === 'japan-life'),
    [activeTools]
  );
  const vietnamLifeTools = useMemo(
    () => activeTools.filter((t) => t.group === 'vietnam-life'),
    [activeTools]
  );

  // Navigation handlers
  const handleSelectDomain = useCallback((domainId) => {
    setSearchQuery('');
    saveLastBrowseContext(domainId, 'all');
    window.location.hash = buildDomainHash(domainId, 'all');
  }, []);

  const handleSelectFilter = useCallback(
    (filterId) => {
      if (route.type === 'domain') {
        saveLastBrowseContext(route.domain, filterId);
        window.location.hash = buildDomainHash(route.domain, filterId);
      }
    },
    [route]
  );

  const handleBackToHome = useCallback(() => {
    setSearchQuery('');
    window.location.hash = '#/';
  }, []);

  const selectTool = useCallback(
    (toolId) => {
      const tool = tools.find((candidate) => candidate.id === toolId);
      if (!tool || isInDevelopment(tool) || !toolComponentMap[toolId]) return;

      if (route.type === 'domain') {
        saveLastBrowseContext(route.domain, route.filter);
      } else if (tool.group === 'japan-life') {
        saveLastBrowseContext('japan-life', 'all');
      } else {
        saveLastBrowseContext('common', 'all');
      }

      window.location.hash = `#/tools/${toolId}`;
    },
    [route]
  );

  const backToHub = useCallback(() => {
    const lastContext = getLastBrowseContext();
    if (lastContext && lastContext.domain) {
      window.location.hash = buildDomainHash(lastContext.domain, lastContext.filter);
    } else {
      window.location.hash = '#/';
    }
  }, []);

  // Global Cross-Domain Search
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase().trim();
    return activeTools.filter((t) => {
      const nameVn = (t.name_vn || '').toLowerCase();
      const nameEn = (t.name_en || '').toLowerCase();
      const nameJa = (t.name_ja || '').toLowerCase();
      const descVn = (t.desc_vn || '').toLowerCase();
      const descEn = (t.desc_en || '').toLowerCase();
      const descJa = (t.desc_ja || '').toLowerCase();
      const id = (t.id || '').toLowerCase();
      const category = (t.category || '').toLowerCase();
      const group = (t.group || '').toLowerCase();
      const domain = (t.domain || '').toLowerCase();
      const tags = Array.isArray(t.tags) ? t.tags.join(' ').toLowerCase() : '';
      return (
        nameVn.includes(q) ||
        nameEn.includes(q) ||
        nameJa.includes(q) ||
        descVn.includes(q) ||
        descEn.includes(q) ||
        descJa.includes(q) ||
        id.includes(q) ||
        category.includes(q) ||
        group.includes(q) ||
        domain.includes(q) ||
        tags.includes(q)
      );
    });
  }, [activeTools, searchQuery]);

  const toggleToolVisibility = useCallback((toolId) => {
    setHiddenToolIds((prev) =>
      prev.includes(toolId) ? prev.filter((id) => id !== toolId) : [...prev, toolId]
    );
  }, []);

  // Active Tool Resolution
  const activeToolId = route.type === 'tool' ? route.toolId : null;
  const currentTool = activeToolId ? tools.find((t) => t.id === activeToolId) : null;
  const ActiveComponent = activeToolId ? toolComponentMap[activeToolId] : null;

  return (
    <div className="min-h-screen bg-surface-canvas text-on-surface font-sans selection:bg-primary-container selection:text-white flex flex-col">
      {/* CASE 1: ACTIVE TOOL VIEW */}
      {activeToolId && currentTool && ActiveComponent ? (
        <ToolContainer
          currentTool={currentTool}
          onBackToHub={backToHub}
          onSelectTool={selectTool}
          displayLang={displayLang}
          onLangChange={setDisplayLang}
          tools={activeTools}
        >
          <ToolErrorBoundary toolName={currentTool.name_vn} onBackToHub={backToHub}>
            <Suspense
              fallback={
                <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3">
                  <Loader2 size={36} className="animate-spin text-primary" />
                  <p className="font-label-sm text-xs text-outline">
                    {displayLang === 'ja'
                      ? 'ツールを読み込み中...'
                      : displayLang === 'en'
                      ? 'Initializing tool...'
                      : 'Đang khởi tạo công cụ...'}
                  </p>
                </div>
              }
            >
              <ActiveComponent displayLang={displayLang} />
            </Suspense>
          </ToolErrorBoundary>
        </ToolContainer>
      ) : (
        /* CASE 2: DISCOVERY HUB FLOW (HOME, DOMAIN CATALOGUE, OR SEARCH) */
        <>
          {/* Single Global Navbar SOT */}
          <Navbar
            displayLang={displayLang}
            onLangChange={setDisplayLang}
            onOpenSettings={() => setIsSettingsOpen(true)}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            onGoHome={handleBackToHome}
            showFlappyBird={showFlappyBird}
            onOpenFlappyGame={() => setShowFlappyGame(true)}
            showToolioNinja={showToolioNinja}
            onOpenNinjaGame={() => setShowNinjaGame(true)}
          />

          {/* VIEW A: GLOBAL CROSS-DOMAIN SEARCH RESULTS */}
          {searchQuery.trim() ? (
            <main className="flex-1 max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full space-y-6">
              {/* Search Result Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-border-subtle/70">
                <div className="space-y-1">
                  <h1 className="font-title-lg text-xl sm:text-2xl font-bold text-on-surface">
                    {displayLang === 'ja'
                      ? `検索結果: 「${searchQuery}」`
                      : displayLang === 'en'
                      ? `Search Results for "${searchQuery}"`
                      : `Kết quả tìm kiếm: "${searchQuery}"`}
                  </h1>
                  <p className="font-body-sm text-xs text-on-surface-variant">
                    {displayLang === 'ja'
                      ? `全ドメインから ${searchResults.length} 件のツールが見つかりました`
                      : displayLang === 'en'
                      ? `Found ${searchResults.length} tools across all domains`
                      : `Tìm thấy ${searchResults.length} công cụ trên toàn bộ hệ thống`}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="self-start sm:self-auto px-3 py-1.5 rounded-lg text-xs font-semibold text-primary hover:bg-surface-container bg-surface-subtle border border-border-subtle transition-colors cursor-pointer"
                >
                  {displayLang === 'ja' ? '検索をクリア' : displayLang === 'en' ? 'Clear search' : 'Xóa tìm kiếm'}
                </button>
              </div>

              {/* Search Result Miniapp Display (Grid on Desktop, Compact List on Mobile) */}
              <div className="hidden sm:grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {searchResults.map((tool) => (
                  <ToolCard
                    key={tool.id}
                    tool={tool}
                    onSelectTool={selectTool}
                    displayLang={displayLang}
                    showGroupContext={true}
                    variant="grid"
                  />
                ))}
              </div>
              <div className="flex flex-col gap-2.5 sm:hidden">
                {searchResults.map((tool) => (
                  <ToolCard
                    key={tool.id}
                    tool={tool}
                    onSelectTool={selectTool}
                    displayLang={displayLang}
                    showGroupContext={true}
                    variant="compact-list"
                  />
                ))}
              </div>

              {/* No Search Results State */}
              {searchResults.length === 0 && (
                <div className="rounded-2xl border border-dashed border-border-subtle bg-surface-container/50 px-6 py-14 text-center flex flex-col items-center justify-center space-y-4">
                  <div className="w-14 h-14 rounded-full bg-surface-subtle flex items-center justify-center text-outline">
                    <SearchX size={28} />
                  </div>
                  <div className="space-y-1.5 max-w-md">
                    <h2 className="font-title-sm text-base font-bold text-on-surface">
                      {displayLang === 'ja'
                        ? `「${searchQuery}」に一致するツールは見つかりませんでした`
                        : displayLang === 'en'
                        ? `No tools matched "${searchQuery}"`
                        : `Không tìm thấy công cụ phù hợp với "${searchQuery}"`}
                    </h2>
                    <p className="font-body-sm text-xs text-on-surface-variant leading-relaxed">
                      {displayLang === 'ja'
                        ? 'キーワードを変えてお試しください (例: PDF, 画像, 税金, ビザ, 請求書)。'
                        : displayLang === 'en'
                        ? 'Try alternative keywords such as PDF, Image, Tax, Visa, or Invoice.'
                        : 'Vui lòng thử từ khóa khác như "PDF", "Ảnh", "Thuế", "Visa", "Hóa đơn".'}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="px-4 py-2 rounded-xl bg-primary text-on-primary font-label-sm text-xs font-semibold hover:bg-primary/90 transition-colors shadow-xs cursor-pointer"
                  >
                    {displayLang === 'ja' ? '検索をクリアして戻る' : displayLang === 'en' ? 'Clear search' : 'Xóa tìm kiếm'}
                  </button>
                </div>
              )}
            </main>
          ) : route.type === 'domain' ? (
            /* VIEW B: TOP-LEVEL DOMAIN CATALOGUE */
            <DomainCatalogue
              group={route.domain}
              tools={
                route.domain === 'japan-life'
                  ? japanLifeTools
                  : route.domain === 'vietnam-life'
                  ? vietnamLifeTools
                  : commonTools
              }
              displayLang={displayLang}
              activeFilter={route.filter || 'all'}
              onSelectFilter={handleSelectFilter}
              onSelectTool={selectTool}
              onBackToHome={handleBackToHome}
            />
          ) : (
            /* VIEW C: HOMEPAGE WITH 3 TOP-LEVEL DOMAIN CARDS */
            <main className="flex-1 max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full space-y-7">
              {/* Welcoming Scenic Hero Banner with Mascot & Brand Quote */}
              <HeroScenicBanner displayLang={displayLang} />

              {/* 3 Top-Level Domains Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* 1. Tools Domain */}
                <HubDomainCard
                  id="common"
                  title={getDomainName('common', displayLang)}
                  subtitle={HUB_DOMAINS.common.subtitle[displayLang] || HUB_DOMAINS.common.subtitle.vi}
                  description={HUB_DOMAINS.common.description[displayLang] || HUB_DOMAINS.common.description.vi}
                  toolCount={commonTools.length}
                  displayLang={displayLang}
                  onSelect={() => handleSelectDomain('common')}
                />

                {/* 2. Japan Life Domain */}
                <HubDomainCard
                  id="japan-life"
                  title={getDomainName('japan-life', displayLang)}
                  subtitle={HUB_DOMAINS['japan-life'].subtitle[displayLang] || HUB_DOMAINS['japan-life'].subtitle.vi}
                  description={HUB_DOMAINS['japan-life'].description[displayLang] || HUB_DOMAINS['japan-life'].description.vi}
                  toolCount={japanLifeTools.length}
                  displayLang={displayLang}
                  onSelect={() => handleSelectDomain('japan-life')}
                />

                {/* 3. Vietnam Life Domain */}
                <HubDomainCard
                  id="vietnam-life"
                  title={getDomainName('vietnam-life', displayLang)}
                  subtitle={HUB_DOMAINS['vietnam-life'].subtitle[displayLang] || HUB_DOMAINS['vietnam-life'].subtitle.vi}
                  description={HUB_DOMAINS['vietnam-life'].description[displayLang] || HUB_DOMAINS['vietnam-life'].description.vi}
                  toolCount={vietnamLifeTools.length}
                  status="coming_soon"
                  displayLang={displayLang}
                  onSelect={() => handleSelectDomain('vietnam-life')}
                />
              </div>

              {/* Trust and Privacy Feature Badges */}
              <div className="pt-6 pb-2 border-t border-border-subtle/60 grid grid-cols-1 sm:grid-cols-3 gap-4 text-center sm:text-left">
                <div className="flex items-center gap-3 p-3 rounded-xl bg-surface-container/40 border border-border-subtle/50">
                  <div className="w-8 h-8 rounded-lg bg-secondary/15 text-secondary flex items-center justify-center shrink-0">
                    <ShieldCheck size={18} />
                  </div>
                  <div>
                    <p className="font-label-sm text-xs font-bold text-on-surface">
                      {displayLang === 'ja' ? '100% ローカル処理' : displayLang === 'en' ? 'Client-Side Safe' : 'An toàn tuyệt đối'}
                    </p>
                    <p className="font-body-sm text-[11px] text-on-surface-variant">
                      {displayLang === 'ja' ? '端末内ローカル完結' : displayLang === 'en' ? 'Files never leave browser' : 'Dữ liệu không rời máy tính'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 rounded-xl bg-surface-container/40 border border-border-subtle/50">
                  <div className="w-8 h-8 rounded-lg bg-primary/15 text-primary flex items-center justify-center shrink-0">
                    <Zap size={18} />
                  </div>
                  <div>
                    <p className="font-label-sm text-xs font-bold text-on-surface">
                      {displayLang === 'ja' ? '高速・即時処理' : displayLang === 'en' ? 'Instant & Fast' : 'Tốc độ tức thì'}
                    </p>
                    <p className="font-body-sm text-[11px] text-on-surface-variant">
                      {displayLang === 'ja' ? '待機なしの瞬時実行' : displayLang === 'en' ? 'Zero network latency' : 'Không có độ trễ mạng'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 rounded-xl bg-surface-container/40 border border-border-subtle/50">
                  <div className="w-8 h-8 rounded-lg bg-tertiary/15 text-tertiary flex items-center justify-center shrink-0">
                    <Lock size={18} />
                  </div>
                  <div>
                    <p className="font-label-sm text-xs font-bold text-on-surface">
                      {displayLang === 'ja' ? 'ゼロトラスト' : displayLang === 'en' ? 'Zero Trust' : 'Bảo mật riêng tư'}
                    </p>
                    <p className="font-body-sm text-[11px] text-on-surface-variant">
                      {displayLang === 'ja' ? 'ログイン不要・無料' : displayLang === 'en' ? 'No account required' : 'Không cần đăng nhập'}
                    </p>
                  </div>
                </div>
              </div>
            </main>
          )}

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
                  className="font-body-sm text-xs text-on-surface-variant hover:text-primary transition-colors underline decoration-border-subtle underline-offset-4 cursor-pointer"
                >
                  {displayLang === 'ja' ? 'データ処理方針' : displayLang === 'en' ? 'Data Policy' : 'Chính sách dữ liệu'}
                </button>
                <button
                  type="button"
                  onClick={() => setIsSettingsOpen(true)}
                  className="font-body-sm text-xs text-on-surface-variant hover:text-primary transition-colors cursor-pointer"
                >
                  {displayLang === 'ja' ? '設定' : displayLang === 'en' ? 'Settings' : 'Cài đặt'}
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

      {/* Floating Flappy Bird Easter Egg */}
      {showFlappyBird && route.type !== 'tool' && (
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

      {/* Floating Toolio Ninja Pet */}
      {showToolioNinja && route.type !== 'tool' && (
        <Suspense fallback={null}>
          <ToolioNinjaPet displayLang={displayLang} onOpenGame={() => setShowNinjaGame(true)} />
        </Suspense>
      )}

      {/* Toolio Ninja Game Modal */}
      {showNinjaGame && (
        <Suspense fallback={null}>
          <ToolioNinjaModal displayLang={displayLang} onClose={() => setShowNinjaGame(false)} />
        </Suspense>
      )}
    </div>
  );
}


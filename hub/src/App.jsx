import React, { useState, useEffect, useCallback, useMemo, Suspense, lazy } from 'react';
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
import {
  Loader2,
  Zap,
  ArrowRight,
  ArrowUpRight,
  ShieldCheck,
  CheckCircle2,
  Laptop,
  Cpu,
  Receipt,
  Scale,
  Image as ImageIcon,
  Sparkles,
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

  // Category counts
  const categoryCounts = useMemo(() => {
    const counts = {};
    categoryIds.forEach((catId) => {
      counts[catId] = toolsForCategory(tools, catId, hiddenToolIds).length;
    });
    return counts;
  }, [categoryIds, hiddenToolIds]);

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

  // Featured Top 3 Tools
  const featuredTools = useMemo(() => {
    return [
      {
        id: 'image-convert',
        badge: 'ƯU TIÊN 1',
        badgeColor: 'bg-secondary/20 text-secondary',
        title: 'WebP Master & Nén Ảnh',
        desc: 'Nén hàng loạt không giới hạn số lượng, giảm tới 80% dung lượng tệp tin tức thì mà vẫn giữ trọn vẹn chất lượng thị giác.',
        icon: ImageIcon,
        iconBg: 'bg-primary-container/20 text-primary',
        glowColor: 'bg-brand-cyan-bright/10 group-hover:bg-brand-cyan-bright/20',
        hoverColor: 'group-hover:text-primary',
        safeTag: 'Wasm Client-side',
        actionText: 'Khởi chạy',
        actionColor: 'text-primary'
      },
      {
        id: 'accounting-reconcile',
        badge: 'CHUYÊN MÔN',
        badgeColor: 'bg-tertiary/20 text-tertiary',
        title: 'Đối Chiếu Kế Toán Doanh Thu',
        desc: 'Tự động bắt chéo sai lệch số liệu doanh thu và thuế GTGT sổ tài khoản 511 so khớp 3331 với tốc độ hàng nghìn dòng/giây.',
        icon: Scale,
        iconBg: 'bg-tertiary-container/20 text-tertiary',
        glowColor: 'bg-tertiary-container/10 group-hover:bg-tertiary-container/20',
        hoverColor: 'group-hover:text-tertiary',
        safeTag: 'Local Excel Parsing',
        actionText: 'Nạp bảng kê',
        actionColor: 'text-tertiary'
      },
      {
        id: 'invoice-studio',
        badge: 'PHỔ BIẾN',
        badgeColor: 'bg-primary-container/20 text-primary',
        title: 'Xử Lý Hóa Đơn & Thanh Toán',
        desc: 'Bóc tách dữ liệu XML và PDF hóa đơn điện tử cơ quan thuế thành bảng kê Excel đồng bộ phục vụ đề nghị thanh toán tức thì.',
        icon: Receipt,
        iconBg: 'bg-secondary-container/20 text-secondary',
        glowColor: 'bg-secondary-container/10 group-hover:bg-secondary-container/20',
        hoverColor: 'group-hover:text-secondary',
        safeTag: 'Trình duyệt tự giải mã',
        actionText: 'Bóc tách XML',
        actionColor: 'text-secondary'
      }
    ].filter((ft) => !hiddenToolIds.includes(ft.id) && activeTools.some((t) => t.id === ft.id));
  }, [hiddenToolIds, activeTools]);

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
            onOpenSearch={() => setIsSearchOpen(true)}
            onOpenSettings={() => setIsSettingsOpen(true)}
            activeCategory={activeCategory}
            onSelectCategory={setActiveCategory}
            categoryIds={categoryIds}
          />

          <main className="flex-1 max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-12 w-full space-y-8">
            {/* Section 1: Hero Banner */}
            <HeroBanner displayLang={displayLang} />

            {/* Live Search & Filter Bar */}
            <CategoryTabs
              activeCategory={activeCategory}
              onSelectCategory={setActiveCategory}
              displayLang={displayLang}
              visibleCategoryIds={categoryIds}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              totalResults={displayedTools.length}
              categoryCounts={categoryCounts}
            />

            {/* Section 2: Featured & Priority Actions (Workspace Top Tier) */}
            {activeCategory === ALL_CATEGORY && !searchQuery.trim() && featuredTools.length > 0 && (
              <section className="flex flex-col gap-4 my-8">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Zap className="w-5 h-5 text-secondary" />
                    <h2 className="font-headline-md text-xl font-bold text-on-surface tracking-tight">
                      Truy Cập Nhanh &amp; Ưu Tiên Cao
                    </h2>
                  </div>
                  <span className="font-label-sm text-xs text-outline uppercase tracking-wider font-mono">
                    Hiệu năng máy trạm
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {featuredTools.map((ft) => {
                    const FIcon = ft.icon;
                    return (
                      <div
                        key={ft.id}
                        onClick={() => selectTool(ft.id)}
                        className="relative overflow-hidden p-6 rounded-xl bg-surface-container-high hover:bg-surface-variant transition-all duration-300 shadow-md group flex flex-col justify-between cursor-pointer"
                      >
                        <div className={`absolute -right-10 -bottom-10 w-36 h-36 rounded-full blur-2xl transition-all pointer-events-none ${ft.glowColor}`} />

                        <div className="space-y-4 relative z-10">
                          <div className="flex items-center justify-between">
                            <div className={`w-12 h-12 rounded-lg ${ft.iconBg} flex items-center justify-center shadow-inner`}>
                              <FIcon size={26} />
                            </div>
                            <span className={`px-2 py-0.5 rounded font-label-sm text-xs font-semibold ${ft.badgeColor} flex items-center gap-1`}>
                              <span className="w-1.5 h-1.5 rounded-full bg-current" />
                              {ft.badge}
                            </span>
                          </div>

                          <div>
                            <div className="flex items-center gap-1.5 mb-1.5">
                              <span className={`font-title-sm text-base font-semibold text-on-surface ${ft.hoverColor} transition-colors`}>
                                {ft.title}
                              </span>
                              <ArrowUpRight size={15} className="text-outline opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
                            <p className="font-body-md text-xs text-on-surface-variant leading-relaxed">
                              {ft.desc}
                            </p>
                          </div>
                        </div>

                        <div className="pt-6 mt-4 border-t border-border-subtle/30 flex items-center justify-between relative z-10">
                          <span className="px-2 py-1 bg-surface-subtle text-secondary font-label-sm text-[11px] rounded flex items-center gap-1.5">
                            <ShieldCheck size={13} className="text-secondary" />
                            {ft.safeTag}
                          </span>
                          <span className={`font-label-sm text-xs ${ft.actionColor} flex items-center gap-1 group-hover:translate-x-1 transition-transform font-semibold`}>
                            {ft.actionText} <ArrowRight size={14} />
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {/* Section 3: Main Tools Catalog Grid */}
            <section className="flex flex-col gap-4 my-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h2 className="font-headline-md text-xl font-bold text-on-surface tracking-tight">
                    {activeCategory === ALL_CATEGORY
                      ? 'Toàn Bộ Hệ Thống Công Cụ'
                      : `Danh Mục: ${toolsForCategory(tools, activeCategory, hiddenToolIds).length} công cụ`}
                  </h2>
                  <p className="font-body-sm text-xs text-on-surface-variant mt-0.5">
                    Kiến trúc mô-đun hóa, chạy song song đa luồng trực tiếp tại trình duyệt web.
                  </p>
                </div>
              </div>

              {/* Tool Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pt-1">
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
            </section>

            {/* Section 4: Transparency & Architecture Protocol Banner */}
            <section className="mt-12 rounded-xl bg-surface-container p-6 lg:p-8 border border-border-subtle shadow-md">
              <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
                <div className="space-y-2 max-w-2xl">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-6 h-6 text-secondary" />
                    <h3 className="font-headline-md text-xl font-bold text-on-surface">
                      Minh Bạch Kiến Trúc Dữ Liệu
                    </h3>
                  </div>
                  <p className="font-body-md text-sm text-on-surface-variant leading-relaxed">
                    Chúng tôi phân định rạch ròi giữa các tiến trình xử lý ngay tại máy tính của bạn với các tính năng điện toán đám mây nâng cao. Không thu thập nội dung tài liệu nhạy cảm.
                  </p>
                </div>

                {/* Quick Metrics Ribbon */}
                <div className="flex items-center gap-4 shrink-0 bg-surface-subtle/80 p-4 rounded-xl border border-border-subtle">
                  <div className="text-center px-2">
                    <div className="font-title-sm text-base font-bold text-secondary">10 / 12</div>
                    <div className="font-label-sm text-[11px] text-outline font-mono">Chạy Offline</div>
                  </div>
                  <div className="w-px h-8 bg-border-subtle" />
                  <div className="text-center px-2">
                    <div className="font-title-sm text-base font-bold text-primary">0 KB</div>
                    <div className="font-label-sm text-[11px] text-outline font-mono">Lưu Trữ Server</div>
                  </div>
                  <div className="w-px h-8 bg-border-subtle" />
                  <div className="text-center px-2">
                    <div className="font-title-sm text-base font-bold text-tertiary">&lt; 50ms</div>
                    <div className="font-label-sm text-[11px] text-outline font-mono">Độ Trễ Phản Hồi</div>
                  </div>
                </div>
              </div>

              {/* Dual Architectural Comparison Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                {/* Client-side Box */}
                <div className="p-5 rounded-lg bg-surface-container-high border border-border-subtle space-y-3">
                  <div className="flex items-center gap-2 text-secondary">
                    <Laptop size={20} />
                    <span className="font-title-sm text-sm font-semibold">Client-Side Safe (WebAssembly / Native JS)</span>
                  </div>
                  <p className="font-body-sm text-xs text-on-surface-variant leading-relaxed">
                    Tệp tin của bạn (Ảnh, Hóa đơn XML, PDF cá nhân) không bao giờ rời khỏi trình duyệt. Máy tính của bạn đảm nhiệm 100% việc tính toán, giải mã và kết xuất dữ liệu. An toàn tuyệt đối với thông tin nhạy cảm.
                  </p>
                  <div className="flex items-center gap-2 text-outline font-label-sm text-xs pt-1">
                    <CheckCircle2 size={15} className="text-secondary shrink-0" />
                    <span>Hỗ trợ ngắt kết nối mạng (Offline Mode)</span>
                  </div>
                </div>

                {/* Backend AI Box */}
                <div className="p-5 rounded-lg bg-surface-container-high border border-border-subtle space-y-3">
                  <div className="flex items-center gap-2 text-primary">
                    <Cpu size={20} />
                    <span className="font-title-sm text-sm font-semibold">Antigravity AI &amp; Cloud Engine</span>
                  </div>
                  <p className="font-body-sm text-xs text-on-surface-variant leading-relaxed">
                    Dành riêng cho các tác vụ cần mô hình ngôn ngữ lớn (LLM) hoặc phân tích BI phức tạp. Dữ liệu được mã hóa truyền tải theo chuẩn TLS 1.3 và tự động hủy ngay sau khi phiên xử lý kết thúc.
                  </p>
                  <div className="flex items-center gap-2 text-outline font-label-sm text-xs pt-1">
                    <ShieldCheck size={15} className="text-primary shrink-0" />
                    <span>Không dùng dữ liệu khách hàng để huấn luyện mô hình</span>
                  </div>
                </div>
              </div>
            </section>
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

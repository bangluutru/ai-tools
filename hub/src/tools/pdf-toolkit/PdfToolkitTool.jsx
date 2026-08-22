import React, { useState, useEffect, useCallback, lazy, Suspense } from 'react';
import { Scissors, Combine, Minimize2, Loader2 } from 'lucide-react';

// ─── Lazy-load the 3 core views (same imports the old wrappers used) ───
const PdfSplitterView = lazy(() =>
  import('@ai-tools/core/components/PdfSplitterView.jsx')
);
const PdfMergerView = lazy(() =>
  import('@ai-tools/core/components/PdfMergerView.jsx')
);
const PdfCompressorView = lazy(() =>
  import('@ai-tools/core/components/PdfCompressorView.jsx')
);

// ─── Tab definitions ────────────────────────────────────────────────────
const TABS = [
  {
    id: 'split',
    icon: Scissors,
    label_vn: 'Tách PDF',
    label_en: 'Split',
    label_ja: '分割',
    color: 'rose',
    gradient: 'from-rose-500 to-pink-600',
  },
  {
    id: 'merge',
    icon: Combine,
    label_vn: 'Gộp PDF',
    label_en: 'Merge',
    label_ja: '結合',
    color: 'violet',
    gradient: 'from-violet-500 to-purple-600',
  },
  {
    id: 'compress',
    icon: Minimize2,
    label_vn: 'Nén PDF',
    label_en: 'Compress',
    label_ja: '圧縮',
    color: 'teal',
    gradient: 'from-teal-500 to-emerald-600',
  },
];

const VALID_TAB_IDS = new Set(TABS.map((t) => t.id));

// Legacy tool ids → tab mapping (backward compat)
const LEGACY_TO_TAB = {
  'pdf-split': 'split',
  'pdf-merge': 'merge',
  'pdf-compress': 'compress',
};

/**
 * Parse the initial tab from the current URL.
 *
 * Supports:
 * - `#/tools/pdf-toolkit?tab=merge`  — query param on hash
 * - Legacy redirect detected by caller (passed as prop or read from hash)
 */
function detectInitialTab() {
  const hash = window.location.hash || '';

  // 1. Check for ?tab= query inside the hash
  const qIdx = hash.indexOf('?');
  if (qIdx !== -1) {
    const params = new URLSearchParams(hash.slice(qIdx + 1));
    const tab = params.get('tab');
    if (tab && VALID_TAB_IDS.has(tab)) return tab;
  }

  // 2. Check if we arrived here via a legacy redirect
  //    The redirect stores the original slug in sessionStorage briefly
  const legacy = sessionStorage.getItem('pdf_toolkit_legacy_tab');
  if (legacy) {
    sessionStorage.removeItem('pdf_toolkit_legacy_tab');
    if (VALID_TAB_IDS.has(legacy)) return legacy;
  }

  return 'split';
}

// ─── Loading spinner ────────────────────────────────────────────────────
function TabLoadingFallback() {
  return (
    <div className="min-h-[40vh] flex flex-col items-center justify-center gap-3">
      <Loader2 size={32} className="animate-spin text-emerald-400" />
      <p className="text-xs font-semibold text-slate-400">Đang khởi tạo...</p>
    </div>
  );
}

// ─── Main component ─────────────────────────────────────────────────────
export default function PdfToolkitTool({ displayLang }) {
  const [activeTab, setActiveTab] = useState(detectInitialTab);

  // Sync tab to URL query (lightweight, no full page nav)
  useEffect(() => {
    const base = window.location.hash.split('?')[0];
    const newHash = `${base}?tab=${activeTab}`;
    // Use replaceState so tab switches don't pollute browser history
    window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}${newHash}`);
  }, [activeTab]);

  const getLabel = useCallback(
    (tab) => {
      if (displayLang === 'en') return tab.label_en;
      if (displayLang === 'ja') return tab.label_ja;
      return tab.label_vn;
    },
    [displayLang],
  );

  // Color maps for active tab styling
  const activeColorMap = {
    rose: 'border-rose-500 text-rose-400',
    violet: 'border-violet-500 text-violet-400',
    teal: 'border-teal-500 text-teal-400',
  };
  const activeBgMap = {
    rose: 'bg-rose-500/10',
    violet: 'bg-violet-500/10',
    teal: 'bg-teal-500/10',
  };

  return (
    <div className="w-full">
      {/* ─── Tab Bar ──────────────────────────────────────────── */}
      <div className="sticky top-[57px] z-40 bg-slate-950/95 backdrop-blur-md border-b border-slate-800">
        <div className="max-w-6xl mx-auto px-4">
          <nav className="flex gap-1 py-1.5" role="tablist" aria-label="PDF Tools">
            {TABS.map((tab) => {
              const isActive = tab.id === activeTab;
              const Icon = tab.icon;

              return (
                <button
                  key={tab.id}
                  role="tab"
                  aria-selected={isActive}
                  aria-controls={`panel-${tab.id}`}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    relative flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold
                    transition-all duration-200 ease-out cursor-pointer
                    ${
                      isActive
                        ? `${activeColorMap[tab.color]} ${activeBgMap[tab.color]} border border-current/20 shadow-lg shadow-current/5`
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 border border-transparent'
                    }
                  `}
                >
                  <Icon size={16} className={isActive ? '' : 'opacity-60'} />
                  {/* Label: always visible on sm+, hidden on xs for space */}
                  <span className="hidden sm:inline">{getLabel(tab)}</span>
                  {/* Underline indicator */}
                  {isActive && (
                    <span
                      className={`absolute bottom-0 left-3 right-3 h-0.5 rounded-full bg-gradient-to-r ${tab.gradient}`}
                    />
                  )}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* ─── Tab Panels ───────────────────────────────────────── */}
      {/* We keep all 3 panels mounted (display:none when inactive) so user
          state is preserved when switching tabs. Suspense wraps each panel
          independently to allow progressive loading. */}
      <div
        id="panel-split"
        role="tabpanel"
        aria-labelledby="tab-split"
        style={{ display: activeTab === 'split' ? 'block' : 'none' }}
      >
        <Suspense fallback={<TabLoadingFallback />}>
          <PdfSplitterView displayLang={displayLang} />
        </Suspense>
      </div>

      <div
        id="panel-merge"
        role="tabpanel"
        aria-labelledby="tab-merge"
        style={{ display: activeTab === 'merge' ? 'block' : 'none' }}
      >
        <Suspense fallback={<TabLoadingFallback />}>
          <PdfMergerView displayLang={displayLang} />
        </Suspense>
      </div>

      <div
        id="panel-compress"
        role="tabpanel"
        aria-labelledby="tab-compress"
        style={{ display: activeTab === 'compress' ? 'block' : 'none' }}
      >
        <Suspense fallback={<TabLoadingFallback />}>
          <PdfCompressorView displayLang={displayLang} />
        </Suspense>
      </div>
    </div>
  );
}

// Export the legacy-to-tab map so toolRoute.js can use it for redirects
export { LEGACY_TO_TAB };

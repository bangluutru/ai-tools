import React, { useState } from 'react';
import {
  BookOpen,
  Baby,
  HeartHandshake,
  Stamp,
  FileText,
  ShieldAlert,
  Layers,
  ChevronRight,
  Sparkles,
  Compass,
  FileCheck2,
} from 'lucide-react';
import { CONSULAR_CATEGORIES, CONSULAR_PROCEDURES } from '../../consular/procedures/index.js';
import { CROSS_SYSTEM_JOURNEYS } from '../../consular/journeys/crossSystemJourneys.js';
import { getConsularI18n } from '../../consular/i18n/consularI18n.js';

const iconMap = {
  BookOpen,
  Baby,
  HeartHandshake,
  Stamp,
  FileText,
  ShieldAlert,
  Layers,
  Compass,
};

export default function ProcedureNavigatorPane({
  selectedProcedureId,
  onSelectProcedure,
  selectedJourneyId,
  onSelectJourney,
  searchQuery = '',
  displayLang = 'vi',
}) {
  const t = getConsularI18n(displayLang);
  const [activeTab, setActiveTab] = useState('categories'); // 'categories' | 'journeys'
  const [expandedCategories, setExpandedCategories] = useState({
    passport: true,
    birth_nationality: true,
    marriage_family: true,
    legalization_auth: true,
    death_civil: false,
    protection_emergency: false,
    visa_other: false,
  });

  const toggleCategory = (catId) => {
    setExpandedCategories((prev) => ({
      ...prev,
      [catId]: !prev[catId],
    }));
  };

  // Lọc theo search
  const filteredProcedures = CONSULAR_PROCEDURES.filter((p) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const titleMatch = (p.title.vi + p.title.en + p.title.ja).toLowerCase().includes(q);
    const summaryMatch = (p.summary?.vi || p.summary || '').toLowerCase().includes(q);
    const aliasMatch = p.aliases?.some((a) => a.toLowerCase().includes(q));
    return titleMatch || summaryMatch || aliasMatch;
  });

  return (
    <aside className="w-full flex flex-col bg-surface-container-low border border-border-subtle rounded-2xl overflow-hidden shadow-xs">
      {/* Tab chuyển đổi chế độ */}
      <div className="flex items-center border-b border-border-subtle bg-surface-container-lowest p-1.5 gap-1 text-xs">
        <button
          type="button"
          onClick={() => setActiveTab('categories')}
          className={`flex-1 py-1.5 px-2 rounded-xl font-medium transition-all text-center cursor-pointer ${
            activeTab === 'categories'
              ? 'bg-surface-container-highest text-primary font-semibold shadow-2xs'
              : 'text-on-surface-variant hover:text-on-surface'
          }`}
        >
          {t.navigator.tabCategories} ({filteredProcedures.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('journeys')}
          className={`flex-1 py-1.5 px-2 rounded-xl font-medium transition-all text-center flex items-center justify-center gap-1 cursor-pointer ${
            activeTab === 'journeys'
              ? 'bg-surface-container-highest text-primary font-semibold shadow-2xs'
              : 'text-on-surface-variant hover:text-on-surface'
          }`}
        >
          <Compass size={13} className="text-rose-500" />
          <span>{t.navigator.tabJourneys} ({CROSS_SYSTEM_JOURNEYS.length})</span>
        </button>
      </div>

      {/* Danh sách cuộn */}
      <div className="flex-1 p-2 sm:p-3 overflow-y-auto max-h-[calc(100vh-280px)] space-y-3">
        {activeTab === 'journeys' ? (
          /* TAB 2: CROSS SYSTEM LIFE JOURNEYS */
          <div className="space-y-2">
            <div className="px-2 py-1 text-[11px] font-semibold text-outline uppercase tracking-wider">
              {t.navigator.journeySectionTitle}
            </div>
            {CROSS_SYSTEM_JOURNEYS.map((journey) => {
              const isSelected = selectedJourneyId === journey.id;
              const journeyTitle = journey.title?.[displayLang] || journey.title?.vi || journey.title;
              const journeySub = journey.subtitle?.[displayLang] || journey.subtitle?.vi || journey.subtitle;

              return (
                <button
                  key={journey.id}
                  type="button"
                  onClick={() => onSelectJourney?.(journey.id)}
                  className={`w-full text-left p-3 rounded-xl border transition-all cursor-pointer group ${
                    isSelected
                      ? 'bg-rose-500/10 border-rose-500/40 shadow-xs ring-1 ring-rose-500/30'
                      : 'bg-surface-container/60 hover:bg-surface-container border-border-subtle/70'
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-rose-500/15 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0 mt-0.5">
                      <Sparkles size={14} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className={`text-xs font-bold leading-snug transition-colors ${
                        isSelected ? 'text-rose-700 dark:text-rose-300' : 'text-on-surface group-hover:text-primary'
                      }`}>
                        {journeyTitle}
                      </h3>
                      <p className="text-[11px] text-on-surface-variant line-clamp-1 mt-0.5">
                        {journeySub}
                      </p>
                      <div className="mt-2 text-[10px] text-outline flex items-center gap-1.5">
                        <span className="font-semibold text-primary">{journey.timelineSteps.length} {t.navigator.journeySteps}</span>
                        <span>•</span>
                        <span className="truncate">{t.navigator.journeyPartners}</span>
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        ) : (
          /* TAB 1: DANH MỤC THỦ TỤC */
          <div className="space-y-2">
            {CONSULAR_CATEGORIES.map((cat) => {
              const IconComp = iconMap[cat.icon] || FileText;
              const catProcedures = filteredProcedures.filter((p) => p.category === cat.id);
              const isExpanded = expandedCategories[cat.id] || searchQuery.trim().length > 0;
              const catName = cat.name?.[displayLang] || cat.name?.vi || cat.name;

              if (catProcedures.length === 0) return null;

              return (
                <div key={cat.id} className="border border-border-subtle/70 rounded-xl overflow-hidden bg-surface-container/30">
                  {/* Category Header */}
                  <button
                    type="button"
                    onClick={() => toggleCategory(cat.id)}
                    className="w-full flex items-center justify-between px-3 py-2.5 bg-surface-container/60 hover:bg-surface-container transition-colors text-left cursor-pointer"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-6 h-6 rounded-md bg-surface-container-highest flex items-center justify-center shrink-0 text-primary">
                        <IconComp size={13} />
                      </div>
                      <span className="text-xs font-bold text-on-surface truncate">
                        {catName}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-surface-container-highest text-outline font-semibold">
                        {catProcedures.length}
                      </span>
                      <ChevronRight
                        size={14}
                        className={`text-outline transition-transform duration-150 ${
                          isExpanded ? 'rotate-90' : ''
                        }`}
                      />
                    </div>
                  </button>

                  {/* Procedures List */}
                  {isExpanded && (
                    <div className="p-1 space-y-1 bg-surface-container-low/50">
                      {catProcedures.map((proc) => {
                        const isSelected = selectedProcedureId === proc.id;
                        const hasForm = !!proc.formId;
                        const procTitle = proc.title?.[displayLang] || proc.title?.vi || proc.title;

                        return (
                          <button
                            key={proc.id}
                            type="button"
                            onClick={() => onSelectProcedure?.(proc.id)}
                            className={`w-full text-left px-2.5 py-2 rounded-lg text-xs transition-all flex items-start justify-between gap-2 cursor-pointer ${
                              isSelected
                                ? 'bg-primary text-on-primary font-semibold shadow-2xs'
                                : 'hover:bg-surface-container text-on-surface-variant hover:text-on-surface'
                            }`}
                          >
                            <div className="flex-1 min-w-0">
                              <div className="line-clamp-2 leading-snug">
                                {procTitle}
                              </div>
                              {hasForm && (
                                <span
                                  className={`inline-flex items-center gap-1 mt-1 px-1.5 py-0.2 rounded text-[9.5px] font-medium tracking-wide ${
                                    isSelected
                                      ? 'bg-white/20 text-white'
                                      : 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20'
                                  }`}
                                >
                                  <FileCheck2 size={10} />
                                  <span>{t.navigator.onlineFormBadge}</span>
                                </span>
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </aside>
  );
}

import React, { useState, useEffect } from 'react';
import ConsularHeader from './ConsularHeader.jsx';
import ProcedureNavigatorPane from './ProcedureNavigatorPane.jsx';
import ProcedureGuidePane from './ProcedureGuidePane.jsx';
import DocumentWorkspacePane from './DocumentWorkspacePane.jsx';
import {
  CONSULAR_PROCEDURES,
  getProcedureById,
} from '../../consular/procedures/index.js';
import { CROSS_SYSTEM_JOURNEYS } from '../../consular/journeys/crossSystemJourneys.js';
import { getOfficeForPrefecture } from '../../consular/jurisdictions/japanPrefectures.js';
import { getConsularI18n } from '../../consular/i18n/consularI18n.js';

export default function VietnamConsularWorkspace({
  initialProcedureId = 'vn_passport_renewal',
  onNavigateToTool,
  displayLang = 'vi',
}) {
  const t = getConsularI18n(displayLang);
  const [selectedPrefectureId, setSelectedPrefectureId] = useState(() => {
    try {
      return localStorage.getItem('consular_user_prefecture') || '13'; // Mặc định Tokyo (13)
    } catch {
      return '13';
    }
  });

  const [selectedProcedureId, setSelectedProcedureId] = useState(initialProcedureId);
  const [selectedJourneyId, setSelectedJourneyId] = useState(null);
  const [activeFormId, setActiveFormId] = useState(() => {
    const proc = getProcedureById(initialProcedureId);
    return proc?.formId || null;
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileTab, setMobileTab] = useState('guide'); // 'navigator' | 'guide' | 'form'
  const [isExpandedEditor, setIsExpandedEditor] = useState(false);

  const activeProcedure = getProcedureById(selectedProcedureId);
  const activeJourney = selectedJourneyId
    ? CROSS_SYSTEM_JOURNEYS.find((j) => j.id === selectedJourneyId)
    : null;
  const currentOffice = getOfficeForPrefecture(selectedPrefectureId);

  // Lưu tỉnh thành được chọn
  const handleSelectPrefecture = (prefId) => {
    setSelectedPrefectureId(prefId);
    try {
      localStorage.setItem('consular_user_prefecture', prefId);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSelectProcedure = (procId) => {
    setSelectedProcedureId(procId);
    setSelectedJourneyId(null);
    const proc = getProcedureById(procId);
    if (proc?.formId) {
      setActiveFormId(proc.formId);
    }
    setMobileTab('guide');
  };

  const handleSelectJourney = (journeyId) => {
    setSelectedJourneyId(journeyId);
    setMobileTab('guide');
  };

  const handleOpenForm = (formId) => {
    setActiveFormId(formId);
    setMobileTab('form');
  };

  const handleClearDrafts = () => {
    if (window.confirm(t.header.clearDraftsConfirm)) {
      try {
        Object.keys(localStorage).forEach((key) => {
          if (key.startsWith('consular_form_') || key.startsWith('consular_checklist_')) {
            localStorage.removeItem(key);
          }
        });
        window.location.reload();
      } catch (err) {
        console.error(err);
      }
    }
  };

  return (
    <div className="w-full max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8 py-4 space-y-4">
      {/* Header điều hướng, Thẩm quyền địa phương & Tìm kiếm */}
      <ConsularHeader
        selectedPrefectureId={selectedPrefectureId}
        onSelectPrefecture={handleSelectPrefecture}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onClearDrafts={handleClearDrafts}
        currentOffice={currentOffice}
        displayLang={displayLang}
      />

      {/* Tabs điều hướng trên màn hình nhỏ (Mobile / Tablet) */}
      <div className="lg:hidden flex items-center bg-surface-container rounded-xl p-1 text-xs border border-border-subtle mb-3">
        <button
          type="button"
          onClick={() => setMobileTab('navigator')}
          className={`flex-1 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
            mobileTab === 'navigator'
              ? 'bg-primary text-on-primary shadow-2xs'
              : 'text-on-surface-variant'
          }`}
        >
          1. {t.navigator.tabCategories}
        </button>
        <button
          type="button"
          onClick={() => setMobileTab('guide')}
          className={`flex-1 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
            mobileTab === 'guide'
              ? 'bg-primary text-on-primary shadow-2xs'
              : 'text-on-surface-variant'
          }`}
        >
          2. {displayLang === 'ja' ? '案内・書類' : displayLang === 'en' ? 'Guidelines' : 'Hướng dẫn & Hồ sơ'}
        </button>
        <button
          type="button"
          onClick={() => setMobileTab('form')}
          className={`flex-1 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
            mobileTab === 'form'
              ? 'bg-primary text-on-primary shadow-2xs'
              : 'text-on-surface-variant'
          }`}
        >
          3. {displayLang === 'ja' ? '申請書・印刷' : displayLang === 'en' ? 'Form & Print' : 'Biểu mẫu & In A4'}
        </button>
      </div>

      {/* Bố cục 3-Pane Desktop Workspace (Tỷ lệ 2 - 4 - 6 hoặc Fullscreen 12) */}
      <main className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-5 items-start">
        {/* Pane 1: Navigator Pane (Gọn gàng ~ 2 cột / 16.6% - 25%) */}
        {!isExpandedEditor && (
          <div
            className={`lg:col-span-3 xl:col-span-2 ${
              mobileTab !== 'navigator' ? 'hidden lg:block' : 'block'
            }`}
          >
            <ProcedureNavigatorPane
              selectedProcedureId={selectedProcedureId}
              onSelectProcedure={handleSelectProcedure}
              selectedJourneyId={selectedJourneyId}
              onSelectJourney={handleSelectJourney}
              searchQuery={searchQuery}
              displayLang={displayLang}
            />
          </div>
        )}

        {/* Pane 2: Procedure Guide Pane (Gọn gàng ~ 4 cột / 33.3%) */}
        {!isExpandedEditor && (
          <div
            className={`lg:col-span-4 xl:col-span-4 ${
              mobileTab !== 'guide' ? 'hidden lg:block' : 'block'
            }`}
          >
            <ProcedureGuidePane
              procedure={activeProcedure}
              journey={activeJourney}
              selectedPrefectureId={selectedPrefectureId}
              onOpenForm={handleOpenForm}
              onNavigateToTool={onNavigateToTool}
              displayLang={displayLang}
            />
          </div>
        )}

        {/* Pane 3: Document Workspace / Form Editor Pane (Rộng rãi ~ 6 cột / 50% hoặc 12 cột khi Phóng to) */}
        <div
          className={`${
            isExpandedEditor
              ? 'lg:col-span-12'
              : 'lg:col-span-5 xl:col-span-6'
          } sticky top-4 ${
            mobileTab !== 'form' ? 'hidden lg:block' : 'block'
          }`}
        >
          <DocumentWorkspacePane
            activeFormId={activeFormId}
            procedure={activeProcedure}
            onCloseForm={() => setActiveFormId(null)}
            isExpanded={isExpandedEditor}
            onToggleExpand={() => setIsExpandedEditor(!isExpandedEditor)}
            displayLang={displayLang}
          />
        </div>
      </main>
    </div>
  );
}

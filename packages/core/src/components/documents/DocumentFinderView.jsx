/**
 * @file DocumentFinderView.jsx
 * Interactive view for "Tôi cần giấy gì?" (What documents do I need?)
 * Built with StandardToolLayout, high-contrast dark/light mode tokens, WCAG 2.1 AA.
 */

import React, { useState, useMemo } from 'react';
import {
  FileSearch,
  CheckCircle2,
  AlertCircle,
  Clock,
  Building2,
  Store,
  Globe,
  FileText,
  HelpCircle,
  Filter,
  Printer,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  ExternalLink,
} from 'lucide-react';
import StandardToolLayout from '../shared/StandardToolLayout.jsx';
import {
  getAvailableIntents,
  findRequiredDocuments,
} from '../../documents/finders/documentFinderEngine.js';
import { getAllProcedures } from '../../documents/resolvers/procedureRequirementResolver.js';

export function DocumentFinderView({ lang = 'vi' }) {
  const availableIntents = useMemo(() => getAvailableIntents(), []);
  const allProcedures = useMemo(() => getAllProcedures(), []);

  const [selectedIntentId, setSelectedIntentId] = useState('intent.visa-renewal');
  const [selectedProcedureId, setSelectedProcedureId] = useState('procedure.residence-status-renewal');
  const [searchQuery, setSearchQuery] = useState('');
  const [checkedDocs, setCheckedDocs] = useState({});

  // Handle intent click
  const handleSelectIntent = (intent) => {
    setSelectedIntentId(intent.intentId);
    setSelectedProcedureId(intent.procedureId);
  };

  // Handle direct procedure change
  const handleSelectProcedure = (procId) => {
    setSelectedProcedureId(procId);
    const matched = availableIntents.find((i) => i.procedureId === procId);
    setSelectedIntentId(matched ? matched.intentId : null);
  };

  // Compute requirements
  const finderResult = useMemo(() => {
    return findRequiredDocuments({
      procedureId: selectedProcedureId,
      intentId: selectedIntentId,
    });
  }, [selectedProcedureId, selectedIntentId]);

  // Checkbox toggle
  const toggleDoc = (reqId) => {
    setCheckedDocs((prev) => ({
      ...prev,
      [reqId]: !prev[reqId],
    }));
  };

  const handleReset = () => {
    setCheckedDocs({});
  };

  const handlePrint = () => {
    window.print();
  };

  // Filter items by search query if present
  const filterList = (list) => {
    if (!searchQuery.trim()) return list;
    const q = searchQuery.toLowerCase();
    return list.filter((item) => {
      const nameJa = item.documentNameJa.toLowerCase();
      const nameVi = (item.documentNameI18n.vi || '').toLowerCase();
      const nameEn = (item.documentNameI18n.en || '').toLowerCase();
      return nameJa.includes(q) || nameVi.includes(q) || nameEn.includes(q);
    });
  };

  const mandatoryList = filterList(finderResult?.mandatory || []);
  const conditionalList = filterList(finderResult?.conditional || []);
  const ifApplicableList = filterList(finderResult?.ifApplicable || []);
  const optionalList = filterList(finderResult?.optional || []);

  // Completion calculation
  const totalMandatory = finderResult?.mandatory?.length || 0;
  const completedMandatory = (finderResult?.mandatory || []).filter(
    (item) => checkedDocs[item.id]
  ).length;
  const progressPercent =
    totalMandatory > 0 ? Math.round((completedMandatory / totalMandatory) * 100) : 0;

  // I18N helper
  const t = {
    title: {
      ja: '必要書類ファインダー',
      vi: 'Tra cứu hồ sơ giấy tờ cần thiết (Document Finder)',
      en: 'Required Documents Finder',
    },
    subtitle: {
      ja: '行政手続やライフイベントに応じた公的証明書・提出書類を正確に判定・案内します。',
      vi: 'Xác định chính xác danh mục hồ sơ, cơ quan cấp, thời hạn hiệu lực và cách lấy giấy tờ theo từng thủ tục.',
      en: 'Accurately determine required documents, issuing authorities, validity periods, and acquisition channels.',
    },
    intentsTitle: {
      ja: '目的から選ぶ',
      vi: 'Chọn theo nhu cầu của bạn',
      en: 'Select by your goal',
    },
    selectProcedure: {
      ja: 'または手続一覧から選択',
      vi: 'Hoặc chọn trực tiếp từ danh mục thủ tục',
      en: 'Or select directly from procedures',
    },
    searchPlaceholder: {
      ja: '書類名で絞り込み（住民票、課税証明、パスポート等）...',
      vi: 'Lọc nhanh tên giấy tờ (住民票, thuế, hộ chiếu...)...',
      en: 'Filter by document name (resident record, tax, passport)...',
    },
    mandatoryHeading: {
      ja: '必須書類（全員提出）',
      vi: 'Hồ sơ bắt buộc (Tất cả đối tượng)',
      en: 'Mandatory Documents',
    },
    conditionalHeading: {
      ja: '条件付き書類（状況に応じて必要）',
      vi: 'Hồ sơ có điều kiện (Tùy theo hoàn cảnh cụ thể)',
      en: 'Conditional Documents',
    },
    progressTitle: {
      ja: '準備の進捗状況',
      vi: 'Tiến độ chuẩn bị giấy tờ bắt buộc',
      en: 'Preparation Progress',
    },
    deadlineNotice: {
      ja: '法定提出期限',
      vi: 'Thời hạn luật định',
      en: 'Statutory Deadline',
    },
    authorityTitle: {
      ja: '提出先機関',
      vi: 'Cơ quan tiếp nhận',
      en: 'Receiving Authority',
    },
    freshnessBadge: (months) => {
      if (!months) return lang === 'vi' ? 'Không quy định hạn' : lang === 'ja' ? '期限指定なし' : 'No age limit';
      return lang === 'vi' ? `Trong vòng ${months} tháng` : lang === 'ja' ? `${months}か月以内` : `Within ${months} months`;
    },
    originalOrCopy: (type) => {
      switch (type) {
        case 'original_only':
          return lang === 'vi' ? 'Bản gốc' : lang === 'ja' ? '原本必須' : 'Original only';
        case 'copy_acceptable':
          return lang === 'vi' ? 'Bản sao' : lang === 'ja' ? 'コピー可' : 'Copy accepted';
        case 'presentation_only':
          return lang === 'vi' ? 'Xuất trình gốc' : lang === 'ja' ? '窓口提示' : 'Present original';
        default:
          return lang === 'vi' ? 'Bản gốc' : lang === 'ja' ? '原本' : 'Original';
      }
    },
  };

  return (
    <StandardToolLayout
      title={t.title[lang] || t.title.vi}
      description={t.subtitle[lang] || t.subtitle.vi}
      iconName="FileSearch"
      activeTab="calculator"
      showLayoutToggle={false}
    >
      <div className="space-y-8 max-w-5xl mx-auto">
        {/* 1. Intent Quick Selector */}
        <section className="bg-surface-container-low border border-outline-variant rounded-2xl p-6 shadow-sm">
          <h2 className="text-lg font-bold text-on-surface mb-4 flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-primary" />
            {t.intentsTitle[lang] || t.intentsTitle.vi}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {availableIntents.map((intent) => {
              const isSelected = selectedIntentId === intent.intentId;
              return (
                <button
                  key={intent.intentId}
                  type="button"
                  onClick={() => handleSelectIntent(intent)}
                  className={`text-left p-4 rounded-xl border transition-all flex flex-col justify-between ${
                    isSelected
                      ? 'bg-primary/10 border-primary text-primary font-semibold shadow-sm'
                      : 'bg-surface border-outline-variant/60 text-on-surface hover:border-primary/40 hover:bg-surface-container-high'
                  }`}
                >
                  <span className="text-sm">
                    {intent.labelI18n[lang] || intent.labelI18n.vi}
                  </span>
                  {isSelected && (
                    <span className="mt-2 text-xs text-primary flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Đang chọn
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Procedure Dropdown Alternative */}
          <div className="mt-5 pt-4 border-t border-outline-variant/60 flex flex-wrap items-center justify-between gap-3">
            <label className="text-xs font-semibold text-on-surface-variant flex items-center gap-2">
              <Filter className="w-3.5 h-3.5" />
              {t.selectProcedure[lang] || t.selectProcedure.vi}:
            </label>
            <select
              value={selectedProcedureId}
              onChange={(e) => handleSelectProcedure(e.target.value)}
              className="bg-surface border border-outline-variant rounded-lg px-3 py-1.5 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
            >
              {allProcedures.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.titleJa} ({p.titleI18n[lang] || p.titleI18n.vi})
                </option>
              ))}
            </select>
          </div>
        </section>

        {/* 2. Procedure Info & Progress Banner */}
        {finderResult && (
          <section className="bg-surface-container border border-outline-variant rounded-2xl p-6 shadow-sm">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div>
                <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold bg-secondary/15 text-secondary mb-2">
                  {finderResult.procedure.domain.toUpperCase()}
                </span>
                <h3 className="text-xl font-bold text-on-surface">
                  {finderResult.procedure.titleJa}
                </h3>
                <p className="text-sm text-on-surface-variant mt-1">
                  {finderResult.procedure.titleI18n[lang] || finderResult.procedure.titleI18n.vi}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 print:hidden">
                <button
                  type="button"
                  onClick={handleReset}
                  className="px-3 py-2 text-xs font-medium text-on-surface-variant hover:text-on-surface bg-surface border border-outline-variant rounded-lg flex items-center gap-1.5"
                  title="Đặt lại danh sách"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Đặt lại
                </button>
                <button
                  type="button"
                  onClick={handlePrint}
                  className="px-3 py-2 text-xs font-medium text-on-primary bg-primary rounded-lg flex items-center gap-1.5 hover:bg-primary/90"
                >
                  <Printer className="w-3.5 h-3.5" />
                  In checklist
                </button>
              </div>
            </div>

            {/* Statutory Details */}
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-outline-variant/60 text-sm">
              <div className="bg-surface/60 rounded-xl p-3 border border-outline-variant/40">
                <span className="text-xs font-semibold text-on-surface-variant flex items-center gap-1.5">
                  <Building2 className="w-4 h-4 text-primary" />
                  {t.authorityTitle[lang] || t.authorityTitle.vi}:
                </span>
                <p className="mt-1 font-medium text-on-surface">
                  {finderResult.procedure.authority.nameJa}
                </p>
              </div>

              <div className="bg-surface/60 rounded-xl p-3 border border-outline-variant/40">
                <span className="text-xs font-semibold text-on-surface-variant flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-error" />
                  {t.deadlineNotice[lang] || t.deadlineNotice.vi}:
                </span>
                <p className="mt-1 font-medium text-on-surface">
                  {finderResult.procedure.statutoryDeadlineI18n[lang] ||
                    finderResult.procedure.statutoryDeadlineI18n.vi}
                </p>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="mt-6 pt-4 border-t border-outline-variant/60">
              <div className="flex justify-between items-center text-xs font-semibold mb-2">
                <span className="text-on-surface-variant">
                  {t.progressTitle[lang] || t.progressTitle.vi}:
                </span>
                <span className="text-primary">
                  {completedMandatory} / {totalMandatory} ({progressPercent}%)
                </span>
              </div>
              <div className="w-full bg-surface-container-highest rounded-full h-2.5 overflow-hidden">
                <div
                  className="bg-primary h-2.5 rounded-full transition-all duration-300"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          </section>
        )}

        {/* 3. Filter input */}
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t.searchPlaceholder[lang] || t.searchPlaceholder.vi}
            className="w-full bg-surface border border-outline-variant rounded-xl px-4 py-3 pl-11 text-sm text-on-surface placeholder:text-on-surface-variant/60 focus:outline-none focus:ring-2 focus:ring-primary shadow-sm"
          />
          <FileSearch className="w-5 h-5 text-on-surface-variant absolute left-3.5 top-3.5" />
        </div>

        {/* 4. Mandatory Documents Section */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-on-surface flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-error" />
              {t.mandatoryHeading[lang] || t.mandatoryHeading.vi}
              <span className="text-xs px-2 py-0.5 rounded-full bg-error/15 text-error font-semibold">
                {mandatoryList.length}
              </span>
            </h3>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {mandatoryList.map((item) => {
              const isChecked = Boolean(checkedDocs[item.id]);
              return (
                <div
                  key={item.id}
                  className={`p-5 rounded-2xl border transition-all ${
                    isChecked
                      ? 'bg-surface-container-low border-outline-variant/40 opacity-75'
                      : 'bg-surface border-outline-variant hover:border-primary/50 shadow-sm'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <button
                      type="button"
                      onClick={() => toggleDoc(item.id)}
                      className={`mt-1 p-1 rounded-lg border transition-colors ${
                        isChecked
                          ? 'bg-primary border-primary text-on-primary'
                          : 'bg-surface border-outline-variant text-transparent hover:border-primary'
                      }`}
                    >
                      <CheckCircle2 className="w-4 h-4" />
                    </button>

                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="font-bold text-base text-on-surface">
                          {item.documentNameJa}
                        </h4>
                        <span className="text-xs text-on-surface-variant">
                          ({item.documentNameI18n[lang] || item.documentNameI18n.vi})
                        </span>
                      </div>

                      {/* Badges */}
                      <div className="mt-2.5 flex flex-wrap items-center gap-2 text-xs">
                        <span className="px-2.5 py-0.5 rounded-full bg-primary/10 text-primary font-medium border border-primary/20">
                          {t.originalOrCopy(item.originalOrCopy)}
                        </span>
                        <span className="px-2.5 py-0.5 rounded-full bg-surface-container-highest text-on-surface-variant font-medium">
                          {t.freshnessBadge(item.maxAgeMonths)}
                        </span>
                        {item.fiscalYearRule && item.fiscalYearRule !== 'none' && (
                          <span className="px-2.5 py-0.5 rounded-full bg-secondary/10 text-secondary font-medium">
                            {item.fiscalYearRule === 'past_5_years'
                              ? '5 năm gần nhất'
                              : 'Năm gần nhất'}
                          </span>
                        )}
                      </div>

                      {/* Condition & Caution summary */}
                      {item.conditionSummaryI18n && (
                        <p className="mt-2 text-xs text-on-surface-variant bg-surface-container-low p-2 rounded-lg border border-outline-variant/40">
                          {item.conditionSummaryI18n[lang] || item.conditionSummaryI18n.vi}
                        </p>
                      )}

                      {item.prohibitedFieldsJa && item.prohibitedFieldsJa.length > 0 && (
                        <div className="mt-2 text-xs text-error font-medium flex items-center gap-1.5">
                          <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                          <span>{item.prohibitedFieldsJa.join(' / ')}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* 5. Conditional Documents Section */}
        {conditionalList.length > 0 && (
          <section className="space-y-4 pt-4 border-t border-outline-variant/60">
            <h3 className="text-lg font-bold text-on-surface flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-warning" />
              {t.conditionalHeading[lang] || t.conditionalHeading.vi}
              <span className="text-xs px-2 py-0.5 rounded-full bg-warning/15 text-warning font-semibold">
                {conditionalList.length}
              </span>
            </h3>

            <div className="grid grid-cols-1 gap-4">
              {conditionalList.map((item) => (
                <div
                  key={item.id}
                  className="p-5 rounded-2xl border border-outline-variant bg-surface-container-low/60 shadow-sm"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <h4 className="font-bold text-base text-on-surface">
                      {item.documentNameJa}
                    </h4>
                    <span className="text-xs text-on-surface-variant">
                      ({item.documentNameI18n[lang] || item.documentNameI18n.vi})
                    </span>
                  </div>

                  <div className="mt-2 text-xs text-on-surface-variant">
                    {item.conditionSummaryI18n && (
                      <p className="bg-surface p-2 rounded-lg border border-outline-variant/60">
                        {item.conditionSummaryI18n[lang] || item.conditionSummaryI18n.vi}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </StandardToolLayout>
  );
}

export default DocumentFinderView;

/**
 * @file ProcedureRequirementCheckerView.jsx
 * Interactive self-assessment tool measuring readiness across 3 dimensions:
 * 1. Procedure Prerequisites & Timing
 * 2. Documents Readiness & Freshness
 * 3. Submission Readiness & Fees
 * Built with StandardToolLayout, high-contrast dark/light mode tokens, WCAG 2.1 AA.
 */

import React, { useState, useMemo } from 'react';
import {
  ClipboardCheck,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Clock,
  Coins,
  Building2,
  FileCheck,
  Calendar,
  Layers,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';
import StandardToolLayout from '../shared/StandardToolLayout.jsx';
import { getAllProcedures } from '../../documents/resolvers/procedureRequirementResolver.js';
import {
  evaluateProcedureReadiness,
  READINESS_LEVELS,
} from '../../documents/checkers/procedureCheckerEngine.js';

export function ProcedureRequirementCheckerView({ lang = 'vi' }) {
  const allProcedures = useMemo(() => getAllProcedures(), []);
  const [selectedProcedureId, setSelectedProcedureId] = useState('procedure.residence-status-renewal');

  // Interactive user state
  const [isWithinFilingWindow, setIsWithinFilingWindow] = useState(true);
  const [preparedDocs, setPreparedDocs] = useState({});
  const [hasFeePrepared, setHasFeePrepared] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState('counter');

  // Handle document toggle
  const handleDocToggle = (reqId, checked) => {
    setPreparedDocs((prev) => ({
      ...prev,
      [reqId]: {
        ...(prev[reqId] || {}),
        hasDocument: checked,
        // Set default issue date to today if toggled on
        issueDate: prev[reqId]?.issueDate || new Date().toISOString().split('T')[0],
        isOriginal: prev[reqId]?.isOriginal ?? true,
      },
    }));
  };

  const handleIssueDateChange = (reqId, dateStr) => {
    setPreparedDocs((prev) => ({
      ...prev,
      [reqId]: {
        ...(prev[reqId] || {}),
        issueDate: dateStr,
      },
    }));
  };

  const handleOriginalToggle = (reqId, isOrig) => {
    setPreparedDocs((prev) => ({
      ...prev,
      [reqId]: {
        ...(prev[reqId] || {}),
        isOriginal: isOrig,
      },
    }));
  };

  // Run evaluation engine
  const evaluation = useMemo(() => {
    return evaluateProcedureReadiness({
      procedureId: selectedProcedureId,
      timingState: { isWithinFilingWindow },
      preparedDocs,
      submissionState: { selectedMethod, hasFeePrepared },
      referenceDate: new Date(),
    });
  }, [selectedProcedureId, isWithinFilingWindow, preparedDocs, selectedMethod, hasFeePrepared]);

  const t = {
    title: {
      ja: '手続き要件チェッカー',
      vi: 'Kiểm tra độ sẵn sàng hồ sơ thủ tục (Procedure Requirement Checker)',
      en: 'Procedure Readiness & Document Checker',
    },
    subtitle: {
      ja: '提出期限、必要書類の鮮度（有効期間）、提出準備の3つの観点から自己診断します。',
      vi: 'Tự đánh giá 3 chiều: Thời hạn nộp, độ tươi của giấy tờ (trong 3 tháng) và chuẩn bị lệ phí trước khi đi nộp.',
      en: 'Self-assess filing readiness across 3 dimensions: timing, document freshness, and submission preparation.',
    },
    selectProcedure: {
      ja: 'チェックしたい手続きを選択',
      vi: 'Chọn thủ tục bạn muốn kiểm tra hồ sơ',
      en: 'Select procedure to check',
    },
    dimension1Title: {
      ja: '1. 手続きの前提条件・提出時期',
      vi: '1. Thời điểm & Điều kiện tiếp nhận',
      en: '1. Timing & Prerequisites',
    },
    dimension2Title: {
      ja: '2. 必要書類の準備・有効期限チェック',
      vi: '2. Kiểm tra giấy tờ & Độ tươi (Freshness)',
      en: '2. Documents Readiness & Freshness',
    },
    dimension3Title: {
      ja: '3. 提出方法と手数料の準備',
      vi: '3. Phương thức nộp & Chuẩn bị lệ phí',
      en: '3. Submission Method & Fees',
    },
    gapsHeading: {
      ja: '不足している項目・要改善点',
      vi: 'Các điểm còn thiếu cần bổ sung trước khi đi nộp',
      en: 'Identified Gaps & Action Items',
    },
  };

  return (
    <StandardToolLayout
      title={t.title[lang] || t.title.vi}
      description={t.subtitle[lang] || t.subtitle.vi}
      iconName="ClipboardCheck"
      activeTab="calculator"
      showLayoutToggle={false}
    >
      <div className="space-y-8 max-w-5xl mx-auto">
        {/* 1. Procedure Selector */}
        <section className="bg-surface-container-low border border-outline-variant rounded-2xl p-6 shadow-sm">
          <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wide mb-2">
            {t.selectProcedure[lang] || t.selectProcedure.vi}:
          </label>
          <select
            value={selectedProcedureId}
            onChange={(e) => {
              setSelectedProcedureId(e.target.value);
              setPreparedDocs({});
            }}
            className="w-full bg-surface border border-outline-variant rounded-xl px-4 py-3 text-sm text-on-surface font-semibold focus:outline-none focus:ring-2 focus:ring-primary shadow-sm"
          >
            {allProcedures.map((proc) => (
              <option key={proc.id} value={proc.id}>
                {proc.titleJa} — ({proc.titleI18n[lang] || proc.titleI18n.vi})
              </option>
            ))}
          </select>
        </section>

        {/* 2. Readiness Score Summary Card */}
        {evaluation && (
          <section className="bg-surface-container border border-outline-variant rounded-2xl p-6 shadow-sm">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-1">
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-primary/10 text-primary">
                  {evaluation.procedure.domain.toUpperCase()}
                </span>
                <h3 className="text-xl font-bold text-on-surface">
                  {evaluation.procedure.titleJa}
                </h3>
                <p className="text-xs text-on-surface-variant">
                  {evaluation.procedure.authority.nameJa}
                </p>
              </div>

              {/* Score Indicator */}
              <div className="flex items-center gap-4 bg-surface p-4 rounded-xl border border-outline-variant">
                <div className="text-right">
                  <span className="text-xs font-semibold text-on-surface-variant block">
                    Điểm sẵn sàng hồ sơ:
                  </span>
                  <span
                    className={`text-2xl font-black ${
                      evaluation.overallLevel === READINESS_LEVELS.READY
                        ? 'text-secondary'
                        : evaluation.overallLevel === READINESS_LEVELS.ACTION_REQUIRED
                        ? 'text-warning-strong'
                        : 'text-error'
                    }`}
                  >
                    {evaluation.overallScore} / 100
                  </span>
                </div>

                <div
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold ${
                    evaluation.overallLevel === READINESS_LEVELS.READY
                      ? 'bg-secondary/15 text-secondary'
                      : evaluation.overallLevel === READINESS_LEVELS.ACTION_REQUIRED
                      ? 'bg-warning/15 text-warning-strong'
                      : 'bg-error/15 text-error'
                  }`}
                >
                  {evaluation.overallLevel === READINESS_LEVELS.READY && '✓ Sẵn sàng nộp'}
                  {evaluation.overallLevel === READINESS_LEVELS.ACTION_REQUIRED && '⚠️ Cần bổ sung'}
                  {evaluation.overallLevel === READINESS_LEVELS.NOT_READY && '✕ Chưa thể nộp'}
                </div>
              </div>
            </div>

            {/* Dimension Breakdown Pills */}
            <div className="mt-6 pt-4 border-t border-outline-variant/60 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="bg-surface/60 p-3 rounded-lg border border-outline-variant/40 flex items-center justify-between">
                <span className="text-on-surface-variant">1. Thời điểm nộp:</span>
                <span
                  className={`font-bold ${
                    evaluation.timing.status === 'pass' ? 'text-secondary' : 'text-error'
                  }`}
                >
                  {evaluation.timing.status === 'pass' ? 'Hợp lệ' : 'Ngoài hạn'}
                </span>
              </div>

              <div className="bg-surface/60 p-3 rounded-lg border border-outline-variant/40 flex items-center justify-between">
                <span className="text-on-surface-variant">2. Giấy tờ bắt buộc:</span>
                <span className="font-bold text-primary">
                  {evaluation.documents.mandatoryReadyCount} / {evaluation.documents.mandatoryTotalCount} ({evaluation.documents.score}%)
                </span>
              </div>

              <div className="bg-surface/60 p-3 rounded-lg border border-outline-variant/40 flex items-center justify-between">
                <span className="text-on-surface-variant">3. Chuẩn bị lệ phí:</span>
                <span
                  className={`font-bold ${
                    evaluation.submission.feePrepared ? 'text-secondary' : 'text-warning-strong'
                  }`}
                >
                  {evaluation.submission.feePrepared ? 'Đã chuẩn bị' : 'Chưa chuẩn bị'}
                </span>
              </div>
            </div>
          </section>
        )}

        {/* 3. Dimension 1: Timing */}
        <section className="bg-surface-container-low border border-outline-variant rounded-2xl p-6 shadow-sm space-y-3">
          <h4 className="font-bold text-sm text-on-surface flex items-center gap-2">
            <Clock className="w-4 h-4 text-primary" />
            {t.dimension1Title[lang] || t.dimension1Title.vi}
          </h4>

          <div className="bg-surface p-4 rounded-xl border border-outline-variant flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div>
              <p className="font-bold text-on-surface">
                {evaluation?.procedure.triggerEventI18n[lang] || evaluation?.procedure.triggerEventI18n.vi}
              </p>
              <p className="text-on-surface-variant mt-0.5">
                Hạn luật định: {evaluation?.procedure.statutoryDeadlineI18n[lang] || evaluation?.procedure.statutoryDeadlineI18n.vi}
              </p>
            </div>

            <label className="flex items-center gap-2 cursor-pointer font-semibold text-on-surface">
              <input
                type="checkbox"
                checked={isWithinFilingWindow}
                onChange={(e) => setIsWithinFilingWindow(e.target.checked)}
                className="w-4 h-4 rounded text-primary"
              />
              <span>Đang trong thời gian nộp hợp lệ</span>
            </label>
          </div>
        </section>

        {/* 4. Dimension 2: Documents Checklist & Freshness Validation */}
        <section className="bg-surface-container-low border border-outline-variant rounded-2xl p-6 shadow-sm space-y-4">
          <h4 className="font-bold text-sm text-on-surface flex items-center gap-2">
            <FileCheck className="w-4 h-4 text-primary" />
            {t.dimension2Title[lang] || t.dimension2Title.vi}
          </h4>

          <div className="space-y-3">
            {evaluation?.documents.evaluatedDocs.map((doc) => {
              const userDoc = preparedDocs[doc.requirementId] || {};
              const isChecked = Boolean(userDoc.hasDocument);

              return (
                <div
                  key={doc.requirementId}
                  className={`p-4 rounded-xl border transition-all ${
                    isChecked
                      ? doc.status === 'ready'
                        ? 'bg-surface border-secondary/40'
                        : 'bg-surface border-error/40'
                      : 'bg-surface/60 border-outline-variant'
                  }`}
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={(e) => handleDocToggle(doc.requirementId, e.target.checked)}
                        className="w-4 h-4 rounded text-primary mt-1"
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-on-surface">
                            {doc.documentNameJa}
                          </span>
                          <span className="text-xs text-on-surface-variant">
                            ({doc.documentNameI18n?.[lang] || doc.documentNameI18n?.vi})
                          </span>
                        </div>

                        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs">
                          <span className="text-on-surface-variant">
                            Yêu cầu:{' '}
                            {doc.maxAgeMonths ? `Trong vòng ${doc.maxAgeMonths} tháng` : 'Không hạn chế ngày'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Interactive Freshness & Original controls if checked */}
                    {isChecked && (
                      <div className="flex flex-wrap items-center gap-3 text-xs pl-7 md:pl-0">
                        {doc.maxAgeMonths !== null && (
                          <div className="flex items-center gap-1.5">
                            <label className="text-on-surface-variant font-medium">
                              Ngày cấp in trên giấy:
                            </label>
                            <input
                              type="date"
                              value={userDoc.issueDate || ''}
                              onChange={(e) =>
                                handleIssueDateChange(doc.requirementId, e.target.value)
                              }
                              className="bg-surface border border-outline-variant rounded px-2 py-1 text-xs text-on-surface"
                            />
                          </div>
                        )}

                        <div className="flex items-center gap-2">
                          <label className="flex items-center gap-1 cursor-pointer">
                            <input
                              type="radio"
                              name={`orig_${doc.requirementId}`}
                              checked={userDoc.isOriginal ?? true}
                              onChange={() => handleOriginalToggle(doc.requirementId, true)}
                              className="text-primary"
                            />
                            <span>Bản gốc</span>
                          </label>
                          <label className="flex items-center gap-1 cursor-pointer">
                            <input
                              type="radio"
                              name={`orig_${doc.requirementId}`}
                              checked={userDoc.isOriginal === false}
                              onChange={() => handleOriginalToggle(doc.requirementId, false)}
                              className="text-primary"
                            />
                            <span>Bản sao</span>
                          </label>
                        </div>

                        {/* Status Badge */}
                        <div className="ml-auto">
                          {doc.status === 'ready' && (
                            <span className="px-2 py-0.5 rounded bg-secondary/15 text-secondary font-bold">
                              ✓ Hợp lệ
                            </span>
                          )}
                          {doc.status === 'expired' && (
                            <span className="px-2 py-0.5 rounded bg-error/15 text-error font-bold">
                              ✕ Đã quá hạn ({doc.freshness.ageMonths} tháng)
                            </span>
                          )}
                          {doc.status === 'copy_not_allowed' && (
                            <span className="px-2 py-0.5 rounded bg-error/15 text-error font-bold">
                              ✕ Cần bản gốc
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* 5. Dimension 3: Submission & Fee Readiness */}
        <section className="bg-surface-container-low border border-outline-variant rounded-2xl p-6 shadow-sm space-y-4">
          <h4 className="font-bold text-sm text-on-surface flex items-center gap-2">
            <Coins className="w-4 h-4 text-primary" />
            {t.dimension3Title[lang] || t.dimension3Title.vi}
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="bg-surface p-4 rounded-xl border border-outline-variant space-y-2">
              <label className="font-bold text-on-surface block">Hình thức nộp hồ sơ:</label>
              <select
                value={selectedMethod}
                onChange={(e) => setSelectedMethod(e.target.value)}
                className="w-full bg-surface-container-low border border-outline-variant rounded-lg p-2 text-on-surface font-medium"
              >
                {(evaluation?.procedure.submissionMethods || ['counter']).map((m) => (
                  <option key={m} value={m}>
                    {m === 'counter' && 'Nộp trực tiếp tại quầy cơ quan'}
                    {m === 'online_portal' && 'Nộp trực tuyến qua cổng điện tử'}
                    {m === 'mail' && 'Gửi bưu điện'}
                    {m === 'myna_portal' && 'Nộp qua MynaPortal (áp dụng trợ cấp)'}
                  </option>
                ))}
              </select>
            </div>

            <div className="bg-surface p-4 rounded-xl border border-outline-variant space-y-2">
              <label className="font-bold text-on-surface block">Chuẩn bị lệ phí:</label>
              <p className="text-on-surface-variant">
                {evaluation?.procedure.feeRules?.feeNoteI18n[lang] ||
                  evaluation?.procedure.feeRules?.feeNoteI18n.vi}
              </p>
              {evaluation?.submission.isFeeRequired && (
                <label className="flex items-center gap-2 cursor-pointer font-bold text-on-surface pt-1">
                  <input
                    type="checkbox"
                    checked={hasFeePrepared}
                    onChange={(e) => setHasFeePrepared(e.target.checked)}
                    className="w-4 h-4 rounded text-primary"
                  />
                  <span>Đã chuẩn bị tiền / tem {evaluation.submission.feeAmountJpy}円</span>
                </label>
              )}
            </div>
          </div>
        </section>

        {/* 6. Actionable Gaps Summary */}
        {evaluation && evaluation.gaps.length > 0 && (
          <section className="bg-error/5 border border-error/25 rounded-2xl p-6 shadow-sm space-y-3">
            <h4 className="font-bold text-sm text-error flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              {t.gapsHeading[lang] || t.gapsHeading.vi} ({evaluation.gaps.length}):
            </h4>

            <div className="space-y-2">
              {evaluation.gaps.map((gap, idx) => (
                <div
                  key={idx}
                  className="bg-surface p-3 rounded-xl border border-error/20 flex items-start gap-2.5 text-xs text-on-surface"
                >
                  <AlertCircle className="w-4 h-4 text-error flex-shrink-0 mt-0.5" />
                  <span>{gap.messageI18n[lang] || gap.messageI18n.vi}</span>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </StandardToolLayout>
  );
}

export default ProcedureRequirementCheckerView;

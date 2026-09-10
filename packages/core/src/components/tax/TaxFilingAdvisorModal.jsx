/**
 * @file packages/core/src/components/tax/TaxFilingAdvisorModal.jsx
 * @description Modal Chẩn đoán nhu cầu quyết toán thuế (確定申告判定).
 * Giải đáp chính xác "Tôi có cần nộp quyết toán thuế không?", cảnh báo quy tắc 20 vạn yên việc phụ,
 * và thời hạn nộp hồ sơ e-Tax.
 */

import React from 'react';
import {
  X,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  ExternalLink,
  Info,
  HelpCircle,
} from 'lucide-react';

export default function TaxFilingAdvisorModal({
  filingNecessity,
  onClose,
  lang = 'ja',
  t,
}) {
  if (!filingNecessity) return null;

  const {
    status,
    statusLabel_ja,
    statusLabel_vi,
    statusLabel_en,
    reasons_ja = [],
    reasons_vi = [],
    reasons_en = [],
    residentTaxNote,
  } = filingNecessity;

  const currentLabel =
    lang === 'ja' ? statusLabel_ja : lang === 'vi' ? statusLabel_vi : statusLabel_en;
  const currentReasons =
    lang === 'ja' ? reasons_ja : lang === 'vi' ? reasons_vi : reasons_en;

  const isRequired = status === 'REQUIRED';
  const isConditional = status === 'CONDITIONAL';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="bg-surface border border-border-subtle rounded-2xl w-full max-w-xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-border-subtle flex items-start justify-between bg-surface-container-low">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant font-mono">
              確定申告要否 診断結果 • TAX FILING DIAGNOSIS
            </span>
            <h2 className="text-base sm:text-lg font-black text-on-surface mt-0.5">
              {lang === 'ja'
                ? '確定申告の要否判定結果'
                : lang === 'vi'
                ? 'Kết quả chẩn đoán: Có cần nộp quyết toán thuế?'
                : 'Tax Return Filing Diagnostic Result'}
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label={t?.closeDrawer || 'Đóng (Close)'}
            className="p-1.5 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs sm:text-sm flex-1">
          {/* Main Verdict Card */}
          <div
            className={`p-4 rounded-xl border flex items-start gap-3 ${
              isRequired
                ? 'bg-rose-50/60 dark:bg-rose-950/20 border-rose-500/40 text-rose-900 dark:text-rose-200'
                : isConditional
                ? 'bg-blue-50/60 dark:bg-blue-950/20 border-blue-500/40 text-blue-900 dark:text-blue-200'
                : 'bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-500/40 text-emerald-900 dark:text-emerald-200'
            }`}
          >
            {isRequired ? (
              <AlertTriangle className="w-6 h-6 text-rose-500 shrink-0 mt-0.5" />
            ) : isConditional ? (
              <Info className="w-6 h-6 text-blue-500 shrink-0 mt-0.5" />
            ) : (
              <CheckCircle2 className="w-6 h-6 text-emerald-500 shrink-0 mt-0.5" />
            )}

            <div>
              <div className="text-xs font-bold uppercase tracking-wide opacity-80 mb-0.5">
                {lang === 'ja' ? '診断判定' : lang === 'vi' ? 'Kết luận' : 'Status'}
              </div>
              <div className="text-base font-black tracking-tight mb-1">
                {currentLabel}
              </div>
              <ul className="space-y-1.5 mt-2">
                {currentReasons.map((reason, idx) => (
                  <li key={idx} className="flex items-start gap-2 leading-relaxed">
                    <span className="text-rose-500 font-bold">•</span>
                    <span>{reason}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* CRITICAL WARNING: Resident Tax Notice (when side profit <= 200k) */}
          {residentTaxNote && (
            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-900 dark:text-amber-200 space-y-1.5">
              <div className="flex items-center gap-2 font-bold text-amber-800 dark:text-amber-300">
                <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
                <span>
                  {residentTaxNote[`title_${lang}`] || residentTaxNote.title_ja}
                </span>
              </div>
              <p className="text-xs leading-relaxed opacity-95">
                {residentTaxNote[`desc_${lang}`] || residentTaxNote.desc_ja}
              </p>
            </div>
          )}

          {/* Key Deadlines & Guidelines */}
          <div className="p-4 rounded-xl bg-surface-container-low border border-border-subtle space-y-2">
            <div className="flex items-center gap-2 font-bold text-on-surface text-xs">
              <Calendar className="w-4 h-4 text-rose-500" />
              <span>
                {lang === 'ja' ? '確定申告のスケジュール & 提出期間' : lang === 'vi' ? 'Lịch trình & Thời hạn nộp quyết toán thuế' : 'Filing Timeline & Submission Windows'}
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-on-surface-variant">
              <div className="p-2.5 rounded-lg bg-surface border border-border-subtle">
                <span className="font-semibold text-on-surface block">
                  {lang === 'ja' ? '所得税（復興税）' : lang === 'vi' ? 'Thuế thu nhập (所得税)' : 'Income Tax'}:
                </span>
                <span className="font-mono text-rose-700 dark:text-rose-300 font-bold">
                  2月16日 〜 3月15日
                </span>
                <p className="text-[11px] mt-0.5">
                  {lang === 'ja' ? '税務署またはe-Tax' : lang === 'vi' ? 'Nộp tại Sở thuế hoặc e-Tax' : 'Via Tax Office or e-Tax'}
                </p>
              </div>

              <div className="p-2.5 rounded-lg bg-surface border border-border-subtle">
                <span className="font-semibold text-on-surface block">
                  {lang === 'ja' ? '消費税（個人事業者）' : lang === 'vi' ? 'Thuế tiêu thụ (Cá nhân)' : 'Consumption Tax'}:
                </span>
                <span className="font-mono text-rose-700 dark:text-rose-300 font-bold">
                  翌年3月31日まで
                </span>
                <p className="text-[11px] mt-0.5">
                  {lang === 'ja' ? 'インボイス登録者必須' : lang === 'vi' ? 'Hạn cuối 31/3 năm sau' : 'Until March 31'}
                </p>
              </div>
            </div>
          </div>

          {/* Official NTA links */}
          <div>
            <span className="text-[11px] font-semibold text-on-surface-variant block mb-2">
              {lang === 'ja' ? '国税庁 公式作成コーナー:' : lang === 'vi' ? 'Cổng nộp tờ khai chính thức của Quốc thuế Nhật Bản (NTA):' : 'Official National Tax Agency Preparation Services:'}
            </span>
            <div className="space-y-1.5">
              <a
                href="https://www.keisan.nta.go.jp/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between p-2.5 rounded-xl bg-surface-container-low hover:bg-surface-container-high border border-border-subtle transition-colors text-xs font-medium text-blue-600 dark:text-blue-400 group"
              >
                <span>国税庁: 確定申告書等作成コーナー (NTA Preparation Corner)</span>
                <ExternalLink className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </a>
              <a
                href="https://www.e-tax.nta.go.jp/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between p-2.5 rounded-xl bg-surface-container-low hover:bg-surface-container-high border border-border-subtle transition-colors text-xs font-medium text-blue-600 dark:text-blue-400 group"
              >
                <span>国税電子申告・納税システム (e-Tax Portal)</span>
                <ExternalLink className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </a>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border-subtle bg-surface-container-low flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-surface-container-high hover:bg-surface-container-highest text-on-surface transition-colors"
          >
            {t?.closeDrawer || 'Đóng (閉じる)'}
          </button>
        </div>
      </div>
    </div>
  );
}

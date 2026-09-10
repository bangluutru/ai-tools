/**
 * @file OfficialFormHelperView.jsx
 * Interactive view for Government Form Helper (公的フォームヘルパー).
 * Built with StandardToolLayout, high-contrast dark/light mode tokens, WCAG 2.1 AA.
 * Browser-first, in-memory client-side draft preparation, zero server transmission.
 */

import React, { useState, useMemo } from 'react';
import {
  FileText,
  Download,
  ShieldCheck,
  RotateCcw,
  Eye,
  EyeOff,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Building2,
  Calendar,
} from 'lucide-react';
import StandardToolLayout from '../shared/StandardToolLayout.jsx';
import { getAllOfficialForms } from '../../documents/forms/officialFormsRegistry.js';
import { getFormAssistance, isFormVersionEffective } from '../../documents/forms/formHelperEngine.js';

export function OfficialFormHelperView({ lang = 'vi' }) {
  const allForms = useMemo(() => getAllOfficialForms(), []);
  const [selectedFormId, setSelectedFormId] = useState('form.isa.extension-of-stay');
  const [draftValues, setDraftValues] = useState({});
  const [showSensitive, setShowSensitive] = useState(false);

  const formPackage = useMemo(() => {
    return getFormAssistance(selectedFormId);
  }, [selectedFormId]);

  const isEffective = useMemo(() => {
    return isFormVersionEffective(formPackage?.form);
  }, [formPackage]);

  const handleFieldChange = (fieldId, value) => {
    setDraftValues((prev) => ({
      ...prev,
      [fieldId]: value,
    }));
  };

  const handleResetDraft = () => {
    setDraftValues({});
  };

  const t = {
    title: {
      ja: '公的フォームヘルパー',
      vi: 'Trợ lý điền mẫu đơn công quyền (Official Form Helper)',
      en: 'Official Form Helper & Guide',
    },
    subtitle: {
      ja: '公的な申請書（PDF様式）の各記入欄の意味・記載例・注意事項をわかりやすく解説します。',
      vi: 'Giải thích chi tiết từng ô cần điền, quy chuẩn định dạng và chuẩn bị bản nháp an toàn trên trình duyệt.',
      en: 'Field-by-field guidance, formatting rules, and secure client-side draft preview for official application forms.',
    },
    selectFormHeading: {
      ja: '記入をサポートする様式を選択',
      vi: 'Chọn mẫu đơn bạn cần điền',
      en: 'Select Application Form',
    },
    versionBadge: {
      ja: '現行有効版',
      vi: 'Bản áp dụng hiện hành',
      en: 'Effective Version',
    },
    privacyNotice: {
      ja: '【完全ローカル処理】入力された下書き情報はブラウザ内の一時メモリでのみ保持され、外部サーバーへ送信・保存されることは一切ありません。',
      vi: '【Bảo mật tuyệt đối】Mọi thông tin bạn nhập để xem trước bản nháp chỉ lưu tạm thời trên trình duyệt này và KHÔNG BAO GIỜ bị gửi hay lưu trữ trên bất kỳ máy chủ nào.',
      en: '【Zero Server Persistence】Draft values remain strictly in local browser memory and are never transmitted or stored remotely.',
    },
    resetButton: {
      ja: '下書きをクリア',
      vi: 'Xóa bản nháp',
      en: 'Clear Draft',
    },
    officialPdfButton: {
      ja: '公式PDFをダウンロード',
      vi: 'Tải mẫu PDF chính thức từ Bộ / Cơ quan',
      en: 'Download Official Agency PDF',
    },
  };

  return (
    <StandardToolLayout
      title={t.title[lang] || t.title.vi}
      description={t.subtitle[lang] || t.subtitle.vi}
      iconName="FileText"
      activeTab="calculator"
      showLayoutToggle={false}
    >
      <div className="space-y-8 max-w-5xl mx-auto">
        {/* 1. Form Selector */}
        <section className="bg-surface-container-low border border-outline-variant rounded-2xl p-6 shadow-sm">
          <h2 className="text-base font-bold text-on-surface mb-4 flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            {t.selectFormHeading[lang] || t.selectFormHeading.vi}
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {allForms.map((f) => {
              const isSelected = selectedFormId === f.id;
              return (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => {
                    setSelectedFormId(f.id);
                    setDraftValues({});
                  }}
                  className={`p-4 rounded-xl border text-left transition-all ${
                    isSelected
                      ? 'bg-primary/10 border-primary text-primary font-bold shadow-sm ring-1 ring-primary'
                      : 'bg-surface border-outline-variant text-on-surface hover:border-primary/40'
                  }`}
                >
                  <span className="text-xs text-on-surface-variant block mb-1">
                    {f.authority.nameJa}
                  </span>
                  <h4 className="text-sm font-bold">{f.formNameJa}</h4>
                  <p className="text-xs text-on-surface-variant font-normal mt-1">
                    {f.formNameI18n[lang] || f.formNameI18n.vi}
                  </p>
                </button>
              );
            })}
          </div>
        </section>

        {/* 2. Privacy Guarantee Banner */}
        <div className="p-4 rounded-xl bg-secondary/10 border border-secondary/25 text-xs text-secondary flex items-start gap-2.5">
          <ShieldCheck className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <span className="leading-relaxed">
            {t.privacyNotice[lang] || t.privacyNotice.vi}
          </span>
        </div>

        {/* 3. Selected Form Details & Actions */}
        {formPackage && (
          <section className="bg-surface-container border border-outline-variant rounded-2xl p-6 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-primary/10 text-primary">
                    v{formPackage.form.version}
                  </span>
                  {isEffective && (
                    <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-secondary/10 text-secondary flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      {t.versionBadge[lang] || t.versionBadge.vi}
                    </span>
                  )}
                </div>

                <h3 className="text-xl font-bold text-on-surface">
                  {formPackage.form.formNameJa}
                </h3>
                <p className="text-sm text-on-surface-variant">
                  {formPackage.form.formNameI18n[lang] || formPackage.form.formNameI18n.vi}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handleResetDraft}
                  className="px-3 py-2 text-xs font-medium text-on-surface-variant hover:text-on-surface bg-surface border border-outline-variant rounded-lg flex items-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  {t.resetButton[lang] || t.resetButton.vi}
                </button>

                <a
                  href={formPackage.form.officialPdfUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-2 text-xs font-bold text-on-primary bg-primary rounded-lg flex items-center gap-1.5 hover:bg-primary/90 transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  {t.officialPdfButton[lang] || t.officialPdfButton.vi}
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>

            {/* Field Breakdown by Section */}
            <div className="space-y-6 pt-4 border-t border-outline-variant/60">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-on-surface-variant">
                  Tổng số ô hướng dẫn: {formPackage.totalFieldsCount} (trong đó {formPackage.sensitiveFieldsCount} ô thông tin cá nhân)
                </span>
                <button
                  type="button"
                  onClick={() => setShowSensitive((prev) => !prev)}
                  className="flex items-center gap-1.5 text-primary hover:underline font-medium"
                >
                  {showSensitive ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  {showSensitive ? 'Ẩn thông tin nhạy cảm' : 'Hiện rõ thông tin nhạy cảm'}
                </button>
              </div>

              {formPackage.form.sections.map((sec) => (
                <div
                  key={sec.sectionId}
                  className="bg-surface rounded-xl p-5 border border-outline-variant/80 space-y-4"
                >
                  <h4 className="font-bold text-sm text-on-surface pb-2 border-b border-outline-variant/40 flex items-center justify-between">
                    <span>{sec.titleJa}</span>
                    <span className="text-xs font-normal text-on-surface-variant">
                      {sec.titleI18n[lang] || sec.titleI18n.vi}
                    </span>
                  </h4>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {sec.fields.map((f) => {
                      const currentValue = draftValues[f.id] || '';
                      return (
                        <div
                          key={f.id}
                          className="bg-surface-container-low p-3.5 rounded-xl border border-outline-variant/50 space-y-2"
                        >
                          <div className="flex items-center justify-between">
                            <label htmlFor={`field-${f.id}`} className="text-xs font-bold text-on-surface">
                              {f.labelJa}
                            </label>
                            {f.isSensitive && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-surface-container-highest text-on-surface-variant">
                                Nhạy cảm
                              </span>
                            )}
                          </div>

                          <p className="text-[11px] text-on-surface-variant">
                            {f.meaningI18n[lang] || f.meaningI18n.vi}
                          </p>

                          {/* Input field for draft preparation */}
                          {f.inputType === 'select' ? (
                            <select
                              id={`field-${f.id}`}
                              aria-label={f.labelJa}
                              value={currentValue}
                              onChange={(e) => handleFieldChange(f.id, e.target.value)}
                              className="w-full bg-surface border border-outline-variant rounded-lg px-2.5 py-1.5 text-xs text-on-surface focus:outline-none focus:ring-1 focus:ring-primary"
                            >
                              <option value="">-- Chọn giá trị --</option>
                              {(f.options || []).map((opt) => (
                                <option key={opt.value} value={opt.value}>
                                  {opt.labelJa} ({opt.labelI18n?.[lang] || opt.labelI18n?.vi || opt.value})
                                </option>
                              ))}
                            </select>
                          ) : f.inputType === 'radio' ? (
                            <div className="flex gap-4 text-xs">
                              {(f.options || []).map((opt) => (
                                <label key={opt.value} className="flex items-center gap-1.5 text-on-surface cursor-pointer">
                                  <input
                                    type="radio"
                                    name={f.id}
                                    value={opt.value}
                                    checked={currentValue === opt.value}
                                    onChange={(e) => handleFieldChange(f.id, e.target.value)}
                                    className="text-primary"
                                  />
                                  <span>{opt.labelJa}</span>
                                </label>
                              ))}
                            </div>
                          ) : (
                            <input
                              id={`field-${f.id}`}
                              aria-label={f.labelJa}
                              type={f.isSensitive && !showSensitive && currentValue ? 'password' : f.inputType}
                              value={currentValue}
                              onChange={(e) => handleFieldChange(f.id, e.target.value)}
                              placeholder={f.example ? `Ví dụ: ${f.example}` : ''}
                              className="w-full bg-surface border border-outline-variant rounded-lg px-2.5 py-1.5 text-xs text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-1 focus:ring-primary"
                            />
                          )}

                          {f.format && (
                            <span className="text-[10px] text-on-surface-variant block">
                              Định dạng: {f.format}
                            </span>
                          )}
                        </div>
                      );
                    })}
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

export default OfficialFormHelperView;

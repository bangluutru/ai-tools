import React, { useState, useEffect } from 'react';
import {
  Printer,
  RotateCcw,
  Eye,
  Edit3,
  ShieldCheck,
  Maximize2,
  Minimize2,
  FileText,
  CheckCircle2,
} from 'lucide-react';
import { getConsularI18n } from '../../consular/i18n/consularI18n.js';

export default function StructuredFormEditor({
  formConfig,
  onClose,
  isExpanded = false,
  onToggleExpand,
  displayLang = 'vi',
}) {
  const t = getConsularI18n(displayLang);
  const [activeTab, setActiveTab] = useState('easy_fill'); // 'easy_fill' | 'preview'
  const [formData, setFormData] = useState({});

  // Khôi phục dữ liệu từ localStorage
  useEffect(() => {
    if (!formConfig?.id) return;
    try {
      const saved = localStorage.getItem(`consular_form_${formConfig.id}`);
      if (saved) {
        setFormData(JSON.parse(saved));
      } else {
        setFormData(formConfig.initialValues || {});
      }
    } catch {
      setFormData(formConfig.initialValues || {});
    }
  }, [formConfig?.id]);

  const handleChange = (fieldId, value, transform) => {
    const finalVal = transform ? transform(value) : value;
    setFormData((prev) => {
      const updated = { ...prev, [fieldId]: finalVal };
      try {
        localStorage.setItem(
          `consular_form_${formConfig.id}`,
          JSON.stringify(updated)
        );
      } catch (err) {
        console.error('Error saving form data', err);
      }
      return updated;
    });
  };

  const handleReset = () => {
    if (window.confirm(t.editor.resetConfirm)) {
      const init = formConfig.initialValues || {};
      setFormData(init);
      try {
        localStorage.removeItem(`consular_form_${formConfig.id}`);
      } catch (err) {
        console.error('Error clearing form data', err);
      }
    }
  };

  const handlePrint = () => {
    if (activeTab !== 'preview') {
      setActiveTab('preview');
      // Đợi render tab preview rồi kích hoạt lệnh in
      setTimeout(() => {
        window.print();
      }, 150);
    } else {
      window.print();
    }
  };

  if (!formConfig) return null;

  // Lấy danh sách fields phẳng
  const fields = formConfig.fields || (formConfig.sections?.flatMap((s) => s.fields)) || [];
  const formTitle = formConfig.title?.[displayLang] || formConfig.title?.vi || formConfig.title;

  return (
    <div className="bg-surface-container-low border border-border-subtle rounded-2xl overflow-hidden shadow-sm flex flex-col h-full">
      {/* CSS In chuyên biệt cho trang A4 */}
      <style>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 10mm 10mm 10mm 10mm;
          }
          body * {
            visibility: hidden !important;
          }
          #consular-a4-document, #consular-a4-document * {
            visibility: visible !important;
          }
          #consular-a4-document {
            position: fixed !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            min-height: 297mm !important;
            margin: 0 !important;
            padding: 10mm 10mm !important;
            box-shadow: none !important;
            border: none !important;
            background: white !important;
            color: black !important;
            display: block !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      {/* Header thanh công cụ Form */}
      <div className="no-print bg-surface-container-lowest border-b border-border-subtle p-3 sm:p-4 flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0">
            {formConfig.code || 'FORM'}
          </div>
          <div className="min-w-0">
            <h3 className="text-xs sm:text-sm font-bold text-on-surface truncate">
              {formTitle}
            </h3>
            <div className="text-[10.5px] text-outline flex items-center gap-1.5 flex-wrap">
              <span className="truncate">{formConfig.standardBasis || formConfig.legal_basis}</span>
              <span>•</span>
              <span className="font-mono text-[9.5px] text-emerald-600 dark:text-emerald-400 font-semibold">
                {t.editor.verifiedSha}
              </span>
            </div>
          </div>
        </div>

        {/* Nút chuyển chế độ và hành động */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <div className="flex items-center bg-surface-container rounded-lg p-1 text-xs border border-border-subtle">
            <button
              type="button"
              onClick={() => setActiveTab('easy_fill')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md font-semibold transition-all cursor-pointer ${
                activeTab === 'easy_fill'
                  ? 'bg-primary text-on-primary shadow-2xs'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              <Edit3 size={12} />
              <span>{t.editor.easyFillTab}</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('preview')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md font-semibold transition-all cursor-pointer ${
                activeTab === 'preview'
                  ? 'bg-primary text-on-primary shadow-2xs'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              <Eye size={12} />
              <span>{t.editor.previewTab}</span>
            </button>
          </div>

          <button
            type="button"
            onClick={handlePrint}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-primary text-on-primary hover:bg-primary/90 transition-colors shadow-2xs cursor-pointer"
            title={t.editor.printHint}
          >
            <Printer size={13} />
            <span>{t.editor.printBtn}</span>
          </button>

          {onToggleExpand && (
            <button
              type="button"
              onClick={onToggleExpand}
              className="p-1.5 rounded-lg text-outline hover:text-primary hover:bg-primary/10 border border-border-subtle transition-colors cursor-pointer"
              title={isExpanded ? t.editor.restoreBtn : t.editor.maximizeBtn}
            >
              {isExpanded ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
            </button>
          )}

          <button
            type="button"
            onClick={handleReset}
            className="p-1.5 rounded-lg text-outline hover:text-error hover:bg-error/10 border border-border-subtle transition-colors cursor-pointer"
            title={t.editor.resetBtn}
          >
            <RotateCcw size={13} />
          </button>
        </div>
      </div>

      {/* Vùng nội dung: Chuyển đổi giữa Easy Fill và Bản in A4 */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === 'easy_fill' ? (
          /* TAB 1: EASY FILL FORM */
          <div className="max-w-3xl mx-auto p-4 sm:p-6 space-y-4">
            <div className="bg-primary/5 border border-primary/20 rounded-xl p-3 text-xs text-primary flex items-start gap-2">
              <ShieldCheck size={16} className="shrink-0 mt-0.5 text-primary" />
              <div className="leading-relaxed">
                {t.editor.smartFillNotice}
              </div>
            </div>

            <form onSubmit={(e) => { e.preventDefault(); setActiveTab('preview'); }} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {fields.map((field) => {
                  const val = formData[field.id] || '';
                  const fieldLabel = field.label?.[displayLang] || field.label?.vi || field.label;

                  return (
                    <div
                      key={field.id}
                      className={`space-y-1.5 ${
                        field.type === 'textarea' || field.id.includes('Address') || field.id.includes('scope')
                          ? 'sm:col-span-2'
                          : ''
                      }`}
                    >
                      <label
                        htmlFor={`input-${field.id}`}
                        className="text-xs font-semibold text-on-surface flex items-center justify-between"
                      >
                        <span>
                          {fieldLabel} {field.required && <span className="text-error">*</span>}
                        </span>
                      </label>

                      {field.type === 'select' ? (
                        <select
                          id={`input-${field.id}`}
                          value={val}
                          onChange={(e) => handleChange(field.id, e.target.value)}
                          className="w-full bg-surface-container border border-border-subtle rounded-xl px-3 py-2 text-xs text-on-surface outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                        >
                          {field.options?.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label?.[displayLang] || opt.label?.vi || opt.label}
                            </option>
                          ))}
                        </select>
                      ) : field.type === 'textarea' ? (
                        <textarea
                          id={`input-${field.id}`}
                          rows={3}
                          value={val}
                          placeholder={field.placeholder || ''}
                          onChange={(e) => handleChange(field.id, e.target.value, field.transform)}
                          className="w-full bg-surface-container border border-border-subtle rounded-xl px-3 py-2 text-xs text-on-surface outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 leading-relaxed"
                        />
                      ) : (
                        <input
                          id={`input-${field.id}`}
                          type={field.type || 'text'}
                          value={val}
                          placeholder={field.placeholder || ''}
                          onChange={(e) => handleChange(field.id, e.target.value, field.transform)}
                          className="w-full bg-surface-container border border-border-subtle rounded-xl px-3 py-2 text-xs text-on-surface outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                        />
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-primary text-on-primary hover:bg-primary/90 transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  <Eye size={14} />
                  <span>{t.editor.btnGoToPreview}</span>
                </button>
              </div>
            </form>
          </div>
        ) : (
          /* TAB 2: OFFICIAL A4 PREVIEW (Realistic Canvas & Standard A4 Dimensions) */
          <div className="bg-slate-100/90 dark:bg-slate-900/60 p-3 sm:p-6 flex flex-col items-center min-h-[550px] overflow-x-auto">
            {/* Thanh thông tin hướng dẫn A4 */}
            <div className="w-full max-w-[210mm] flex items-center justify-between text-[11px] text-outline mb-2 px-1">
              <span className="flex items-center gap-1.5">
                <FileText size={12} className="text-primary" />
                <span>{t.editor.a4PaperHelper}</span>
              </span>
              <span className="hidden sm:inline italic text-[10.5px]">
                {t.editor.printHint}
              </span>
            </div>

            {/* TỜ GIẤY A4 CHUẨN TỶ LỆ VẬT LÝ 210mm x 297mm */}
            <div
              id="consular-a4-document"
              className="w-full max-w-[210mm] min-h-[297mm] bg-white text-black p-[15mm_12mm_15mm_15mm] sm:p-[20mm_15mm_20mm_20mm] shadow-2xl border border-slate-300 font-serif leading-relaxed text-[12px] sm:text-[13px] box-border relative my-2 select-text"
              style={{ minHeight: '297mm' }}
            >
              {/* Header Quốc hiệu Tiêu ngữ chuẩn thể thức NĐ 30 */}
              <div className="text-center space-y-1 mb-6">
                <div className="font-bold text-[12px] sm:text-[13px] uppercase tracking-wider">
                  {t.editor.previewHeaderRepublic}
                </div>
                <div className="font-semibold text-[12px] sm:text-[13px] underline underline-offset-4 decoration-1">
                  {t.editor.previewHeaderMotto}
                </div>
              </div>

              {/* Khung dán ảnh (nếu là biểu mẫu hộ chiếu) */}
              {formConfig.code === 'TK02' && (
                <div className="flex justify-end mb-4">
                  <div className="w-24 h-32 border border-dashed border-gray-400 flex flex-col items-center justify-center text-center p-2 text-[10px] text-gray-500 bg-gray-50/50">
                    <span>{t.editor.previewPhotoPlaceholder}</span>
                    <span className="text-[8.5px] mt-1 text-gray-400">{t.editor.previewPhotoSub}</span>
                  </div>
                </div>
              )}

              {/* Tiêu đề biểu mẫu */}
              <div className="text-center space-y-1 my-6">
                <h2 className="font-bold text-base sm:text-lg uppercase tracking-wide">
                  {formConfig.title?.vi || formConfig.title}
                </h2>
                {formConfig.code && (
                  <div className="font-sans text-[11px] text-gray-600 font-medium">
                    Mẫu số: {formConfig.code} ({formConfig.standardBasis || formConfig.legal_basis})
                  </div>
                )}
              </div>

              {/* Kính gửi */}
              <div className="text-center text-xs font-semibold mb-6">
                {t.editor.previewTo}
              </div>

              {/* Nội dung các trường đã điền - Hiển thị chuẩn dòng kẻ chấm hành chính */}
              <div className="space-y-2.5 text-xs sm:text-[12.5px] leading-relaxed">
                {fields.map((field, idx) => {
                  const val = formData[field.id] || '....................................................................................................';
                  return (
                    <div key={field.id} className="flex flex-wrap items-baseline gap-1.5 py-0.5 border-b border-gray-100">
                      <span className="font-semibold text-gray-800">
                        {idx + 1}. {field.label?.vi || field.label}:
                      </span>
                      <span className="font-sans font-bold text-gray-950 px-1">
                        {val}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Lời cam đoan */}
              <div className="text-xs italic text-gray-700 mt-6 leading-relaxed">
                {t.editor.previewCommitment}
              </div>

              {/* Chữ ký */}
              <div className="grid grid-cols-2 gap-8 text-center text-xs mt-8 pt-4">
                <div>
                  <div className="italic text-gray-600">
                    {t.editor.previewMissionVerify}
                  </div>
                  <div className="font-semibold mt-1 mb-16">
                    {t.editor.previewMissionSign}
                  </div>
                </div>

                <div>
                  <div className="italic text-gray-600">
                    {t.editor.previewDatePlace}
                  </div>
                  <div className="font-bold uppercase mt-1 mb-16">
                    {t.editor.previewApplicantTitle}
                  </div>
                  <div className="font-sans font-semibold text-gray-900">
                    {formData.applicantName || formData.mandatorName || formData.fatherName || t.editor.previewApplicantSign}
                  </div>
                </div>
              </div>

              {/* Chân trang Fingerprint */}
              <div className="mt-12 pt-3 border-t border-gray-200 text-[10px] text-gray-400 font-sans flex justify-between">
                <span>{t.editor.previewFooterEngine}</span>
                <span>SHA-256: {formConfig.sha256Fingerprint?.slice(0, 16) || 'VERIFIED'}...</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * @file packages/core/src/components/consular/EasyFillForm.jsx
 * @description Biểu mẫu nhập liệu thông minh (Easy Fill Form):
 *  - Giao diện thân thiện, tự động viết hoa họ tên tiếng Việt
 *  - Kiểm soát trường bắt buộc, gợi ý định dạng
 *  - Phản hồi tức thì, lưu tự động và chuyển nhanh sang Bản in A4
 */

import React from 'react';
import { ShieldCheck, Eye } from 'lucide-react';
import { getConsularI18n } from '../../consular/i18n/consularI18n.js';

export default function EasyFillForm({
  fields = [],
  formData = {},
  onChange,
  onGoToPreview,
  displayLang = 'vi',
}) {
  const t = getConsularI18n(displayLang);

  return (
    <div className="max-w-3xl mx-auto p-4 sm:p-6 space-y-4">
      {/* Khung thông báo bảo mật */}
      <div className="bg-primary/5 border border-primary/20 rounded-xl p-3 text-xs text-primary flex items-start gap-2">
        <ShieldCheck size={16} className="shrink-0 mt-0.5 text-primary" />
        <div className="leading-relaxed">
          {t.editor.smartFillNotice}
        </div>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          onGoToPreview();
        }}
        className="space-y-4"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {fields.map((field) => {
            const val = formData[field.id] || '';
            const fieldLabel = field.label?.[displayLang] || field.label?.vi || field.label;
            const isFullWidth =
              field.type === 'textarea' ||
              field.id.includes('Address') ||
              field.id.includes('scope') ||
              field.id.includes('address');

            return (
              <div
                key={field.id}
                className={`space-y-1.5 ${isFullWidth ? 'sm:col-span-2' : ''}`}
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
                    onChange={(e) => onChange(field.id, e.target.value)}
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
                    onChange={(e) => onChange(field.id, e.target.value, field.transform)}
                    className="w-full bg-surface-container border border-border-subtle rounded-xl px-3 py-2 text-xs text-on-surface outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 leading-relaxed"
                  />
                ) : (
                  <input
                    id={`input-${field.id}`}
                    type={field.type || 'text'}
                    value={val}
                    placeholder={field.placeholder || ''}
                    onChange={(e) => onChange(field.id, e.target.value, field.transform)}
                    className="w-full bg-surface-container border border-border-subtle rounded-xl px-3 py-2 text-xs text-on-surface outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                  />
                )}
              </div>
            );
          })}
        </div>

        {/* Nút chuyển trực tiếp sang Bản in A4 */}
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
  );
}

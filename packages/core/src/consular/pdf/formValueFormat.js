/**
 * @file consular/pdf/formValueFormat.js
 * Chuẩn hóa giá trị hiển thị cho bản nháp: enum → nhãn, ngày ISO → dd/mm/yyyy, tên file an toàn.
 */

const ISO_DATE_RE = /^(\d{4})-(\d{2})-(\d{2})$/;

/** 'YYYY-MM-DD' → 'dd/mm/yyyy'; giá trị khác giữ nguyên. */
export function formatDateVi(value) {
  if (typeof value !== 'string') return value ?? '';
  const m = ISO_DATE_RE.exec(value.trim());
  return m ? `${m[3]}/${m[2]}/${m[1]}` : value;
}

function optionLabel(opt) {
  if (!opt) return '';
  if (typeof opt.label === 'string') return opt.label;
  return opt.label?.vi || opt.labelI18n?.vi || opt.labelJa || String(opt.value ?? '');
}

/**
 * Giá trị hiển thị của một trường.
 * @param {object|null} field - định nghĩa trường (type, options)
 * @param {*} value
 */
export function formatFormFieldValue(field, value) {
  if (value === null || value === undefined || value === '') return '';
  if (typeof value === 'boolean') return value ? 'Có' : 'Không';
  if (Array.isArray(value)) return value.map((v) => formatFormFieldValue(field, v)).join(', ');
  if (field?.options?.length) {
    const opt = field.options.find((o) => String(o.value) === String(value));
    if (opt) return optionLabel(opt);
  }
  if (field?.type === 'date' || ISO_DATE_RE.test(String(value).trim())) return formatDateVi(String(value));
  return String(value);
}

/** Map id → field cho một form config. */
export function buildFieldIndex(formConfig) {
  const fields = formConfig?.fields || formConfig?.sections?.flatMap((s) => s.fields || []) || [];
  return new Map(fields.filter(Boolean).map((f) => [f.id, f]));
}

/** Bỏ ký tự không hợp lệ trong tên file (/, \, :, *, ?, ", <, >, |, ký tự điều khiển). */
export function sanitizeFilenamePart(text) {
  return String(text || '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .replace(/[^A-Za-z0-9]+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '');
}

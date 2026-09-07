/**
 * Gom hóa đơn theo pháp nhân đứng tên người mua để tách Giấy đề nghị thanh
 * toán. Mỗi công ty là một chứng từ riêng, nên khóa gom nhóm phải là mã số
 * thuế người mua — tên đơn vị trên hóa đơn hay bị viết khác nhau giữa các nhà
 * cung cấp (thừa/thiếu dấu, khác cách viết "CHI NHÁNH").
 */

import { describeExpense } from './expenseCategory.js';
import { foldText, normalizeTaxCode } from './vietnamInvoice.js';

export const UNASSIGNED_COMPANY_KEY = '__chua_xac_dinh__';

/** Khóa nhóm: mã số thuế người mua, lùi về tên đã bỏ dấu khi hóa đơn thiếu MST. */
export function companyKeyOf(invoice) {
  if (invoice?.companyKey) return invoice.companyKey;
  const taxCode = normalizeTaxCode(invoice?.buyerTax ?? '');
  if (taxCode) return `mst:${taxCode}`;
  const name = foldText(invoice?.buyer ?? '').replace(/\s+/g, ' ').trim();
  return name ? `ten:${name}` : UNASSIGNED_COMPANY_KEY;
}

const DATE_PATTERN = /^(\d{2})\/(\d{2})\/(\d{4})$/;

/** Ngày trên chứng từ luôn ở dạng dd/mm/yyyy; giá trị khác thì bỏ qua. */
export function parseFormDate(value) {
  const match = DATE_PATTERN.exec(String(value ?? '').trim());
  if (!match) return null;
  const [, day, month, year] = match;
  const date = new Date(Number(year), Number(month) - 1, Number(day));
  if (date.getDate() !== Number(day) || date.getMonth() !== Number(month) - 1) return null;
  return date;
}

const formatDate = (date) => `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`;

/** Sắp xếp theo ngày để bảng kê trên giấy đi đúng trình tự phát sinh. */
function byDateThenInvoiceNo(left, right) {
  const leftDate = parseFormDate(left.date);
  const rightDate = parseFormDate(right.date);
  if (leftDate && rightDate && leftDate.getTime() !== rightDate.getTime()) {
    return leftDate - rightDate;
  }
  if (leftDate && !rightDate) return -1;
  if (!leftDate && rightDate) return 1;
  return String(left.invoiceNo ?? '').localeCompare(String(right.invoiceNo ?? ''));
}

/**
 * Nội dung thanh toán mặc định. Chỉ ghi khoảng thời gian khi đọc được ngày trên
 * chứng từ, tránh in ra một khoảng ngày bịa.
 */
export function describeFormContent(rows, prefix = 'Chi phí đi lại công tác') {
  const dates = rows.map((row) => parseFormDate(row.date)).filter(Boolean).sort((a, b) => a - b);
  if (dates.length === 0) return prefix;
  const from = formatDate(dates[0]);
  const to = formatDate(dates[dates.length - 1]);
  return from === to ? `${prefix} ngày ${from}` : `${prefix} từ ${from} đến ${to}`;
}

/** Làm sạch tên pháp nhân/đơn vị bóc tách được (bỏ tiền tố rác như ): , (Company): ) */
export function sanitizeEntityName(value) {
  return String(value ?? '')
    .replace(/^[\s):(\-–—\.]+/gu, '')
    .replace(/^\(?Company\)?[:\-\s]*/iu, '')
    .replace(/^Tên\s+đơn\s+vị[:\-\s]*/iu, '')
    .replace(/^Đơn\s+vị[:\-\s]*/iu, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Nhận diện tên đơn vị là doanh nghiệp / pháp nhân (thay vì tên cá nhân) */
export function isCorporateName(value) {
  const cleaned = sanitizeEntityName(value).toUpperCase();
  if (!cleaned) return false;
  return /CÔNG TY|TNHH|\bCP\b|CỔ PHẦN|DOANH NGHIỆP|TỔNG CÔNG TY|CHI NHÁNH|TẬP ĐOÀN|VIỆN|TRƯỜNG|BỆNH VIỆN|TRUNG TÂM/u.test(cleaned);
}

/** Tên hiển thị ngắn của đơn vị, ví dụ "HUMA MEDICAL - CHI NHÁNH ĐÀ NẴNG". */
export function shortCompanyName(name) {
  const sanitized = sanitizeEntityName(name);
  return String(sanitized)
    .replace(/^\s*C[ÔO]NG\s*TY\s+(C[ỔO]\s*PH[ẦA]N|TNHH|TR[ÁA]CH\s*NHI[ỆE]M\s*H[ỮU]{1,2}\s*H[ẠA]N|S[ẢA]N\s*XU[ẤA]T\s*V[ÀA]\s*TH[ƯU]{1,2}[ƠO]NG\s*M[ẠA]I|CP)?\s*/iu, '')
    .trim() || String(sanitized).trim();
}

/**
 * Gom danh sách hóa đơn đã xác nhận thành các nhóm công ty.
 * `overrides` cho phép người dùng sửa tên/địa chỉ/mã số thuế của từng nhóm.
 */
export function groupInvoicesByCompany(invoices, overrides = {}) {
  const groups = new Map();

  for (const invoice of invoices) {
    const key = companyKeyOf(invoice);
    const buyerClean = sanitizeEntityName(invoice.buyer);
    const buyerAddressClean = String(invoice.buyerAddress ?? '').trim();
    const buyerTaxClean = normalizeTaxCode(invoice.buyerTax ?? '');

    if (!groups.has(key)) {
      groups.set(key, {
        key,
        company: {
          name: buyerClean,
          taxCode: buyerTaxClean,
          address: buyerAddressClean,
        },
        invoices: [],
      });
    }
    const group = groups.get(key);
    // Ưu tiên tên pháp nhân doanh nghiệp (CÔNG TY...) hơn tên cá nhân
    if (buyerClean) {
      if (!group.company.name) {
        group.company.name = buyerClean;
      } else if (isCorporateName(buyerClean) && !isCorporateName(group.company.name)) {
        group.company.name = buyerClean;
      }
    }
    if (!group.company.address && buyerAddressClean) group.company.address = buyerAddressClean;
    if (!group.company.taxCode && buyerTaxClean) group.company.taxCode = buyerTaxClean;
    group.invoices.push(invoice);
  }

  return [...groups.values()].map((group) => {
    const override = overrides[group.key] ?? {};
    const finalName = sanitizeEntityName(override.name ?? group.company.name);
    return {
      ...group,
      company: {
        name: finalName,
        taxCode: override.taxCode ?? group.company.taxCode,
        address: override.address ?? group.company.address,
      },
      total: group.invoices.reduce((sum, invoice) => sum + (Number(invoice.totalAmount) || 0), 0),
    };
  }).sort((left, right) => String(left.company.name).localeCompare(String(right.company.name), 'vi'));
}

/**
 * Chuyển nhóm công ty thành dữ liệu đầu vào của biểu mẫu ĐNTT.
 *
 * `extraRows` là các dòng không gắn với hóa đơn nào (công tác phí khoán), nối
 * vào sau dòng hóa đơn cuối cùng của đúng đơn vị chịu khoản đó.
 */
export function buildFormsFromGroups(groups, options = {}) {
  return groups.map((group) => {
    const invoiceRows = group.invoices
      .map((invoice) => ({
        date: invoice.date,
        description: invoice.expenseNote || describeExpense(invoice),
        amount: Number(invoice.totalAmount) || 0,
        invoiceNo: invoice.invoiceNo,
      }))
      .sort(byDateThenInvoiceNo);

    const rows = [...invoiceRows, ...(options.extraRows?.[group.key] ?? [])];

    return {
      company: {
        name: group.company.name || 'Chưa xác định đơn vị thanh toán',
        address: group.company.address || '',
        taxCode: group.company.taxCode || '',
      },
      label: shortCompanyName(group.company.name) || 'Chưa xác định',
      // Khoảng thời gian trên nội dung lấy theo ngày chứng từ, không tính dòng
      // công tác phí vốn mang ngày lập giấy.
      content: options.contents?.[group.key] || describeFormContent(invoiceRows, options.contentPrefix),
      rows,
    };
  });
}

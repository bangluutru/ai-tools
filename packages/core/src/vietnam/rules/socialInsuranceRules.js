/**
 * @file packages/core/src/vietnam/rules/socialInsuranceRules.js
 * @description Quy tắc đóng BHXH, BHYT, BHTN và BHTNLĐ-BNN tại Việt Nam với phân định thời điểm hiệu lực (Effective-Date Engine).
 * Căn cứ pháp lý:
 * - Luật BHXH số 41/2024/QH15 & Luật BHYT sửa đổi số 51/2024/QH15 & Luật Việc làm 2025
 * - Nghị định 161/2026/NĐ-CP (áp dụng từ 01/07/2026: Lương cơ sở 2.530.000 VND -> Trần BHXH/BHYT 50.600.000 VND)
 * - Nghị định 73/2024/NĐ-CP (áp dụng đến 30/06/2026: Lương cơ sở 2.340.000 VND -> Trần BHXH/BHYT 46.800.000 VND)
 */

import { defineRuleMetadata } from '../../regulatory/ruleMetadata.js';

// Giai đoạn 1: 01/01/2026 đến 30/06/2026
export const SOCIAL_INSURANCE_RULE_2026_H1 = Object.freeze({
  metadata: defineRuleMetadata({
    id: 'vn-social-insurance-2026-h1',
    jurisdiction: { country: 'VN' },
    sourceId: 'vn-gov-decree-73-2024',
    effectiveFrom: '2026-01-01',
    effectiveTo: '2026-06-30',
    applicablePeriod: {
      type: 'effective-date-range',
      from: '2026-01-01',
      to: '2026-06-30',
    },
    version: '2026.1-H1',
    lastVerifiedAt: '2026-09-12',
    status: 'verified',
    legalDocument: 'Nghị định 73/2024/NĐ-CP',
    sourceTitle: 'Mức lương cơ sở giai đoạn 01/01/2026 - 30/06/2026',
    notes: 'Lương cơ sở 2.340.000 VND. Trần tiền lương đóng BHXH và BHYT tối đa 20 lần mức lương cơ sở = 46.800.000 VND.'
  }),
  baseSalary: 2_340_000,
  maxBhxhBhytSalary: 2_340_000 * 20, // 46.800.000 VND
  employeeRates: Object.freeze({
    bhxh: 0.08,    // 8% Hưu trí, tử tuất
    bhyt: 0.015,   // 1.5% Bảo hiểm y tế
    bhtn: 0.01,    // 1% Bảo hiểm thất nghiệp
    total: 0.105,  // 10.5%
  }),
  employerRates: Object.freeze({
    bhxhRetirement: 0.14,  // 14% Hưu trí, tử tuất
    bhxhMaternity: 0.03,   // 3% Ốm đau, thai sản (Tổng BHXH: 17%)
    bhxhTotal: 0.17,
    bhyt: 0.03,            // 3% Bảo hiểm y tế
    bhtn: 0.01,            // 1% Bảo hiểm thất nghiệp
    occupationalAccident: 0.005, // 0.5% TNLĐ-BNN (Qũy bảo hiểm tai nạn lao động, bệnh nghề nghiệp)
    totalNormal: 0.215,    // 21.5%
  }),
  combinedTotalRate: 0.32, // 32%
});

// Giai đoạn 2: Từ 01/07/2026 trở đi
export const SOCIAL_INSURANCE_RULE_2026_H2 = Object.freeze({
  metadata: defineRuleMetadata({
    id: 'vn-social-insurance-2026-h2',
    jurisdiction: { country: 'VN' },
    sourceId: 'vn-gov-decree-161-2026',
    effectiveFrom: '2026-07-01',
    effectiveTo: null,
    applicablePeriod: {
      type: 'effective-date-range',
      from: '2026-07-01',
      to: '2026-12-31',
    },
    version: '2026.2-H2',
    lastVerifiedAt: '2026-09-12',
    status: 'verified',
    legalDocument: 'Nghị định 161/2026/NĐ-CP',
    sourceTitle: 'Mức lương cơ sở từ 01/07/2026',
    notes: 'Lương cơ sở 2.530.000 VND. Trần tiền lương đóng BHXH và BHYT tối đa 20 lần mức lương cơ sở = 50.600.000 VND.'
  }),
  baseSalary: 2_530_000,
  maxBhxhBhytSalary: 2_530_000 * 20, // 50.600.000 VND
  employeeRates: Object.freeze({
    bhxh: 0.08,    // 8% Hưu trí, tử tuất
    bhyt: 0.015,   // 1.5% Bảo hiểm y tế
    bhtn: 0.01,    // 1% Bảo hiểm thất nghiệp
    total: 0.105,  // 10.5%
  }),
  employerRates: Object.freeze({
    bhxhRetirement: 0.14,  // 14% Hưu trí, tử tuất
    bhxhMaternity: 0.03,   // 3% Ốm đau, thai sản (Tổng BHXH: 17%)
    bhxhTotal: 0.17,
    bhyt: 0.03,            // 3% Bảo hiểm y tế
    bhtn: 0.01,            // 1% Bảo hiểm thất nghiệp
    occupationalAccident: 0.005, // 0.5% TNLĐ-BNN
    totalNormal: 0.215,    // 21.5%
  }),
  combinedTotalRate: 0.32, // 32%
});

/**
 * Chuẩn hóa chuỗi ngày tháng đầu vào về dạng YYYY-MM-DD
 * @param {string|Date} dateInput - Có thể là '2026-09-01', '09/2026', '2026-09', hoặc Date object
 * @returns {string} Chuỗi YYYY-MM-DD
 */
export function normalizeVietnamDate(dateInput) {
  if (!dateInput) return '2026-09-01';
  if (dateInput instanceof Date) {
    return dateInput.toISOString().split('T')[0];
  }
  const str = String(dateInput).trim();
  // Khớp định dạng MM/YYYY (ví dụ: '09/2026', '9/2026')
  const mmyyyy = str.match(/^(\d{1,2})\/(\d{4})$/);
  if (mmyyyy) {
    const month = mmyyyy[1].padStart(2, '0');
    return `${mmyyyy[2]}-${month}-01`;
  }
  // Khớp định dạng YYYY-MM
  const yyyymm = str.match(/^(\d{4})-(\d{1,2})$/);
  if (yyyymm) {
    const month = yyyymm[2].padStart(2, '0');
    return `${yyyymm[1]}-${month}-01`;
  }
  // Nếu đã là YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
    return str;
  }
  return '2026-09-01';
}

/**
 * Lấy quy tắc bảo hiểm xã hội áp dụng theo ngày hoặc tháng/năm.
 * @param {string|Date} [date='2026-09-01'] - Ngày hoặc tháng/năm cần tra cứu
 * @returns {typeof SOCIAL_INSURANCE_RULE_2026_H2}
 */
export function getInsuranceRules(date = '2026-09-01') {
  const normDate = normalizeVietnamDate(date);
  if (normDate < '2026-07-01') {
    return SOCIAL_INSURANCE_RULE_2026_H1;
  }
  return SOCIAL_INSURANCE_RULE_2026_H2;
}

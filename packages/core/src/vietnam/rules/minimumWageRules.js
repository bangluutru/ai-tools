/**
 * @file packages/core/src/vietnam/rules/minimumWageRules.js
 * @description Mức lương tối thiểu vùng và trần đóng Bảo hiểm thất nghiệp (BHTN) tại Việt Nam.
 * Căn cứ pháp lý: Nghị định 293/2025/NĐ-CP (áp dụng từ 01/01/2026).
 */

import { defineRuleMetadata } from '../../regulatory/ruleMetadata.js';

export const MINIMUM_WAGE_RULE_2026 = Object.freeze({
  metadata: defineRuleMetadata({
    id: 'vn-minimum-wage-2026',
    jurisdiction: { country: 'VN' },
    sourceId: 'vn-gov-decree-293-2025',
    effectiveFrom: '2026-01-01',
    effectiveTo: null,
    applicablePeriod: {
      type: 'calendar-year',
      from: 2026,
      to: 2026,
    },
    version: '2026.1',
    lastVerifiedAt: '2026-09-12',
    status: 'verified',
    legalDocument: 'Nghị định 293/2025/NĐ-CP',
    sourceTitle: 'Mức lương tối thiểu đối với người lao động làm việc theo HĐLĐ',
    notes: 'Quy định mức lương tối thiểu 4 vùng từ 01/01/2026 và mức trần đóng BHTN tối đa 20 lần mức lương tối thiểu vùng.'
  }),
  regions: Object.freeze({
    1: {
      code: 1,
      name_vn: 'Vùng I (Hà Nội, TP.HCM, Hải Phòng, Bình Dương, Đồng Nai...)',
      minWage: 5_310_000,
      maxBhtnSalary: 5_310_000 * 20, // 106.200.000 VND
    },
    2: {
      code: 2,
      name_vn: 'Vùng II (Đô thị loại II, TP trực thuộc tỉnh, vùng ven...)',
      minWage: 4_730_000,
      maxBhtnSalary: 4_730_000 * 20, // 94.600.000 VND
    },
    3: {
      code: 3,
      name_vn: 'Vùng III (Huyện, thị xã ngoại ô, vùng trung du...)',
      minWage: 4_140_000,
      maxBhtnSalary: 4_140_000 * 20, // 82.800.000 VND
    },
    4: {
      code: 4,
      name_vn: 'Vùng IV (Các địa bàn còn lại)',
      minWage: 3_700_000,
      maxBhtnSalary: 3_700_000 * 20, // 74.000.000 VND
    },
  })
});

/**
 * Lấy quy tắc lương tối thiểu vùng áp dụng theo ngày hoặc năm.
 * @param {string|number} [dateOrYear='2026-09-01'] - YYYY-MM-DD hoặc năm YYYY
 * @returns {typeof MINIMUM_WAGE_RULE_2026}
 */
export function getMinimumWageRules(dateOrYear = '2026-09-01') {
  // Hiện hành áp dụng quy chuẩn 2026 theo NĐ 293/2025/NĐ-CP
  return MINIMUM_WAGE_RULE_2026;
}

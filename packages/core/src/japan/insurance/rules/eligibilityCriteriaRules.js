/**
 * @file packages/core/src/japan/insurance/rules/eligibilityCriteriaRules.js
 * @description Tiêu chuẩn pháp lý xác định nghĩa vụ tham gia BHXH (社会保険適用基準).
 * Nguồn chính thức: 厚生労働省・日本年金機構 (mhlw-shakai-hoken-tekio-2026)
 */

import { defineRuleMetadata } from '../../../regulatory/ruleMetadata.js';
import { JAPAN_JURISDICTION } from '../../../regulatory/jurisdiction.js';
import { createApplicablePeriod } from '../../../regulatory/effectivePeriod.js';

export const ELIGIBILITY_RULES_METADATA_2026 = defineRuleMetadata({
  id: 'jp-shakai-hoken-tekio-criteria-2026',
  jurisdiction: JAPAN_JURISDICTION,
  sourceId: 'mhlw-shakai-hoken-tekio-2026',
  effectiveFrom: '2026-04-01',
  applicablePeriod: createApplicablePeriod('fiscal-year', 2026, 2026),
  version: '2026.1',
  lastVerifiedAt: '2026-09-10',
  status: 'verified',
  notes: 'Quy chuẩn bắt buộc tham gia BHXH: Tiêu chuẩn 3/4 và Mở rộng áp dụng cho lao động ngắn hạn (20h, 8.8 vạn, DN >= 51 người).',
});

export const ELIGIBILITY_THRESHOLDS = Object.freeze({
  shortTimeWeeklyHours: 20,
  shortTimeMonthlyWage: 88000,
  standardFullTimeWeeklyHours: 40,
  threeQuartersWeeklyHours: 30, // 40h * 3/4
  companySizeThreshold: 51,     // Doanh nghiệp từ 51 người trở lên (áp dụng từ 10/2024, duy trì 2026)
  pensionAgeLimit: 70,          // 厚生年金: Dưới 70 tuổi
  healthAgeLimit: 75,           // 健康保険: Dưới 75 tuổi (sau đó chuyển sang 后期高齢者医療)
});

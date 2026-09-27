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
  notes: 'Quy chuẩn bắt buộc tham gia BHXH: Tiêu chuẩn 3/4 và Mở rộng áp dụng cho lao động ngắn hạn (20h; 8.8 vạn đến khi bãi bỏ dự kiến 10/2026; quy mô DN 51 người → 36 (10/2027) → 21 (10/2029) → 11 (10/2032) → bãi bỏ (10/2035)).',
});

export const ELIGIBILITY_THRESHOLDS = Object.freeze({
  shortTimeWeeklyHours: 20,
  shortTimeMonthlyWage: 88000,  // 所定内賃金 月額8.8万円 (撤廃予定: 令和8年10月)
  standardFullTimeWeeklyHours: 40,
  threeQuartersWeeklyHours: 30, // 40h * 3/4
  companySizeThreshold: 51,     // Ngưỡng hiện hành (từ 10/2024) — dùng resolveCompanySizeThreshold(date) theo ngày
  pensionAgeLimit: 70,          // 厚生年金: Dưới 70 tuổi
  healthAgeLimit: 75,           // 健康保険: Dưới 75 tuổi (sau đó chuyển sang 後期高齢者医療)
  employmentInsuranceWeeklyHours: 20, // 雇用保険: 週20時間以上
  employmentInsuranceMinDays: 31,     // 雇用保険: 31日以上の雇用見込み
});

/**
 * Lộ trình nới ngưỡng quy mô doanh nghiệp (企業規模要件) — 年金制度改正法 (令和7年):
 * 51人 (2024-10〜) → 36人 (2027-10〜) → 21人 (2029-10〜) → 11人 (2032-10〜) → bãi bỏ (2035-10〜).
 * Nguồn: 日本年金機構 短時間労働者の適用拡大 / 厚労省 社会保険適用拡大特設サイト.
 */
export const COMPANY_SIZE_SCHEDULE = Object.freeze([
  { from: '2035-10-01', threshold: 0, labelJa: '企業規模要件なし（撤廃）' },
  { from: '2032-10-01', threshold: 11, labelJa: '11人以上' },
  { from: '2029-10-01', threshold: 21, labelJa: '21人以上' },
  { from: '2027-10-01', threshold: 36, labelJa: '36人以上' },
  { from: '2024-10-01', threshold: 51, labelJa: '51人以上' },
  { from: '2022-10-01', threshold: 101, labelJa: '101人以上' },
]);

/**
 * 賃金要件（月額8.8万円）: 日本年金機構「最低賃金以上で週20時間以上働く場合は…この要件は令和8年10月に撤廃予定」.
 * Ngày chính xác do 政令 quy định (trong vòng 3 năm từ ngày công bố luật); dùng 2026-10-01 theo thông báo chính thức và gắn nhãn "予定".
 */
export const WAGE_REQUIREMENT_ABOLITION = Object.freeze({
  date: '2026-10-01',
  status: 'scheduled',
  labelJa: '令和8年10月撤廃予定（政令で定める日）',
  labelVi: 'Dự kiến bãi bỏ từ 10/2026 (ngày cụ thể theo 政令)',
  labelEn: 'Scheduled to be abolished from October 2026 (date set by cabinet order)',
});

export function resolveCompanySizeThreshold(applicableDate) {
  const d = String(applicableDate || new Date().toISOString()).slice(0, 10);
  const entry = COMPANY_SIZE_SCHEDULE.find((e) => d >= e.from);
  return entry || COMPANY_SIZE_SCHEDULE[COMPANY_SIZE_SCHEDULE.length - 1];
}

export function isWageRequirementActive(applicableDate) {
  const d = String(applicableDate || new Date().toISOString()).slice(0, 10);
  return d < WAGE_REQUIREMENT_ABOLITION.date;
}

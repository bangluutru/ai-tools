/**
 * @file packages/core/src/japan/family/rules/childcareBenefitRules.js
 * @description
 * Quy chuẩn pháp lý và biểu mức tính toán Trợ cấp Nghỉ chăm con (育児休業給付金)
 * Căn cứ:
 * - 雇用保険法第61条の7〜第61条の10 (育児休業等給付)
 * - 厚生労働省 育児休業給付金の支給額及び上限額・下限額 (令和7年・令和8年度基準)
 * - 雇用保険業務取扱要領 54001-54500 (休業開始時賃金日額の算定)
 */

import { defineRuleMetadata } from '../../../regulatory/ruleMetadata.js';
import { JAPAN_JURISDICTION } from '../../../regulatory/jurisdiction.js';
import { createApplicablePeriod } from '../../../regulatory/effectivePeriod.js';

export const CHILDCARE_BENEFIT_METADATA = defineRuleMetadata({
  id: 'jp-childcare-benefit-rules-2026',
  jurisdiction: JAPAN_JURISDICTION,
  sourceId: 'mhlw-childcare-benefit-guidelines-2026',
  effectiveFrom: '2022-10-01',
  applicablePeriod: createApplicablePeriod('fiscal-year', 2022, 2026),
  version: '2026.1',
  lastVerifiedAt: '2026-09-27',
  status: 'verified',
  notes: 'Quy chuẩn tính mức thù lao ngày bắt đầu nghỉ (休業開始時賃金日額), các mức trần/sàn MHLW và biểu tỷ lệ 67%, 50%, thưởng 13%, hỗ trợ 10% rút ngắn giờ.',
});

/**
 * Mức trần/sàn MHLW theo kỳ hiệu lực (đổi mỗi năm vào ngày 1/8).
 * Nguồn: tờ rơi MHLW 「令和8年８月１日から支給限度額が変更になります」(LL080731 保02) và bản R7 tương ứng.
 * Các mức trần tháng/28 ngày = 賃金日額上限 × số ngày × tỷ lệ (1円未満切捨て), nên mức ngày và mức tháng luôn khớp nhau.
 */
export const CHILDCARE_BENEFIT_PERIODS = Object.freeze({
  PERIOD_2025_08: Object.freeze({
    id: '2025_08',
    nameJa: '令和7年8月1日〜令和8年7月31日',
    nameVi: '01/08/2025 – 31/07/2026 (Reiwa 7)',
    startDate: '2025-08-01',
    endDate: '2026-07-31',
    MAX_DAILY_WAGE: 16110,          // 休業開始時賃金日額 上限 (賃金月額 483,300円 ÷ 30)
    MIN_DAILY_WAGE: 3014,           // 下限 (賃金月額 90,420円 ÷ 30)
    MAX_MONTHLY_WAGE: 483300,
    MIN_MONTHLY_WAGE: 90420,
    MAX_MONTHLY_BENEFIT_67: 323811, // 育児休業給付金 支給上限額 (67%)
    MAX_MONTHLY_BENEFIT_50: 241650, // 同 (50%)
    MAX_BIRTH_TIME_BENEFIT_28D: 302223, // 出生時育児休業給付金 上限 (28日・67%)
    MAX_POST_BIRTH_SUPPORT_28D: 58640,  // 出生後休業支援給付金 上限 (28日・13%) = floor(16,110×28×0.13)
    SHORT_TIME_PAYMENT_LIMIT: 471393,   // 育児時短就業給付 支給限度額
    SHORT_TIME_MIN_BENEFIT: 2411,       // 育児時短就業給付 最低限度額 (この額以下は不支給)
  }),
  PERIOD_2026_08: Object.freeze({
    id: '2026_08',
    nameJa: '令和8年8月1日以降',
    nameVi: 'Từ 01/08/2026 (Reiwa 8)',
    startDate: '2026-08-01',
    endDate: '2027-07-31',
    MAX_DAILY_WAGE: 16540,          // 賃金月額 496,200円 ÷ 30
    MIN_DAILY_WAGE: 3203,           // 賃金月額 96,090円 ÷ 30
    MAX_MONTHLY_WAGE: 496200,
    MIN_MONTHLY_WAGE: 96090,
    MAX_MONTHLY_BENEFIT_67: 332454,
    MAX_MONTHLY_BENEFIT_50: 248100,
    MAX_BIRTH_TIME_BENEFIT_28D: 310290,
    MAX_POST_BIRTH_SUPPORT_28D: 60205,
    SHORT_TIME_PAYMENT_LIMIT: 484121,
    SHORT_TIME_MIN_BENEFIT: 2562,
  }),
});

/**
 * Các hằng số luật định và mức trần/sàn MHLW cho Trợ cấp Nghỉ chăm con.
 * DAILY_WAGE_LIMITS giữ lại để tương thích ngược = mức của kỳ mới nhất (令和8年8月〜).
 * Engine chọn kỳ theo ngày bắt đầu nghỉ qua resolveChildcareBenefitPeriod().
 */
export const CHILDCARE_BENEFIT_CONSTANTS = Object.freeze({
  // Mức trần & mức sàn 休業開始時賃金日額 (kỳ 令和8年8月1日〜)
  DAILY_WAGE_LIMITS: {
    MAX_DAILY_WAGE: CHILDCARE_BENEFIT_PERIODS.PERIOD_2026_08.MAX_DAILY_WAGE,
    MIN_DAILY_WAGE: CHILDCARE_BENEFIT_PERIODS.PERIOD_2026_08.MIN_DAILY_WAGE,
    MAX_MONTHLY_BENEFIT_67: CHILDCARE_BENEFIT_PERIODS.PERIOD_2026_08.MAX_MONTHLY_BENEFIT_67,
    MAX_MONTHLY_BENEFIT_50: CHILDCARE_BENEFIT_PERIODS.PERIOD_2026_08.MAX_MONTHLY_BENEFIT_50,
    // Sàn tháng = sàn ngày × 30 × tỷ lệ (1円未満切捨て)
    MIN_MONTHLY_BENEFIT_67: Math.floor((3203 * 30 * 67) / 100),
    MIN_MONTHLY_BENEFIT_50: Math.floor((3203 * 30 * 50) / 100),
  },

  // Tỷ lệ trợ cấp luật định
  RATES: {
    INITIAL_PERIOD_RATE: 0.67,       // 67% trong 180 ngày đầu (180日目まで)
    SUBSEQUENT_PERIOD_RATE: 0.50,    // 50% từ ngày 181 trở đi (181日目以降)
    POST_BIRTH_SUPPORT_BONUS: 0.13,  // +13% 出生後休業支援給付金 (tối đa 28 ngày)
    SHORT_TIME_WORK_RATE: 0.10,      // 10% tiền lương THỰC TRẢ trong tháng làm giờ ngắn (育児時短就業給付, từ 04/2025)
    SHORT_TIME_FULL_RATE_LIMIT: 0.90,// Lương thực trả > 90% lương trước khi làm giờ ngắn → tỷ lệ giảm dần về 0 tại 100%
    COMBINED_80_PERCENT_RATE: 0.80,  // 67% + 13% = 80% (tương đương ~100% thu nhập thực nhận sau thuế)
  },

  // Số ngày quy chuẩn của các mốc thời gian
  PERIOD_DAYS: {
    INITIAL_67_MAX_DAYS: 180,        // Tối đa 180 ngày hưởng mức 67%
    POST_BIRTH_SUPPORT_MAX_DAYS: 28, // Tối đa 28 ngày hưởng mức thưởng 13%
    STANDARD_MONTH_DAYS: 30,         // Số ngày tiêu chuẩn trong một chu kỳ chi trả (支給単位期間)
  },

  // Giới hạn giảm trừ lương khi có thu nhập trong thời gian nghỉ (Điều 61-7 khoản 5)
  // Ngưỡng "không giảm" = 80% − tỷ lệ trợ cấp: 13% cho kỳ 67%, 30% cho kỳ 50%.
  SALARY_OFFSET_THRESHOLDS: {
    FULL_BENEFIT_LIMIT_RATE: 0.13,   // Kỳ 67%: Lương <= 13%: Không bị giảm trừ trợ cấp
    FULL_BENEFIT_LIMIT_RATE_50: 0.30,// Kỳ 50%: Lương <= 30%: Không bị giảm trừ trợ cấp
    REDUCED_BENEFIT_LIMIT_RATE: 0.80,// Tổng (Lương + Trợ cấp) <= 80%: Bù phần chênh lệch
    ZERO_BENEFIT_LIMIT_RATE: 0.80,   // Lương >= 80%: Trợ cấp = 0円
  },
});

/**
 * Danh sách nguồn pháp quy tham chiếu cho M3
 */
export const CHILDCARE_BENEFIT_SOURCES = Object.freeze([
  'egov-employment-insurance-act',
  'egov-childcare-leave-act',
  'mhlw-childcare-benefit-guidelines-2026'
]);

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
  lastVerifiedAt: '2026-09-10',
  status: 'verified',
  notes: 'Quy chuẩn tính mức thù lao ngày bắt đầu nghỉ (休業開始時賃金日額), các mức trần/sàn MHLW và biểu tỷ lệ 67%, 50%, thưởng 13%, hỗ trợ 10% rút ngắn giờ.',
});

/**
 * Các hằng số luật định và mức trần/sàn MHLW cho Trợ cấp Nghỉ chăm con (令和7年8月〜令和8年改定)
 */
export const CHILDCARE_BENEFIT_CONSTANTS = Object.freeze({
  // Mức trần & mức sàn 休業開始時賃金日額 (MHLW quy định cập nhật hàng năm từ ngày 1/8)
  DAILY_WAGE_LIMITS: {
    // Trần mức lương ngày: 16,210円
    MAX_DAILY_WAGE: 16210,
    // Sàn mức lương ngày: 2,978円
    MIN_DAILY_WAGE: 2978,
    // Trần trợ cấp tháng mức 67%: 16,210 × 30 × 67% = 325,821円 (theo công bố MHLW thực tế là 315,369円 / 301,299円 tùy kỳ)
    MAX_MONTHLY_BENEFIT_67: 315369,
    // Trần trợ cấp tháng mức 50%: 16,210 × 30 × 50% = 243,150円 (theo công bố MHLW thực tế là 235,350円 / 224,850円)
    MAX_MONTHLY_BENEFIT_50: 235350,
    // Sàn trợ cấp tháng mức 67%: 2,978 × 30 × 67% = 59,857円
    MIN_MONTHLY_BENEFIT_67: 59857,
    // Sàn trợ cấp tháng mức 50%: 2,978 × 30 × 50% = 44,670円
    MIN_MONTHLY_BENEFIT_50: 44670,
  },

  // Tỷ lệ trợ cấp luật định
  RATES: {
    INITIAL_PERIOD_RATE: 0.67,       // 67% trong 180 ngày đầu (180日目まで)
    SUBSEQUENT_PERIOD_RATE: 0.50,    // 50% từ ngày 181 trở đi (181日目以降)
    POST_BIRTH_SUPPORT_BONUS: 0.13,  // +13% thưởng hỗ trợ sau sinh (tối đa 28 ngày)
    SHORT_TIME_WORK_RATE: 0.10,      // ~10% trợ cấp làm việc rút ngắn giờ nuôi con dưới 2 tuổi (từ 04/2025)
    COMBINED_80_PERCENT_RATE: 0.80,  // 67% + 13% = 80% (tương đương ~100% thu nhập thực nhận sau thuế)
  },

  // Số ngày quy chuẩn của các mốc thời gian
  PERIOD_DAYS: {
    INITIAL_67_MAX_DAYS: 180,        // Tối đa 180 ngày hưởng mức 67%
    POST_BIRTH_SUPPORT_MAX_DAYS: 28, // Tối đa 28 ngày hưởng mức thưởng 13%
    STANDARD_MONTH_DAYS: 30,         // Số ngày tiêu chuẩn trong một chu kỳ chi trả (支給単位期間)
  },

  // Giới hạn giảm trừ lương khi có thu nhập trong thời gian nghỉ (Điều 61-7 khoản 5)
  SALARY_OFFSET_THRESHOLDS: {
    FULL_BENEFIT_LIMIT_RATE: 0.13,   // Lương <= 13%: Không bị giảm trừ trợ cấp
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

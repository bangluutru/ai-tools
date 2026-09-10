/**
 * @file packages/core/src/japan/insurance/engines/standardRemunerationEngine.js
 * @description Engine tra cứu và xác định bậc lương chuẩn (標準報酬月額) và thưởng chuẩn (標準賞与額).
 * Nguồn:
 * - 全国健康保険協会 (kyokai-kenpo-monthly-table-2026)
 * - 日本年金機構 (jps-welfare-pension-table-2026)
 */

import {
  KENPO_GRADES,
  PENSION_GRADES,
  BONUS_LIMITS,
} from '../rules/standardRemunerationTable.js';

/**
 * Tra cứu bậc chuẩn thù lao BHYT (健康保険 協会けんぽ: 1〜50等級)
 * @param {number} monthlySalary - Lương thực tế hàng tháng (円)
 * @returns {{ grade: number, standardMonthly: number, minSalary: number, maxSalary: number }}
 */
export function lookupKenpoGrade(monthlySalary = 0) {
  const salary = Math.max(0, Number(monthlySalary) || 0);

  // Trường hợp dưới mức tối thiểu cấp 1
  if (salary < KENPO_GRADES[0].maxSalary) {
    return KENPO_GRADES[0];
  }

  // Trường hợp vượt mức tối đa cấp 50
  const lastGrade = KENPO_GRADES[KENPO_GRADES.length - 1];
  if (salary >= lastGrade.minSalary) {
    return lastGrade;
  }

  // Quét các bậc ở giữa
  const found = KENPO_GRADES.find(
    (g) => salary >= g.minSalary && salary < g.maxSalary
  );

  return found || lastGrade;
}

/**
 * Tra cứu bậc chuẩn thù lao Hưu trí phúc lợi (厚生年金: 1〜32等級)
 * @param {number} monthlySalary - Lương thực tế hàng tháng (円)
 * @returns {{ grade: number, standardMonthly: number, minSalary: number, maxSalary: number, isCapped: boolean }}
 */
export function lookupPensionGrade(monthlySalary = 0) {
  const salary = Math.max(0, Number(monthlySalary) || 0);

  // Trường hợp dưới 93,000円 (Cấp 1)
  if (salary < PENSION_GRADES[0].maxSalary) {
    return { ...PENSION_GRADES[0], isCapped: false };
  }

  // Trường hợp từ 635,000円 trở lên (Cấp 32 - chạm trần)
  const lastGrade = PENSION_GRADES[PENSION_GRADES.length - 1];
  if (salary >= lastGrade.minSalary) {
    return { ...lastGrade, isCapped: true };
  }

  const found = PENSION_GRADES.find(
    (g) => salary >= g.minSalary && salary < g.maxSalary
  );

  return { ...(found || lastGrade), isCapped: false };
}

/**
 * Xác định tiền thưởng chuẩn (標準賞与額)
 * - Cắt bỏ phần lẻ dưới 1,000円
 * - Kenpo: trần tích lũy 5,730,000円/năm tài chính (01/04 - 31/03)
 * - Pension: trần 1,500,000円 cho mỗi lần chi trả
 * @param {object} params
 * @param {number} params.actualBonus - Tiền thưởng thực tế (円)
 * @param {number} [params.previousBonusesInFiscalYear=0] - Tổng thưởng chuẩn Kenpo đã nhận trong năm tài chính
 * @returns {{ rawBonus: number, roundedBonus: number, kenpoStandardBonus: number, pensionStandardBonus: number }}
 */
export function calculateStandardBonus({ actualBonus = 0, previousBonusesInFiscalYear = 0 }) {
  const rawBonus = Math.max(0, Number(actualBonus) || 0);
  if (rawBonus === 0) {
    return {
      rawBonus: 0,
      roundedBonus: 0,
      kenpoStandardBonus: 0,
      pensionStandardBonus: 0,
    };
  }

  // 1,000円未満切り捨て
  const roundedBonus = Math.floor(rawBonus / BONUS_LIMITS.roundingUnit) * BONUS_LIMITS.roundingUnit;

  // Trần Kenpo: 5,730,000円/năm
  const prevKenpo = Math.max(0, Number(previousBonusesInFiscalYear) || 0);
  const remainingKenpoCap = Math.max(0, BONUS_LIMITS.kenpoAnnualCap - prevKenpo);
  const kenpoStandardBonus = Math.min(roundedBonus, remainingKenpoCap);

  // Trần Pension: 1,500,000円/lần
  const pensionStandardBonus = Math.min(roundedBonus, BONUS_LIMITS.pensionPerPaymentCap);

  return {
    rawBonus,
    roundedBonus,
    kenpoStandardBonus,
    pensionStandardBonus,
  };
}

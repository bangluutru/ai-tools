/**
 * @file packages/core/src/japan/insurance/rules/standardRemunerationTable.js
 * @description Bảng quy chuẩn phân cấp bậc chuẩn thù lao hàng tháng (標準報酬月額等級表).
 * - 健康保険 (協会けんぽ): 1〜50等級 (58,000円 〜 1,390,000円)
 * - 厚生年金保険: 1〜32等級 (88,000円 〜 650,000円)
 * Nguồn chính thức:
 * - 全国健康保険協会 (kyokai-kenpo-monthly-table-2026)
 * - 日本年金機構 (jps-welfare-pension-table-2026)
 */

import { defineRuleMetadata } from '../../../regulatory/ruleMetadata.js';
import { JAPAN_JURISDICTION } from '../../../regulatory/jurisdiction.js';
import { createApplicablePeriod } from '../../../regulatory/effectivePeriod.js';

export const KENPO_STANDARD_REMUNERATION_METADATA = defineRuleMetadata({
  id: 'jp-kenpo-standard-remuneration-table-2026',
  jurisdiction: JAPAN_JURISDICTION,
  sourceId: 'kyokai-kenpo-monthly-table-2026',
  effectiveFrom: '2026-04-01',
  applicablePeriod: createApplicablePeriod('fiscal-year', 2026, 2026),
  version: '2026.1',
  lastVerifiedAt: '2026-09-10',
  status: 'verified',
  notes: 'Bảng bậc lương chuẩn BHYT 協会けんぽ 50 cấp bậc từ 58,000円 đến 1,390,000円.',
});

export const PENSION_STANDARD_REMUNERATION_METADATA = defineRuleMetadata({
  id: 'jp-pension-standard-remuneration-table-2026',
  jurisdiction: JAPAN_JURISDICTION,
  sourceId: 'jps-welfare-pension-table-2026',
  effectiveFrom: '2026-04-01',
  applicablePeriod: createApplicablePeriod('fiscal-year', 2026, 2026),
  version: '2026.1',
  lastVerifiedAt: '2026-09-10',
  status: 'verified',
  notes: 'Bảng bậc lương chuẩn Hưu trí phúc lợi 厚生年金 32 cấp bậc từ 88,000円 đến 650,000円.',
});

/**
 * Danh sách 50 cấp bậc chuẩn thù lao tháng của BHYT (健康保険)
 * Mỗi phần tử gồm:
 * - grade: Bậc (1 - 50)
 * - standardMonthly: Mức thù lao chuẩn (円)
 * - minSalary: Ngưỡng lương thực tế tối thiểu (bao gồm >=)
 * - maxSalary: Ngưỡng lương thực tế tối đa (không bao gồm <)
 */
export const KENPO_GRADES = Object.freeze([
  { grade: 1, standardMonthly: 58000, minSalary: 0, maxSalary: 63000 },
  { grade: 2, standardMonthly: 68000, minSalary: 63000, maxSalary: 73000 },
  { grade: 3, standardMonthly: 78000, minSalary: 73000, maxSalary: 83000 },
  { grade: 4, standardMonthly: 88000, minSalary: 83000, maxSalary: 93000 },
  { grade: 5, standardMonthly: 98000, minSalary: 93000, maxSalary: 101000 },
  { grade: 6, standardMonthly: 104000, minSalary: 101000, maxSalary: 107000 },
  { grade: 7, standardMonthly: 110000, minSalary: 107000, maxSalary: 115000 },
  { grade: 8, standardMonthly: 118000, minSalary: 115000, maxSalary: 123500 },
  { grade: 9, standardMonthly: 126000, minSalary: 123500, maxSalary: 131500 },
  { grade: 10, standardMonthly: 134000, minSalary: 131500, maxSalary: 139500 },
  { grade: 11, standardMonthly: 142000, minSalary: 139500, maxSalary: 147500 },
  { grade: 12, standardMonthly: 150000, minSalary: 147500, maxSalary: 155000 },
  { grade: 13, standardMonthly: 160000, minSalary: 155000, maxSalary: 165000 },
  { grade: 14, standardMonthly: 170000, minSalary: 165000, maxSalary: 175000 },
  { grade: 15, standardMonthly: 180000, minSalary: 175000, maxSalary: 185000 },
  { grade: 16, standardMonthly: 190000, minSalary: 185000, maxSalary: 195000 },
  { grade: 17, standardMonthly: 200000, minSalary: 195000, maxSalary: 210000 },
  { grade: 18, standardMonthly: 220000, minSalary: 210000, maxSalary: 230000 },
  { grade: 19, standardMonthly: 240000, minSalary: 230000, maxSalary: 250000 },
  { grade: 20, standardMonthly: 260000, minSalary: 250000, maxSalary: 270000 },
  { grade: 21, standardMonthly: 280000, minSalary: 270000, maxSalary: 290000 },
  { grade: 22, standardMonthly: 300000, minSalary: 290000, maxSalary: 310000 },
  { grade: 23, standardMonthly: 320000, minSalary: 310000, maxSalary: 330000 },
  { grade: 24, standardMonthly: 340000, minSalary: 330000, maxSalary: 350000 },
  { grade: 25, standardMonthly: 360000, minSalary: 350000, maxSalary: 370000 },
  { grade: 26, standardMonthly: 380000, minSalary: 370000, maxSalary: 395000 },
  { grade: 27, standardMonthly: 410000, minSalary: 395000, maxSalary: 425000 },
  { grade: 28, standardMonthly: 440000, minSalary: 425000, maxSalary: 455000 },
  { grade: 29, standardMonthly: 470000, minSalary: 455000, maxSalary: 485000 },
  { grade: 30, standardMonthly: 500000, minSalary: 485000, maxSalary: 515000 },
  { grade: 31, standardMonthly: 530000, minSalary: 515000, maxSalary: 545000 },
  { grade: 32, standardMonthly: 560000, minSalary: 545000, maxSalary: 575000 },
  { grade: 33, standardMonthly: 590000, minSalary: 575000, maxSalary: 605000 },
  { grade: 34, standardMonthly: 620000, minSalary: 605000, maxSalary: 635000 },
  { grade: 35, standardMonthly: 650000, minSalary: 635000, maxSalary: 665000 },
  { grade: 36, standardMonthly: 680000, minSalary: 665000, maxSalary: 695000 },
  { grade: 37, standardMonthly: 710000, minSalary: 695000, maxSalary: 730000 },
  { grade: 38, standardMonthly: 750000, minSalary: 730000, maxSalary: 770000 },
  { grade: 39, standardMonthly: 790000, minSalary: 770000, maxSalary: 810000 },
  { grade: 40, standardMonthly: 830000, minSalary: 810000, maxSalary: 855000 },
  { grade: 41, standardMonthly: 880000, minSalary: 855000, maxSalary: 905000 },
  { grade: 42, standardMonthly: 930000, minSalary: 905000, maxSalary: 955000 },
  { grade: 43, standardMonthly: 980000, minSalary: 955000, maxSalary: 1005000 },
  { grade: 44, standardMonthly: 1030000, minSalary: 1005000, maxSalary: 1055000 },
  { grade: 45, standardMonthly: 1090000, minSalary: 1055000, maxSalary: 1115000 },
  { grade: 46, standardMonthly: 1150000, minSalary: 1115000, maxSalary: 1175000 },
  { grade: 47, standardMonthly: 1210000, minSalary: 1175000, maxSalary: 1235000 },
  { grade: 48, standardMonthly: 1270000, minSalary: 1235000, maxSalary: 1295000 },
  { grade: 49, standardMonthly: 1330000, minSalary: 1295000, maxSalary: 1355000 },
  { grade: 50, standardMonthly: 1390000, minSalary: 1355000, maxSalary: Infinity },
]);

/**
 * Danh sách 32 cấp bậc chuẩn thù lao tháng của Hưu trí phúc lợi (厚生年金)
 * Cấp 1 tương ứng Cấp 4 của Kenpo (chuẩn 88,000円 cho lương < 93,000円)
 * Cấp 32 tương ứng Cấp 35 của Kenpo (chuẩn 650,000円 cho lương >= 635,000円, kịch trần)
 */
export const PENSION_GRADES = Object.freeze([
  { grade: 1, kenpoGrade: 4, standardMonthly: 88000, minSalary: 0, maxSalary: 93000 },
  { grade: 2, kenpoGrade: 5, standardMonthly: 98000, minSalary: 93000, maxSalary: 101000 },
  { grade: 3, kenpoGrade: 6, standardMonthly: 104000, minSalary: 101000, maxSalary: 107000 },
  { grade: 4, kenpoGrade: 7, standardMonthly: 110000, minSalary: 107000, maxSalary: 115000 },
  { grade: 5, kenpoGrade: 8, standardMonthly: 118000, minSalary: 115000, maxSalary: 123500 },
  { grade: 6, kenpoGrade: 9, standardMonthly: 126000, minSalary: 123500, maxSalary: 131500 },
  { grade: 7, kenpoGrade: 10, standardMonthly: 134000, minSalary: 131500, maxSalary: 139500 },
  { grade: 8, kenpoGrade: 11, standardMonthly: 142000, minSalary: 139500, maxSalary: 147500 },
  { grade: 9, kenpoGrade: 12, standardMonthly: 150000, minSalary: 147500, maxSalary: 155000 },
  { grade: 10, kenpoGrade: 13, standardMonthly: 160000, minSalary: 155000, maxSalary: 165000 },
  { grade: 11, kenpoGrade: 14, standardMonthly: 170000, minSalary: 165000, maxSalary: 175000 },
  { grade: 12, kenpoGrade: 15, standardMonthly: 180000, minSalary: 175000, maxSalary: 185000 },
  { grade: 13, kenpoGrade: 16, standardMonthly: 190000, minSalary: 185000, maxSalary: 195000 },
  { grade: 14, kenpoGrade: 17, standardMonthly: 200000, minSalary: 195000, maxSalary: 210000 },
  { grade: 15, kenpoGrade: 18, standardMonthly: 220000, minSalary: 210000, maxSalary: 230000 },
  { grade: 16, kenpoGrade: 19, standardMonthly: 240000, minSalary: 230000, maxSalary: 250000 },
  { grade: 17, kenpoGrade: 20, standardMonthly: 260000, minSalary: 250000, maxSalary: 270000 },
  { grade: 18, kenpoGrade: 21, standardMonthly: 280000, minSalary: 270000, maxSalary: 290000 },
  { grade: 19, kenpoGrade: 22, standardMonthly: 300000, minSalary: 290000, maxSalary: 310000 },
  { grade: 20, kenpoGrade: 23, standardMonthly: 320000, minSalary: 310000, maxSalary: 330000 },
  { grade: 21, kenpoGrade: 24, standardMonthly: 340000, minSalary: 330000, maxSalary: 350000 },
  { grade: 22, kenpoGrade: 25, standardMonthly: 360000, minSalary: 350000, maxSalary: 370000 },
  { grade: 23, kenpoGrade: 26, standardMonthly: 380000, minSalary: 370000, maxSalary: 395000 },
  { grade: 24, kenpoGrade: 27, standardMonthly: 410000, minSalary: 395000, maxSalary: 425000 },
  { grade: 25, kenpoGrade: 28, standardMonthly: 440000, minSalary: 425000, maxSalary: 455000 },
  { grade: 26, kenpoGrade: 29, standardMonthly: 470000, minSalary: 455000, maxSalary: 485000 },
  { grade: 27, kenpoGrade: 30, standardMonthly: 500000, minSalary: 485000, maxSalary: 515000 },
  { grade: 28, kenpoGrade: 31, standardMonthly: 530000, minSalary: 515000, maxSalary: 545000 },
  { grade: 29, kenpoGrade: 32, standardMonthly: 560000, minSalary: 545000, maxSalary: 575000 },
  { grade: 30, kenpoGrade: 33, standardMonthly: 590000, minSalary: 575000, maxSalary: 605000 },
  { grade: 31, kenpoGrade: 34, standardMonthly: 620000, minSalary: 605000, maxSalary: 635000 },
  { grade: 32, kenpoGrade: 35, standardMonthly: 650000, minSalary: 635000, maxSalary: Infinity },
]);

/**
 * Giới hạn thưởng chuẩn (標準賞与額):
 * - Kenpo: Trần tích lũy 5,730,000円/năm tài chính (01/04 - 31/03)
 * - Pension: Trần 1,500,000円 cho mỗi lần chi trả thưởng
 * - Cả hai đều cắt bỏ phần lẻ dưới 1,000円 (1,000円未満切り捨て)
 */
export const BONUS_LIMITS = Object.freeze({
  kenpoAnnualCap: 5730000,
  pensionPerPaymentCap: 1500000,
  roundingUnit: 1000,
});

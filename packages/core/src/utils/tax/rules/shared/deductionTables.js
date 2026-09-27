/**
 * @file packages/core/src/utils/tax/rules/shared/deductionTables.js
 * @description Bảng khấu trừ gia cảnh dùng chung giữa các năm (配偶者控除・配偶者特別控除・扶養控除)
 * và các hằng số thuế cư trú (住民税) theo 地方税法.
 *
 * Nguồn:
 * - 国税庁 No.1191 配偶者控除 / No.1195 配偶者特別控除 / No.1180 扶養控除
 * - 地方税法 第34条・第314条の2 (人的控除額), 第37条・第314条の6 (調整控除)
 * - 総務省 個人住民税 (均等割 道府県民税1,000円＋市町村民税3,000円, 森林環境税1,000円)
 */

/**
 * 配偶者特別控除（所得税）: bảng theo 合計所得 của vợ/chồng × 合計所得 người nộp thuế
 * Cột: [≤900万, ≤950万, ≤1,000万]. Mức trên của từng dòng (maxSpouseIncome).
 * Dòng đầu (≤95万) có mức dưới = spouseIncomeLimit của năm (R7: 58万, R8: 62万).
 */
const SPOUSE_SPECIAL_INCOME_TAX_ROWS = [
  { maxSpouseIncome: 950000, amounts: [380000, 260000, 130000] },
  { maxSpouseIncome: 1000000, amounts: [360000, 240000, 120000] },
  { maxSpouseIncome: 1050000, amounts: [310000, 210000, 110000] },
  { maxSpouseIncome: 1100000, amounts: [260000, 180000, 90000] },
  { maxSpouseIncome: 1150000, amounts: [210000, 140000, 70000] },
  { maxSpouseIncome: 1200000, amounts: [160000, 110000, 60000] },
  { maxSpouseIncome: 1250000, amounts: [110000, 80000, 40000] },
  { maxSpouseIncome: 1300000, amounts: [60000, 40000, 20000] },
  { maxSpouseIncome: 1330000, amounts: [30000, 20000, 10000] },
];

/**
 * 配偶者特別控除（住民税）: 地方税法 第314条の2第1項第10号の2
 * Mức tối đa 33万円; dòng đầu kéo dài tới 100万円.
 */
const SPOUSE_SPECIAL_RESIDENT_TAX_ROWS = [
  { maxSpouseIncome: 1000000, amounts: [330000, 220000, 110000] },
  { maxSpouseIncome: 1050000, amounts: [310000, 210000, 110000] },
  { maxSpouseIncome: 1100000, amounts: [260000, 180000, 90000] },
  { maxSpouseIncome: 1150000, amounts: [210000, 140000, 70000] },
  { maxSpouseIncome: 1200000, amounts: [160000, 110000, 60000] },
  { maxSpouseIncome: 1250000, amounts: [110000, 80000, 40000] },
  { maxSpouseIncome: 1300000, amounts: [60000, 40000, 20000] },
  { maxSpouseIncome: 1330000, amounts: [30000, 20000, 10000] },
];

/** 配偶者控除: [≤900万, ≤950万, ≤1,000万] theo 合計所得 người nộp thuế */
const SPOUSE_DEDUCTION_INCOME_TAX = { general: [380000, 260000, 130000], elderly: [480000, 320000, 160000] };
const SPOUSE_DEDUCTION_RESIDENT_TAX = { general: [330000, 220000, 110000], elderly: [380000, 260000, 130000] };

/**
 * Tạo cấu trúc khấu trừ gia cảnh cho một năm thuế.
 * @param {{ spouseIncomeLimit: number, dependentIncomeLimit: number }} params
 */
export function buildSpouseDeductionRules({ spouseIncomeLimit, dependentIncomeLimit }) {
  return Object.freeze({
    // Giữ các khoá cũ để tương thích (mức tối đa)
    spouseStandard: 380000, // 配偶者控除 (người nộp thuế 合計所得 ≤900万円)
    dependentGeneral: 380000, // 一般の控除対象扶養親族 (16歳以上)
    dependentSpecific: 630000, // 特定扶養親族 (19歳以上23歳未満)
    dependentElderlyCohabitant: 580000, // 同居老親等 (70歳以上)
    dependentElderlyOther: 480000, // 老人扶養親族 (同居老親等以外)
    spouseIncomeLimit, // 控除対象配偶者の合計所得要件
    dependentIncomeLimit, // 扶養親族の合計所得要件
    spouseSpecialMaxIncome: 1330000, // 配偶者特別控除の上限 (配偶者の合計所得133万円以下)
    taxpayerIncomeBands: [9000000, 9500000, 10000000], // 納税者本人の合計所得金額
    spouseDeduction: SPOUSE_DEDUCTION_INCOME_TAX,
    spouseSpecialRows: SPOUSE_SPECIAL_INCOME_TAX_ROWS,
    resident: Object.freeze({
      spouseDeduction: SPOUSE_DEDUCTION_RESIDENT_TAX,
      spouseSpecialRows: SPOUSE_SPECIAL_RESIDENT_TAX_ROWS,
      dependentGeneral: 330000,
      dependentSpecific: 450000,
      dependentElderlyCohabitant: 450000,
      dependentElderlyOther: 380000,
    }),
  });
}

/**
 * 人的控除額の差 (地方税法 第37条 / 第314条の6 調整控除) — số tiền cố định theo luật.
 */
export const PERSONAL_DEDUCTION_DIFFERENCES = Object.freeze({
  basic: 50000,
  spouseGeneral: 50000,
  spouseElderly: 100000,
  dependentGeneral: 50000,
  dependentSpecific: 180000,
  dependentElderlyOther: 100000,
  dependentElderlyCohabitant: 130000,
  // 配偶者特別控除: 配偶者の合計所得 ~50万未満 5万円, ~55万未満 3万円, それ以上 0 (không mô phỏng chi tiết)
});

/** Thuế cư trú chuẩn (dùng chung 2025/2026) */
export const RESIDENT_TAX_COMMON = Object.freeze({
  sourceId: 'soumu-resident-tax-std',
  standardIncomeLevy: 0.10, // 所得割 10% (道府県民税4% + 市町村民税6%)
  basicDeductionResident: 430000, // 住民税の基礎控除 (合計所得2,400万円以下)
  // 均等割 標準税率: 道府県民税 1,000円 + 市町村民税 3,000円 (復興特別税の上乗せは令和5年度で終了)
  perCapitaPrefectureStandard: 1000,
  perCapitaMunicipalStandard: 3000,
  perCapitaFlatStandard: 4000,
  forestryTax: 1000, // 森林環境税 (国税, 令和6年度〜)
  // 調整控除: 5% (道府県民税2% + 市町村民税3%; 指定都市は1%+4%)
  adjustmentCredit: { rate: 0.05, prefectureShare: 0.02, municipalShare: 0.03, minimum: 2500, thresholdTaxable: 2000000, maxTotalIncome: 25000000 },
  // 非課税基準 (1級地: 東京23区・政令市等). 2級地・3級地は金額が低くなります。
  nonTaxable: {
    perPerson: 350000,
    base: 100000,
    incomeLevyDependentAddition: 320000, // 所得割: 扶養ありの場合 +32万円
    perCapitaDependentAddition: 210000, // 均等割: 扶養ありの場合 +21万円
    singleLimit: 450000,
    gradeNote_ja: '非課税基準は1級地（東京23区・政令指定都市等）の金額です。2級地・3級地では基準額が低くなります。',
    gradeNote_vi: 'Ngưỡng miễn thuế dùng mức của khu vực cấp 1 (23 quận Tokyo, thành phố chỉ định...). Khu vực cấp 2/3 có ngưỡng thấp hơn.',
    gradeNote_en: 'Non-taxable thresholds use Grade-1 areas (Tokyo 23 wards, designated cities). Grade 2/3 areas have lower thresholds.',
  },
});

/**
 * Lookup helper: chỉ số cột theo 合計所得 người nộp thuế (0,1,2) hoặc -1 nếu >1,000万円.
 */
export function taxpayerBandIndex(totalIncome, bands = [9000000, 9500000, 10000000]) {
  for (let i = 0; i < bands.length; i += 1) {
    if (totalIncome <= bands[i]) return i;
  }
  return -1;
}

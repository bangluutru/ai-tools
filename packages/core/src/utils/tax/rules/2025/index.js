/**
 * @file packages/core/src/utils/tax/rules/2025/index.js
 * @description Bộ quy tắc thuế Nhật Bản năm tài chính 2025 (令和7年分).
 */

import { buildSpouseDeductionRules, RESIDENT_TAX_COMMON } from '../shared/deductionTables.js';

const DEDUCTIONS_2025 = buildSpouseDeductionRules({
  // 国税庁 No.1191 / No.1195 / No.1180（令和7年分）
  spouseIncomeLimit: 580000, // 配偶者・扶養親族の合計所得要件 58万円以下（給与のみなら123万円以下）
  dependentIncomeLimit: 580000,
});

export const Rules2025 = {
  year: 2025,
  fiscalEra: '令和7年分',
  status: 'active',
  effectiveFrom: '2025-01-01',
  effectiveTo: '2025-12-31',
  verifiedDate: '2026-09-10',
  officialSource: '国税庁 所得税法・令和7年度税制改正',
  sourceUrl: 'https://www.nta.go.jp/taxes/shiraberu/taxanswer/shotoku/2260.htm',
  notes_ja: '基礎控除は合計所得に応じ95万〜58万円（132万円以下95万円、336万円以下88万円、489万円以下68万円、655万円以下63万円、2,350万円以下58万円）。給与所得控除の最低保障65万円（190万円まで）。インボイス2割特例適用中。',
  notes_vi: 'Giảm trừ cơ bản bậc thang theo tổng thu nhập: 95 vạn (≤132 vạn), 88 vạn (≤336 vạn), 68 vạn (≤489 vạn), 63 vạn (≤655 vạn), 58 vạn (≤2,350 vạn). Mức sàn giảm trừ tiền lương 65 vạn yên (lương ≤190 vạn). Áp dụng đặc lệ 20% Invoice.',
  notes_en: 'FY2025 rules: tiered basic deduction by total income (950k ≤1.32M, 880k ≤3.36M, 680k ≤4.89M, 630k ≤6.55M, 580k ≤23.5M). Employment income deduction minimum 650k (salary ≤1.9M). Invoice 20% special treatment active.',

  // 1. 所得税 (Income Tax)
  incomeTax: {
    // Biểu thuế lũy tiến 7 bậc (所得税の速算表) - 国税庁 No.2260
    brackets: [
      { limit: 1949000, rate: 0.05, deduction: 0 },
      { limit: 3299000, rate: 0.10, deduction: 97500 },
      { limit: 6949000, rate: 0.20, deduction: 427500 },
      { limit: 8999000, rate: 0.23, deduction: 636000 },
      { limit: 17999000, rate: 0.33, deduction: 1536000 },
      { limit: 39999000, rate: 0.40, deduction: 2796000 },
      { limit: Infinity, rate: 0.45, deduction: 4796000 },
    ],
    // Thuế tái thiết 復興特別所得税
    reconstructionTaxRate: 0.021,

    // 基礎控除 (Basic Deduction)
    basicDeduction: {
      // 国税庁 No.1199（令和7年分）
      standard: 950000,
      phases: [
        { maxTotalIncome: 1320000, amount: 950000 },
        { maxTotalIncome: 3360000, amount: 880000 },
        { maxTotalIncome: 4890000, amount: 680000 },
        { maxTotalIncome: 6550000, amount: 630000 },
        { maxTotalIncome: 23500000, amount: 580000 },
        { maxTotalIncome: 24000000, amount: 480000 },
        { maxTotalIncome: 24500000, amount: 320000 },
        { maxTotalIncome: 25000000, amount: 160000 },
        { maxTotalIncome: Infinity, amount: 0 },
      ],
    },

    // 給与所得控除 (Employment Income Deduction - 国税庁 No.1410 令和7年分)
    employmentDeduction: {
      minGuarantee: 650000,
      maxDeduction: 1950000, // Tối đa khi lương > 850万円
      calc(salary) {
        const s = Math.max(0, salary);
        if (s <= 1900000) return 650000;
        if (s <= 3600000) return Math.floor(s * 0.3 + 80000);
        if (s <= 6600000) return Math.floor(s * 0.2 + 440000);
        if (s <= 8500000) return Math.floor(s * 0.1 + 1100000);
        return 1950000;
      },
    },

    // Khấu trừ người phụ thuộc & gia cảnh
    deductions: DEDUCTIONS_2025,

    // Khấu trừ khai thuế xanh 青色申告特別控除
    blueReturnDeduction: {
      eTaxFull: 650000,   // Sổ kép + nộp qua e-Tax hoặc lưu trữ điện tử
      paperFull: 550000,  // Sổ kép + nộp giấy
      simplified: 100000, // Sổ đơn giản
      white: 0,
    },
  },

  // 2. 住民税 (Resident Tax)
  residentTax: RESIDENT_TAX_COMMON,

  // 社会保険料の年度別料率 (tham chiếu cho bảng kê / mô tả; engine tính theo tháng qua japan/insurance)
  socialInsurance: {
    isRatesByMonth: true,
    employmentInsurance: {
      sourceId: 'mhlw-employment-rate-2025',
      effectiveFrom: '2025-04-01',
      effectiveTo: '2026-03-31',
      categories: {
        general: { name: '一般の事業', employeeRate: 0.0055, employerRate: 0.009, totalRate: 0.0145 },
        agriculture_forestry_sake: { name: '農林水産・清酒製造の事業', employeeRate: 0.0065, employerRate: 0.01, totalRate: 0.0165 },
        construction: { name: '建設の事業', employeeRate: 0.0065, employerRate: 0.011, totalRate: 0.0175 },
      },
      employeeRate: 0.0055,
    },
    careInsurance: { totalRate: 0.0159, employeeRate: 0.00795, employerRate: 0.00795, minAge: 40, maxAge: 64, effectiveFromMonth: '2025-03' },
    childSupportContribution: { totalRate: 0, employeeRate: 0, employerRate: 0, effectiveFrom: '2026-04-01' },
    welfarePension: { totalRate: 0.183, employeeRate: 0.0915, employerRate: 0.0915, maxStandardMonthlyRemuneration: 650000 },
    nationalPension: { monthlyPremium: 17510, effectiveFrom: '2025-04-01', effectiveTo: '2026-03-31', previousMonthlyPremium: 16980 },
  },

  // 3. 個人事業税 (Individual Enterprise Tax)
  enterpriseTax: {
    proprietorDeductionAnnual: 2900000, // 290万円/năm
    rates: {
      type1: 0.05, // 37 ngành (bán lẻ, ăn uống, sản xuất, vận tải, thiết kế...)
      type2: 0.04, // Nông thủy sản, chăn nuôi
      type3_standard: 0.05, // Bác sĩ, luật sư, tư vấn, IT freelancer chịu thuế
      type3_reduced: 0.03,  // Bà đỡ, xoa bóp bấm huyệt
      nonTaxable: 0.0,      // Tác giả, họa sĩ, dịch giả thuần túy
    },
  },

  // 4. 消費税 (Consumption Tax)
  consumptionTax: {
    standardRate: 0.10,
    reducedRate: 0.08,
    thresholdSales: 10000000, // 1,000万円
    simplifiedMaxSales: 50000000, // 5,000万円
    // Tỷ lệ khấu trừ mua vào danh nghĩa 簡易課税 みなし仕入率
    deemedPurchaseRates: {
      type1_wholesale: 0.90,
      type2_retail: 0.80,
      type3_manufacturing: 0.70,
      type4_dining_other: 0.60,
      type5_service_it: 0.50,
      type6_realestate: 0.40,
    },
    // Đặc lệ 20% cho người mới đăng ký Invoice
    special20PercentRule: {
      available: true,
      rate: 0.20, // Số thuế phải nộp = Thuế đầu ra * 20%
    },
  },

  // 5. 法人税系 (Corporate Taxes) - Doanh nghiệp vừa và nhỏ (Vốn <= 100M yên)
  corporateTax: {
    nationalRateBelow8M: 0.15, // Dưới 800万: 15%
    nationalRateAbove8M: 0.232, // Trên 800万: 23.2%
    localCorporateTaxRate: 0.103, // 地方法人税 = 法人税額 * 10.3%
    residentTaxInhabitantRate: 0.07, // 法人住民税 法人税割 ~7.0%
    residentPerCapitaMin: 70000, // 法人住民税 均等割 tối thiểu 70,000円 (vốn <= 10M, <= 50 người)
    enterpriseTaxIncomeRates: [
      { limit: 4000000, rate: 0.035 },
      { limit: 8000000, rate: 0.053 },
      { limit: Infinity, rate: 0.070 },
    ],
    specialEnterpriseTaxRate: 0.37, // 特別法人事業税 = 法人事業税所得割 * 37%
  },
};

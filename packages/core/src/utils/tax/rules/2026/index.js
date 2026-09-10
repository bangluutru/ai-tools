/**
 * @file packages/core/src/utils/tax/rules/2026/index.js
 * @description Bộ quy tắc thuế Nhật Bản năm tài chính 2026 (令和8年分).
 */

export const Rules2026 = {
  year: 2026,
  fiscalEra: '令和8年分',
  status: 'active',
  effectiveFrom: '2026-01-01',
  effectiveTo: '2026-12-31',
  verifiedDate: '2026-09-10',
  officialSource: '国税庁 所得税法・令和8年度税制改正（いわゆる「178万円の壁」税制改正反映）',
  sourceUrl: 'https://www.nta.go.jp/taxes/shiraberu/taxanswer/shotoku/2260.htm',
  notes_ja: '基礎控除104万円（本則62万＋特例42万）、給与所得控除最低保障74万円により「178万円の壁」に対応。インボイス2割特例は2026年9月末まで。',
  notes_vi: 'Áp dụng mức giảm trừ cơ bản 104 vạn yên (chính thức 62 vạn + đặc lệ 42 vạn) và mức sàn giảm trừ tiền lương 74 vạn yên (tương đương bức tường 178 vạn yên). Đặc lệ 20% Invoice áp dụng đến hết tháng 9/2026.',
  notes_en: 'Fiscal Year 2026 rules: Basic deduction 1.04M JPY, Min employment deduction 740k JPY (1.78M wall). Invoice 20% special treatment expires end of Sept 2026.',

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
    // Thuế tái thiết 復興特別所得税 (2.1%)
    reconstructionTaxRate: 0.021,

    // 基礎控除 (Basic Deduction 2026)
    basicDeduction: {
      standard: 1040000, // 104万円 (Bản tắc 62万 + Đặc lệ 42万)
      phases: [
        { maxTotalIncome: 1320000, amount: 1040000 },
        { maxTotalIncome: 24000000, amount: 620000 },
        { maxTotalIncome: 24500000, amount: 410000 },
        { maxTotalIncome: 25000000, amount: 210000 },
        { maxTotalIncome: Infinity, amount: 0 },
      ],
    },

    // 給与所得控除 (Employment Income Deduction 2026)
    employmentDeduction: {
      minGuarantee: 740000, // Mức bảo đảm tối thiểu nâng lên 74万円
      maxDeduction: 1950000,
      calc(salary) {
        const s = Math.max(0, salary);
        if (s <= 1625000) return 740000;
        if (s <= 1800000) return Math.floor(s * 0.4 - 10000);
        if (s <= 3600000) return Math.floor(s * 0.3 + 170000);
        if (s <= 6600000) return Math.floor(s * 0.2 + 530000);
        if (s <= 8500000) return Math.floor(s * 0.1 + 1190000);
        return 1950000;
      },
    },

    // Khấu trừ người phụ thuộc & gia cảnh
    deductions: {
      spouseStandard: 380000,
      dependentGeneral: 380000,
      dependentSpecific: 630000,
      dependentElderlyCohabitant: 580000,
      dependentElderlyOther: 480000,
    },

    // Khấu trừ khai thuế xanh 青色申告特別控除
    blueReturnDeduction: {
      eTaxFull: 650000,
      paperFull: 550000,
      simplified: 100000,
      white: 0,
    },
  },

  // 2. 住民税 (Resident Tax)
  residentTax: {
    standardIncomeLevy: 0.10,
    basicDeductionResident: 430000,
    perCapitaFlatStandard: 5000,
    forestryTax: 1000,
  },

  // 3. 個人事業税 (Individual Enterprise Tax)
  enterpriseTax: {
    proprietorDeductionAnnual: 2900000,
    rates: {
      type1: 0.05,
      type2: 0.04,
      type3_standard: 0.05,
      type3_reduced: 0.03,
      nonTaxable: 0.0,
    },
  },

  // 4. 消費税 (Consumption Tax)
  consumptionTax: {
    standardRate: 0.10,
    reducedRate: 0.08,
    thresholdSales: 10000000,
    simplifiedMaxSales: 50000000,
    deemedPurchaseRates: {
      type1_wholesale: 0.90,
      type2_retail: 0.80,
      type3_manufacturing: 0.70,
      type4_dining_other: 0.60,
      type5_service_it: 0.50,
      type6_realestate: 0.40,
    },
    special20PercentRule: {
      available: true,
      expiresDate: '2026-09-30',
      rate: 0.20,
    },
  },

  // 5. 法人税系 (Corporate Taxes) - Doanh nghiệp vừa và nhỏ (Vốn <= 100M yên)
  corporateTax: {
    nationalRateBelow8M: 0.15,
    nationalRateAbove8M: 0.232,
    localCorporateTaxRate: 0.103,
    residentTaxInhabitantRate: 0.07,
    residentPerCapitaMin: 70000,
    enterpriseTaxIncomeRates: [
      { limit: 4000000, rate: 0.035 },
      { limit: 8000000, rate: 0.053 },
      { limit: Infinity, rate: 0.070 },
    ],
    specialEnterpriseTaxRate: 0.37,
  },
};

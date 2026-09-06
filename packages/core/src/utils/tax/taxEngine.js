/**
 * Tax Calculation Engine 2026 (Vietnam PIT & Social Insurance)
 * Căn cứ pháp lý:
 * - Luật Thuế TNCN số 109/2025/QH15 & Luật 09/2026/QH16
 * - Nghị quyết 110/2025/UBTVQH15 (Giảm trừ gia cảnh: 15.5tr bản thân, 6.2tr NPT)
 * - Nghị định 253/2026/NĐ-CP (Chi tiết giảm trừ Y tế, Giáo dục, Hưu trí, Tiền ăn ca 1.2tr)
 * - Thông tư 87/2026/TT-BTC (Ngưỡng vãng lai 5tr 10%, thu nhập NPT <= 3tr, phái sinh 0.1%)
 * - Nghị định 161/2026/NĐ-CP (Lương cơ sở 2.530.000 từ 01/07/2026 -> Trần BHXH/BHYT 50.6tr)
 * - Nghị định 293/2025/NĐ-CP (Lương tối thiểu 4 vùng áp dụng trần BHTN)
 * - Nghị định 141/2026/NĐ-CP (Ngưỡng miễn thuế HKD/CNKD 1 tỷ/năm, bãi bỏ thuế khoán)
 */

export const TAX_CONSTANTS_2026 = {
  BASE_SALARY: 2_530_000, // Lương cơ sở từ 01/07/2026
  MAX_BHXH_BHYT_SALARY: 2_530_000 * 20, // 50.600.000 VNĐ

  // Tỷ lệ bảo hiểm người lao động đóng
  RATES: {
    BHXH: 0.08,  // 8%
    BHYT: 0.015, // 1.5%
    BHTN: 0.01,  // 1%
    TOTAL_INSURANCE: 0.105 // 10.5%
  },

  // Lương tối thiểu vùng và trần đóng BHTN (tối đa 20 lần lương tối thiểu vùng)
  REGIONS: {
    1: { name_vn: 'Vùng I (TP.HCM, Hà Nội...)', minWage: 5_310_000, maxBhtnSalary: 5_310_000 * 20 }, // 106.200.000
    2: { name_vn: 'Vùng II (Đô thị loại II, TP trực thuộc tỉnh)', minWage: 4_730_000, maxBhtnSalary: 4_730_000 * 20 }, // 94.600.000
    3: { name_vn: 'Vùng III (Huyện, thị xã ngoại ô)', minWage: 4_140_000, maxBhtnSalary: 4_140_000 * 20 }, // 82.800.000
    4: { name_vn: 'Vùng IV (Các địa bàn còn lại)', minWage: 3_700_000, maxBhtnSalary: 3_700_000 * 20 }  // 74.000.000
  },

  // Mức giảm trừ gia cảnh hàng tháng
  DEDUCTIONS: {
    PERSONAL: 15_500_000,      // 15.5 triệu/tháng (186 triệu/năm)
    DEPENDENT: 6_200_000,      // 6.2 triệu/tháng/người
    MAX_DEPENDENT_INCOME: 3_000_000, // Thu nhập tối đa của NPT để được giảm trừ
    MAX_VOLUNTARY_PENSION: 3_000_000, // Tối đa 3 triệu/tháng
    MAX_MEDICAL_ANNUAL: 23_000_000,   // Tối đa 23 triệu/năm
    MAX_EDUCATION_ANNUAL: 24_000_000, // Tối đa 24 triệu/năm
    MAX_NON_TAXABLE_MEAL: 1_200_000   // Tiền ăn ca miễn thuế tối đa 1.2 triệu/tháng
  },

  // Biểu thuế lũy tiến từng phần 5 bậc 2026
  BRACKETS_5_TIER: [
    { tier: 1, max: 10_000_000, rate: 0.05, label: 'Đến 10 triệu', stepMaxTax: 500_000 },
    { tier: 2, max: 30_000_000, rate: 0.10, label: 'Trên 10 đến 30 triệu', stepMaxTax: 2_000_000 },
    { tier: 3, max: 60_000_000, rate: 0.20, label: 'Trên 30 đến 60 triệu', stepMaxTax: 6_000_000 },
    { tier: 4, max: 100_000_000, rate: 0.30, label: 'Trên 60 đến 100 triệu', stepMaxTax: 12_000_000 },
    { tier: 5, max: Infinity, rate: 0.35, label: 'Trên 100 triệu', stepMaxTax: Infinity }
  ],

  // Ngưỡng thuế Hộ/Cá nhân kinh doanh & Freelancer
  FREELANCER: {
    TAX_EXEMPT_ANNUAL_THRESHOLD: 1_000_000_000, // 1 tỷ đồng/năm miễn toàn bộ thuế
    WITHHOLDING_MIN_TRANSACTION: 5_000_000,     // Từ 5 triệu đồng/lần trở lên mới khấu trừ 10%
    WITHHOLDING_RATE: 0.10                      // 10%
  }
};

/**
 * Tính chi tiết bảo hiểm bắt buộc theo vùng
 */
export function calculateInsurance(grossSalary, region = 1) {
  const regConfig = TAX_CONSTANTS_2026.REGIONS[region] || TAX_CONSTANTS_2026.REGIONS[1];
  
  const bhxhSalary = Math.min(Math.max(0, grossSalary), TAX_CONSTANTS_2026.MAX_BHXH_BHYT_SALARY);
  const bhtnSalary = Math.min(Math.max(0, grossSalary), regConfig.maxBhtnSalary);

  const bhxh = Math.round(bhxhSalary * TAX_CONSTANTS_2026.RATES.BHXH);
  const bhyt = Math.round(bhxhSalary * TAX_CONSTANTS_2026.RATES.BHYT);
  const bhtn = Math.round(bhtnSalary * TAX_CONSTANTS_2026.RATES.BHTN);

  return {
    bhxh,
    bhyt,
    bhtn,
    totalInsurance: bhxh + bhyt + bhtn,
    bhxhSalary,
    bhtnSalary,
    isBhxhCapped: grossSalary > TAX_CONSTANTS_2026.MAX_BHXH_BHYT_SALARY,
    isBhtnCapped: grossSalary > regConfig.maxBhtnSalary,
    regionConfig: regConfig
  };
}

/**
 * Tính thuế TNCN lũy tiến 5 bậc 2026 từ thu nhập tính thuế
 */
export function calculate5TierTax(taxableIncome) {
  if (!taxableIncome || taxableIncome <= 0) {
    return {
      totalTax: 0,
      breakdown: TAX_CONSTANTS_2026.BRACKETS_5_TIER.map(b => ({
        ...b,
        taxableAmount: 0,
        taxAmount: 0
      }))
    };
  }

  let remaining = taxableIncome;
  let prevLimit = 0;
  let totalTax = 0;

  const breakdown = TAX_CONSTANTS_2026.BRACKETS_5_TIER.map(bracket => {
    const tierRange = bracket.max - prevLimit;
    const amountInTier = Math.min(Math.max(0, remaining), tierRange);
    const taxInTier = Math.round(amountInTier * bracket.rate);

    totalTax += taxInTier;
    remaining = Math.max(0, remaining - amountInTier);
    prevLimit = bracket.max;

    return {
      ...bracket,
      taxableAmount: amountInTier,
      taxAmount: taxInTier
    };
  });

  return {
    totalTax,
    breakdown
  };
}

/**
 * Tính lương Gross sang Net
 */
export function calculateGrossToNet(gross, {
  region = 1,
  dependents = 0,
  voluntaryPension = 0,
  medicalMonthly = 0,
  educationMonthly = 0,
  mealAllowance = 0,
  otherNonTaxable = 0
} = {}) {
  const safeGross = Math.max(0, Number(gross) || 0);
  const safeDependents = Math.max(0, Number(dependents) || 0);

  // 1. Các khoản không chịu thuế (Tiền ăn trưa tối đa 1.2tr/tháng)
  const nonTaxableMeal = Math.min(Math.max(0, mealAllowance), TAX_CONSTANTS_2026.DEDUCTIONS.MAX_NON_TAXABLE_MEAL);
  const totalNonTaxable = nonTaxableMeal + Math.max(0, otherNonTaxable);

  // Thu nhập chịu thuế (TNCT)
  const assessableIncome = Math.max(0, safeGross - totalNonTaxable);

  // 2. Bảo hiểm bắt buộc
  const insurance = calculateInsurance(safeGross, region);

  // 3. Giảm trừ gia cảnh & các khoản giảm trừ mới
  const personalDeduction = TAX_CONSTANTS_2026.DEDUCTIONS.PERSONAL;
  const dependentDeduction = safeDependents * TAX_CONSTANTS_2026.DEDUCTIONS.DEPENDENT;
  
  // Giảm trừ hưu trí tự nguyện (max 3tr/tháng)
  const pensionDeduction = Math.min(
    Math.max(0, voluntaryPension),
    TAX_CONSTANTS_2026.DEDUCTIONS.MAX_VOLUNTARY_PENSION
  );

  // Giảm trừ y tế & giáo dục (tính bình quân tháng dựa trên trần năm)
  const maxMedicalMonthly = Math.round(TAX_CONSTANTS_2026.DEDUCTIONS.MAX_MEDICAL_ANNUAL / 12);
  const maxEducationMonthly = Math.round(TAX_CONSTANTS_2026.DEDUCTIONS.MAX_EDUCATION_ANNUAL / 12);
  
  const validMedicalDeduction = Math.min(Math.max(0, medicalMonthly), maxMedicalMonthly);
  const validEducationDeduction = Math.min(Math.max(0, educationMonthly), maxEducationMonthly);

  const totalDeductions = personalDeduction + dependentDeduction + pensionDeduction + validMedicalDeduction + validEducationDeduction;

  // 4. Thu nhập tính thuế (TNTT)
  const taxableIncome = Math.max(0, assessableIncome - insurance.totalInsurance - totalDeductions);

  // 5. Tính thuế lũy tiến 5 bậc
  const taxResult = calculate5TierTax(taxableIncome);

  // 6. Lương thực nhận (Net)
  const net = safeGross - insurance.totalInsurance - taxResult.totalTax;

  return {
    gross: safeGross,
    net: Math.max(0, net),
    totalInsurance: insurance.totalInsurance,
    insuranceDetails: insurance,
    totalDeductions,
    deductionsDetails: {
      personal: personalDeduction,
      dependent: dependentDeduction,
      dependentsCount: safeDependents,
      pension: pensionDeduction,
      medical: validMedicalDeduction,
      education: validEducationDeduction
    },
    assessableIncome,
    taxableIncome,
    pitTax: taxResult.totalTax,
    taxBreakdown: taxResult.breakdown,
    region,
    effectiveTaxRate: safeGross > 0 ? ((taxResult.totalTax / safeGross) * 100).toFixed(2) : '0.00'
  };
}

/**
 * Tính ngược từ lương Net sang Gross (Binary Search chính xác 100% đến 1 VNĐ)
 */
export function calculateNetToGross(targetNet, options = {}) {
  const safeTargetNet = Math.max(0, Number(targetNet) || 0);
  if (safeTargetNet === 0) {
    return calculateGrossToNet(0, options);
  }

  // Binary search range
  let low = safeTargetNet;
  let high = Math.round(safeTargetNet * 2.5 + 50_000_000);
  let bestGross = low;
  let minDiff = Infinity;

  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    const result = calculateGrossToNet(mid, options);
    const diff = result.net - safeTargetNet;

    if (Math.abs(diff) < minDiff) {
      minDiff = Math.abs(diff);
      bestGross = mid;
    }

    if (diff === 0) {
      bestGross = mid;
      break;
    } else if (diff < 0) {
      low = mid + 1;
    } else {
      high = mid - 1;
    }
  }

  return calculateGrossToNet(bestGross, options);
}

/**
 * Tính thuế Freelancer / Bán hàng Online / KOL
 */
export function calculateFreelancerTax({
  annualRevenue = 0,
  singleTransactions = [], // Mảng các khoản nhận [ { amount: 12000000 }, { amount: 4500000 } ]
  businessType = 'service' // 'goods' (1.5%), 'service' (7%), 'manufacturing' (4.5%), 'rental' (10%)
}) {
  const safeRevenue = Math.max(0, Number(annualRevenue) || 0);
  const isExempt = safeRevenue <= TAX_CONSTANTS_2026.FREELANCER.TAX_EXEMPT_ANNUAL_THRESHOLD;

  // Tính số thuế vãng lai 10% bị khấu trừ tại nguồn (từ 5 triệu/lần trở lên)
  let totalWithheld = 0;
  const transactionDetails = singleTransactions.map(tx => {
    const amount = Number(tx.amount) || 0;
    const isWithheld = amount >= TAX_CONSTANTS_2026.FREELANCER.WITHHOLDING_MIN_TRANSACTION;
    const withheldAmount = isWithheld ? Math.round(amount * TAX_CONSTANTS_2026.FREELANCER.WITHHOLDING_RATE) : 0;
    totalWithheld += withheldAmount;
    return {
      amount,
      isWithheld,
      withheldAmount
    };
  });

  // Tỷ lệ thuế theo ngành nghề nếu vượt 1 tỷ
  const taxRates = {
    goods: { vat: 0.01, pit: 0.005, total: 0.015, name: 'Phân phối, cung cấp hàng hóa (1.5%)' },
    service: { vat: 0.05, pit: 0.02, total: 0.07, name: 'Dịch vụ, xây dựng không bao thầu NVL (7%)' },
    manufacturing: { vat: 0.03, pit: 0.015, total: 0.045, name: 'Sản xuất, vận tải, bao thầu (4.5%)' },
    rental: { vat: 0.05, pit: 0.05, total: 0.10, name: 'Cho thuê tài sản, đại lý (10%)' }
  };

  const selectedRate = taxRates[businessType] || taxRates.service;
  const officialTaxLiability = isExempt ? 0 : Math.round(safeRevenue * selectedRate.total);
  
  // Quyết toán cuối năm
  const refundableTax = isExempt ? totalWithheld : Math.max(0, totalWithheld - officialTaxLiability);
  const additionalTaxDue = isExempt ? 0 : Math.max(0, officialTaxLiability - totalWithheld);

  return {
    annualRevenue: safeRevenue,
    isExempt,
    threshold: TAX_CONSTANTS_2026.FREELANCER.TAX_EXEMPT_ANNUAL_THRESHOLD,
    totalWithheld,
    transactionDetails,
    businessType: selectedRate,
    officialTaxLiability,
    refundableTax,
    additionalTaxDue
  };
}

/**
 * Tính dự toán BHXH rút 1 lần
 */
export function calculateBhxhLumpSum({
  yearsBefore2014 = 0,
  yearsFrom2014 = 0,
  averageSalary = 0
}) {
  const safeAvg = Math.max(0, Number(averageSalary) || 0);
  const safeBefore = Math.max(0, Number(yearsBefore2014) || 0);
  const safeFrom = Math.max(0, Number(yearsFrom2014) || 0);

  // Trước 2014: 1.5 tháng mức bình quân lương cho mỗi năm
  const amountBefore2014 = Math.round(safeBefore * 1.5 * safeAvg);
  // Từ 2014 trở đi: 2.0 tháng mức bình quân lương cho mỗi năm
  const amountFrom2014 = Math.round(safeFrom * 2.0 * safeAvg);

  const totalAmount = amountBefore2014 + amountFrom2014;
  const totalYears = safeBefore + safeFrom;

  return {
    averageSalary: safeAvg,
    yearsBefore2014: safeBefore,
    yearsFrom2014: safeFrom,
    totalYears,
    amountBefore2014,
    amountFrom2014,
    totalAmount
  };
}

/**
 * Tính trợ cấp thất nghiệp (BHTN)
 */
export function calculateBhtn({
  averageSalary6Months = 0,
  region = 1,
  totalContributionMonths = 0
}) {
  const safeAvg = Math.max(0, Number(averageSalary6Months) || 0);
  const safeMonths = Math.max(0, Number(totalContributionMonths) || 0);
  const regConfig = TAX_CONSTANTS_2026.REGIONS[region] || TAX_CONSTANTS_2026.REGIONS[1];

  // 1. Mức hưởng hàng tháng: 60% bình quân tiền lương đóng BHTN của 6 tháng liền kề
  const calculatedMonthly = Math.round(safeAvg * 0.60);
  // Trần hưởng tối đa: 5 lần mức lương tối thiểu vùng
  const maxMonthlyBenefit = regConfig.minWage * 5;
  const actualMonthlyBenefit = Math.min(calculatedMonthly, maxMonthlyBenefit);

  // 2. Thời gian hưởng:
  // Đóng đủ 12 đến 36 tháng được hưởng 3 tháng; cứ thêm đủ 12 tháng được thêm 1 tháng, tối đa không quá 12 tháng.
  let benefitDurationMonths = 0;
  if (safeMonths >= 12) {
    if (safeMonths <= 36) {
      benefitDurationMonths = 3;
    } else {
      const extraYears = Math.floor((safeMonths - 36) / 12);
      benefitDurationMonths = Math.min(12, 3 + extraYears);
    }
  }

  const totalBenefit = actualMonthlyBenefit * benefitDurationMonths;

  return {
    averageSalary6Months: safeAvg,
    regionConfig: regConfig,
    calculatedMonthly,
    maxMonthlyBenefit,
    actualMonthlyBenefit,
    isCapped: calculatedMonthly > maxMonthlyBenefit,
    totalContributionMonths: safeMonths,
    benefitDurationMonths,
    totalBenefit
  };
}

/**
 * Tính thuế chuyển nhượng BĐS và chứng khoán phái sinh
 */
export function calculateAssetTax({
  realEstatePrice = 0,
  isSolePropertyOver183Days = false,
  isDirectFamilyTransfer = false,
  derivativeContractValue = 0
}) {
  // BĐS: 2% giá trị chuyển nhượng
  const safeRealEstate = Math.max(0, Number(realEstatePrice) || 0);
  const isRealEstateExempt = isSolePropertyOver183Days || isDirectFamilyTransfer;
  const realEstateTax = isRealEstateExempt ? 0 : Math.round(safeRealEstate * 0.02);

  // Phái sinh (HĐTL): 0.1% giá chuyển nhượng từng lần (TT 87/2026/TT-BTC)
  const safeDerivative = Math.max(0, Number(derivativeContractValue) || 0);
  const derivativeTax = Math.round(safeDerivative * 0.001);

  return {
    realEstate: {
      price: safeRealEstate,
      isExempt: isRealEstateExempt,
      tax: realEstateTax,
      rate: '2.0%'
    },
    derivative: {
      value: safeDerivative,
      tax: derivativeTax,
      rate: '0.1%'
    }
  };
}

/**
 * Định dạng tiền tệ VNĐ hiển thị
 */
export function formatVND(amount) {
  if (typeof amount !== 'number' || isNaN(amount)) return '0 ₫';
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0
  }).format(amount);
}

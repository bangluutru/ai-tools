/**
 * Tax Calculation Engine 2026 (Vietnam PIT & Social Insurance)
 * Căn cứ pháp lý (đã đối chiếu 09/2026):
 * - Luật Thuế TNCN số 109/2025/QH15 (hiệu lực 01/07/2026, áp dụng cho kỳ tính thuế 2026 với
 *   thu nhập tiền lương/tiền công và kinh doanh): biểu lũy tiến 5 bậc 5/10/20/30/35%;
 *   cá nhân kinh doanh: nhóm doanh thu > ngưỡng–3 tỷ chọn tỷ lệ trên (doanh thu − ngưỡng) hoặc
 *   (doanh thu − chi phí) × 15%; 3–50 tỷ bắt buộc thu nhập × 17%; > 50 tỷ × 20%;
 *   cho thuê BĐS: (doanh thu − ngưỡng) × 5%.
 *   Nguồn: https://thuvienphapluat.vn/van-ban/Thue-Phi-Le-Phi/Luat-Thue-thu-nhap-ca-nhan-2025-so-109-2025-QH15-665870.aspx
 *          https://www.ey.com/vi_vn/technical/tax/tax-and-law-updates/luat-thue-thu-nhap-ca-nhan-109-2025-qh15
 * - Nghị quyết 110/2025/UBTVQH15 (Giảm trừ gia cảnh: 15.5tr bản thân, 6.2tr NPT)
 * - Nghị định 253/2026/NĐ-CP (hiệu lực 01/07/2026): giảm trừ Y tế ≤ 23tr/năm, Giáo dục ≤ 24tr/năm
 *   (tính khi QUYẾT TOÁN năm, trần chung cho NNT và NPT — khoản 2 Điều 49); tiền ăn ca miễn ≤ 1,2tr/tháng;
 *   ngưỡng khấu trừ 10% thu nhập vãng lai nâng từ 2tr lên 5tr/lần từ 01/07/2026.
 *   Nguồn: https://luatvietnam.vn/thue-phi-le-phi/diem-moi-cua-nghi-dinh-253-2026-nd-cp-ve-thue-thu-nhap-ca-nhan-565-110102-article.html
 *          https://thuvienphapluat.vn/phap-luat/ho-tro-phap-luat/chinh-thuc-khau-tru-thue-tncn-10-voi-thu-nhap-vang-lai-tu-5-trieu-donglan-tro-len-theo-nghi-dinh-25-278051.html
 * - Thông tư 87/2026/TT-BTC (hướng dẫn NĐ 253/2026; phái sinh 0.1%)
 * - Lương cơ sở: 2.340.000 (NĐ 73/2024/NĐ-CP, 01/07/2024–30/06/2026) → 2.530.000 (NĐ 161/2026/NĐ-CP, từ 01/07/2026).
 *   Trần BHXH/BHYT = 20 × lương cơ sở → 46,8tr (T1–T6/2026), 50,6tr (từ T7/2026).
 *   Nguồn: https://baochinhphu.vn/chinh-thuc-tang-luong-co-so-len-2530000-dong-thang-tu-01-7-2026-102260516214238878.htm
 * - Nghị định 293/2025/NĐ-CP (Lương tối thiểu 4 vùng từ 01/01/2026, áp dụng trần BHTN; danh mục địa bàn cấp xã
 *   theo Phụ lục, sau sắp xếp đơn vị hành chính 2025).
 *   Nguồn: https://xaydungchinhsach.chinhphu.vn/nghi-dinh-so-293-2025-nd-cp-quy-dinh-muc-luong-toi-thieu-doi-voi-nguoi-lao-dong-lam-viec-theo-hop-dong-lao-dong-119251110172808433.htm
 * - Nghị định 68/2026/NĐ-CP sửa đổi bởi Nghị định 141/2026/NĐ-CP (hiệu lực từ 01/01/2026): hộ/cá nhân kinh doanh
 *   doanh thu ≤ 1 tỷ/năm không chịu thuế GTGT và không phải nộp thuế TNCN; trên 1 tỷ: GTGT = TOÀN BỘ doanh thu × tỷ lệ
 *   GTGT ngành nghề; TNCN (phương pháp tỷ lệ) = (doanh thu − 1 tỷ) × tỷ lệ TNCN.
 *   Nguồn: https://baochinhphu.vn/chinh-thuc-nang-nguong-chiu-thue-voi-ho-kinh-doanh-len-01-ty-dong-nam-ap-dung-tu-1-1-2026-102260429185517215.htm
 *          https://helpeshop.misa.vn/kb/cach-tinh-thue-ho-kinh-doanh-2026-moi-nhat-theo-luat-thue-tncn-thue-gtgt-sua-doi
 *          https://ketoanthuanthien.vn/kien-thuc/cach-tinh-thue-ho-kinh-doanh-tu-01-01-2026/
 * - Nghị định 174/2025/NĐ-CP (theo NQ 204/2025/QH15): giảm 20% mức tỷ lệ % tính thuế GTGT cho HHDV thuộc diện giảm,
 *   áp dụng 01/07/2025–31/12/2026. Nguồn: https://vanban.chinhphu.vn/?pageid=27160&docid=214310
 * - Luật BHXH 58/2024/QH15 (hiệu lực 01/07/2025) Điều 70: điều kiện hưởng BHXH một lần.
 *   Nguồn: https://thuvienphapluat.vn/chinh-sach-phap-luat-moi/vn/ho-tro-phap-luat/tu-van-phap-luat/77288/dieu-kien-huong-bhxh-mot-lan-tu-01-7-2025
 */

/**
 * Lịch sử lương cơ sở (dùng để tính trần BHXH/BHYT theo kỳ lương).
 * Sắp xếp tăng dần theo ngày hiệu lực.
 */
export const BASE_SALARY_SCHEDULE = [
  { effectiveFrom: '2024-07-01', baseSalary: 2_340_000, source: 'NĐ 73/2024/NĐ-CP' },
  { effectiveFrom: '2026-07-01', baseSalary: 2_530_000, source: 'NĐ 161/2026/NĐ-CP' }
];

const BHXH_CAP_MULTIPLIER = 20;

/**
 * Chuẩn hóa kỳ lương về chuỗi 'YYYY-MM-DD'. Chấp nhận Date, 'YYYY-MM' hoặc 'YYYY-MM-DD'.
 * Trả về null nếu không xác định (khi đó dùng mức lương cơ sở mới nhất).
 */
function normalizePeriod(period) {
  if (!period) return null;
  if (period instanceof Date && !isNaN(period.getTime())) {
    const y = period.getFullYear();
    const m = String(period.getMonth() + 1).padStart(2, '0');
    const d = String(period.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
  if (typeof period === 'string') {
    if (/^\d{4}-\d{2}$/.test(period)) return `${period}-01`;
    if (/^\d{4}-\d{2}-\d{2}$/.test(period)) return period;
  }
  return null;
}

/**
 * Lấy lương cơ sở áp dụng cho kỳ lương. Không truyền kỳ → mức mới nhất.
 */
export function getBaseSalary(period) {
  const iso = normalizePeriod(period);
  if (!iso) return BASE_SALARY_SCHEDULE[BASE_SALARY_SCHEDULE.length - 1];
  let current = BASE_SALARY_SCHEDULE[0];
  for (const entry of BASE_SALARY_SCHEDULE) {
    if (iso >= entry.effectiveFrom) current = entry;
  }
  return current;
}

/**
 * Trần tiền lương đóng BHXH/BHYT (20 lần lương cơ sở) theo kỳ lương.
 */
export function getMaxBhxhSalary(period) {
  return getBaseSalary(period).baseSalary * BHXH_CAP_MULTIPLIER;
}

export const TAX_CONSTANTS_2026 = {
  // Giá trị mới nhất (từ 01/07/2026). Tính theo kỳ lương: dùng getBaseSalary()/getMaxBhxhSalary().
  BASE_SALARY: 2_530_000, // Lương cơ sở từ 01/07/2026 (NĐ 161/2026/NĐ-CP)
  MAX_BHXH_BHYT_SALARY: 2_530_000 * 20, // 50.600.000 VNĐ (T1–T6/2026: 2.340.000 × 20 = 46.800.000)

  // Tỷ lệ bảo hiểm người lao động đóng
  RATES: {
    BHXH: 0.08,  // 8%
    BHYT: 0.015, // 1.5%
    BHTN: 0.01,  // 1%
    TOTAL_INSURANCE: 0.105 // 10.5%
  },

  // Lương tối thiểu vùng (NĐ 293/2025/NĐ-CP, từ 01/01/2026) và trần đóng BHTN (20 lần lương tối thiểu vùng).
  // Vùng xác định theo địa bàn cấp xã tại Phụ lục NĐ 293/2025 (đã cập nhật sau sắp xếp ĐVHC 2025,
  // vd. Bình Dương, Bà Rịa – Vũng Tàu nay thuộc TP.HCM). Nhãn dưới đây chỉ là ví dụ, cần tra Phụ lục.
  REGIONS: {
    1: { name_vn: 'Vùng I (phần lớn nội thành Hà Nội, TP.HCM, Hải Phòng...)', minWage: 5_310_000, maxBhtnSalary: 5_310_000 * 20 }, // 106.200.000
    2: { name_vn: 'Vùng II (các phường/xã đô thị khác, ngoại thành TP lớn)', minWage: 4_730_000, maxBhtnSalary: 4_730_000 * 20 }, // 94.600.000
    3: { name_vn: 'Vùng III (các xã, phường thuộc tỉnh theo Phụ lục)', minWage: 4_140_000, maxBhtnSalary: 4_140_000 * 20 }, // 82.800.000
    4: { name_vn: 'Vùng IV (các địa bàn còn lại)', minWage: 3_700_000, maxBhtnSalary: 3_700_000 * 20 }  // 74.000.000
  },

  // Mức giảm trừ gia cảnh hàng tháng
  DEDUCTIONS: {
    PERSONAL: 15_500_000,      // 15.5 triệu/tháng (186 triệu/năm)
    DEPENDENT: 6_200_000,      // 6.2 triệu/tháng/người
    MAX_DEPENDENT_INCOME: 3_000_000, // Thu nhập tối đa của NPT để được giảm trừ
    MAX_VOLUNTARY_PENSION: 3_000_000, // Tối đa 3 triệu/tháng
    // Y tế/Giáo dục: chỉ giảm trừ khi QUYẾT TOÁN năm, trần chung cho NNT + NPT (khoản 2 Điều 49 NĐ 253/2026)
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
    // Doanh thu ≤ 1 tỷ/năm: không chịu GTGT, không nộp TNCN (NĐ 68/2026 sửa đổi bởi NĐ 141/2026, từ 01/01/2026)
    TAX_EXEMPT_ANNUAL_THRESHOLD: 1_000_000_000,
    // Trên 3 tỷ: bắt buộc tính TNCN theo thu nhập (doanh thu − chi phí) × 17%; trên 50 tỷ × 20% (Luật 109/2025)
    PROFIT_METHOD_MANDATORY_THRESHOLD: 3_000_000_000,
    TOP_GROUP_THRESHOLD: 50_000_000_000,
    PROFIT_RATE_GROUP_2: 0.15,
    PROFIT_RATE_GROUP_3: 0.17,
    PROFIT_RATE_GROUP_4: 0.20,
    // NĐ 174/2025/NĐ-CP: giảm 20% mức tỷ lệ % tính GTGT cho HHDV thuộc diện giảm, đến hết 31/12/2026
    VAT_RATIO_REDUCTION: 0.20,
    VAT_RATIO_REDUCTION_END: '2026-12-31',
    // Khấu trừ 10% thu nhập vãng lai (tiền công, không HĐLĐ/HĐLĐ < 3 tháng):
    // từ 5 triệu/lần (NĐ 253/2026, từ 01/07/2026); trước đó 2 triệu/lần.
    WITHHOLDING_MIN_TRANSACTION: 5_000_000,
    WITHHOLDING_MIN_TRANSACTION_BEFORE_2026_07: 2_000_000,
    WITHHOLDING_THRESHOLD_CHANGE_DATE: '2026-07-01',
    WITHHOLDING_RATE: 0.10
  }
};

/**
 * Tỷ lệ GTGT & TNCN trên doanh thu theo ngành nghề (hộ/cá nhân kinh doanh).
 * vatReducible: ngành có thể thuộc diện giảm 20% tỷ lệ GTGT theo NĐ 174/2025 (tùy HHDV cụ thể;
 * kinh doanh bất động sản không thuộc diện giảm).
 * profitMethodAllowed: cho thuê BĐS luôn tính (doanh thu − ngưỡng) × 5%, không áp dụng phương pháp thu nhập.
 */
export const BUSINESS_TAX_RATES = {
  goods: { vat: 0.01, pit: 0.005, total: 0.015, vatReducible: true, profitMethodAllowed: true, name: 'Phân phối, cung cấp hàng hóa (GTGT 1% + TNCN 0,5%)' },
  service: { vat: 0.05, pit: 0.02, total: 0.07, vatReducible: true, profitMethodAllowed: true, name: 'Dịch vụ, xây dựng không bao thầu NVL (GTGT 5% + TNCN 2%)' },
  manufacturing: { vat: 0.03, pit: 0.015, total: 0.045, vatReducible: true, profitMethodAllowed: true, name: 'Sản xuất, vận tải, xây dựng có bao thầu NVL (GTGT 3% + TNCN 1,5%)' },
  rental: { vat: 0.05, pit: 0.05, total: 0.10, vatReducible: false, profitMethodAllowed: false, name: 'Cho thuê tài sản (GTGT 5% + TNCN 5%)' }
};

/**
 * Tính chi tiết bảo hiểm bắt buộc theo vùng
 */
export function calculateInsurance(grossSalary, region = 1, { period } = {}) {
  const regConfig = TAX_CONSTANTS_2026.REGIONS[region] || TAX_CONSTANTS_2026.REGIONS[1];
  const baseSalaryInfo = getBaseSalary(period);
  const maxBhxhSalary = baseSalaryInfo.baseSalary * BHXH_CAP_MULTIPLIER;

  const bhxhSalary = Math.min(Math.max(0, grossSalary), maxBhxhSalary);
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
    isBhxhCapped: grossSalary > maxBhxhSalary,
    isBhtnCapped: grossSalary > regConfig.maxBhtnSalary,
    maxBhxhSalary,
    baseSalary: baseSalaryInfo.baseSalary,
    baseSalarySource: baseSalaryInfo.source,
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
  otherNonTaxable = 0,
  period = null // 'YYYY-MM' kỳ lương → trần BHXH theo lương cơ sở của kỳ đó
} = {}) {
  const safeGross = Math.max(0, Number(gross) || 0);
  const safeDependents = Math.max(0, Number(dependents) || 0);

  // 1. Các khoản không chịu thuế (Tiền ăn trưa tối đa 1.2tr/tháng)
  const nonTaxableMeal = Math.min(Math.max(0, mealAllowance), TAX_CONSTANTS_2026.DEDUCTIONS.MAX_NON_TAXABLE_MEAL);
  const totalNonTaxable = nonTaxableMeal + Math.max(0, otherNonTaxable);

  // Thu nhập chịu thuế (TNCT)
  const assessableIncome = Math.max(0, safeGross - totalNonTaxable);

  // 2. Bảo hiểm bắt buộc
  const insurance = calculateInsurance(safeGross, region, { period });

  // 3. Giảm trừ gia cảnh & các khoản giảm trừ mới
  const personalDeduction = TAX_CONSTANTS_2026.DEDUCTIONS.PERSONAL;
  const dependentDeduction = safeDependents * TAX_CONSTANTS_2026.DEDUCTIONS.DEPENDENT;
  
  // Giảm trừ hưu trí tự nguyện (max 3tr/tháng)
  const pensionDeduction = Math.min(
    Math.max(0, voluntaryPension),
    TAX_CONSTANTS_2026.DEDUCTIONS.MAX_VOLUNTARY_PENSION
  );

  // Giảm trừ y tế & giáo dục (bình quân tháng dựa trên trần năm).
  // Lưu ý: đây là khoản chỉ được trừ khi QUYẾT TOÁN năm (NĐ 253/2026), không áp dụng khi khấu trừ lương tháng.
  // Giao diện tính lương tháng không truyền 2 khoản này; chỉ dùng để ước tính tiết kiệm khi quyết toán.
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
    nonTaxableIncome: totalNonTaxable,
    nonTaxableMeal,
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
 * Thuế TNCN lũy tiến 5 bậc theo NĂM (dùng khi quyết toán): ngưỡng bậc = ngưỡng tháng × 12
 * (120tr / 360tr / 720tr / 1,2 tỷ).
 */
export function calculateAnnual5TierTax(annualTaxableIncome) {
  const safe = Math.max(0, Number(annualTaxableIncome) || 0);
  let remaining = safe;
  let prevLimit = 0;
  let totalTax = 0;
  const breakdown = TAX_CONSTANTS_2026.BRACKETS_5_TIER.map(bracket => {
    const annualMax = bracket.max === Infinity ? Infinity : bracket.max * 12;
    const amountInTier = Math.min(Math.max(0, remaining), annualMax - prevLimit);
    const taxInTier = Math.round(amountInTier * bracket.rate);
    totalTax += taxInTier;
    remaining = Math.max(0, remaining - amountInTier);
    prevLimit = annualMax;
    return { tier: bracket.tier, rate: bracket.rate, annualMax, taxableAmount: amountInTier, taxAmount: taxInTier };
  });
  return { totalTax, breakdown };
}

/**
 * Ngưỡng khấu trừ 10% vãng lai theo ngày chi trả: < 01/07/2026 là 2 triệu, từ 01/07/2026 là 5 triệu (NĐ 253/2026).
 * Không có ngày → áp dụng ngưỡng hiện hành 5 triệu.
 */
export function getWithholdingThreshold(paymentDate) {
  const iso = normalizePeriod(paymentDate);
  const cfg = TAX_CONSTANTS_2026.FREELANCER;
  if (iso && iso < cfg.WITHHOLDING_THRESHOLD_CHANGE_DATE) return cfg.WITHHOLDING_MIN_TRANSACTION_BEFORE_2026_07;
  return cfg.WITHHOLDING_MIN_TRANSACTION;
}

/**
 * Ước tính quyết toán thuế TNCN cho thu nhập vãng lai (tiền công bị khấu trừ 10%).
 *
 * Khoản khấu trừ 10% là tạm nộp thuế TNCN từ TIỀN LƯƠNG, TIỀN CÔNG (không phải thuế hộ kinh doanh).
 * Khi quyết toán năm, toàn bộ thu nhập tiền lương/tiền công (vãng lai + nơi làm việc khác) được tính theo
 * biểu lũy tiến 5 bậc năm (Luật 109/2025) sau giảm trừ gia cảnh 186tr/năm + 74,4tr/NPT/năm (NQ 110/2025).
 * Số được hoàn = tổng đã tạm nộp − số thuế phải nộp cả năm (nếu dương). KHÔNG mặc nhiên được hoàn 100%.
 */
export function estimateCasualIncomeSettlement({
  singleTransactions = [],
  otherAnnualWageIncome = 0,   // Thu nhập chịu thuế từ tiền lương/tiền công khác trong năm
  otherAnnualInsurance = 0,    // BHXH/BHYT/BHTN bắt buộc NLĐ đã đóng trong năm (nơi làm việc khác)
  otherTaxWithheld = 0,        // Thuế TNCN đã bị khấu trừ ở nơi làm việc khác
  dependents = 0,
  annualSettlementDeductions = 0 // Giảm trừ khác khi quyết toán (y tế, giáo dục, hưu trí TN...) nếu có
} = {}) {
  const txs = Array.isArray(singleTransactions) ? singleTransactions : [];
  let totalCasualIncome = 0;
  let totalWithheld = 0;
  const transactionDetails = txs.map(tx => {
    const amount = Math.max(0, Number(tx.amount) || 0);
    const threshold = getWithholdingThreshold(tx.date);
    const isWithheld = amount >= threshold;
    const withheldAmount = isWithheld ? Math.round(amount * TAX_CONSTANTS_2026.FREELANCER.WITHHOLDING_RATE) : 0;
    totalCasualIncome += amount;
    totalWithheld += withheldAmount;
    return { amount, isWithheld, withheldAmount, threshold };
  });

  const safeOtherIncome = Math.max(0, Number(otherAnnualWageIncome) || 0);
  const safeOtherInsurance = Math.max(0, Number(otherAnnualInsurance) || 0);
  const safeOtherWithheld = Math.max(0, Number(otherTaxWithheld) || 0);
  const safeDependents = Math.max(0, Number(dependents) || 0);
  const safeExtraDeductions = Math.max(0, Number(annualSettlementDeductions) || 0);

  const totalAnnualWageIncome = totalCasualIncome + safeOtherIncome;
  const annualFamilyDeduction =
    TAX_CONSTANTS_2026.DEDUCTIONS.PERSONAL * 12 + safeDependents * TAX_CONSTANTS_2026.DEDUCTIONS.DEPENDENT * 12;
  const annualTaxableIncome = Math.max(
    0,
    totalAnnualWageIncome - safeOtherInsurance - annualFamilyDeduction - safeExtraDeductions
  );
  const annualTax = calculateAnnual5TierTax(annualTaxableIncome);
  const totalPrepaid = totalWithheld + safeOtherWithheld;

  return {
    transactionDetails,
    totalCasualIncome,
    totalWithheld,
    totalAnnualWageIncome,
    annualFamilyDeduction,
    annualTaxableIncome,
    annualTaxDue: annualTax.totalTax,
    annualTaxBreakdown: annualTax.breakdown,
    totalPrepaid,
    estimatedRefund: Math.max(0, totalPrepaid - annualTax.totalTax),
    estimatedAdditionalDue: Math.max(0, annualTax.totalTax - totalPrepaid),
    isEstimate: true
  };
}

/**
 * Tính thuế Hộ kinh doanh / Cá nhân kinh doanh (bán hàng online, KOL...) + ước tính quyết toán vãng lai.
 *
 * Hộ/cá nhân kinh doanh (NĐ 68/2026 sửa đổi bởi NĐ 141/2026; Luật 109/2025):
 *  - Doanh thu ≤ 1 tỷ: không chịu GTGT, không nộp TNCN.
 *  - Trên 1 tỷ: GTGT = toàn bộ doanh thu × tỷ lệ GTGT ngành (có thể giảm 20% theo NĐ 174/2025 đến 31/12/2026).
 *  - TNCN nhóm >1–3 tỷ: chọn (doanh thu − 1 tỷ) × tỷ lệ TNCN ngành, HOẶC (doanh thu − chi phí) × 15%.
 *  - TNCN nhóm >3–50 tỷ: bắt buộc (doanh thu − chi phí) × 17%; > 50 tỷ: × 20%.
 *  - Cho thuê BĐS: luôn (doanh thu − 1 tỷ) × 5%.
 * Ví dụ: dịch vụ 1,5 tỷ → GTGT 75tr + TNCN (1,5 tỷ − 1 tỷ) × 2% = 10tr → 85tr.
 */
export function calculateFreelancerTax({
  annualRevenue = 0,
  singleTransactions = [], // Khoản chi trả vãng lai [{ amount, date? }]
  businessType = 'service', // 'goods' | 'service' | 'manufacturing' | 'rental'
  pitMethod = 'revenue',    // 'revenue' (tỷ lệ trên doanh thu) | 'profit' (thu nhập × 15/17/20%)
  annualExpenses = 0,       // Chi phí hợp lý (bắt buộc với doanh thu > 3 tỷ)
  applyVatReduction = false, // Áp dụng giảm 20% tỷ lệ GTGT (NĐ 174/2025) cho HHDV thuộc diện giảm
  taxYear = 2026,
  // Tham số quyết toán vãng lai (tùy chọn)
  otherAnnualWageIncome = 0,
  otherAnnualInsurance = 0,
  otherTaxWithheld = 0,
  dependents = 0
} = {}) {
  const cfg = TAX_CONSTANTS_2026.FREELANCER;
  const safeRevenue = Math.max(0, Number(annualRevenue) || 0);
  const safeExpenses = Math.max(0, Number(annualExpenses) || 0);
  const isExempt = safeRevenue <= cfg.TAX_EXEMPT_ANNUAL_THRESHOLD;
  const selectedRate = BUSINESS_TAX_RATES[businessType] || BUSINESS_TAX_RATES.service;
  const warnings = [];

  let revenueGroup = 1;
  if (!isExempt) {
    if (safeRevenue <= cfg.PROFIT_METHOD_MANDATORY_THRESHOLD) revenueGroup = 2;
    else if (safeRevenue <= cfg.TOP_GROUP_THRESHOLD) revenueGroup = 3;
    else revenueGroup = 4;
  }

  // --- Thuế GTGT: toàn bộ doanh thu × tỷ lệ (không trừ ngưỡng 1 tỷ) ---
  const vatReductionEligible =
    Boolean(applyVatReduction) && selectedRate.vatReducible && Number(taxYear) <= 2026;
  const vatRateApplied = vatReductionEligible ? selectedRate.vat * (1 - cfg.VAT_RATIO_REDUCTION) : selectedRate.vat;
  const vatAmount = isExempt ? 0 : Math.round(safeRevenue * vatRateApplied);
  if (applyVatReduction && !selectedRate.vatReducible) {
    warnings.push('vat_reduction_not_applicable');
  }

  // --- Thuế TNCN ---
  let pitMethodApplied = 'none';
  let pitRateApplied = 0;
  let pitBase = 0;
  let profitMethodForced = false;
  if (!isExempt) {
    if (!selectedRate.profitMethodAllowed) {
      pitMethodApplied = 'revenue';
      pitRateApplied = selectedRate.pit;
      pitBase = safeRevenue - cfg.TAX_EXEMPT_ANNUAL_THRESHOLD;
    } else if (revenueGroup === 2 && pitMethod !== 'profit') {
      pitMethodApplied = 'revenue';
      pitRateApplied = selectedRate.pit;
      pitBase = safeRevenue - cfg.TAX_EXEMPT_ANNUAL_THRESHOLD;
    } else {
      pitMethodApplied = 'profit';
      profitMethodForced = revenueGroup >= 3 && pitMethod !== 'profit';
      pitRateApplied =
        revenueGroup === 2 ? cfg.PROFIT_RATE_GROUP_2 : revenueGroup === 3 ? cfg.PROFIT_RATE_GROUP_3 : cfg.PROFIT_RATE_GROUP_4;
      pitBase = safeRevenue - safeExpenses;
      if (safeExpenses <= 0) warnings.push('profit_method_missing_expenses');
    }
    if (profitMethodForced) warnings.push('profit_method_mandatory_above_3b');
  }
  pitBase = Math.max(0, pitBase);
  const pitAmount = Math.round(pitBase * pitRateApplied);
  const officialTaxLiability = vatAmount + pitAmount;

  // --- Thu nhập vãng lai: tạm khấu trừ 10% → ước tính quyết toán theo biểu lũy tiến năm ---
  const casualSettlement = estimateCasualIncomeSettlement({
    singleTransactions,
    otherAnnualWageIncome,
    otherAnnualInsurance,
    otherTaxWithheld,
    dependents
  });

  return {
    annualRevenue: safeRevenue,
    isExempt,
    threshold: cfg.TAX_EXEMPT_ANNUAL_THRESHOLD,
    revenueGroup,
    businessType: selectedRate,
    vatAmount,
    vatRateApplied,
    vatReductionApplied: vatReductionEligible,
    pitAmount,
    pitBase,
    pitMethodApplied,
    pitRateApplied,
    profitMethodForced,
    annualExpenses: safeExpenses,
    officialTaxLiability,
    warnings,
    // Vãng lai (tiền công) — tách biệt khỏi thuế hộ kinh doanh
    totalWithheld: casualSettlement.totalWithheld,
    transactionDetails: casualSettlement.transactionDetails,
    casualSettlement,
    // Giữ tên trường cũ: nay là ước tính hoàn/nộp thêm khi quyết toán thu nhập vãng lai
    refundableTax: casualSettlement.estimatedRefund,
    additionalTaxDue: casualSettlement.estimatedAdditionalDue
  };
}

/**
 * Tính dự toán BHXH rút 1 lần
 */
export function calculateBhxhLumpSum({
  yearsBefore2014 = 0,
  yearsFrom2014 = 0,
  averageSalary = 0,
  startedBeforeJuly2025 = true, // Có thời gian đóng BHXH trước 01/07/2025 (Luật BHXH 2024 có hiệu lực)
  stoppedFor12Months = true     // Sau 12 tháng không tham gia BHXH bắt buộc lẫn tự nguyện
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

  // Điều kiện phổ biến theo điểm d khoản 1 Điều 70 Luật BHXH 58/2024/QH15: có thời gian đóng trước 01/07/2025,
  // sau 12 tháng không tham gia BHXH bắt buộc/tự nguyện và đóng chưa đủ 20 năm. Người bắt đầu đóng từ
  // 01/07/2025 không được rút theo diện này (chỉ các trường hợp đặc biệt: đủ tuổi hưu chưa đủ 15 năm,
  // ra nước ngoài định cư, mắc bệnh hiểm nghèo...).
  const meetsCommonCondition = Boolean(startedBeforeJuly2025) && Boolean(stoppedFor12Months) && totalYears < 20;
  const eligibilityIssues = [];
  if (!startedBeforeJuly2025) eligibilityIssues.push('started_after_2025_07');
  if (!stoppedFor12Months) eligibilityIssues.push('not_stopped_12_months');
  if (totalYears >= 20) eligibilityIssues.push('over_20_years');

  return {
    averageSalary: safeAvg,
    yearsBefore2014: safeBefore,
    yearsFrom2014: safeFrom,
    totalYears,
    amountBefore2014,
    amountFrom2014,
    totalAmount,
    meetsCommonCondition,
    eligibilityIssues
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

/**
 * @file packages/core/src/vietnam/engines/loanAprEngine.js
 * @description Engine toán tài chính tính lãi suất thực (Loan APR / Effective Annual Rate - EAR),
 * dòng tiền thực (Cash Flow), lịch trả nợ và so sánh giữa các phương thức vay (Amortized vs Flat-rate vs 0% có phí).
 * Tuân thủ chuẩn mực tính toán tài chính quốc tế và quy định minh bạch chi phí tín dụng tại Việt Nam.
 */

/**
 * Tính Net Present Value (NPV) của chuỗi dòng tiền theo lãi suất kỳ r.
 * @param {number[]} cashFlows - Mảng dòng tiền [C0, C1, ..., Cn]
 * @param {number} rate - Lãi suất kỳ (periodic rate, ví dụ 0.015 cho 1.5%/tháng)
 * @returns {number}
 */
export function calculateNPV(cashFlows, rate) {
  let npv = 0;
  for (let t = 0; t < cashFlows.length; t++) {
    npv += cashFlows[t] / Math.pow(1 + rate, t);
  }
  return npv;
}

/**
 * Tính đạo hàm bậc 1 của NPV theo r (dNPV/dr) phục vụ phương pháp tiếp tuyến Newton-Raphson.
 * @param {number[]} cashFlows
 * @param {number} rate
 * @returns {number}
 */
export function calculateNPVDerivative(cashFlows, rate) {
  let dNpv = 0;
  for (let t = 1; t < cashFlows.length; t++) {
    dNpv -= (t * cashFlows[t]) / Math.pow(1 + rate, t + 1);
  }
  return dNpv;
}

/**
 * Giải tỷ suất sinh lời nội bộ (IRR) cho chuỗi dòng tiền tùy ý.
 * Sử dụng thuật toán kết hợp Newton-Raphson với Bisection Fallback để đảm bảo hội tụ 100%.
 * @param {number[]} cashFlows - [C0, C1, ..., Cn] với C0 > 0 (tiền nhận) và C1..n < 0 (tiền trả)
 * @param {number} [tolerance=1e-7] - Ngưỡng sai số hội tụ
 * @param {number} [maxIterations=60] - Số vòng lặp tối đa
 * @returns {number|null} Lãi suất kỳ (periodic rate, dạng thập phân) hoặc null nếu không thể xác định
 */
export function solveIRR(cashFlows, tolerance = 1e-7, maxIterations = 60) {
  if (!Array.isArray(cashFlows) || cashFlows.length < 2) return null;

  // Kiểm tra tính hợp lệ của dòng tiền: phải có cả dòng tiền dương và dòng tiền âm
  const hasPositive = cashFlows.some((c) => c > 0);
  const hasNegative = cashFlows.some((c) => c < 0);
  if (!hasPositive || !hasNegative) return null;

  // Trường hợp đặc biệt: Không lãi, không phí (tổng tiền trả = đúng tiền nhận)
  const totalFlow = cashFlows.reduce((sum, c) => sum + c, 0);
  if (Math.abs(totalFlow) < 1e-5) {
    return 0;
  }

  // 1. Khởi tạo điểm ước đoán ban đầu (Initial Guess)
  const c0 = cashFlows[0];
  const totalOutflow = cashFlows.slice(1).reduce((sum, c) => sum + Math.abs(c), 0);
  const n = cashFlows.length - 1;
  let r = c0 > 0 ? (totalOutflow - c0) / (c0 * n) : 0.01;
  if (!Number.isFinite(r) || r <= -0.99 || r > 5.0) {
    r = 0.01;
  }

  // 2. Thử nghiệm thuật toán Newton-Raphson
  let converged = false;
  for (let i = 0; i < maxIterations; i++) {
    const npv = calculateNPV(cashFlows, r);
    if (Math.abs(npv) < tolerance) {
      converged = true;
      break;
    }
    const dNpv = calculateNPVDerivative(cashFlows, r);
    if (Math.abs(dNpv) < 1e-12 || !Number.isFinite(dNpv)) {
      break; // Đạo hàm triệt tiêu, chuyển sang Bisection
    }

    const nextR = r - npv / dNpv;
    if (!Number.isFinite(nextR) || nextR <= -0.99 || nextR > 20.0) {
      break; // Điểm nhảy ra ngoài biên, chuyển sang Bisection
    }

    if (Math.abs(nextR - r) < tolerance) {
      r = nextR;
      converged = true;
      break;
    }
    r = nextR;
  }

  if (converged && Number.isFinite(r) && r > -0.99) {
    return r;
  }

  // 3. Fallback: Phương pháp Chia đôi khoảng (Bisection Method)
  let low = -0.5;
  let high = 5.0; // Tương đương 500%/tháng
  let npvLow = calculateNPV(cashFlows, low);
  let npvHigh = calculateNPV(cashFlows, high);

  // Mở rộng khoảng nếu cần
  if (npvLow * npvHigh > 0) {
    high = 20.0; // 2000%/tháng
    npvHigh = calculateNPV(cashFlows, high);
  }

  if (npvLow * npvHigh > 0) {
    return null; // Không có đổi dấu trong khoảng hợp lý
  }

  for (let i = 0; i < 100; i++) {
    const mid = (low + high) / 2;
    const npvMid = calculateNPV(cashFlows, mid);
    if (Math.abs(npvMid) < tolerance || (high - low) / 2 < tolerance) {
      return mid;
    }
    if (npvLow * npvMid < 0) {
      high = mid;
      npvHigh = npvMid;
    } else {
      low = mid;
      npvLow = npvMid;
    }
  }

  return (low + high) / 2;
}

/**
 * Quy đổi lãi suất kỳ (hàng tháng) sang Lãi suất danh nghĩa năm (Nominal APR %) và Lãi suất hiệu dụng năm (EAR %).
 * @param {number} periodicRate - Lãi suất tháng (ví dụ 0.015)
 * @param {number} [periodsPerYear=12]
 * @returns {{ nominalAPR: number, effectiveAnnualRate: number, effectiveAPR: number, periodicRate: number }}
 */
export function annualizeRate(periodicRate, periodsPerYear = 12) {
  if (periodicRate === null || periodicRate === undefined || !Number.isFinite(periodicRate)) {
    return {
      periodicRate: 0,
      nominalAPR: 0,
      effectiveAnnualRate: 0,
      effectiveAPR: 0,
    };
  }

  const nominalAPRDecimal = periodicRate * periodsPerYear;
  const earDecimal = Math.pow(1 + periodicRate, periodsPerYear) - 1;

  const nominalAPR = Number((nominalAPRDecimal * 100).toFixed(4));
  const effectiveAnnualRate = Number((earDecimal * 100).toFixed(4));

  return {
    periodicRate,
    nominalAPR,
    effectiveAnnualRate,
    effectiveAPR: effectiveAnnualRate,
    nominalAPRDecimal,
    effectiveAnnualRateDecimal: earDecimal,
  };
}

/**
 * @typedef {Object} LoanFeeItem
 * @property {string} id - Định danh phí
 * @property {string} name - Tên loại phí
 * @property {number} amount - Số tiền phí (VND)
 * @property {boolean} isDeductedUpfront - true nếu trừ trực tiếp vào số tiền giải ngân
 */

/**
 * Danh mục các loại phí vay phổ biến tại thị trường Việt Nam
 */
export const POPULAR_LOAN_FEES_VN = [
  { id: 'insurance', name: 'Bảo hiểm khoản vay (thường 3% - 5%)', defaultRate: 0.05, isDeductedUpfront: true },
  { id: 'appraisal', name: 'Phí thẩm định hồ sơ', defaultAmount: 500_000, isDeductedUpfront: true },
  { id: 'disbursement', name: 'Phí giải ngân / thủ tục', defaultAmount: 200_000, isDeductedUpfront: true },
  { id: 'account_mgmt', name: 'Phí quản lý tài khoản hàng tháng', defaultAmount: 30_000, isDeductedUpfront: false },
];

// ============================================================================
// MODE A: TÍNH LÃI SUẤT THỰC TỪ DÒNG TIỀN VAY TRẢ GÓP (CASH FLOW TO APR)
// ============================================================================

/**
 * Mode A: Tính APR thực từ số tiền vay, kỳ hạn, số tiền trả mỗi tháng và các khoản phí.
 * @param {Object} params
 * @param {number} params.contractPrincipal - Số tiền vay trên hợp đồng (VND)
 * @param {number} params.termMonths - Thời gian vay (tháng)
 * @param {number} params.monthlyInstallment - Số tiền trả hàng tháng (gốc + lãi thỏa thuận)
 * @param {LoanFeeItem[]} [params.fees=[]] - Danh sách các loại phí
 * @param {number} [params.upfrontFees=0] - Phí thu trước (tiện ích viết tắt)
 * @param {number} [params.inTermMonthlyFee=0] - Phí định kỳ hàng tháng (quản lý tài khoản, SMS, ...)
 * @param {number} [params.periodicFee=0] - Tương đương inTermMonthlyFee
 */
export function calculateLoanAPRFromCashFlow({
  contractPrincipal,
  termMonths,
  monthlyInstallment,
  fees = [],
  upfrontFees = 0,
  inTermMonthlyFee = 0,
  periodicFee = 0,
}) {
  const safePrincipal = Math.max(0, Math.round(Number(contractPrincipal) || 0));
  const safeTerm = Math.max(0, Math.round(Number(termMonths) || 0));
  const safePayment = Math.max(0, Math.round(Number(monthlyInstallment) || 0));
  const safePeriodicFee = Math.max(0, Math.round(Number(inTermMonthlyFee || periodicFee) || 0));

  let upfrontDeductedFees = 0;
  let upfrontPaidFees = 0;

  if (Array.isArray(fees) && fees.length > 0) {
    for (const f of fees) {
      const amt = Math.max(0, Math.round(Number(f.amount) || 0));
      if (f.isDeductedUpfront) {
        upfrontDeductedFees += amt;
      } else {
        upfrontPaidFees += amt;
      }
    }
  } else if (upfrontFees > 0) {
    upfrontDeductedFees += Math.max(0, Math.round(Number(upfrontFees) || 0));
  }

  // Số tiền thực nhận (Net Proceeds) = Gốc hợp đồng - Phí khấu trừ trước
  const netProceeds = Math.max(0, safePrincipal - upfrontDeductedFees);

  if (safePrincipal <= 0 || safeTerm <= 0 || safePayment <= 0) {
    return {
      isValid: false,
      validationError: 'Vui lòng nhập đầy đủ số tiền vay, kỳ hạn và số tiền trả mỗi tháng.',
      contractPrincipal: safePrincipal,
      netProceeds,
      firstPayment: 0,
      lastPayment: 0,
      totalScheduledPayments: 0,
      totalRepayment: 0,
      totalPaidToLender: 0,
      totalBorrowingCost: 0,
      totalFees: upfrontDeductedFees + upfrontPaidFees,
      periodicRate: 0,
      nominalAPR: 0,
      effectiveAnnualRate: 0,
      effectiveAPR: 0,
      cashFlows: [],
      breakdown: {
        principal: safePrincipal,
        interest: 0,
        upfrontDeductedFees,
        upfrontPaidFees,
        recurringFees: 0,
        totalFees: upfrontDeductedFees + upfrontPaidFees,
      }
    };
  }

  if (netProceeds <= 0) {
    return {
      isValid: false,
      validationError: 'Tổng phí khấu trừ trước vượt quá số tiền vay hợp đồng.',
      contractPrincipal: safePrincipal,
      netProceeds: 0,
      firstPayment: safePayment,
      lastPayment: safePayment,
      totalScheduledPayments: 0,
      totalRepayment: 0,
      totalPaidToLender: 0,
      totalBorrowingCost: 0,
      totalFees: upfrontDeductedFees + upfrontPaidFees,
      periodicRate: 0,
      nominalAPR: 0,
      effectiveAnnualRate: 0,
      effectiveAPR: 0,
      cashFlows: [],
      breakdown: {
        principal: safePrincipal,
        interest: 0,
        upfrontDeductedFees,
        upfrontPaidFees,
        recurringFees: 0,
        totalFees: upfrontDeductedFees + upfrontPaidFees,
      }
    };
  }

  // Dòng tiền thực tế:
  // t0: Net cash nhận = + (netProceeds - upfrontPaidFees)
  // t1..n: Tiền trả mỗi kỳ = - (safePayment + safePeriodicFee)
  const initialCashFlow = netProceeds - upfrontPaidFees;
  const monthlyCashOut = safePayment + safePeriodicFee;

  const cashFlows = [initialCashFlow];
  for (let t = 1; t <= safeTerm; t++) {
    cashFlows.push(-monthlyCashOut);
  }

  // Tổng số tiền người vay phải trả
  const totalScheduledPayments = safePayment * safeTerm;
  const totalRecurringFees = safePeriodicFee * safeTerm;
  const totalRepayment = totalScheduledPayments + totalRecurringFees + upfrontPaidFees;
  const totalAllFees = upfrontDeductedFees + upfrontPaidFees + totalRecurringFees;
  const totalPaidToLender = totalScheduledPayments + totalAllFees;

  // Tổng chi phí vay thực tế (Total Borrowing Cost) = Tổng tiền chi ra - Số tiền thực nhận
  const totalBorrowingCost = Math.max(0, totalRepayment - netProceeds);

  // Tiền lãi danh nghĩa ước tính = Tổng trả kỳ - Gốc hợp đồng (nếu > 0)
  const estimatedInterest = Math.max(0, totalScheduledPayments - safePrincipal);

  // Giải IRR
  const periodicRate = solveIRR(cashFlows);
  const isRateComputable = periodicRate !== null && Number.isFinite(periodicRate) && periodicRate >= -0.5;

  const rateInfo = isRateComputable
    ? annualizeRate(periodicRate, 12)
    : { periodicRate: 0, nominalAPR: 0, effectiveAnnualRate: 0, effectiveAPR: 0 };

  return {
    isValid: true,
    isRateComputable,
    validationError: isRateComputable ? null : 'Không thể xác định lãi suất thực từ dòng tiền này. Vui lòng kiểm tra lại số liệu.',
    contractPrincipal: safePrincipal,
    netProceeds,
    netDisbursed: netProceeds,
    termMonths: safeTerm,
    monthlyPayment: safePayment,
    firstPayment: monthlyCashOut,
    lastPayment: monthlyCashOut,
    totalScheduledPayments,
    totalRepayment,
    totalPaidToLender,
    totalBorrowingCost,
    totalFees: totalAllFees,
    periodicRate: rateInfo.periodicRate,
    nominalAPR: rateInfo.nominalAPR,
    effectiveAnnualRate: rateInfo.effectiveAnnualRate,
    effectiveAPR: rateInfo.effectiveAPR,
    cashFlows,
    breakdown: {
      principal: safePrincipal,
      interest: estimatedInterest,
      upfrontDeductedFees,
      upfrontPaidFees,
      recurringFees: totalRecurringFees,
      totalFees: totalAllFees,
    },
    formulaNotes: {
      netProceedsFormula: `${safePrincipal.toLocaleString('vi-VN')} ₫ (Gốc) - ${upfrontDeductedFees.toLocaleString('vi-VN')} ₫ (Phí khấu trừ) = ${netProceeds.toLocaleString('vi-VN')} ₫`,
      totalRepaymentFormula: `${safePayment.toLocaleString('vi-VN')} ₫ × ${safeTerm} tháng + ${totalRecurringFees.toLocaleString('vi-VN')} ₫ (Phí kỳ) + ${upfrontPaidFees.toLocaleString('vi-VN')} ₫ (Phí ngoài) = ${totalRepayment.toLocaleString('vi-VN')} ₫`,
      totalCostFormula: `${totalRepayment.toLocaleString('vi-VN')} ₫ (Tổng trả) - ${netProceeds.toLocaleString('vi-VN')} ₫ (Thực nhận) = ${totalBorrowingCost.toLocaleString('vi-VN')} ₫`,
    }
  };
}

// ============================================================================
// MODE B: TÍNH KHOẢN TRẢ & LỊCH TRẢ NỢ TỪ LÃI SUẤT HỢP ĐỒNG
// ============================================================================

/**
 * @typedef {'amortized' | 'fixed_principal' | 'flat' | 'flat_rate'} LoanRepaymentMethod
 */

/**
 * @typedef {Object} PaymentScheduleRow
 * @property {number} period - Kỳ thứ (1, 2, ..., n)
 * @property {number} openingBalance - Dư nợ đầu kỳ
 * @property {number} principalPayment - Tiền gốc trả trong kỳ
 * @property {number} interestPayment - Tiền lãi trả trong kỳ
 * @property {number} feePayment - Phí trả trong kỳ
 * @property {number} totalPayment - Tổng khoản thanh toán kỳ này
 * @property {number} closingBalance - Dư nợ cuối kỳ
 */

/**
 * Mode B: Tính số tiền trả định kỳ, lịch trả nợ và quy đổi lãi suất thực tương đương.
 * @param {Object} options
 * @param {number} options.principal - Số tiền vay
 * @param {number} [options.annualRate] - Lãi suất năm (dạng thập phân 0.12 hoặc phần trăm 12)
 * @param {number} [options.annualInterestRatePercent] - Lãi suất năm phần trăm (12 cho 12%)
 * @param {number} options.termMonths - Thời hạn vay (tháng)
 * @param {LoanRepaymentMethod} [options.method='amortized'] - Phương pháp tính lãi
 * @param {LoanFeeItem[]} [options.fees=[]] - Các loại phí đi kèm
 * @param {number} [options.upfrontFee=0] - Phí thu trước
 * @param {number} [options.upfrontFees=0] - Phí thu trước
 * @param {number} [options.monthlyFee=0] - Phí định kỳ mỗi tháng
 * @param {number} [options.periodicFee=0] - Phí định kỳ mỗi tháng
 */
export function calculateLoanPaymentAndSchedule({
  principal,
  annualRate,
  annualInterestRatePercent,
  termMonths,
  method = 'amortized',
  fees = [],
  upfrontFee = 0,
  upfrontFees = 0,
  monthlyFee = 0,
  periodicFee = 0,
}) {
  const safePrincipal = Math.max(0, Math.round(Number(principal) || 0));
  const safeTerm = Math.max(0, Math.round(Number(termMonths) || 0));
  const safePeriodicFee = Math.max(0, Math.round(Number(monthlyFee || periodicFee) || 0));

  // Chuẩn hóa lãi suất sang dạng thập phân (0.12)
  let rawRate = 0;
  if (annualInterestRatePercent !== undefined && annualInterestRatePercent !== null) {
    rawRate = Number(annualInterestRatePercent) / 100;
  } else if (annualRate !== undefined && annualRate !== null) {
    const num = Number(annualRate);
    rawRate = num > 1 ? num / 100 : num;
  }
  const safeRate = Math.max(0, rawRate || 0);

  // Chuẩn hóa method
  const normalizedMethod = (method === 'flat' || method === 'flat_rate') ? 'flat_rate' : method;

  // Xử lý phí
  let upfrontDeductedFees = 0;
  let upfrontPaidFees = 0;
  if (Array.isArray(fees) && fees.length > 0) {
    for (const f of fees) {
      const amt = Math.max(0, Math.round(Number(f.amount) || 0));
      if (f.isDeductedUpfront) {
        upfrontDeductedFees += amt;
      } else {
        upfrontPaidFees += amt;
      }
    }
  } else {
    const totalUpfront = Math.max(0, Math.round(Number(upfrontFee || upfrontFees) || 0));
    upfrontDeductedFees += totalUpfront;
  }

  const netProceeds = Math.max(0, safePrincipal - upfrontDeductedFees);

  if (safePrincipal <= 0 || safeTerm <= 0) {
    return {
      isValid: false,
      validationError: 'Vui lòng nhập số tiền vay và thời hạn lớn hơn 0.',
      contractPrincipal: safePrincipal,
      netProceeds: safePrincipal,
      monthlyPayment: 0,
      firstPayment: 0,
      lastPayment: 0,
      firstMonthPayment: 0,
      lastMonthPayment: 0,
      totalInterest: 0,
      totalRepayment: 0,
      totalPaidToLender: 0,
      totalBorrowingCost: 0,
      totalFees: 0,
      effectiveAnnualRate: 0,
      effectiveAPR: 0,
      nominalAPR: 0,
      discrepancyAPR: 0,
      isFlatRateWarning: false,
      schedule: [],
      cashFlows: [],
      breakdown: {
        principal: safePrincipal,
        interest: 0,
        upfrontDeductedFees: 0,
        upfrontPaidFees: 0,
        recurringFees: 0,
        totalFees: 0,
      }
    };
  }

  const monthlyRate = safeRate / 12;

  /** @type {PaymentScheduleRow[]} */
  const schedule = [];
  let currentBalance = safePrincipal;
  let totalInterest = 0;
  let firstMonthPayment = 0;
  let lastMonthPayment = 0;

  if (normalizedMethod === 'amortized') {
    // A. Dư nợ giảm dần - Trả góp đều hàng tháng (PMT)
    let pmt = 0;
    if (monthlyRate === 0) {
      pmt = safePrincipal / safeTerm;
    } else {
      pmt = (safePrincipal * monthlyRate * Math.pow(1 + monthlyRate, safeTerm)) /
        (Math.pow(1 + monthlyRate, safeTerm) - 1);
    }
    const standardPmt = Math.round(pmt);

    for (let t = 1; t <= safeTerm; t++) {
      const opening = currentBalance;
      const interest = Math.round(opening * monthlyRate);
      let principalPay = standardPmt - interest;

      if (t === safeTerm || opening - principalPay < 0) {
        principalPay = opening;
      }
      const closing = Math.max(0, opening - principalPay);
      const totalPay = principalPay + interest + safePeriodicFee;

      totalInterest += interest;
      currentBalance = closing;

      schedule.push({
        period: t,
        openingBalance: opening,
        principalPayment: principalPay,
        interestPayment: interest,
        feePayment: safePeriodicFee,
        totalPayment: totalPay,
        closingBalance: closing,
        remainingBalance: closing,
      });
    }

    firstMonthPayment = schedule[0]?.totalPayment || 0;
    lastMonthPayment = schedule[schedule.length - 1]?.totalPayment || 0;
  } else if (normalizedMethod === 'fixed_principal') {
    // B. Gốc cố định chia đều, lãi giảm dần theo dư nợ
    const fixedPrincipalMonthly = Math.floor(safePrincipal / safeTerm);

    for (let t = 1; t <= safeTerm; t++) {
      const opening = currentBalance;
      const interest = Math.round(opening * monthlyRate);
      let principalPay = (t === safeTerm) ? opening : fixedPrincipalMonthly;
      const closing = Math.max(0, opening - principalPay);
      const totalPay = principalPay + interest + safePeriodicFee;

      totalInterest += interest;
      currentBalance = closing;

      schedule.push({
        period: t,
        openingBalance: opening,
        principalPayment: principalPay,
        interestPayment: interest,
        feePayment: safePeriodicFee,
        totalPayment: totalPay,
        closingBalance: closing,
        remainingBalance: closing,
      });
    }

    firstMonthPayment = schedule[0]?.totalPayment || 0;
    lastMonthPayment = schedule[schedule.length - 1]?.totalPayment || 0;
  } else {
    // C. Flat-rate: Lãi tính trên dư nợ ban đầu (Lãi phẳng)
    const totalFlatInterest = Math.round(safePrincipal * safeRate * (safeTerm / 12));
    const monthlyFlatInterest = Math.round(totalFlatInterest / safeTerm);
    const monthlyFlatPrincipal = Math.floor(safePrincipal / safeTerm);

    for (let t = 1; t <= safeTerm; t++) {
      const opening = currentBalance;
      const interest = monthlyFlatInterest;
      let principalPay = (t === safeTerm) ? opening : monthlyFlatPrincipal;
      const closing = Math.max(0, opening - principalPay);
      const totalPay = principalPay + interest + safePeriodicFee;

      totalInterest += interest;
      currentBalance = closing;

      schedule.push({
        period: t,
        openingBalance: opening,
        principalPayment: principalPay,
        interestPayment: interest,
        feePayment: safePeriodicFee,
        totalPayment: totalPay,
        closingBalance: closing,
        remainingBalance: closing,
      });
    }

    firstMonthPayment = schedule[0]?.totalPayment || 0;
    lastMonthPayment = schedule[schedule.length - 1]?.totalPayment || 0;
  }

  // Dựng dòng tiền thực tế để giải lãi suất thực tương đương (Effective APR)
  const initialCashFlow = netProceeds - upfrontPaidFees;
  const cashFlows = [initialCashFlow];
  for (const row of schedule) {
    cashFlows.push(-row.totalPayment);
  }

  const periodicIRR = solveIRR(cashFlows);
  const isRateComputable = periodicIRR !== null && Number.isFinite(periodicIRR) && periodicIRR >= -0.5;

  const rateInfo = isRateComputable
    ? annualizeRate(periodicIRR, 12)
    : { periodicRate: 0, nominalAPR: 0, effectiveAnnualRate: 0, effectiveAPR: 0 };

  const totalRecurringFees = safePeriodicFee * safeTerm;
  const totalRepayment = schedule.reduce((sum, row) => sum + row.totalPayment, 0) + upfrontPaidFees;
  const totalAllFees = upfrontDeductedFees + upfrontPaidFees + totalRecurringFees;
  const totalPaidToLender = totalRepayment + upfrontDeductedFees;
  const totalBorrowingCost = Math.max(0, totalRepayment - netProceeds);

  // Cảnh báo chênh lệch nếu dùng flat rate
  const isFlatRateWarning = normalizedMethod === 'flat_rate' && safeRate > 0;
  const discrepancyAPR = Math.max(0, Number((rateInfo.nominalAPR - safeRate * 100).toFixed(2)));

  return {
    isValid: true,
    isRateComputable,
    contractPrincipal: safePrincipal,
    netProceeds,
    netDisbursed: netProceeds,
    termMonths: safeTerm,
    method: normalizedMethod,
    nominalContractRate: safeRate,
    firstMonthPayment,
    lastMonthPayment,
    firstPayment: firstMonthPayment,
    lastPayment: lastMonthPayment,
    monthlyPayment: firstMonthPayment,
    averageMonthlyPayment: Math.round(totalRepayment / safeTerm),
    totalInterest,
    totalRepayment,
    totalPaidToLender,
    totalBorrowingCost,
    totalFees: totalAllFees,
    periodicRate: rateInfo.periodicRate,
    nominalAPR: rateInfo.nominalAPR,
    effectiveAnnualRate: rateInfo.effectiveAnnualRate,
    effectiveAPR: rateInfo.effectiveAPR,
    discrepancyAPR,
    isFlatRateWarning,
    cashFlows,
    schedule,
    breakdown: {
      principal: safePrincipal,
      interest: totalInterest,
      upfrontDeductedFees,
      upfrontPaidFees,
      recurringFees: totalRecurringFees,
      totalFees: totalAllFees,
    }
  };
}

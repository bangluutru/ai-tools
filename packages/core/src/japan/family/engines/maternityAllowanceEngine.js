/**
 * @file packages/core/src/japan/family/engines/maternityAllowanceEngine.js
 * @description
 * Công cụ tính toán Trợ cấp Thai sản Nhật Bản (出産手当金シミュレーター Engine).
 * Căn cứ:
 * - 健康保険法第102条（出産手当金）
 * - 健康保険法第104条（退職後の継続給付）
 * - 協会けんぽ業務規程（12ヶ月未満の平均標準報酬月額上限: 支給開始日 2025-04-01 以降 320,000円 / それ以前 300,000円、一部給与支給時の差額支給）
 */

import {
  MATERNITY_STATUTORY_CONSTANTS,
  MATERNITY_ALLOWANCE_SOURCES,
} from '../rules/maternityAllowanceRules.js';
import { lookupKenpoGrade } from '../../insurance/engines/standardRemunerationEngine.js';
import { addDaysISO, diffDaysISO, isValidISODate } from '../../employment/localDate.js';

/**
 * Cộng thêm số ngày vào chuỗi ngày 'YYYY-MM-DD' (theo lịch, không phụ thuộc múi giờ)
 * @param {string} dateStr
 * @param {number} days
 * @returns {string}
 */
export function addDays(dateStr, days) {
  if (!isValidISODate(dateStr)) return dateStr;
  return addDaysISO(dateStr, days);
}

/**
 * Trừ đi số ngày từ chuỗi ngày 'YYYY-MM-DD' (theo lịch, không phụ thuộc múi giờ)
 * @param {string} dateStr
 * @param {number} days
 * @returns {string}
 */
export function subtractDays(dateStr, days) {
  if (!isValidISODate(dateStr)) return dateStr;
  return addDaysISO(dateStr, -days);
}

/**
 * Tính số ngày chênh lệch giữa date2 và date1 (date2 - date1)
 * @param {string} date1Str
 * @param {string} date2Str
 * @returns {number}
 */
export function diffInDays(date1Str, date2Str) {
  if (!isValidISODate(date1Str) || !isValidISODate(date2Str)) return 0;
  return diffDaysISO(date1Str, date2Str);
}

/**
 * Mức bình quân 標準報酬月額 toàn hiệp hội 協会けんぽ dùng khi tham gia dưới 12 tháng, theo 支給開始日.
 * @param {string} benefitStartDate - YYYY-MM-DD
 * @returns {number}
 */
export function resolveKyokaiKenpoAverageCap(benefitStartDate) {
  const {
    KYOKAI_KENPO_AVERAGE_STANDARD_MONTHLY,
    KYOKAI_KENPO_AVERAGE_STANDARD_MONTHLY_BEFORE_2025_04,
    KYOKAI_KENPO_AVERAGE_EFFECTIVE_FROM,
  } = MATERNITY_STATUTORY_CONSTANTS;
  if (isValidISODate(benefitStartDate) && benefitStartDate < KYOKAI_KENPO_AVERAGE_EFFECTIVE_FROM) {
    return KYOKAI_KENPO_AVERAGE_STANDARD_MONTHLY_BEFORE_2025_04;
  }
  return KYOKAI_KENPO_AVERAGE_STANDARD_MONTHLY;
}

/**
 * Tính 出産手当金 日額 theo đúng quy tắc làm tròn của 協会けんぽ:
 * (tổng 標準報酬月額 ÷ số tháng) ÷ 30 → làm tròn đến 10円 (5円以上切上げ), × 2/3 → làm tròn 1円 (50銭以上切上げ).
 * Dùng số học nguyên để tránh sai số dấu phẩy động.
 * @param {number} totalRemuneration - Tổng 標準報酬月額 của các tháng
 * @param {number} [months=1] - Số tháng
 * @returns {{ dailyBase: number, dailyBenefit: number }}
 */
export function computeMaternityDailyAmount(totalRemuneration, months = 1) {
  const total = Math.max(0, Math.round(Number(totalRemuneration) || 0));
  const n = Math.max(1, Math.floor(Number(months) || 1));
  const unit = n * 30 * 10; // chia cho n tháng, 30 ngày, đơn vị 10円
  const dailyBase = Math.floor((2 * total + unit) / (2 * unit)) * 10;
  const dailyBenefit = Math.floor((4 * dailyBase + 3) / 6); // round(dailyBase × 2/3)
  return { dailyBase, dailyBenefit };
}

/**
 * Tính toán trợ cấp thai sản 出産手当金
 * @param {Object} params
 * @param {string} params.expectedBirthDate - Ngày dự sinh (YYYY-MM-DD)
 * @param {string} [params.actualBirthDate] - Ngày sinh thực tế (YYYY-MM-DD, mặc định = expectedBirthDate)
 * @param {boolean} [params.isMultiplePregnancy=false] - Đa thai (song thai, tam thai)
 * @param {number} [params.monthlySalary=300000] - Tiền lương thực tế hàng tháng (円)
 * @param {number} [params.standardRemuneration] - Mức thù lao chuẩn chỉ định trực tiếp (nếu có)
 * @param {number[]} [params.remunerationHistory] - Lịch sử thù lao chuẩn các tháng trước (円)
 * @param {number} [params.insuranceMonths=12] - Số tháng tham gia BHYT hiện tại
 * @param {'kyokai_kenpo' | 'health_insurance_society' | 'nhi' | 'other'} [params.insurerType='kyokai_kenpo'] - Loại bảo hiểm
 * @param {boolean} [params.isEmployedInsured=true] - Là người lao động tham gia BHYT doanh nghiệp (健康保険被保険者)
 * @param {number} [params.dailySalaryPaidDuringLeave=0] - Tiền lương thực tế nhận được mỗi ngày trong thời gian nghỉ
 * @param {boolean} [params.isLeavingJob=false] - Trường hợp nghỉ việc / mất tư cách
 * @param {number} [params.continuousInsuredYearsBeforeLeaving=0] - Số năm đóng BHYT liên tục trước khi nghỉ việc
 * @param {boolean} [params.workedOnRetirementDate=false] - Có đi làm và nhận lương vào ngày nghỉ việc chính thức không
 * @param {string} [params.retirementDate] - Ngày nghỉ việc (YYYY-MM-DD). Để nhận tiếp sau khi nghỉ, ngày này phải nằm
 *   trong kỳ 出産手当金 (từ 42 ngày — đa thai 98 ngày — trước ngày dự sinh trở đi)
 * @returns {Object}
 */
export function calculateMaternityAllowance({
  expectedBirthDate,
  actualBirthDate = null,
  isMultiplePregnancy = false,
  monthlySalary = 300000,
  standardRemuneration = null,
  remunerationHistory = null,
  insuranceMonths = 12,
  insurerType = 'kyokai_kenpo',
  isEmployedInsured = true,
  dailySalaryPaidDuringLeave = 0,
  isLeavingJob = false,
  continuousInsuredYearsBeforeLeaving = 0,
  workedOnRetirementDate = false,
  retirementDate = null,
} = {}) {
  const actualDate = actualBirthDate || expectedBirthDate;
  const salary = Math.max(0, Number(monthlySalary) || 0);
  const dailyPaidSalary = Math.max(0, Number(dailySalaryPaidDuringLeave) || 0);

  // 1. Kiểm tra điều kiện thụ hưởng (Eligibility Check)
  if (!isEmployedInsured || insurerType === 'nhi') {
    return {
      isEligible: false,
      ineligibleReasonCode: 'NOT_EMPLOYED_INSURED',
      ineligibleReasonJa: '国民健康保険の加入者や家族の被扶養者は、法律上の出産手当金の支給対象外です（健康保険法第102条。なお、出産育児一時金50万円は受給可能です）。',
      ineligibleReasonVi: 'Người tham gia BHYT Quốc dân (Quốc bảo - 国保) hoặc người phụ thuộc không thuộc đối tượng nhận Trợ cấp thai sản theo ngày 出産手当金 (nhưng vẫn được nhận Trợ cấp sinh con 出産育児一時金 500.000 yên).',
      ineligibleReasonEn: 'National Health Insurance (NHI) subscribers and dependents are not eligible for daily Maternity Allowance under Art. 102 of Health Insurance Act (Childbirth Lump-Sum Grant is still available).',
      eligiblePeriod: null,
      daysBreakdown: null,
      financials: null,
      regulatorySources: MATERNITY_ALLOWANCE_SOURCES,
    };
  }

  // 2. Tính toán số ngày và thời gian thụ hưởng (Period & Days Calculation)
  const basePrenatalDays = isMultiplePregnancy
    ? MATERNITY_STATUTORY_CONSTANTS.PRENATAL_DAYS_MULTIPLE // 98
    : MATERNITY_STATUTORY_CONSTANTS.PRENATAL_DAYS_SINGLE;  // 42

  const postnatalDays = MATERNITY_STATUTORY_CONSTANTS.POSTNATAL_DAYS; // 56
  const birthDiff = diffInDays(expectedBirthDate, actualDate);

  let prenatalDays = basePrenatalDays;
  let delayDays = 0;
  let earlyDays = 0;
  let birthDateRelation = 'on_due_date';

  if (birthDiff > 0) {
    // Sinh muộn hơn dự kiến: Các ngày chậm sinh được cộng thêm vào thời gian trước sinh
    delayDays = birthDiff;
    prenatalDays = basePrenatalDays + delayDays;
    birthDateRelation = 'after_due_date';
  } else if (birthDiff < 0) {
    // Sinh sớm hơn dự kiến
    earlyDays = Math.abs(birthDiff);
    prenatalDays = Math.max(1, basePrenatalDays - earlyDays);
    birthDateRelation = 'before_due_date';
  }

  const totalEligibleDays = prenatalDays + postnatalDays;

  // Xác định ngày bắt đầu và kết thúc kỳ nghỉ
  const leaveStartDate = subtractDays(expectedBirthDate, basePrenatalDays - 1);
  const leaveEndDate = addDays(actualDate, postnatalDays);

  // Kiểm tra trường hợp nghỉ việc (健康保険法第104条: 資格喪失後の継続給付)
  let isRetirementContinuation = false;
  if (isLeavingJob) {
    if (continuousInsuredYearsBeforeLeaving < 1) {
      return {
        isEligible: false,
        ineligibleReasonCode: 'RETIREMENT_TENURE_TOO_SHORT',
        ineligibleReasonJa: '退職後に継続給付を受けるには、退職日までに継続して1年以上の被保険者期間が必要です（健康保険法第104条）。',
        ineligibleReasonVi: 'Để tiếp tục nhận trợ cấp thai sản sau khi thôi việc, bạn phải tham gia BHYT công ty liên tục từ 1 năm trở lên trước ngày nghỉ việc.',
        ineligibleReasonEn: 'Continuing maternity benefits after leaving employment requires at least 1 continuous year of health insurance coverage prior to separation (Health Insurance Act Art. 104).',
        eligiblePeriod: null,
        daysBreakdown: null,
        financials: null,
        regulatorySources: MATERNITY_ALLOWANCE_SOURCES,
      };
    }

    if (workedOnRetirementDate) {
      return {
        isEligible: false,
        ineligibleReasonCode: 'RETIREMENT_WORKED_LAST_DAY',
        ineligibleReasonJa: '退職日当日に出勤して給与が発生した場合、「退職時に出産手当金を受けているか、受ける権利がある状態」を満たさないため、資格喪失後の給付資格を失います。',
        ineligibleReasonVi: 'Nếu vào ngày nghỉ việc chính thức bạn vẫn đi làm và nhận lương, bạn sẽ không đáp ứng điều kiện "đang nghỉ việc không hưởng lương để sinh con" và bị mất quyền nhận tiếp trợ cấp sau khi nghỉ việc.',
        ineligibleReasonEn: 'Working and receiving wages on your official retirement date disqualifies you from post-separation continuous maternity benefits.',
        eligiblePeriod: null,
        daysBreakdown: null,
        financials: null,
        regulatorySources: MATERNITY_ALLOWANCE_SOURCES,
      };
    }

    // Ngày nghỉ việc (= ngày trước ngày mất tư cách) phải nằm trong kỳ 出産手当金
    if (isValidISODate(retirementDate) && retirementDate < leaveStartDate) {
      return {
        isEligible: false,
        ineligibleReasonCode: 'RETIREMENT_BEFORE_MATERNITY_PERIOD',
        ineligibleReasonJa: `退職日（${retirementDate}）が出産手当金の支給期間（出産予定日以前${basePrenatalDays}日：${leaveStartDate}〜）より前のため、退職日に出産手当金を受けられる状態になく、資格喪失後の継続給付は受けられません。`,
        ineligibleReasonVi: `Ngày nghỉ việc (${retirementDate}) nằm TRƯỚC kỳ hưởng trợ cấp thai sản (bắt đầu từ ${leaveStartDate}, tức ${basePrenatalDays} ngày trước ngày dự sinh) nên vào ngày nghỉ việc bạn chưa ở trạng thái được hưởng 出産手当金 → không được nhận tiếp sau khi nghỉ việc. Muốn nhận, ngày nghỉ việc phải từ ${leaveStartDate} trở đi.`,
        ineligibleReasonEn: `Your retirement date (${retirementDate}) is before the maternity allowance period starts (${leaveStartDate}, ${basePrenatalDays} days before the due date), so you are not eligible for post-separation continuation.`,
        eligiblePeriod: null,
        daysBreakdown: null,
        financials: null,
        regulatorySources: MATERNITY_ALLOWANCE_SOURCES,
      };
    }

    isRetirementContinuation = true;
  }

  // 3. Xác định mức thù lao chuẩn bình quân (Average Standard Monthly Remuneration)
  let standardMonthlyRemuneration = 0;
  let calculationBasisType = 'standard_lookup';
  let basisExplanationJa = '';
  let basisExplanationVi = '';
  let isCappedByAssociationLimit = false;

  if (Array.isArray(remunerationHistory) && remunerationHistory.length >= 12) {
    // Trường hợp 1: Có đầy đủ 12 tháng lịch sử
    const sum12 = remunerationHistory.slice(-12).reduce((a, b) => a + Number(b || 0), 0);
    standardMonthlyRemuneration = Math.round(sum12 / 12);
    calculationBasisType = '12_months_history';
    basisExplanationJa = '支給開始日前12ヶ月間の標準報酬月額の平均額に基づき算定。';
    basisExplanationVi = 'Tính dựa trên mức bình quân thù lao chuẩn thực tế của 12 tháng trước ngày bắt đầu hưởng.';
  } else if (
    insuranceMonths < 12 ||
    (Array.isArray(remunerationHistory) && remunerationHistory.length > 0 && remunerationHistory.length < 12)
  ) {
    // Trường hợp 2: Tham gia dưới 12 tháng (quy tắc 協会けんぽ)
    let actualAverage = 0;
    if (Array.isArray(remunerationHistory) && remunerationHistory.length > 0) {
      const sum = remunerationHistory.reduce((a, b) => a + Number(b || 0), 0);
      actualAverage = Math.round(sum / remunerationHistory.length);
    } else {
      const grade = standardRemuneration
        ? { standardMonthly: standardRemuneration }
        : lookupKenpoGrade(salary);
      actualAverage = grade.standardMonthly;
    }

    if (insurerType === 'kyokai_kenpo') {
      const associationAvg = resolveKyokaiKenpoAverageCap(leaveStartDate); // 320,000円 (支給開始日 2025-04-01〜) / 300,000円
      if (actualAverage > associationAvg) {
        standardMonthlyRemuneration = associationAvg;
        isCappedByAssociationLimit = true;
        calculationBasisType = 'kyokai_kenpo_capped';
        basisExplanationJa = `加入期間12ヶ月未満のため、本人の各月平均（${actualAverage.toLocaleString()}円）と協会けんぽ全被保険者平均（${associationAvg.toLocaleString()}円）のいずれか少ない額を適用。`;
        basisExplanationVi = `Thời gian tham gia dưới 12 tháng: Áp dụng mức thấp hơn giữa mức bình quân của bản thân (${actualAverage.toLocaleString()}円) và trần bình quân toàn hiệp hội Kyokai Kenpo (${associationAvg.toLocaleString()}円).`;
      } else {
        standardMonthlyRemuneration = actualAverage;
        calculationBasisType = 'less_than_12_months_actual';
        basisExplanationJa = `加入期間12ヶ月未満のため、本人の平均標準報酬月額（${actualAverage.toLocaleString()}円）を適用。`;
        basisExplanationVi = `Thời gian tham gia dưới 12 tháng: Áp dụng mức thù lao chuẩn bình quân của các tháng thực tế (${actualAverage.toLocaleString()}円).`;
      }
    } else {
      standardMonthlyRemuneration = actualAverage;
      calculationBasisType = 'less_than_12_months_actual';
      basisExplanationJa = `加入期間12ヶ月未満の実績平均（${actualAverage.toLocaleString()}円）を適用。`;
      basisExplanationVi = `Áp dụng bình quân các tháng thực tế (${actualAverage.toLocaleString()}円) theo quy định của quỹ BHYT.`;
    }
  } else {
    // Trường hợp 3: Ước tính từ mức lương hiện tại qua bảng thù lao chuẩn
    const grade = standardRemuneration
      ? { standardMonthly: standardRemuneration }
      : lookupKenpoGrade(salary);
    standardMonthlyRemuneration = grade.standardMonthly;
    calculationBasisType = 'standard_grade_lookup';
    basisExplanationJa = `現在の月給（${salary.toLocaleString()}円）に対応する健康保険標準報酬月額（${standardMonthlyRemuneration.toLocaleString()}円）から試算（概算）。`;
    basisExplanationVi = `Ước tính (概算) dựa trên bậc thù lao chuẩn BHYT (${standardMonthlyRemuneration.toLocaleString()}円) tương ứng với lương tháng hiện tại (${salary.toLocaleString()}円).`;
  }

  // 4. Tính toán số tiền theo ngày và tổng mức trợ cấp (Daily & Total Benefit)
  // Công thức: 標準報酬月額(平均) ÷ 30 → 10円未満四捨五入; × 2/3 → 1円未満四捨五入
  const { dailyBase: dailyRemunerationBase, dailyBenefit: standardDailyBenefit } = calculationBasisType === '12_months_history'
    ? computeMaternityDailyAmount(remunerationHistory.slice(-12).reduce((a, b) => a + Number(b || 0), 0), 12)
    : computeMaternityDailyAmount(standardMonthlyRemuneration, 1);

  // Khấu trừ nếu công ty có trả lương trong thời gian nghỉ
  let netDailyBenefit = standardDailyBenefit;
  let dailySalaryOffset = 0;
  let isPartialSalaryOffset = false;
  let isFullSalaryOffset = false;

  if (dailyPaidSalary > 0) {
    if (dailyPaidSalary >= standardDailyBenefit) {
      netDailyBenefit = 0;
      dailySalaryOffset = standardDailyBenefit;
      isFullSalaryOffset = true;
    } else {
      dailySalaryOffset = dailyPaidSalary;
      netDailyBenefit = standardDailyBenefit - dailyPaidSalary;
      isPartialSalaryOffset = true;
    }
  }

  const totalGrossAmount = standardDailyBenefit * totalEligibleDays;
  const totalSalaryOffset = dailySalaryOffset * totalEligibleDays;
  const totalNetAmount = netDailyBenefit * totalEligibleDays;

  return {
    isEligible: true,
    isRetirementContinuation,
    isEstimated: calculationBasisType === 'standard_grade_lookup',
    birthDateRelation,
    eligiblePeriod: {
      leaveStartDate,
      leaveEndDate,
      expectedBirthDate,
      actualBirthDate: actualDate,
      totalEligibleDays,
    },
    daysBreakdown: {
      prenatalDays,
      basePrenatalDays,
      delayDays,
      earlyDays,
      postnatalDays,
      isMultiplePregnancy,
    },
    financials: {
      monthlySalary: salary,
      standardMonthlyRemuneration,
      dailyRemunerationBase,
      isCappedByAssociationLimit,
      calculationBasisType,
      standardDailyBenefit,
      dailyPaidSalary,
      dailySalaryOffset,
      netDailyBenefit,
      totalGrossAmount,
      totalSalaryOffset,
      totalNetAmount,
      isPartialSalaryOffset,
      isFullSalaryOffset,
      basisExplanationJa,
      basisExplanationVi,
    },
    regulatorySources: MATERNITY_ALLOWANCE_SOURCES,
  };
}

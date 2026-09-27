/**
 * @file packages/core/src/japan/employment/engines/leavingJobEngine.js
 * @description
 * Công cụ điều phối & lập kế hoạch thủ tục nghỉ việc tại Nhật Bản (Japan Leaving Job Wizard Engine).
 * Tính toán mốc thời gian luật định, phân loại khấu trừ thuế cư trú, khuyến nghị bảo hiểm y tế,
 * và sinh danh mục công việc (Checklist) cá nhân hóa với các deep-links điều hướng.
 */

import {
  LEAVING_STAGES,
  HEALTH_INSURANCE_OPTIONS,
  RESIDENT_TAX_RULES,
  LEAVING_ACTION_ITEMS,
  LEAVING_JOB_SOURCES,
} from '../rules/leavingJobRules.js';
import { leavingJobRuntime } from '../rules/leavingJobDefinition.js';
import { addDaysISO, addMonthsClampISO, isValidISODate, parseISODateParts, todayLocalISO } from '../localDate.js';

/**
 * Ngưỡng 基本手当日額 khiến không thể vào diện phụ thuộc BHYT trong thời gian nhận trợ cấp
 * (130万円 ÷ 360 → từ 3,612円/ngày; 180万円 ÷ 360 = 5,000円/ngày cho người 60+ hoặc khuyết tật).
 */
export const DEPENDENT_BENEFIT_DAILY_LIMITS = {
  general: 3612,
  seniorOrDisabled: 5000,
};

/**
 * Cộng thêm số ngày vào một chuỗi ngày 'YYYY-MM-DD' (theo lịch, không phụ thuộc múi giờ)
 * @param {string} dateStr
 * @param {number} days
 * @returns {string}
 */
export function addDays(dateStr, days) {
  if (!isValidISODate(dateStr)) return dateStr;
  return addDaysISO(dateStr, days);
}

/**
 * Trừ đi số ngày từ một chuỗi ngày 'YYYY-MM-DD' (theo lịch, không phụ thuộc múi giờ)
 * @param {string} dateStr
 * @param {number} days
 * @returns {string}
 */
export function subtractDays(dateStr, days) {
  if (!isValidISODate(dateStr)) return dateStr;
  return addDaysISO(dateStr, -days);
}

/**
 * Phân loại quy định khấu trừ thuế cư trú dựa vào tháng nghỉ việc
 * Căn cứ: 地方税法第321条の5
 * @param {string} resignationDate
 * @returns {typeof RESIDENT_TAX_RULES[keyof typeof RESIDENT_TAX_RULES] & { resignationMonth: number }}
 */
export function classifyResidentTaxCollection(resignationDate) {
  const parts = parseISODateParts(resignationDate);
  const month = parts ? parts.m : 6; // 1-12

  if (month >= 1 && month <= 5) {
    return {
      ...RESIDENT_TAX_RULES.JAN_TO_MAY,
      resignationMonth: month,
      isMandatoryLumpSum: true,
    };
  }

  return {
    ...RESIDENT_TAX_RULES.JUN_TO_DEC,
    resignationMonth: month,
    isMandatoryLumpSum: false,
  };
}

/**
 * Đánh giá và gợi ý lựa chọn Bảo hiểm Y tế sau khi nghỉ việc
 * @param {Object} params
 * @param {string} [params.healthInsurancePreference]
 * @param {number} [params.annualExpectedIncome]
 * @param {boolean} [params.isCompanySeparation] - Thôi việc không tự nguyện (特定受給資格者 hoặc 特定理由離職者 như 雇止め)
 * @param {boolean} [params.isSeniorOrDisabled=false] - 60 tuổi trở lên hoặc người khuyết tật (ngưỡng phụ thuộc 180万円)
 * @returns {Object}
 */
export function evaluateHealthInsuranceAdvice({
  healthInsurancePreference = 'undecided',
  annualExpectedIncome = 0,
  isCompanySeparation = false,
  isSeniorOrDisabled = false,
} = {}) {
  let recommendation = 'undecided';
  let recommendationReasonJa = '';
  let recommendationReasonVi = '';
  let recommendationReasonEn = '';
  const warnings = [];
  const dependentIncomeLimit = isSeniorOrDisabled
    ? HEALTH_INSURANCE_OPTIONS.DEPENDENT.maxAnnualIncomeSenior
    : HEALTH_INSURANCE_OPTIONS.DEPENDENT.maxAnnualIncome;
  const dailyLimit = isSeniorOrDisabled
    ? DEPENDENT_BENEFIT_DAILY_LIMITS.seniorOrDisabled
    : DEPENDENT_BENEFIT_DAILY_LIMITS.general;

  if (annualExpectedIncome > 0 && annualExpectedIncome < dependentIncomeLimit) {
    recommendation = 'dependent';
    const limitMan = dependentIncomeLimit / 10000;
    recommendationReasonJa = `年収見込みが${limitMan}万円未満の場合、家族の社会保険の被扶養者に入ることで保険料負担が0円になります。ただし、雇用保険の基本手当を日額${dailyLimit.toLocaleString()}円以上で受給している間は被扶養者になれません（待期期間・給付制限期間中は可能）。`;
    recommendationReasonVi = `Thu nhập dự kiến dưới ${(dependentIncomeLimit / 1000000).toLocaleString()} triệu yên/năm: có thể vào phụ thuộc BHYT của người thân để không tốn phí. LƯU Ý: trong thời gian đang nhận trợ cấp thất nghiệp (基本手当) từ ${dailyLimit.toLocaleString()}円/ngày trở lên thì KHÔNG được làm người phụ thuộc (chỉ được trong 7 ngày chờ và thời gian hạn chế chi trả), phải tự tham gia 国保 hoặc 任意継続 trong thời gian đó.`;
    recommendationReasonEn = `Projected annual income under ${(dependentIncomeLimit / 1000000).toLocaleString()}M JPY: joining family dependent insurance costs 0 JPY. However, while receiving the unemployment basic allowance at ${dailyLimit.toLocaleString()} JPY/day or more you cannot be a dependent (only during the 7-day waiting and restriction periods).`;
    warnings.push({
      code: 'DEPENDENT_BLOCKED_WHILE_RECEIVING_BENEFIT',
      level: 'warning',
      dailyLimit,
      ja: `基本手当日額が${dailyLimit.toLocaleString()}円以上の場合、受給期間中は被扶養者になれません。`,
      vi: `Nếu trợ cấp thất nghiệp từ ${dailyLimit.toLocaleString()}円/ngày trở lên, trong thời gian nhận trợ cấp không thể vào diện phụ thuộc.`,
      en: `With a daily allowance of ${dailyLimit.toLocaleString()} JPY or more you cannot be a dependent while receiving it.`,
    });
  } else if (isCompanySeparation) {
    recommendation = 'national_health_insurance';
    recommendationReasonJa = '特定受給資格者（会社都合）・特定理由離職者（雇止め等）で離職時65歳未満の場合、届出により国民健康保険料の算定上、前年の給与所得を100分の30とみなす軽減措置（所得割が対象、均等割は軽減なし）を受けられるため、国保が有利になる可能性が高いです。任意継続の保険料と比較してください。';
    recommendationReasonVi = 'Diện 特定受給資格者 (do công ty) hoặc 特定理由離職者 (hết hạn HĐ không được tái ký...) dưới 65 tuổi: khai báo tại quận thì 給与所得 năm trước chỉ bị tính 30% khi tính phần phí theo thu nhập (所得割) của BHYT Quốc dân; phần 均等割 không giảm. Thường có lợi hơn 任意継続, nhưng hãy so sánh số tiền cụ thể.';
    recommendationReasonEn = 'Involuntary leavers under 65 (特定受給資格者 / 特定理由離職者) can have previous-year employment income counted at 30/100 for the income-based NHI portion (the per-capita portion is not reduced). NHI is likely cheaper than voluntary continuation, but compare actual quotes.';
  } else {
    recommendation = 'compare_voluntary_and_nhi';
    recommendationReasonJa = '前年の年収や標準報酬月額により、任意継続（上限あり）と国民健康保険のどちらが安いか市区町村窓口で試算比較することをお勧めします。';
    recommendationReasonVi = 'Nên liên hệ Ủy ban quận để hỏi trước số tiền BHYT Quốc dân và so sánh với mức phí Tiếp tục tự nguyện (bằng 2 lần mức BHYT đang đóng trên phiếu lương, tối đa theo trần quy định).';
    recommendationReasonEn = 'Compare Voluntary Continuation (capped at association limit) against municipal NHI based on your previous year earnings.';
  }

  return {
    selectedPreference: healthInsurancePreference,
    recommendedOption: recommendation,
    recommendationReasonJa,
    recommendationReasonVi,
    recommendationReasonEn,
    warnings,
    options: HEALTH_INSURANCE_OPTIONS,
  };
}

/**
 * Sinh kế hoạch thủ tục nghỉ việc hoàn chỉnh
 * @param {Object} input
 * @param {string} input.resignationDate - Ngày thôi việc chính thức ('YYYY-MM-DD')
 * @param {string} [input.healthInsurancePreference] - 'voluntary_continuation' | 'national_health_insurance' | 'dependent' | 'undecided'
 * @param {string} [input.separationType] - 'personal' | 'company' | 'contract_expiry' (contract_expiry = 雇止め, 特定理由離職者)
 * @param {boolean} [input.isSeniorOrDisabled] - 60 tuổi trở lên hoặc khuyết tật (ngưỡng phụ thuộc 180万円)
 * @param {boolean} [input.hasNewJobImmediately] - Đã có việc làm tiếp theo ngay chưa
 * @param {number} [input.annualExpectedIncome] - Thu nhập kỳ vọng trong năm tới
 * @param {number} [input.remainingPaidLeaveDays] - Số ngày phép năm còn lại
 * @returns {Object} Kế hoạch chi tiết với mốc thời gian, checklist, và cảnh báo
 */
export function generateLeavingJobPlan(input = {}) {
  const today = todayLocalISO();
  const resignationDate = isValidISODate(input.resignationDate) ? input.resignationDate : today;
  const hasNewJobImmediately = Boolean(input.hasNewJobImmediately);
  // 国保 非自発的失業者軽減: 特定受給資格者 (company) và 特定理由離職者 (雇止め = contract_expiry)
  const isCompanySeparation = input.separationType === 'company' || input.separationType === 'contract_expiry';
  const remainingPaidLeaveDays = Number(input.remainingPaidLeaveDays) || 0;
  const annualExpectedIncome = Number(input.annualExpectedIncome) || 0;

  // 1. Mốc thời gian luật định (Statutory Deadlines)
  const civilCodeNoticeDate = subtractDays(resignationDate, 14); // 2 tuần trước theo Dân luật 627
  const voluntaryContinuationDeadline = addDays(resignationDate, 20); // 20 ngày đối với 任意継続
  const municipalProceduresDeadline = addDays(resignationDate, 14); // 14 ngày đối với 国保 & 国民年金
  const rishokuhyoEstimatedStart = addDays(resignationDate, 10);
  const rishokuhyoEstimatedEnd = addDays(resignationDate, 14);
  const withholdingSlipDeadline = addDays(resignationDate, 30);
  // 受給期間: 離職日の翌日から起算して1年 → kết thúc vào ngày 応当日 của ngày nghỉ năm sau (民法第143条)
  const unemploymentBenefitPeriodEnd = addMonthsClampISO(resignationDate, 12);

  // 2. Quy định thuế cư trú
  const residentTaxRule = classifyResidentTaxCollection(resignationDate);

  // 3. Tư vấn BHYT
  const healthInsuranceAdvice = evaluateHealthInsuranceAdvice({
    healthInsurancePreference: input.healthInsurancePreference,
    annualExpectedIncome,
    isCompanySeparation,
    isSeniorOrDisabled: Boolean(input.isSeniorOrDisabled),
  });

  // 4. Lọc và tùy biến danh mục công việc (Checklist items) qua Life Event Runtime
  const checklist = leavingJobRuntime.evaluateChecklist({
    ...input,
    resignationDate,
    hasNewJobImmediately,
    remainingPaidLeaveDays,
    healthInsurancePreference: input.healthInsurancePreference,
  }).map((item) => ({
    ...item,
    deadlineDate: item.calculatedDeadlineDate || '',
  }));

  // 5. Trục thời gian tiến trình (Chronological Timeline)
  const timeline = [
    {
      date: civilCodeNoticeDate,
      stageId: 'before_resignation',
      titleJa: '民法上の退職意思申入れリミット（2週間前）',
      titleVi: 'Hạn chót thông báo thôi việc theo luật (2 tuần trước)',
      titleEn: 'Statutory Resignation Notice Deadline (2 weeks prior)',
      isCritical: true,
      descriptionJa: '民法第627条第1項による最短申入れ期限。',
      descriptionVi: 'Hạn chót luật định theo Điều 627 Luật Dân sự Nhật Bản.',
    },
    {
      date: resignationDate,
      stageId: 'last_day',
      titleJa: '退職日（翌日に健康保険資格喪失・備品返却）',
      titleVi: 'Ngày thôi việc chính thức (Mất BHYT công ty từ hôm sau & bàn giao)',
      titleEn: 'Official Resignation Day (Coverage Ends Next Day & Return Assets)',
      isCritical: true,
      descriptionJa: '資格確認書（交付されている場合）や会社備品を返却し、雇用保険被保険者証等を受領。マイナ保険証は返却不要。',
      descriptionVi: 'Trả lại 資格確認書 (nếu được cấp) và tài sản công ty, nhận giấy tờ BHTN. Thẻ My Number (マイナ保険証) không phải trả.',
    },
    {
      date: municipalProceduresDeadline,
      stageId: 'after_resignation',
      titleJa: '市区町村手続き期限（国保・国民年金：14日以内）',
      titleVi: 'Hạn chót thủ tục tại Ủy ban (BHYT Quốc dân & Lương hưu: 14 ngày)',
      titleEn: 'Municipal Procedures Deadline (NHI & National Pension: 14 days)',
      isCritical: !hasNewJobImmediately,
      descriptionJa: '国民健康保険および国民年金の加入・種別変更期限。',
      descriptionVi: 'Hạn nộp hồ sơ BHYT Quốc dân và Lương hưu Quốc dân tại ủy ban.',
    },
    {
      date: voluntaryContinuationDeadline,
      stageId: 'after_resignation',
      titleJa: '健康保険任意継続の申請期限（20日以内必着）',
      titleVi: 'Hạn chót nộp đơn Tiếp tục tự nguyện BHYT công ty (20 ngày)',
      titleEn: 'Voluntary Health Insurance Deadline (Strict 20 days)',
      isCritical: input.healthInsurancePreference === 'voluntary_continuation',
      descriptionJa: '全国健康保険協会または健保組合への必着期限。1日でも遅れると受理不可。',
      descriptionVi: 'Hồ sơ phải đến nơi nhận trong vòng 20 ngày. Quá hạn 1 ngày cũng bị từ chối.',
    },
    {
      date: `${rishokuhyoEstimatedStart} 〜 ${rishokuhyoEstimatedEnd}`,
      stageId: 'after_resignation',
      titleJa: '離職票の到着目安（退職後約10〜14日）',
      titleVi: 'Thời gian dự kiến nhận Giấy thôi việc Hello Work (10-14 ngày)',
      titleEn: 'Expected Arrival of Separation Slips (10-14 days post-resignation)',
      isCritical: false,
      descriptionJa: '届き次第すぐにハローワークへ行き受給手続きを行います（法定の申込期限はありませんが、遅れると受給期間内に受け取れる日数が減ります）。',
      descriptionVi: 'Nhận xong mang ngay đến Hello Work làm thủ tục (không có hạn chót luật định, nhưng đi muộn có thể mất ngày hưởng).',
    },
    {
      date: unemploymentBenefitPeriodEnd,
      stageId: 'after_resignation',
      titleJa: '基本手当の受給期間の終了（離職日の翌日から1年）',
      titleVi: 'Hết thời hạn nhận trợ cấp thất nghiệp (1 năm kể từ ngày hôm sau ngày nghỉ)',
      titleEn: 'End of Unemployment Benefit Period (1 year after separation)',
      isCritical: !hasNewJobImmediately,
      descriptionJa: 'この日を過ぎると所定給付日数が残っていても支給されません（病気・出産等で延長申請した場合を除く）。',
      descriptionVi: 'Quá ngày này, số ngày trợ cấp còn lại sẽ bị mất (trừ khi đã xin gia hạn do ốm đau, sinh con...).',
    },
  ];

  // 6. Deep-links công cụ liên quan
  const deepLinks = [
    {
      toolId: 'paid-leave-checker-jp',
      titleJa: '有給休暇チェッカー',
      titleVi: 'Kiểm tra ngày phép năm',
      titleEn: 'Paid Leave Checker',
      badgeJa: '労働法',
      badgeVi: 'Lao động',
      badgeEn: 'Labor',
    },
    {
      toolId: 'overtime-calculator-jp',
      titleJa: '残業代シミュレーター',
      titleVi: 'Tính tiền làm thêm giờ',
      titleEn: 'Overtime Calculator',
      badgeJa: '給与',
      badgeVi: 'Lương',
      badgeEn: 'Wage',
    },
    {
      toolId: 'unemployment-eligibility-jp',
      titleJa: '失業給付受給資格チェッカー',
      titleVi: 'Kiểm tra điều kiện BHTN',
      titleEn: 'Unemployment Eligibility',
      badgeJa: '雇用保険',
      badgeVi: 'BHTN',
      badgeEn: 'Unemployment',
    },
    {
      toolId: 'unemployment-benefit-jp',
      titleJa: '失業給付シミュレーター',
      titleVi: 'Mô phỏng tiền trợ cấp thất nghiệp',
      titleEn: 'Unemployment Benefit',
      badgeJa: '試算',
      badgeVi: 'Mô phỏng',
      badgeEn: 'Simulation',
    },
    {
      toolId: 'dependent-insurance-jp',
      titleJa: '被扶養者判定チェッカー',
      titleVi: 'Kiểm tra điều kiện BHYT phụ thuộc',
      titleEn: 'Dependent Insurance',
      badgeJa: '健康保険',
      badgeVi: 'BHYT',
      badgeEn: 'Health',
    },
    {
      toolId: 'national-pension-jp',
      titleJa: '国民年金シミュレーター',
      titleVi: 'Mô phỏng Lương hưu Quốc dân',
      titleEn: 'National Pension',
      badgeJa: '年金',
      badgeVi: 'Lương hưu',
      badgeEn: 'Pension',
    },
    {
      toolId: 'japan-tax-simulator',
      titleJa: '日本税金シミュレーター',
      titleVi: 'Mô phỏng Thuế Nhật Bản',
      titleEn: 'Japan Tax Simulator',
      badgeJa: '税金',
      badgeVi: 'Thuế',
      badgeEn: 'Tax',
    },
  ];

  return {
    resignationDate,
    statutoryDeadlines: {
      civilCodeNoticeDate,
      voluntaryContinuationDeadline,
      municipalProceduresDeadline,
      rishokuhyoEstimatedStart,
      rishokuhyoEstimatedEnd,
      withholdingSlipDeadline,
      unemploymentBenefitPeriodEnd,
    },
    residentTaxRule,
    healthInsuranceAdvice,
    checklist,
    timeline,
    deepLinks,
    regulatorySources: LEAVING_JOB_SOURCES,
    lifeEventRuntime: leavingJobRuntime,
  };
}

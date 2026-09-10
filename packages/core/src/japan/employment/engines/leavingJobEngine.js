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

/**
 * Cộng thêm số ngày vào một chuỗi ngày 'YYYY-MM-DD'
 * @param {string} dateStr
 * @param {number} days
 * @returns {string}
 */
export function addDays(dateStr, days) {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

/**
 * Trừ đi số ngày từ một chuỗi ngày 'YYYY-MM-DD'
 * @param {string} dateStr
 * @param {number} days
 * @returns {string}
 */
export function subtractDays(dateStr, days) {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  d.setDate(d.getDate() - days);
  return d.toISOString().split('T')[0];
}

/**
 * Phân loại quy định khấu trừ thuế cư trú dựa vào tháng nghỉ việc
 * Căn cứ: 地方税法第321条の5
 * @param {string} resignationDate
 * @returns {typeof RESIDENT_TAX_RULES[keyof typeof RESIDENT_TAX_RULES] & { resignationMonth: number }}
 */
export function classifyResidentTaxCollection(resignationDate) {
  const d = new Date(resignationDate);
  const month = isNaN(d.getTime()) ? 6 : d.getMonth() + 1; // 1-12

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
 * @param {boolean} [params.isCompanySeparation]
 * @returns {Object}
 */
export function evaluateHealthInsuranceAdvice({
  healthInsurancePreference = 'undecided',
  annualExpectedIncome = 0,
  isCompanySeparation = false,
} = {}) {
  let recommendation = 'undecided';
  let recommendationReasonJa = '';
  let recommendationReasonVi = '';
  let recommendationReasonEn = '';

  if (annualExpectedIncome > 0 && annualExpectedIncome < 1300000) {
    recommendation = 'dependent';
    recommendationReasonJa = '年収見込みが130万円未満の場合、家族の社会保険の被扶養者に入ることで保険料負担が0円になります。最も経済的です。';
    recommendationReasonVi = 'Thu nhập dự kiến dưới 1,3 triệu yên/năm: Nên vào phụ thuộc BHYT của người thân để không tốn tiền đóng bảo hiểm y tế.';
    recommendationReasonEn = 'Projected annual income under 1.3M JPY: Joining family dependent insurance results in 0 JPY premium, most economical.';
  } else if (isCompanySeparation) {
    recommendation = 'national_health_insurance';
    recommendationReasonJa = '会社都合退職の場合、国民健康保険料の軽減措置（最大7割減額）が受けられるため、国保が大幅に有利になる可能性が高いです。';
    recommendationReasonVi = 'Thôi việc do lý do công ty: Được hưởng chính sách giảm tới 70% phí BHYT Quốc dân tại ủy ban quận/thị xã, thường có lợi hơn 任意継続.';
    recommendationReasonEn = 'Involuntary company separation: Eligible for municipal NHI premium discount up to 70%, likely superior to voluntary continuation.';
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
    options: HEALTH_INSURANCE_OPTIONS,
  };
}

/**
 * Sinh kế hoạch thủ tục nghỉ việc hoàn chỉnh
 * @param {Object} input
 * @param {string} input.resignationDate - Ngày thôi việc chính thức ('YYYY-MM-DD')
 * @param {string} [input.healthInsurancePreference] - 'voluntary_continuation' | 'national_health_insurance' | 'dependent' | 'undecided'
 * @param {string} [input.separationType] - 'personal' | 'company' | 'contract_expiry'
 * @param {boolean} [input.hasNewJobImmediately] - Đã có việc làm tiếp theo ngay chưa
 * @param {number} [input.annualExpectedIncome] - Thu nhập kỳ vọng trong năm tới
 * @param {number} [input.remainingPaidLeaveDays] - Số ngày phép năm còn lại
 * @returns {Object} Kế hoạch chi tiết với mốc thời gian, checklist, và cảnh báo
 */
export function generateLeavingJobPlan(input = {}) {
  const today = new Date().toISOString().split('T')[0];
  const resignationDate = input.resignationDate || today;
  const hasNewJobImmediately = Boolean(input.hasNewJobImmediately);
  const isCompanySeparation = input.separationType === 'company';
  const remainingPaidLeaveDays = Number(input.remainingPaidLeaveDays) || 0;
  const annualExpectedIncome = Number(input.annualExpectedIncome) || 0;

  // 1. Mốc thời gian luật định (Statutory Deadlines)
  const civilCodeNoticeDate = subtractDays(resignationDate, 14); // 2 tuần trước theo Dân luật 627
  const voluntaryContinuationDeadline = addDays(resignationDate, 20); // 20 ngày đối với 任意継続
  const municipalProceduresDeadline = addDays(resignationDate, 14); // 14 ngày đối với 国保 & 国民年金
  const rishokuhyoEstimatedStart = addDays(resignationDate, 10);
  const rishokuhyoEstimatedEnd = addDays(resignationDate, 14);
  const withholdingSlipDeadline = addDays(resignationDate, 30);

  // 2. Quy định thuế cư trú
  const residentTaxRule = classifyResidentTaxCollection(resignationDate);

  // 3. Tư vấn BHYT
  const healthInsuranceAdvice = evaluateHealthInsuranceAdvice({
    healthInsurancePreference: input.healthInsurancePreference,
    annualExpectedIncome,
    isCompanySeparation,
  });

  // 4. Lọc và tùy biến danh mục công việc (Checklist items)
  const checklist = LEAVING_ACTION_ITEMS.map((item) => {
    let isApplicable = true;
    let customNoteJa = '';
    let customNoteVi = '';
    let customNoteEn = '';
    let deadlineDate = '';

    if (item.id === 'notice_resignation') {
      deadlineDate = civilCodeNoticeDate;
    } else if (item.id === 'consume_paid_leave') {
      if (remainingPaidLeaveDays > 0) {
        customNoteJa = `現在残日数: ${remainingPaidLeaveDays}日。退職日までに全日数消化を推奨。`;
        customNoteVi = `Số phép còn lại: ${remainingPaidLeaveDays} ngày. Đề nghị lên lịch nghỉ hết trước ngày thôi việc.`;
        customNoteEn = `Remaining days: ${remainingPaidLeaveDays} days. Schedule full consumption before resignation.`;
      }
    } else if (item.id === 'health_insurance_procedure') {
      deadlineDate = input.healthInsurancePreference === 'voluntary_continuation'
        ? voluntaryContinuationDeadline
        : municipalProceduresDeadline;
      if (hasNewJobImmediately) {
        isApplicable = false;
        customNoteJa = '転職先の社会保険に即日加入するため、個人での切り替え手続きは不要です。';
        customNoteVi = 'Do chuyển sang công ty mới ngay, công ty mới sẽ làm thủ tục tham gia BHYT.';
        customNoteEn = 'New employer will enroll you into their health insurance immediately.';
      }
    } else if (item.id === 'national_pension_switch') {
      deadlineDate = municipalProceduresDeadline;
      if (hasNewJobImmediately) {
        isApplicable = false;
        customNoteJa = '転職先の厚生年金に引き継がれるため、市区町村窓口での手続きは不要です。';
        customNoteVi = 'Được tiếp nối đóng Lương hưu Phúc lợi tại công ty mới, không cần ra ủy ban.';
        customNoteEn = 'Transferred directly to new employer welfare pension, municipal procedure not needed.';
      }
    } else if (item.id === 'hellowork_unemployment_claim') {
      deadlineDate = rishokuhyoEstimatedEnd;
      if (hasNewJobImmediately) {
        isApplicable = false;
        customNoteJa = 'すでに次の転職先が決まっているため、失業給付の受給手続きは不要です。';
        customNoteVi = 'Đã có việc làm tiếp theo ngay nên không cần làm thủ tục hưởng trợ cấp thất nghiệp.';
        customNoteEn = 'Already secured next employment, unemployment allowance claim is not applicable.';
      }
    } else if (item.id === 'year_end_tax_filing') {
      if (hasNewJobImmediately) {
        customNoteJa = '転職先で前職の源泉徴収票を提出し、年末調整を受けられます。';
        customNoteVi = 'Nộp phiếu khấu trừ thuế công ty cũ cho công ty mới để làm điều chỉnh thuế cuối năm.';
        customNoteEn = 'Submit previous employer withholding slip to new employer for year-end adjustment.';
      }
    }

    return {
      ...item,
      isApplicable,
      deadlineDate,
      customNoteJa,
      customNoteVi,
      customNoteEn,
    };
  });

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
      titleJa: '退職日（健康保険資格喪失・備品返却）',
      titleVi: 'Ngày thôi việc chính thức (Trả thẻ BHYT & bàn giao)',
      titleEn: 'Official Resignation Day (Surrender Health Card & Assets)',
      isCritical: true,
      descriptionJa: '健康保険証や会社備品を返却し、雇用保険被保険者証等を受領。',
      descriptionVi: 'Trả lại thẻ BHYT và hoàn tất thủ tục bàn giao với công ty.',
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
      descriptionJa: '届き次第ハローワークへ行き受給手続きを行います。',
      descriptionVi: 'Nhận xong mang đến Hello Work làm thủ tục trợ cấp thất nghiệp.',
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
    },
    residentTaxRule,
    healthInsuranceAdvice,
    checklist,
    timeline,
    deepLinks,
    regulatorySources: LEAVING_JOB_SOURCES,
  };
}

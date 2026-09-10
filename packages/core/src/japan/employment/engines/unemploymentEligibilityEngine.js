/**
 * @file packages/core/src/japan/employment/engines/unemploymentEligibilityEngine.js
 * @description
 * Statutory Unemployment Eligibility Engine (雇用保険 基本手当受給資格判定エンジン)
 * Implements exact formulas according to:
 * - 雇用保険法 第13条 (被保険者期間要件: 6ヶ月または12ヶ月)
 * - 雇用保険法 第23条 (特定受給資格者・特定理由離職者)
 * - 雇用保険法 第33条 (給付制限期間の判定)
 * - 雇用保険法 第20条 (受給期間の延長: 最大4年)
 */

import {
  SEPARATION_REASONS,
  ELIGIBILITY_CRITERIA_BY_CATEGORY,
  UNEMPLOYMENT_ELIGIBILITY_SOURCES
} from '../rules/unemploymentEligibilityRules.js';

/**
 * Tra cứu thông tin chi tiết và nhóm pháp lý từ mã lý do thôi việc (reasonId).
 * @param {string} reasonId
 * @returns {{ categoryKey: string, reason: Object, criteria: Object }}
 */
export function classifySeparationReason(reasonId) {
  // Tìm trong từng nhóm
  for (const item of SEPARATION_REASONS.COMPANY_CAUSE) {
    if (item.id === reasonId) {
      return {
        categoryKey: 'COMPANY_CAUSE',
        reason: item,
        criteria: ELIGIBILITY_CRITERIA_BY_CATEGORY.COMPANY_CAUSE
      };
    }
  }

  for (const item of SEPARATION_REASONS.SPECIFIC_REASONS) {
    if (item.id === reasonId) {
      return {
        categoryKey: 'SPECIFIC_REASONS',
        reason: item,
        criteria: ELIGIBILITY_CRITERIA_BY_CATEGORY.SPECIFIC_REASONS
      };
    }
  }

  for (const item of SEPARATION_REASONS.PERSONAL_VOLUNTARY) {
    if (item.id === reasonId) {
      const isDisciplinary = reasonId === 'disciplinary_dismissal';
      return {
        categoryKey: isDisciplinary ? 'DISCIPLINARY' : 'PERSONAL_VOLUNTARY',
        reason: item,
        criteria: isDisciplinary
          ? ELIGIBILITY_CRITERIA_BY_CATEGORY.DISCIPLINARY
          : ELIGIBILITY_CRITERIA_BY_CATEGORY.PERSONAL_VOLUNTARY
      };
    }
  }

  // Fallback an toàn mặc định là Tự ý nghỉ việc cá nhân (Personal Voluntary)
  const defaultReason = SEPARATION_REASONS.PERSONAL_VOLUNTARY[0];
  return {
    categoryKey: 'PERSONAL_VOLUNTARY',
    reason: defaultReason,
    criteria: ELIGIBILITY_CRITERIA_BY_CATEGORY.PERSONAL_VOLUNTARY
  };
}

/**
 * Kiểm tra toàn diện điều kiện thụ hưởng trợ cấp thất nghiệp của người lao động.
 * @param {Object} params
 * @param {string} [params.separationDate] - Ngày thôi việc (YYYY-MM-DD)
 * @param {string} params.reasonId - Mã lý do thôi việc
 * @param {number} params.totalInsuredMonths - Số tháng tham gia bảo hiểm việc làm (通算被保険者期間)
 * @param {boolean} [params.isAbleToWorkImmediately=true] - Khả năng và ý chí đi làm ngay (労働の意思及び能力)
 * @param {boolean} [params.isInabilityTemporary=false] - Không thể đi làm do ốm đau/thai sản/chăm con > 30 ngày
 * @param {number} [params.daysOffUnableToWork=0] - Số ngày nghỉ không lương do ốm đau/tai nạn trong kỳ tính toán
 * @returns {Object} Kết quả điều kiện, tiến trình nhận tiền, checklist hồ sơ và nguồn luật
 */
export function checkUnemploymentEligibility({
  separationDate,
  reasonId,
  totalInsuredMonths = 0,
  isAbleToWorkImmediately = true,
  isInabilityTemporary = false,
  daysOffUnableToWork = 0
}) {
  const { categoryKey, reason, criteria } = classifySeparationReason(reasonId);

  const insuredMonths = Math.max(0, Number(totalInsuredMonths) || 0);
  const requiredMonths = criteria.requiredInsuredMonths;
  const isInsuredMonthsSufficient = insuredMonths >= requiredMonths;

  // Tính gia hạn thời hạn tính toán (算定対象期間の延長 - Điều 13 Khoản 1)
  const daysOff = Math.max(0, Number(daysOffUnableToWork) || 0);
  const isReferencePeriodExtended = daysOff >= 30;
  const extendedMonths = isReferencePeriodExtended ? Math.min(36, Math.floor(daysOff / 30)) : 0;
  const maxReferencePeriodYears = Math.min(4, criteria.referencePeriodYears + parseFloat((extendedMonths / 12).toFixed(1)));

  // Xác định trạng thái kết luận chung (STATUS)
  let status = 'QUALIFIED'; // 'QUALIFIED' | 'EXTENSION_REQUIRED' | 'NOT_QUALIFIED'
  const warnings = [];

  if (!isInsuredMonthsSufficient) {
    status = 'NOT_QUALIFIED';
    warnings.push({
      code: 'INSUFFICIENT_INSURED_MONTHS',
      level: 'error',
      ja: `雇用保険の被保険者期間が不足しています（必要: ${requiredMonths}ヶ月以上、現在: ${insuredMonths}ヶ月）。原則として基本手当は受給できません。`,
      vi: `Số tháng đóng bảo hiểm việc làm không đủ (Yêu cầu: tối thiểu ${requiredMonths} tháng, hiện tại: ${insuredMonths} tháng). Không đủ điều kiện nhận trợ cấp thất nghiệp.`,
      en: `Insufficient insured months (Required: ${requiredMonths}+ months, Current: ${insuredMonths} months). Not qualified for unemployment benefits.`
    });
  } else if (!isAbleToWorkImmediately) {
    if (isInabilityTemporary) {
      status = 'EXTENSION_REQUIRED';
      warnings.push({
        code: 'ACTION_EXTENSION_REQUIRED',
        level: 'warning',
        ja: '現在病気・怪我・妊娠・育児等ですぐに就労できない状態です。基本手当は受給できませんが、受給期間を最大4年間まで延長する手続き（受給期間延長申請）を離職後30日経過後速やかに行ってください。',
        vi: 'Hiện không thể đi làm ngay do ốm đau/thai sản/chăm sóc gia đình. Bạn chưa thể nhận trợ cấp ngay, nhưng cần làm thủ tục xin GIA HẠN THỜI HẠN NHẬN TRỢ CẤP (tối đa 4 năm) sau 30 ngày kể từ khi nghỉ việc để bảo lưu quyền lợi.',
        en: 'Currently unable to work immediately due to illness, injury, or maternity. Apply for "Benefit Period Extension" (up to 4 years) at Hello Work to preserve your rights.'
      });
    } else {
      status = 'NOT_QUALIFIED';
      warnings.push({
        code: 'UNABLE_OR_UNWILLING_TO_WORK',
        level: 'error',
        ja: '雇用保険の基本手当は「就職する意思と能力があること」が必須要件です。学業専念、家事専念等で就職活動を行わない場合は受給資格がありません。',
        vi: 'Trợ cấp thất nghiệp Nhật Bản bắt buộc người xin trợ cấp phải có ý chí và khả năng tìm kiếm việc làm ngay. Nếu nghỉ để đi học hoặc làm nội trợ, không đủ điều kiện nhận trợ cấp.',
        en: 'Unemployment benefits legally require active willingness and physical ability to seek and take work immediately.'
      });
    }
  }

  // Lịch trình nhận tiền ước tính (Timeline Estimates)
  const waitingPeriodDays = criteria.waitingPeriodDays; // Luôn là 7 ngày
  const restrictionMonths = criteria.benefitRestrictionMonths; // 0, 2 hoặc 3 tháng

  const estimatedFirstPaymentWeeks = restrictionMonths === 0 ? 4 : (restrictionMonths * 4 + 4);

  // Danh mục giấy tờ cần chuẩn bị nộp cho Hello Work (Checklist)
  const checklist = [
    {
      id: 'rishokuhyo',
      nameJa: '雇用保険被保険者離職票（離職票-1 および 離職票-2）',
      nameVi: 'Phiếu thôi việc bảo hiểm việc làm (Rishokuhyo-1 và Rishokuhyo-2)',
      nameEn: 'Separation Notices (Rishokuhyo 1 & 2)',
      source: '退職した会社から退職後約10〜14日で郵送',
      required: true
    },
    {
      id: 'mynumber',
      nameJa: 'マイナンバーカード（または個人番号記載の住民票＋身元確認書類）',
      nameVi: 'Thẻ My Number (hoặc Phiếu cư trú ghi số My Number + thẻ ngoại kiều/bằng lái)',
      nameEn: 'My Number Card (or Juminhyo with My Number + Photo ID)',
      source: '本人持参',
      required: true
    },
    {
      id: 'passbook',
      nameJa: '本人名義の普通預金通帳またはキャッシュカード',
      nameVi: 'Sổ ngân hàng hoặc thẻ ATM đứng tên chính chủ người lao động',
      nameEn: 'Bank passbook or cash card in applicant name',
      source: '本人持参',
      required: true
    },
    {
      id: 'photo',
      nameJa: '写真2枚（縦3.0cm × 横2.4cm、直近3ヶ月以内撮影）※マイナンバー提示で省略可能な場合あり',
      nameVi: '2 ảnh thẻ (3.0cm x 2.4cm) chụp trong 3 tháng gần nhất (nếu xuất trình My Number có thể được miễn)',
      nameEn: '2 ID Photos (3.0 x 2.4 cm)',
      source: '本人持参',
      required: false
    }
  ];

  if (categoryKey === 'COMPANY_CAUSE' || categoryKey === 'SPECIFIC_REASONS') {
    checklist.push({
      id: 'evidence',
      nameJa: '離職理由を証明する客観的資料（診断書、契約書、タイムカード等）',
      nameVi: 'Chứng từ minh chứng lý do thôi việc (Hợp đồng ghi điều khoản xem xét tái ký, giấy khám bác sĩ, bảng chấm công tăng ca)',
      nameEn: 'Objective evidence supporting separation reason (doctor certificate, contract, timecard)',
      source: reason.evidenceGuideJa,
      required: true
    });
  }

  return {
    status,
    categoryKey,
    classificationNameJa: criteria.categoryNameJa,
    classificationNameVi: criteria.categoryNameVi,
    classificationNameEn: criteria.categoryNameEn,
    reasonSelected: reason,
    totalInsuredMonths: insuredMonths,
    requiredInsuredMonths: requiredMonths,
    isInsuredMonthsSufficient,
    isAbleToWorkImmediately,
    referencePeriodYears: criteria.referencePeriodYears,
    isReferencePeriodExtended,
    maxReferencePeriodYears,
    timeline: {
      waitingPeriodDays,
      benefitRestrictionMonths: restrictionMonths,
      hasBenefitRestriction: criteria.hasBenefitRestriction,
      estimatedWeeksToFirstPayment: estimatedFirstPaymentWeeks,
      summaryJa: restrictionMonths === 0
        ? '7日間の待期期間のみ。給付制限なし（約1ヶ月後に初回の基本手当支給）。'
        : `7日間の待期期間 ＋ ${restrictionMonths}ヶ月の給付制限（約${restrictionMonths + 1}ヶ月後に初回の基本手当支給）。`,
      summaryVi: restrictionMonths === 0
        ? 'Chỉ chờ 7 ngày thụ lý (7日待期). Không bị hạn chế chi trả (Nhận tiền lần đầu sau khoảng 1 tháng nộp đơn).'
        : `Chờ 7 ngày thụ lý + Hạn chế chi trả ${restrictionMonths} tháng (Nhận tiền lần đầu sau khoảng ${restrictionMonths + 1} tháng nộp đơn).`
    },
    benefitDurationFavor: criteria.benefitDurationFavor,
    warnings,
    checklist,
    sources: UNEMPLOYMENT_ELIGIBILITY_SOURCES
  };
}

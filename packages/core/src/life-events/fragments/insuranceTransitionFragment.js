/**
 * @file packages/core/src/life-events/fragments/insuranceTransitionFragment.js
 * @description
 * Reusable health insurance and pension transition fragment.
 * Used by Changing Job, Leaving Job, Starting Life, and Family Joining events.
 */

export const INSURANCE_TRANSITION_TASKS = Object.freeze([
  {
    id: 'task_nhi_enrollment_14days',
    title: {
      vi: 'Tham gia Bảo hiểm Y tế Quốc dân (Trong vòng 14 ngày nếu có khoảng trống)',
      ja: '国民健康保険への加入手続き（14日以内）',
      en: 'Enroll in National Health Insurance (Within 14 Days)',
    },
    stage: 'insurance-transition',
    stageId: 'insurance-transition',
    priority: 'urgent',
    timing: 'now',
    jurisdiction: 'municipal',
    authority: '市区町村役所（保険年金課）',
    deadlineDays: 14,
    statutoryBasis: '国民健康保険法第9条',
    reasonCode: 'REASON_INSURANCE_GAP_SWITCH',
    requiredDocuments: ['健康保険資格喪失証明書', '在留カード', 'マイナンバーカード'],
    capabilityId: 'insurance.pension.national',
  },
  {
    id: 'task_national_pension_switch_14days',
    title: {
      vi: 'Chuyển sang Nenkin Quốc dân số 1 (Trong vòng 14 ngày)',
      ja: '国民年金第1号被保険者への種別変更（14日以内）',
      en: 'Switch to National Pension Category 1 (Within 14 Days)',
    },
    stage: 'insurance-transition',
    stageId: 'insurance-transition',
    priority: 'urgent',
    timing: 'now',
    jurisdiction: 'municipal',
    authority: '市区町村役所または年金事務所',
    deadlineDays: 14,
    statutoryBasis: '国民年金法第12条',
    reasonCode: 'REASON_PENSION_CATEGORY_CHANGE',
    requiredDocuments: ['年金手帳または基礎年金番号通知書', '社会保険資格喪失証明書', '身分証明書'],
    capabilityId: 'insurance.pension.national',
  },
]);

/**
 * Trả về danh sách đầu việc bảo hiểm và lương hưu theo ngữ cảnh
 * @param {Record<string, any>} context
 * @param {string} [customStageId='insurance-transition']
 * @returns {Array<Record<string, any>>}
 */
export function getInsuranceTransitionTasks(context = {}, customStageId = 'insurance-transition') {
  // Nếu là nhân viên công ty không có khoảng trống (direct transfer), công ty mới tự làm Shakai Hoken
  if (context.employmentStatus === 'regular_employee' && context.hasInsuranceGap === false) {
    return [
      {
        id: 'task_company_shakai_hoken_onboarding',
        title: {
          vi: 'Nộp giấy tờ tham gia Bảo hiểm Xã hội tại công ty mới',
          ja: '新勤務先での社会保険（健保・厚年）資格取得手続き',
          en: 'Submit Social Insurance Enrollment Documents at New Employer',
        },
        stage: customStageId,
        stageId: customStageId,
        priority: 'required',
        timing: 'after-event',
        jurisdiction: 'employer',
        authority: '新勤務先（人事・労務担当）',
        deadlineDays: 5,
        statutoryBasis: '健康保険法第48条・厚生年金保険法第27条',
        reasonCode: 'REASON_NEW_EMPLOYER_INSURANCE',
        requiredDocuments: ['雇用保険被保険者証', '基礎年金番号通知書', '給与所得者の扶養控除等申告書'],
        capabilityId: 'insurance.socialInsurance.calculate',
      },
    ];
  }

  return INSURANCE_TRANSITION_TASKS.map((task) => ({
    ...task,
    stage: customStageId,
    stageId: customStageId,
  }));
}

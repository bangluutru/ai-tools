/**
 * @file packages/core/src/life-events/fragments/employmentExitFragment.js
 * @description
 * Reusable employment exit fragment.
 * Used by Changing Job, Leaving Job, and Permanent Departure events.
 */

export const EMPLOYMENT_EXIT_TASKS = Object.freeze([
  {
    id: 'task_request_gensen_choshuhyo',
    title: {
      vi: 'Yêu cầu công ty cấp Phiếu khấu trừ thuế thu nhập (Gensen Choshuhyo)',
      ja: '退職時の源泉徴収票の受領・確認',
      en: 'Request and Verify Withholding Tax Slip (Gensen Choshuhyo)',
    },
    stage: 'employment-exit',
    stageId: 'employment-exit',
    priority: 'required',
    timing: 'before-event',
    jurisdiction: 'employer',
    authority: '現勤務先（人事・給与担当）',
    deadlineDays: 30,
    statutoryBasis: '所得税法第226条（退職後1ヶ月以内の交付義務）',
    reasonCode: 'REASON_GENSEN_CHOSHUHYO_REQUIRED',
    requiredDocuments: ['源泉徴収票'],
    capabilityId: 'documents.certificate.guide',
  },
  {
    id: 'task_request_employment_insurance_card',
    title: {
      vi: 'Nhận lại Thẻ bảo hiểm thất nghiệp (Koyo Hoken Hihokensha-sho)',
      ja: '雇用保険被保険者証の受領',
      en: 'Receive Employment Insurance Certificate',
    },
    stage: 'employment-exit',
    stageId: 'employment-exit',
    priority: 'required',
    timing: 'before-event',
    jurisdiction: 'employer',
    authority: '現勤務先（人事・総務）',
    deadlineDays: null,
    statutoryBasis: '雇用保険法',
    reasonCode: 'REASON_KOYO_HOKEN_CARD',
    requiredDocuments: ['雇用保険被保険者証'],
    capabilityId: 'employment.unemployment.eligibility',
  },
  {
    id: 'task_return_health_insurance_card',
    title: {
      vi: 'Trả lại thẻ Bảo hiểm Y tế của công ty cũ đúng ngày thôi việc',
      ja: '健康保険被保険者証の返却（退職日当日）',
      en: 'Return Health Insurance Card on Resignation Date',
    },
    stage: 'employment-exit',
    stageId: 'employment-exit',
    priority: 'urgent',
    timing: 'on-event',
    jurisdiction: 'employer',
    authority: '現勤務先または健康保険組合',
    deadlineDays: 1,
    statutoryBasis: '健康保険法第51条',
    reasonCode: 'REASON_RETURN_KENPO_CARD',
    requiredDocuments: ['健康保険証（本人・被扶養者全員分）'],
    capabilityId: 'insurance.socialInsurance.calculate',
  },
]);

/**
 * Trả về danh sách đầu việc thôi việc
 * @param {Record<string, any>} context
 * @param {string} [customStageId='employment-exit']
 * @returns {Array<Record<string, any>>}
 */
export function getEmploymentExitTasks(context = {}, customStageId = 'employment-exit') {
  return EMPLOYMENT_EXIT_TASKS.map((task) => ({
    ...task,
    stage: customStageId,
    stageId: customStageId,
  }));
}

/**
 * @file packages/core/src/life-events/fragments/immigrationNotificationFragment.js
 * @description
 * Reusable statutory 14-day immigration notification fragment.
 * Used by Changing Job, Leaving Job, and Residence transitions.
 */

export const IMMIGRATION_NOTIFICATION_TASKS = Object.freeze([
  {
    id: 'task_immigration_affiliation_change_14days',
    title: {
      vi: 'Thông báo thay đổi cơ quan trực thuộc cho Cục XNC (Trong vòng 14 ngày)',
      ja: '出入国在留管理局へ所属機関変更の届出（14日以内）',
      en: 'Notify Immigration Bureau of Affiliation Change (Within 14 Days)',
    },
    stage: 'immigration-notice',
    stageId: 'immigration-notice',
    priority: 'urgent',
    timing: 'now',
    jurisdiction: 'national',
    authority: '出入国在留管理局（電子届出システムまたは窓口・郵送）',
    deadlineDays: 14,
    statutoryBasis: '出入国管理及び難民認定法第19条の16第1号・第2号',
    reasonCode: 'REASON_JOB_CHANGE_VISA_NOTIFY',
    requiredDocuments: ['在留カード', '所属機関等に関する届出書', '退職証明書または雇用契約書'],
    capabilityId: 'immigration.affiliationChange.check',
  },
]);

/**
 * Trả về đầu việc thông báo xuất nhập cảnh
 * @param {Record<string, any>} context
 * @param {string} [customStageId='immigration-notice']
 * @returns {Array<Record<string, any>>}
 */
export function getImmigrationNotificationTasks(context = {}, customStageId = 'immigration-notice') {
  // Miễn trừ đối với người có tư cách cư trú không hạn chế hoạt động (PR, Spouse, Long-Term)
  const unrestrictedStatuses = [
    'permanent_resident',
    'spouse_of_japanese',
    'spouse_of_pr',
    'long_term_resident',
  ];

  if (context.residenceStatus && unrestrictedStatuses.includes(context.residenceStatus)) {
    return [];
  }

  return IMMIGRATION_NOTIFICATION_TASKS.map((task) => ({
    ...task,
    stage: customStageId,
    stageId: customStageId,
  }));
}

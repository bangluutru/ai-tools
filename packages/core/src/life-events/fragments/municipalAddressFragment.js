/**
 * @file packages/core/src/life-events/fragments/municipalAddressFragment.js
 * @description
 * Reusable municipal address registration & My Number fragment.
 * Used by Starting Life, Moving, and Family Joining events.
 */

export const MUNICIPAL_ADDRESS_TASKS = Object.freeze([
  {
    id: 'task_address_registration_14days',
    title: {
      vi: 'Đăng ký cư trú tại Tòa thị chính (Trong vòng 14 ngày)',
      ja: '市区町村窓口で住民登録（転入届・転居届）',
      en: 'Register Residential Address at City Office (Within 14 Days)',
    },
    stage: 'municipal-setup',
    stageId: 'municipal-setup',
    priority: 'urgent',
    timing: 'now',
    jurisdiction: 'municipal',
    authority: '市区町村役所（窓口）',
    deadlineDays: 14,
    statutoryBasis: '住民基本台帳法第22条（転入届の提出義務）',
    reasonCode: 'REASON_MUNICIPAL_ADDRESS_14DAYS',
    requiredDocuments: ['住民異動届', '在留カード', 'パスポート', 'マイナンバー通知カード・個人番号カード'],
    capabilityId: 'documents.certificate.guide',
  },
  {
    id: 'task_mynumber_address_update',
    title: {
      vi: 'Cập nhật địa chỉ trên thẻ My Number (Trong vòng 14 ngày)',
      ja: 'マイナンバーカードの券面記載事項変更（14日以内）',
      en: 'Update My Number Card Address (Within 14 Days)',
    },
    stage: 'municipal-setup',
    stageId: 'municipal-setup',
    priority: 'urgent',
    timing: 'now',
    jurisdiction: 'municipal',
    authority: '市区町村役所（マイナンバー窓口）',
    deadlineDays: 14,
    statutoryBasis: 'マイナンバー法・電子署名法',
    reasonCode: 'REASON_MYNUMBER_ADDRESS_14DAYS',
    requiredDocuments: ['マイナンバーカード', '数字4桁の暗証番号'],
    capabilityId: 'documents.mynumber.guide',
  },
]);

/**
 * Trả về danh sách đầu việc địa chỉ cho sự kiện
 * @param {Record<string, any>} context
 * @param {string} [customStageId='municipal-setup']
 * @returns {Array<Record<string, any>>}
 */
export function getMunicipalAddressTasks(context = {}, customStageId = 'municipal-setup') {
  return MUNICIPAL_ADDRESS_TASKS.map((task) => ({
    ...task,
    stage: customStageId,
    stageId: customStageId,
  }));
}

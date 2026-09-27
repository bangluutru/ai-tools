/**
 * @file packages/core/src/japan/family/rules/birthDefinition.js
 * @description
 * Định nghĩa sự kiện đời sống "Mang thai & Sinh con" (Maternity & Birth Life Event Definition)
 * xây dựng trên nền tảng Nền tảng Sự Kiện Đời Sống (Life Event Foundation).
 */

import { createLifeEventRuntime } from '../../../life-events/index.js';
import { ROADMAP_STAGES } from './birthWizardRules.js';
import { getRoadmapStages } from '../engines/birthWizardEngine.js';

export const BIRTH_SOURCES = [
  'mhlw-childbirth-grant-2023',
  'cfa-child-allowance-2024',
  'mhlw-ikukyu-benefit-guide',
  'mhlw-maternity-allowance-guide',
];

/**
 * Định nghĩa chuẩn cho sự kiện Mang thai & Sinh con tại Nhật
 * @type {import('../../../life-events/types/lifeEventTypes.js').LifeEventDefinition}
 */
export const birthDefinition = {
  id: 'birth',
  country: 'JP',
  domain: 'family',
  title: {
    ja: '妊娠・出産・育児ロードマップ＆手続きガイド',
    vi: 'Lộ trình Mang thai, Sinh con & Nuôi con tại Nhật',
    en: 'Japan Maternity, Childbirth & Childcare Guide',
  },
  stages: ROADMAP_STAGES.map((s) => ({
    id: s.stageId,
    stageId: s.stageId,
    nameJa: s.titleJa,
    nameVi: s.titleVi,
    nameEn: s.titleEn,
    order: s.order,
  })),
  sources: BIRTH_SOURCES,
  capabilities: [
    'family.maternity.allowance',
    'family.childcare.eligibility',
    'family.childcare.benefit',
    'family.childAllowance.calculate',
  ],

  /**
   * Sinh danh sách phẳng các đầu việc đã được làm giàu theo ngữ cảnh
   * @param {Object} context
   * @param {Object} [options]
   * @returns {Array<Object>}
   */
  evaluateChecklist(context = {}, options = {}) {
    const localizedStages = getRoadmapStages(context);
    const flatTasks = [];

    for (const stage of localizedStages) {
      for (const task of stage.tasks) {
        const item = { ...task };
        item.stageId = stage.stageId;
        item.stage = stage.stageId;

        // Quy tắc hạn chót có cấu trúc dựa trên ngày sinh (birthDate)
        // Ghi chú: các id dưới đây phải khớp với ROADMAP_STAGES (birthWizardRules.js)
        if (task.id === 'task_birth_registration') {
          // 出生届: 14 ngày TÍNH CẢ ngày sinh (戸籍法第49条・第43条) → hạn = ngày sinh + 13 ngày
          item.deadlineRule = {
            anchorKey: 'birthDate',
            offsetDays: 13,
            direction: 'after',
          };
        } else if (task.id === 'task_child_allowance_claim') {
          // 児童手当「15日特例」: trong vòng 15 ngày kể từ ngày hôm sau ngày sinh → ngày sinh + 15 ngày
          item.deadlineRule = {
            anchorKey: 'birthDate',
            offsetDays: 15,
            direction: 'after',
          };
          item.relatedCapabilityId = 'family.childAllowance.calculate';
          item.deepLink = {
            toolId: 'child-allowance-jp',
            labelJa: '児童手当シミュレーターを開く',
            labelVi: 'Tính tiền trợ cấp trẻ em',
            labelEn: 'Open Child Allowance Simulator',
          };
        } else if (task.id === 'task_child_medical_subsidy') {
          item.deadlineRule = {
            anchorKey: 'birthDate',
            offsetDays: 30,
            direction: 'after',
          };
        } else if (task.id === 'task_health_insurance_enrollment') {
          item.deadlineRule = {
            anchorKey: 'birthDate',
            offsetDays: 30,
            direction: 'after',
          };
        } else if (task.id === 'task_prenatal_leave_start') {
          item.relatedCapabilityId = 'family.maternity.allowance';
          item.deepLink = {
            toolId: 'maternity-allowance-jp',
            labelJa: '出産手当金シミュレーターを開く',
            labelVi: 'Tính tiền trợ cấp thai sản',
            labelEn: 'Open Maternity Allowance Simulator',
          };
        } else if (task.id === 'task_childcare_benefit_claim') {
          item.relatedCapabilityId = 'family.childcare.benefit';
          item.deepLink = {
            toolId: 'childcare-benefit-jp',
            labelJa: '育児休業給付金シミュレーターを開く',
            labelVi: 'Mô phỏng trợ cấp nghỉ chăm con',
            labelEn: 'Open Childcare Benefit Simulator',
          };
        } else if (task.id === 'task_papa_ikukyu_bonus') {
          item.relatedCapabilityId = 'family.childcare.eligibility';
          item.deepLink = {
            toolId: 'childcare-leave-eligibility-jp',
            labelJa: '育休受給資格チェッカーを開く',
            labelVi: 'Kiểm tra điều kiện nghỉ chăm con',
            labelEn: 'Check Childcare Leave Eligibility',
          };
        }

        flatTasks.push(item);
      }
    }

    return flatTasks;
  },
};

/**
 * Thực thể Runtime của Sự kiện Sinh con & Nuôi con
 */
export const birthRuntime = createLifeEventRuntime(birthDefinition);

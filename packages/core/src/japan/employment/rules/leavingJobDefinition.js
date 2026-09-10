/**
 * @file packages/core/src/japan/employment/rules/leavingJobDefinition.js
 * @description
 * Định nghĩa sự kiện đời sống "Thôi việc / Nghỉ việc" (Leaving Job Life Event Definition)
 * xây dựng trên nền tảng Nền tảng Sự Kiện Đời Sống (Life Event Foundation).
 */

import { createLifeEventRuntime } from '../../../life-events/index.js';
import {
  LEAVING_STAGES,
  LEAVING_JOB_SOURCES,
  LEAVING_ACTION_ITEMS,
} from './leavingJobRules.js';

/**
 * Định nghĩa chuẩn cho sự kiện Nghỉ việc tại Nhật Bản
 * @type {import('../../../life-events/types/lifeEventTypes.js').LifeEventDefinition}
 */
export const leavingJobDefinition = {
  id: 'leaving-job',
  country: 'JP',
  domain: 'employment',
  title: {
    ja: '退職手続きガイド＆オーケストレーター',
    vi: 'Hướng dẫn thủ tục nghỉ việc tại Nhật',
    en: 'Japan Leaving Job Guide & Orchestrator',
  },
  stages: [
    {
      id: LEAVING_STAGES.BEFORE_RESIGNATION.id,
      stageId: LEAVING_STAGES.BEFORE_RESIGNATION.id,
      nameJa: LEAVING_STAGES.BEFORE_RESIGNATION.nameJa,
      nameVi: LEAVING_STAGES.BEFORE_RESIGNATION.nameVi,
      nameEn: LEAVING_STAGES.BEFORE_RESIGNATION.nameEn,
      order: LEAVING_STAGES.BEFORE_RESIGNATION.order,
    },
    {
      id: LEAVING_STAGES.LAST_DAY.id,
      stageId: LEAVING_STAGES.LAST_DAY.id,
      nameJa: LEAVING_STAGES.LAST_DAY.nameJa,
      nameVi: LEAVING_STAGES.LAST_DAY.nameVi,
      nameEn: LEAVING_STAGES.LAST_DAY.nameEn,
      order: LEAVING_STAGES.LAST_DAY.order,
    },
    {
      id: LEAVING_STAGES.AFTER_RESIGNATION.id,
      stageId: LEAVING_STAGES.AFTER_RESIGNATION.id,
      nameJa: LEAVING_STAGES.AFTER_RESIGNATION.nameJa,
      nameVi: LEAVING_STAGES.AFTER_RESIGNATION.nameVi,
      nameEn: LEAVING_STAGES.AFTER_RESIGNATION.nameEn,
      order: LEAVING_STAGES.AFTER_RESIGNATION.order,
    },
  ],
  sources: LEAVING_JOB_SOURCES,
  capabilities: [
    'employment.paidLeave.check',
    'employment.overtime.calculate',
    'employment.unemployment.eligibility',
    'employment.unemployment.benefit',
    'insurance.health.dependent',
    'insurance.pension.national',
    'tax.japan.calculate',
  ],

  /**
   * Sinh danh mục công việc dựa trên ngữ cảnh nghỉ việc
   * @param {Object} context
   * @param {Object} [options]
   * @returns {Array<Object>}
   */
  evaluateChecklist(context = {}, options = {}) {
    const hasNewJobImmediately = Boolean(context.hasNewJobImmediately);
    const remainingPaidLeaveDays = Number(context.remainingPaidLeaveDays) || 0;
    const healthInsurancePreference = context.healthInsurancePreference || 'undecided';

    return LEAVING_ACTION_ITEMS.map((rawItem) => {
      const item = { ...rawItem };
      item.stageId = item.stage;
      let isApplicable = true;
      let customNoteJa = '';
      let customNoteVi = '';
      let customNoteEn = '';

      // Thiết lập quy tắc hạn chót có cấu trúc & capability tương ứng
      if (item.id === 'notice_resignation') {
        item.deadlineRule = {
          anchorKey: 'resignationDate',
          offsetDays: 14,
          direction: 'before',
        };
      } else if (item.id === 'consume_paid_leave') {
        item.relatedCapabilityId = 'employment.paidLeave.check';
        if (remainingPaidLeaveDays > 0) {
          customNoteJa = `現在残日数: ${remainingPaidLeaveDays}日。退職日までに全日数消化を推奨。`;
          customNoteVi = `Số phép còn lại: ${remainingPaidLeaveDays} ngày. Đề nghị lên lịch nghỉ hết trước ngày thôi việc.`;
          customNoteEn = `Remaining days: ${remainingPaidLeaveDays} days. Schedule full consumption before resignation.`;
        }
      } else if (item.id === 'check_unpaid_overtime') {
        item.relatedCapabilityId = 'employment.overtime.calculate';
      } else if (item.id === 'health_insurance_procedure') {
        item.deadlineRule = {
          anchorKey: 'resignationDate',
          offsetDays: healthInsurancePreference === 'voluntary_continuation' ? 20 : 14,
          direction: 'after',
        };
        item.relatedCapabilityId = 'insurance.health.dependent';
        item.deepLink = {
          toolId: 'dependent-insurance-jp',
          labelJa: '被扶養者判定チェッカーを開く',
          labelVi: 'Kiểm tra điều kiện BHYT phụ thuộc',
          labelEn: 'Check Dependent Eligibility',
        };
        if (hasNewJobImmediately) {
          isApplicable = false;
          customNoteJa = '転職先の社会保険に即日加入するため、個人での切り替え手続きは不要です。';
          customNoteVi = 'Do chuyển sang công ty mới ngay, công ty mới sẽ làm thủ tục tham gia BHYT.';
          customNoteEn = 'New employer will enroll you into their health insurance immediately.';
        }
      } else if (item.id === 'national_pension_switch') {
        item.deadlineRule = {
          anchorKey: 'resignationDate',
          offsetDays: 14,
          direction: 'after',
        };
        item.relatedCapabilityId = 'insurance.pension.national';
        item.deepLink = {
          toolId: 'national-pension-jp',
          labelJa: '国民年金シミュレーターを開く',
          labelVi: 'Mô phỏng Lương hưu Quốc dân',
          labelEn: 'Open National Pension Simulator',
        };
        if (hasNewJobImmediately) {
          isApplicable = false;
          customNoteJa = '転職先の厚生年金に引き継がれるため、市区町村窓口での手続きは不要です。';
          customNoteVi = 'Được tiếp nối đóng Lương hưu Phúc lợi tại công ty mới, không cần ra ủy ban.';
          customNoteEn = 'Transferred directly to new employer welfare pension, municipal procedure not needed.';
        }
      } else if (item.id === 'hellowork_unemployment_claim') {
        item.deadlineRule = {
          anchorKey: 'resignationDate',
          offsetDays: 14,
          direction: 'after',
        };
        item.relatedCapabilityId = 'employment.unemployment.benefit';
        item.deepLink = {
          toolId: 'unemployment-benefit-jp',
          labelJa: '失業給付シミュレーターを開く',
          labelVi: 'Mô phỏng tiền trợ cấp thất nghiệp',
          labelEn: 'Open Unemployment Simulator',
        };
        if (hasNewJobImmediately) {
          isApplicable = false;
          customNoteJa = 'すでに次の転職先が決まっているため、失業給付の受給手続きは不要です。';
          customNoteVi = 'Đã có việc làm tiếp theo ngay nên không cần làm thủ tục hưởng trợ cấp thất nghiệp.';
          customNoteEn = 'Already secured next employment, unemployment allowance claim is not applicable.';
        }
      } else if (item.id === 'year_end_tax_filing') {
        item.relatedCapabilityId = 'tax.japan.calculate';
        item.deepLink = {
          toolId: 'japan-tax-simulator',
          labelJa: '日本税金シミュレーターを開く',
          labelVi: 'Mô phỏng Thuế Nhật Bản',
          labelEn: 'Open Japan Tax Simulator',
        };
        if (hasNewJobImmediately) {
          customNoteJa = '転職先で前職の源泉徴収票を提出し、年末調整を受けられます。';
          customNoteVi = 'Nộp phiếu khấu trừ thuế công ty cũ cho công ty mới để làm điều chỉnh thuế cuối năm.';
          customNoteEn = 'Submit previous employer withholding slip to new employer for year-end adjustment.';
        }
      }

      return {
        ...item,
        isApplicable,
        customNoteJa,
        customNoteVi,
        customNoteEn,
      };
    });
  },
};

/**
 * Thực thể Runtime của Sự kiện Thôi việc
 */
export const leavingJobRuntime = createLifeEventRuntime(leavingJobDefinition);

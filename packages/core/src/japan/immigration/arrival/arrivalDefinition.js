/**
 * @file packages/core/src/japan/immigration/arrival/arrivalDefinition.js
 * @description
 * Định nghĩa chuẩn Sự kiện Đời sống: Đến Nhật & Bắt đầu Cư trú (Arriving in Japan Life Event Definition)
 * xây dựng trên Nền tảng Sự Kiện Đời Sống (Life Event Foundation).
 */

import { createLifeEventRuntime } from '../../../life-events/index.js';
import { ARRIVAL_STAGES, ARRIVAL_SOURCES } from './arrivalRules.js';
import { evaluateArrivalChecklist } from './arrivalEngine.js';

/**
 * Định nghĩa chuẩn cho sự kiện Đến Nhật & Bắt đầu Cư trú
 * @type {import('../../../life-events/types/lifeEventTypes.js').LifeEventDefinition}
 */
export const arrivalDefinition = {
  id: 'arriving-in-japan',
  country: 'JP',
  domain: 'immigration',
  title: {
    ja: '来日後セットアップガイド（新規入国・在留手続き）',
    vi: 'Hướng Dẫn Thủ Tục Cho Người Mới Sang Nhật',
    en: 'Newcomer Setup Guide for Japan',
  },
  stages: ARRIVAL_STAGES.map((s) => ({
    id: s.id,
    stageId: s.id,
    nameJa: s.titleJa,
    nameVi: s.titleVi,
    nameEn: s.titleEn,
    order: s.order,
  })),
  sources: ARRIVAL_SOURCES,
  capabilities: [
    'immigration.workScope.check',
    'immigration.affiliationChange.check',
    'insurance.socialInsurance.calculate',
    'insurance.pension.national',
    'tax.japan.calculate',
  ],

  /**
   * Sinh danh sách phẳng các đầu việc đã được làm giàu theo ngữ cảnh
   * @param {Object} context 
   * @param {Object} [options] 
   * @returns {Array<Object>}
   */
  evaluateChecklist(context = {}, options = {}) {
    return evaluateArrivalChecklist(context, options);
  },
};

/**
 * Thực thể Runtime của Sự kiện Đến Nhật Bản
 */
export const arrivalRuntime = createLifeEventRuntime(arrivalDefinition);

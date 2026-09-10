/**
 * @file packages/core/src/japan/immigration/departure/departureDefinition.js
 * @description
 * Định nghĩa chuẩn Sự kiện Đời sống: Rời Nhật Bản (Leaving Japan Life Event Definition)
 * xây dựng trên Nền tảng Sự Kiện Đời Sống (Life Event Foundation).
 */

import { createLifeEventRuntime } from '../../../life-events/index.js';
import { DEPARTURE_STAGES, DEPARTURE_SOURCES } from './departureRules.js';
import { evaluateDepartureChecklist } from './departureEngine.js';

/**
 * Định nghĩa chuẩn cho sự kiện Rời Nhật Bản
 * @type {import('../../../life-events/types/lifeEventTypes.js').LifeEventDefinition}
 */
export const departureDefinition = {
  id: 'leaving-japan',
  country: 'JP',
  domain: 'immigration',
  title: {
    ja: '日本を離れる手続きガイド（完全出国・一時出国・年金脱退一時金）',
    vi: 'Hướng Dẫn Thủ Tục Khi Rời Khỏi Nhật Bản',
    en: 'Leaving Japan Procedure Guide',
  },
  stages: DEPARTURE_STAGES.map((s) => ({
    id: s.id,
    stageId: s.id,
    nameJa: s.titleJa,
    nameVi: s.titleVi,
    nameEn: s.titleEn,
    order: s.order,
  })),
  sources: DEPARTURE_SOURCES,
  capabilities: [
    'immigration.workScope.check',
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
    return evaluateDepartureChecklist(context, options);
  },
};

/**
 * Thực thể Runtime của Sự kiện Rời Nhật Bản
 */
export const departureRuntime = createLifeEventRuntime(departureDefinition);

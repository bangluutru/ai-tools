/**
 * @file packages/core/src/japan/family/rules/childcareLeaveRules.js
 * @description
 * Quy chuẩn pháp lý và tiêu chí thụ hưởng Nghỉ chăm con & Trợ cấp Nghỉ chăm con tại Nhật Bản.
 * Căn cứ:
 * - 育児休業、介護休業等育児又は家族介護を行う労働者の福祉に関する法律 (育児・介護休業法)
 * - 雇用保険法第61条の7〜第61条の10 (育児休業給付等)
 * - 厚生労働省 育児休業等給付業務取扱要領 (令和7年・令和8年改定対応)
 */

import { defineRuleMetadata } from '../../../regulatory/ruleMetadata.js';
import { JAPAN_JURISDICTION } from '../../../regulatory/jurisdiction.js';
import { createApplicablePeriod } from '../../../regulatory/effectivePeriod.js';

export const CHILDCARE_LEAVE_METADATA = defineRuleMetadata({
  id: 'jp-childcare-leave-rules-2026',
  jurisdiction: JAPAN_JURISDICTION,
  sourceId: 'mhlw-childcare-benefit-guidelines-2026',
  effectiveFrom: '2022-10-01',
  applicablePeriod: createApplicablePeriod('fiscal-year', 2022, 2026),
  version: '2026.1',
  lastVerifiedAt: '2026-09-10',
  status: 'verified',
  notes: 'Quy chuẩn phân định quyền nghỉ việc (luật lao động) và điều kiện thụ hưởng 4 chế độ trợ cấp nghỉ chăm con (BHTN MHLW).',
});

/**
 * Các trạng thái chẩn đoán tư cách thụ hưởng
 */
export const ELIGIBILITY_STATUS = Object.freeze({
  LIKELY_ELIGIBLE: 'likely_eligible',          // Nhiều khả năng đủ điều kiện (受給可能性：高)
  LIKELY_NOT_ELIGIBLE: 'likely_not_eligible',  // Nhiều khả năng không đủ điều kiện (受給要件未達)
  NEEDS_CONFIRMATION: 'needs_confirmation',    // Cần xác nhận thêm điều kiện tại Hello Work (要確認)
  NOT_APPLICABLE: 'not_applicable',            // Không áp dụng ở giai đoạn này (現在は対象外)
});

/**
 * 4 Chế độ Trợ cấp Nghỉ chăm con trong hệ thống BHTN (雇用保険の育児休業等給付)
 */
export const CHILDCARE_BENEFIT_SCHEMES = Object.freeze({
  STANDARD_CHILDCARE: {
    code: 'standard_childcare',
    nameJa: '育児休業給付金',
    nameVi: 'Trợ cấp Nghỉ chăm con tiêu chuẩn',
    nameEn: 'Standard Childcare Leave Benefit',
    descriptionJa: '原則1歳未満の子を養育するために休業した場合に支給（保育所に入所できない等の理由で最長2歳まで延長可）。',
    descriptionVi: 'Chi trả khi nghỉ chăm con dưới 1 tuổi (có thể gia hạn lên 1.5 - 2 tuổi nếu trượt nhà trẻ).',
    legalBasis: '雇用保険法第61条の7',
  },
  POST_BIRTH_PAPA: {
    code: 'post_birth_papa',
    nameJa: '出生時育児休業給付金（産後パパ育休）',
    nameVi: 'Trợ cấp Nghỉ chăm con sau sinh (産後パパ育休)',
    nameEn: 'Post-birth Childcare Leave Benefit (Papa Ikukyu)',
    descriptionJa: '子の出生後8週間以内に合計4週間（28日）まで取得可能。2回に分割して取得できます。',
    descriptionVi: 'Dành cho bố/người phối ngẫu nghỉ tối đa 28 ngày trong vòng 8 tuần sau sinh, được chia làm 2 lần.',
    legalBasis: '雇用保険法第61条の8',
  },
  POST_BIRTH_SUPPORT: {
    code: 'post_birth_support',
    nameJa: '出生後休業支援給付金',
    nameVi: 'Trợ cấp Hỗ trợ Nghỉ sau sinh (Thưởng thêm 13% đạt 80% lương)',
    nameEn: 'Post-birth Leave Support Benefit',
    descriptionJa: '父母ともに一定期間（14日以上）休業するか配偶者要件の例外を満たす場合、最大28日間にわたり賃金日額の13％を加算支給。',
    descriptionVi: 'Cộng thêm 13% ngày lương (tổng đạt 80% mức lương ngày) khi cả 2 vợ chồng cùng nghỉ từ 14 ngày trở lên hoặc thuộc diện ngoại lệ.',
    legalBasis: '雇用保険法第61条の9',
  },
  SHORT_TIME_WORK: {
    code: 'short_time_work',
    nameJa: '育児時短就業給付金（2025年4月新設）',
    nameVi: 'Trợ cấp Làm việc Rút ngắn giờ nuôi con (áp dụng từ 04/2025)',
    nameEn: 'Childcare Short-Time Work Benefit',
    descriptionJa: '2歳未満の子を養育するために短時間勤務を行い、賃金が低下した場合に支給（原則10％相当）。',
    descriptionVi: 'Hỗ trợ người lao động đi làm lại và rút ngắn thời gian làm việc để nuôi con dưới 2 tuổi khi lương bị giảm.',
    legalBasis: '雇用保険法第61条の10',
  }
});

/**
 * Danh sách nguồn pháp quy tham chiếu
 */
export const CHILDCARE_LEAVE_SOURCES = Object.freeze([
  'egov-childcare-leave-act',
  'mhlw-childcare-benefit-guidelines-2026'
]);

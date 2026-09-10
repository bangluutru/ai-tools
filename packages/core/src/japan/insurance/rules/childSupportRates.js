/**
 * @file packages/core/src/japan/insurance/rules/childSupportRates.js
 * @description Biểu tỷ lệ Tiền hỗ trợ nuôi dạy trẻ em (子ども・子育て支援金) và Tiền đóng góp phúc lợi trẻ em (子ども・子育て拠出金).
 * Nguồn: こども家庭庁 / 厚生労働省 (cfa-child-support-2026)
 */

import { defineRuleMetadata } from '../../../regulatory/ruleMetadata.js';
import { JAPAN_JURISDICTION } from '../../../regulatory/jurisdiction.js';
import { createApplicablePeriod } from '../../../regulatory/effectivePeriod.js';

export const CHILD_SUPPORT_METADATA_2026 = defineRuleMetadata({
  id: 'jp-child-support-fund-2026',
  jurisdiction: JAPAN_JURISDICTION,
  sourceId: 'cfa-child-support-2026',
  effectiveFrom: '2026-04-01',
  applicablePeriod: createApplicablePeriod('fiscal-year', 2026, 2026),
  version: '2026.1',
  lastVerifiedAt: '2026-09-10',
  status: 'verified',
  notes: 'Tiền hỗ trợ nuôi con 子ども・子育て支援金: 0.23% (chia đôi 50/50: 0.115% mỗi bên), áp dụng từ 01/04/2026.',
});

/**
 * Tra cứu tỷ lệ Tiền hỗ trợ nuôi dạy trẻ em (子ども・子育て支援金) và đóng góp của công ty (拠出金)
 * @param {string} [applicableDate='2026-04-01'] - YYYY-MM-DD
 */
export function resolveChildSupportRate(applicableDate = '2026-04-01') {
  const dateStr = applicableDate ? String(applicableDate).substring(0, 10) : '2026-04-01';

  // 1. 子ども・子育て支援金 (Áp dụng từ 01/04/2026)
  const isIntroduced = dateStr >= '2026-04-01';
  const totalRate = isIntroduced ? 0.0023 : 0; // 0.23%
  const employeeRate = isIntroduced ? 0.00115 : 0;
  const employerRate = isIntroduced ? 0.00115 : 0;

  // 2. 子ども・子育て拠出金 (NSDLĐ chịu 100%, 0.36% trên mức lương chuẩn 厚生年金)
  const childWelfareEmployerOnlyRate = 0.0036;

  return {
    isIntroduced,
    totalRate,
    employeeRate,
    employerRate,
    childWelfareEmployerOnlyRate,
    metadata: CHILD_SUPPORT_METADATA_2026,
    notesJa: isIntroduced
      ? '令和8年4月より「子ども・子育て支援金」が新設され、健保料とは別に給与から控除（労使折半）されます。'
      : '令和8年3月以前は子ども・子育て支援金は適用されません。',
  };
}

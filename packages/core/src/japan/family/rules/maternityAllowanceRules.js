/**
 * @file packages/core/src/japan/family/rules/maternityAllowanceRules.js
 * @description
 * Quy chuẩn pháp lý và biểu số liệu Trợ cấp Thai sản (出産手当金) theo Luật BHYT Nhật Bản.
 * Căn cứ:
 * - 健康保険法第102条（出産手当金）
 * - 健康保険法第104条（資格喪失後の継続給付）
 * - 全国健康保険協会 (協会けんぽ) 業務規程・出産手当金算定基準
 */

import { defineRuleMetadata } from '../../../regulatory/ruleMetadata.js';
import { JAPAN_JURISDICTION } from '../../../regulatory/jurisdiction.js';
import { createApplicablePeriod } from '../../../regulatory/effectivePeriod.js';

export const MATERNITY_ALLOWANCE_METADATA = defineRuleMetadata({
  id: 'jp-maternity-allowance-rules-2026',
  jurisdiction: JAPAN_JURISDICTION,
  sourceId: 'kyokai-kenpo-maternity-allowance',
  effectiveFrom: '2020-04-01',
  applicablePeriod: createApplicablePeriod('fiscal-year', 2020, 2026),
  version: '2026.1',
  lastVerifiedAt: '2026-09-27',
  status: 'verified',
  notes: 'Quy chuẩn chi trả trợ cấp thai sản theo ngày: 42 ngày trước (98 ngày đa thai), 56 ngày sau sinh; 2/3 lương chuẩn bình quân 12 tháng (÷30 làm tròn 10円, ×2/3 làm tròn 1円). Dưới 12 tháng (協会けんぽ): trần bình quân 32万円 nếu 支給開始日 từ 01/04/2025 (trước đó 30万円).',
});

/**
 * Các hằng số luật định cho Trợ cấp thai sản (健康保険法第102条)
 */
export const MATERNITY_STATUTORY_CONSTANTS = Object.freeze({
  // Số ngày nghỉ trước sinh luật định: Đơn thai là 42 ngày (6 tuần), đa thai là 98 ngày (14 tuần)
  PRENATAL_DAYS_SINGLE: 42,
  PRENATAL_DAYS_MULTIPLE: 98,

  // Số ngày nghỉ sau sinh luật định: 56 ngày (8 tuần, tính từ ngày hôm sau ngày sinh)
  POSTNATAL_DAYS: 56,

  // Tỷ lệ hưởng trợ cấp: 2/3 thù lao ngày
  BENEFIT_RATE_NUMERATOR: 2,
  BENEFIT_RATE_DENOMINATOR: 3,

  // Số ngày ước tính trong một tháng để tính thù lao ngày chuẩn (日額算定除数)
  DAYS_PER_MONTH_DIVISOR: 30,

  // Mức thù lao chuẩn bình quân toàn hiệp hội của Kyokai Kenpo dùng khi đóng dưới 12 tháng (全被保険者の平均標準報酬月額)
  // 支給開始日 từ 01/04/2025: 320,000円; trước đó: 300,000円
  KYOKAI_KENPO_AVERAGE_STANDARD_MONTHLY: 320000,
  KYOKAI_KENPO_AVERAGE_STANDARD_MONTHLY_BEFORE_2025_04: 300000,
  KYOKAI_KENPO_AVERAGE_EFFECTIVE_FROM: '2025-04-01',

  // Điều kiện tiếp tục nhận trợ cấp sau khi mất tư cách tham gia (健康保険法第104条)
  CONTINUOUS_INSURED_MONTHS_FOR_RETENTION: 12,
});

/**
 * Danh sách nguồn pháp quy tham chiếu
 */
export const MATERNITY_ALLOWANCE_SOURCES = Object.freeze([
  'egov-health-insurance-act-maternity',
  'kyokai-kenpo-maternity-allowance'
]);

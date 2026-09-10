/**
 * @file packages/core/src/navigator/recommendations/recommendationContract.js
 * @description
 * Recommendation Contract and typed enums for Japan Life Navigator.
 * Eliminates generic confidence numbers (e.g. 0.87) in legal domains, replacing them
 * with rigorous legal ConfidenceTypes and structured Reason Codes.
 */

/**
 * Phân loại mức độ chắc chắn của khuyến nghị (Legal Confidence Type)
 */
export const ConfidenceType = Object.freeze({
  /** Quy định luật định chắc chắn 100% dựa trên dữ kiện */
  DETERMINISTIC: 'deterministic',
  /** Con đường thông thường có khả năng cao áp dụng cho đối tượng này */
  LIKELY: 'likely',
  /** Phụ thuộc vào quyết định hoặc điều kiện phát sinh (ví dụ: độ dài gap giữa 2 việc) */
  CONDITIONAL: 'conditional',
  /** Đòi hỏi thẩm định hành chính từ cán bộ nhà nước (ví dụ: cục XNC, bảo hiểm) */
  ADMINISTRATIVE_REVIEW: 'administrative-review',
  /** Quy định chuẩn quốc gia đã xác thực, nhưng chi tiết tại địa phương chưa có dữ liệu kiểm chứng */
  LOCAL_DATA_UNVERIFIED: 'local-data-unverified',
});

/**
 * Mức độ ưu tiên của hành động
 */
export const Priority = Object.freeze({
  /** Cần làm ngay lập tức (thời hạn 14 ngày hoặc chế tài luật định) */
  URGENT: 'urgent',
  /** Bắt buộc phải thực hiện theo pháp luật / quy trình */
  REQUIRED: 'required',
  /** Khuyến nghị nên làm để tối ưu quyền lợi hoặc tránh bất lợi */
  RECOMMENDED: 'recommended',
  /** Tùy chọn thực hiện tùy theo nhu cầu cá nhân */
  OPTIONAL: 'optional',
  /** Thông tin hướng dẫn nâng cao nhận thức */
  INFORMATIONAL: 'informational',
});

/**
 * Thời điểm thực hiện hành động
 */
export const Timing = Object.freeze({
  /** Ngay bây giờ */
  NOW: 'now',
  /** Trước khi sự kiện diễn ra */
  BEFORE_EVENT: 'before-event',
  /** Đúng ngày sự kiện diễn ra */
  ON_EVENT: 'on-event',
  /** Sau khi sự kiện diễn ra */
  AFTER_EVENT: 'after-event',
  /** Sau khi đã ổn định / về sau */
  LATER: 'later',
});

/**
 * Thẩm quyền thụ lý
 */
export const Jurisdiction = Object.freeze({
  /** Cấp quốc gia (Cục Quản lý Xuất nhập cảnh, Cục Thuế Quốc gia, Quỹ Lương hưu Nhật Bản) */
  NATIONAL: 'national',
  /** Cấp địa phương (Ủy ban Quận / Thành phố / Thị trấn / Làng) */
  MUNICIPAL: 'municipal',
  /** Cấp tỉnh / Đô đạo phủ huyện (To-Do-Fu-Ken) */
  PREFECTURAL: 'prefectural',
  /** Công ty / Cơ quan sử dụng lao động (Phòng Nhân sự, Kế toán) */
  EMPLOYER: 'employer',
});

/**
 * Mức độ bao phủ dữ liệu địa phương
 */
export const Coverage = Object.freeze({
  /** Dữ liệu đã xác thực chính xác cho địa phương này */
  VERIFIED: 'verified',
  /** Một phần quy trình địa phương đã xác thực */
  PARTIAL: 'partial',
  /** Chưa xác thực chi tiết địa phương, áp dụng quy định chuẩn quốc gia */
  UNKNOWN: 'unknown',
});

/**
 * Khởi tạo một đối tượng Recommendation chuẩn hóa
 * @param {{
 *   id: string,
 *   title: { vi: string, ja: string, en: string } | string,
 *   description?: { vi: string, ja: string, en: string } | string,
 *   capabilityId?: string | null,
 *   procedureId?: string | null,
 *   lifeEventId?: string | null,
 *   priority?: string,
 *   timing?: string,
 *   reasonCode: string,
 *   deadline?: {
 *     daysFromEvent?: number | null,
 *     statutoryLimitDays?: number | null,
 *     description?: { vi: string, ja: string, en: string } | string,
 *   } | null,
 *   jurisdiction?: string,
 *   authority?: string | null,
 *   sourceIds?: string[],
 *   confidenceType?: string,
 *   coverage?: string,
 *   requiredDocuments?: string[],
 * }} options
 * @returns {Record<string, any>}
 */
export function createRecommendation(options) {
  if (!options || typeof options !== 'object' || !options.id) {
    throw new Error('Recommendation must have at least an id');
  }

  const recommendation = {
    id: options.id,
    title: options.title || { vi: options.id, ja: options.id, en: options.id },
    description: options.description || null,
    capabilityId: options.capabilityId || null,
    procedureId: options.procedureId || null,
    lifeEventId: options.lifeEventId || null,
    priority: Object.values(Priority).includes(options.priority)
      ? options.priority
      : Priority.RECOMMENDED,
    timing: Object.values(Timing).includes(options.timing)
      ? options.timing
      : Timing.NOW,
    reasonCode: options.reasonCode || 'REASON_GENERAL_RECOMMENDATION',
    deadline: options.deadline
      ? {
          daysFromEvent: options.deadline.daysFromEvent ?? null,
          statutoryLimitDays: options.deadline.statutoryLimitDays ?? null,
          description: options.deadline.description || null,
        }
      : null,
    jurisdiction: Object.values(Jurisdiction).includes(options.jurisdiction)
      ? options.jurisdiction
      : Jurisdiction.NATIONAL,
    authority: options.authority || null,
    sourceIds: Array.isArray(options.sourceIds) ? [...options.sourceIds] : [],
    confidenceType: Object.values(ConfidenceType).includes(options.confidenceType)
      ? options.confidenceType
      : ConfidenceType.DETERMINISTIC,
    coverage: Object.values(Coverage).includes(options.coverage)
      ? options.coverage
      : Coverage.UNKNOWN,
    requiredDocuments: Array.isArray(options.requiredDocuments)
      ? [...options.requiredDocuments]
      : [],
  };

  return Object.freeze(recommendation);
}

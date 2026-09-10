/**
 * @file packages/core/src/life-events/types/lifeEventTypes.js
 * @description
 * Định nghĩa chuẩn hợp đồng dữ liệu cho Nền tảng Sự Kiện Đời Sống (Life Event Foundation Contracts).
 * Cung cấp các type JSDoc và hằng số chuẩn hóa cho Timeline, Checklist, Deadline, Capability.
 */

/**
 * Mức độ bắt buộc của đầu việc trong checklist
 * @readonly
 * @enum {string}
 */
export const REQUIREMENT_LEVELS = Object.freeze({
  REQUIRED: 'required',       // Bắt buộc theo luật định (hạn chế vi phạm/phạt)
  RECOMMENDED: 'recommended', // Khuyến nghị thực hiện (tiết kiệm chi phí, quyền lợi)
  CONDITIONAL: 'conditional', // Tùy thuộc vào điều kiện cụ thể của người dùng
});

// Alias tương thích
export const CHECKLIST_REQUIREMENTS = REQUIREMENT_LEVELS;

/**
 * Các loại giai đoạn dòng thời gian
 * @readonly
 * @enum {string}
 */
export const TIMELINE_STAGE_TYPES = Object.freeze({
  PREPARATION: 'preparation',
  DEADLINE_CRITICAL: 'deadline_critical',
  FOLLOW_UP: 'follow_up',
  STANDARD: 'standard',
});


/**
 * Phân cấp thẩm quyền / phạm vi quản lý
 * @readonly
 * @enum {string}
 */
export const JURISDICTION_TYPES = Object.freeze({
  NATIONAL: 'national',             // Cấp quốc gia (Chính phủ, Bộ ngành, Luật định)
  PREFECTURE: 'prefecture',         // Cấp tỉnh / Đô đạo phủ huyện (To-Do-Fu-Ken)
  MUNICIPALITY: 'municipality',     // Cấp quận / Thị xã / Phường xã (Shi-Ku-Cho-Son)
  PRIVATE_SERVICE: 'private-service'// Đơn vị cung cấp dịch vụ dân sự (Bưu điện, Điện, Gas, Ngân hàng)
});

/**
 * Chiều hướng tính hạn chót tương đối
 * @readonly
 * @enum {string}
 */
export const DEADLINE_DIRECTIONS = Object.freeze({
  BEFORE: 'before', // Trước ngày sự kiện (ví dụ: trước ngày nghỉ việc 14 ngày)
  AFTER: 'after',   // Sau ngày sự kiện (ví dụ: trong vòng 14 ngày sau khi chuyển đến)
});

/**
 * @typedef {Object} DeadlineRule
 * @property {string} anchorKey - Tên trường ngày neo trong context (ví dụ: 'resignationDate', 'birthDate', 'moveDate')
 * @property {number} offsetDays - Số ngày khoảng cách
 * @property {'before' | 'after'} direction - Chiều tính toán
 * @property {'calendar' | 'business'} [calendarType='calendar'] - Loại ngày tính toán
 * @property {Object} [description] - Mô tả hạn chót dự phòng
 * @property {string} [description.ja]
 * @property {string} [description.vi]
 * @property {string} [description.en]
 */

/**
 * @typedef {Object} TimelineStage
 * @property {string} id - Định danh giai đoạn
 * @property {string} [stageId] - Bí danh định danh giai đoạn
 * @property {number} order - Thứ tự hiển thị (1, 2, 3...)
 * @property {string} nameJa - Tên tiếng Nhật
 * @property {string} nameVi - Tên tiếng Việt
 * @property {string} nameEn - Tên tiếng Anh
 * @property {string} [descriptionJa] - Mô tả chi tiết tiếng Nhật
 * @property {string} [descriptionVi] - Mô tả chi tiết tiếng Việt
 * @property {string} [descriptionEn] - Mô tả chi tiết tiếng Anh
 * @property {string} [iconName] - Biểu tượng gợi ý
 */

/**
 * @typedef {Object} ChecklistItem
 * @property {string} id - Mã định danh duy nhất của đầu việc
 * @property {string} stageId - Mã giai đoạn mà đầu việc trực thuộc
 * @property {string} [stage] - Bí danh tương thích ngược cho stageId
 * @property {string} titleJa - Tiêu đề tiếng Nhật
 * @property {string} titleVi - Tiêu đề tiếng Việt
 * @property {string} titleEn - Tiêu đề tiếng Anh
 * @property {'required' | 'recommended' | 'conditional'} [requirement='required'] - Mức độ bắt buộc
 * @property {DeadlineRule} [deadlineRule] - Quy tắc tính hạn chót động
 * @property {string} [deadlineDescriptionJa] - Mô tả hạn chót tiếng Nhật
 * @property {string} [deadlineDescriptionVi] - Mô tả hạn chót tiếng Việt
 * @property {string} [deadlineDescriptionEn] - Mô tả hạn chót tiếng Anh
 * @property {string} [calculatedDeadlineDate] - Ngày hạn chót cụ thể đã tính toán ('YYYY-MM-DD')
 * @property {string} [authorityJa] - Cơ quan thụ lý tiếng Nhật
 * @property {string} [authorityVi] - Cơ quan thụ lý tiếng Việt
 * @property {string} [authorityEn] - Cơ quan thụ lý tiếng Anh
 * @property {string} [locationJa] - Nơi nộp/liên hệ tiếng Nhật
 * @property {string} [locationVi] - Nơi nộp/liên hệ tiếng Việt
 * @property {string} [locationEn] - Nơi nộp/liên hệ tiếng Anh
 * @property {Object} [jurisdiction] - Thẩm quyền
 * @property {'national' | 'prefecture' | 'municipality' | 'private-service'} [jurisdiction.type]
 * @property {string} [jurisdiction.code]
 * @property {string[]} [sourceIds] - Danh sách mã nguồn pháp điển sơ cấp
 * @property {string} [relatedCapabilityId] - Mã capability tương ứng (ví dụ: 'housing.moving.cost.calculate')
 * @property {string} [toolId] - Mã mini-app đích sau khi phân giải
 * @property {string} [toolLinkId] - Bí danh tương thích ngược cho toolId
 * @property {Object} [externalAction] - Hành động liên kết bên ngoài
 * @property {string} externalAction.url
 * @property {string} [externalAction.labelJa]
 * @property {string} [externalAction.labelVi]
 * @property {string} [externalAction.labelEn]
 * @property {string[]} [requiredDocumentsJa] - Giấy tờ cần chuẩn bị tiếng Nhật
 * @property {string[]} [requiredDocumentsVi] - Giấy tờ cần chuẩn bị tiếng Việt
 * @property {string[]} [requiredDocumentsEn] - Giấy tờ cần chuẩn bị tiếng Anh
 * @property {Array<{ type: 'info' | 'warning' | 'caution', messageJa: string, messageVi: string, messageEn: string }>} [warnings]
 * @property {string} [localNotesJa] - Ghi chú đặc thù địa phương tiếng Nhật
 * @property {string} [localNotesVi] - Ghi chú đặc thù địa phương tiếng Việt
 * @property {string} [localNotesEn] - Ghi chú đặc thù địa phương tiếng Anh
 * @property {boolean} [isUrgent=false] - Cờ đánh dấu đầu việc khẩn cấp
 */

/**
 * @typedef {Object} LifeEventDefinition
 * @property {string} id - Mã sự kiện (ví dụ: 'leaving-job', 'birth', 'moving')
 * @property {string} country - Mã quốc gia ('JP')
 * @property {string} domain - Tên miền ('employment', 'family', 'housing')
 * @property {Object} title - Tiêu đề sự kiện
 * @property {string} title.ja
 * @property {string} title.vi
 * @property {string} title.en
 * @property {TimelineStage[]} stages - Danh sách các giai đoạn
 * @property {string[]} sources - Danh sách mã nguồn pháp quy
 * @property {Function} [evaluateTimeline] - Hàm tùy biến giai đoạn theo context
 * @property {Function} evaluateChecklist - Hàm sinh danh mục công việc từ context
 * @property {string[]} [capabilities] - Danh sách các capability mà sự kiện liên kết
 */

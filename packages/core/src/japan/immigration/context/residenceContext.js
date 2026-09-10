/**
 * @file packages/core/src/japan/immigration/context/residenceContext.js
 * @description
 * Định nghĩa Ngữ Cảnh Cư Trú Chuẩn Hóa (Canonical Residence Context) cho Nhật Bản.
 * Cung cấp mô hình dữ liệu tối giản dùng chung giữa các mini-app và life-events trong miền Quản lý Cư trú & Xuất nhập cảnh.
 * 
 * Nguyên tắc kiến trúc:
 * 1. Logic chỉ làm việc với canonical status ID (ví dụ: 'engineer-humanities-international'), không dùng nhãn hiển thị.
 * 2. Bảo mật & quyền riêng tư: Tuyệt đối không yêu cầu hoặc lưu trữ số thẻ ngoại kiều hay số hộ chiếu.
 * 3. Hoàn toàn độc lập với UI framework (Zero React dependencies).
 */

/**
 * @typedef {'engineer-humanities-international'
 *   | 'business-manager'
 *   | 'highly-skilled-professional-1'
 *   | 'highly-skilled-professional-2'
 *   | 'skilled-labor'
 *   | 'intra-company-transferee'
 *   | 'specified-skilled-worker-1'
 *   | 'specified-skilled-worker-2'
 *   | 'technical-intern-training'
 *   | 'nursing-care'
 *   | 'professor'
 *   | 'legal-accounting'
 *   | 'medical-services'
 *   | 'researcher'
 *   | 'instructor'
 *   | 'artist'
 *   | 'journalist'
 *   | 'entertainer'
 *   | 'student'
 *   | 'dependent'
 *   | 'cultural-activities'
 *   | 'temporary-visitor'
 *   | 'trainee'
 *   | 'designated-activities'
 *   | 'permanent-resident'
 *   | 'spouse-of-japanese'
 *   | 'spouse-of-permanent-resident'
 *   | 'long-term-resident'} CanonicalResidenceStatusId
 *
 * @typedef {'full-time' | 'contract' | 'part-time' | 'dispatch' | 'self-employed' | 'unemployed'} EmploymentType
 *
 * @typedef {'spouse' | 'child' | 'parent' | 'sibling' | 'other'} FamilyRelationshipType
 *
 * @typedef {Object} ResidenceContext
 * @property {CanonicalResidenceStatusId} residenceStatus - Mã định danh tư cách lưu trú chuẩn
 * @property {string} [periodOfStayEndDate] - Ngày hết hạn tư cách lưu trú hiện tại (YYYY-MM-DD)
 * @property {string} [currentActivity] - Hoạt động công việc hoặc học tập thực tế hiện tại
 * @property {string} [employerOrInstitution] - Tên cơ quan, công ty hoặc trường học tiếp nhận
 * @property {EmploymentType} [employmentType] - Hình thức làm việc
 * @property {boolean} [hasExtraActivityPermission] - Đã được cấp Giấy phép hoạt động ngoài tư cách (資格外活動許可)
 * @property {FamilyRelationshipType} [familyRelationship] - Mối quan hệ thân nhân (khi bảo lãnh/phụ thuộc)
 * @property {string} [applicationDate] - Ngày nộp đơn thực tế hoặc dự kiến (dùng cho quy tắc thời gian và lệ phí)
 * @property {number} [yearsInJapan] - Số năm tích lũy cư trú liên tục tại Nhật Bản
 * @property {string} [notes] - Ghi chú ngữ cảnh bổ sung
 */

/**
 * Khởi tạo một ResidenceContext chuẩn hóa
 * @param {Partial<ResidenceContext>} input
 * @returns {ResidenceContext}
 */
export function createResidenceContext(input = {}) {
  if (!input || typeof input !== 'object') {
    return {
      residenceStatus: 'engineer-humanities-international',
      hasExtraActivityPermission: false,
    };
  }

  return Object.freeze({
    residenceStatus: input.residenceStatus || 'engineer-humanities-international',
    periodOfStayEndDate: input.periodOfStayEndDate || null,
    currentActivity: input.currentActivity ? String(input.currentActivity).trim() : '',
    employerOrInstitution: input.employerOrInstitution ? String(input.employerOrInstitution).trim() : '',
    employmentType: input.employmentType || 'full-time',
    hasExtraActivityPermission: Boolean(input.hasExtraActivityPermission),
    familyRelationship: input.familyRelationship || null,
    applicationDate: input.applicationDate || null,
    yearsInJapan: typeof input.yearsInJapan === 'number' && !isNaN(input.yearsInJapan) ? input.yearsInJapan : 0,
    notes: input.notes ? String(input.notes).trim() : '',
  });
}

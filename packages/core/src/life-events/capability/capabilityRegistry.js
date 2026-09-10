/**
 * @file packages/core/src/life-events/capability/capabilityRegistry.js
 * @description
 * Cơ chế phân giải năng lực (Capability Registry) cho các sự kiện đời sống.
 * Ánh xạ các semantic capability IDs trừu tượng sang Tool ID cụ thể và sinh đường dẫn URL Hash deep link an toàn.
 * Đảm bảo Zero Cross-Domain Direct Imports và xử lý an toàn khi capability chưa tồn tại (Missing Capability).
 */

/**
 * Bảng ánh xạ mặc định từ Semantic Capability sang Tool ID
 * @type {Record<string, string>}
 */
const DEFAULT_CAPABILITY_MAP = {
  // Tên miền Lao động (Employment)
  'employment.overtime.calculate': 'overtime-calculator-jp',
  'employment.paidLeave.check': 'paid-leave-checker-jp',
  'employment.unemployment.eligibility': 'unemployment-eligibility-jp',
  'employment.unemployment.benefit': 'unemployment-benefit-jp',
  'employment.leavingJob.guide': 'leaving-job-wizard-jp',

  // Tên miền Bảo hiểm & Lương hưu (Insurance & Pension)
  'insurance.socialInsurance.calculate': 'social-insurance-jp',
  'insurance.socialInsurance.eligibility': 'social-insurance-eligibility-jp',
  'insurance.pension.national': 'national-pension-jp',
  'insurance.health.dependent': 'dependent-insurance-jp',

  // Tên miền Gia đình & Trẻ em (Family & Child)
  'family.maternity.allowance': 'maternity-allowance-jp',
  'family.childcare.eligibility': 'childcare-leave-eligibility-jp',
  'family.childcare.benefit': 'childcare-benefit-jp',
  'family.childAllowance.calculate': 'child-allowance-jp',
  'family.birth.guide': 'birth-wizard-jp',

  // Tên miền Thuế (Tax)
  'tax.japan.calculate': 'japan-tax-simulator',

  // Tên miền Nhà ở & Chuyển nhà (Housing & Moving)
  'housing.moving.cost.calculate': 'moving-cost-jp',
  'housing.moving.admin.check': 'moving-admin-checker-jp',
  'housing.address.change.check': 'address-change-checklist-jp',
  'housing.moving.guide': 'moving-wizard-jp',

  // Tên miền Quản lý Cư trú & Xuất nhập cảnh (Residence & Immigration)
  'immigration.workScope.check': 'work-scope-checker-jp',
  'immigration.residenceRenewal.guide': 'residence-renewal-guide-jp',
  'immigration.affiliationChange.check': 'affiliation-change-checker-jp',
  'immigration.statusChange.guide': 'status-change-guide-jp',
  'immigration.familyImmigration.guide': 'family-immigration-guide-jp',
  'immigration.permanentResidence.check': 'pr-readiness-checker-jp',
  'immigration.arrivingInJapan.guide': 'arriving-in-japan-wizard-jp',
  'immigration.leavingJapan.guide': 'leaving-japan-wizard-jp',

  // Biến thể tương thích (Compatibility Aliases)
  'family.maternityAllowance.simulate': 'maternity-allowance-jp',
  'family.childcareLeave.check': 'childcare-leave-eligibility-jp',
  'family.childcareBenefit.simulate': 'childcare-benefit-jp',
  'family.childAllowance.check': 'child-allowance-jp',
  'insurance.dependent.check': 'dependent-insurance-jp',
  'tax.incomeTax.simulate': 'japan-tax-simulator',
};

// Mutable registry instance cho phép mở rộng linh hoạt
const capabilityRegistryStore = new Map(Object.entries(DEFAULT_CAPABILITY_MAP));

/**
 * Đăng ký hoặc cập nhật một capability mapping
 * @param {string} capabilityId Mã định danh semantic capability
 * @param {string} toolId Mã định danh tool trong Hub
 */
export function registerCapability(capabilityId, toolId) {
  if (typeof capabilityId === 'string' && typeof toolId === 'string') {
    capabilityRegistryStore.set(capabilityId.trim(), toolId.trim());
  }
}

/**
 * Phân giải một semantic capability ID sang thông tin điều hướng cụ thể
 * @param {string} capabilityId Mã năng lực cần tra cứu
 * @returns {{
 *   capabilityId: string,
 *   toolId: string | null,
 *   hashRoute: string | null,
 *   isAvailable: boolean
 * }}
 */
export function resolveCapability(capabilityId) {
  if (!capabilityId || typeof capabilityId !== 'string') {
    return {
      capabilityId: capabilityId || '',
      toolId: null,
      hashRoute: null,
      isAvailable: false,
    };
  }

  const cleanId = capabilityId.trim();
  const toolId = capabilityRegistryStore.get(cleanId) || null;

  if (toolId) {
    return {
      capabilityId: cleanId,
      toolId,
      hashRoute: `#/tools/${toolId}`,
      isAvailable: true,
    };
  }

  // Trường hợp capability chưa được hiện thực / chưa đăng ký tool tương ứng
  return {
    capabilityId: cleanId,
    toolId: null,
    hashRoute: null,
    isAvailable: false,
  };
}

/**
 * Sinh chuỗi deep link URL Hash an toàn từ capability ID kèm payload ngữ cảnh tùy chọn
 * @param {string} capabilityId
 * @param {Record<string, any>} [optionalPayload]
 * @returns {string | null} Chuỗi URL Hash (ví dụ: '#/tools/dependent-insurance-jp') hoặc null nếu không tồn tại
 */
export function buildCapabilityDeepLink(capabilityId, optionalPayload = null) {
  const resolved = resolveCapability(capabilityId);
  if (!resolved.isAvailable || !resolved.hashRoute) {
    return null;
  }

  if (optionalPayload && typeof optionalPayload === 'object' && Object.keys(optionalPayload).length > 0) {
    try {
      const params = new URLSearchParams();
      for (const [key, val] of Object.entries(optionalPayload)) {
        if (val !== undefined && val !== null && val !== '') {
          params.append(key, String(val));
        }
      }
      const queryStr = params.toString();
      if (queryStr) {
        return `${resolved.hashRoute}?${queryStr}`;
      }
    } catch {
      return resolved.hashRoute;
    }
  }

  return resolved.hashRoute;
}

/**
 * Lấy toàn bộ danh sách mapping hiện có (dành cho kiểm thử hoặc thanh tra)
 * @returns {Record<string, string>}
 */
export function getAllCapabilities() {
  return Object.fromEntries(capabilityRegistryStore.entries());
}

/**
 * Đặt lại bảng capability về mặc định ban đầu
 */
export function resetCapabilityRegistry() {
  capabilityRegistryStore.clear();
  for (const [cap, tool] of Object.entries(DEFAULT_CAPABILITY_MAP)) {
    capabilityRegistryStore.set(cap, tool);
  }
}

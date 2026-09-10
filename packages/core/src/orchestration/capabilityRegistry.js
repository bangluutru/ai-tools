/**
 * @file packages/core/src/orchestration/capabilityRegistry.js
 * @description
 * Danh bạ định tuyến năng lực trừu tượng (Abstract Capability Registry).
 * Cho phép các Orchestrators / Life Event Wizards điều hướng và liên kết công cụ mà không bị phụ thuộc cứng (coupling)
 * vào implementation của mini-app cụ thể, hỗ trợ graceful fallback khi công cụ chưa được cài đặt hoặc là cổng thông tin ngoài.
 */

export const CAPABILITY_REGISTRY = Object.freeze({
  'family.maternityAllowance.simulate': {
    capabilityId: 'family.maternityAllowance.simulate',
    toolId: 'maternity-allowance-jp',
    titleJa: '出産手当金シミュレーター',
    titleVi: 'Mô phỏng Trợ cấp Thai sản (BHYT)',
    titleEn: 'Maternity Allowance Simulator',
    badgeJa: '健康保険',
    badgeVi: 'BHYT',
    badgeEn: 'Health Insurance',
    descriptionJa: '産前産後休業中の給与補償（標準報酬月額の3分之2）を日額・総額で試算します。',
    descriptionVi: 'Tính toán trợ cấp bù đắp thu nhập nghỉ thai sản (2/3 lương tiêu chuẩn bình quân) theo ngày và tổng số tiền.',
    descriptionEn: 'Simulate daily and total health insurance maternity allowance (2/3 of standard monthly remuneration).',
    isInstalled: true,
  },
  'family.childcareLeave.check': {
    capabilityId: 'family.childcareLeave.check',
    toolId: 'childcare-leave-eligibility-jp',
    titleJa: '育児休業・給付チェッカー',
    titleVi: 'Kiểm tra Điều kiện Nghỉ & Trợ cấp Chăm con',
    titleEn: 'Childcare Leave & Benefit Checker',
    badgeJa: '雇用保険',
    badgeVi: 'BHTN',
    badgeEn: 'Employment',
    descriptionJa: '法定の育児休業権利と4つの給付金（育休・産後パパ育休・支援給付・時短給付）の受給要件を判定します。',
    descriptionVi: 'Đánh giá quyền nghỉ theo luật lao động và điều kiện 4 chế độ trợ cấp BHTN (chuẩn, sau sinh bố mẹ, hỗ trợ sau sinh, làm việc rút ngắn).',
    descriptionEn: 'Check statutory leave rights and eligibility across 4 childcare benefit schemes.',
    isInstalled: true,
  },
  'family.childcareBenefit.simulate': {
    capabilityId: 'family.childcareBenefit.simulate',
    toolId: 'childcare-benefit-jp',
    titleJa: '育児休業給付シミュレーター',
    titleVi: 'Mô phỏng Số tiền Trợ cấp Nghỉ chăm con',
    titleEn: 'Childcare Leave Benefit Simulator',
    badgeJa: '雇用保険',
    badgeVi: 'BHTN',
    badgeEn: 'Benefit',
    descriptionJa: '賃金日額に基づき、67％・50％・出生後支援13％加算・時短給付をタイムラインで試算します。',
    descriptionVi: 'Mô phỏng số tiền nhận được theo tỷ lệ 67%, 50%, thưởng 13% sau sinh và trợ cấp làm việc rút ngắn theo dòng thời gian.',
    descriptionEn: 'Simulate benefits across leave timeline: 67%, 50%, +13% post-birth bonus, and short-time work.',
    isInstalled: true,
  },
  'family.childAllowance.check': {
    capabilityId: 'family.childAllowance.check',
    toolId: 'child-allowance-jp',
    titleJa: '児童手当チェッカー',
    titleVi: 'Kiểm tra & Tính Trợ cấp Trẻ em (Jidou Teate)',
    titleEn: 'Child Allowance Checker',
    badgeJa: 'こども家庭庁',
    badgeVi: 'Trợ cấp',
    badgeEn: 'Allowance',
    descriptionJa: '令和6年10月改正（所得制限撤廃・高校生年代拡大・第3子3万円）に基づく月額・年額の支給見込みを算出します。',
    descriptionVi: 'Tính mức trợ cấp trẻ em theo luật cải cách 10/2024 (bỏ trần thu nhập, mở rộng đến cấp 3, con thứ 3 là 30.000 yên).',
    descriptionEn: 'Calculate child allowance under Oct 2024 reformed framework (no income caps, high school age, 3rd child 30k JPY).',
    isInstalled: true,
  },
  'insurance.dependent.check': {
    capabilityId: 'insurance.dependent.check',
    toolId: 'dependent-insurance-jp',
    titleJa: '被扶養者判定チェッカー',
    titleVi: 'Kiểm tra Điều kiện BHYT Phụ thuộc',
    titleEn: 'Dependent Insurance Checker',
    badgeJa: '社会保険',
    badgeVi: 'BHYT',
    badgeEn: 'Social Ins',
    descriptionJa: '年収130万円未満の壁、同居・別居条件、家族の扶養に入れるかを判定します。',
    descriptionVi: 'Kiểm tra điều kiện vào phụ thuộc BHYT người thân (ngưỡng 1,3 triệu yên/năm, điều kiện sống chung/riêng).',
    descriptionEn: 'Check eligibility to join family health insurance as a dependent (1.3M JPY ceiling).',
    isInstalled: true,
  },
  'tax.incomeTax.simulate': {
    capabilityId: 'tax.incomeTax.simulate',
    toolId: 'japan-tax-simulator',
    titleJa: '日本税金シミュレーター',
    titleVi: 'Mô phỏng Thuế Thu nhập & Cư trú Nhật Bản',
    titleEn: 'Japan Tax Simulator',
    badgeJa: '税金',
    badgeVi: 'Thuế',
    badgeEn: 'Tax',
    descriptionJa: '所得税・住民税・社会保険料の控除、年末調整・確定申告での還付見込みを総合試算します。',
    descriptionVi: 'Tính toán toàn diện thuế thu nhập, thuế cư trú, bảo hiểm xã hội và dự toán hoàn thuế khi nghỉ việc giữa năm.',
    descriptionEn: 'Simulate income tax, resident tax, and refunds via tax return.',
    isInstalled: true,
  }
});

/**
 * Tra cứu thông tin điều hướng của một Capability
 * @param {string} capabilityId
 * @returns {typeof CAPABILITY_REGISTRY[keyof typeof CAPABILITY_REGISTRY] | null}
 */
export function resolveCapability(capabilityId) {
  if (!capabilityId) return null;
  return CAPABILITY_REGISTRY[capabilityId] || null;
}

/**
 * Tạo URL hash route an toàn cho Capability
 * @param {string} capabilityId
 * @param {Record<string, any>} [contextParams] - Tham số truyền ngữ cảnh tùy chọn (pre-fill)
 * @returns {string} Hash route ví dụ: '#/tools/maternity-allowance-jp?salary=300000'
 */
export function buildCapabilityRoute(capabilityId, contextParams = {}) {
  const cap = resolveCapability(capabilityId);
  if (!cap) return '#/';

  let route = `#/tools/${cap.toolId}`;
  if (contextParams && Object.keys(contextParams).length > 0) {
    const query = new URLSearchParams();
    for (const [k, v] of Object.entries(contextParams)) {
      if (v !== undefined && v !== null && v !== '') {
        query.append(k, String(v));
      }
    }
    const qs = query.toString();
    if (qs) {
      route += `?${qs}`;
    }
  }
  return route;
}

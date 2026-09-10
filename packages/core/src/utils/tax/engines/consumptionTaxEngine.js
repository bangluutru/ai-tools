/**
 * @file packages/core/src/utils/tax/engines/consumptionTaxEngine.js
 * @description Deterministic engine tính thuế tiêu thụ Nhật Bản (消費税及び地方消費税).
 * Hỗ trợ xác định tư cách nộp thuế (miễn thuế vs chịu thuế, Invoice),
 * phương pháp thông thường (本則課税), phương pháp giản dịch (簡易課税 6 nhóm ngành),
 * và đặc lệ 20% (2割特例).
 */

import { roundFinalTaxAmount } from './incomeTaxEngine.js';

export const SimplifiedTaxCategories = [
  { id: 'cat1_wholesale', name_ja: '第1種（卸売業）', name_vi: 'Nhóm 1 (Bán buôn)', name_en: 'Type 1 (Wholesale)', rate: 0.90 },
  { id: 'cat2_retail', name_ja: '第2種（小売業）', name_vi: 'Nhóm 2 (Bán lẻ)', name_en: 'Type 2 (Retail)', rate: 0.80 },
  { id: 'cat3_manufacturing', name_ja: '第3種（製造業・建設業・農林水産業）', name_vi: 'Nhóm 3 (Sản xuất, Xây dựng, Nông lâm thủy sản)', name_en: 'Type 3 (Manufacturing, Construction, Agri)', rate: 0.70 },
  { id: 'cat4_dining_other', name_ja: '第4種（飲食店業・その他の事業）', name_vi: 'Nhóm 4 (Nhà hàng, Quán ăn, Hoạt động khác)', name_en: 'Type 4 (Restaurants, Other services)', rate: 0.60 },
  { id: 'cat5_service_it', name_ja: '第5種（サービス業・IT・専門職・運輸通信業）', name_vi: 'Nhóm 5 (Dịch vụ, CNTT, Chuyên gia, Vận tải viễn thông)', name_en: 'Type 5 (Services, IT, Professionals)', rate: 0.50 },
  { id: 'cat6_realestate', name_ja: '第6種（不動産業）', name_vi: 'Nhóm 6 (Bất động sản)', name_en: 'Type 6 (Real Estate)', rate: 0.40 },
];

/**
 * Kiểm tra tư cách chịu thuế tiêu thụ
 */
export function determineTaxableStatus({
  basePeriodSales = 0, // Doanh thu chịu thuế 2 năm trước (基準期間)
  isInvoiceRegistered = false, // Đã đăng ký hóa đơn hợp lệ (インボイス発行事業者)
  specificPeriodSales = 0, // Doanh thu 6 tháng đầu năm trước (特定期間)
}) {
  const THRESHOLD = 10000000; // 1,000万円

  if (isInvoiceRegistered) {
    return {
      isTaxable: true,
      reason_ja: '適格請求書発行事業者（インボイス登録）のため、売上高にかかわらず課税事業者となります。',
      reason_vi: 'Do đã đăng ký cơ sở phát hành hóa đơn hợp lệ (Invoice), bạn là đối tượng chịu thuế tiêu thụ bất kể mức doanh thu.',
      reason_en: 'Registered invoice issuer: automatically subject to consumption tax regardless of sales.',
      canUse20PercentRule: true,
    };
  }

  if (basePeriodSales > THRESHOLD) {
    return {
      isTaxable: true,
      reason_ja: '基準期間（2年前）の課税売上高が1,000万円を超えているため、課税事業者となります。',
      reason_vi: 'Doanh thu chịu thuế của kỳ chuẩn (2 năm trước) vượt quá 1,000 vạn yên, thuộc diện nộp thuế tiêu thụ.',
      reason_en: 'Base period sales exceed 10M JPY: subject to consumption tax.',
      canUse20PercentRule: false,
    };
  }

  if (specificPeriodSales > THRESHOLD) {
    return {
      isTaxable: true,
      reason_ja: '特定期間（前年上半期）の売上・給与が1,000万円を超えているため、課税事業者となります。',
      reason_vi: 'Doanh thu/lương trả trong kỳ đặc định (6 tháng đầu năm trước) vượt quá 1,000 vạn yên, thuộc diện nộp thuế.',
      reason_en: 'Specific period sales exceed 10M JPY: subject to consumption tax.',
      canUse20PercentRule: false,
    };
  }

  return {
    isTaxable: false,
    reason_ja: '基準期間・特定期間の売上が1,000万円以下でインボイス未登録のため、免税事業者となります。',
    reason_vi: 'Doanh thu các kỳ chuẩn dưới 1,000 vạn yên và chưa đăng ký Invoice nên thuộc diện miễn thuế tiêu thụ.',
    reason_en: 'Sales below 10M JPY without invoice registration: tax-exempt enterprise.',
    canUse20PercentRule: false,
  };
}

/**
 * Tính thuế tiêu thụ chi tiết
 * @param {object} params
 * @param {object} params.rules - Tax rules của năm
 * @param {number} params.taxableSales - Doanh thu chịu thuế tiêu chuẩn trong năm (chưa gồm thuế)
 * @param {number} [params.taxablePurchases=0] - Chi phí mua vào chịu thuế trong năm (chưa gồm thuế)
 * @param {number} [params.basePeriodSales=0] - Doanh thu 2 năm trước
 * @param {boolean} [params.isInvoiceRegistered=false] - Đăng ký Invoice
 * @param {string} [params.calcMethod='standard'] - Phương pháp tính ('standard': 本則, 'simplified': 簡易, 'special_20': 2割特例)
 * @param {string} [params.simplifiedCatId='cat5_service_it'] - Mã nhóm ngành nếu chọn 簡易課税
 * @returns {object} Chi tiết tính toán thuế tiêu thụ
 */
export function calculateConsumptionTax({
  rules,
  taxableSales = 0,
  taxablePurchases = 0,
  basePeriodSales = 0,
  isInvoiceRegistered = false,
  calcMethod = 'standard',
  simplifiedCatId = 'cat5_service_it',
}) {
  const safeSales = Math.max(0, Number(taxableSales) || 0);
  const safePurchases = Math.max(0, Number(taxablePurchases) || 0);
  const status = determineTaxableStatus({
    basePeriodSales,
    isInvoiceRegistered,
  });

  // Nếu thuộc diện miễn thuế (免税事業者)
  if (!status.isTaxable) {
    return {
      isTaxable: false,
      reason_ja: status.reason_ja,
      reason_vi: status.reason_vi,
      reason_en: status.reason_en,
      calcMethod: 'exempt',
      outputTax: 0,
      inputTaxCredit: 0,
      payableTax: 0,
    };
  }

  const taxRate = rules.consumptionTax.standardRate || 0.10;
  // Thuế đầu ra = Doanh thu * 10%
  const outputTax = Math.floor(safeSales * taxRate);

  let inputTaxCredit = 0;
  let rawPayable = 0;
  let activeMethod = calcMethod;

  // 1. Đặc lệ 20% (2割特例)
  if (calcMethod === 'special_20' && status.canUse20PercentRule) {
    // Chỉ nộp 20% của thuế đầu ra (tương đương khấu trừ 80%)
    inputTaxCredit = Math.floor(outputTax * 0.80);
    rawPayable = Math.max(0, outputTax - inputTaxCredit);
  }
  // 2. Phương pháp giản dịch (簡易課税)
  else if (calcMethod === 'simplified') {
    const cat = SimplifiedTaxCategories.find((c) => c.id === simplifiedCatId) || SimplifiedTaxCategories[4];
    const deemedRate = cat.rate;
    inputTaxCredit = Math.floor(outputTax * deemedRate);
    rawPayable = Math.max(0, outputTax - inputTaxCredit);
  }
  // 3. Phương pháp thông thường (本則課税)
  else {
    activeMethod = 'standard';
    inputTaxCredit = Math.floor(safePurchases * taxRate);
    rawPayable = Math.max(0, outputTax - inputTaxCredit);
  }

  const payableTax = roundFinalTaxAmount(rawPayable);

  return {
    isTaxable: true,
    reason_ja: status.reason_ja,
    reason_vi: status.reason_vi,
    reason_en: status.reason_en,
    calcMethod: activeMethod,
    taxableSales: safeSales,
    taxablePurchases: safePurchases,
    taxRate,
    outputTax,
    inputTaxCredit,
    rawPayable,
    payableTax,
  };
}

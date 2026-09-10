/**
 * @file packages/core/src/utils/tax/engines/enterpriseTaxEngine.js
 * @description Deterministic engine tính thuế kinh doanh cá nhân (個人事業税).
 * Hỗ trợ phân loại 3 nhóm ngành (5%, 4%, 3%), miễn trừ chủ kinh doanh (事業主控除 290万円),
 * tính tỷ lệ theo tháng hoạt động, và giải thích các ngành nghề không thuộc diện chịu thuế.
 */

import { roundTaxableIncome, roundFinalTaxAmount } from './incomeTaxEngine.js';

export const BusinessCategories = [
  {
    id: 'type1_retail_dining',
    type: 'type1',
    rate: 0.05,
    name_ja: '第1種事業（飲食店・小売・卸売・製造・デザイン・運送等）',
    name_vi: 'Ngành loại 1 (Ăn uống, Bán lẻ, Bán buôn, Sản xuất, Thiết kế, Vận tải...)',
    name_en: 'Category 1 (Retail, Dining, Wholesale, Manufacturing, Design, Logistics...)',
    taxRateLabel: '5%',
  },
  {
    id: 'type1_realestate',
    type: 'type1',
    rate: 0.05,
    name_ja: '第1種事業（不動産貸付・仲介業）',
    name_vi: 'Ngành loại 1 (Cho thuê & Môi giới Bất động sản)',
    name_en: 'Category 1 (Real Estate Leasing & Brokerage)',
    taxRateLabel: '5%',
  },
  {
    id: 'type2_agriculture',
    type: 'type2',
    rate: 0.04,
    name_ja: '第2種事業（水産業・畜産業・薪炭製造業）',
    name_vi: 'Ngành loại 2 (Thủy sản, Chăn nuôi gia súc, Sản xuất than củi)',
    name_en: 'Category 2 (Fisheries, Livestock, Charcoal Production)',
    taxRateLabel: '4%',
  },
  {
    id: 'type3_consulting_it',
    type: 'type3_standard',
    rate: 0.05,
    name_ja: '第3種事業（士業・コンサルタント・ITエンジニア請負等）',
    name_vi: 'Ngành loại 3 (Luật sư, Chuyên viên thuế, Tư vấn, Hợp đồng thầu IT...)',
    name_en: 'Category 3 (Consultants, Tax Accountants, IT Contractors...)',
    taxRateLabel: '5%',
  },
  {
    id: 'type3_medical_legal',
    type: 'type3_standard',
    rate: 0.05,
    name_ja: '第3種事業（医業・歯科医・薬剤師・弁護士等）',
    name_vi: 'Ngành loại 3 (Y khoa, Nha sĩ, Dược sĩ, Luật sư...)',
    name_en: 'Category 3 (Medical, Dentist, Pharmacist, Attorney...)',
    taxRateLabel: '5%',
  },
  {
    id: 'type3_massage_midwife',
    type: 'type3_reduced',
    rate: 0.03,
    name_ja: '第3種事業（あん摩・マッサージ・はり・助産師等）',
    name_vi: 'Ngành loại 3 giảm nhẹ (Xoa bóp bấm huyệt, Châm cứu, Hộ sinh)',
    name_en: 'Category 3 Reduced (Massage, Acupuncture, Midwife)',
    taxRateLabel: '3%',
  },
  {
    id: 'non_taxable_writer',
    type: 'non_taxable',
    rate: 0.0,
    name_ja: '法定業種外・非課税（作家・漫画家・翻訳家・文筆業等）',
    name_vi: 'Ngoài danh mục luật định (Nhà văn, Họa sĩ truyện tranh, Dịch giả, Soạn thảo văn học...)',
    name_en: 'Non-Taxable Statutory Exempt (Writers, Manga Artists, Translators...)',
    taxRateLabel: '0%（非課税）',
  },
];

/**
 * Tính thuế kinh doanh cá nhân
 * @param {object} params
 * @param {object} params.rules - Tax rules của năm
 * @param {number} params.businessIncome - Thu nhập kinh doanh ròng (Doanh thu - Chi phí - KHÔNG trừ 青色申告特別控除 vì thuế kinh doanh không áp dụng khấu trừ này)
 * @param {string} [params.categoryId='type1_retail_dining'] - Mã phân loại ngành
 * @param {number} [params.operatingMonths=12] - Số tháng hoạt động trong năm (1 - 12)
 * @returns {object} Chi tiết tính thuế kinh doanh cá nhân
 */
export function calculateEnterpriseTax({
  rules,
  businessIncome = 0,
  categoryId = 'type1_retail_dining',
  operatingMonths = 12,
}) {
  const safeIncome = Math.max(0, Number(businessIncome) || 0);
  const months = Math.max(1, Math.min(12, Number(operatingMonths) || 12));

  // 1. Tìm thông tin ngành nghề
  const category = BusinessCategories.find((c) => c.id === categoryId) || BusinessCategories[0];
  const rate = category.rate;

  // 2. Mức miễn trừ chủ kinh doanh (事業主控除 290万円/năm, tính theo tháng nếu dưới 1 năm)
  const annualDeduction = rules.enterpriseTax.proprietorDeductionAnnual || 2900000;
  const proprietorDeduction = Math.floor((annualDeduction * months) / 12);

  // 3. Thu nhập tính thuế (sau khi trừ mức giảm trừ chủ kinh doanh)
  const rawTaxable = Math.max(0, safeIncome - proprietorDeduction);
  const taxableIncome = roundTaxableIncome(rawTaxable);

  // 4. Tính thuế
  let enterpriseTax = 0;
  if (taxableIncome > 0 && rate > 0) {
    const rawTax = Math.floor(taxableIncome * rate);
    enterpriseTax = roundFinalTaxAmount(rawTax);
  }

  return {
    category,
    rate,
    operatingMonths: months,
    annualDeduction,
    proprietorDeduction,
    rawTaxableIncome: rawTaxable,
    taxableIncome,
    enterpriseTax,
    isNonTaxableProfession: category.rate === 0,
    isBelowDeduction: safeIncome <= proprietorDeduction,
  };
}

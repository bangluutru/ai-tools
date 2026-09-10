/**
 * @file packages/core/src/utils/tax/taxRulesRegistry.js
 * @description Centralized Tax Rules Registry cho miniapp "日本の税金ガイド・シミュレーター".
 * Quản lý các quy tắc thuế Nhật Bản phân tách theo năm tài chính (2025, 2026, tương lai),
 * khu vực địa lý, kèm siêu dữ liệu xác minh và nguồn trích dẫn luật chính thức.
 */

import { Rules2025 } from './rules/2025/index.js';
import { Rules2026 } from './rules/2026/index.js';
import { PrefectureLocations, DefaultLocation } from './rules/locations/prefectureDefaults.js';

export const SUPPORTED_TAX_YEARS = [2025, 2026];
export const DEFAULT_TAX_YEAR = 2026;

const registryByYear = {
  2025: Rules2025,
  2026: Rules2026,
};

/**
 * Lấy bộ quy tắc thuế cho một năm tài chính cụ thể.
 * @param {number} year - Năm dương lịch (2025, 2026,...)
 * @returns {object} Bộ quy tắc thuế hoàn chỉnh của năm
 */
export function getTaxRules(year = DEFAULT_TAX_YEAR) {
  const selectedYear = Number(year);
  if (registryByYear[selectedYear]) {
    return registryByYear[selectedYear];
  }
  // Fallback về năm 2026 nếu năm yêu cầu chưa đăng ký
  return registryByYear[DEFAULT_TAX_YEAR];
}

/**
 * Lấy danh sách các năm thuế được hỗ trợ cùng metadata
 */
export function getSupportedYearsMeta() {
  return SUPPORTED_TAX_YEARS.map((y) => {
    const rules = registryByYear[y];
    return {
      year: y,
      fiscalEra: rules.fiscalEra,
      label_ja: `${y}年（${rules.fiscalEra}）`,
      label_vi: `Năm ${y} (${rules.fiscalEra})`,
      label_en: `Year ${y} (${rules.fiscalEra})`,
      status: rules.status,
      notes_ja: rules.notes_ja,
      notes_vi: rules.notes_vi,
      notes_en: rules.notes_en,
      verifiedDate: rules.verifiedDate,
    };
  });
}

/**
 * Tra cứu thông tin thuế cư trú và tỷ lệ bảo hiểm theo tỉnh/thành phố
 * @param {string} prefCode - Mã hoặc tên tiếng Anh/Nhật của tỉnh
 */
export function getLocationRules(prefCode = 'tokyo') {
  const normalized = String(prefCode).toLowerCase().trim();
  return PrefectureLocations[normalized] || DefaultLocation;
}

/**
 * Lấy danh sách 47 tỉnh thành phố Nhật Bản để đưa vào dropdown UI
 */
export function getAllPrefectures() {
  return Object.values(PrefectureLocations).map((p) => ({
    id: p.code,
    code: p.code,
    name_ja: p.name_ja,
    name_vi: p.name_vi,
    name_en: p.name_en,
    region: p.region,
  }));
}

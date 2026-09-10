/**
 * @file packages/core/src/regulatory/jurisdiction.js
 * @description Quản lý thông tin vùng quyền tài phán (Jurisdiction): quốc gia, tỉnh/thành phố, quận/huyện.
 */

export const SUPPORTED_COUNTRIES = Object.freeze({
  JP: {
    code: 'JP',
    name: {
      vi: 'Nhật Bản',
      en: 'Japan',
      ja: '日本'
    },
    subdivisionType: 'prefecture', // 都道府県 (47 prefectures)
    currency: 'JPY',
    currencySymbol: '¥',
  },
  VN: {
    code: 'VN',
    name: {
      vi: 'Việt Nam',
      en: 'Vietnam',
      ja: 'ベトナム'
    },
    subdivisionType: 'province', // Tỉnh / Thành phố trực thuộc trung ương
    currency: 'VND',
    currencySymbol: '₫',
  }
});

/**
 * Tạo một cấu trúc Jurisdiction hợp lệ.
 * @param {Object} def
 * @param {'JP' | 'VN'} def.country
 * @param {string} [def.prefecture]
 * @param {string} [def.municipality]
 * @returns {Object}
 */
export function createJurisdiction({ country, prefecture = null, municipality = null }) {
  if (!country || !SUPPORTED_COUNTRIES[country]) {
    throw new Error(`Invalid country code for jurisdiction: "${country}". Supported: ${Object.keys(SUPPORTED_COUNTRIES).join(', ')}`);
  }
  return Object.freeze({
    country,
    prefecture: prefecture ? String(prefecture).toLowerCase() : null,
    municipality: municipality ? String(municipality).toLowerCase() : null,
  });
}

/**
 * Kiểm tra tính hợp lệ của jurisdiction object.
 * @param {Object} jurisdiction
 * @returns {boolean}
 */
export function isValidJurisdiction(jurisdiction) {
  if (!jurisdiction || typeof jurisdiction !== 'object') return false;
  return Boolean(jurisdiction.country && SUPPORTED_COUNTRIES[jurisdiction.country]);
}

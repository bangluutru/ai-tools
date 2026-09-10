/**
 * @file packages/core/src/regulatory/jurisdiction.js
 * @description Quản lý thông tin vùng quyền tài phán (Jurisdiction): quốc gia, tỉnh/thành phố, quận/huyện.
 * Hỗ trợ phân cấp mã định danh chuẩn ISO/JIS (ví dụ: 'JP', 'JP-40', 'JP-40-40130') và cơ chế
 * xác định trạng thái hỗ trợ địa phương (Locality Support Status) dùng chung cho JP, VN, v.v.
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
 * Các trạng thái hỗ trợ chính sách/thủ tục cấp địa phương
 */
export const LOCALITY_SUPPORT_STATUS = Object.freeze({
  SUPPORTED: 'supported',
  PARTIALLY_SUPPORTED: 'partially-supported',
  UNSUPPORTED: 'unsupported'
});

/**
 * Phân tích chuỗi mã định danh quyền tài phán (ví dụ: 'JP-40-40130' -> { country: 'JP', prefecture: '40', municipality: '40130' })
 * @param {string} code
 * @returns {{ country: string, prefecture: string|null, municipality: string|null, code: string }}
 */
export function parseJurisdictionCode(code) {
  if (!code || typeof code !== 'string') {
    return { country: 'JP', prefecture: null, municipality: null, code: 'JP' };
  }
  const parts = code.trim().toUpperCase().split('-');
  const country = parts[0] || 'JP';
  const prefecture = parts[1] || null;
  const municipality = parts[2] || null;

  return {
    country,
    prefecture: prefecture ? prefecture.toLowerCase() : null,
    municipality: municipality ? municipality.toLowerCase() : null,
    code: [country, prefecture, municipality].filter(Boolean).join('-')
  };
}

/**
 * Tạo một cấu trúc Jurisdiction hợp lệ.
 * @param {Object} def
 * @param {'JP' | 'VN'} [def.country]
 * @param {string} [def.prefecture]
 * @param {string} [def.municipality]
 * @param {string} [def.code]
 * @returns {Object}
 */
export function createJurisdiction({ country = 'JP', prefecture = null, municipality = null, code = null } = {}) {
  let targetCountry = country;
  let targetPref = prefecture;
  let targetMun = municipality;

  if (code) {
    const parsed = parseJurisdictionCode(code);
    targetCountry = parsed.country;
    targetPref = parsed.prefecture;
    targetMun = parsed.municipality;
  }

  if (!targetCountry || !SUPPORTED_COUNTRIES[targetCountry]) {
    throw new Error(`Invalid country code for jurisdiction: "${targetCountry}". Supported: ${Object.keys(SUPPORTED_COUNTRIES).join(', ')}`);
  }

  const prefNorm = targetPref ? String(targetPref).toLowerCase() : null;
  const munNorm = targetMun ? String(targetMun).toLowerCase() : null;

  const parts = [targetCountry];
  if (prefNorm) parts.push(prefNorm.toUpperCase());
  if (munNorm) parts.push(munNorm.toUpperCase());
  const canonicalCode = parts.join('-');

  return Object.freeze({
    country: targetCountry,
    prefecture: prefNorm,
    municipality: munNorm,
    code: canonicalCode,
  });
}

/**
 * Trả về chuỗi phân tầng quyền tài phán từ cấp chi tiết nhất đến cấp quốc gia
 * Ví dụ: 'JP-40-40130' -> ['JP-40-40130', 'JP-40', 'JP']
 * @param {string|Object} jurisdictionOrCode
 * @returns {string[]}
 */
export function getJurisdictionChain(jurisdictionOrCode) {
  const code = typeof jurisdictionOrCode === 'string'
    ? jurisdictionOrCode
    : jurisdictionOrCode?.code || 'JP';

  const parsed = parseJurisdictionCode(code);
  const chain = [];

  if (parsed.municipality && parsed.prefecture) {
    chain.push(`${parsed.country}-${parsed.prefecture.toUpperCase()}-${parsed.municipality.toUpperCase()}`);
  }
  if (parsed.prefecture) {
    chain.push(`${parsed.country}-${parsed.prefecture.toUpperCase()}`);
  }
  chain.push(parsed.country);

  return chain;
}

/**
 * Đánh giá trạng thái hỗ trợ địa phương từ danh bạ đô thị đã đăng ký
 * @param {string} jurisdictionCode
 * @param {Record<string, any>} [registeredLocalityMap]
 * @returns {{ status: 'supported' | 'partially-supported' | 'unsupported', matchedEntry: any|null }}
 */
export function resolveLocalityStatus(jurisdictionCode, registeredLocalityMap = {}) {
  if (!jurisdictionCode) {
    return { status: LOCALITY_SUPPORT_STATUS.UNSUPPORTED, matchedEntry: null };
  }

  const chain = getJurisdictionChain(jurisdictionCode);
  for (const code of chain) {
    if (registeredLocalityMap[code]) {
      const entry = registeredLocalityMap[code];
      return {
        status: entry.status || LOCALITY_SUPPORT_STATUS.SUPPORTED,
        matchedEntry: entry
      };
    }
  }

  return {
    status: LOCALITY_SUPPORT_STATUS.UNSUPPORTED,
    matchedEntry: null
  };
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

export const JAPAN_JURISDICTION = createJurisdiction({ country: 'JP' });
export const VIETNAM_JURISDICTION = createJurisdiction({ country: 'VN' });


/**
 * @file localityRegistry.js
 * Municipality data, J-LIS convenience store issuance availability, and fee schedules.
 * 
 * CORE RULE:
 * Never assume all 1,718 municipalities support identical kiosk services or charge 300 JPY.
 * Provide Tier 1 verified data for major municipalities, and graceful fallback for unverified ones.
 */

export const LOCALITY_TIERS = {
  TIER_1_VERIFIED: 'tier_1_verified',
  TIER_2_PARTIAL: 'tier_2_partial',
  TIER_3_UNVERIFIED: 'tier_3_unverified',
};

export const VERIFIED_MUNICIPALITIES = {
  '131041': {
    code: '131041',
    nameJa: '東京都新宿区',
    nameI18n: {
      ja: '東京都新宿区',
      vi: 'Quận Shinjuku, Tokyo',
      en: 'Shinjuku City, Tokyo',
    },
    prefectureJa: '東京都',
    tier: LOCALITY_TIERS.TIER_1_VERIFIED,
    convenienceStoreSupport: {
      residentRecord: true,
      sealRegistration: true,
      taxCertificate: true, // Current year inhabitant tax
      familyRegister: true, // Only if registered domicile is in Shinjuku
      familyRegisterTag: true,
    },
    fees: {
      residentRecord: { counter: 300, konbini: 200 }, // 100 JPY discount
      sealRegistration: { counter: 300, konbini: 200 },
      taxationCert: { counter: 300, konbini: 200 },
      taxPaymentCert: { counter: 300, konbini: 200 },
      familyRegisterFull: { counter: 450, konbini: 350 },
    },
    kioskHoursJa: '06:30〜23:00（年末年始・保守日除く）',
    officialUrl: 'https://www.city.shinjuku.lg.jp/',
  },

  '131131': {
    code: '131131',
    nameJa: '東京都渋谷区',
    nameI18n: {
      ja: '東京都渋谷区',
      vi: 'Quận Shibuya, Tokyo',
      en: 'Shibuya City, Tokyo',
    },
    prefectureJa: '東京都',
    tier: LOCALITY_TIERS.TIER_1_VERIFIED,
    convenienceStoreSupport: {
      residentRecord: true,
      sealRegistration: true,
      taxCertificate: true,
      familyRegister: true,
      familyRegisterTag: true,
    },
    fees: {
      residentRecord: { counter: 300, konbini: 100 }, // Generous 200 JPY discount
      sealRegistration: { counter: 300, konbini: 100 },
      taxationCert: { counter: 300, konbini: 100 },
      taxPaymentCert: { counter: 300, konbini: 100 },
      familyRegisterFull: { counter: 450, konbini: 350 },
    },
    kioskHoursJa: '06:30〜23:00（年末年始・保守日除く）',
    officialUrl: 'https://www.city.shibuya.tokyo.jp/',
  },

  '131032': {
    code: '131032',
    nameJa: '東京都港区',
    nameI18n: {
      ja: '東京都港区',
      vi: 'Quận Minato, Tokyo',
      en: 'Minato City, Tokyo',
    },
    prefectureJa: '東京都',
    tier: LOCALITY_TIERS.TIER_1_VERIFIED,
    convenienceStoreSupport: {
      residentRecord: true,
      sealRegistration: true,
      taxCertificate: true,
      familyRegister: true,
      familyRegisterTag: true,
    },
    fees: {
      residentRecord: { counter: 300, konbini: 200 },
      sealRegistration: { counter: 300, konbini: 200 },
      taxationCert: { counter: 300, konbini: 200 },
      taxPaymentCert: { counter: 300, konbini: 200 },
      familyRegisterFull: { counter: 450, konbini: 350 },
    },
    kioskHoursJa: '06:30〜23:00',
    officialUrl: 'https://www.city.minato.tokyo.jp/',
  },

  '131122': {
    code: '131122',
    nameJa: '東京都世田谷区',
    nameI18n: {
      ja: '東京都世田谷区',
      vi: 'Quận Setagaya, Tokyo',
      en: 'Setagaya City, Tokyo',
    },
    prefectureJa: '東京都',
    tier: LOCALITY_TIERS.TIER_1_VERIFIED,
    convenienceStoreSupport: {
      residentRecord: true,
      sealRegistration: true,
      taxCertificate: true,
      familyRegister: true,
      familyRegisterTag: true,
    },
    fees: {
      residentRecord: { counter: 300, konbini: 250 },
      sealRegistration: { counter: 300, konbini: 250 },
      taxationCert: { counter: 300, konbini: 250 },
      taxPaymentCert: { counter: 300, konbini: 250 },
      familyRegisterFull: { counter: 450, konbini: 350 },
    },
    kioskHoursJa: '06:30〜23:00',
    officialUrl: 'https://www.city.setagaya.lg.jp/',
  },

  '271004': {
    code: '271004',
    nameJa: '大阪府大阪市',
    nameI18n: {
      ja: '大阪府大阪市',
      vi: 'Thành phố Osaka, Phủ Osaka',
      en: 'Osaka City, Osaka',
    },
    prefectureJa: '大阪府',
    tier: LOCALITY_TIERS.TIER_1_VERIFIED,
    convenienceStoreSupport: {
      residentRecord: true,
      sealRegistration: true,
      taxCertificate: true,
      familyRegister: true,
      familyRegisterTag: true,
    },
    fees: {
      residentRecord: { counter: 300, konbini: 200 },
      sealRegistration: { counter: 300, konbini: 200 },
      taxationCert: { counter: 300, konbini: 200 },
      taxPaymentCert: { counter: 300, konbini: 200 },
      familyRegisterFull: { counter: 450, konbini: 350 },
    },
    kioskHoursJa: '06:30〜23:00（戸籍関連は平日09:00〜17:30等の制限あり）',
    specialNotesJa: '戸籍証明書のコンビニ交付は取扱時間が平日日中に限られる場合があります。',
    officialUrl: 'https://www.city.osaka.lg.jp/',
  },

  '231002': {
    code: '231002',
    nameJa: '愛知県名古屋市',
    nameI18n: {
      ja: '愛知県名古屋市',
      vi: 'Thành phố Nagoya, Tỉnh Aichi',
      en: 'Nagoya City, Aichi',
    },
    prefectureJa: '愛知県',
    tier: LOCALITY_TIERS.TIER_1_VERIFIED,
    convenienceStoreSupport: {
      residentRecord: true,
      sealRegistration: true,
      taxCertificate: true,
      familyRegister: true,
      familyRegisterTag: true,
    },
    fees: {
      residentRecord: { counter: 300, konbini: 200 },
      sealRegistration: { counter: 300, konbini: 200 },
      taxationCert: { counter: 300, konbini: 200 },
      taxPaymentCert: { counter: 300, konbini: 200 },
      familyRegisterFull: { counter: 450, konbini: 350 },
    },
    kioskHoursJa: '06:30〜23:00',
    officialUrl: 'https://www.city.nagoya.jp/',
  },

  '141003': {
    code: '141003',
    nameJa: '神奈川県横浜市',
    nameI18n: {
      ja: '神奈川県横浜市',
      vi: 'Thành phố Yokohama, Tỉnh Kanagawa',
      en: 'Yokohama City, Kanagawa',
    },
    prefectureJa: '神奈川県',
    tier: LOCALITY_TIERS.TIER_1_VERIFIED,
    convenienceStoreSupport: {
      residentRecord: true,
      sealRegistration: true,
      taxCertificate: true,
      familyRegister: true,
      familyRegisterTag: true,
    },
    fees: {
      residentRecord: { counter: 300, konbini: 250 },
      sealRegistration: { counter: 300, konbini: 250 },
      taxationCert: { counter: 300, konbini: 250 },
      taxPaymentCert: { counter: 300, konbini: 250 },
      familyRegisterFull: { counter: 450, konbini: 350 },
    },
    kioskHoursJa: '06:30〜23:00',
    officialUrl: 'https://www.city.yokohama.lg.jp/',
  },

  '401307': {
    code: '401307',
    nameJa: '福岡県福岡市',
    nameI18n: {
      ja: '福岡県福岡市',
      vi: 'Thành phố Fukuoka, Tỉnh Fukuoka',
      en: 'Fukuoka City, Fukuoka',
    },
    prefectureJa: '福岡県',
    tier: LOCALITY_TIERS.TIER_1_VERIFIED,
    convenienceStoreSupport: {
      residentRecord: true,
      sealRegistration: true,
      taxCertificate: true,
      familyRegister: true,
      familyRegisterTag: true,
    },
    fees: {
      residentRecord: { counter: 300, konbini: 200 },
      sealRegistration: { counter: 300, konbini: 200 },
      taxationCert: { counter: 300, konbini: 200 },
      taxPaymentCert: { counter: 300, konbini: 200 },
      familyRegisterFull: { counter: 450, konbini: 350 },
    },
    kioskHoursJa: '06:30〜23:00',
    officialUrl: 'https://www.city.fukuoka.lg.jp/',
  },
};

/**
 * National standard baseline for fallback when a municipality is not yet in Tier 1.
 */
export const NATIONAL_STANDARD_BASELINE = {
  tier: LOCALITY_TIERS.TIER_3_UNVERIFIED,
  isFallback: true,
  standardKioskHoursJa: '06:30〜23:00（J-LIS全国標準時間・自治体ごとに休止や時間短縮あり）',
  standardFees: {
    residentRecord: { counter: 300, konbini: 300 },
    sealRegistration: { counter: 300, konbini: 300 },
    taxationCert: { counter: 300, konbini: 300 },
    taxPaymentCert: { counter: 300, konbini: 300 },
    familyRegisterFull: { counter: 450, konbini: 450 },
  },
  unverifiedAdvisoryI18n: {
    ja: '【全国標準情報】指定の市区町村の個別対応状況はToolioで未確認です。コンビニ交付の対象書類や割引手数料は自治体により異なりますので、公式ウェブサイトまたは担当窓口でご確認ください。',
    vi: '【Thông tin chuẩn toàn quốc】Hệ thống Toolio chưa lưu trữ dữ liệu xác thực riêng cho địa phương này. Dịch vụ in tại combini và biểu phí có thể khác nhau tùy chính quyền sở tại, vui lòng kiểm tra trực tiếp tại Tòa thị chính.',
    en: '【National Standard Information】Specific local details for this municipality have not been verified in Toolio yet. Available documents and convenience-store fees vary by municipality; please confirm with your local municipal desk.',
  },
};

/**
 * Resolve locality information by code or search query.
 * @param {string} query - Municipality code (e.g. '131041') or keyword (e.g. 'Shinjuku', '新宿区', 'Osaka')
 * @returns {object} Locality profile
 */
export function resolveLocality(query) {
  if (!query) {
    return { ...NATIONAL_STANDARD_BASELINE, queriedLocalityName: null };
  }

  const normalized = String(query).trim().toLowerCase();

  // 1. Direct code lookup
  if (VERIFIED_MUNICIPALITIES[normalized]) {
    return {
      ...VERIFIED_MUNICIPALITIES[normalized],
      isFallback: false,
    };
  }

  // 2. Search by Japanese, Vietnamese, or English name
  const found = Object.values(VERIFIED_MUNICIPALITIES).find((m) => {
    return (
      m.nameJa.toLowerCase().includes(normalized) ||
      m.nameI18n.vi.toLowerCase().includes(normalized) ||
      m.nameI18n.en.toLowerCase().includes(normalized)
    );
  });

  if (found) {
    return {
      ...found,
      isFallback: false,
    };
  }

  // 3. Fallback for unverified municipality (NEVER SAY "SERVICE UNAVAILABLE")
  return {
    ...NATIONAL_STANDARD_BASELINE,
    queriedLocalityName: query,
    isFallback: true,
  };
}

/**
 * Get all verified municipalities for dropdown menus.
 */
export function getVerifiedMunicipalitiesList() {
  return Object.values(VERIFIED_MUNICIPALITIES);
}

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

// Dữ liệu từng địa phương được đối chiếu trang chính thức của thành phố/quận (verifiedAt = ngày kiểm tra).
// null = chưa xác nhận được trên trang chính thức → UI phải hiển thị "cần xác nhận với cơ quan".
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
    tier: LOCALITY_TIERS.TIER_2_PARTIAL,
    convenienceStoreSupport: {
      residentRecord: true,
      sealRegistration: true,
      taxCertificate: true, // 特別区民税・都民税・森林環境税課税証明書
      familyRegister: null, // chưa xác nhận trên trang コンビニ交付 của quận
      familyRegisterTag: null,
    },
    fees: {
      residentRecord: { counter: 300, konbini: 200 },
      sealRegistration: { counter: 300, konbini: 200 },
      taxationCert: { counter: 300, konbini: 200 },
      taxPaymentCert: { counter: 300, konbini: null },
      familyRegisterFull: { counter: 450, konbini: null },
    },
    kioskHoursJa: '06:30〜23:00（年末年始・保守日除く）',
    officialUrl: 'https://www.city.shinjuku.lg.jp/todokede/koseki01_002005.html',
    sourceUrls: ['https://www.city.shinjuku.lg.jp/todokede/koseki01_002005.html'],
    verifiedAt: '2026-09-27',
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
    // Quận Shibuya giảm phí コンビニ交付 xuống 1通10円 (từ 2024-04-01, không nêu ngày kết thúc).
    fees: {
      residentRecord: { counter: 300, konbini: 10 },
      sealRegistration: { counter: 300, konbini: 10 },
      taxationCert: { counter: 300, konbini: 10 },
      taxPaymentCert: { counter: 300, konbini: 10 },
      familyRegisterFull: { counter: 450, konbini: 10 },
    },
    kioskHoursJa: '06:30〜23:00（戸籍証明書は平日09:00〜17:00、年末年始・保守日除く）',
    officialUrl: 'https://www.city.shibuya.tokyo.jp/kurashi/shomei/jidokofu/con_shomei.html',
    sourceUrls: [
      'https://www.city.shibuya.tokyo.jp/kurashi/shomei/jidokofu/con_shomei.html',
      'https://www.city.shibuya.tokyo.jp/kurashi/shomei/jidokofu/page_00067.html',
      'https://www.city.shibuya.tokyo.jp/kusei/hodo/hodo-2024/hodo_20240401.html',
    ],
    verifiedAt: '2026-09-27',
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
      taxCertificate: false, // không có trong danh sách コンビニ交付 của quận
      familyRegister: true, // chỉ khi 本籍 ở Minato
      familyRegisterTag: true,
    },
    fees: {
      residentRecord: { counter: 300, konbini: 10 },
      sealRegistration: { counter: 300, konbini: 10 },
      taxationCert: { counter: null, konbini: null },
      taxPaymentCert: { counter: null, konbini: null },
      familyRegisterFull: { counter: 450, konbini: 10 },
    },
    kioskHoursJa: '06:30〜23:00（戸籍関連は時間が異なる場合あり）',
    officialUrl: 'https://www.city.minato.tokyo.jp/shibamadochou/kurashi/todokede/tesuryo.html',
    sourceUrls: ['https://www.city.minato.tokyo.jp/shibamadochou/kurashi/todokede/tesuryo.html'],
    verifiedAt: '2026-09-27',
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
      familyRegisterTag: null,
    },
    fees: {
      residentRecord: { counter: 300, konbini: 200 },
      sealRegistration: { counter: 300, konbini: 200 },
      taxationCert: { counter: 300, konbini: 200 },
      taxPaymentCert: { counter: 300, konbini: 200 },
      familyRegisterFull: { counter: 450, konbini: 350 },
    },
    kioskHoursJa: '06:30〜23:00（戸籍証明書は09:00〜17:00、第3土曜・日祝・保守日除く）',
    specialNotesJa: '区の窓口で手数料が無料となる場合でも、コンビニ交付は有料です。',
    officialUrl: 'https://www.city.setagaya.lg.jp/02233/149.html',
    sourceUrls: ['https://www.city.setagaya.lg.jp/02233/149.html'],
    verifiedAt: '2026-09-27',
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
      familyRegisterTag: null,
    },
    fees: {
      residentRecord: { counter: 300, konbini: 200 },
      sealRegistration: { counter: 300, konbini: 200 },
      taxationCert: { counter: 300, konbini: 200 },
      taxPaymentCert: { counter: 300, konbini: 200 },
      familyRegisterFull: { counter: 450, konbini: 450 },
    },
    kioskHoursJa: '06:30〜23:00（年末年始12/29〜1/3・保守日除く）',
    officialUrl: 'https://www.city.osaka.lg.jp/shimin/page/0000284183.html',
    sourceUrls: [
      'https://www.city.osaka.lg.jp/shimin/page/0000284183.html',
      'https://www.city.osaka.lg.jp/shimin/page/0000370128.html',
    ],
    verifiedAt: '2026-09-27',
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
    // Nagoya CHƯA có コンビニ交付 cho tới ngày 2026-12-16 (thứ Tư).
    konbiniStartsOn: '2026-12-16',
    convenienceStoreSupport: {
      residentRecord: true,
      sealRegistration: true,
      taxCertificate: true, // 所得証明書
      familyRegister: true,
      familyRegisterTag: true,
    },
    fees: {
      residentRecord: { counter: 300, konbini: 200 },
      sealRegistration: { counter: 300, konbini: 200 },
      taxationCert: { counter: 400, konbini: 200 },
      taxPaymentCert: { counter: null, konbini: null },
      familyRegisterFull: { counter: 450, konbini: 350 },
    },
    kioskHoursJa: '（2026-12-16開始）06:30〜23:00（戸籍・戸籍の附票は08:30〜19:00）',
    specialNotesJa: 'コンビニ交付は令和8年12月16日開始。それまでは区役所・支所・サービスセンター窓口または郵送で請求してください。',
    officialUrl: 'https://www.city.nagoya.jp/kurashi/todokede/1007851/1052691/1053055.html',
    sourceUrls: ['https://www.city.nagoya.jp/kurashi/todokede/1007851/1052691/1053055.html'],
    verifiedAt: '2026-09-27',
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
      taxCertificate: false, // 「コンビニ交付では税証明の発行を行っておりません」
      familyRegister: true,
      familyRegisterTag: true,
    },
    fees: {
      residentRecord: { counter: 300, konbini: 250 },
      sealRegistration: { counter: 300, konbini: 250 },
      taxationCert: { counter: 300, konbini: null },
      taxPaymentCert: { counter: 300, konbini: null },
      familyRegisterFull: { counter: 450, konbini: 450 },
    },
    kioskHoursJa: '住民票・印鑑 06:30〜23:00／戸籍・戸籍の附票 09:00〜17:00（祝日・年末年始12/29〜1/3・保守日除く）',
    officialUrl: 'https://www.city.yokohama.lg.jp/kurashi/koseki-zei-hoken/todokede/koseki-juminhyo/oshirase/koufu.html',
    sourceUrls: ['https://www.city.yokohama.lg.jp/kurashi/koseki-zei-hoken/todokede/koseki-juminhyo/oshirase/koufu.html'],
    verifiedAt: '2026-09-27',
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
      taxCertificate: true, // 税証明コンビニ交付（別ページ）
      familyRegister: true, // chỉ khi 本籍 ở Fukuoka-shi
      familyRegisterTag: true,
    },
    fees: {
      residentRecord: { counter: null, konbini: 250 },
      sealRegistration: { counter: null, konbini: 250 },
      taxationCert: { counter: 300, konbini: 250 },
      taxPaymentCert: { counter: null, konbini: null },
      familyRegisterFull: { counter: 450, konbini: 400 },
    },
    kioskHoursJa: '住民票・印鑑 06:30〜23:00／戸籍・戸籍の附票 平日09:00〜17:00（年末年始・保守日除く）',
    officialUrl: 'https://www.city.fukuoka.lg.jp/shimin/kusei/life/convinikoufu.html',
    sourceUrls: [
      'https://www.city.fukuoka.lg.jp/shimin/kusei/life/convinikoufu.html',
      'https://www.city.fukuoka.lg.jp/zaisei/shido/life/zeiconvinikoufu.html',
    ],
    verifiedAt: '2026-09-27',
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
  if (!normalized) {
    return { ...NATIONAL_STANDARD_BASELINE, queriedLocalityName: null };
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
 * Địa phương đã bắt đầu cung cấp コンビニ交付 vào ngày tham chiếu chưa (ví dụ Nagoya bắt đầu 2026-12-16).
 * @param {object} locality
 * @param {Date|string} [referenceDate=new Date()]
 */
export function isKonbiniServiceActive(locality, referenceDate = new Date()) {
  if (!locality?.konbiniStartsOn) return true;
  const d = referenceDate instanceof Date ? referenceDate : new Date(referenceDate);
  const pad = (n) => String(n).padStart(2, '0');
  const key = Number.isNaN(d.getTime())
    ? String(referenceDate).slice(0, 10)
    : `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  return key >= locality.konbiniStartsOn;
}

/**
 * Get all verified municipalities for dropdown menus.
 */
export function getVerifiedMunicipalitiesList() {
  return Object.values(VERIFIED_MUNICIPALITIES);
}

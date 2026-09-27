/**
 * @file packages/core/src/japan/insurance/rules/kyokaiKenpoRates.js
 * @description Biểu tỷ lệ bảo hiểm y tế 協会けんぽ (全国健康保険協会) theo 47 tỉnh thành Nhật Bản.
 * Tỷ lệ bảo hiểm được quy định theo từng chi nhánh tỉnh (支部), áp dụng từ phí tháng 3 (3月分, thu từ lương tháng 4).
 * - rate2025 = 令和7年度 (2025年3月分〜2026年2月分)
 * - rate2026 = 令和8年度 (2026年3月分〜): https://www.kyoukaikenpo.or.jp/about/business/insurance_rate/rate_prefectures/r08/index.html
 * Nguồn: 全国健康保険協会 (kyoukaikenpo-rates-2026)
 */

import { defineRuleMetadata } from '../../../regulatory/ruleMetadata.js';
import { JAPAN_JURISDICTION } from '../../../regulatory/jurisdiction.js';
import { createApplicablePeriod } from '../../../regulatory/effectivePeriod.js';

export const KYOKAI_KENPO_METADATA_2026 = defineRuleMetadata({
  id: 'jp-kyokai-kenpo-rates-2026',
  jurisdiction: JAPAN_JURISDICTION,
  sourceId: 'kyoukaikenpo-rates-2026',
  effectiveFrom: '2026-03-01',
  effectiveTo: '2027-02-28',
  applicablePeriod: createApplicablePeriod('fiscal-year', 2026, 2026),
  version: '2026.1',
  lastVerifiedAt: '2026-09-10',
  status: 'verified',
  notes: 'Tỷ lệ BHYT 47 tỉnh thành 令和8年度 (từ phí tháng 3/2026; Tokyo 9.85%), chia đôi 50/50 giữa người lao động và chủ sử dụng.',
});

/**
 * Danh sách 47 tỉnh thành Nhật Bản và tỷ lệ BHYT 協会けんぽ
 */
export const PREFECTURE_KENPO_DATA = Object.freeze({
  hokkaido: { code: 'hokkaido', name_ja: '北海道', name_vi: 'Hokkaido', name_en: 'Hokkaido', rate2026: 0.1028, rate2025: 0.1031 },
  aomori: { code: 'aomori', name_ja: '青森県', name_vi: 'Aomori', name_en: 'Aomori', rate2026: 0.0985, rate2025: 0.0985 },
  iwate: { code: 'iwate', name_ja: '岩手県', name_vi: 'Iwate', name_en: 'Iwate', rate2026: 0.0951, rate2025: 0.0962 },
  miyagi: { code: 'miyagi', name_ja: '宮城県', name_vi: 'Miyagi', name_en: 'Miyagi', rate2026: 0.1010, rate2025: 0.1011 },
  akita: { code: 'akita', name_ja: '秋田県', name_vi: 'Akita', name_en: 'Akita', rate2026: 0.1001, rate2025: 0.1001 },
  yamagata: { code: 'yamagata', name_ja: '山形県', name_vi: 'Yamagata', name_en: 'Yamagata', rate2026: 0.0975, rate2025: 0.0975 },
  fukushima: { code: 'fukushima', name_ja: '福島県', name_vi: 'Fukushima', name_en: 'Fukushima', rate2026: 0.0950, rate2025: 0.0962 },
  ibaraki: { code: 'ibaraki', name_ja: '茨城県', name_vi: 'Ibaraki', name_en: 'Ibaraki', rate2026: 0.0952, rate2025: 0.0967 },
  tochigi: { code: 'tochigi', name_ja: '栃木県', name_vi: 'Tochigi', name_en: 'Tochigi', rate2026: 0.0982, rate2025: 0.0982 },
  gunma: { code: 'gunma', name_ja: '群馬県', name_vi: 'Gunma', name_en: 'Gunma', rate2026: 0.0968, rate2025: 0.0977 },
  saitama: { code: 'saitama', name_ja: '埼玉県', name_vi: 'Saitama', name_en: 'Saitama', rate2026: 0.0967, rate2025: 0.0976 },
  chiba: { code: 'chiba', name_ja: '千葉県', name_vi: 'Chiba', name_en: 'Chiba', rate2026: 0.0973, rate2025: 0.0979 },
  tokyo: { code: 'tokyo', name_ja: '東京都', name_vi: 'Tokyo', name_en: 'Tokyo', rate2026: 0.0985, rate2025: 0.0991 },
  kanagawa: { code: 'kanagawa', name_ja: '神奈川県', name_vi: 'Kanagawa', name_en: 'Kanagawa', rate2026: 0.0992, rate2025: 0.0992 },
  niigata: { code: 'niigata', name_ja: '新潟県', name_vi: 'Niigata', name_en: 'Niigata', rate2026: 0.0921, rate2025: 0.0955 },
  toyama: { code: 'toyama', name_ja: '富山県', name_vi: 'Toyama', name_en: 'Toyama', rate2026: 0.0959, rate2025: 0.0965 },
  ishikawa: { code: 'ishikawa', name_ja: '石川県', name_vi: 'Ishikawa', name_en: 'Ishikawa', rate2026: 0.0970, rate2025: 0.0988 },
  fukui: { code: 'fukui', name_ja: '福井県', name_vi: 'Fukui', name_en: 'Fukui', rate2026: 0.0971, rate2025: 0.0994 },
  yamanashi: { code: 'yamanashi', name_ja: '山梨県', name_vi: 'Yamanashi', name_en: 'Yamanashi', rate2026: 0.0955, rate2025: 0.0989 },
  nagano: { code: 'nagano', name_ja: '長野県', name_vi: 'Nagano', name_en: 'Nagano', rate2026: 0.0963, rate2025: 0.0969 },
  gifu: { code: 'gifu', name_ja: '岐阜県', name_vi: 'Gifu', name_en: 'Gifu', rate2026: 0.0980, rate2025: 0.0993 },
  shizuoka: { code: 'shizuoka', name_ja: '静岡県', name_vi: 'Shizuoka', name_en: 'Shizuoka', rate2026: 0.0961, rate2025: 0.0980 },
  aichi: { code: 'aichi', name_ja: '愛知県', name_vi: 'Aichi', name_en: 'Aichi', rate2026: 0.0993, rate2025: 0.1003 },
  mie: { code: 'mie', name_ja: '三重県', name_vi: 'Mie', name_en: 'Mie', rate2026: 0.0977, rate2025: 0.0999 },
  shiga: { code: 'shiga', name_ja: '滋賀県', name_vi: 'Shiga', name_en: 'Shiga', rate2026: 0.0988, rate2025: 0.0997 },
  kyoto: { code: 'kyoto', name_ja: '京都府', name_vi: 'Kyoto', name_en: 'Kyoto', rate2026: 0.0989, rate2025: 0.1003 },
  osaka: { code: 'osaka', name_ja: '大阪府', name_vi: 'Osaka', name_en: 'Osaka', rate2026: 0.1013, rate2025: 0.1024 },
  hyogo: { code: 'hyogo', name_ja: '兵庫県', name_vi: 'Hyogo', name_en: 'Hyogo', rate2026: 0.1012, rate2025: 0.1016 },
  nara: { code: 'nara', name_ja: '奈良県', name_vi: 'Nara', name_en: 'Nara', rate2026: 0.0991, rate2025: 0.1002 },
  wakayama: { code: 'wakayama', name_ja: '和歌山県', name_vi: 'Wakayama', name_en: 'Wakayama', rate2026: 0.1006, rate2025: 0.1019 },
  tottori: { code: 'tottori', name_ja: '鳥取県', name_vi: 'Tottori', name_en: 'Tottori', rate2026: 0.0986, rate2025: 0.0993 },
  shimane: { code: 'shimane', name_ja: '島根県', name_vi: 'Shimane', name_en: 'Shimane', rate2026: 0.0994, rate2025: 0.0994 },
  okayama: { code: 'okayama', name_ja: '岡山県', name_vi: 'Okayama', name_en: 'Okayama', rate2026: 0.1005, rate2025: 0.1017 },
  hiroshima: { code: 'hiroshima', name_ja: '広島県', name_vi: 'Hiroshima', name_en: 'Hiroshima', rate2026: 0.0978, rate2025: 0.0997 },
  yamaguchi: { code: 'yamaguchi', name_ja: '山口県', name_vi: 'Yamaguchi', name_en: 'Yamaguchi', rate2026: 0.1015, rate2025: 0.1036 },
  tokushima: { code: 'tokushima', name_ja: '徳島県', name_vi: 'Tokushima', name_en: 'Tokushima', rate2026: 0.1024, rate2025: 0.1047 },
  kagawa: { code: 'kagawa', name_ja: '香川県', name_vi: 'Kagawa', name_en: 'Kagawa', rate2026: 0.1002, rate2025: 0.1021 },
  ehime: { code: 'ehime', name_ja: '愛媛県', name_vi: 'Ehime', name_en: 'Ehime', rate2026: 0.0998, rate2025: 0.1018 },
  kochi: { code: 'kochi', name_ja: '高知県', name_vi: 'Kochi', name_en: 'Kochi', rate2026: 0.1005, rate2025: 0.1013 },
  fukuoka: { code: 'fukuoka', name_ja: '福岡県', name_vi: 'Fukuoka', name_en: 'Fukuoka', rate2026: 0.1011, rate2025: 0.1031 },
  saga: { code: 'saga', name_ja: '佐賀県', name_vi: 'Saga', name_en: 'Saga', rate2026: 0.1055, rate2025: 0.1078 },
  nagasaki: { code: 'nagasaki', name_ja: '長崎県', name_vi: 'Nagasaki', name_en: 'Nagasaki', rate2026: 0.1006, rate2025: 0.1041 },
  kumamoto: { code: 'kumamoto', name_ja: '熊本県', name_vi: 'Kumamoto', name_en: 'Kumamoto', rate2026: 0.1008, rate2025: 0.1012 },
  oita: { code: 'oita', name_ja: '大分県', name_vi: 'Oita', name_en: 'Oita', rate2026: 0.1008, rate2025: 0.1025 },
  miyazaki: { code: 'miyazaki', name_ja: '宮崎県', name_vi: 'Miyazaki', name_en: 'Miyazaki', rate2026: 0.0977, rate2025: 0.1009 },
  kagoshima: { code: 'kagoshima', name_ja: '鹿児島県', name_vi: 'Kagoshima', name_en: 'Kagoshima', rate2026: 0.1013, rate2025: 0.1031 },
  okinawa: { code: 'okinawa', name_ja: '沖縄県', name_vi: 'Okinawa', name_en: 'Okinawa', rate2026: 0.0944, rate2025: 0.0944 },
});

export const PREFECTURE_LIST = Object.freeze(Object.values(PREFECTURE_KENPO_DATA));

/** Tháng phí (月分) bắt đầu áp dụng tỷ lệ mới */
export const KENPO_RATE_PERIODS = Object.freeze({
  r7From: '2025-03',
  r8From: '2026-03',
  unverifiedFrom: '2027-03',
});

/**
 * Tra cứu tỷ lệ BHYT 協会けんぽ cho tỉnh thành và tháng phí áp dụng (保険料の対象月 / 月分)
 * @param {string} prefectureKey
 * @param {string} [applicableDate='2026-04-01'] - YYYY-MM-DD hoặc YYYY-MM (tháng phí)
 * @returns {{ totalRate: number, employeeRate: number, employerRate: number, isVerifiedPeriod: boolean, periodNotice: string|null, metadata: object }}
 */
export function resolveKenpoRate(prefectureKey = 'tokyo', applicableDate = '2026-04-01') {
  const normalizedKey = String(prefectureKey || 'tokyo').toLowerCase().trim();
  const pref = PREFECTURE_KENPO_DATA[normalizedKey] || PREFECTURE_KENPO_DATA.tokyo;

  const month = applicableDate ? String(applicableDate).substring(0, 7) : '2026-04';

  let rate = pref.rate2026;
  let isVerifiedPeriod = true;
  let periodNotice = null;

  if (month >= KENPO_RATE_PERIODS.unverifiedFrom) {
    // Tỷ lệ 令和9年度 (từ phí tháng 3/2027) chưa công bố
    isVerifiedPeriod = false;
    periodNotice = 'Kyokai Kenpo rates from March 2027 premiums (令和9年度) are not yet published. Using the 令和8年度 rate with an unverified flag.';
    rate = pref.rate2026;
  } else if (month < KENPO_RATE_PERIODS.r8From) {
    rate = pref.rate2025;
    if (month < KENPO_RATE_PERIODS.r7From) {
      isVerifiedPeriod = false;
      periodNotice = 'Rates before March 2025 premiums (令和6年度) are not stored. Using the 令和7年度 rate with an unverified flag.';
    }
  }

  return {
    prefecture: pref,
    totalRate: rate,
    employeeRate: rate / 2,
    employerRate: rate / 2,
    isVerifiedPeriod,
    periodNotice,
    metadata: KYOKAI_KENPO_METADATA_2026,
  };
}

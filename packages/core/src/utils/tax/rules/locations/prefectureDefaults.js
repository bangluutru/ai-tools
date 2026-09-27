/**
 * @file packages/core/src/utils/tax/rules/locations/prefectureDefaults.js
 * @description Quy chuẩn thuế cư trú (住民税) và bảo hiểm y tế 協会けんぽ theo 47 tỉnh thành Nhật Bản.
 *
 * 均等割: 標準 4,000円 (道府県民税1,000円 + 市町村民税3,000円) + 森林環境税 1,000円 (tách riêng ở forestryTax).
 * perCapitaSurcharge = 超過課税 của tỉnh (森林・水源環境税 v.v.) đã mô hình hoá — ghi theo tên thuế trong comment,
 * chưa đối chiếu từng tỉnh với nguồn chính thức; không mô hình hoá 超過課税 cấp thành phố (vd. 横浜みどり税).
 */

import { PREFECTURE_KENPO_DATA } from '../../../../japan/insurance/rules/kyokaiKenpoRates.js';

export const DefaultLocation = {
  code: 'standard',
  name_ja: '全国標準 / 未選択',
  name_vi: 'Chuẩn Toàn Quốc',
  name_en: 'National Standard',
  region: 'Standard',
  residentTax: {
    incomeLevyRate: 0.10, // 所得割 10% (Tỉnh 4% + Xã/Phường 6%)
    prefectureRate: 0.04,
    municipalRate: 0.06,
    perCapitaFlat: 4000,   // 均等割 標準 4,000円 (道府県民税1,000円 + 市町村民税3,000円)
    perCapitaSurcharge: 0,
    forestryTax: 1000,     // 森林環境税 1,000円 (Áp dụng toàn quốc từ 2024)
    nonTaxableSingleLimit: 450000, // Tiêu chuẩn miễn thuế cư trú người độc thân chuẩn: 45万円
  },
  socialInsurance: {
    kenpoRate: PREFECTURE_KENPO_DATA.tokyo.rate2025, // Không chọn tỉnh: dùng Tokyo làm chuẩn
    kenpoRate2025: PREFECTURE_KENPO_DATA.tokyo.rate2025,
    kenpoRate2026: PREFECTURE_KENPO_DATA.tokyo.rate2026,
    careInsuranceRate: 0.0159, // 介護保険 (40-64 tuổi) 令和7年度 1.59% (令和8年度 1.62%)
    pensionRate: 0.183,    // Hưu trí 厚生年金 18.3% (chia đôi)
    employmentRate: 0.0055, // 雇用保険 phần nhân viên 令和7年度 5.5/1000 (令和8年度 5/1000)
    nationalPensionMonthly: 17510, // 国民年金 令和7年度 (17,510円/tháng)
  },
};

const COMMON_RESIDENT = {
  incomeLevyRate: 0.10,
  prefectureRate: 0.04,
  municipalRate: 0.06,
  forestryTax: 1000,
  nonTaxableSingleLimit: 450000,
};

const COMMON_SOCIAL = {
  careInsuranceRate: 0.0159, // 令和7年度 1.59% (令和8年度 1.62% — xem rules/2026)
  pensionRate: 0.183,
  employmentRate: 0.0055, // 令和7年度 一般の事業 5.5/1000 (令和8年度 5/1000)
  nationalPensionMonthly: 17510,
};

/**
 * Tỷ lệ 協会けんぽ lấy trực tiếp từ bảng của miền bảo hiểm (một nguồn dữ liệu duy nhất).
 * kenpoRate = 令和7年度 (tương thích cũ); kenpoRate2025/2026 dùng theo tháng phí.
 */
function socialFor(code) {
  const kenpo = PREFECTURE_KENPO_DATA[code] || PREFECTURE_KENPO_DATA.tokyo;
  return {
    ...COMMON_SOCIAL,
    kenpoRate: kenpo.rate2025,
    kenpoRate2025: kenpo.rate2025,
    kenpoRate2026: kenpo.rate2026,
  };
}

export const PrefectureLocations = {
  // 01. Hokkaido
  hokkaido: {
    code: 'hokkaido',
    name_ja: '北海道',
    name_vi: 'Hokkaido',
    name_en: 'Hokkaido',
    region: 'Hokkaido',
    residentTax: { ...COMMON_RESIDENT, perCapitaFlat: 4000, perCapitaSurcharge: 0 },
    socialInsurance: socialFor('hokkaido'),
  },

  // Tohoku (02 - 07)
  aomori: {
    code: 'aomori',
    name_ja: '青森県',
    name_vi: 'Aomori',
    name_en: 'Aomori',
    region: 'Tohoku',
    residentTax: { ...COMMON_RESIDENT, perCapitaFlat: 4000, perCapitaSurcharge: 0 },
    socialInsurance: socialFor('aomori'),
  },
  iwate: {
    code: 'iwate',
    name_ja: '岩手県',
    name_vi: 'Iwate',
    name_en: 'Iwate',
    region: 'Tohoku',
    residentTax: { ...COMMON_RESIDENT, perCapitaFlat: 5000, perCapitaSurcharge: 1000 }, // いわての森林づくり県民税 1,000円
    socialInsurance: socialFor('iwate'),
  },
  miyagi: {
    code: 'miyagi',
    name_ja: '宮城県',
    name_vi: 'Miyagi',
    name_en: 'Miyagi',
    region: 'Tohoku',
    residentTax: { ...COMMON_RESIDENT, perCapitaFlat: 5200, perCapitaSurcharge: 1200 }, // みやぎ発展税 + 水と緑の森林づくり税 1,200円
    socialInsurance: socialFor('miyagi'),
  },
  akita: {
    code: 'akita',
    name_ja: '秋田県',
    name_vi: 'Akita',
    name_en: 'Akita',
    region: 'Tohoku',
    residentTax: { ...COMMON_RESIDENT, perCapitaFlat: 4800, perCapitaSurcharge: 800 }, // あきた水と緑の森林整備税 800円
    socialInsurance: socialFor('akita'),
  },
  yamagata: {
    code: 'yamagata',
    name_ja: '山形県',
    name_vi: 'Yamagata',
    name_en: 'Yamagata',
    region: 'Tohoku',
    residentTax: { ...COMMON_RESIDENT, perCapitaFlat: 5000, perCapitaSurcharge: 1000 }, // やまがた緑環境税 1,000円
    socialInsurance: socialFor('yamagata'),
  },
  fukushima: {
    code: 'fukushima',
    name_ja: '福島県',
    name_vi: 'Fukushima',
    name_en: 'Fukushima',
    region: 'Tohoku',
    residentTax: { ...COMMON_RESIDENT, perCapitaFlat: 5000, perCapitaSurcharge: 1000 }, // 福島県森林環境税 1,000円
    socialInsurance: socialFor('fukushima'),
  },

  // Kanto (08 - 14)
  ibaraki: {
    code: 'ibaraki',
    name_ja: '茨城県',
    name_vi: 'Ibaraki',
    name_en: 'Ibaraki',
    region: 'Kanto',
    residentTax: { ...COMMON_RESIDENT, perCapitaFlat: 5000, perCapitaSurcharge: 1000 }, // いばらき森林名水環境税 1,000円
    socialInsurance: socialFor('ibaraki'),
  },
  tochigi: {
    code: 'tochigi',
    name_ja: '栃木県',
    name_vi: 'Tochigi',
    name_en: 'Tochigi',
    region: 'Kanto',
    residentTax: { ...COMMON_RESIDENT, perCapitaFlat: 4700, perCapitaSurcharge: 700 }, // とちぎの元気な森づくり県民税 700円
    socialInsurance: socialFor('tochigi'),
  },
  gunma: {
    code: 'gunma',
    name_ja: '群馬県',
    name_vi: 'Gunma',
    name_en: 'Gunma',
    region: 'Kanto',
    residentTax: { ...COMMON_RESIDENT, perCapitaFlat: 4700, perCapitaSurcharge: 700 }, // ぐんま緑の県民税 700円
    socialInsurance: socialFor('gunma'),
  },
  saitama: {
    code: 'saitama',
    name_ja: '埼玉県',
    name_vi: 'Saitama',
    name_en: 'Saitama',
    region: 'Kanto',
    residentTax: { ...COMMON_RESIDENT, perCapitaFlat: 4000, perCapitaSurcharge: 0 },
    socialInsurance: socialFor('saitama'),
  },
  chiba: {
    code: 'chiba',
    name_ja: '千葉県',
    name_vi: 'Chiba',
    name_en: 'Chiba',
    region: 'Kanto',
    residentTax: { ...COMMON_RESIDENT, perCapitaFlat: 4000, perCapitaSurcharge: 0 },
    socialInsurance: socialFor('chiba'),
  },
  tokyo: {
    code: 'tokyo',
    name_ja: '東京都',
    name_vi: 'Tokyo',
    name_en: 'Tokyo',
    region: 'Kanto',
    residentTax: { ...COMMON_RESIDENT, perCapitaFlat: 4000, perCapitaSurcharge: 0 },
    socialInsurance: socialFor('tokyo'),
  },
  kanagawa: {
    code: 'kanagawa',
    name_ja: '神奈川県',
    name_vi: 'Kanagawa',
    name_en: 'Kanagawa',
    region: 'Kanto',
    residentTax: {
      incomeLevyRate: 0.10025, // 神奈川県 có thuế bảo vệ nguồn nước +0.025%
      prefectureRate: 0.04025,
      municipalRate: 0.06,
      perCapitaFlat: 4300, perCapitaSurcharge: 300,     // 神奈川県水源環境保全税 300円
      forestryTax: 1000,
      nonTaxableSingleLimit: 450000,
    },
    socialInsurance: socialFor('kanagawa'),
  },

  // Chubu (15 - 23)
  niigata: {
    code: 'niigata',
    name_ja: '新潟県',
    name_vi: 'Niigata',
    name_en: 'Niigata',
    region: 'Chubu',
    residentTax: { ...COMMON_RESIDENT, perCapitaFlat: 4000, perCapitaSurcharge: 0 },
    socialInsurance: socialFor('niigata'),
  },
  toyama: {
    code: 'toyama',
    name_ja: '富山県',
    name_vi: 'Toyama',
    name_en: 'Toyama',
    region: 'Chubu',
    residentTax: { ...COMMON_RESIDENT, perCapitaFlat: 4500, perCapitaSurcharge: 500 }, // 水と緑の森づくり税 500円
    socialInsurance: socialFor('toyama'),
  },
  ishikawa: {
    code: 'ishikawa',
    name_ja: '石川県',
    name_vi: 'Ishikawa',
    name_en: 'Ishikawa',
    region: 'Chubu',
    residentTax: { ...COMMON_RESIDENT, perCapitaFlat: 4500, perCapitaSurcharge: 500 }, // いしかわ森林環境税 500円
    socialInsurance: socialFor('ishikawa'),
  },
  fukui: {
    code: 'fukui',
    name_ja: '福井県',
    name_vi: 'Fukui',
    name_en: 'Fukui',
    region: 'Chubu',
    residentTax: { ...COMMON_RESIDENT, perCapitaFlat: 4500, perCapitaSurcharge: 500 }, // ふくいの森と水環境税 500円
    socialInsurance: socialFor('fukui'),
  },
  yamanashi: {
    code: 'yamanashi',
    name_ja: '山梨県',
    name_vi: 'Yamanashi',
    name_en: 'Yamanashi',
    region: 'Chubu',
    residentTax: { ...COMMON_RESIDENT, perCapitaFlat: 4500, perCapitaSurcharge: 500 }, // 森林環境税 500円
    socialInsurance: socialFor('yamanashi'),
  },
  nagano: {
    code: 'nagano',
    name_ja: '長野県',
    name_vi: 'Nagano',
    name_en: 'Nagano',
    region: 'Chubu',
    residentTax: { ...COMMON_RESIDENT, perCapitaFlat: 4500, perCapitaSurcharge: 500 }, // 長野県森林づくり県民税 500円
    socialInsurance: socialFor('nagano'),
  },
  gifu: {
    code: 'gifu',
    name_ja: '岐阜県',
    name_vi: 'Gifu',
    name_en: 'Gifu',
    region: 'Chubu',
    residentTax: { ...COMMON_RESIDENT, perCapitaFlat: 5000, perCapitaSurcharge: 1000 }, // 清流の国ぎふ森林環境税 1,000円
    socialInsurance: socialFor('gifu'),
  },
  shizuoka: {
    code: 'shizuoka',
    name_ja: '静岡県',
    name_vi: 'Shizuoka',
    name_en: 'Shizuoka',
    region: 'Chubu',
    residentTax: { ...COMMON_RESIDENT, perCapitaFlat: 4400, perCapitaSurcharge: 400 }, // 森林づくり県民税 400円
    socialInsurance: socialFor('shizuoka'),
  },
  aichi: {
    code: 'aichi',
    name_ja: '愛知県',
    name_vi: 'Aichi',
    name_en: 'Aichi',
    region: 'Chubu',
    residentTax: { ...COMMON_RESIDENT, perCapitaFlat: 4500, perCapitaSurcharge: 500 }, // あいち森と緑づくり税 500円
    socialInsurance: socialFor('aichi'),
  },

  // Kansai (24 - 30)
  mie: {
    code: 'mie',
    name_ja: '三重県',
    name_vi: 'Mie',
    name_en: 'Mie',
    region: 'Kansai',
    residentTax: { ...COMMON_RESIDENT, perCapitaFlat: 5000, perCapitaSurcharge: 1000 }, // みえの森づくり県民税 1,000円
    socialInsurance: socialFor('mie'),
  },
  shiga: {
    code: 'shiga',
    name_ja: '滋賀県',
    name_vi: 'Shiga',
    name_en: 'Shiga',
    region: 'Kansai',
    residentTax: { ...COMMON_RESIDENT, perCapitaFlat: 4800, perCapitaSurcharge: 800 }, // 琵琶湖森林づくり県民税 800円
    socialInsurance: socialFor('shiga'),
  },
  kyoto: {
    code: 'kyoto',
    name_ja: '京都府',
    name_vi: 'Kyoto',
    name_en: 'Kyoto',
    region: 'Kansai',
    residentTax: { ...COMMON_RESIDENT, perCapitaFlat: 4600, perCapitaSurcharge: 600 }, // 豊かな森を育てる府民税 600円
    socialInsurance: socialFor('kyoto'),
  },
  osaka: {
    code: 'osaka',
    name_ja: '大阪府',
    name_vi: 'Osaka',
    name_en: 'Osaka',
    region: 'Kansai',
    residentTax: { ...COMMON_RESIDENT, perCapitaFlat: 4300, perCapitaSurcharge: 300 }, // 森林環境税 300円
    socialInsurance: socialFor('osaka'),
  },
  hyogo: {
    code: 'hyogo',
    name_ja: '兵庫県',
    name_vi: 'Hyogo',
    name_en: 'Hyogo',
    region: 'Kansai',
    residentTax: { ...COMMON_RESIDENT, perCapitaFlat: 4800, perCapitaSurcharge: 800 }, // 県民緑税 800円
    socialInsurance: socialFor('hyogo'),
  },
  nara: {
    code: 'nara',
    name_ja: '奈良県',
    name_vi: 'Nara',
    name_en: 'Nara',
    region: 'Kansai',
    residentTax: { ...COMMON_RESIDENT, perCapitaFlat: 4500, perCapitaSurcharge: 500 }, // 奈良県森林環境税 500円
    socialInsurance: socialFor('nara'),
  },
  wakayama: {
    code: 'wakayama',
    name_ja: '和歌山県',
    name_vi: 'Wakayama',
    name_en: 'Wakayama',
    region: 'Kansai',
    residentTax: { ...COMMON_RESIDENT, perCapitaFlat: 4500, perCapitaSurcharge: 500 }, // 紀の国森づくり税 500円
    socialInsurance: socialFor('wakayama'),
  },

  // Chugoku (31 - 35)
  tottori: {
    code: 'tottori',
    name_ja: '鳥取県',
    name_vi: 'Tottori',
    name_en: 'Tottori',
    region: 'Chugoku',
    residentTax: { ...COMMON_RESIDENT, perCapitaFlat: 4500, perCapitaSurcharge: 500 }, // 鳥取県豊かな森づくり税 500円
    socialInsurance: socialFor('tottori'),
  },
  shimane: {
    code: 'shimane',
    name_ja: '島根県',
    name_vi: 'Shimane',
    name_en: 'Shimane',
    region: 'Chugoku',
    residentTax: { ...COMMON_RESIDENT, perCapitaFlat: 4500, perCapitaSurcharge: 500 }, // 水と緑の森づくり税 500円
    socialInsurance: socialFor('shimane'),
  },
  okayama: {
    code: 'okayama',
    name_ja: '岡山県',
    name_vi: 'Okayama',
    name_en: 'Okayama',
    region: 'Chugoku',
    residentTax: { ...COMMON_RESIDENT, perCapitaFlat: 4500, perCapitaSurcharge: 500 }, // おかやま森づくり県民税 500円
    socialInsurance: socialFor('okayama'),
  },
  hiroshima: {
    code: 'hiroshima',
    name_ja: '広島県',
    name_vi: 'Hiroshima',
    name_en: 'Hiroshima',
    region: 'Chugoku',
    residentTax: { ...COMMON_RESIDENT, perCapitaFlat: 4500, perCapitaSurcharge: 500 }, // ひろしまの森づくり県民税 500円
    socialInsurance: socialFor('hiroshima'),
  },
  yamaguchi: {
    code: 'yamaguchi',
    name_ja: '山口県',
    name_vi: 'Yamaguchi',
    name_en: 'Yamaguchi',
    region: 'Chugoku',
    residentTax: { ...COMMON_RESIDENT, perCapitaFlat: 4500, perCapitaSurcharge: 500 }, // やまぐち森林づくり県民税 500円
    socialInsurance: socialFor('yamaguchi'),
  },

  // Shikoku (36 - 39)
  tokushima: {
    code: 'tokushima',
    name_ja: '徳島県',
    name_vi: 'Tokushima',
    name_en: 'Tokushima',
    region: 'Shikoku',
    residentTax: { ...COMMON_RESIDENT, perCapitaFlat: 4000, perCapitaSurcharge: 0 },
    socialInsurance: socialFor('tokushima'),
  },
  kagawa: {
    code: 'kagawa',
    name_ja: '香川県',
    name_vi: 'Kagawa',
    name_en: 'Kagawa',
    region: 'Shikoku',
    residentTax: { ...COMMON_RESIDENT, perCapitaFlat: 4000, perCapitaSurcharge: 0 },
    socialInsurance: socialFor('kagawa'),
  },
  ehime: {
    code: 'ehime',
    name_ja: '愛媛県',
    name_vi: 'Ehime',
    name_en: 'Ehime',
    region: 'Shikoku',
    residentTax: { ...COMMON_RESIDENT, perCapitaFlat: 4700, perCapitaSurcharge: 700 }, // えひめ森林基金 700円
    socialInsurance: socialFor('ehime'),
  },
  kochi: {
    code: 'kochi',
    name_ja: '高知県',
    name_vi: 'Kochi',
    name_en: 'Kochi',
    region: 'Shikoku',
    residentTax: { ...COMMON_RESIDENT, perCapitaFlat: 4500, perCapitaSurcharge: 500 }, // こうち森林環境税 500円
    socialInsurance: socialFor('kochi'),
  },

  // Kyushu & Okinawa (40 - 47)
  fukuoka: {
    code: 'fukuoka',
    name_ja: '福岡県',
    name_vi: 'Fukuoka',
    name_en: 'Fukuoka',
    region: 'Kyushu',
    residentTax: { ...COMMON_RESIDENT, perCapitaFlat: 4500, perCapitaSurcharge: 500 }, // 福岡県森林環境税 500円
    socialInsurance: socialFor('fukuoka'),
  },
  saga: {
    code: 'saga',
    name_ja: '佐賀県',
    name_vi: 'Saga',
    name_en: 'Saga',
    region: 'Kyushu',
    residentTax: { ...COMMON_RESIDENT, perCapitaFlat: 4500, perCapitaSurcharge: 500 }, // さがの森づくり税 500円
    socialInsurance: socialFor('saga'),
  },
  nagasaki: {
    code: 'nagasaki',
    name_ja: '長崎県',
    name_vi: 'Nagasaki',
    name_en: 'Nagasaki',
    region: 'Kyushu',
    residentTax: { ...COMMON_RESIDENT, perCapitaFlat: 4500, perCapitaSurcharge: 500 }, // ながさきの森環境税 500円
    socialInsurance: socialFor('nagasaki'),
  },
  kumamoto: {
    code: 'kumamoto',
    name_ja: '熊本県',
    name_vi: 'Kumamoto',
    name_en: 'Kumamoto',
    region: 'Kyushu',
    residentTax: { ...COMMON_RESIDENT, perCapitaFlat: 4500, perCapitaSurcharge: 500 }, // 熊本県水とみどりの森づくり税 500円
    socialInsurance: socialFor('kumamoto'),
  },
  oita: {
    code: 'oita',
    name_ja: '大分県',
    name_vi: 'Oita',
    name_en: 'Oita',
    region: 'Kyushu',
    residentTax: { ...COMMON_RESIDENT, perCapitaFlat: 4500, perCapitaSurcharge: 500 }, // おおいた森林環境税 500円
    socialInsurance: socialFor('oita'),
  },
  miyazaki: {
    code: 'miyazaki',
    name_ja: '宮崎県',
    name_vi: 'Miyazaki',
    name_en: 'Miyazaki',
    region: 'Kyushu',
    residentTax: { ...COMMON_RESIDENT, perCapitaFlat: 4500, perCapitaSurcharge: 500 }, // 森林環境税 500円
    socialInsurance: socialFor('miyazaki'),
  },
  kagoshima: {
    code: 'kagoshima',
    name_ja: '鹿児島県',
    name_vi: 'Kagoshima',
    name_en: 'Kagoshima',
    region: 'Kyushu',
    residentTax: { ...COMMON_RESIDENT, perCapitaFlat: 4500, perCapitaSurcharge: 500 }, // 鹿児島県森林環境税 500円
    socialInsurance: socialFor('kagoshima'),
  },
  okinawa: {
    code: 'okinawa',
    name_ja: '沖縄県',
    name_vi: 'Okinawa',
    name_en: 'Okinawa',
    region: 'Okinawa',
    residentTax: { ...COMMON_RESIDENT, perCapitaFlat: 4000, perCapitaSurcharge: 0 },
    socialInsurance: socialFor('okinawa'),
  },
};

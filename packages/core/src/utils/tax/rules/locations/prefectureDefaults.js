/**
 * @file packages/core/src/utils/tax/rules/locations/prefectureDefaults.js
 * @description Quy chuẩn thuế cư trú (住民税) và bảo hiểm y tế 協会けんぽ theo 47 tỉnh thành Nhật Bản.
 */

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
    perCapitaFlat: 5000,   // 均等割 5,000円
    forestryTax: 1000,     // 森林環境税 1,000円 (Áp dụng toàn quốc từ 2024)
    nonTaxableSingleLimit: 450000, // Tiêu chuẩn miễn thuế cư trú người độc thân chuẩn: 45万円
  },
  socialInsurance: {
    kenpoRate: 0.1000,     // Tỷ lệ BHYT 協会けんぽ trung bình ~10% (chia đôi)
    careInsuranceRate: 0.0160, // BHYT chăm sóc người già 介護保険 (40-64 tuổi) 1.60%
    pensionRate: 0.183,    // Hưu trí 厚生年金 18.3% (chia đôi)
    employmentRate: 0.006, // Bảo hiểm thất nghiệp 雇用保険 phần nhân viên 0.6%
    nationalPensionMonthly: 17510, // 国民年金 (17,510円/tháng)
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
  careInsuranceRate: 0.0160,
  pensionRate: 0.183,
  employmentRate: 0.006,
  nationalPensionMonthly: 17510,
};

export const PrefectureLocations = {
  // 01. Hokkaido
  hokkaido: {
    code: 'hokkaido',
    name_ja: '北海道',
    name_vi: 'Hokkaido',
    name_en: 'Hokkaido',
    region: 'Hokkaido',
    residentTax: { ...COMMON_RESIDENT, perCapitaFlat: 5000 },
    socialInsurance: { ...COMMON_SOCIAL, kenpoRate: 0.1028 },
  },

  // Tohoku (02 - 07)
  aomori: {
    code: 'aomori',
    name_ja: '青森県',
    name_vi: 'Aomori',
    name_en: 'Aomori',
    region: 'Tohoku',
    residentTax: { ...COMMON_RESIDENT, perCapitaFlat: 5000 },
    socialInsurance: { ...COMMON_SOCIAL, kenpoRate: 0.1002 },
  },
  iwate: {
    code: 'iwate',
    name_ja: '岩手県',
    name_vi: 'Iwate',
    name_en: 'Iwate',
    region: 'Tohoku',
    residentTax: { ...COMMON_RESIDENT, perCapitaFlat: 6000 }, // いわての森林づくり県民税 1,000円
    socialInsurance: { ...COMMON_SOCIAL, kenpoRate: 0.0968 },
  },
  miyagi: {
    code: 'miyagi',
    name_ja: '宮城県',
    name_vi: 'Miyagi',
    name_en: 'Miyagi',
    region: 'Tohoku',
    residentTax: { ...COMMON_RESIDENT, perCapitaFlat: 6200 }, // みやぎ発展税 + 水と緑の森林づくり税 1,200円
    socialInsurance: { ...COMMON_SOCIAL, kenpoRate: 0.1012 },
  },
  akita: {
    code: 'akita',
    name_ja: '秋田県',
    name_vi: 'Akita',
    name_en: 'Akita',
    region: 'Tohoku',
    residentTax: { ...COMMON_RESIDENT, perCapitaFlat: 5800 }, // あきた水と緑の森林整備税 800円
    socialInsurance: { ...COMMON_SOCIAL, kenpoRate: 0.1003 },
  },
  yamagata: {
    code: 'yamagata',
    name_ja: '山形県',
    name_vi: 'Yamagata',
    name_en: 'Yamagata',
    region: 'Tohoku',
    residentTax: { ...COMMON_RESIDENT, perCapitaFlat: 6000 }, // やまがた緑環境税 1,000円
    socialInsurance: { ...COMMON_SOCIAL, kenpoRate: 0.0994 },
  },
  fukushima: {
    code: 'fukushima',
    name_ja: '福島県',
    name_vi: 'Fukushima',
    name_en: 'Fukushima',
    region: 'Tohoku',
    residentTax: { ...COMMON_RESIDENT, perCapitaFlat: 6000 }, // 福島県森林環境税 1,000円
    socialInsurance: { ...COMMON_SOCIAL, kenpoRate: 0.0987 },
  },

  // Kanto (08 - 14)
  ibaraki: {
    code: 'ibaraki',
    name_ja: '茨城県',
    name_vi: 'Ibaraki',
    name_en: 'Ibaraki',
    region: 'Kanto',
    residentTax: { ...COMMON_RESIDENT, perCapitaFlat: 6000 }, // いばらき森林名水環境税 1,000円
    socialInsurance: { ...COMMON_SOCIAL, kenpoRate: 0.0981 },
  },
  tochigi: {
    code: 'tochigi',
    name_ja: '栃木県',
    name_vi: 'Tochigi',
    name_en: 'Tochigi',
    region: 'Kanto',
    residentTax: { ...COMMON_RESIDENT, perCapitaFlat: 5700 }, // とちぎの元気な森づくり県民税 700円
    socialInsurance: { ...COMMON_SOCIAL, kenpoRate: 0.0977 },
  },
  gunma: {
    code: 'gunma',
    name_ja: '群馬県',
    name_vi: 'Gunma',
    name_en: 'Gunma',
    region: 'Kanto',
    residentTax: { ...COMMON_RESIDENT, perCapitaFlat: 5700 }, // ぐんま緑の県民税 700円
    socialInsurance: { ...COMMON_SOCIAL, kenpoRate: 0.0973 },
  },
  saitama: {
    code: 'saitama',
    name_ja: '埼玉県',
    name_vi: 'Saitama',
    name_en: 'Saitama',
    region: 'Kanto',
    residentTax: { ...COMMON_RESIDENT, perCapitaFlat: 5000 },
    socialInsurance: { ...COMMON_SOCIAL, kenpoRate: 0.0988 },
  },
  chiba: {
    code: 'chiba',
    name_ja: '千葉県',
    name_vi: 'Chiba',
    name_en: 'Chiba',
    region: 'Kanto',
    residentTax: { ...COMMON_RESIDENT, perCapitaFlat: 5000 },
    socialInsurance: { ...COMMON_SOCIAL, kenpoRate: 0.0991 },
  },
  tokyo: {
    code: 'tokyo',
    name_ja: '東京都',
    name_vi: 'Tokyo',
    name_en: 'Tokyo',
    region: 'Kanto',
    residentTax: { ...COMMON_RESIDENT, perCapitaFlat: 5000 },
    socialInsurance: { ...COMMON_SOCIAL, kenpoRate: 0.0998 },
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
      perCapitaFlat: 5300,     // 神奈川県水源環境保全税 300円
      forestryTax: 1000,
      nonTaxableSingleLimit: 450000,
    },
    socialInsurance: { ...COMMON_SOCIAL, kenpoRate: 0.1002 },
  },

  // Chubu (15 - 23)
  niigata: {
    code: 'niigata',
    name_ja: '新潟県',
    name_vi: 'Niigata',
    name_en: 'Niigata',
    region: 'Chubu',
    residentTax: { ...COMMON_RESIDENT, perCapitaFlat: 5000 },
    socialInsurance: { ...COMMON_SOCIAL, kenpoRate: 0.0957 },
  },
  toyama: {
    code: 'toyama',
    name_ja: '富山県',
    name_vi: 'Toyama',
    name_en: 'Toyama',
    region: 'Chubu',
    residentTax: { ...COMMON_RESIDENT, perCapitaFlat: 5500 }, // 水と緑の森づくり税 500円
    socialInsurance: { ...COMMON_SOCIAL, kenpoRate: 0.0963 },
  },
  ishikawa: {
    code: 'ishikawa',
    name_ja: '石川県',
    name_vi: 'Ishikawa',
    name_en: 'Ishikawa',
    region: 'Chubu',
    residentTax: { ...COMMON_RESIDENT, perCapitaFlat: 5500 }, // いしかわ森林環境税 500円
    socialInsurance: { ...COMMON_SOCIAL, kenpoRate: 0.1008 },
  },
  fukui: {
    code: 'fukui',
    name_ja: '福井県',
    name_vi: 'Fukui',
    name_en: 'Fukui',
    region: 'Chubu',
    residentTax: { ...COMMON_RESIDENT, perCapitaFlat: 5500 }, // ふくいの森と水環境税 500円
    socialInsurance: { ...COMMON_SOCIAL, kenpoRate: 0.1000 },
  },
  yamanashi: {
    code: 'yamanashi',
    name_ja: '山梨県',
    name_vi: 'Yamanashi',
    name_en: 'Yamanashi',
    region: 'Chubu',
    residentTax: { ...COMMON_RESIDENT, perCapitaFlat: 5500 }, // 森林環境税 500円
    socialInsurance: { ...COMMON_SOCIAL, kenpoRate: 0.0993 },
  },
  nagano: {
    code: 'nagano',
    name_ja: '長野県',
    name_vi: 'Nagano',
    name_en: 'Nagano',
    region: 'Chubu',
    residentTax: { ...COMMON_RESIDENT, perCapitaFlat: 5500 }, // 長野県森林づくり県民税 500円
    socialInsurance: { ...COMMON_SOCIAL, kenpoRate: 0.0972 },
  },
  gifu: {
    code: 'gifu',
    name_ja: '岐阜県',
    name_vi: 'Gifu',
    name_en: 'Gifu',
    region: 'Chubu',
    residentTax: { ...COMMON_RESIDENT, perCapitaFlat: 6000 }, // 清流の国ぎふ森林環境税 1,000円
    socialInsurance: { ...COMMON_SOCIAL, kenpoRate: 0.0991 },
  },
  shizuoka: {
    code: 'shizuoka',
    name_ja: '静岡県',
    name_vi: 'Shizuoka',
    name_en: 'Shizuoka',
    region: 'Chubu',
    residentTax: { ...COMMON_RESIDENT, perCapitaFlat: 5400 }, // 森林づくり県民税 400円
    socialInsurance: { ...COMMON_SOCIAL, kenpoRate: 0.0984 },
  },
  aichi: {
    code: 'aichi',
    name_ja: '愛知県',
    name_vi: 'Aichi',
    name_en: 'Aichi',
    region: 'Chubu',
    residentTax: { ...COMMON_RESIDENT, perCapitaFlat: 5500 }, // あいち森と緑づくり税 500円
    socialInsurance: { ...COMMON_SOCIAL, kenpoRate: 0.0997 },
  },

  // Kansai (24 - 30)
  mie: {
    code: 'mie',
    name_ja: '三重県',
    name_vi: 'Mie',
    name_en: 'Mie',
    region: 'Kansai',
    residentTax: { ...COMMON_RESIDENT, perCapitaFlat: 6000 }, // みえの森づくり県民税 1,000円
    socialInsurance: { ...COMMON_SOCIAL, kenpoRate: 0.0994 },
  },
  shiga: {
    code: 'shiga',
    name_ja: '滋賀県',
    name_vi: 'Shiga',
    name_en: 'Shiga',
    region: 'Kansai',
    residentTax: { ...COMMON_RESIDENT, perCapitaFlat: 5800 }, // 琵琶湖森林づくり県民税 800円
    socialInsurance: { ...COMMON_SOCIAL, kenpoRate: 0.0992 },
  },
  kyoto: {
    code: 'kyoto',
    name_ja: '京都府',
    name_vi: 'Kyoto',
    name_en: 'Kyoto',
    region: 'Kansai',
    residentTax: { ...COMMON_RESIDENT, perCapitaFlat: 5600 }, // 豊かな森を育てる府民税 600円
    socialInsurance: { ...COMMON_SOCIAL, kenpoRate: 0.1008 },
  },
  osaka: {
    code: 'osaka',
    name_ja: '大阪府',
    name_vi: 'Osaka',
    name_en: 'Osaka',
    region: 'Kansai',
    residentTax: { ...COMMON_RESIDENT, perCapitaFlat: 5300 }, // 森林環境税 300円
    socialInsurance: { ...COMMON_SOCIAL, kenpoRate: 0.1034 },
  },
  hyogo: {
    code: 'hyogo',
    name_ja: '兵庫県',
    name_vi: 'Hyogo',
    name_en: 'Hyogo',
    region: 'Kansai',
    residentTax: { ...COMMON_RESIDENT, perCapitaFlat: 5800 }, // 県民緑税 800円
    socialInsurance: { ...COMMON_SOCIAL, kenpoRate: 0.1018 },
  },
  nara: {
    code: 'nara',
    name_ja: '奈良県',
    name_vi: 'Nara',
    name_en: 'Nara',
    region: 'Kansai',
    residentTax: { ...COMMON_RESIDENT, perCapitaFlat: 5500 }, // 奈良県森林環境税 500円
    socialInsurance: { ...COMMON_SOCIAL, kenpoRate: 0.1015 },
  },
  wakayama: {
    code: 'wakayama',
    name_ja: '和歌山県',
    name_vi: 'Wakayama',
    name_en: 'Wakayama',
    region: 'Kansai',
    residentTax: { ...COMMON_RESIDENT, perCapitaFlat: 5500 }, // 紀の国森づくり税 500円
    socialInsurance: { ...COMMON_SOCIAL, kenpoRate: 0.1015 },
  },

  // Chugoku (31 - 35)
  tottori: {
    code: 'tottori',
    name_ja: '鳥取県',
    name_vi: 'Tottori',
    name_en: 'Tottori',
    region: 'Chugoku',
    residentTax: { ...COMMON_RESIDENT, perCapitaFlat: 5500 }, // 鳥取県豊かな森づくり税 500円
    socialInsurance: { ...COMMON_SOCIAL, kenpoRate: 0.1001 },
  },
  shimane: {
    code: 'shimane',
    name_ja: '島根県',
    name_vi: 'Shimane',
    name_en: 'Shimane',
    region: 'Chugoku',
    residentTax: { ...COMMON_RESIDENT, perCapitaFlat: 5500 }, // 水と緑の森づくり税 500円
    socialInsurance: { ...COMMON_SOCIAL, kenpoRate: 0.1019 },
  },
  okayama: {
    code: 'okayama',
    name_ja: '岡山県',
    name_vi: 'Okayama',
    name_en: 'Okayama',
    region: 'Chugoku',
    residentTax: { ...COMMON_RESIDENT, perCapitaFlat: 5500 }, // おかやま森づくり県民税 500円
    socialInsurance: { ...COMMON_SOCIAL, kenpoRate: 0.1018 },
  },
  hiroshima: {
    code: 'hiroshima',
    name_ja: '広島県',
    name_vi: 'Hiroshima',
    name_en: 'Hiroshima',
    region: 'Chugoku',
    residentTax: { ...COMMON_RESIDENT, perCapitaFlat: 5500 }, // ひろしまの森づくり県民税 500円
    socialInsurance: { ...COMMON_SOCIAL, kenpoRate: 0.1015 },
  },
  yamaguchi: {
    code: 'yamaguchi',
    name_ja: '山口県',
    name_vi: 'Yamaguchi',
    name_en: 'Yamaguchi',
    region: 'Chugoku',
    residentTax: { ...COMMON_RESIDENT, perCapitaFlat: 5500 }, // やまぐち森林づくり県民税 500円
    socialInsurance: { ...COMMON_SOCIAL, kenpoRate: 0.1023 },
  },

  // Shikoku (36 - 39)
  tokushima: {
    code: 'tokushima',
    name_ja: '徳島県',
    name_vi: 'Tokushima',
    name_en: 'Tokushima',
    region: 'Shikoku',
    residentTax: { ...COMMON_RESIDENT, perCapitaFlat: 5000 },
    socialInsurance: { ...COMMON_SOCIAL, kenpoRate: 0.1034 },
  },
  kagawa: {
    code: 'kagawa',
    name_ja: '香川県',
    name_vi: 'Kagawa',
    name_en: 'Kagawa',
    region: 'Shikoku',
    residentTax: { ...COMMON_RESIDENT, perCapitaFlat: 5000 },
    socialInsurance: { ...COMMON_SOCIAL, kenpoRate: 0.1024 },
  },
  ehime: {
    code: 'ehime',
    name_ja: '愛媛県',
    name_vi: 'Ehime',
    name_en: 'Ehime',
    region: 'Shikoku',
    residentTax: { ...COMMON_RESIDENT, perCapitaFlat: 5700 }, // えひめ森林基金 700円
    socialInsurance: { ...COMMON_SOCIAL, kenpoRate: 0.1019 },
  },
  kochi: {
    code: 'kochi',
    name_ja: '高知県',
    name_vi: 'Kochi',
    name_en: 'Kochi',
    region: 'Shikoku',
    residentTax: { ...COMMON_RESIDENT, perCapitaFlat: 5500 }, // こうち森林環境税 500円
    socialInsurance: { ...COMMON_SOCIAL, kenpoRate: 0.1032 },
  },

  // Kyushu & Okinawa (40 - 47)
  fukuoka: {
    code: 'fukuoka',
    name_ja: '福岡県',
    name_vi: 'Fukuoka',
    name_en: 'Fukuoka',
    region: 'Kyushu',
    residentTax: { ...COMMON_RESIDENT, perCapitaFlat: 5500 }, // 福岡県森林環境税 500円
    socialInsurance: { ...COMMON_SOCIAL, kenpoRate: 0.1011 },
  },
  saga: {
    code: 'saga',
    name_ja: '佐賀県',
    name_vi: 'Saga',
    name_en: 'Saga',
    region: 'Kyushu',
    residentTax: { ...COMMON_RESIDENT, perCapitaFlat: 5500 }, // さがの森づくり税 500円
    socialInsurance: { ...COMMON_SOCIAL, kenpoRate: 0.1051 },
  },
  nagasaki: {
    code: 'nagasaki',
    name_ja: '長崎県',
    name_vi: 'Nagasaki',
    name_en: 'Nagasaki',
    region: 'Kyushu',
    residentTax: { ...COMMON_RESIDENT, perCapitaFlat: 5500 }, // ながさきの森環境税 500円
    socialInsurance: { ...COMMON_SOCIAL, kenpoRate: 0.1023 },
  },
  kumamoto: {
    code: 'kumamoto',
    name_ja: '熊本県',
    name_vi: 'Kumamoto',
    name_en: 'Kumamoto',
    region: 'Kyushu',
    residentTax: { ...COMMON_RESIDENT, perCapitaFlat: 5500 }, // 熊本県水とみどりの森づくり税 500円
    socialInsurance: { ...COMMON_SOCIAL, kenpoRate: 0.1024 },
  },
  oita: {
    code: 'oita',
    name_ja: '大分県',
    name_vi: 'Oita',
    name_en: 'Oita',
    region: 'Kyushu',
    residentTax: { ...COMMON_RESIDENT, perCapitaFlat: 5500 }, // おおいた森林環境税 500円
    socialInsurance: { ...COMMON_SOCIAL, kenpoRate: 0.1020 },
  },
  miyazaki: {
    code: 'miyazaki',
    name_ja: '宮崎県',
    name_vi: 'Miyazaki',
    name_en: 'Miyazaki',
    region: 'Kyushu',
    residentTax: { ...COMMON_RESIDENT, perCapitaFlat: 5500 }, // 森林環境税 500円
    socialInsurance: { ...COMMON_SOCIAL, kenpoRate: 0.1010 },
  },
  kagoshima: {
    code: 'kagoshima',
    name_ja: '鹿児島県',
    name_vi: 'Kagoshima',
    name_en: 'Kagoshima',
    region: 'Kyushu',
    residentTax: { ...COMMON_RESIDENT, perCapitaFlat: 5500 }, // 鹿児島県森林環境税 500円
    socialInsurance: { ...COMMON_SOCIAL, kenpoRate: 0.1025 },
  },
  okinawa: {
    code: 'okinawa',
    name_ja: '沖縄県',
    name_vi: 'Okinawa',
    name_en: 'Okinawa',
    region: 'Okinawa',
    residentTax: { ...COMMON_RESIDENT, perCapitaFlat: 5000 },
    socialInsurance: { ...COMMON_SOCIAL, kenpoRate: 0.1001 },
  },
};

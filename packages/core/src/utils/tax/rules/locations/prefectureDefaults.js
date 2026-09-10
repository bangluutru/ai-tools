/**
 * @file packages/core/src/utils/tax/rules/locations/prefectureDefaults.js
 * @description Quy chuẩn thuế cư trú (住民税) và bảo hiểm y tế 協会けんぽ theo 47 tỉnh thành Nhật Bản.
 */

export const DefaultLocation = {
  code: 'standard',
  name_ja: '全国標準 / 未選択',
  name_vi: 'Chuẩn Toàn Quốc (Mặc định)',
  name_en: 'National Standard (Default)',
  region: 'Standard',
  residentTax: {
    incomeLevyRate: 0.10, // 所得割 10% (Tỉnh 4% + Xã/Phường 6%)
    prefectureRate: 0.04,
    municipalRate: 0.06,
    perCapitaFlat: 5000,   // 均等割 5,000円
    forestryTax: 1000,     // 森林環境税 1,000円 (Thu từ năm 2024/Reiwa 6)
    nonTaxableSingleLimit: 450000, // Tiêu chuẩn miễn thuế cư trú người độc thân chuẩn 1級地: 45万円
  },
  socialInsurance: {
    kenpoRate: 0.10,       // Tỷ lệ BHYT 協会けんぽ ~10% (chia đôi với chủ sử dụng)
    careInsuranceRate: 0.0160, // BHYT chăm sóc người già 介護保険 (40-64 tuổi) ~1.60%
    pensionRate: 0.183,    // Hưu trí 厚生年金 18.3% (chia đôi)
    employmentRate: 0.006, // Bảo hiểm thất nghiệp 雇用保険 phần nhân viên 0.6%
    nationalPensionMonthly: 17510, // 国民年金 (khoảng 17,510円/tháng)
  },
};

export const PrefectureLocations = {
  tokyo: {
    code: 'tokyo',
    name_ja: '東京都',
    name_vi: 'Tokyo (東京都)',
    name_en: 'Tokyo',
    region: 'Kanto',
    residentTax: {
      incomeLevyRate: 0.10,
      prefectureRate: 0.04,
      municipalRate: 0.06,
      perCapitaFlat: 5000,
      forestryTax: 1000,
      nonTaxableSingleLimit: 450000,
    },
    socialInsurance: {
      kenpoRate: 0.0998, // Tokyo Kyokai Kenpo ~9.98%
      careInsuranceRate: 0.0160,
      pensionRate: 0.183,
      employmentRate: 0.006,
      nationalPensionMonthly: 17510,
    },
  },
  osaka: {
    code: 'osaka',
    name_ja: '大阪府',
    name_vi: 'Osaka (大阪府)',
    name_en: 'Osaka',
    region: 'Kansai',
    residentTax: {
      incomeLevyRate: 0.10,
      prefectureRate: 0.04,
      municipalRate: 0.06,
      perCapitaFlat: 5300, // 大阪府 có thêm thuế rừng địa phương 300円
      forestryTax: 1000,
      nonTaxableSingleLimit: 450000,
    },
    socialInsurance: {
      kenpoRate: 0.1034, // Osaka Kyokai Kenpo ~10.34%
      careInsuranceRate: 0.0160,
      pensionRate: 0.183,
      employmentRate: 0.006,
      nationalPensionMonthly: 17510,
    },
  },
  kanagawa: {
    code: 'kanagawa',
    name_ja: '神奈川県',
    name_vi: 'Kanagawa (神奈川県)',
    name_en: 'Kanagawa',
    region: 'Kanto',
    residentTax: {
      incomeLevyRate: 0.10025, // 神奈川県 có thuế bảo vệ nguồn nước +0.025%
      prefectureRate: 0.04025,
      municipalRate: 0.06,
      perCapitaFlat: 5300,
      forestryTax: 1000,
      nonTaxableSingleLimit: 450000,
    },
    socialInsurance: {
      kenpoRate: 0.1002,
      careInsuranceRate: 0.0160,
      pensionRate: 0.183,
      employmentRate: 0.006,
      nationalPensionMonthly: 17510,
    },
  },
  aichi: {
    code: 'aichi',
    name_ja: '愛知県',
    name_vi: 'Aichi (愛知県)',
    name_en: 'Aichi',
    region: 'Chubu',
    residentTax: {
      incomeLevyRate: 0.10,
      prefectureRate: 0.04,
      municipalRate: 0.06,
      perCapitaFlat: 5000,
      forestryTax: 1000,
      nonTaxableSingleLimit: 450000,
    },
    socialInsurance: {
      kenpoRate: 0.0997,
      careInsuranceRate: 0.0160,
      pensionRate: 0.183,
      employmentRate: 0.006,
      nationalPensionMonthly: 17510,
    },
  },
  saitama: {
    code: 'saitama',
    name_ja: '埼玉県',
    name_vi: 'Saitama (埼玉県)',
    name_en: 'Saitama',
    region: 'Kanto',
    residentTax: {
      incomeLevyRate: 0.10,
      prefectureRate: 0.04,
      municipalRate: 0.06,
      perCapitaFlat: 5000,
      forestryTax: 1000,
      nonTaxableSingleLimit: 450000,
    },
    socialInsurance: {
      kenpoRate: 0.0988,
      careInsuranceRate: 0.0160,
      pensionRate: 0.183,
      employmentRate: 0.006,
      nationalPensionMonthly: 17510,
    },
  },
  chiba: {
    code: 'chiba',
    name_ja: '千葉県',
    name_vi: 'Chiba (千葉県)',
    name_en: 'Chiba',
    region: 'Kanto',
    residentTax: {
      incomeLevyRate: 0.10,
      prefectureRate: 0.04,
      municipalRate: 0.06,
      perCapitaFlat: 5000,
      forestryTax: 1000,
      nonTaxableSingleLimit: 450000,
    },
    socialInsurance: {
      kenpoRate: 0.0991,
      careInsuranceRate: 0.0160,
      pensionRate: 0.183,
      employmentRate: 0.006,
      nationalPensionMonthly: 17510,
    },
  },
  fukuoka: {
    code: 'fukuoka',
    name_ja: '福岡県',
    name_vi: 'Fukuoka (福岡県)',
    name_en: 'Fukuoka',
    region: 'Kyushu',
    residentTax: {
      incomeLevyRate: 0.10,
      prefectureRate: 0.04,
      municipalRate: 0.06,
      perCapitaFlat: 5500, // Có thêm thuế rừng địa phương
      forestryTax: 1000,
      nonTaxableSingleLimit: 450000,
    },
    socialInsurance: {
      kenpoRate: 0.1025,
      careInsuranceRate: 0.0160,
      pensionRate: 0.183,
      employmentRate: 0.006,
      nationalPensionMonthly: 17510,
    },
  },
  hokkaido: {
    code: 'hokkaido',
    name_ja: '北海道',
    name_vi: 'Hokkaido (北海道)',
    name_en: 'Hokkaido',
    region: 'Hokkaido',
    residentTax: {
      incomeLevyRate: 0.10,
      prefectureRate: 0.04,
      municipalRate: 0.06,
      perCapitaFlat: 5000,
      forestryTax: 1000,
      nonTaxableSingleLimit: 450000,
    },
    socialInsurance: {
      kenpoRate: 0.1028,
      careInsuranceRate: 0.0160,
      pensionRate: 0.183,
      employmentRate: 0.006,
      nationalPensionMonthly: 17510,
    },
  },
  hyogo: {
    code: 'hyogo',
    name_ja: '兵庫県',
    name_vi: 'Hyogo (兵庫県)',
    name_en: 'Hyogo',
    region: 'Kansai',
    residentTax: {
      incomeLevyRate: 0.10,
      prefectureRate: 0.04,
      municipalRate: 0.06,
      perCapitaFlat: 5800, // 県民緑税 800円
      forestryTax: 1000,
      nonTaxableSingleLimit: 450000,
    },
    socialInsurance: {
      kenpoRate: 0.1018,
      careInsuranceRate: 0.0160,
      pensionRate: 0.183,
      employmentRate: 0.006,
      nationalPensionMonthly: 17510,
    },
  },
  shizuoka: {
    code: 'shizuoka',
    name_ja: '静岡県',
    name_vi: 'Shizuoka (静岡県)',
    name_en: 'Shizuoka',
    region: 'Chubu',
    residentTax: {
      incomeLevyRate: 0.10,
      prefectureRate: 0.04,
      municipalRate: 0.06,
      perCapitaFlat: 5400, // 森林づくり県民税 400円
      forestryTax: 1000,
      nonTaxableSingleLimit: 450000,
    },
    socialInsurance: {
      kenpoRate: 0.0984,
      careInsuranceRate: 0.0160,
      pensionRate: 0.183,
      employmentRate: 0.006,
      nationalPensionMonthly: 17510,
    },
  },
  kyoto: {
    code: 'kyoto',
    name_ja: '京都府',
    name_vi: 'Kyoto (京都府)',
    name_en: 'Kyoto',
    region: 'Kansai',
    residentTax: {
      incomeLevyRate: 0.10,
      prefectureRate: 0.04,
      municipalRate: 0.06,
      perCapitaFlat: 5600, // 豊かな森を育てる府民税 600円
      forestryTax: 1000,
      nonTaxableSingleLimit: 450000,
    },
    socialInsurance: {
      kenpoRate: 0.1008,
      careInsuranceRate: 0.0160,
      pensionRate: 0.183,
      employmentRate: 0.006,
      nationalPensionMonthly: 17510,
    },
  },
  hiroshima: {
    code: 'hiroshima',
    name_ja: '広島県',
    name_vi: 'Hiroshima (広島県)',
    name_en: 'Hiroshima',
    region: 'Chugoku',
    residentTax: {
      incomeLevyRate: 0.10,
      prefectureRate: 0.04,
      municipalRate: 0.06,
      perCapitaFlat: 5500, // ひろしまの森づくり県民税 500円
      forestryTax: 1000,
      nonTaxableSingleLimit: 450000,
    },
    socialInsurance: {
      kenpoRate: 0.1015,
      careInsuranceRate: 0.0160,
      pensionRate: 0.183,
      employmentRate: 0.006,
      nationalPensionMonthly: 17510,
    },
  },
  miyagi: {
    code: 'miyagi',
    name_ja: '宮城県',
    name_vi: 'Miyagi (宮城県)',
    name_en: 'Miyagi',
    region: 'Tohoku',
    residentTax: {
      incomeLevyRate: 0.10,
      prefectureRate: 0.04,
      municipalRate: 0.06,
      perCapitaFlat: 6200, // みやぎ発展税 + 水と緑の森林税
      forestryTax: 1000,
      nonTaxableSingleLimit: 450000,
    },
    socialInsurance: {
      kenpoRate: 0.1012,
      careInsuranceRate: 0.0160,
      pensionRate: 0.183,
      employmentRate: 0.006,
      nationalPensionMonthly: 17510,
    },
  },
};

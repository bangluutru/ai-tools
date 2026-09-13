/**
 * @file jurisdictions/japanPrefectures.js
 * Danh bạ 47 tỉnh thành Nhật Bản chuẩn JIS X 0401 và Thẩm quyền Lãnh sự chính thức.
 * Không suy đoán theo khoảng cách địa lý mà tuân thủ phân vùng lãnh sự chính thức.
 */

const PREFECTURE_DATA = [
  // 1. Hokkaido
  { code: '01', id: 'hokkaido', name_vi: 'Hokkaido', name_ja: '北海道', name_en: 'Hokkaido', region: 'hokkaido', office_id: 'tokyo' },

  // 2. Tohoku
  { code: '02', id: 'aomori', name_vi: 'Aomori', name_ja: '青森県', name_en: 'Aomori', region: 'tohoku', office_id: 'tokyo' },
  { code: '03', id: 'iwate', name_vi: 'Iwate', name_ja: '岩手県', name_en: 'Iwate', region: 'tohoku', office_id: 'tokyo' },
  { code: '04', id: 'miyagi', name_vi: 'Miyagi', name_ja: '宮城県', name_en: 'Miyagi', region: 'tohoku', office_id: 'tokyo' },
  { code: '05', id: 'akita', name_vi: 'Akita', name_ja: '秋田県', name_en: 'Akita', region: 'tohoku', office_id: 'tokyo' },
  { code: '06', id: 'yamagata', name_vi: 'Yamagata', name_ja: '山形県', name_en: 'Yamagata', region: 'tohoku', office_id: 'tokyo' },
  { code: '07', id: 'fukushima', name_vi: 'Fukushima', name_ja: '福島県', name_en: 'Fukushima', region: 'tohoku', office_id: 'tokyo' },

  // 3. Kanto
  { code: '08', id: 'ibaraki', name_vi: 'Ibaraki', name_ja: '茨城県', name_en: 'Ibaraki', region: 'kanto', office_id: 'tokyo' },
  { code: '09', id: 'tochigi', name_vi: 'Tochigi', name_ja: '栃木県', name_en: 'Tochigi', region: 'kanto', office_id: 'tokyo' },
  { code: '10', id: 'gunma', name_vi: 'Gunma', name_ja: '群馬県', name_en: 'Gunma', region: 'kanto', office_id: 'tokyo' },
  { code: '11', id: 'saitama', name_vi: 'Saitama', name_ja: '埼玉県', name_en: 'Saitama', region: 'kanto', office_id: 'tokyo' },
  { code: '12', id: 'chiba', name_vi: 'Chiba', name_ja: '千葉県', name_en: 'Chiba', region: 'kanto', office_id: 'tokyo' },
  { code: '13', id: 'tokyo', name_vi: 'Tokyo', name_ja: '東京都', name_en: 'Tokyo', region: 'kanto', office_id: 'tokyo' },
  { code: '14', id: 'kanagawa', name_vi: 'Kanagawa', name_ja: '神奈川県', name_en: 'Kanagawa', region: 'kanto', office_id: 'tokyo' },

  // 4. Chubu / Hokuriku / Tokai
  { code: '15', id: 'niigata', name_vi: 'Niigata', name_ja: '新潟県', name_en: 'Niigata', region: 'chubu', office_id: 'tokyo' },
  { code: '16', id: 'toyama', name_vi: 'Toyama', name_ja: '富山県', name_en: 'Toyama', region: 'chubu', office_id: 'tokyo' },
  { code: '17', id: 'ishikawa', name_vi: 'Ishikawa', name_ja: '石川県', name_en: 'Ishikawa', region: 'chubu', office_id: 'tokyo' },
  { code: '18', id: 'fukui', name_vi: 'Fukui', name_ja: '福井県', name_en: 'Fukui', region: 'chubu', office_id: 'tokyo' },
  { code: '19', id: 'yamanashi', name_vi: 'Yamanashi', name_ja: '山梨県', name_en: 'Yamanashi', region: 'chubu', office_id: 'tokyo' },
  { code: '20', id: 'nagano', name_vi: 'Nagano', name_ja: '長野県', name_en: 'Nagano', region: 'chubu', office_id: 'tokyo' },
  { code: '21', id: 'gifu', name_vi: 'Gifu', name_ja: '岐阜県', name_en: 'Gifu', region: 'chubu', office_id: 'tokyo' },
  { code: '22', id: 'shizuoka', name_vi: 'Shizuoka', name_ja: '静岡県', name_en: 'Shizuoka', region: 'chubu', office_id: 'tokyo' },
  { code: '23', id: 'aichi', name_vi: 'Aichi', name_ja: '愛知県', name_en: 'Aichi', region: 'chubu', office_id: 'tokyo' },

  // 5. Kansai (Kinki)
  { code: '24', id: 'mie', name_vi: 'Mie', name_ja: '三重県', name_en: 'Mie', region: 'kansai', office_id: 'osaka' },
  { code: '25', id: 'shiga', name_vi: 'Shiga', name_ja: '滋賀県', name_en: 'Shiga', region: 'kansai', office_id: 'osaka' },
  { code: '26', id: 'kyoto', name_vi: 'Kyoto', name_ja: '京都府', name_en: 'Kyoto', region: 'kansai', office_id: 'osaka' },
  { code: '27', id: 'osaka', name_vi: 'Osaka', name_ja: '大阪府', name_en: 'Osaka', region: 'kansai', office_id: 'osaka' },
  { code: '28', id: 'hyogo', name_vi: 'Hyogo', name_ja: '兵庫県', name_en: 'Hyogo', region: 'kansai', office_id: 'osaka' },
  { code: '29', id: 'nara', name_vi: 'Nara', name_ja: '奈良県', name_en: 'Nara', region: 'kansai', office_id: 'osaka' },
  { code: '30', id: 'wakayama', name_vi: 'Wakayama', name_ja: '和歌山県', name_en: 'Wakayama', region: 'kansai', office_id: 'osaka' },

  // 6. Chugoku
  { code: '31', id: 'tottori', name_vi: 'Tottori', name_ja: '鳥取県', name_en: 'Tottori', region: 'chugoku', office_id: 'osaka' },
  { code: '32', id: 'shimane', name_vi: 'Shimane', name_ja: '島根県', name_en: 'Shimane', region: 'chugoku', office_id: 'osaka' },
  { code: '33', id: 'okayama', name_vi: 'Okayama', name_ja: '岡山県', name_en: 'Okayama', region: 'chugoku', office_id: 'osaka' },
  { code: '34', id: 'hiroshima', name_vi: 'Hiroshima', name_ja: '広島県', name_en: 'Hiroshima', region: 'chugoku', office_id: 'osaka' },
  { code: '35', id: 'yamaguchi', name_vi: 'Yamaguchi', name_ja: '山口県', name_en: 'Yamaguchi', region: 'chugoku', office_id: 'osaka' },

  // 7. Shikoku
  { code: '36', id: 'tokushima', name_vi: 'Tokushima', name_ja: '徳島県', name_en: 'Tokushima', region: 'shikoku', office_id: 'osaka' },
  { code: '37', id: 'kagawa', name_vi: 'Kagawa', name_ja: '香川県', name_en: 'Kagawa', region: 'shikoku', office_id: 'osaka' },
  { code: '38', id: 'ehime', name_vi: 'Ehime', name_ja: '愛媛県', name_en: 'Ehime', region: 'shikoku', office_id: 'osaka' },
  { code: '39', id: 'kochi', name_vi: 'Kochi', name_ja: '高知県', name_en: 'Kochi', region: 'shikoku', office_id: 'osaka' },

  // 8. Kyushu & Okinawa
  { code: '40', id: 'fukuoka', name_vi: 'Fukuoka', name_ja: '福岡県', name_en: 'Fukuoka', region: 'kyushu', office_id: 'fukuoka' },
  { code: '41', id: 'saga', name_vi: 'Saga', name_ja: '佐賀県', name_en: 'Saga', region: 'kyushu', office_id: 'fukuoka' },
  { code: '42', id: 'nagasaki', name_vi: 'Nagasaki', name_ja: '長崎県', name_en: 'Nagasaki', region: 'kyushu', office_id: 'fukuoka' },
  { code: '43', id: 'kumamoto', name_vi: 'Kumamoto', name_ja: '熊本県', name_en: 'Kumamoto', region: 'kyushu', office_id: 'fukuoka' },
  { code: '44', id: 'oita', name_vi: 'Oita', name_ja: '大分県', name_en: 'Oita', region: 'kyushu', office_id: 'fukuoka' },
  { code: '45', id: 'miyazaki', name_vi: 'Miyazaki', name_ja: '宮崎県', name_en: 'Miyazaki', region: 'kyushu', office_id: 'fukuoka' },
  { code: '46', id: 'kagoshima', name_vi: 'Kagoshima', name_ja: '鹿児島県', name_en: 'Kagoshima', region: 'kyushu', office_id: 'fukuoka' },
  { code: '47', id: 'okinawa', name_vi: 'Okinawa', name_ja: '沖縄県', name_en: 'Okinawa', region: 'kyushu', office_id: 'fukuoka' },
];

export const JAPAN_PREFECTURES = PREFECTURE_DATA.map((p) => ({
  ...p,
  nameVi: p.name_vi,
  nameJa: p.name_ja,
  nameEn: p.name_en,
  nameRomaji: p.name_en,
}));

export const REGIONS_ORDER = [
  { id: 'kanto', name_vi: 'Kanto (Thủ đô & Lân cận)', name_ja: '関東地方' },
  { id: 'kansai', name_vi: 'Kansai (Kinki)', name_ja: '関西地方' },
  { id: 'chubu', name_vi: 'Chubu & Tokai & Hokuriku', name_ja: '中部・東海・北陸' },
  { id: 'kyushu', name_vi: 'Kyushu & Okinawa', name_ja: '九州・沖縄' },
  { id: 'chugoku', name_vi: 'Chugoku', name_ja: '中国地方' },
  { id: 'shikoku', name_vi: 'Shikoku', name_ja: '四国地方' },
  { id: 'tohoku', name_vi: 'Tohoku', name_ja: '東北地方' },
  { id: 'hokkaido', name_vi: 'Hokkaido', name_ja: '北海道' },
];

export const getPrefectureById = (id) => {
  const found = JAPAN_PREFECTURES.find((p) => p.id === id || p.code === id) || JAPAN_PREFECTURES[12]; // Default Tokyo
  return {
    ...found,
    nameVi: found.name_vi,
    nameJa: found.name_ja,
    nameRomaji: found.id.charAt(0).toUpperCase() + found.id.slice(1),
  };
};

import { CONSULAR_OFFICES, getOfficeById } from '../offices/index.js';

export const getOfficeForPrefecture = (prefectureIdOrCode) => {
  const pref = getPrefectureById(prefectureIdOrCode);
  const office = getOfficeById(pref?.office_id || 'tokyo');
  return {
    ...office,
    id: office.id,
    name: {
      vi: office.name_vn || office.name?.vi,
      en: office.name_en || office.name?.en,
      ja: office.name_ja || office.name?.ja,
    },
    address: {
      vi: office.address?.line || office.address?.vi,
      ja: office.address?.line_ja || office.address?.ja,
    },
    postalCode: office.address?.postal_code || office.address?.postalCode || '151-0062',
    hotline: office.contact?.citizen_protection_hotline || office.contact?.switchboard?.[0] || '+81-3-3466-3311',
    city: office.address?.prefecture || 'Tokyo',
    workingHours: {
      submission: office.working_hours?.reception_morning || '09:00 - 12:00',
      pickup: office.working_hours?.return_afternoon || '14:00 - 17:00',
    },
    note: office.notes || '',
  };
};

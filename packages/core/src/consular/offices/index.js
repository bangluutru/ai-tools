/**
 * @file offices/index.js
 * Danh bạ các Cơ quan đại diện Việt Nam tại Nhật Bản (Toolio — công cụ không chính thức).
 * Nguồn (kiểm tra 2026-09-27):
 *  - ĐSQ Tokyo: https://vnembassy-jp.org/vi/thong-tin-chung-ve-thu-tuc-lanh-su
 *  - TLSQ Osaka: https://vnconsulate-osaka.org/en
 *  - TLSQ Fukuoka: https://vnconsulate-fukuoka.org/en/
 * Trường nào không tìm thấy trên trang chính thức được để null / ghi "cần xác nhận với cơ quan".
 */

export const CONSULAR_OFFICES = {
  tokyo: {
    id: 'tokyo',
    name_vn: 'Đại sứ quán Việt Nam tại Tokyo',
    name_en: 'Embassy of the Socialist Republic of Vietnam in Japan (Tokyo)',
    name_ja: '在日ベトナム社会主義共和国大使館（東京）',
    type: 'embassy',
    flag: '🇻🇳',
    address: {
      postal_code: '151-0062',
      prefecture: 'Tokyo',
      line: '50-11 Motoyoyogi-cho, Shibuya-ku, Tokyo',
      line_ja: '東京都渋谷区元代々木町50-11',
      map_url: 'https://goo.gl/maps/K7gAeYreUb5QCRQq6',
    },
    contact: {
      switchboard: ['+81-3-3466-3311', '+81-3-3466-3313', '+81-3-3466-3314'],
      fax: ['+81-3-3466-7652', '+81-3-3466-3312'],
      consular_email: 'vnconsular@vnembassy.jp',
      general_email: 'vietnamembassy-japan@vnembassy.jp',
      citizen_protection_email: 'baohocongdan@vnembassy.jp',
      citizen_protection_hotline: '+81-80-3590-9136',
      labor_hotline: '+81-80-7142-6688',
      education_hotline: '+81-80-7506-1987',
      mofa_citizen_protection: '+84-981-84-84-84',
    },
    // Trang ĐSQ: nhận hồ sơ và trả kết quả 9:30-12:00 và 14:00-17:00, Thứ 2 - Thứ 6 (trừ ngày lễ VN & Nhật)
    working_hours: {
      reception_morning: '09:30 - 12:00 & 14:00 - 17:00 (Thứ 2 - Thứ 6, nhận hồ sơ & trả kết quả)',
      return_afternoon: '09:30 - 12:00 & 14:00 - 17:00 (Thứ 2 - Thứ 6)',
      closed: 'Thứ 7, Chủ Nhật và các ngày nghỉ lễ của Việt Nam và Nhật Bản',
    },
    official_website: 'https://vnembassy-jp.org',
    notes: 'Hình thức nộp tùy thủ tục (xem từng thủ tục). Hộ chiếu, khai sinh, kết hôn, chứng thực chữ ký: nộp trực tiếp.',
    last_verified: '2026-09-27',
  },
  osaka: {
    id: 'osaka',
    name_vn: 'Tổng Lãnh sự quán Việt Nam tại Osaka',
    name_en: 'Consulate General of Vietnam in Osaka',
    name_ja: '在大阪ベトナム社会主義共和国総領事館',
    type: 'consulate_general',
    flag: '🇻🇳',
    address: {
      postal_code: '590-0952',
      prefecture: 'Osaka',
      line: '4-2-15 Ichinocho Higashi, Sakai-ku, Sakai-shi, Osaka',
      line_ja: '大阪府堺市堺区市之町東4-2-15',
      map_url: 'https://goo.gl/maps/Q3iZ7s6zR8wF6y4x7',
    },
    contact: {
      switchboard: ['+81-72-221-6666'],
      fax: ['+81-72-221-6667'],
      consular_phones: [
        '+81-72-221-6603',
        '+81-72-224-6887',
        '+81-72-221-6607',
        '+81-72-221-6608',
      ],
      consular_email: 'vnconsulate-info@vnconsulate-osaka.org',
      general_email: 'vnconsulate-info@vnconsulate-osaka.org',
      citizen_protection_email: 'baohocongdan.osaka@gmail.com',
      citizen_protection_hotline: '+81-90-4769-6789',
      mofa_citizen_protection: '+84-981-84-84-84',
    },
    // Trang chính thức không nêu giờ tiếp nhận (kiểm tra 2026-09-27)
    working_hours: {
      reception_morning: 'Giờ tiếp nhận: cần xác nhận với cơ quan',
      return_afternoon: 'Giờ trả kết quả: cần xác nhận với cơ quan',
      closed: 'Thứ 7, Chủ Nhật và ngày lễ (cần xác nhận với cơ quan)',
    },
    official_website: 'https://vnconsulate-osaka.org',
    notes: 'Thủ tục hộ chiếu làm trực tiếp tại TLSQ (trang node/100). Địa bàn lãnh sự chính xác chưa được công bố trên trang — cần xác nhận với cơ quan.',
    last_verified: '2026-09-27',
  },
  fukuoka: {
    id: 'fukuoka',
    name_vn: 'Tổng Lãnh sự quán Việt Nam tại Fukuoka',
    name_en: 'Consulate General of Vietnam in Fukuoka',
    name_ja: '在福岡ベトナム社会主義共和国総領事館',
    type: 'consulate_general',
    flag: '🇻🇳',
    address: {
      postal_code: '810-0801',
      prefecture: 'Fukuoka',
      line: '4F, Aqua Hakata, 5-3-8 Nakasu, Hakata-ku, Fukuoka-shi, Fukuoka',
      line_ja: '福岡県福岡市博多区中洲5-3-8 アクア博多4階',
      map_url: 'https://goo.gl/maps/bY4nZt3Wf1cM7d7A9',
    },
    contact: {
      switchboard: ['+81-92-263-7668'],
      fax: ['+81-92-263-7676'],
      consular_email: 'tlsq.fukuoka@gmail.com',
      general_email: 'vnconsulate.fukuoka@gmail.com',
      // Trang chủ TLSQ: bảo hộ công dân (cuối tuần/ngày lễ) 080 3984 6668 hoặc 080 4279 7302
      citizen_protection_hotline: '+81-80-3984-6668',
      citizen_protection_hotline_alt: '+81-80-4279-7302',
      mofa_citizen_protection: '+84-981-84-84-84',
    },
    working_hours: {
      reception_morning: 'Giờ tiếp nhận: cần xác nhận với cơ quan',
      return_afternoon: 'Giờ trả kết quả: cần xác nhận với cơ quan',
      closed: 'Thứ 7, Chủ Nhật và ngày lễ Việt Nam, Nhật Bản',
    },
    official_website: 'https://vnconsulate-fukuoka.org',
    notes: 'Khu vực Kyushu - Okinawa. Hình thức nộp từng thủ tục: cần xác nhận với cơ quan.',
    last_verified: '2026-09-27',
  },
  honorary_nagoya: {
    id: 'honorary_nagoya',
    name_vn: 'Văn phòng Lãnh sự danh dự tại Nagoya',
    name_en: 'Honorary Consulate of Vietnam in Nagoya',
    name_ja: '在名古屋ベトナム名誉領事館',
    type: 'honorary_consulate',
    flag: '🇻🇳',
    address: {
      postal_code: '460-0003',
      prefecture: 'Aichi',
      line: 'Nagoya-shi, Aichi',
      line_ja: '愛知県名古屋市',
    },
    status: 'local_support_only',
    notes: 'Cơ quan Lãnh sự danh dự chủ yếu hỗ trợ kết nối hữu nghị, thương mại và hỗ trợ cộng đồng tại địa phương. Về thẩm quyền xử lý thủ tục hành chính lãnh sự (hộ chiếu, khai sinh, kết hôn, hợp pháp hóa), người cư trú tại Aichi nộp hồ sơ tại Đại sứ quán Việt Nam tại Tokyo.',
    last_verified: '2026-09-12',
  },
  honorary_kushiro: {
    id: 'honorary_kushiro',
    name_vn: 'Văn phòng Lãnh sự danh dự tại Kushiro (Hokkaido)',
    name_en: 'Honorary Consulate of Vietnam in Kushiro',
    name_ja: '在釧路ベトナム名誉領事館',
    type: 'honorary_consulate',
    flag: '🇻🇳',
    address: {
      postal_code: '085-0015',
      prefecture: 'Hokkaido',
      line: 'Kushiro-shi, Hokkaido',
      line_ja: '北海道釧路市',
    },
    status: 'local_support_only',
    notes: 'Hỗ trợ tại địa phương cho khu vực Hokkaido. Thẩm quyền thụ lý thủ tục hành chính lãnh sự chính thức thuộc về Đại sứ quán Việt Nam tại Tokyo.',
    last_verified: '2026-09-12',
  },
};

export const getOfficeById = (id) => (id && CONSULAR_OFFICES[id]) || null;

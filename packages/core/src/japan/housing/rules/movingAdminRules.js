/**
 * @file packages/core/src/japan/housing/rules/movingAdminRules.js
 * @description
 * Quy định và quy chuẩn thủ tục hành chính chuyển nhà tại Nhật Bản:
 * - 住民基本台帳法（第22条：転入届、第23条：転居届、第24条：転出届、第52条：過料）
 * - デジタル庁「引越しワンストップサービス」（マイナポータル）
 * - 国民健康保険法、国民年金法、介護保険法、狂犬病予防法
 */

export const MOVING_TYPES = [
  {
    id: 'different_municipality',
    nameJa: '他の市区町村へ引越し（転出・転入）',
    nameVi: 'Chuyển sang quận/thị xã/thành phố khác (転出・転入)',
    nameEn: 'Moving to a Different Municipality (Moving-out & Moving-in)',
    descJa: '旧住所の役所で転出届、新住所の役所で転入届が必要です。',
    descVi: 'Cần nộp giấy chuyển đi (Tenshutsu) tại quận cũ và giấy chuyển đến (Tennyu) tại quận mới.',
    descEn: 'Requires moving-out notification at previous municipality and moving-in notification at new municipality.',
  },
  {
    id: 'same_municipality',
    nameJa: '同じ市区町村内で引越し（転居）',
    nameVi: 'Chuyển trong cùng một quận/thành phố (転居)',
    nameEn: 'Moving within the Same Municipality (Address Change)',
    descJa: '同一区役所・市役所内での住所変更手続き（転居届）のみで完了します。',
    descVi: 'Chỉ cần làm thủ tục đổi địa chỉ (Tenkyo) tại cùng một ủy ban quận/thành phố.',
    descEn: 'Only requires an intra-city address change notification (Tenkyo-todoke).',
  },
];

/**
 * Căn cứ pháp lý & Nguồn trích dẫn quy định hành chính chuyển nhà
 */
export const MOVING_ADMIN_SOURCES = [
  'soumu-resident-basic-book-act',
  'digital-agency-moving-onestop',
  'mhlw-national-health-insurance-act',
  'mhlw-national-pension-act',
];

/**
 * Giới hạn ngày luật định (Statutory Periods)
 */
export const STATUTORY_DEADLINES = {
  /** 転出届: từ 14 ngày trước ngày chuyển, hoặc tối đa 14 ngày sau ngày chuyển */
  tenshutsuDaysBefore: 14,
  tenshutsuDaysAfter: 14,
  /** 転入届: bắt buộc trong vòng 14 ngày kể từ ngày bắt đầu ở tại nơi mới */
  tennyuDaysAfter: 14,
  /** 転居届: bắt buộc trong vòng 14 ngày kể từ ngày chuyển */
  tenkyoDaysAfter: 14,
  /** Gia hạn cập nhật thông tin thẻ My Number (Chữ ký điện tử & địa chỉ trên chip): trong vòng 90 ngày nếu không thẻ bị vô hiệu hóa */
  myNumberContinueDays: 90,
  /** Mức phạt tiền không có tính chất hình sự (過料) nếu trễ hạn 14 ngày không có lý do chính đáng */
  overdueFineMaxYen: 50000,
  overdueFineLawJa: '住民基本台帳法第52条第2項（正当な理由がなくて届出をしなかったときは、5万円以下の過料に処する）',
  overdueFineLawVi: 'Điều 52 Khoản 2 Luật Sổ bộ Cư trú: Không nộp thông báo chuyển cư trong 14 ngày mà không có lý do chính đáng có thể bị phạt tiền đến 50.000 Yên.',
  overdueFineLawEn: 'Resident Basic Book Act Art. 52(2): Failure to file notification within 14 days without justifiable reason may incur a civil fine of up to 50,000 JPY.',
};

/**
 * Điều kiện & Hướng dẫn Dịch vụ Một Cửa (MyNaPortal 引越しワンストップサービス)
 */
export const ONESTOP_SERVICE_RULES = {
  serviceNameJa: 'マイナポータル 引越しワンストップサービス',
  serviceNameVi: 'Dịch vụ Một Cửa Chuyển Nhà MyNaPortal (Cơ quan Kỹ thuật số Nhật Bản)',
  serviceNameEn: 'Digital Agency MyNaPortal Moving One-Stop Service',
  supportedMoveType: 'different_municipality',
  requirements: [
    {
      id: 'mynumber_card',
      labelJa: '有効なマイナンバーカードを保有していること',
      labelVi: 'Có thẻ My Number còn hiệu lực',
      labelEn: 'Hold a valid My Number Card',
    },
    {
      id: 'electronic_cert',
      labelJa: '署名用電子証明書（暗証番号6〜16桁英数字）が有効であること',
      labelVi: 'Chứng thư chữ ký điện tử (mật khẩu 6-16 ký tự) còn hiệu lực',
      labelEn: 'Valid Electronic Signature Certificate (6-16 alphanumeric PIN)',
    },
    {
      id: 'smart_phone_reader',
      labelJa: 'マイナポータルアプリ対応のスマートフォンまたはICカードリーダーを所持していること',
      labelVi: 'Điện thoại đọc được NFC thẻ hoặc đầu đọc thẻ IC',
      labelEn: 'Smartphone supporting NFC or IC Card Reader',
    },
  ],
  importantNoticeJa: '※ 転出届はオンライン完結できますが、新住所での【転入届】はマイナンバーカードを持参して新しい市区町村の窓口へ必ず来庁する必要があります（来庁予定の事前予約・時間短縮が可能）。',
  importantNoticeVi: '※ Thông báo chuyển đi (転出届) có thể làm 100% online không cần đến ủy ban cũ. Tuy nhiên, thủ tục chuyển đến (転入届) BẮT BUỘC phải mang thẻ My Number trực tiếp đến quầy ủy ban mới (nhưng được đặt hẹn trước và rút ngắn thời gian chờ).',
  importantNoticeEn: '※ Moving-out notification (Tenshutsu) can be completed 100% online. However, moving-in (Tennyu) strictly requires physical appearance at the new municipal office with your My Number Card (advance appointment and expedited queue available).',
};

/**
 * Danh mục giấy tờ cần chuẩn bị theo từng nhóm đối tượng
 */
export const REQUIRED_DOCUMENTS_MASTER = {
  identity: [
    {
      id: 'mynumber_or_id',
      nameJa: '本人確認書類（マイナンバーカード、在留カード、運転免許証等）',
      nameVi: 'Giấy tờ tùy thân (Thẻ My Number, Thẻ Ngoại Kiều 在留カード, Bằng lái xe, Hộ chiếu)',
      nameEn: 'Identity Verification Document (My Number Card, Residence Card, Driver License)',
      mandatory: true,
      phase: 'both',
    },
    {
      id: 'tenshutsu_cert',
      nameJa: '転出証明書（※マイナポータル利用時または特例転入時は不要）',
      nameVi: 'Giấy chứng nhận chuyển đi 転出証明書 (Không cần nếu làm qua MyNaPortal hoặc thẻ My Number)',
      nameEn: 'Moving-out Certificate (Not required if using MyNaPortal / Special Move-in with My Number Card)',
      mandatory: false,
      condition: 'paper_tenshutsu',
      phase: 'after_move',
    },
  ],
  insurance_pension: [
    {
      id: 'national_health_insurance',
      nameJa: '国民健康保険被保険者証（該当者のみ・旧住所で返還、新住所で加入手続き）',
      nameVi: 'Thẻ Bảo hiểm y tế quốc dân Kokumin Kenko Hoken (Trả thẻ tại quận cũ, làm thẻ mới tại quận mới)',
      nameEn: 'National Health Insurance Card (Surrender at old city, re-enroll at new city)',
      mandatory: false,
      condition: 'has_national_health_insurance',
      phase: 'both',
    },
    {
      id: 'national_pension_book',
      nameJa: '年金手帳または基礎年金番号通知書（国民年金第1号被保険者の住所変更）',
      nameVi: 'Sổ hưu trí hoặc Thông báo mã số Nenkin cơ bản (Đổi địa chỉ Nenkin nhóm 1)',
      nameEn: 'Pension Handbook or Basic Pension Number Notice (Address update for Category 1 insured)',
      mandatory: false,
      condition: 'has_national_pension',
      phase: 'after_move',
    },
    {
      id: 'care_insurance_cert',
      nameJa: '介護保険受給資格証明書（65歳以上または要介護認定者・旧住所で交付受領）',
      nameVi: 'Giấy chứng nhận đủ điều kiện bảo hiểm điều dưỡng (Người từ 65 tuổi hoặc người cần chăm sóc)',
      nameEn: 'Long-term Care Insurance Eligibility Certificate (Age 65+ or certified)',
      mandatory: false,
      condition: 'has_care_insurance',
      phase: 'both',
    },
  ],
  family_child: [
    {
      id: 'boshi_techo',
      nameJa: '母子健康手帳・予防接種予診票（妊産婦・乳幼児がいる場合、新住所で予診票交換）',
      nameVi: 'Sổ Mẹ và Bé Boshi Techo & Phiếu tiêm chủng (Đổi phiếu tiêm chủng tại trạm y tế quận mới)',
      nameEn: 'Maternal and Child Health Handbook & Vaccination vouchers (Exchange vouchers at new city)',
      mandatory: false,
      condition: 'has_children',
      phase: 'after_move',
    },
    {
      id: 'jido_teate_cert',
      nameJa: '児童手当用 所得課税証明書・転出予定連絡票（児童手当を受給している世帯）',
      nameVi: 'Hồ sơ trợ cấp trẻ em Jido Teate (Cần nộp đơn mới tại quận mới trong vòng 15 ngày)',
      nameEn: 'Child Allowance Transfer Documents (Must apply at new city within 15 days)',
      mandatory: false,
      condition: 'has_children',
      phase: 'after_move',
    },
  ],
  pets: [
    {
      id: 'dog_registration_tag',
      nameJa: '愛犬の鑑札・狂犬病予防注射済票（旧住所の鑑札を新住所の窓口で無料交換）',
      nameVi: 'Thẻ bài đăng ký chó (Kansatsu) & Giấy tiêm phòng dại (Đổi thẻ bài mới tại quận mới trong 30 ngày)',
      nameEn: 'Dog License Tag & Rabies Vaccination Certificate (Exchange tag for new one within 30 days)',
      mandatory: false,
      condition: 'has_pets_dog',
      phase: 'after_move',
    },
  ],
  foreign_resident: [
    {
      id: 'zairyu_card',
      nameJa: '世帯全員の在留カード（裏面に新住所の裏書き記載を受ける必要があります）',
      nameVi: 'Thẻ ngoại kiều 在留カード của tất cả thành viên trong gia đình (Để in địa chỉ mới vào mặt sau)',
      nameEn: 'Residence Cards of all moving family members (For new address endorsement on the back)',
      mandatory: false,
      condition: 'is_foreign_resident',
      phase: 'after_move',
    },
  ],
};

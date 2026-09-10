/**
 * @file acquisitionChannels.js
 * Definitions and metadata for official certificate acquisition channels in Japan.
 */

export const ACQUISITION_CHANNELS = {
  MUNICIPAL_COUNTER: 'municipal_counter',
  CONVENIENCE_STORE: 'convenience_store',
  MYNA_PORTAL_ONLINE: 'myna_portal_online',
  MAIL_REQUEST: 'mail_request',
  TAX_OFFICE_COUNTER: 'tax_office_counter',
  E_TAX_ONLINE: 'e_tax_online',
  EMPLOYER_REQUEST: 'employer_request',
  HELLO_WORK_COUNTER: 'hello_work_counter',
  IMMIGRATION_COUNTER: 'immigration_counter',
};

export const CHANNEL_METADATA = {
  [ACQUISITION_CHANNELS.MUNICIPAL_COUNTER]: {
    id: ACQUISITION_CHANNELS.MUNICIPAL_COUNTER,
    nameJa: '市区町村窓口',
    nameI18n: {
      ja: '市区町村窓口',
      vi: 'Quầy hành chính Tòa thị chính / Phường',
      en: 'Municipal Office Counter',
    },
    standardHoursJa: '平日 08:30〜17:00（自治体により延長窓口・休日開庁あり）',
    prerequisites: {
      requiresPhotoId: true,
      requiresSeal: false,
      requiresMyNumberCard: false,
    },
    typicalFeeJpy: 300,
    feeNoteI18n: {
      ja: '1通あたり概ね300円〜350円（各自治体条例による）',
      vi: 'Khoảng 300円〜350円 mỗi bản (theo quy định của từng địa phương)',
      en: 'Approximately 300-350 JPY per copy (set by municipal ordinance)',
    },
    iconName: 'Building2',
  },

  [ACQUISITION_CHANNELS.CONVENIENCE_STORE]: {
    id: ACQUISITION_CHANNELS.CONVENIENCE_STORE,
    nameJa: 'コンビニ交付（マルチコピー機）',
    nameI18n: {
      ja: 'コンビニ交付（マルチコピー機）',
      vi: 'In tại Kiosk Cửa hàng tiện lợi (Combini)',
      en: 'Convenience Store Kiosk (Multi-copy)',
    },
    standardHoursJa: '06:30〜23:00（12/29〜1/3及びシステム保守点検日を除く）',
    prerequisites: {
      requiresMyNumberCard: true,
      requiresUserAuthCert: true, // 4-digit PIN (利用者証明用電子証明書)
      requiresSignatureCert: false,
      requiresRegisteredDomicileApp: false, // true only for Koseki when living elsewhere
    },
    typicalFeeJpy: 200,
    feeNoteI18n: {
      ja: '窓口と同額または100円程度割引（自治体による）',
      vi: 'Bằng giá quầy hoặc được giảm khoảng 50円〜100円 tùy địa phương',
      en: 'Same as counter fee or discounted by ~100 JPY depending on municipality',
    },
    supportedStoresJa: ['セブン-イレブン', 'ファミリーマート', 'ローソン', 'ミニストップ等'],
    iconName: 'Store',
  },

  [ACQUISITION_CHANNELS.MYNA_PORTAL_ONLINE]: {
    id: ACQUISITION_CHANNELS.MYNA_PORTAL_ONLINE,
    nameJa: 'オンライン申請（マイナポータル等）',
    nameI18n: {
      ja: 'オンライン申請（マイナポータル等）',
      vi: 'Nộp đơn trực tuyến (MynaPortal / Smart City)',
      en: 'Online Application (MynaPortal)',
    },
    standardHoursJa: '24時間利用可能（定期メンテナンス時を除く）',
    prerequisites: {
      requiresMyNumberCard: true,
      requiresUserAuthCert: true,
      requiresSignatureCert: true, // 6-16 alphanum PIN (署名用電子証明書)
      requiresNfcReaderOrSmartphone: true,
    },
    typicalFeeJpy: 300,
    feeNoteI18n: {
      ja: '証明書手数料＋郵送料（電子交付の場合は手数料のみ、またはクレジットカード決済）',
      vi: 'Lệ phí chứng nhận + cước bưu điện (hoặc thanh toán thẻ khi cấp điện tử)',
      en: 'Certificate fee + postal delivery fee (or credit card payment for e-delivery)',
    },
    iconName: 'Globe',
  },

  [ACQUISITION_CHANNELS.MAIL_REQUEST]: {
    id: ACQUISITION_CHANNELS.MAIL_REQUEST,
    nameJa: '郵送請求',
    nameI18n: {
      ja: '郵送請求',
      vi: 'Yêu cầu qua đường Bưu điện',
      en: 'Mail Request',
    },
    standardHoursJa: '随時郵送（到着後1〜2週間程度で返送）',
    prerequisites: {
      requiresApplicationForm: true,
      requiresTeigakuKogawase: true, // 定額小為替 (Postal money order from Japan Post)
      requiresSelfAddressedStampedEnvelope: true, // 返信用封筒・切手
      requiresIdCopy: true, // 本人確認書類のコピー
    },
    typicalFeeJpy: 300,
    feeNoteI18n: {
      ja: '証明書手数料（定額小為替）＋往復郵便料金＋小為替発行手数料',
      vi: 'Phí giấy tờ (bằng séc bưu điện Teigaku Kogawase) + cước gửi thư 2 chiều',
      en: 'Certificate fee (via Teigaku Kogawase postal money order) + return postage',
    },
    iconName: 'Mail',
  },

  [ACQUISITION_CHANNELS.TAX_OFFICE_COUNTER]: {
    id: ACQUISITION_CHANNELS.TAX_OFFICE_COUNTER,
    nameJa: '税務署窓口',
    nameI18n: {
      ja: '税務署窓口',
      vi: 'Quầy Cục/Phòng Thuế Quốc gia (Zeimusho)',
      en: 'National Tax Office Counter',
    },
    standardHoursJa: '平日 08:30〜17:00',
    prerequisites: {
      requiresPhotoId: true,
      requiresApplicationForm: true,
    },
    typicalFeeJpy: 400,
    feeNoteI18n: {
      ja: '国税納税証明書1税目1年度あたり400円（オンライン請求時は370円）',
      vi: '400円 mỗi loại thuế/năm tại quầy (370円 nếu nộp qua e-Tax)',
      en: '400 JPY per tax type/year at counter (370 JPY via e-Tax)',
    },
    iconName: 'Landmark',
  },

  [ACQUISITION_CHANNELS.E_TAX_ONLINE]: {
    id: ACQUISITION_CHANNELS.E_TAX_ONLINE,
    nameJa: 'e-Tax（国税電子申告・納税システム）',
    nameI18n: {
      ja: 'e-Tax（国税電子申告・納税システム）',
      vi: 'Cổng thuế điện tử Quốc gia e-Tax',
      en: 'e-Tax Online System',
    },
    standardHoursJa: 'e-Tax利用可能時間帯（平日24時間、確定申告期は全日）',
    prerequisites: {
      requiresMyNumberCard: true,
      requiresSignatureCert: true,
    },
    typicalFeeJpy: 370,
    feeNoteI18n: {
      ja: '電子納税証明書は1通370円',
      vi: 'Chứng nhận thuế điện tử 370円 mỗi bản',
      en: 'Electronic tax payment certificate 370 JPY per copy',
    },
    iconName: 'Laptop',
  },

  [ACQUISITION_CHANNELS.EMPLOYER_REQUEST]: {
    id: ACQUISITION_CHANNELS.EMPLOYER_REQUEST,
    nameJa: '勤務先（人事・総務部門）',
    nameI18n: {
      ja: '勤務先（人事・総務部門）',
      vi: 'Công ty đang làm việc (Phòng Nhân sự / Kế toán)',
      en: 'Employer (HR / Payroll Department)',
    },
    standardHoursJa: '会社の就業時間内',
    prerequisites: {
      requiresEmploymentRelationship: true,
    },
    typicalFeeJpy: 0,
    feeNoteI18n: {
      ja: '原則無料（所得税法第226条により交付義務あり）',
      vi: 'Miễn phí (Doanh nghiệp có nghĩa vụ luật định cấp theo Điều 226 Luật Thuế TNCN)',
      en: 'Free of charge (Statutory employer obligation under Income Tax Act Art. 226)',
    },
    iconName: 'Briefcase',
  },

  [ACQUISITION_CHANNELS.HELLO_WORK_COUNTER]: {
    id: ACQUISITION_CHANNELS.HELLO_WORK_COUNTER,
    nameJa: 'ハローワーク（公共職業安定所）',
    nameI18n: {
      ja: 'ハローワーク（公共職業安定所）',
      vi: 'Trung tâm giới thiệu việc làm Hello Work',
      en: 'Public Employment Security Office (Hello Work)',
    },
    standardHoursJa: '平日 08:30〜17:15',
    prerequisites: {
      requiresPhotoId: true,
      requiresSeparationSlip: true,
    },
    typicalFeeJpy: 0,
    feeNoteI18n: {
      ja: '無料',
      vi: 'Miễn phí',
      en: 'Free of charge',
    },
    iconName: 'Users',
  },

  [ACQUISITION_CHANNELS.IMMIGRATION_COUNTER]: {
    id: ACQUISITION_CHANNELS.IMMIGRATION_COUNTER,
    nameJa: '出入国在留管理局窓口 / オンライン',
    nameI18n: {
      ja: '出入国在留管理局窓口 / オンライン',
      vi: 'Cục Quản lý Xuất nhập cảnh (Nyukan) / Trực tuyến',
      en: 'Regional Immigration Bureau Counter / Online',
    },
    standardHoursJa: '平日 09:00〜16:00',
    prerequisites: {
      requiresPassport: true,
      requiresResidenceCard: true,
    },
    typicalFeeJpy: 4000,
    feeNoteI18n: {
      ja: '申請自体は無料。許可時に収入印紙で納付（更新4,000円〜）',
      vi: 'Nộp đơn miễn phí. Nộp lệ phí bằng tem Shūnyū Inshi khi nhận kết quả',
      en: 'Application submission is free. Fee paid via revenue stamps upon approval',
    },
    iconName: 'FileCheck2',
  },
};

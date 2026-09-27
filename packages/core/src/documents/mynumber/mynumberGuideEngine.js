/**
 * @file mynumberGuideEngine.js
 * Engine for My Number Card Lifecycle, Electronic Certificates, and PIN Management.
 * 
 * CORE RULES:
 * 1. Distinguish Card Validity vs Electronic Certificate Validity.
 * 2. Address/name change invalidates Signature Electronic Certificate (署名用電子証明書).
 * 3. Urgent lost/stolen guidance with 24/7 official toll-free hotline.
 * 4. Foreigners must extend card BEFORE visa expiry date (otherwise card lapses).
 * 5. NEVER store or request My Number digits or PINs.
 */

export const MYNUMBER_PROCEDURE_TYPES = {
  CARD_APPLICATION: 'card_application',
  VISA_EXTENSION_RENEWAL: 'visa_extension_renewal',
  ELECTRONIC_CERT_RENEWAL: 'electronic_cert_renewal',
  PIN_RESET_LOCKOUT: 'pin_reset_lockout',
  LOST_OR_STOLEN: 'lost_or_stolen',
  ADDRESS_NAME_CHANGE: 'address_name_change',
  SMARTPHONE_SETUP: 'smartphone_setup',
  TOKUTEI_ZAIRYU_CARD: 'tokutei_zairyu_card',
};

export const CERTIFICATE_TYPES = {
  SIGNATURE_CERT: {
    nameJa: '署名用電子証明書',
    nameI18n: {
      ja: '署名用電子証明書',
      vi: 'Chứng thư chữ ký số điện tử (Ký số e-Tax / Nộp hồ sơ)',
      en: 'Signature Electronic Certificate',
    },
    pinFormatJa: '英大文字と数字を組み合わせた6桁〜16桁',
    pinFormatI18n: {
      ja: '英大文字と数字を組み合わせた6桁〜16桁',
      vi: 'Mật khẩu 6 đến 16 ký tự (kết hợp chữ in hoa A-Z và chữ số 0-9)',
      en: '6 to 16 alphanumeric characters (uppercase letters and numbers)',
    },
    lockoutRuleJa: '5回連続で間違えるとロックされます（役所またはコンビニ等で再設定）。',
    validityJa: '発行から5回目の誕生日、または住所・氏名の変更時まで。',
    invalidationTriggerJa: '引越しによる住所変更や婚姻等による氏名変更で自動失効します。',
  },

  USER_AUTH_CERT: {
    nameJa: '利用者証明用電子証明書',
    nameI18n: {
      ja: '利用者証明用電子証明書',
      vi: 'Chứng thư xác thực người dùng (Đăng nhập Portal / Kiosk Combini)',
      en: 'User Authentication Electronic Certificate',
    },
    pinFormatJa: '数字4桁',
    pinFormatI18n: {
      ja: '数字4桁',
      vi: 'Mã PIN gồm đúng 4 chữ số',
      en: '4-digit numerical PIN',
    },
    lockoutRuleJa: '3回連続で間違えるとロックされます。',
    validityJa: '発行から5回目の誕生日まで（住所変更があっても失効しません）。',
    invalidationTriggerJa: '住所が変わっても失効せず、暗証番号もそのまま維持されます。',
  },
};

export const MYNUMBER_PROCEDURES_DATA = {
  [MYNUMBER_PROCEDURE_TYPES.CARD_APPLICATION]: {
    id: MYNUMBER_PROCEDURE_TYPES.CARD_APPLICATION,
    titleJa: 'マイナンバーカードの新規申請・受取',
    titleI18n: {
      ja: 'マイナンバーカードの新規申請・受取',
      vi: 'Đăng ký cấp mới và nhận thẻ My Number lần đầu',
      en: 'New My Number Card Application & Collection',
    },
    urgencyLevel: 'medium',
    requiredItemsI18n: {
      ja: ['個人番号通知書（または通知カード）', '交付申請書（QRコード付き）', '本人確認書類', '顔写真（6か月以内）'],
      vi: ['Giấy thông báo mã số cá nhân (hoặc thẻ thông báo)', 'Đơn xin cấp thẻ có mã QR', 'Giấy tờ tùy thân có ảnh', 'Ảnh thẻ (trong 6 tháng)'],
      en: ['Individual Number Notification', 'Application form with QR code', 'Photo ID', 'ID Photo (within 6 months)'],
    },
    stepsJa: [
      '郵送またはスマートフォン（申請書QRコード読取）からオンラインで顔写真付きで申請',
      '約1か月後に市区町村から自宅へ「交付通知書（ハガキ）」が届く',
      '交付通知書、本人確認書類、通知カード等を持参し、本人が市区町村窓口へ行き暗証番号を設定してカードを受領',
    ],
    stepsI18n: {
      vi: [
        'Đăng ký qua bưu điện hoặc trực tuyến bằng điện thoại (quét mã QR trên đơn), kèm ảnh chân dung.',
        'Khoảng 1 tháng sau, Tòa thị chính gửi bưu thiếp "Thông báo nhận thẻ" (交付通知書) về nhà.',
        'Tự mình mang bưu thiếp, giấy tờ tùy thân và thẻ/giấy thông báo đến quầy, đặt mã PIN và nhận thẻ.',
      ],
      en: [
        'Apply by mail or online via smartphone (scan the QR code on the form) with a photo.',
        'About one month later the municipality mails you a pick-up notice postcard (交付通知書).',
        'Bring the postcard, photo ID and notification card to the counter in person, set PINs and receive the card.',
      ],
    },
  },

  [MYNUMBER_PROCEDURE_TYPES.VISA_EXTENSION_RENEWAL]: {
    id: MYNUMBER_PROCEDURE_TYPES.VISA_EXTENSION_RENEWAL,
    titleJa: '在留期間更新に伴うマイナンバーカード有効期限延長',
    titleI18n: {
      ja: '在留期間更新に伴うマイナンバーカード有効期限延長',
      vi: 'Gia hạn thời hạn thẻ My Number khi gia hạn visa',
      en: 'My Number Card Extension upon Visa Renewal',
    },
    urgencyLevel: 'high',
    warningNoticeI18n: {
      ja: '【超重要】マイナンバーカードの有効期限は「現在の在留期限」と同じです。在留期限までに役所で有効期限の延長手続きを行わないと、カードは完全に失効（廃止）となり、有料での再発行が必要になります！',
      vi: '【CỰC KỲ QUAN TRỌNG】Thời hạn thẻ My Number của người nước ngoài trùng với hạn visa. Bạn PHẢI ra Tòa thị chính gia hạn thẻ TRƯỚC NGÀY HẾT HẠN in trên thẻ. Nếu để quá hạn dù chỉ 1 ngày, thẻ sẽ bị hủy vĩnh viễn và phải làm lại từ đầu mất phí!',
      en: '【CRITICAL】For foreign residents, the card expires on the exact day your visa expires. You MUST apply to extend it at city hall BEFORE the expiration date, otherwise the card is permanently cancelled and requires a paid re-issue.',
    },
    gracePeriodRuleJa: '特例期間の適用：在留資格の更新申請中であれば、入管の受付印またはオンライン申請受付完了メールを提示することで「最大2か月間」有効期限を暫定延長できます。',
    gracePeriodRuleI18n: {
      vi: 'Thời gian đặc lệ: nếu đang chờ kết quả gia hạn visa, mang thẻ cư trú có dấu tiếp nhận của Nyukan (hoặc email xác nhận nộp trực tuyến) đến Tòa thị chính để tạm gia hạn thẻ My Number tối đa 2 tháng.',
      en: 'Special period: while your visa renewal is pending, show the immigration receipt stamp (or online-application email) at city hall to provisionally extend the card by up to 2 months.',
    },
    requiredItemsI18n: {
      ja: ['現在のマイナンバーカード', '新しい在留カード（または更新申請中であることが分かるもの）', '数字4桁の暗証番号'],
      vi: ['Thẻ My Number hiện tại', 'Thẻ cư trú mới (hoặc Phiếu tiếp nhận đang gia hạn của Cục Xuất nhập cảnh)', 'Mã PIN 4 số'],
      en: ['Current My Number Card', 'New Residence Card (or proof of pending visa renewal)', '4-digit PIN'],
    },
    stepsJa: [
      '在留資格の更新許可を受けたら、新しい在留カードを持参して市区町村窓口へ',
      '在留期間更新中（特例期間）の場合は、有効期限満了日までに受付印付きカードを提示して2か月延長',
      '窓口端末で数字4桁の暗証番号を入力し、カード券面とICチップの有効期限を更新',
    ],
    stepsI18n: {
      vi: [
        'Sau khi được gia hạn visa, mang thẻ cư trú mới đến quầy Tòa thị chính.',
        'Nếu đang trong thời gian đặc lệ (chờ kết quả), mang thẻ cư trú có dấu tiếp nhận đến TRƯỚC ngày hết hạn để gia hạn tạm 2 tháng.',
        'Nhập mã PIN 4 số tại máy ở quầy để cập nhật hạn in trên thẻ và trong chip.',
      ],
      en: [
        'After your visa is renewed, bring the new residence card to city hall.',
        'If still pending (special period), go BEFORE the expiry date with the stamped card for a 2-month provisional extension.',
        'Enter your 4-digit PIN at the counter terminal to update the card and chip.',
      ],
    },
    tokuteiNoteI18n: {
      ja: '特定在留カード（在留カードとマイナンバーカードの一体化、令和8年6月14日開始）を持っている場合、在留期間更新のたびに特定在留カードの再申請が必要です。',
      vi: 'Nếu bạn dùng Thẻ cư trú đặc định (特定在留カード — gộp thẻ cư trú và thẻ My Number, từ 14/6/2026): mỗi lần gia hạn visa phải đăng ký lại thẻ đặc định, nếu không sẽ được cấp thẻ cư trú thường; chức năng My Number hết hạn theo hạn lưu trú cũ nếu không cập nhật tại Tòa thị chính. Nguồn: https://www.moj.go.jp/isa/tokutei.html',
      en: 'If you hold a Specified Residence Card (特定在留カード, residence card + My Number card, since 14 Jun 2026) you must re-apply for it at every renewal. Source: https://www.moj.go.jp/isa/tokutei.html',
    },
  },

  [MYNUMBER_PROCEDURE_TYPES.LOST_OR_STOLEN]: {
    id: MYNUMBER_PROCEDURE_TYPES.LOST_OR_STOLEN,
    titleJa: '紛失・盗難時の緊急一時利用停止と再発行',
    titleI18n: {
      ja: '紛失・盗難時の緊急一時利用停止と再発行',
      vi: 'Xử lý khẩn cấp khi mất thẻ My Number (Khóa thẻ & Làm lại)',
      en: 'Emergency Suspension & Reissue for Lost/Stolen Card',
    },
    urgencyLevel: 'critical',
    hotlineI18n: {
      ja: 'マイナンバー総合フリーダイヤル：0120-95-0178（24時間365日受付・通話料無料・外国語対応）',
      vi: 'Tổng đài khẩn cấp 24/7 (Miễn phí cước, hỗ trợ đa ngôn ngữ): 0120-95-0178',
      en: 'My Number Comprehensive Toll-Free Hotline: 0120-95-0178 (24/7/365, Multilingual)',
    },
    stepsJa: [
      '直ちにコールセンター（0120-95-0178）へ電話し、カードの電子証明書・機能を一時利用停止する',
      '最寄りの警察署・交番に遺失届（盗難届）を提出し、「受理番号」を控える',
      '市区町村役場の窓口へ行き、警察の受理番号を提示してカードの廃止届および再交付申請を行う',
    ],
    stepsI18n: {
      vi: [
        'Gọi NGAY tổng đài 0120-95-0178 (24/7, miễn phí) để tạm khóa thẻ và chứng thư điện tử.',
        'Trình báo mất tại đồn cảnh sát / koban (遺失届 hoặc 盗難届), ghi lại "số tiếp nhận" (受理番号).',
        'Đến quầy Tòa thị chính, xuất trình số tiếp nhận của cảnh sát để khai hủy thẻ cũ và xin cấp lại.',
      ],
      en: [
        'Call 0120-95-0178 (24/7, toll-free) immediately to suspend the card and certificates.',
        'File a lost/theft report at a police station or koban and note the receipt number.',
        'At city hall, show the police receipt number to cancel the card and apply for reissue.',
      ],
    },
    reissueFeeNoteJa: '紛失による再交付手数料は原則1,000円（カード800円＋電子証明書200円）です。',
    reissueFeeNoteI18n: {
      vi: 'Phí cấp lại do mất: thông thường 1,000円 (thẻ 800円 + chứng thư điện tử 200円).',
      en: 'Reissue fee for a lost card: normally 1,000 JPY (card 800 + certificates 200).',
    },
  },

  [MYNUMBER_PROCEDURE_TYPES.PIN_RESET_LOCKOUT]: {
    id: MYNUMBER_PROCEDURE_TYPES.PIN_RESET_LOCKOUT,
    titleJa: '暗証番号を忘れた・ロックされた場合の初期化・再設定',
    titleI18n: {
      ja: '暗証番号を忘れた・ロックされた場合の初期化・再設定',
      vi: 'Mở khóa hoặc đặt lại mã PIN khi bị khóa / quên mật khẩu',
      en: 'PIN Reset & Lockout Recovery',
    },
    urgencyLevel: 'medium',
    lockoutDetailsJa: '署名用（6〜16桁）は5回連続、利用者証明用（数字4桁）は3回連続で間違えるとロックがかかります。',
    lockoutDetailsI18n: {
      vi: 'Mã chữ ký số (6–16 ký tự) bị khóa sau 5 lần nhập sai liên tiếp; mã PIN 4 số bị khóa sau 3 lần sai liên tiếp.',
      en: 'Signature PIN (6–16 chars) locks after 5 wrong tries; the 4-digit PIN locks after 3.',
    },
    recoveryChannelsI18n: {
      vi: [
        '【Quầy Tòa thị chính】Mang giấy tờ tùy thân, đặt lại mã ngay trong ngày.',
        '【Combini (chỉ mã chữ ký số)】Đặt lịch trước bằng ứng dụng điện thoại rồi đặt lại tại kiosk (ví dụ 7-Eleven) — chỉ khi còn nhớ mã PIN 4 số.',
      ],
      en: [
        '【City hall】Bring photo ID and reset the same day.',
        '【Convenience store (signature PIN only)】Reserve via the smartphone app, then reset at a kiosk — only if you know your 4-digit PIN.',
      ],
    },
    recoveryChannelsJa: [
      '【役所窓口】本人確認書類を持参して市区町村窓口で即日再設定可能。',
      '【コンビニ（署名用のみ）】スマートフォン専用アプリで事前予約を行い、セブン-イレブン等のキオスク端末で再設定可能（※利用者証明用暗証番号が分かる場合に限る）。',
    ],
  },

  [MYNUMBER_PROCEDURE_TYPES.ADDRESS_NAME_CHANGE]: {
    id: MYNUMBER_PROCEDURE_TYPES.ADDRESS_NAME_CHANGE,
    titleJa: '引越し・改姓に伴う券面記載事項変更と署名用証明書再発行',
    titleI18n: {
      ja: '引越し・改姓に伴う券面記載事項変更と署名用証明書再発行',
      vi: 'Cập nhật địa chỉ / họ tên trên thẻ và cấp lại chứng thư chữ ký số',
      en: 'Address/Name Change on Card & Signature Cert Re-issuance',
    },
    urgencyLevel: 'high',
    statutoryDeadlineJa: '引越しをした日から14日以内（住民基本台帳法）',
    statutoryDeadlineI18n: {
      vi: 'Trong vòng 14 ngày kể từ ngày chuyển đến (Luật Đăng ký cư dân cơ bản).',
      en: 'Within 14 days of moving (Basic Resident Registration Act).',
    },
    invalidationWarningJa: '住所が変わると「署名用電子証明書（6〜16桁）」は法律上自動失効します。役所窓口で再発行手続きを行わないとe-Taxや確定申告、オンライン転出ができなくなります。',
    invalidationWarningI18n: {
      vi: 'Khi đổi địa chỉ, "chứng thư chữ ký số" (mã 6–16 ký tự) tự động mất hiệu lực. Nếu không làm lại tại Tòa thị chính, bạn không dùng được e-Tax, khai thuế hay chuyển đi trực tuyến.',
      en: 'An address change automatically invalidates the signature certificate; reissue it at city hall to keep using e-Tax and online moving.',
    },
  },

  [MYNUMBER_PROCEDURE_TYPES.ELECTRONIC_CERT_RENEWAL]: {
    id: MYNUMBER_PROCEDURE_TYPES.ELECTRONIC_CERT_RENEWAL,
    titleJa: '電子証明書の有効期限更新（5年ごとの更新）',
    titleI18n: {
      ja: '電子証明書の有効期限更新（5年ごとの更新）',
      vi: 'Gia hạn chứng thư số điện tử (Định kỳ mỗi 5 năm)',
      en: 'Electronic Certificate Renewal (Every 5 Years)',
    },
    urgencyLevel: 'medium',
    detailsJa: 'カード自体の有効期限とは別に、電子証明書は発行から5回目の誕生日で満了します。満了の約3か月前にJ-LISから有効期限通知書が届きます。役所窓口で無料で更新可能です。',
    detailsI18n: {
      vi: 'Tách biệt với hạn của thẻ, chứng thư điện tử hết hạn vào sinh nhật lần thứ 5 kể từ khi cấp. Khoảng 3 tháng trước, J-LIS gửi thông báo hết hạn. Gia hạn miễn phí tại quầy Tòa thị chính.',
      en: 'Separately from the card, certificates expire on the 5th birthday after issuance. J-LIS mails a notice about 3 months before; renew free at city hall.',
    },
  },

  [MYNUMBER_PROCEDURE_TYPES.SMARTPHONE_SETUP]: {
    id: MYNUMBER_PROCEDURE_TYPES.SMARTPHONE_SETUP,
    titleJa: 'スマホ用電子証明書（スマホでマイナンバー）',
    titleI18n: {
      ja: 'スマホ用電子証明書（スマホでマイナンバー）',
      vi: 'Cài đặt thẻ My Number trên điện thoại thông minh',
      en: 'Smartphone Electronic Certificate',
    },
    urgencyLevel: 'low',
    platformDifferencesJa: {
      android: 'Android対応端末：マイナポータルアプリから申込み可能。コンビニ交付、健康保険証、各種民間サービスに対応。',
      iphone: 'iPhone（Appleウォレット）：2025年6月24日から「iPhoneのマイナンバーカード」提供開始。マイナポータルへのログイン等で利用可能。',
    },
    platformDifferencesI18n: {
      vi: {
        android: 'Android (máy hỗ trợ): đăng ký qua ứng dụng MynaPortal; dùng được cho in giấy tại combini, thẻ bảo hiểm y tế và nhiều dịch vụ.',
        iphone: 'iPhone (Apple Wallet): từ 24/6/2025 đã có "Thẻ My Number trên iPhone"; dùng để đăng nhập MynaPortal và xác minh danh tính. Nguồn: https://services.digital.go.jp/mynumbercard-iphone/',
      },
      en: {
        android: 'Android (supported models): apply via the MynaPortal app; works for konbini issuance, health insurance and more.',
        iphone: 'iPhone (Apple Wallet): "My Number Card on iPhone" available since 24 Jun 2025. Source: https://services.digital.go.jp/mynumbercard-iphone/',
      },
    },
    caveatJa: '物理カードの完全な代替ではないため、役所窓口や一部手続では物理カードの提示が引き続き求められます。',
    caveatI18n: {
      vi: 'Không thay thế hoàn toàn thẻ vật lý — một số thủ tục tại quầy vẫn yêu cầu xuất trình thẻ thật.',
      en: 'Not a full replacement for the physical card; some procedures still require it.',
    },
    sourceUrl: 'https://services.digital.go.jp/mynumbercard-iphone/',
  },

  [MYNUMBER_PROCEDURE_TYPES.TOKUTEI_ZAIRYU_CARD]: {
    id: MYNUMBER_PROCEDURE_TYPES.TOKUTEI_ZAIRYU_CARD,
    titleJa: '特定在留カード（在留カードとマイナンバーカードの一体化）',
    titleI18n: {
      ja: '特定在留カード（在留カードとマイナンバーカードの一体化）',
      vi: 'Thẻ cư trú đặc định (特定在留カード) — gộp thẻ cư trú và thẻ My Number',
      en: 'Specified Residence Card (residence card + My Number card)',
    },
    urgencyLevel: 'low',
    // Nguồn: https://www.moj.go.jp/isa/tokutei.html (kiểm tra 2026-09-27)
    detailsJa: '令和8年6月14日開始。住民基本台帳に記録されている中長期在留者等が、地方出入国在留管理官署または市区町村窓口で申請可能。取得は任意で、従来どおり2枚持つことも可能。即日交付不可（2週間以上）。在留期間更新のたびに再申請が必要。',
    detailsI18n: {
      vi: 'Bắt đầu từ 14/6/2026. Người lưu trú trung/dài hạn có đăng ký cư trú có thể đăng ký tại Cục Xuất nhập cảnh hoặc Tòa thị chính. KHÔNG bắt buộc — vẫn có thể giữ 2 thẻ riêng. Không cấp trong ngày (từ 2 tuần). Mỗi lần gia hạn visa phải đăng ký lại. Lệ phí: xem trang chính thức.',
      en: 'Started 14 Jun 2026. Optional; apply at immigration or city hall; no same-day issuance (2+ weeks); must re-apply at each renewal.',
    },
    sourceUrl: 'https://www.moj.go.jp/isa/tokutei.html',
  },
};

/**
 * Get guidance for a specific My Number procedure.
 * @param {string} procedureType
 * @returns {object|null}
 */
export function getMyNumberProcedureGuidance(procedureType) {
  return MYNUMBER_PROCEDURES_DATA[procedureType] || null;
}

/**
 * Get all supported My Number procedures.
 */
export function getAllMyNumberProcedures() {
  return Object.values(MYNUMBER_PROCEDURES_DATA);
}

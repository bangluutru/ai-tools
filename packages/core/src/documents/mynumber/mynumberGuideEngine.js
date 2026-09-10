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
    reissueFeeNoteJa: '紛失による再交付手数料は原則1,000円（カード800円＋電子証明書200円）です。',
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
    invalidationWarningJa: '住所が変わると「署名用電子証明書（6〜16桁）」は法律上自動失効します。役所窓口で再発行手続きを行わないとe-Taxや確定申告、オンライン転出ができなくなります。',
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
      iphone: 'iPhone（Apple Wallet）：順次対応拡大中。マイナポータルへのログイン等で利用可能。',
    },
    caveatJa: '物理カードの完全な代替ではないため、役所窓口や一部手続では物理カードの提示が引き続き求められます。',
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

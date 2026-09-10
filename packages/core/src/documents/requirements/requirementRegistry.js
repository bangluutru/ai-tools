/**
 * @file requirementRegistry.js
 * Contextual DocumentRequirement registry.
 * 
 * CORE ARCHITECTURAL RULE:
 * This file binds a Procedure to a Document with specific validity rules:
 * - maxAgeMonths (freshness: e.g. 3 months)
 * - originalOrCopy ('original_only', 'copy_acceptable', 'presentation_only')
 * - specific fields required (e.g. 続柄記載, 国籍記載)
 * - prohibited fields (e.g. マイナンバー記載不可)
 * - fiscalYearRule (e.g. 'latest_completed_year', 'past_5_years')
 */

export const REQUIREMENT_NECESSITY = {
  MANDATORY: 'mandatory',
  CONDITIONAL: 'conditional',
  IF_APPLICABLE: 'if_applicable',
  OPTIONAL: 'optional',
};

export const ORIGINAL_OR_COPY = {
  ORIGINAL_ONLY: 'original_only',
  COPY_ACCEPTABLE: 'copy_acceptable',
  PRESENTATION_ONLY: 'presentation_only', // Show original, no submission kept
  ELECTRONIC_ACCEPTABLE: 'electronic_acceptable',
};

export const CANONICAL_REQUIREMENTS = {
  // ==========================================
  // 1. Residence Status Renewal (在留期間更新)
  // ==========================================
  'req.renewal.passport': {
    id: 'req.renewal.passport',
    procedureId: 'procedure.residence-status-renewal',
    documentId: 'document.passport',
    necessity: REQUIREMENT_NECESSITY.MANDATORY,
    maxAgeMonths: null,
    originalOrCopy: ORIGINAL_OR_COPY.PRESENTATION_ONLY,
    copiesCount: 0,
    cautionNoteI18n: {
      ja: '申請窓口で提示（提出・預け入れは不要）。オンライン申請時はスマホ読取または券面確認。',
      vi: 'Xuất trình bản gốc tại quầy (không bị giữ lại). Khi nộp online thì đọc chip qua app.',
      en: 'Present original at the counter (not retained). Read chip or verify details for online filing.',
    },
  },

  'req.renewal.residence-card': {
    id: 'req.renewal.residence-card',
    procedureId: 'procedure.residence-status-renewal',
    documentId: 'document.residence-card',
    necessity: REQUIREMENT_NECESSITY.MANDATORY,
    maxAgeMonths: null,
    originalOrCopy: ORIGINAL_OR_COPY.PRESENTATION_ONLY,
    copiesCount: 0,
    cautionNoteI18n: {
      ja: '申請窓口で提示。新しい在留カード受取時に裏面にパンチ穴が開けられて無効化されます。',
      vi: 'Xuất trình tại quầy. Khi nhận thẻ mới sẽ được đục lỗ vô hiệu hóa thẻ cũ.',
      en: 'Present at counter. The current card is hole-punched and returned when picking up the new card.',
    },
  },

  'req.renewal.resident-record': {
    id: 'req.renewal.resident-record',
    procedureId: 'procedure.residence-status-renewal',
    documentId: 'document.resident-record-copy',
    necessity: REQUIREMENT_NECESSITY.MANDATORY,
    maxAgeMonths: 3, // Freshness rule: issued within 3 months
    originalOrCopy: ORIGINAL_OR_COPY.ORIGINAL_ONLY,
    copiesCount: 1,
    requiredFieldsJa: [
      '世帯全員の記載があるもの（世帯全員分）',
      '続柄の記載があるもの',
      '国籍・地域、在留資格、在留期間等の記載があるもの',
    ],
    prohibitedFieldsJa: [
      'マイナンバー（個人番号）の記載がないもの（厳禁。マイナンバーが記載されていると受理されません）',
    ],
    conditionSummaryI18n: {
      ja: '発行日から3か月以内の原本。世帯全員分で、マイナンバー記載のないもの。',
      vi: 'Bản gốc cấp trong vòng 3 tháng. Lấy bản toàn bộ gia đình, TUYỆT ĐỐI KHÔNG in mã My Number.',
      en: 'Original issued within 3 months. Must cover all household members and MUST NOT include My Number.',
    },
  },

  'req.renewal.taxation-cert': {
    id: 'req.renewal.taxation-cert',
    procedureId: 'procedure.residence-status-renewal',
    documentId: 'document.taxation-certificate',
    necessity: REQUIREMENT_NECESSITY.MANDATORY,
    maxAgeMonths: 3,
    originalOrCopy: ORIGINAL_OR_COPY.ORIGINAL_ONLY,
    copiesCount: 1,
    fiscalYearRule: 'latest_completed_year',
    conditionSummaryI18n: {
      ja: '直近1年分の総所得金額及び課税額が記載された原本（直近年度分、発行後3か月以内）。',
      vi: 'Bản gốc ghi nhận thu nhập và số thuế của 1 năm gần nhất (cấp trong vòng 3 tháng).',
      en: 'Original certificate of the latest year showing total income and tax assessment (within 3 months).',
    },
  },

  'req.renewal.tax-payment-cert': {
    id: 'req.renewal.tax-payment-cert',
    procedureId: 'procedure.residence-status-renewal',
    documentId: 'document.tax-payment-certificate',
    necessity: REQUIREMENT_NECESSITY.MANDATORY,
    maxAgeMonths: 3,
    originalOrCopy: ORIGINAL_OR_COPY.ORIGINAL_ONLY,
    copiesCount: 1,
    fiscalYearRule: 'latest_completed_year',
    conditionSummaryI18n: {
      ja: '直近1年分の住民税の納期が到来している税額について未納がないことの証明（原本、3か月以内）。',
      vi: 'Bản gốc chứng nhận đã nộp đủ thuế cư trú của 1 năm gần nhất, không có nợ thuế (trong vòng 3 tháng).',
      en: 'Original certificate verifying all due inhabitant tax for the latest year has been paid with zero arrears.',
    },
  },

  'req.renewal.employment-cert': {
    id: 'req.renewal.employment-cert',
    procedureId: 'procedure.residence-status-renewal',
    documentId: 'document.certificate-of-employment',
    necessity: REQUIREMENT_NECESSITY.MANDATORY,
    maxAgeMonths: 3,
    originalOrCopy: ORIGINAL_OR_COPY.ORIGINAL_ONLY,
    copiesCount: 1,
    conditionSummaryI18n: {
      ja: '勤務先が発行する在職証明書（発行後3か月以内）。',
      vi: 'Giấy chứng nhận đang làm việc do công ty cấp (trong vòng 3 tháng).',
      en: 'Certificate of Employment issued by your company (issued within 3 months).',
    },
  },

  // ==========================================
  // 2. Permanent Residence (永住許可申請)
  // ==========================================
  'req.pr.resident-record': {
    id: 'req.pr.resident-record',
    procedureId: 'procedure.permanent-residence-application',
    documentId: 'document.resident-record-copy',
    necessity: REQUIREMENT_NECESSITY.MANDATORY,
    maxAgeMonths: 3,
    originalOrCopy: ORIGINAL_OR_COPY.ORIGINAL_ONLY,
    copiesCount: 1,
    requiredFieldsJa: ['世帯全員の記載', '続柄記載', '国籍・在留資格等の記載'],
    prohibitedFieldsJa: ['マイナンバーの記載がないもの（厳禁）'],
  },

  'req.pr.taxation-5years': {
    id: 'req.pr.taxation-5years',
    procedureId: 'procedure.permanent-residence-application',
    documentId: 'document.taxation-certificate',
    necessity: REQUIREMENT_NECESSITY.MANDATORY,
    maxAgeMonths: 3,
    originalOrCopy: ORIGINAL_OR_COPY.ORIGINAL_ONLY,
    copiesCount: 1,
    fiscalYearRule: 'past_5_years', // General employment category requires 5 years (Spouse requires 3 years)
    conditionSummaryI18n: {
      ja: '直近5年分（配偶者等の場合は3年分）の住民税の課税（非課税）証明書（原本、3か月以内）。',
      vi: 'Bản gốc giấy chứng nhận tính thuế cư trú trong 5 năm gần nhất (3 năm đối với diện kết hôn).',
      en: 'Original Inhabitant Tax Taxation Certificates for the past 5 years (3 years for spouse category).',
    },
  },

  'req.pr.tax-payment-5years': {
    id: 'req.pr.tax-payment-5years',
    procedureId: 'procedure.permanent-residence-application',
    documentId: 'document.tax-payment-certificate',
    necessity: REQUIREMENT_NECESSITY.MANDATORY,
    maxAgeMonths: 3,
    originalOrCopy: ORIGINAL_OR_COPY.ORIGINAL_ONLY,
    copiesCount: 1,
    fiscalYearRule: 'past_5_years',
    conditionSummaryI18n: {
      ja: '直近5年分（配偶者等の場合は3年分）の住民税の納税証明書（納期限内に納付されていること）。',
      vi: 'Bản gốc chứng nhận đã nộp đủ thuế cư trú trong 5 năm gần nhất (phải nộp đúng hạn 100%).',
      en: 'Original Inhabitant Tax Payment Certificates for the past 5 years (must show on-time payments).',
    },
  },

  'req.pr.national-tax-cert': {
    id: 'req.pr.national-tax-cert',
    procedureId: 'procedure.permanent-residence-application',
    documentId: 'document.national-tax-payment-cert',
    necessity: REQUIREMENT_NECESSITY.MANDATORY,
    maxAgeMonths: 3,
    originalOrCopy: ORIGINAL_OR_COPY.ORIGINAL_ONLY,
    copiesCount: 1,
    conditionSummaryI18n: {
      ja: '税務署発行の「納税証明書（その3）」等の国税（源泉所得税、申告所得税、消費税等）に未納がない証明。',
      vi: 'Giấy chứng nhận nộp thuế quốc gia (Mẫu số 3) từ Chi cục Thuế (Zeimusho) chứng minh không nợ thuế.',
      en: 'National Tax Payment Certificate (Part 3) issued by Tax Office verifying no national tax arrears.',
    },
  },

  // ==========================================
  // 3. Child Allowance Claim (児童手当認定請求)
  // ==========================================
  'req.child-allowance.resident-record': {
    id: 'req.child-allowance.resident-record',
    procedureId: 'procedure.child-allowance-claim',
    documentId: 'document.resident-record-copy',
    necessity: REQUIREMENT_NECESSITY.CONDITIONAL,
    maxAgeMonths: 1,
    originalOrCopy: ORIGINAL_OR_COPY.ORIGINAL_ONLY,
    copiesCount: 1,
    conditionSummaryI18n: {
      ja: '児童と別居している場合等に必要。同一市区町村内で同居の場合は住民基本台帳で確認できるため原則不要。',
      vi: 'Cần nộp nếu con ở khác địa chỉ. Nếu sống cùng địa chỉ trong cùng quận/huyện thì Tòa thị chính tự tra cứu.',
      en: 'Required if residing separately from child. Usually not needed if living together in same municipality.',
    },
  },

  'req.child-allowance.taxation-cert': {
    id: 'req.child-allowance.taxation-cert',
    procedureId: 'procedure.child-allowance-claim',
    documentId: 'document.taxation-certificate',
    necessity: REQUIREMENT_NECESSITY.CONDITIONAL,
    maxAgeMonths: 3,
    originalOrCopy: ORIGINAL_OR_COPY.ORIGINAL_ONLY,
    copiesCount: 1,
    fiscalYearRule: 'latest_completed_year',
    conditionSummaryI18n: {
      ja: 'その年の1月1日時点で他の市区町村に住んでいた場合のみ必要（所得連携ができない場合）。',
      vi: 'Chỉ cần nộp nếu vào ngày 1 tháng 1 bạn cư trú tại địa phương khác (khi chưa liên kết dữ liệu qua mạng).',
      en: 'Required only if you resided in a different municipality on January 1 of that fiscal year.',
    },
  },

  'req.child-allowance.mynumber': {
    id: 'req.child-allowance.mynumber',
    procedureId: 'procedure.child-allowance-claim',
    documentId: 'document.mynumber-card',
    necessity: REQUIREMENT_NECESSITY.MANDATORY,
    maxAgeMonths: null,
    originalOrCopy: ORIGINAL_OR_COPY.PRESENTATION_ONLY,
    copiesCount: 0,
    conditionSummaryI18n: {
      ja: '請求者本人および配偶者のマイナンバー確認と本人確認のために提示（または番号通知＋身元確認書類）。',
      vi: 'Xuất trình để xác thực mã số cá nhân của người làm đơn và vợ/chồng.',
      en: 'Present to verify Individual Numbers and identity of applicant and spouse.',
    },
  },

  // ==========================================
  // 4. Moving In Notification (転入届)
  // ==========================================
  'req.moving-in.mynumber-card': {
    id: 'req.moving-in.mynumber-card',
    procedureId: 'procedure.moving-in-notification',
    documentId: 'document.mynumber-card',
    necessity: REQUIREMENT_NECESSITY.MANDATORY,
    maxAgeMonths: null,
    originalOrCopy: ORIGINAL_OR_COPY.PRESENTATION_ONLY,
    copiesCount: 0,
    cautionNoteI18n: {
      ja: '転入する世帯全員分のマイナンバーカードを持参し、券面住所変更と署名用電子証明書の再発行を行います（暗証番号必要）。',
      vi: 'Mang thẻ của tất cả thành viên chuyển đến để cập nhật địa chỉ trên thẻ và cấp lại chứng thư chữ ký số (cần nhớ PIN).',
      en: 'Bring cards of all moving members to update address on chip and re-issue signature certificates (PIN required).',
    },
  },

  'req.moving-in.residence-card': {
    id: 'req.moving-in.residence-card',
    procedureId: 'procedure.moving-in-notification',
    documentId: 'document.residence-card',
    necessity: REQUIREMENT_NECESSITY.MANDATORY,
    maxAgeMonths: null,
    originalOrCopy: ORIGINAL_OR_COPY.PRESENTATION_ONLY,
    copiesCount: 0,
    cautionNoteI18n: {
      ja: '外国人住民全員の在留カード原本を持参。裏面の住居地記載欄に新住所が印字・裏書きされます。',
      vi: 'Mang thẻ ngoại kiều gốc của tất cả thành viên. Nhân viên Tòa thị chính sẽ in địa chỉ mới vào mặt sau thẻ.',
      en: 'Bring original residence cards of all foreign members. The new address is printed on the back.',
    },
  },

  // ==========================================
  // 5. Unemployment Claim (失業給付受給手続)
  // ==========================================
  'req.unemployment.separation-cert': {
    id: 'req.unemployment.separation-cert',
    procedureId: 'procedure.employment-insurance-benefit-claim',
    documentId: 'document.employment-separation-certificate',
    necessity: REQUIREMENT_NECESSITY.MANDATORY,
    maxAgeMonths: null, // As soon as received from employer
    originalOrCopy: ORIGINAL_OR_COPY.ORIGINAL_ONLY,
    copiesCount: 1,
    conditionSummaryI18n: {
      ja: '会社から送付される「離職票-1」および「離職票-2」の原本（ハローワーク印のあるもの）。',
      vi: 'Bản gốc Phiếu nghỉ việc Rishokuhyo-1 và Rishokuhyo-2 do công ty gửi (đã có dấu xác nhận của Hello Work).',
      en: 'Original Separation Slips Form 1 & 2 sent by your employer (bearing official Hello Work stamp).',
    },
  },

  'req.unemployment.withholding-slip': {
    id: 'req.unemployment.withholding-slip',
    procedureId: 'procedure.employment-insurance-benefit-claim',
    documentId: 'document.withholding-tax-slip',
    necessity: REQUIREMENT_NECESSITY.OPTIONAL,
    maxAgeMonths: null,
    originalOrCopy: ORIGINAL_OR_COPY.COPY_ACCEPTABLE,
    copiesCount: 1,
    conditionSummaryI18n: {
      ja: '失業給付自体には必須ではありませんが、確定申告や住民税減免の申請時に必要となるため保管を推奨。',
      vi: 'Không bắt buộc khi nộp đơn thất nghiệp, nhưng rất cần khi làm thủ tục xin miễn giảm thuế/Nenkin sau đó.',
      en: 'Not strictly required for benefit claim, but highly recommended to keep for tax exemption filing.',
    },
  },
};

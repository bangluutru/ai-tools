/**
 * @file documentRegistry.js
 * Canonical registry of official administrative documents and certificates in Japan.
 * 
 * CORE ARCHITECTURAL RULE:
 * DocumentDefinition represents the canonical identity of a document.
 * It does NOT contain procedure-specific validity periods (e.g. maxAgeMonths: 3).
 * Freshness belongs strictly to DocumentRequirement.
 */

import { ACQUISITION_CHANNELS } from '../acquisition/acquisitionChannels.js';

export const DOCUMENT_CATEGORIES = {
  IDENTITY_RESIDENCE: 'identity_residence',
  FAMILY_REGISTER: 'family_register',
  TAX_INCOME: 'tax_income',
  EMPLOYMENT_LABOR: 'employment_labor',
  CIVIL_REGISTRATION: 'civil_registration',
  SOCIAL_INSURANCE: 'social_insurance',
  OTHER: 'other',
};

export const ISSUER_TYPES = {
  MUNICIPAL_CURRENT_RESIDENCE: 'municipal_current_residence',
  MUNICIPAL_REGISTERED_DOMICILE: 'municipal_registered_domicile',
  MUNICIPAL_TAX_RESIDENCE: 'municipal_tax_residence',
  NATIONAL_TAX_OFFICE: 'national_tax_office',
  IMMIGRATION_AGENCY: 'immigration_agency',
  PUBLIC_EMPLOYMENT_OFFICE: 'public_employment_office',
  PENSION_SERVICE: 'pension_service',
  EMPLOYER: 'employer',
  FOREIGN_EMBASSY: 'foreign_embassy',
  LEGAL_AFFAIRS_BUREAU: 'legal_affairs_bureau',
};

export const SENSITIVITY_TIERS = {
  PUBLIC_METADATA: 'public_metadata',
  PERSONAL: 'personal',
  SENSITIVE_IDENTIFYING: 'sensitive_identifying',
  HIGHLY_SENSITIVE: 'highly_sensitive',
};

export const CANONICAL_DOCUMENTS = {
  // 1. Jūminhyō no Utsushi
  'document.resident-record-copy': {
    id: 'document.resident-record-copy',
    canonicalNameJa: '住民票の写し',
    nameI18n: {
      ja: '住民票の写し',
      vi: 'Bản sao Phiếu cư trú',
      en: 'Certificate of Residence (Copy of Resident Record)',
    },
    aliases: [
      '住民票',
      'じゅうみんひょう',
      'resident certificate',
      'copy of resident record',
      'juminhyo',
      'phieu cu tru',
      'giay cu tru',
      'so ho khau nhat',
    ],
    category: DOCUMENT_CATEGORIES.IDENTITY_RESIDENCE,
    issuerType: ISSUER_TYPES.MUNICIPAL_CURRENT_RESIDENCE,
    sensitivity: SENSITIVITY_TIERS.PERSONAL,
    statutoryBasis: {
      lawJa: '住民基本台帳法 第12条',
      lawEn: 'Basic Resident Registration Act, Article 12',
    },
    descriptionI18n: {
      ja: '現住所の市区町村において住民として記録されている事実（住所、氏名、生年月日、世帯主・続柄等）を証明する公的書類。',
      vi: 'Văn bản chính thức xác nhận việc đăng ký thường trú tại Tòa thị chính nơi đang sinh sống (địa chỉ, họ tên, ngày sinh, chủ hộ, quan hệ gia đình).',
      en: 'Official document certifying residential registration (address, full name, birth date, head of household, family relations) in your current municipality.',
    },
    supportedChannels: [
      ACQUISITION_CHANNELS.MUNICIPAL_COUNTER,
      ACQUISITION_CHANNELS.CONVENIENCE_STORE,
      ACQUISITION_CHANNELS.MYNA_PORTAL_ONLINE,
      ACQUISITION_CHANNELS.MAIL_REQUEST,
    ],
    officialSourceId: 'src.statutory.resident-registration-act',
    containsSensitiveData: false,
    optionsNoticeJa: '世帯全員／世帯一部、続柄記載の有無、本籍・国籍等の記載の有無を選択可能。マイナンバーは原則省略。',
  },

  // 2. Jūminhyō Kisaijikō Shōmeisho
  'document.resident-record-items-cert': {
    id: 'document.resident-record-items-cert',
    canonicalNameJa: '住民票記載事項証明書',
    nameI18n: {
      ja: '住民票記載事項証明書',
      vi: 'Giấy chứng nhận các mục ghi trong Phiếu cư trú',
      en: 'Certificate of Items Stated in Resident Record',
    },
    aliases: [
      '住民票記載事項証明',
      '記載事項証明',
      'certificate of items stated',
      'juminhyo kisai jiko',
      'giay chung nhan muc ghi phieu cu tru',
    ],
    category: DOCUMENT_CATEGORIES.IDENTITY_RESIDENCE,
    issuerType: ISSUER_TYPES.MUNICIPAL_CURRENT_RESIDENCE,
    sensitivity: SENSITIVITY_TIERS.PERSONAL,
    statutoryBasis: {
      lawJa: '住民基本台帳法 第12条の2',
      lawEn: 'Basic Resident Registration Act, Article 12-2',
    },
    descriptionI18n: {
      ja: '住民票のうち、勤務先や提出先が指定した特定の事項（氏名、住所、生年月日等のみ）が事実と相違ないことを市区町村が証明する書類。',
      vi: 'Giấy do Tòa thị chính đóng dấu xác nhận rằng các mục chỉ định (họ tên, địa chỉ, ngày sinh) trên mẫu của công ty khớp với thông tin trong sổ cư trú.',
      en: 'Certificate verifying that specific required items (e.g. name, address, DOB) accurately match the resident record, avoiding excess disclosure.',
    },
    supportedChannels: [
      ACQUISITION_CHANNELS.MUNICIPAL_COUNTER,
      ACQUISITION_CHANNELS.CONVENIENCE_STORE,
      ACQUISITION_CHANNELS.MAIL_REQUEST,
    ],
    officialSourceId: 'src.statutory.resident-registration-act',
    containsSensitiveData: false,
  },

  // 3. Inkan Tōroku Shōmeisho
  'document.seal-registration-certificate': {
    id: 'document.seal-registration-certificate',
    canonicalNameJa: '印鑑登録証明書',
    nameI18n: {
      ja: '印鑑登録証明書',
      vi: 'Giấy chứng nhận đăng ký con dấu',
      en: 'Seal Registration Certificate',
    },
    aliases: [
      '印鑑証明',
      '印鑑登録証明',
      'いんかんしょうめい',
      'seal certificate',
      'registered seal cert',
      'inkan shomei',
      'giay chung nhan con dau',
      'chung nhan inkan',
    ],
    category: DOCUMENT_CATEGORIES.CIVIL_REGISTRATION,
    issuerType: ISSUER_TYPES.MUNICIPAL_CURRENT_RESIDENCE,
    sensitivity: SENSITIVITY_TIERS.SENSITIVE_IDENTIFYING,
    statutoryBasis: {
      lawJa: '市区町村印鑑条例',
      lawEn: 'Municipal Seal Registration Ordinances',
    },
    descriptionI18n: {
      ja: '市区町村に登録された個人の実印（公式印鑑）の印影と登録者の身元を公的に証明する書類。不動産登記や自動車売買、融資契約等で使用。',
      vi: 'Giấy chứng nhận dấu mộc cá nhân chính thức (Jitsuin) đã đăng ký với chính quyền, dùng trong các giao dịch lớn như mua xe, mua nhà, vay vốn ngân hàng.',
      en: 'Official certificate verifying that the registered seal impression matches the individual. Required for major legal contracts and property purchases.',
    },
    supportedChannels: [
      ACQUISITION_CHANNELS.MUNICIPAL_COUNTER,
      ACQUISITION_CHANNELS.CONVENIENCE_STORE,
    ],
    officialSourceId: 'src.statutory.municipal-seal-ordinance',
    containsSensitiveData: true,
  },

  // 4. Jūminzei Kazei Shōmeisho
  'document.taxation-certificate': {
    id: 'document.taxation-certificate',
    canonicalNameJa: '住民税課税証明書（非課税証明書）',
    nameI18n: {
      ja: '住民税課税証明書（非課税証明書）',
      vi: 'Giấy chứng nhận tính thuế cư trú (Chứng nhận đóng thuế)',
      en: 'Inhabitant Tax Taxation Certificate (Certificate of Tax Assessment)',
    },
    aliases: [
      '課税証明書',
      'かぜいしょうめい',
      '非課税証明書',
      '住民税課税証明',
      'taxation certificate',
      'tax assessment certificate',
      'kazei shomeisho',
      'giay chung nhan tinh thue',
      'giay chung nhan thue cu tru',
    ],
    category: DOCUMENT_CATEGORIES.TAX_INCOME,
    issuerType: ISSUER_TYPES.MUNICIPAL_TAX_RESIDENCE, // Jan 1 residence
    sensitivity: SENSITIVITY_TIERS.SENSITIVE_IDENTIFYING,
    statutoryBasis: {
      lawJa: '地方税法 第20条の10',
      lawEn: 'Local Tax Act, Article 20-10',
    },
    descriptionI18n: {
      ja: '前年中の所得金額、各種控除額、およびそれらに基づいて決定された当該年度の住民税額を証明する公的書類。その年の1月1日時点の住所地で発行。',
      vi: 'Văn bản xác nhận tổng thu nhập năm trước, các khoản khấu trừ và số tiền thuế cư trú được ấn định. Do Tòa thị chính nơi cư trú vào ngày 1 tháng 1 cấp.',
      en: 'Official certificate stating previous year income, deductions, and assessed inhabitant tax. Issued by the municipality where you resided on January 1.',
    },
    supportedChannels: [
      ACQUISITION_CHANNELS.MUNICIPAL_COUNTER,
      ACQUISITION_CHANNELS.CONVENIENCE_STORE,
      ACQUISITION_CHANNELS.MAIL_REQUEST,
      ACQUISITION_CHANNELS.MYNA_PORTAL_ONLINE,
    ],
    officialSourceId: 'src.statutory.local-tax-act',
    containsSensitiveData: true,
    importantJurisdictionNoteJa: '発行元は現住所ではなく「証明したい年度の1月1日時点に住民票があった市区町村」です。',
  },

  // 5. Shotoku Shōmeisho
  'document.tax-income-certificate': {
    id: 'document.tax-income-certificate',
    canonicalNameJa: '所得証明書',
    nameI18n: {
      ja: '所得証明書',
      vi: 'Giấy chứng nhận thu nhập (Sở đắc chứng minh)',
      en: 'Income Certificate',
    },
    aliases: [
      '所得証明',
      'しょとくしょうめい',
      '収入証明書',
      'income certificate',
      'shotoku shomei',
      'giay chung nhan thu nhap',
    ],
    category: DOCUMENT_CATEGORIES.TAX_INCOME,
    issuerType: ISSUER_TYPES.MUNICIPAL_TAX_RESIDENCE,
    sensitivity: SENSITIVITY_TIERS.SENSITIVE_IDENTIFYING,
    statutoryBasis: {
      lawJa: '地方税法 第20条の10',
      lawEn: 'Local Tax Act, Article 20-10',
    },
    descriptionI18n: {
      ja: '前年中の総所得金額や所得の内訳（給与所得、事業所得等）を証明する書類。自治体によっては課税証明書と一体の「課税・所得証明書」として発行。',
      vi: 'Giấy chứng nhận chi tiết các khoản thu nhập trong năm trước. Tại nhiều nơi (như 23 quận Tokyo), giấy này được gộp chung với 課税証明書.',
      en: 'Certificate stating total income breakdown for the previous year. Many municipalities issue this combined with the taxation certificate.',
    },
    supportedChannels: [
      ACQUISITION_CHANNELS.MUNICIPAL_COUNTER,
      ACQUISITION_CHANNELS.CONVENIENCE_STORE,
      ACQUISITION_CHANNELS.MAIL_REQUEST,
    ],
    officialSourceId: 'src.statutory.local-tax-act',
    containsSensitiveData: true,
  },

  // 6. Jūminzei Nōzei Shōmeisho
  'document.tax-payment-certificate': {
    id: 'document.tax-payment-certificate',
    canonicalNameJa: '住民税納税証明書',
    nameI18n: {
      ja: '住民税納税証明書',
      vi: 'Giấy chứng nhận đã nộp thuế cư trú',
      en: 'Inhabitant Tax Payment Certificate',
    },
    aliases: [
      '納税証明書',
      'のうぜいしょうめい',
      '住民税の納税証明',
      'tax payment certificate',
      'nozei shomeisho',
      'giay chung nhan nop thue',
      'chung nhan dong thue cu tru',
    ],
    category: DOCUMENT_CATEGORIES.TAX_INCOME,
    issuerType: ISSUER_TYPES.MUNICIPAL_TAX_RESIDENCE,
    sensitivity: SENSITIVITY_TIERS.SENSITIVE_IDENTIFYING,
    statutoryBasis: {
      lawJa: '地方税法 第20条の10',
      lawEn: 'Local Tax Act, Article 20-10',
    },
    descriptionI18n: {
      ja: '課税された住民税が実際に納付済みであること、納付額、未納額（未納税額）の有無を証明する書類。入管の永住申請やビザ更新等で納期限順守の確認に必須。',
      vi: 'Giấy chứng nhận số tiền thuế cư trú thực tế đã nộp vào ngân sách, có nợ thuế hay không. Cực kỳ quan trọng đối với hồ sơ gia hạn visa và vĩnh trú.',
      en: 'Certificate verifying that assessed inhabitant tax has been paid, including payment dates, paid balance, and absence of tax arrears.',
    },
    supportedChannels: [
      ACQUISITION_CHANNELS.MUNICIPAL_COUNTER,
      ACQUISITION_CHANNELS.CONVENIENCE_STORE,
      ACQUISITION_CHANNELS.MAIL_REQUEST,
      ACQUISITION_CHANNELS.MYNA_PORTAL_ONLINE,
    ],
    officialSourceId: 'src.statutory.local-tax-act',
    containsSensitiveData: true,
  },

  // 7. Kokuzei Nōzei Shōmeisho
  'document.national-tax-payment-cert': {
    id: 'document.national-tax-payment-cert',
    canonicalNameJa: '国税納税証明書（その1・その2・その3等）',
    nameI18n: {
      ja: '国税納税証明書（その1・その2・その3等）',
      vi: 'Giấy chứng nhận nộp thuế quốc gia (Thuế thu nhập, Tiêu dùng)',
      en: 'National Tax Payment Certificate (Part 1, 2, 3)',
    },
    aliases: [
      '国税納税証明',
      '税務署の納税証明',
      '納税証明書その1',
      '納税証明書その2',
      '納税証明書その3',
      'national tax certificate',
      'zeimusho nozei',
      'chung nhan nop thue quoc gia',
    ],
    category: DOCUMENT_CATEGORIES.TAX_INCOME,
    issuerType: ISSUER_TYPES.NATIONAL_TAX_OFFICE, // 税務署 (NOT 市区町村)
    sensitivity: SENSITIVITY_TIERS.SENSITIVE_IDENTIFYING,
    statutoryBasis: {
      lawJa: '国税通則法 第123条',
      lawEn: 'Act on General Rules for National Taxes, Article 123',
    },
    descriptionI18n: {
      ja: '所轄税務署が発行する、国税（所得税、消費税、法人税等）の納付額や滞納がないことを証明する書類。市区町村ではなく税務署またはe-Taxで取得。',
      vi: 'Giấy do Chi cục Thuế Quốc gia (Zeimusho) cấp xác nhận đã nộp đủ thuế thu nhập/thuế tiêu dùng và không có nợ đọng. KHÔNG lấy ở Tòa thị chính.',
      en: 'Certificate issued by the National Tax Office verifying payment of national income taxes and absence of arrears. Obtained at Tax Office or via e-Tax.',
    },
    supportedChannels: [
      ACQUISITION_CHANNELS.TAX_OFFICE_COUNTER,
      ACQUISITION_CHANNELS.E_TAX_ONLINE,
      ACQUISITION_CHANNELS.MAIL_REQUEST,
    ],
    officialSourceId: 'src.statutory.national-tax-general-act',
    containsSensitiveData: true,
  },

  // 8. Koseki Tōhon (Full Family Register)
  'document.family-register-full': {
    id: 'document.family-register-full',
    canonicalNameJa: '戸籍全部事項証明書（戸籍謄本）',
    nameI18n: {
      ja: '戸籍全部事項証明書（戸籍謄本）',
      vi: 'Bản sao Trích lục Hộ tịch toàn bộ (Koseki Tohon)',
      en: 'Full Family Register Certificate (Koseki Tohon)',
    },
    aliases: [
      '戸籍謄本',
      'こせきとうほん',
      '戸籍全部事項証明',
      'family register full',
      'koseki tohon',
      'ho tich toan bo',
      'so ho tich nhat ban',
    ],
    category: DOCUMENT_CATEGORIES.FAMILY_REGISTER,
    issuerType: ISSUER_TYPES.MUNICIPAL_REGISTERED_DOMICILE, // 本籍地
    sensitivity: SENSITIVITY_TIERS.SENSITIVE_IDENTIFYING,
    statutoryBasis: {
      lawJa: '戸籍法 第10条',
      lawEn: 'Family Register Act, Article 10',
    },
    descriptionI18n: {
      ja: '本籍地の市区町村において戸籍に記載されている全員の身分事項（出生、婚姻、死亡、親子関係等）を証明する書類。令和6年3月1日より全国の窓口で広域交付が可能。',
      vi: 'Trích lục ghi nhận toàn bộ thông tin quan hệ gia đình (kết hôn, sinh nở, cha mẹ, con cái) tại nơi đăng ký bản quán (Honsekichi). Từ 01/03/2024 có thể xin tại bất kỳ Tòa thị chính nào trên toàn quốc.',
      en: 'Official certificate covering all members in the family register. Since March 1, 2024, can be obtained at any municipal counter nationwide via Broad-Issuance.',
    },
    supportedChannels: [
      ACQUISITION_CHANNELS.MUNICIPAL_COUNTER,
      ACQUISITION_CHANNELS.CONVENIENCE_STORE,
      ACQUISITION_CHANNELS.MAIL_REQUEST,
      ACQUISITION_CHANNELS.MYNA_PORTAL_ONLINE,
    ],
    officialSourceId: 'src.statutory.family-register-act',
    containsSensitiveData: true,
    broadIssuanceSupported: true, // 2024 Broad-Issuance (広域交付)
  },

  // 9. Koseki Shōhon (Individual Family Register)
  'document.family-register-individual': {
    id: 'document.family-register-individual',
    canonicalNameJa: '戸籍個人事項証明書（戸籍抄本）',
    nameI18n: {
      ja: '戸籍個人事項証明書（戸籍抄本）',
      vi: 'Bản sao Trích lục Hộ tịch cá nhân (Koseki Shohon)',
      en: 'Individual Family Register Certificate (Koseki Shohon)',
    },
    aliases: [
      '戸籍抄本',
      'こせきしょうほん',
      '戸籍個人事項証明',
      'family register individual',
      'koseki shohon',
      'ho tich ca nhan',
    ],
    category: DOCUMENT_CATEGORIES.FAMILY_REGISTER,
    issuerType: ISSUER_TYPES.MUNICIPAL_REGISTERED_DOMICILE,
    sensitivity: SENSITIVITY_TIERS.SENSITIVE_IDENTIFYING,
    statutoryBasis: {
      lawJa: '戸籍法 第10条',
      lawEn: 'Family Register Act, Article 10',
    },
    descriptionI18n: {
      ja: '戸籍に記載されている特定の人ひとりの身分事項（出生、婚姻等）のみを抜き出して証明する書類。',
      vi: 'Trích lục chỉ bao gồm thông tin hộ tịch của riêng một cá nhân cụ thể.',
      en: 'Certificate extracting only the specific individual records from the family register.',
    },
    supportedChannels: [
      ACQUISITION_CHANNELS.MUNICIPAL_COUNTER,
      ACQUISITION_CHANNELS.CONVENIENCE_STORE,
      ACQUISITION_CHANNELS.MAIL_REQUEST,
    ],
    officialSourceId: 'src.statutory.family-register-act',
    containsSensitiveData: true,
  },

  // 10. Koseki no Fuhyō
  'document.family-register-tag': {
    id: 'document.family-register-tag',
    canonicalNameJa: '戸籍の附票の写し',
    nameI18n: {
      ja: '戸籍の附票の写し',
      vi: 'Bản sao Phụ biểu Hộ tịch (Lịch sử địa chỉ)',
      en: 'Certificate of Supplementary Family Register (Address History)',
    },
    aliases: [
      '戸籍の附票',
      '附票',
      'ふひょう',
      'koseki no fuhyo',
      'fuhyo',
      'lich su dia chi ho tich',
    ],
    category: DOCUMENT_CATEGORIES.FAMILY_REGISTER,
    issuerType: ISSUER_TYPES.MUNICIPAL_REGISTERED_DOMICILE,
    sensitivity: SENSITIVITY_TIERS.PERSONAL,
    statutoryBasis: {
      lawJa: '住民基本台帳法 第16条',
      lawEn: 'Basic Resident Registration Act, Article 16',
    },
    descriptionI18n: {
      ja: 'その戸籍が作られてから現在までの住所の移り変わり（居住履歴）がすべて記録されている書類。過去の住所の繋がりを証明するために使用。',
      vi: 'Văn bản ghi nhận toàn bộ lịch sử thay đổi địa chỉ cư trú kể từ khi lập hộ tịch đến nay. Dùng để chứng minh chuỗi địa chỉ khi mua bán xe hoặc thừa kế.',
      en: 'Official document recording the continuous history of all residential addresses since the family register was opened.',
    },
    supportedChannels: [
      ACQUISITION_CHANNELS.MUNICIPAL_COUNTER,
      ACQUISITION_CHANNELS.CONVENIENCE_STORE,
      ACQUISITION_CHANNELS.MAIL_REQUEST,
    ],
    officialSourceId: 'src.statutory.resident-registration-act',
    containsSensitiveData: false,
  },

  // 11. Gensen Chōshūhyō
  'document.withholding-tax-slip': {
    id: 'document.withholding-tax-slip',
    canonicalNameJa: '給与所得の源泉徴収票',
    nameI18n: {
      ja: '給与所得の源泉徴収票',
      vi: 'Phiếu khấu trừ thuế thu nhập tại nguồn (Gensen Chōshūhyō)',
      en: 'Employment Income Withholding Tax Slip',
    },
    aliases: [
      '源泉徴収票',
      'げんせん',
      '源泉',
      'withholding tax slip',
      'gensen choshuhyo',
      'gensen',
      'phieu khau tru thue',
      'giay gensen',
    ],
    category: DOCUMENT_CATEGORIES.TAX_INCOME,
    issuerType: ISSUER_TYPES.EMPLOYER, // 勤務先 / 雇用主 (NOT 市役所 / NOT 税務署)
    sensitivity: SENSITIVITY_TIERS.SENSITIVE_IDENTIFYING,
    statutoryBasis: {
      lawJa: '所得税法 第226条',
      lawEn: 'Income Tax Act, Article 226',
    },
    descriptionI18n: {
      ja: '1年間に支払われた給与・賞与の総額と、天引きされた所得税額・社会保険料等を勤務先が証明する書類。毎年12月の年末調整後または退職時に交付。',
      vi: 'Bảng tổng kết thu nhập, tiền lương thưởng trong năm và các khoản thuế, bảo hiểm đã khấu trừ. Do công ty phát hành sau kỳ Nenmatsu Chosei hoặc khi nghỉ việc.',
      en: 'Slip issued by your employer summarizing total annual salary, deductions, and withheld income taxes. Delivered annually in December or upon resignation.',
    },
    supportedChannels: [
      ACQUISITION_CHANNELS.EMPLOYER_REQUEST,
    ],
    officialSourceId: 'src.statutory.income-tax-act',
    containsSensitiveData: true,
    employerDutyNoteJa: '会社は法律上、退職後または年末調整後に交付する義務があります。市役所や税務署では発行されません。',
  },

  // 12. Rishokuhyō
  'document.employment-separation-certificate': {
    id: 'document.employment-separation-certificate',
    canonicalNameJa: '雇用保険被保険者離職票（離職票-1、離職票-2）',
    nameI18n: {
      ja: '雇用保険被保険者離職票（離職票-1、離職票-2）',
      vi: 'Phiếu nghỉ việc bảo hiểm thất nghiệp (Rishokuhyō 1 và 2)',
      en: 'Employment Insurance Separation Certificate (Form 1 & 2)',
    },
    aliases: [
      '離職票',
      'りしょくひょう',
      '離職票1',
      '離職票2',
      'separation slip',
      'job separation notice',
      'rishokuhyo',
      'phieu nghi viec',
    ],
    category: DOCUMENT_CATEGORIES.EMPLOYMENT_LABOR,
    issuerType: ISSUER_TYPES.PUBLIC_EMPLOYMENT_OFFICE, // ハローワーク（会社経由で交付）
    sensitivity: SENSITIVITY_TIERS.PERSONAL,
    statutoryBasis: {
      lawJa: '雇用保険法施行規則 第17条',
      lawEn: 'Employment Insurance Act Enforcement Regulations, Article 17',
    },
    descriptionI18n: {
      ja: '退職前の賃金支払状況や退職理由（会社都合／自己都合）が記載され、ハローワークで失業保険（基本手当）を受給するために必須の書類。',
      vi: 'Giấy ghi nhận lý do nghỉ việc và mức lương 6 tháng trước đó do Hello Work cấp qua công ty, là tài liệu bắt buộc để nhận trợ cấp thất nghiệp.',
      en: 'Official forms certified by Hello Work stating wage history and resignation reason, mandatory for claiming unemployment insurance benefits.',
    },
    supportedChannels: [
      ACQUISITION_CHANNELS.HELLO_WORK_COUNTER,
      ACQUISITION_CHANNELS.EMPLOYER_REQUEST,
    ],
    officialSourceId: 'src.statutory.employment-insurance-act',
    containsSensitiveData: true,
  },

  // 13. Zaishoku Shōmeisho / Shūrō Shōmeisho
  'document.certificate-of-employment': {
    id: 'document.certificate-of-employment',
    canonicalNameJa: '在職証明書 / 就労証明書',
    nameI18n: {
      ja: '在職証明書 / 就労証明書',
      vi: 'Giấy chứng nhận đang làm việc (Hợp đồng lao động/Xác nhận công tác)',
      en: 'Certificate of Employment / Work Verification Certificate',
    },
    aliases: [
      '在職証明書',
      '在職証明',
      '就労証明書',
      '勤務証明書',
      'certificate of employment',
      'work certificate',
      'zaishoku shomei',
      'shuro shomei',
      'giay chung nhan dang lam viec',
      'giay xac nhan cong tac',
    ],
    category: DOCUMENT_CATEGORIES.EMPLOYMENT_LABOR,
    issuerType: ISSUER_TYPES.EMPLOYER,
    sensitivity: SENSITIVITY_TIERS.PERSONAL,
    statutoryBasis: {
      lawJa: '労働基準法 第22条',
      lawEn: 'Labor Standards Act, Article 22',
    },
    descriptionI18n: {
      ja: '会社に現在在籍していること、職種、就労日数・時間等を雇用主が証明する書類。ビザ申請や保育園申込み、賃貸契約等で使用。',
      vi: 'Văn bản do công ty đóng dấu xác nhận bạn đang làm việc, chức danh và thời gian làm việc. Cần cho xin visa, đăng ký trường mầm non, thuê nhà.',
      en: 'Certificate signed by employer verifying current employment status, role, and working hours. Required for visa renewals, daycare, and leases.',
    },
    supportedChannels: [
      ACQUISITION_CHANNELS.EMPLOYER_REQUEST,
    ],
    officialSourceId: 'src.statutory.labor-standards-act',
    containsSensitiveData: false,
  },

  // 14. Passport
  'document.passport': {
    id: 'document.passport',
    canonicalNameJa: '旅券（パスポート）',
    nameI18n: {
      ja: '旅券（パスポート）',
      vi: 'Hộ chiếu (Passport)',
      en: 'Passport',
    },
    aliases: [
      'パスポート',
      '旅券',
      'passport',
      'ho chieu',
    ],
    category: DOCUMENT_CATEGORIES.IDENTITY_RESIDENCE,
    issuerType: ISSUER_TYPES.FOREIGN_EMBASSY,
    sensitivity: SENSITIVITY_TIERS.SENSITIVE_IDENTIFYING,
    descriptionI18n: {
      ja: '国籍国政府が発行する身分証明書・渡航文書。入管手続きや本人確認において原本の提示が必要。',
      vi: 'Hộ chiếu quốc gia gốc do Đại sứ quán/Bộ Ngoại giao cấp. Là giấy tờ tùy thân bắt buộc xuất trình bản gốc trong các thủ tục nhập quản.',
      en: 'National identity and travel document issued by your government. Original must be presented for immigration and major verification procedures.',
    },
    supportedChannels: [
      ACQUISITION_CHANNELS.IMMIGRATION_COUNTER,
    ],
    officialSourceId: 'src.statutory.passport-act',
    containsSensitiveData: true,
  },

  // 15. Zairyū Card
  'document.residence-card': {
    id: 'document.residence-card',
    canonicalNameJa: '在留カード',
    nameI18n: {
      ja: '在留カード',
      vi: 'Thẻ lưu trú (Thẻ ngoại kiều / Residence Card)',
      en: 'Residence Card (Zairyū Card)',
    },
    aliases: [
      '在留カード',
      '外国人登録証',
      'residence card',
      'zairyu card',
      'the ngoai kieu',
      'the luu tru',
    ],
    category: DOCUMENT_CATEGORIES.IDENTITY_RESIDENCE,
    issuerType: ISSUER_TYPES.IMMIGRATION_AGENCY,
    sensitivity: SENSITIVITY_TIERS.SENSITIVE_IDENTIFYING,
    statutoryBasis: {
      lawJa: '出入国管理及び難民認定法 第19条の3',
      lawEn: 'Immigration Control and Refugee Recognition Act, Article 19-3',
    },
    descriptionI18n: {
      ja: '中長期在留者に対して法務大臣（出入国在留管理局）が交付する公的身分証明書。在留資格、在留期間満了日、就労制限の有無等が記載。',
      vi: 'Thẻ căn cước chính thức của người nước ngoài cư trú trung-dài hạn tại Nhật, ghi rõ tư cách lưu trú, hạn visa và phạm vi được phép làm việc.',
      en: 'Official identification card issued to mid-to-long-term foreign residents in Japan by the Immigration Services Agency.',
    },
    supportedChannels: [
      ACQUISITION_CHANNELS.IMMIGRATION_COUNTER,
    ],
    officialSourceId: 'src.statutory.immigration-control-act',
    containsSensitiveData: true,
  },

  // 16. My Number Card
  'document.mynumber-card': {
    id: 'document.mynumber-card',
    canonicalNameJa: '個人番号カード（マイナンバーカード）',
    nameI18n: {
      ja: '個人番号カード（マイナンバーカード）',
      vi: 'Thẻ Số cá nhân (Thẻ My Number)',
      en: 'Individual Number Card (My Number Card)',
    },
    aliases: [
      'マイナンバーカード',
      'マイナカード',
      '個人番号カード',
      'my number card',
      'the my number',
      'ma so ca nhan',
    ],
    category: DOCUMENT_CATEGORIES.IDENTITY_RESIDENCE,
    issuerType: ISSUER_TYPES.MUNICIPAL_CURRENT_RESIDENCE,
    sensitivity: SENSITIVITY_TIERS.HIGHLY_SENSITIVE,
    statutoryBasis: {
      lawJa: 'マイナンバー法 第16条の2',
      lawEn: 'Act on the Use of Numbers to Identify a Specific Individual in Administrative Procedures, Article 16-2',
    },
    descriptionI18n: {
      ja: 'プラスチック製のICチップ付きカード。顔写真付き本人確認書類として機能するほか、コンビニ証明書交付や健康保険証利用（マイナ保険証）に対応。',
      vi: 'Thẻ gắn chip IC kiêm giấy tờ tùy thân có ảnh, hỗ trợ in giấy tờ tại combini, tích hợp bảo hiểm y tế và nộp thủ tục trực tuyến qua MynaPortal.',
      en: 'Plastic IC card serving as official photo ID, enabling convenience-store certificate issuance, MynaPortal services, and health insurance usage.',
    },
    supportedChannels: [
      ACQUISITION_CHANNELS.MUNICIPAL_COUNTER,
      ACQUISITION_CHANNELS.MYNA_PORTAL_ONLINE,
    ],
    officialSourceId: 'src.statutory.mynumber-act',
    containsSensitiveData: true,
  },

  // 17. Electronic Certificates (Kenshō-shō / Denshi Shōmeisho)
  'document.mynumber-electronic-certificate': {
    id: 'document.mynumber-electronic-certificate',
    canonicalNameJa: '公的個人認証サービス 電子証明書',
    nameI18n: {
      ja: '公的個人認証サービス 電子証明書',
      vi: 'Chứng thư số điện tử công quyền (JPKI)',
      en: 'JPKI Electronic Certificates',
    },
    aliases: [
      '電子証明書',
      '署名用電子証明書',
      '利用者証明用電子証明書',
      'jpki',
      'electronic certificate',
      'chung thu so my number',
    ],
    category: DOCUMENT_CATEGORIES.IDENTITY_RESIDENCE,
    issuerType: ISSUER_TYPES.MUNICIPAL_CURRENT_RESIDENCE,
    sensitivity: SENSITIVITY_TIERS.HIGHLY_SENSITIVE,
    statutoryBasis: {
      lawJa: '電子署名等に係る地方公共団体情報システム機構の認証業務に関する法律 第3条',
      lawEn: 'Act on Public Key Infrastructure for Local Governments, Article 3',
    },
    descriptionI18n: {
      ja: 'マイナンバーカードのICチップに格納される電子証明書。「署名用（6〜16桁パスワード）」と「利用者証明用（数字4桁暗証番号）」の2種類が存在。',
      vi: 'Chứng thư số lưu trong chip thẻ My Number, gồm Chứng thư chữ ký số (mật khẩu 6-16 ký tự) và Chứng thư xác thực người dùng (PIN 4 số).',
      en: 'Digital certificates stored on My Number IC chip: Signature cert (6-16 alphanum PIN) and User Auth cert (4 digit PIN).',
    },
    supportedChannels: [
      ACQUISITION_CHANNELS.MUNICIPAL_COUNTER,
    ],
    officialSourceId: 'src.statutory.jpki-act',
    containsSensitiveData: true,
  },
};

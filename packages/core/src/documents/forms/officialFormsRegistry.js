/**
 * @file officialFormsRegistry.js
 * Registry of verified official Japanese administrative application forms.
 * 
 * CORE RULES:
 * 1. Only verified official forms with tracked versions and official source URLs.
 * 2. Detailed field schema: labelJa, meaningI18n, format, example, sensitivity, conditional rules.
 * 3. NO server-side persistence of user draft values.
 */

export const OFFICIAL_FORMS = {
  // 1. ISA Extension of Period of Stay
  'form.isa.extension-of-stay': {
    id: 'form.isa.extension-of-stay',
    procedureId: 'procedure.residence-status-renewal',
    authority: {
      type: 'immigration_bureau',
      nameJa: '出入国在留管理局（法務省）',
      nameI18n: {
        ja: '出入国在留管理局（法務省）',
        vi: 'Cục Quản lý Xuất nhập cảnh (Bộ Tư pháp)',
        en: 'Immigration Services Agency (MOJ)',
      },
    },
    formNameJa: '在留期間更新許可申請書',
    formNameI18n: {
      ja: '在留期間更新許可申請書',
      vi: 'Đơn xin cấp phép gia hạn thời hạn lưu trú',
      en: 'Application for Extension of Period of Stay',
    },
    version: '2024.04-rev',
    effectivePeriod: {
      validFrom: '2024-04-01',
      validTo: null,
    },
    lastVerifiedAt: '2026-04-01',
    officialPdfUrl: 'https://www.moj.go.jp/isa/applications/procedures/16-3.html',
    officialSourceId: 'src.isa.application-forms',
    sections: [
      {
        sectionId: 'applicant_identity',
        titleJa: '申請人等作成用（基本情報）',
        titleI18n: {
          ja: '申請人等作成用（基本情報）',
          vi: 'Phần người nộp đơn tự điền (Thông tin cơ bản)',
          en: 'Applicant Section (Basic Information)',
        },
        fields: [
          {
            id: 'applicant_nationality',
            labelJa: '国籍・地域',
            meaningI18n: {
              ja: 'パスポートに記載された国籍国・地域名',
              vi: 'Quốc tịch hoặc vùng lãnh thổ ghi trên hộ chiếu',
              en: 'Nationality / Region as stated on your passport',
            },
            inputType: 'text',
            format: '国名（例：VIETNAM / ベトナム）',
            example: 'VIETNAM',
            requiredWhen: 'always',
            isSensitive: false,
          },
          {
            id: 'applicant_dob',
            labelJa: '生年月日',
            meaningI18n: {
              ja: '西暦（年・月・日）で記入',
              vi: 'Ngày tháng năm sinh theo lịch Dương (Tây lịch)',
              en: 'Date of birth (YYYY-MM-DD)',
            },
            inputType: 'date',
            format: 'YYYY-MM-DD',
            example: '1995-08-15',
            requiredWhen: 'always',
            isSensitive: true,
          },
          {
            id: 'applicant_name_romaji',
            labelJa: '氏名（ローマ字）',
            meaningI18n: {
              ja: 'パスポートの表記通りに大文字アルファベットで記入',
              vi: 'Họ và tên chữ in hoa không dấu đúng theo hộ chiếu',
              en: 'Full name in Roman uppercase letters as in passport',
            },
            inputType: 'text',
            format: 'ALPHABET UPPERCASE',
            example: 'NGUYEN VAN A',
            requiredWhen: 'always',
            isSensitive: true,
          },
          {
            id: 'applicant_gender',
            labelJa: '性別',
            meaningI18n: { ja: '男または女', vi: 'Giới tính', en: 'Gender' },
            inputType: 'select',
            options: [
              { value: 'male', labelJa: '男', labelI18n: { vi: 'Nam', en: 'Male' } },
              { value: 'female', labelJa: '女', labelI18n: { vi: 'Nữ', en: 'Female' } },
            ],
            requiredWhen: 'always',
            isSensitive: false,
          },
          {
            id: 'residence_card_number',
            labelJa: '在留カード番号',
            meaningI18n: {
              ja: 'カード右上に記載されたアルファベット2桁＋数字8桁＋英字2桁',
              vi: 'Số thẻ cư trú (in ở góc trên cùng bên phải thẻ ngoại kiều)',
              en: 'Residence Card Number (12 alphanumeric characters)',
            },
            inputType: 'text',
            format: 'XX12345678YY',
            example: 'AB12345678CD',
            requiredWhen: 'always',
            isSensitive: true,
          },
          {
            id: 'current_address',
            labelJa: '住居地（住所）',
            meaningI18n: {
              ja: '在留カード裏面に印字された現住所',
              vi: 'Địa chỉ nơi ở hiện tại (đã đăng ký tại Tòa thị chính)',
              en: 'Current residential address as registered',
            },
            inputType: 'text',
            example: '東京都新宿区歌舞伎町1-2-3 ○○アパート101',
            requiredWhen: 'always',
            isSensitive: true,
          },
        ],
      },
      {
        sectionId: 'stay_and_status',
        titleJa: '在留資格・希望期間',
        titleI18n: {
          ja: '在留資格・希望期間',
          vi: 'Tư cách lưu trú hiện tại và thời hạn mong muốn',
          en: 'Current Status & Desired Period',
        },
        fields: [
          {
            id: 'current_status',
            labelJa: '現に有する在留資格',
            meaningI18n: {
              ja: '現在持っている在留資格（例：技術・人文知識・国際業務）',
              vi: 'Tư cách lưu trú hiện tại',
              en: 'Current Status of Residence',
            },
            inputType: 'text',
            example: '技術・人文知識・国際業務',
            requiredWhen: 'always',
            isSensitive: false,
          },
          {
            id: 'desired_period',
            labelJa: '希望する在留期間',
            meaningI18n: {
              ja: '希望年数（例：5年、3年、1年）。最終決定は入管の裁量です。',
              vi: 'Thời hạn mong muốn (vd: 5 năm, 3 năm, 1 năm). Quyết định cuối cùng do Cục Nhập quản xét duyệt.',
              en: 'Desired period (e.g. 5 years, 3 years). Final grant is under ISA discretion.',
            },
            inputType: 'select',
            options: [
              { value: '5_years', labelJa: '5年', labelI18n: { vi: '5 năm', en: '5 years' } },
              { value: '3_years', labelJa: '3年', labelI18n: { vi: '3 năm', en: '3 years' } },
              { value: '1_year', labelJa: '1年', labelI18n: { vi: '1 năm', en: '1 year' } },
            ],
            requiredWhen: 'always',
            isSensitive: false,
          },
          {
            id: 'criminal_record',
            labelJa: '犯罪を理由とする処分を受けたことの有無',
            meaningI18n: {
              ja: '日本国内外での有罪判決・処分の有無（交通違反の反則金等は原則除くが重過失は注意）',
              vi: 'Đã từng bị xử phạt hoặc có tiền án tiền sự tại Nhật hay nước ngoài chưa',
              en: 'Criminal record / disposition in Japan or abroad',
            },
            inputType: 'radio',
            options: [
              { value: 'none', labelJa: '無（なし）', labelI18n: { vi: 'Không có', en: 'None' } },
              { value: 'yes', labelJa: '有（あり）', labelI18n: { vi: 'Có', en: 'Yes' } },
            ],
            requiredWhen: 'always',
            isSensitive: true,
          },
        ],
      },
    ],
  },

  // 2. Municipal Child Allowance Claim Form
  'form.muni.child-allowance-claim': {
    id: 'form.muni.child-allowance-claim',
    procedureId: 'procedure.child-allowance-claim',
    authority: {
      type: 'municipal_office',
      nameJa: '市区町村役場（こども家庭庁管轄）',
      nameI18n: {
        ja: '市区町村役場（こども家庭庁管轄）',
        vi: 'Tòa thị chính địa phương (Cơ quan Trẻ em và Gia đình)',
        en: 'Municipal Office (Children and Families Agency)',
      },
    },
    formNameJa: '児童手当認定請求書',
    formNameI18n: {
      ja: '児童手当認定請求書',
      vi: 'Đơn yêu cầu chứng nhận thụ hưởng trợ cấp trẻ em',
      en: 'Child Allowance Certification Claim Form',
    },
    version: '2024.10-rev',
    effectivePeriod: {
      validFrom: '2024-10-01',
      validTo: null,
    },
    lastVerifiedAt: '2026-04-01',
    officialPdfUrl: 'https://www.cfa.go.jp/policies/child-allowance/',
    officialSourceId: 'src.cfa.child-allowance',
    sections: [
      {
        sectionId: 'claimant_info',
        titleJa: '請求者情報（父母のうち恒常的に所得の高い方）',
        titleI18n: {
          ja: '請求者情報（父母のうち恒常的に所得の高い方）',
          vi: 'Thông tin người làm đơn (Người có thu nhập cao hơn trong hai vợ chồng)',
          en: 'Claimant Information (Higher-income parent)',
        },
        fields: [
          {
            id: 'claimant_name',
            labelJa: '請求者氏名',
            meaningI18n: { ja: '請求者の氏名', vi: 'Họ tên người làm đơn', en: 'Claimant full name' },
            inputType: 'text',
            requiredWhen: 'always',
            isSensitive: true,
          },
          {
            id: 'claimant_address',
            labelJa: '請求者住所',
            meaningI18n: { ja: '住民票記載の現住所', vi: 'Địa chỉ theo sổ cư trú', en: 'Current address' },
            inputType: 'text',
            requiredWhen: 'always',
            isSensitive: true,
          },
          {
            id: 'claimant_bank_account',
            labelJa: '振込先金融機関口座（請求者名義に限る）',
            meaningI18n: {
              ja: '手当の振込先。配偶者や子どもの名義口座は指定不可。必ず請求者本人名義の口座。',
              vi: 'Tài khoản ngân hàng nhận tiền. BẮT BUỘC phải là tài khoản đứng tên người làm đơn (không được dùng tên vợ/con).',
              en: 'Bank account for payouts. Must strictly be in the claimant’s own name.',
            },
            inputType: 'text',
            example: '○○銀行 ○○支店 普通 1234567',
            requiredWhen: 'always',
            isSensitive: true,
          },
        ],
      },
    ],
  },

  // 3. Municipal Moving Change of Address Form
  'form.muni.change-of-address': {
    id: 'form.muni.change-of-address',
    procedureId: 'procedure.moving-in-notification',
    authority: {
      type: 'municipal_office',
      nameJa: '市区町村役場（総務省標準様式）',
      nameI18n: {
        ja: '市区町村役場（総務省標準様式）',
        vi: 'Tòa thị chính địa phương (Mẫu chuẩn Bộ Nội vụ)',
        en: 'Municipal Office (MIC Standard Form)',
      },
    },
    formNameJa: '住民異動届（転入・転出・転居届共通）',
    formNameI18n: {
      ja: '住民異動届（転入・転出・転居届共通）',
      vi: 'Giấy thông báo thay đổi thông tin cư trú (Nhập / Chuyển / Đổi địa chỉ)',
      en: 'Resident Change Notification (Moving In / Out / Change)',
    },
    version: '2023.06-rev',
    effectivePeriod: {
      validFrom: '2023-06-01',
      validTo: null,
    },
    lastVerifiedAt: '2026-04-01',
    officialPdfUrl: 'https://www.soumu.go.jp/main_sosiki/jichi_gyousei/c-gyousei/zairyu/',
    officialSourceId: 'src.statutory.resident-registration-act',
    sections: [
      {
        sectionId: 'moving_details',
        titleJa: '異動内容・新旧住所',
        titleI18n: {
          ja: '異動内容・新旧住所',
          vi: 'Nội dung thay đổi & Địa chỉ mới / cũ',
          en: 'Change Type & New/Former Address',
        },
        fields: [
          {
            id: 'change_type',
            labelJa: '届出の種別',
            meaningI18n: { ja: '転入・転出・転居の別', vi: 'Loại thông báo', en: 'Notification type' },
            inputType: 'select',
            options: [
              { value: 'tennyu', labelJa: '転入（他の市区町村から）', labelI18n: { vi: 'Chuyển đến từ địa phương khác (Tennyu)', en: 'Moving in from other city' } },
              { value: 'tenkyo', labelJa: '転居（同じ市区町村内での引越し）', labelI18n: { vi: 'Đổi địa chỉ trong cùng quận/thành phố (Tenkyo)', en: 'Moving within same city' } },
              { value: 'tenshutsu', labelJa: '転出（他の市区町村や国外へ）', labelI18n: { vi: 'Chuyển đi nơi khác hoặc về nước (Tenshutsu)', en: 'Moving out of city/country' } },
            ],
            requiredWhen: 'always',
            isSensitive: false,
          },
          {
            id: 'move_date',
            labelJa: '異動年月日（新しい住所に住み始めた日）',
            meaningI18n: {
              ja: '実際に引越しを完了して住み始めた日',
              vi: 'Ngày thực tế dọn vào ở tại địa chỉ mới',
              en: 'Actual date you began living at the new address',
            },
            inputType: 'date',
            requiredWhen: 'always',
            isSensitive: false,
          },
          {
            id: 'new_address',
            labelJa: '新住所（これからの住所）',
            meaningI18n: { ja: '引越し先の新しい住所', vi: 'Địa chỉ nhà mới', en: 'New residential address' },
            inputType: 'text',
            requiredWhen: 'always',
            isSensitive: true,
          },
          {
            id: 'former_address',
            labelJa: '旧住所（これまでの住所）',
            meaningI18n: { ja: '引越し前の直前の住所', vi: 'Địa chỉ nhà cũ vừa chuyển đi', en: 'Former residential address' },
            inputType: 'text',
            requiredWhen: 'always',
            isSensitive: true,
          },
        ],
      },
    ],
  },
};

/**
 * Get form by ID.
 * @param {string} id
 * @returns {object|null}
 */
export function getOfficialFormById(id) {
  if (!id) return null;
  return OFFICIAL_FORMS[id] || null;
}

/**
 * Get all verified official forms.
 * @returns {object[]}
 */
export function getAllOfficialForms() {
  return Object.values(OFFICIAL_FORMS);
}

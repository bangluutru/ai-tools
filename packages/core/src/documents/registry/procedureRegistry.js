/**
 * @file procedureRegistry.js
 * Canonical registry of administrative procedures in Japan.
 * 
 * CORE PRINCIPLE:
 * ProcedureDefinition owns the procedure identity, responsible authority,
 * statutory deadlines, permitted submission methods, and the list of DocumentRequirement IDs.
 */

export const PROCEDURE_DOMAINS = {
  IMMIGRATION: 'immigration',
  FAMILY: 'family',
  MOVING: 'moving',
  EMPLOYMENT: 'employment',
  TAX: 'tax',
  GENERAL_ADMIN: 'general_admin',
};

export const CANONICAL_PROCEDURES = {
  'procedure.residence-status-renewal': {
    id: 'procedure.residence-status-renewal',
    country: 'JP',
    domain: PROCEDURE_DOMAINS.IMMIGRATION,
    titleJa: '在留期間更新許可申請',
    titleI18n: {
      ja: '在留期間更新許可申請',
      vi: 'Thủ tục gia hạn thời hạn lưu trú (Gia hạn visa)',
      en: 'Application for Extension of Period of Stay (Visa Renewal)',
    },
    aliases: ['ビザ更新', '在留期間更新', 'gia han visa', 'visa renewal', 'extension of stay'],
    authority: {
      type: 'immigration_bureau',
      nameJa: '出入国在留管理局',
      nameI18n: {
        ja: '出入国在留管理局',
        vi: 'Cục Quản lý Xuất nhập cảnh và Cư trú (Nyūkan)',
        en: 'Regional Immigration Services Bureau',
      },
    },
    triggerEventI18n: {
      ja: '在留期間満了日の約3か月前から申請可能。満了日当日までに申請が必要。',
      vi: 'Có thể nộp trước ngày hết hạn visa khoảng 3 tháng. Phải nộp trước hoặc đúng ngày hết hạn.',
      en: 'Can apply approximately 3 months before visa expiration date. Must file on or before expiration date.',
    },
    statutoryDeadlineI18n: {
      ja: '在留期間満了日まで（満了後はオーバーステイとなるため不可）',
      vi: 'Hạn chót: Đúng ngày hết hạn in trên thẻ cư trú (quá hạn sẽ bị xem là cư trú bất hợp pháp).',
      en: 'By expiration date printed on Residence Card (overstaying after deadline).',
    },
    documentRequirementIds: [
      'req.renewal.passport',
      'req.renewal.residence-card',
      'req.renewal.resident-record',
      'req.renewal.taxation-cert',
      'req.renewal.tax-payment-cert',
      'req.renewal.employment-cert',
    ],
    submissionMethods: ['counter', 'online_portal'],
    feeRules: {
      feeType: 'revenue_stamp',
      feeAmountJpy: 4000,
      feeNoteI18n: {
        ja: '許可受取時に収入印紙4,000円で納付（※令和8年10月1日以降の申請は6,000円へ改定予定）。申請時は無料。',
        vi: 'Nộp lệ phí 4,000円 bằng tem doanh thu Shūnyū Inshi khi nhận kết quả (Dự kiến tăng 6,000円 từ 01/10/2026 theo ngày nộp). Khi nộp đơn không mất phí.',
        en: '4,000 JPY paid via revenue stamp upon approval (scheduled revision to 6,000 JPY from Oct 1, 2026 based on filing date). Free to apply.',
      },
    },
    officialActionUrl: 'https://www.moj.go.jp/isa/applications/procedures/16-3.html',
    relatedLifeEventCapability: 'immigration.renewal',
  },

  'procedure.permanent-residence-application': {
    id: 'procedure.permanent-residence-application',
    country: 'JP',
    domain: PROCEDURE_DOMAINS.IMMIGRATION,
    titleJa: '永住許可申請',
    titleI18n: {
      ja: '永住許可申請',
      vi: 'Thủ tục xin cấp phép vĩnh trú (Visa Vĩnh trú)',
      en: 'Application for Permanent Residence',
    },
    aliases: ['永住申請', '永住権', 'xin vinh tru', 'permanent residence', 'pr application'],
    authority: {
      type: 'immigration_bureau',
      nameJa: '出入国在留管理局',
      nameI18n: {
        ja: '出入国在留管理局',
        vi: 'Cục Quản lý Xuất nhập cảnh và Cư trú',
        en: 'Regional Immigration Services Bureau',
      },
    },
    triggerEventI18n: {
      ja: '居住要件（原則10年在留、うち就労5年等）を満たし、最長の在留期間（現在3年または5年）を有しているとき。',
      vi: 'Khi đã cư trú liên tục 10 năm (trong đó 5 năm đi làm) và đang giữ visa thời hạn dài nhất (3 năm hoặc 5 năm).',
      en: 'When fulfilling residency criteria (normally 10 years, 5 years employment) with longest current stay period.',
    },
    statutoryDeadlineI18n: {
      ja: '随時申請可能（現在の在留期限が切れる前に更新手続きと併行すること）',
      vi: 'Có thể nộp bất cứ lúc nào (lưu ý vẫn phải gia hạn visa thường nếu visa hiện tại sắp hết hạn).',
      en: 'Can apply anytime (ensure current visa is extended if expiring during review).',
    },
    documentRequirementIds: [
      'req.renewal.passport',
      'req.renewal.residence-card',
      'req.pr.resident-record',
      'req.pr.taxation-5years',
      'req.pr.tax-payment-5years',
      'req.pr.national-tax-cert',
      'req.renewal.employment-cert',
    ],
    submissionMethods: ['counter'],
    feeRules: {
      feeType: 'revenue_stamp',
      feeAmountJpy: 8000,
      feeNoteI18n: {
        ja: '許可受取時に収入印紙8,000円を納付。申請自体は無料。',
        vi: 'Nộp 8,000円 bằng tem Shūnyū Inshi khi nhận kết quả đậu vĩnh trú. Nộp đơn miễn phí.',
        en: '8,000 JPY paid via revenue stamps upon approval. Free to submit.',
      },
    },
    officialActionUrl: 'https://www.moj.go.jp/isa/applications/procedures/16-4.html',
    relatedLifeEventCapability: 'immigration.permanent-residence',
  },

  'procedure.child-allowance-claim': {
    id: 'procedure.child-allowance-claim',
    country: 'JP',
    domain: PROCEDURE_DOMAINS.FAMILY,
    titleJa: '児童手当認定請求',
    titleI18n: {
      ja: '児童手当認定請求',
      vi: 'Thủ tục đăng ký nhận trợ cấp trẻ em (Jidō Teate)',
      en: 'Child Allowance Certification Claim',
    },
    aliases: ['児童手当申請', '子ども手当', 'tro cap tre em', 'child allowance', 'jido teate'],
    authority: {
      type: 'municipal_office',
      nameJa: '現住所地の市区町村役場（子ども家庭課等）',
      nameI18n: {
        ja: '現住所地の市区町村役場（子ども家庭課等）',
        vi: 'Tòa thị chính nơi đang cư trú (Phòng Chăm sóc Trẻ em)',
        en: 'Current Municipal Office (Child & Family Division)',
      },
    },
    triggerEventI18n: {
      ja: '出生日、または前住所地からの転出予定日の翌日から15日以内に申請が必要。',
      vi: 'Trong vòng 15 ngày kể từ ngày sinh con hoặc ngày dự kiến chuyển đi từ nơi ở cũ.',
      en: 'Within 15 days following the date of birth or planned moving date.',
    },
    statutoryDeadlineI18n: {
      ja: '事由発生日の翌日から15日以内（遅れると申請月分の手当が受給できなくなります）',
      vi: 'Trong vòng 15 ngày (nộp trễ sẽ bị mất khoản tiền trợ cấp của những tháng bị muộn).',
      en: 'Within 15 days of event date (late application results in forfeited months).',
    },
    documentRequirementIds: [
      'req.child-allowance.resident-record',
      'req.child-allowance.taxation-cert',
      'req.child-allowance.mynumber',
    ],
    submissionMethods: ['counter', 'mail', 'myna_portal'],
    feeRules: {
      feeType: 'free',
      feeAmountJpy: 0,
      feeNoteI18n: {
        ja: '申請手数料は無料です。',
        vi: 'Thủ tục hoàn toàn miễn phí.',
        en: 'Free of charge.',
      },
    },
    officialActionUrl: 'https://www.cfa.go.jp/policies/child-allowance/',
    relatedLifeEventCapability: 'family.child-allowance',
  },

  'procedure.moving-in-notification': {
    id: 'procedure.moving-in-notification',
    country: 'JP',
    domain: PROCEDURE_DOMAINS.MOVING,
    titleJa: '転入届 / 転居届',
    titleI18n: {
      ja: '転入届 / 転居届',
      vi: 'Thủ tục thông báo chuyển đến (Tennyū-todoke / Tenkyo-todoke)',
      en: 'Moving-in / Change of Address Notification',
    },
    aliases: ['転入届', '転居届', 'thong bao chuyen den', 'moving in', 'change of address'],
    authority: {
      type: 'municipal_office',
      nameJa: '新住所地の市区町村役場（市民課・住民戸籍課等）',
      nameI18n: {
        ja: '新住所地の市区町村役場（市民課・住民戸籍課等）',
        vi: 'Tòa thị chính nơi ở mới (Phòng Đăng ký Cư dân)',
        en: 'New Municipal Office (Citizen Registration Division)',
      },
    },
    triggerEventI18n: {
      ja: '新しい住所に実際に住み始めた日から14日以内に手続きが必要。',
      vi: 'Trong vòng 14 ngày kể từ ngày thực tế dọn vào ở tại địa chỉ mới.',
      en: 'Within 14 days from the actual date you began living at the new address.',
    },
    statutoryDeadlineI18n: {
      ja: '新住所への引越し後14日以内（住民基本台帳法第22条）',
      vi: 'Trong vòng 14 ngày sau khi chuyển đến (Điều 22 Luật Đăng ký Cư dân).',
      en: 'Within 14 days after moving into new residence (Basic Resident Registration Act Art. 22).',
    },
    documentRequirementIds: [
      'req.moving-in.mynumber-card',
      'req.moving-in.residence-card',
    ],
    submissionMethods: ['counter'],
    feeRules: {
      feeType: 'free',
      feeAmountJpy: 0,
      feeNoteI18n: {
        ja: '住民登録の手続き自体は無料です。',
        vi: 'Thủ tục đăng ký thay đổi địa chỉ là miễn phí.',
        en: 'Registration procedure is free of charge.',
      },
    },
    officialActionUrl: 'https://www.soumu.go.jp/main_sosiki/jichi_gyousei/c-gyousei/zairyu/',
    relatedLifeEventCapability: 'housing.moving-in',
  },

  'procedure.employment-insurance-benefit-claim': {
    id: 'procedure.employment-insurance-benefit-claim',
    country: 'JP',
    domain: PROCEDURE_DOMAINS.EMPLOYMENT,
    titleJa: '雇用保険基本手当の受給手続（失業保険申請）',
    titleI18n: {
      ja: '雇用保険基本手当の受給手続（失業保険申請）',
      vi: 'Thủ tục nhận trợ cấp thất nghiệp (Bảo hiểm việc làm Hello Work)',
      en: 'Employment Insurance Basic Allowance Claim (Unemployment Benefit)',
    },
    aliases: ['失業保険申請', 'ハローワーク失業手当', 'bao hiem that nghiep', 'unemployment claim'],
    authority: {
      type: 'public_employment_office',
      nameJa: '所轄のハローワーク（公共職業安定所）',
      nameI18n: {
        ja: '所轄のハローワーク（公共職業安定所）',
        vi: 'Trung tâm Hello Work phụ trách khu vực cư trú',
        en: 'Jurisdictional Hello Work Office',
      },
    },
    triggerEventI18n: {
      ja: '会社を退職し、離職票が自宅に届いた後、就職活動を開始するとき。',
      vi: 'Sau khi nghỉ việc và nhận được phiếu Rishokuhyo từ công ty, khi bắt đầu tìm việc.',
      en: 'After resigning and receiving separation slips (Rishokuhyo) from employer.',
    },
    statutoryDeadlineI18n: {
      ja: '退職日の翌日から原則1年間が受給期限（早めの手続きを推奨）',
      vi: 'Hạn chót thụ hưởng trong vòng 1 năm kể từ ngày nghỉ việc (càng làm sớm càng tốt).',
      en: 'Within 1 year following resignation date (earlier submission recommended).',
    },
    documentRequirementIds: [
      'req.unemployment.separation-cert',
      'req.unemployment.withholding-slip',
    ],
    submissionMethods: ['counter'],
    feeRules: {
      feeType: 'free',
      feeAmountJpy: 0,
      feeNoteI18n: {
        ja: '申請手数料は無料です。',
        vi: 'Thủ tục hoàn toàn miễn phí.',
        en: 'Free of charge.',
      },
    },
    officialActionUrl: 'https://www.hellowork.mhlw.go.jp/',
    relatedLifeEventCapability: 'employment.unemployment',
  },
};

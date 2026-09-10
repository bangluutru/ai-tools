/**
 * @file packages/core/src/japan/employment/rules/unemploymentEligibilityRules.js
 * @description
 * Statutory Rules for Japan Unemployment Insurance Eligibility (基本手当受給資格ルール)
 * In accordance with:
 * - 雇用保険法 第13条 (受給要件)
 * - 雇用保険法 第23条 (特定受給資格者及び特定理由離職者)
 * - 雇用保険法 第33条 (給付制限)
 * - 厚生労働省・ハローワーク 業務取扱要領
 */

export const UNEMPLOYMENT_ELIGIBILITY_SOURCES = [
  'mhlw-hellowork-unemployment-guide',
  'egov-employment-insurance-act'
];

/**
 * Phân loại các lý do thôi việc luật định
 */
export const SEPARATION_REASONS = {
  // Nhóm 1: Do lỗi người sử dụng lao động / hoàn cảnh công ty (特定受給資格者 - Type A)
  COMPANY_CAUSE: [
    {
      id: 'bankruptcy_closure',
      code: 'TYPE_A_BANKRUPTCY',
      ja: '倒産・事業所廃止・破産手続き開始',
      vi: 'Công ty phá sản, giải thể, đóng cửa văn phòng/chi nhánh',
      en: 'Company bankruptcy, business closure, liquidation',
      evidenceGuideJa: '事業主都合の離職票、登記簿謄本、閉鎖通知書等',
      evidenceGuideVi: 'Giấy chứng nhận thôi việc (離職票-2) ghi mã lý do công ty, thông báo đóng cửa'
    },
    {
      id: 'dismissal_restructure',
      code: 'TYPE_A_DISMISSAL',
      ja: '解雇（重責解雇を除く）・人員整理・希望退職の募集',
      vi: 'Bị sa thải (không phải lỗi nghiêm trọng), cắt giảm biên chế, thôi việc tự nguyện theo diện tái cơ cấu',
      en: 'Involuntary dismissal (except gross misconduct), restructuring, voluntary severance buyout',
      evidenceGuideJa: '解雇予告通知書、希望退職募集要項等',
      evidenceGuideVi: 'Thông báo sa thải trước hạn, quy chế kêu gọi thôi việc tái cấu trúc'
    },
    {
      id: 'unpaid_wages',
      code: 'TYPE_A_UNPAID_WAGES',
      ja: '給与の未払い・遅延（賃金額の1/3超の未払いが2ヶ月以上連続）',
      vi: 'Nợ lương, chậm lương (chậm trên 1/3 mức lương trong 2 tháng liên tiếp trở lên)',
      en: 'Unpaid/delayed wages (> 1/3 of wage unpaid for 2+ consecutive months)',
      evidenceGuideJa: '給与明細書、通帳の記帳記録、未払い証明書等',
      evidenceGuideVi: 'Bảng lương, sổ ngân hàng đối soát nợ lương, văn bản xác nhận chưa thanh toán'
    },
    {
      id: 'excessive_overtime',
      code: 'TYPE_A_OVERTIME',
      ja: '過度な時間外労働（直前3ヶ月平均45h超、または1ヶ月100h超、または2ヶ月平均80h超）',
      vi: 'Tăng ca quá mức vượt ngưỡng Karoshi (3 tháng liền bình quân >45h, hoặc 1 tháng >100h, hoặc 2 tháng bình quân >80h)',
      en: 'Excessive overtime (> 100h in 1 mo, or > 80h/mo avg for 2 mos, or > 45h/mo for 3 mos)',
      evidenceGuideJa: 'タイムカード、給与明細の残業時間記録、勤怠ログ等',
      evidenceGuideVi: 'Thẻ chấm công, log chấm công điện tử, giờ làm thêm ghi trên bảng lương'
    },
    {
      id: 'harassment',
      code: 'TYPE_A_HARASSMENT',
      ja: '職場でのパワハラ・セクハラ・嫌がらせ（会社が是正措置をとらなかった）',
      vi: 'Bị bạo lực quyền lực (power harassment), quấy rối mà công ty không có biện pháp giải quyết',
      en: 'Workplace harassment/bullying without corrective company response',
      evidenceGuideJa: '公的相談窓口（労働基準監督署等）への相談記録、メール・録音・医師診断書等',
      evidenceGuideVi: 'Biên bản tư vấn thanh tra lao động, email/tin nhắn bằng chứng, giấy khám bác sĩ'
    },
    {
      id: 'relocation_impossible',
      code: 'TYPE_A_RELOCATION',
      ja: '事業所移転による通勤困難（往復4時間以上等）',
      vi: 'Công ty đổi địa điểm làm việc khiến việc đi lại khó khăn vượt mức (đi về trên 4 tiếng/ngày)',
      en: 'Office relocation resulting in unreasonable commute (> 4 hours roundtrip)',
      evidenceGuideJa: '移転通知書、通勤経路・所要時間証明等',
      evidenceGuideVi: 'Thông báo điều động/chuyển văn phòng, lộ trình tàu và thời gian đi lại'
    }
  ],

  // Nhóm 2: Lý do cá nhân chính đáng ngoài ý muốn (特定理由離職者 - Type B)
  SPECIFIC_REASONS: [
    {
      id: 'contract_expired_refused',
      code: 'TYPE_B_CONTRACT_EXPIRED',
      ja: '期間満了（有期契約の更新を希望したが更新されなかった・雇止め）',
      vi: 'Hết hạn hợp đồng có thời hạn (lao động muốn gia hạn nhưng công ty từ chối / 雇止め)',
      en: 'Fixed-term contract expired; worker desired renewal but was refused (Yatoi-dome)',
      evidenceGuideJa: '労働条件通知書、雇用契約書（更新条項あり）、更新拒否通知等',
      evidenceGuideVi: 'Hợp đồng lao động có điều khoản xem xét gia hạn, thông báo không tái ký'
    },
    {
      id: 'illness_injury',
      code: 'TYPE_B_ILLNESS',
      ja: '病気・負傷・障害等により従来の業務の継続が不可能となった',
      vi: 'Ốm đau, tai nạn, sức khỏe không còn đủ khả năng tiếp tục công việc hiện tại',
      en: 'Medical illness, injury, or physical condition making continuation impossible',
      evidenceGuideJa: '医師の診断書（就労不能または配置転換推奨の記載）',
      evidenceGuideVi: 'Giấy khám chẩn đoán của bác sĩ nêu rõ không thể làm việc nặng/công việc hiện tại'
    },
    {
      id: 'caregiving_childcare',
      code: 'TYPE_B_CAREGIVING',
      ja: '父母・配偶者等の常時介護、育児等で勤務継続が困難',
      vi: 'Phải chăm sóc thường xuyên bố mẹ/vợ/chồng ốm nặng hoặc nuôi con nhỏ không có ai hỗ trợ',
      en: 'Family nursing care, elder care, or unavoidable childcare constraints',
      evidenceGuideJa: '要介護認定通知書、医師の診断書、住民票等',
      evidenceGuideVi: 'Giấy chứng nhận mức độ cần chăm sóc (要介護), hồ sơ y tế người thân'
    },
    {
      id: 'marriage_move',
      code: 'TYPE_B_MARRIAGE_MOVE',
      ja: '結婚に伴う住所移転、配偶者の転勤への同行等による通勤困難',
      vi: 'Chuyển chỗ ở do kết hôn hoặc phải chuyển theo vợ/chồng chuyển công tác',
      en: 'Relocation due to marriage or accompanying spouse mandatory job transfer',
      evidenceGuideJa: '配偶者の転勤辞令、住民票、戸籍謄本等',
      evidenceGuideVi: 'Quyết định chuyển công tác của vợ/chồng, phiếu cư trú mới (住民票)'
    }
  ],

  // Nhóm 3: Tự ý nghỉ việc theo nguyện vọng cá nhân (一般離職者 / 自己都合退職 - Type C)
  PERSONAL_VOLUNTARY: [
    {
      id: 'personal_choice',
      code: 'TYPE_C_PERSONAL',
      ja: '自己都合退職（転職準備、ステップアップ、起業、個人的休養等）',
      vi: 'Tự ý nghỉ việc vì lý do cá nhân (đổi việc, chuẩn bị khởi nghiệp, nâng cao bản thân, nghỉ ngơi)',
      en: 'Voluntary personal resignation (career change, entrepreneurship, personal break)',
      evidenceGuideJa: '退職届、離職票-2（自己都合離職コード4D等）',
      evidenceGuideVi: 'Đơn xin thôi việc tự nguyện, giấy thôi việc ghi mã lý do 4D'
    },
    {
      id: 'disciplinary_dismissal',
      code: 'TYPE_C_DISCIPLINARY',
      ja: '重責解雇（労働者の重大な規律違反・背任等による懲戒解雇）',
      vi: 'Sa thải kỷ luật nặng do vi phạm nội quy/pháp luật nghiêm trọng (重責解雇)',
      en: 'Disciplinary dismissal for serious personal misconduct',
      evidenceGuideJa: '懲戒処分通知書、解雇理由書等',
      evidenceGuideVi: 'Văn bản kỷ luật sa thải, thông báo xử lý vi phạm'
    }
  ]
};

/**
 * Bảng tiêu chuẩn thụ hưởng theo từng nhóm lý do thôi việc
 */
export const ELIGIBILITY_CRITERIA_BY_CATEGORY = {
  COMPANY_CAUSE: {
    categoryNameJa: '特定受給資格者（倒産・解雇等）',
    categoryNameVi: 'Người hưởng diện đặc định (Do công ty sa thải, phá sản, lỗi người SDLĐ)',
    categoryNameEn: 'Qualified Recipient with Company-Attributable Separation',
    requiredInsuredMonths: 6,
    referencePeriodYears: 1,
    waitingPeriodDays: 7,
    benefitRestrictionMonths: 0,
    hasBenefitRestriction: false,
    benefitDurationFavor: 'Favorable (倒産・解雇等基準: 90日〜330日)'
  },
  SPECIFIC_REASONS: {
    categoryNameJa: '特定理由離職者（雇止め・正当な理由のある自己都合）',
    categoryNameVi: 'Người thôi việc có lý do đặc định (Hết hạn hợp đồng, ốm đau, việc gia đình chính đáng)',
    categoryNameEn: 'Job Leaver with Specific Justified Reasons (Contract expiry, illness, caregiving)',
    requiredInsuredMonths: 6,
    referencePeriodYears: 1,
    waitingPeriodDays: 7,
    benefitRestrictionMonths: 0,
    hasBenefitRestriction: false,
    benefitDurationFavor: 'Favorable (雇止め等特定理由離職者は一部特定受給資格者と同等の給付日数)'
  },
  PERSONAL_VOLUNTARY: {
    categoryNameJa: '一般離職者（通常の自己都合退職）',
    categoryNameVi: 'Lao động thôi việc thông thường (Tự ý xin nghỉ việc vì lý do cá nhân)',
    categoryNameEn: 'Standard Voluntary Resignation',
    requiredInsuredMonths: 12,
    referencePeriodYears: 2,
    waitingPeriodDays: 7,
    benefitRestrictionMonths: 2, // Quy chuẩn hiện hành là 2 tháng
    hasBenefitRestriction: true,
    benefitDurationFavor: 'Standard (一般基準: 90日〜150日)'
  },
  DISCIPLINARY: {
    categoryNameJa: '重責解雇（懲戒処分）',
    categoryNameVi: 'Sa thải kỷ luật nặng (Do lỗi nghiêm trọng của người lao động)',
    categoryNameEn: 'Disciplinary Dismissal for Gross Misconduct',
    requiredInsuredMonths: 12,
    referencePeriodYears: 2,
    waitingPeriodDays: 7,
    benefitRestrictionMonths: 3, // 3 tháng hạn chế chi trả
    hasBenefitRestriction: true,
    benefitDurationFavor: 'Standard (一般基準: 90日〜150日, 3ヶ月給付制限)'
  }
};

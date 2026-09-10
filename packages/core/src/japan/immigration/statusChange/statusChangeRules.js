/**
 * @file packages/core/src/japan/immigration/statusChange/statusChangeRules.js
 * @description
 * Quy tắc pháp lý chính thức về Thay đổi Tư cách Lưu trú tại Nhật Bản (在留資格変更許可).
 * Căn cứ:
 * - Điều 20 Luật Kiểm soát Xuất nhập cảnh và Công nhận Người tị nạn (出入国管理及び難民認定法第20条).
 * - Lệnh thu phí Luật Nhập quản (出入国管理及び難民認定法関係手数料令第2条).
 * - Tiêu chuẩn cấp phép của Cục Quản lý Xuất nhập cảnh và Lưu trú Nhật Bản (出入国在留管理庁 - ISA).
 */

import { defineRuleMetadata } from '../../../regulatory/ruleMetadata.js';
import { JAPAN_JURISDICTION } from '../../../regulatory/jurisdiction.js';

/**
 * Metadata cho quy tắc lệ phí thay đổi tư cách lưu trú
 * Áp dụng theo ngày nộp hồ sơ (applicationDate): 4.000 JPY trước 2026-10-01, 6.000 JPY từ 2026-10-01.
 */
export const STATUS_CHANGE_FEE_RULE = defineRuleMetadata({
  id: 'jp-imm-status-change-fee-2026',
  jurisdiction: JAPAN_JURISDICTION,
  sourceId: 'isa-fee-table',
  effectiveFrom: '1990-06-01',
  applicablePeriod: { type: 'calendar-year', from: 1990, to: 2099 },
  version: '2026.1',
  lastVerifiedAt: '2026-09-11',
  status: 'verified',
  effectiveBy: 'applicationDate',
  ruleNature: 'deterministic',
  notes: 'Lệ phí nộp bằng tem doanh thu (収入印紙) khi nhận kết quả cấp phép mới. Mức phí xác định theo ngày nộp đơn.',
});

/**
 * Các đường dẫn chuyển đổi phổ biến và tiêu chí pháp định
 */
export const STATUS_TRANSITION_ROUTES = {
  // 1. Du học sinh tốt nghiệp đi làm (留学 -> 技人国)
  STUDENT_TO_WORK: {
    id: 'student_to_work',
    fromCategory: 'student',
    toCategory: 'engineer_specialist',
    title_ja: '留学生から就労ビザ（技術・人文知識・国際業務）への変更',
    title_vn: 'Chuyển từ Du học sang Visa lao động kỹ thuật / nghiệp vụ quốc tế (技人国)',
    title_en: 'Change from Student to Engineer / Specialist in Humanities / Int. Services',
    legalBasis: '出入国管理及び難民認定法第20条、法務省告示「出入国管理及び難民認定法第7条第1項第2号の基準」',
    coreRequirements: [
      {
        id: 'education_qualification',
        label_ja: '学歴要件（日本の大学・短大・大学院、または専修学校専門士・高度専門士、または外国の大学卒業）',
        label_vn: 'Điều kiện học vấn (Đại học/Cao đẳng tại Nhật hoặc nước ngoài, hoặc Senmon-shi tại trường nghề Nhật)',
        label_en: 'Educational degree (University/College in Japan/overseas, or Senmon-shi from JP vocational school)',
        required: true,
      },
      {
        id: 'major_job_relevance',
        label_ja: '専攻内容と従事する業務内容の関連性（特に専修学校卒業生は厳格審査）',
        label_vn: 'Tính liên quan chặt chẽ giữa ngành học và nội dung công việc đảm nhận',
        label_en: 'Direct relevance between major and prospective job duties',
        required: true,
      },
      {
        id: 'equal_remuneration',
        label_ja: '報酬要件（日本人と同等額以上の報酬を受けること）',
        label_vn: 'Mức lương từ mức tương đương người Nhật trở lên cho cùng vị trí',
        label_en: 'Remuneration equal to or higher than a Japanese national in equivalent position',
        required: true,
      },
      {
        id: 'company_stability',
        label_ja: '受入機関の適格性・継続性（カテゴリー1〜4に応じた立証書類）',
        label_vn: 'Tính hợp lệ và ổn định tài chính của cơ quan tiếp nhận (Category 1 đến 4)',
        label_en: 'Eligibility and financial stability of employer (Categories 1-4)',
        required: true,
      }
    ],
    prohibitionWarning_ja: '変更許可が下りる前にフルタイム勤務を開始することは不法就労（資格外活動違反）となります。',
    prohibitionWarning_vn: 'Bắt đầu làm việc toàn thời gian trước khi nhận được thẻ cư trú mới là vi phạm lao động bất hợp pháp.',
    prohibitionWarning_en: 'Starting full-time employment prior to grant of status change constitutes unlawful employment.'
  },

  // 2. Du học sinh / Thực tập sinh chuyển sang Kỹ năng đặc định (留学 / 技能実習 -> 特定技能1号)
  STUDENT_OR_TIT_TO_SSW: {
    id: 'student_to_ssw',
    fromCategory: 'student',
    toCategory: 'specified_skilled_1',
    title_ja: '留学生・実習生から特定技能1号への変更',
    title_vn: 'Chuyển từ Du học sinh hoặc Thực tập sinh sang Kỹ năng đặc định số 1 (特定技能1号)',
    title_en: 'Change from Student or Technical Intern to Specified Skilled Worker (i)',
    legalBasis: '出入国管理及び難民認定法別表第1の2の表「特定技能」、特定技能基準省令',
    coreRequirements: [
      {
        id: 'skills_exam',
        label_ja: '該当分野の特定技能評価試験の合格（技能実習2号良好修了者は免除）',
        label_vn: 'Thi đậu Kỳ thi đánh giá Kỹ năng đặc định ngành tương ứng (Miễn thi nếu hoàn thành tốt TTS số 2)',
        label_en: 'Passed field-specific skills evaluation exam (exempt if completed Technical Intern Training ii)',
        required: true,
      },
      {
        id: 'language_exam',
        label_ja: '日本語能力試験N4以上またはJFT-Basic A2以上（実習2号良好修了者は免除）',
        label_vn: 'Chứng chỉ JLPT N4 trở lên hoặc JFT-Basic A2 trở lên (Miễn thi nếu hoàn thành tốt TTS số 2)',
        label_en: 'JLPT N4+ or JFT-Basic A2+ (exempt if completed Technical Intern Training ii)',
        required: true,
      },
      {
        id: 'support_plan',
        label_ja: '1号特定技能外国人支援計画（登録支援機関への委託または自社支援）',
        label_vn: 'Kế hoạch hỗ trợ người nước ngoài Kỹ năng đặc định số 1 (Tự tổ chức hoặc qua TSK)',
        label_en: 'SSW 1 Foreign Worker Support Plan (via Registered Support Org or in-house)',
        required: true,
      },
      {
        id: 'equal_remuneration',
        label_ja: '日本人と同等以上の報酬待遇',
        label_vn: 'Đãi ngộ tiền lương ngang bằng hoặc cao hơn người Nhật cùng kinh nghiệm',
        label_en: 'Equal or higher remuneration compared to Japanese peers',
        required: true,
      }
    ]
  },

  // 3. Phụ thuộc gia đình chuyển sang làm việc độc lập (家族滞在 -> 技人国)
  DEPENDENT_TO_WORK: {
    id: 'dependent_to_work',
    fromCategory: 'dependent',
    toCategory: 'engineer_specialist',
    title_ja: '家族滞在から就労ビザ（技術・人文知識・国際業務）への変更',
    title_vn: 'Chuyển từ Visa Gia đình phụ thuộc sang Visa Lao động độc lập (技人国)',
    title_en: 'Change from Dependent to Engineer / Specialist in Humanities',
    legalBasis: '出入国管理及び難民認定法第20条',
    coreRequirements: [
      {
        id: 'education_or_experience',
        label_ja: '大卒以上の学歴または10年以上の関連実務経験（国際業務は3年以上）',
        label_vn: 'Bằng Đại học trở lên hoặc tối thiểu 10 năm kinh nghiệm thực tế (Nghiệp vụ quốc tế 3 năm)',
        label_en: 'University degree or 10+ years relevant experience (3+ for International Services)',
        required: true,
      },
      {
        id: 'job_offer_contract',
        label_ja: '雇用契約の締結と安定的な報酬額（月額20万円程度以上が目安）',
        label_vn: 'Hợp đồng lao động chính thức với mức thù lao ổn định (thông thường từ 200.000 JPY/tháng)',
        label_en: 'Employment contract with adequate compensation (approx. 200,000+ JPY/month benchmark)',
        required: true,
      },
      {
        id: 'tax_pension_independence',
        label_ja: '扶養からの離脱（配偶者控除・健康保険扶養の解除準備）',
        label_vn: 'Chuẩn bị rút khỏi diện phụ thuộc thuế và BHYT của vợ/chồng bảo lãnh',
        label_en: 'Removal from spouse dependent status for tax & health insurance purposes',
        required: true,
      }
    ]
  },

  // 4. Bất kỳ tư cách nào sang Kết hôn với người Nhật (配偶者ビザ)
  ANY_TO_SPOUSE_JAPANESE: {
    id: 'any_to_spouse_japanese',
    fromCategory: 'any',
    toCategory: 'spouse_japanese',
    title_ja: '各種在留資格から「日本人の配偶者等」への変更',
    title_vn: 'Chuyển sang Tư cách Người phối ngẫu của Công dân Nhật Bản (日本人の配偶者等)',
    title_en: 'Change to Spouse or Child of Japanese National',
    legalBasis: '出入国管理及び難民認定法別表第2「日本人の配偶者等」',
    coreRequirements: [
      {
        id: 'legal_marriage_both_countries',
        label_ja: '日・本国双方で法的に有効に成立した婚姻（日本の戸籍謄本及び本国の婚姻証明書）',
        label_vn: 'Hôn nhân hợp pháp có hiệu lực tại cả Nhật Bản và quốc gia sở tại (Hộ tịch Nhật & Giấy ĐKKH)',
        label_en: 'Legally valid marriage registered in both Japan and home country',
        required: true,
      },
      {
        id: 'cohabitation_reality',
        label_ja: '実質的な共同生活の実態（同居生活・交際経緯の説明書・写真等の疎明資料）',
        label_vn: 'Đời sống chung thực tế (Cùng chung sống, bản giải trình quá trình quen biết, ảnh chứng minh)',
        label_en: 'Genuine cohabitation and shared married life supported by documentary evidence',
        required: true,
      },
      {
        id: 'economic_stability',
        label_ja: '夫婦双方または身元保証人による安定した生計能力（住民税課税証明書・納税証明書）',
        label_vn: 'Khả năng kinh tế duy trì cuộc sống ổn định của hai vợ chồng hoặc người bảo lãnh',
        label_en: 'Economic stability of couple or official guarantor (Tax Certificates)',
        required: true,
      }
    ],
    privilegeNote_ja: 'この在留資格に変更が許可されると、就労制限（職種・時間の制約）が一切なくなります。',
    privilegeNote_vn: 'Khi được cấp tư cách này, bạn sẽ được tự do làm việc không bị giới hạn ngành nghề hay thời gian.',
    privilegeNote_en: 'Upon granting this status, all employment restrictions (job type/hours) are removed.'
  },

  // 5. Bất kỳ tư cách nào sang Kết hôn với người Vĩnh trú (永住者の配偶者等)
  ANY_TO_SPOUSE_PR: {
    id: 'any_to_spouse_pr',
    fromCategory: 'any',
    toCategory: 'spouse_permanent_resident',
    title_ja: '各種在留資格から「永住者の配偶者等」への変更',
    title_vn: 'Chuyển sang Tư cách Người phối ngẫu của Người Vĩnh trú (永住者の配偶者等)',
    title_en: 'Change to Spouse or Child of Permanent Resident',
    legalBasis: '出入国管理及び難民認定法別表第2「永住者の配偶者等」',
    coreRequirements: [
      {
        id: 'legal_marriage_both_countries',
        label_ja: '法的に有効な婚姻関係（双方の国の婚姻証明）',
        label_vn: 'Quan hệ hôn nhân hợp pháp tại cả hai quốc gia',
        label_en: 'Legally valid marriage registered in both countries',
        required: true,
      },
      {
        id: 'cohabitation_reality',
        label_ja: '同居および共同生活の実態',
        label_vn: 'Thực tế chung sống và sinh hoạt chung',
        label_en: 'Genuine cohabitation evidence',
        required: true,
      },
      {
        id: 'guarantor_pr',
        label_ja: '永住者配偶者による身元保証書と課税・納税証明書',
        label_vn: 'Thư bảo lãnh của người bạn đời Vĩnh trú kèm chứng từ thuế/thu nhập',
        label_en: 'Guarantor letter and tax certificates from Permanent Resident spouse',
        required: true,
      }
    ]
  },

  // 6. Đi làm sang Khởi nghiệp / Quản lý kinh doanh (技人国 -> 経営・管理)
  WORK_TO_BUSINESS_MANAGER: {
    id: 'work_to_business_manager',
    fromCategory: 'engineer_specialist',
    toCategory: 'business_manager',
    title_ja: '就労ビザから「経営・管理」への変更',
    title_vn: 'Chuyển từ Visa Lao động sang Kinh doanh / Quản lý (経営・管理)',
    title_en: 'Change from Work Visa to Business Manager',
    legalBasis: '出入国管理及び難民認定法別表第1の2の表「経営・管理」、上陸基準省令',
    coreRequirements: [
      {
        id: 'physical_office',
        label_ja: '日本国内に独立した実態のある事業所の確保（法人名義の賃貸契約・看板・独立スペース）',
        label_vn: 'Có văn phòng kinh doanh thực tế, độc lập tại Nhật Bản (hợp đồng thuê đứng tên công ty, biển hiệu)',
        label_en: 'Secured dedicated business premises in Japan under corporate entity name',
        required: true,
      },
      {
        id: 'capital_or_scale',
        label_ja: '資本金500万円以上の出資または2名以上の常勤職員（日本人・永住者等）の雇用',
        label_vn: 'Vốn điều lệ tối thiểu 5.000.000 JPY hoặc thuê ít nhất 2 nhân viên chính thức (Nhật/Vĩnh trú)',
        label_en: 'Capital investment of 5,000,000+ JPY OR hiring 2+ full-time residents',
        required: true,
      },
      {
        id: 'feasible_business_plan',
        label_ja: '事業の継続性・実現可能性を立証する詳細な事業計画書および収支シミュレーション',
        label_vn: 'Bản kế hoạch kinh doanh chi tiết và bảng dự toán thu chi khả thi',
        label_en: 'Detailed, viable business plan demonstrating continuity and profitability',
        required: true,
      },
      {
        id: 'clear_source_of_funds',
        label_ja: '出資金の形成過程・送金経路の明確な説明（資金洗浄対策・出所証明）',
        label_vn: 'Giải trình rõ ràng nguồn gốc vốn góp và đường chuyển tiền vào Nhật Bản',
        label_en: 'Legitimate and verifiable source of investment capital',
        required: true,
      }
    ]
  },

  // 7. Visa Du lịch / Ngắn hạn xin đổi sang dài hạn (短期滞在 -> 中長期在留資格)
  TEMPORARY_VISITOR_CHANGE: {
    id: 'temporary_visitor_change',
    fromCategory: 'temporary_visitor',
    toCategory: 'any',
    title_ja: '短期滞在からの在留資格変更（原則不可・特例審査）',
    title_vn: 'Đổi tư cách từ Visa Ngắn hạn / Du lịch sang Cư trú Trung dài hạn (Nguyên tắc: KHÔNG CHO PHÉP)',
    title_en: 'Change from Temporary Visitor to Mid/Long-Term Status (Strict Exception Only)',
    legalBasis: '出入国管理及び難民認定法第20条第2項但書「やむを得ない特別の事情」',
    isExceptional: true,
    coreRequirements: [
      {
        id: 'unavoidable_circumstances',
        label_ja: '「やむを得ない特別の事情」の存在（在留資格認定証明書(COE)の交付を受けていること、または緊急性のある国際婚姻手続等）',
        label_vn: 'Có "hoàn cảnh đặc biệt bất khả kháng" (Đã được cấp Giấy chứng nhận tư cách lưu trú COE, hoặc kết hôn khẩn cấp)',
        label_en: 'Existence of "unavoidable special circumstances" (e.g. possessing issued COE or immediate marital setup)',
        required: true,
      }
    ],
    prohibitionWarning_ja: '入管法第20条第2項により、短期滞在からの在留資格変更は「やむを得ない特別の事情」がない限り受理されません。COE未所持の場合は原則一度出国が必要です。',
    prohibitionWarning_vn: 'Theo Điều 20 Khoản 2 Luật Nhập quản, việc đổi visa từ Du lịch/Ngắn hạn bị cấm trừ khi có hoàn cảnh đặc biệt (như đã có sẵn COE). Nếu không có COE, bạn phải xuất cảnh và xin visa từ đại sứ quán.',
    prohibitionWarning_en: 'Under Article 20 Paragraph 2 of the Immigration Act, status changes from Temporary Visitor are strictly barred unless unavoidable special circumstances exist (e.g. already holding a valid COE).'
  }
};

/**
 * Danh mục hồ sơ tài liệu theo phân loại cơ quan tiếp nhận (Category 1 - 4)
 * đối với visa Lao động kỹ thuật / nghiệp vụ quốc tế (技人国)
 */
export const STATUS_CHANGE_DOCUMENT_CATEGORIES = {
  CAT_1: {
    id: 'cat_1',
    name_ja: 'カテゴリー1（上場企業・地方公共団体・公的法人等）',
    name_vn: 'Category 1 (Doanh nghiệp niêm yết, cơ quan nhà nước, tổ chức công)',
    name_en: 'Category 1 (Listed companies, local governments, public corporations)',
    requiredDocs: [
      '在留資格変更許可申請書（写真貼付）',
      '四季報の写し又は日本の証券取引所に上場していることを証明する文書',
      '専門士・高度専門士の称号付与証明書又は卒業証明書（留学生の場合）',
      'パスポート及び在留カードの提示'
    ]
  },
  CAT_2: {
    id: 'cat_2',
    name_ja: 'カテゴリー2（前年分の給与所得の源泉徴収票等の法定調書合計表の源泉徴収税額が1,000万円以上）',
    name_vn: 'Category 2 (Doanh nghiệp có tổng thuế khấu trừ tại nguồn từ 10 triệu JPY trở lên)',
    name_en: 'Category 2 (Withholding tax amount of 10M+ JPY in statutory records)',
    requiredDocs: [
      '在留資格変更許可申請書（写真貼付）',
      '前年分の給与所得の源泉徴収票等の法定調書合計表（受付印のあるもの）',
      '卒業証明書及び学歴証明書類',
      'パスポート及び在留カードの提示'
    ]
  },
  CAT_3: {
    id: 'cat_3',
    name_ja: 'カテゴリー3（法定調書合計表が提出された前年実績のある中小企業等）',
    name_vn: 'Category 3 (Doanh nghiệp vừa và nhỏ có nộp bảng tổng hợp thuế khấu trừ tại nguồn)',
    name_en: 'Category 3 (SMEs with submitted statutory record reports)',
    requiredDocs: [
      '在留資格変更許可申請書（写真貼付）',
      '前年分の給与所得の源泉徴収票等の法定調書合計表（控の写し）',
      '労働契約書または採用内定通知書（労働条件明示書）',
      '会社の登記事項証明書（履歴事項全部証明書）',
      '直近年度の決算文書（貸借対照表・損益計算書）の写し',
      '会社案内パンフレット又は公式ウェブサイトの概要印刷',
      '卒業証明書（大学）又は専門士称号証明書（専門学校）',
      '成績証明書（専修学校生は必須）',
      '職歴証明書（実務経験を要件とする場合）',
      'パスポート及び在留カードの提示'
    ]
  },
  CAT_4: {
    id: 'cat_4',
    name_ja: 'カテゴリー4（新設会社・法定調書合計表のない個人事業主等）',
    name_vn: 'Category 4 (Công ty mới thành lập, hộ kinh doanh chưa có bảng tổng hợp thuế)',
    name_en: 'Category 4 (Newly established companies, sole proprietors without tax reports)',
    requiredDocs: [
      '在留資格変更許可申請書（写真貼付）',
      '法定調書合計表を提出できない理由書',
      '給与支払事務所等の開設届出書の写し',
      '直近3か月分の給与所得・退職所得等の所得税徴収高計算書（納付書）',
      '労働契約書または採用内定通知書（労働条件明示書）',
      '会社の登記事項証明書（履歴事項全部証明書）',
      '新設会社の場合は今後1年間の事業計画書',
      '会社案内又は業務内容説明資料',
      '卒業証明書、成績証明書',
      'パスポート及び在留カードの提示'
    ]
  }
};

export const IMMIGRATION_FEE_SCHEDULE_2026 = {
  EFFECTIVE_DATE: '2026-10-01',
  CURRENT_FEES: {
    RENEWAL: 4000,
    CHANGE: 4000,
    PERMANENT_RESIDENCE: 8000,
    ACQUISITION: 4000,
    CERTIFICATE_OF_AUTHORIZED_EMPLOYMENT: 1200,
  },
  NEW_FEES: {
    RENEWAL: 6000,
    CHANGE: 6000,
    PERMANENT_RESIDENCE: 10000,
    ACQUISITION: 6000,
    CERTIFICATE_OF_AUTHORIZED_EMPLOYMENT: 1400,
  },
  STATUTORY_BASIS: '出入国管理及び難民認定法関係手数料令第2条',
};

/**
 * Đánh giá mức phí dựa trên ngày nộp hồ sơ / ngày quyết định
 */
export function getStatusChangeFeeSchedule(applicationDate = new Date().toISOString().slice(0, 10)) {
  const isPostOct2026 = applicationDate >= IMMIGRATION_FEE_SCHEDULE_2026.EFFECTIVE_DATE;
  const amount = isPostOct2026
    ? IMMIGRATION_FEE_SCHEDULE_2026.NEW_FEES.CHANGE
    : IMMIGRATION_FEE_SCHEDULE_2026.CURRENT_FEES.CHANGE;

  return {
    amount,
    currency: 'JPY',
    paymentMethod: '収入印紙 (Revenue Stamp)',
    condition_ja: '許可時のみ納付（不許可の場合は手数料不要）',
    condition_vn: 'Chỉ nộp khi có kết quả ĐƯỢC CHẤP THUẬN (Từ chối không mất phí)',
    condition_en: 'Payable only upon approval (No fee charged if denied)',
    statutoryBasis: IMMIGRATION_FEE_SCHEDULE_2026.STATUTORY_BASIS,
    note: isPostOct2026
      ? '2026年10月1日以降の手数料改定（6,000円）が適用されます。'
      : '2026年9月30日までの現行手数料（4,000円）が適用されます。'
  };
}

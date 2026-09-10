/**
 * @file packages/core/src/japan/immigration/workScope/workScopeRules.js
 * @description
 * Định nghĩa quy chuẩn phân loại công việc và bảng quy tắc đối chiếu phạm vi làm việc (Work Scope Rules).
 * Tích hợp chặt chẽ với RuleMetadata và OfficialSourceRegistry.
 */

import { defineRuleMetadata } from '../../../regulatory/ruleMetadata.js';
import { JAPAN_JURISDICTION } from '../../../regulatory/jurisdiction.js';

/**
 * @typedef {'engineering_it'
 *   | 'humanities_business'
 *   | 'business_management'
 *   | 'specialized_cuisine'
 *   | 'nursing_care_certified'
 *   | 'academic_research'
 *   | 'part_time_general'
 *   | 'manual_labor'
 *   | 'adult_entertainment'
 *   | 'other_activity'} ActivityCategoryId
 *
 * @typedef {Object} ActivityCategoryDefinition
 * @property {ActivityCategoryId} id
 * @property {string} labelJa
 * @property {string} labelVi
 * @property {string} labelEn
 * @property {string} descriptionJa
 * @property {string} descriptionVi
 * @property {string} descriptionEn
 * @property {boolean} isAdultEntertainment - Có phải ngành phong tục/giải trí người lớn không (風俗営業)
 */

export const ACTIVITY_CATEGORIES = Object.freeze({
  engineering_it: {
    id: 'engineering_it',
    labelJa: 'IT・ソフトウェア開発・自然科学系技術職',
    labelVi: 'CNTT / Lập trình phần mềm / Kỹ thuật công nghệ',
    labelEn: 'IT / Software Engineering / Technical Roles',
    descriptionJa: 'プログラミング、システム開発、インフラ構築、機械・電気設計、AI・データ分析など理学・工学の専門知識を要する業務。',
    descriptionVi: 'Phát triển phần mềm, kỹ sư hệ thống, thiết kế cơ khí, điện tử, dữ liệu... đòi hỏi chuyên môn khoa học kỹ thuật.',
    descriptionEn: 'Software engineering, infrastructure, mechanical/electrical design, AI & data analytics requiring scientific knowledge.',
    isAdultEntertainment: false,
  },
  humanities_business: {
    id: 'humanities_business',
    labelJa: '貿易・マーケティング・通訳翻訳・事務系専門職',
    labelVi: 'Thương mại quốc tế / Marketing / Phiên dịch / Văn phòng chuyên môn',
    labelEn: 'International Trade / Marketing / Translation / Humanities',
    descriptionJa: '海外取引、マーケティング企画、通訳・翻訳、語学指導、広報、経理など人文科学・国際業務に属する業務。',
    descriptionVi: 'Giao dịch quốc tế, xúc tiến thương mại, biên phiên dịch, kế toán, quan hệ công chúng, tư vấn nghiệp vụ quốc tế.',
    descriptionEn: 'Foreign trade, marketing, interpretation/translation, language instruction, PR, corporate finance.',
    isAdultEntertainment: false,
  },
  business_management: {
    id: 'business_management',
    labelJa: '会社経営・役員・事業管理',
    labelVi: 'Điều hành doanh nghiệp / Giám đốc đại diện / Quản lý kinh doanh',
    labelEn: 'Business Operation / Executive Director / Enterprise Management',
    descriptionJa: '自ら法人を設立して代表取締役・役員として経営を行う活動、または管理職として事業を統括する業務。',
    descriptionVi: 'Thành lập công ty, giữ chức vụ Giám đốc đại diện/Ủy viên hội đồng quản trị hoặc cấp quản lý điều hành kinh doanh.',
    descriptionEn: 'Operating an enterprise as representative director/executive, or managerial supervision of business operations.',
    isAdultEntertainment: false,
  },
  specialized_cuisine: {
    id: 'specialized_cuisine',
    labelJa: '外国料理の熟練調理師（ベトナム料理・中華・フランス料理等）',
    labelVi: 'Đầu bếp chuyên nghiệp món ăn nước ngoài (Việt, Hoa, Âu...)',
    labelEn: 'Skilled Foreign Cuisine Chef',
    descriptionJa: '外国において考案された料理の調理・食品製造に係る熟練した技能（原則10年以上の実務経験を要する業務）。',
    descriptionVi: 'Chế biến món ăn nước ngoài đặc thù với tay nghề cao (quy chuẩn ISA thường yêu cầu 10 năm kinh nghiệm thực tế trở lên).',
    descriptionEn: 'Preparation of specialty foreign cuisine requiring seasoned skills (standard requirement is 10+ years experience).',
    isAdultEntertainment: false,
  },
  nursing_care_certified: {
    id: 'nursing_care_certified',
    labelJa: '介護福祉士（日本の国家資格取得者）',
    labelVi: 'Hộ lý / Chăm sóc người cao tuổi có chứng chỉ quốc gia Nhật',
    labelEn: 'Certified Care Worker (National License Holder)',
    descriptionJa: '日本の介護福祉士国家資格を保有し、介護施設等で介護又は介護指導を行う業務。',
    descriptionVi: 'Làm việc chăm sóc người cao tuổi/bệnh nhân tại cơ sở y tế/dưỡng lão dành cho người có bằng Kaigofukushishi Nhật Bản.',
    descriptionEn: 'Caregiving and care instruction at facilities provided by Japanese Certified Care Workers.',
    isAdultEntertainment: false,
  },
  academic_research: {
    id: 'academic_research',
    labelJa: '大学教授・研究機関の研究員・教育指導',
    labelVi: 'Giáo sư đại học / Nghiên cứu sinh / Giảng dạy học thuật',
    labelEn: 'University Professor / Academic Researcher',
    descriptionJa: '大学等の教育機関における研究、研究指導、又は教育活動。',
    descriptionVi: 'Nghiên cứu khoa học, giảng dạy và hướng dẫn học thuật tại các trường đại học hoặc viện nghiên cứu.',
    descriptionEn: 'Research, guidance, or teaching activities at universities or higher academic research institutions.',
    isAdultEntertainment: false,
  },
  part_time_general: {
    id: 'part_time_general',
    labelJa: '一般的なアルバイト（コンビニ・飲食ホール・ホテル客室清掃等）',
    labelVi: 'Việc làm thêm thông thường (Cửa hàng tiện lợi, bồi bàn nhà hàng, dọn phòng)',
    labelEn: 'General Part-time Jobs (Convenience store, waitstaff, hotel cleaning)',
    descriptionJa: 'コンビニ店員、ファミレスや居酒屋の接客ホール、スーパーレジ、清掃、配達などの一般補助業務。',
    descriptionVi: 'Bán hàng combini, thu ngân, bồi bàn nhà hàng quán ăn, dọn dẹp buồng phòng khách sạn, giao hàng...',
    descriptionEn: 'Retail staff, restaurant service, supermarket cashier, housekeeping, delivery support.',
    isAdultEntertainment: false,
  },
  manual_labor: {
    id: 'manual_labor',
    labelJa: '単純労働・工場ライン作業・建設現場作業員',
    labelVi: 'Lao động phổ thông thuần túy / Công nhân dây chuyền / Phụ việc công trường',
    labelEn: 'Pure Manual Labor / Factory Line Assembly / Construction Laborer',
    descriptionJa: '工場での単純組み立て、倉庫でのピッキング・梱包、建設現場での単純土木作業など。',
    descriptionVi: 'Lắp ráp đơn thuần tại nhà máy, bốc dỡ hàng hóa kho bãi, lao động chân tay cơ bản tại công trường...',
    descriptionEn: 'Simple assembly lines, warehouse sorting/packing, general site labor.',
    isAdultEntertainment: false,
  },
  adult_entertainment: {
    id: 'adult_entertainment',
    labelJa: '風俗営業・スナック・キャバクラ・パチンコ・性風俗関連特殊営業',
    labelVi: 'Kinh doanh phong tục / Tiếp rượu / Bar / Pachinko / Giải trí người lớn',
    labelEn: 'Adult Entertainment / Cabaret Club / Host Club / Pachinko / Sex Industry',
    descriptionJa: '風営法第2条に規定される接待飲食等営業（キャバクラ、ホストクラブ、スナックでの接待）、パチンコ店、麻雀店、性風俗営業など。',
    descriptionVi: 'Các cơ sở kinh doanh theo Luật Phong tục: quán bar tiếp rượu, quán rượu có tiếp khách, quán pachinko, mạt chược, dịch vụ giải trí người lớn.',
    descriptionEn: 'Establishments regulated under the Adult Entertainment Law (cabaret clubs, hostess bars, pachinko, sex entertainment).',
    isAdultEntertainment: true,
  },
  other_activity: {
    id: 'other_activity',
    labelJa: 'その他の活動・フリーランス・個別専門職',
    labelVi: 'Hoạt động khác / Freelancer tự do / Công việc đặc thù khác',
    labelEn: 'Other Activity / Freelance / Independent Practice',
    descriptionJa: '上記に当てはまらない活動、個人事業主としての業務委託、複数業務の組み合わせなど。',
    descriptionVi: 'Các công việc ngoài các nhóm trên, hợp đồng ủy thác công việc cá nhân, kết hợp nhiều vai trò...',
    descriptionEn: 'Independent contracting, mixed activities, or tasks not fitting other categories.',
    isAdultEntertainment: false,
  },
});

/**
 * Quy chuẩn giới hạn thời gian làm việc đối với 資格外活動許可
 */
export const EXTRA_ACTIVITY_LIMITS = Object.freeze({
  standardWeeklyHoursMax: 28,
  studentVacationDailyHoursMax: 8,
  studentVacationWeeklyHoursMax: 40,
  prohibitedInAdultEntertainment: true,
});

/**
 * Metadata quy tắc phạm vi làm việc
 */
export const WORK_SCOPE_RULE_METADATA = defineRuleMetadata({
  id: 'jp-immigration-work-scope-art19',
  jurisdiction: JAPAN_JURISDICTION,
  sourceId: 'isa-ica-art19-work-scope',
  effectiveFrom: '1952-04-28',
  applicablePeriod: { type: 'calendar-year', from: 1952, to: 2099 },
  version: '2026.1',
  lastVerifiedAt: '2026-09-11',
  status: 'verified',
  ruleNature: 'prerequisite',
  notes: 'Quy định Điều 19 Luật Nhập quản về phạm vi hoạt động theo tư cách lưu trú và điều kiện cấp Giấy phép hoạt động ngoài tư cách (資格外活動許可).'
});

/**
 * @file packages/core/src/japan/immigration/status/statusDefinitions.js
 * @description
 * Định nghĩa chuẩn xác toàn bộ các tư cách lưu trú (在留資格) tại Nhật Bản
 * căn cứ theo Biểu 1 (別表第一 - Hoạt động) và Biểu 2 (別表第二 - Thân phận) của Luật Xuất nhập cảnh (入管法).
 * Dẫn xuất trực tiếp từ nguồn chính thức của 出入国在留管理庁 (ISA) và e-Gov法令検索.
 */

/**
 * @typedef {'table-1-work' | 'table-1-non-work' | 'table-1-designated' | 'table-2-status'} StatusCategoryType
 *
 * @typedef {Object} OfficialStatusDefinition
 * @property {string} id - Canonical status ID
 * @property {string} nameJa - Tên tiếng Nhật chính thức theo luật
 * @property {string} nameVi - Tên tiếng Việt quy chuẩn
 * @property {string} nameEn - Tên tiếng Anh chính thức theo ISA
 * @property {StatusCategoryType} category - Phân nhóm tư cách theo Biểu
 * @property {boolean} permitsWorkByDefault - Mặc định được làm việc theo luật hay không
 * @property {boolean} unlimitedWorkScope - Không giới hạn ngành nghề làm việc (dành riêng cho Biểu 2)
 * @property {boolean} requiresExtraPermissionForWork - Cần Giấy phép hoạt động ngoài tư cách nếu muốn làm việc bán thời gian
 * @property {string} statutoryBasis - Điều khoản căn cứ trong Luật Nhập quản
 * @property {string} sourceId - Mã tham chiếu trong OfficialSourceRegistry
 * @property {string} standardScopeSummaryJa - Tóm tắt phạm vi hoạt động chuẩn theo luật (Tiếng Nhật)
 * @property {string} standardScopeSummaryVi - Tóm tắt phạm vi hoạt động chuẩn theo luật (Tiếng Việt)
 * @property {string} standardScopeSummaryEn - Tóm tắt phạm vi hoạt động chuẩn theo luật (Tiếng Anh)
 */

export const RESIDENCE_STATUS_DEFINITIONS = Object.freeze({
  // =========================================================================
  // BIỂU 1 - NHÓM LAO ĐỘNG CHUYÊN MÔN / TRÌNH ĐỘ CAO (別表第一の二)
  // =========================================================================
  'engineer-humanities-international': {
    id: 'engineer-humanities-international',
    nameJa: '技術・人文知識・国際業務',
    nameVi: 'Kỹ sư / Tri thức nhân văn / Nghiệp vụ quốc tế (Gijinkoku)',
    nameEn: 'Engineer / Specialist in Humanities / International Services',
    category: 'table-1-work',
    permitsWorkByDefault: true,
    unlimitedWorkScope: false,
    requiresExtraPermissionForWork: false,
    statutoryBasis: '入管法別表第一の二（技術・人文知識・国際業務）',
    sourceId: 'isa-ica-annexed-table-1',
    standardScopeSummaryJa: '本邦の公私の機関との契約に基づいて行う理学、工学その他の自然科学の分野若しくは法律学、経済学その他の人文科学の分野に属する技術若しくは知識を要する業務又は外国の文化に基盤を有する思考若しくは感受性を必要とする業務に従事する活動。',
    standardScopeSummaryVi: 'Các công việc yêu cầu kỹ thuật/kiến thức chuyên môn khoa học tự nhiên (IT, kỹ thuật máy, xây dựng...) hoặc khoa học xã hội nhân văn (kế toán, marketing, thương mại quốc tế, dịch thuật, giảng dạy ngoại ngữ...).',
    standardScopeSummaryEn: 'Activities requiring technology/knowledge in natural science, engineering, or humanities, or international services based on foreign culture/thinking (e.g. IT, engineering, trade, translation).'
  },
  'business-manager': {
    id: 'business-manager',
    nameJa: '経営・管理',
    nameVi: 'Kinh doanh / Quản lý',
    nameEn: 'Business Manager',
    category: 'table-1-work',
    permitsWorkByDefault: true,
    unlimitedWorkScope: false,
    requiresExtraPermissionForWork: false,
    statutoryBasis: '入管法別表第一の二（経営・管理）',
    sourceId: 'isa-ica-annexed-table-1',
    standardScopeSummaryJa: '本邦において貿易その他の事業の経営を開始し若しくは本邦におけるこれらの事業に投資してその経営を行い若しくは当該事業の管理に従事し又は本邦においてこれらの事業の経営を開始した外国人等に代わってその経営を行い若しくは当該事業の管理に従事する活動。',
    standardScopeSummaryVi: 'Các hoạt động thành lập, điều hành hoặc quản lý doanh nghiệp kinh doanh/thương mại tại Nhật Bản với tư cách người đại diện, giám đốc điều hành.',
    standardScopeSummaryEn: 'Activities to operate or manage international trade or other business enterprise in Japan.'
  },
  'highly-skilled-professional-1': {
    id: 'highly-skilled-professional-1',
    nameJa: '高度専門職1号（イ・ロ・ハ）',
    nameVi: 'Nhân lực chất lượng cao số 1 (Nghiên cứu / Chuyên môn / Quản lý)',
    nameEn: 'Highly Skilled Professional (i) (a/b/c)',
    category: 'table-1-work',
    permitsWorkByDefault: true,
    unlimitedWorkScope: false,
    requiresExtraPermissionForWork: false,
    statutoryBasis: '入管法別表第一の二（高度専門職1号）',
    sourceId: 'isa-ica-annexed-table-1',
    standardScopeSummaryJa: 'ポイント制による高度人材（学術研究活動、高度専門・技術活動、経営・管理活動）として優遇措置を受ける活動。',
    standardScopeSummaryVi: 'Các hoạt động thuộc diện lao động chất lượng cao tính điểm (nghiên cứu học thuật, kỹ thuật công nghệ cao, quản lý kinh doanh) với nhiều đãi ngộ đặc biệt.',
    standardScopeSummaryEn: 'Activities under points-based preferential treatment (academic research, specialized technical, business management).'
  },
  'highly-skilled-professional-2': {
    id: 'highly-skilled-professional-2',
    nameJa: '高度専門職2号',
    nameVi: 'Nhân lực chất lượng cao số 2 (Thời hạn vô thời hạn)',
    nameEn: 'Highly Skilled Professional (ii)',
    category: 'table-1-work',
    permitsWorkByDefault: true,
    unlimitedWorkScope: false,
    requiresExtraPermissionForWork: false,
    statutoryBasis: '入管法別表第一の二（高度専門職2号）',
    sourceId: 'isa-ica-annexed-table-1',
    standardScopeSummaryJa: '高度専門職1号として3年以上活動した者が移行できる在留資格。就労活動の制限が大幅に緩和され在留期間は無期限。',
    standardScopeSummaryVi: 'Tư cách chuyển tiếp sau 3 năm giữ HSP số 1, thời hạn cư trú vô thời hạn và được phép làm hầu như mọi công việc chuyên môn.',
    standardScopeSummaryEn: 'Indefinite-period status after 3 years on HSP(i) with broadly relaxed work activities.'
  },
  'skilled-labor': {
    id: 'skilled-labor',
    nameJa: '技能',
    nameVi: 'Kỹ năng (Đầu bếp nước ngoài / Chuyên gia đặc thù)',
    nameEn: 'Skilled Labor',
    category: 'table-1-work',
    permitsWorkByDefault: true,
    unlimitedWorkScope: false,
    requiresExtraPermissionForWork: false,
    statutoryBasis: '入管法別表第一の二（技能）',
    sourceId: 'isa-ica-annexed-table-1',
    standardScopeSummaryJa: '産業上の特殊な分野に属する熟練した技能を要する業務に従事する活動（外国料理の調理師、貴金属加工技師、ソムリエ、航空機操縦士等）。',
    standardScopeSummaryVi: 'Các công việc yêu cầu tay nghề kỹ năng điêu luyện thuộc ngành đặc thù (đầu bếp món ăn nước ngoài như Việt Nam, Thái, Âu; chuyên gia chế tác đá quý, thợ phi công...).',
    standardScopeSummaryEn: 'Services requiring specialized industrial skills (e.g. foreign cuisine chefs, sommeliers, gemstone craftsmen).'
  },
  'intra-company-transferee': {
    id: 'intra-company-transferee',
    nameJa: '企業内転勤',
    nameVi: 'Chuyển công tác nội bộ doanh nghiệp',
    nameEn: 'Intra-company Transferee',
    category: 'table-1-work',
    permitsWorkByDefault: true,
    unlimitedWorkScope: false,
    requiresExtraPermissionForWork: false,
    statutoryBasis: '入管法別表第一の二（企業内転勤）',
    sourceId: 'isa-ica-annexed-table-1',
    standardScopeSummaryJa: '本邦に本店、支店その他の事業所がある公私の機関の外国にある事業所の職員が転勤して当該本邦にある事業所において従事する活動。',
    standardScopeSummaryVi: 'Nhân viên từ chi nhánh/công ty mẹ ở nước ngoài được luân chuyển sang công tác tại chi nhánh/văn phòng tại Nhật Bản.',
    standardScopeSummaryEn: 'Transfer from foreign office to branch/subsidiary office in Japan for technical or international duties.'
  },
  'specified-skilled-worker-1': {
    id: 'specified-skilled-worker-1',
    nameJa: '特定技能1号',
    nameVi: 'Kỹ năng đặc định số 1 (Tokutei Gino 1)',
    nameEn: 'Specified Skilled Worker (i)',
    category: 'table-1-work',
    permitsWorkByDefault: true,
    unlimitedWorkScope: false,
    requiresExtraPermissionForWork: false,
    statutoryBasis: '入管法別表第一の二（特定技能1号）',
    sourceId: 'isa-ica-annexed-table-1',
    standardScopeSummaryJa: '特定産業分野（介護、外食、宿泊、建設等）に属する相当程度の知識又は経験を必要とする技能を要する業務に従事する活動。最長5年、家族帯同不可。',
    standardScopeSummaryVi: 'Làm việc trong các ngành công nghiệp chỉ định (điều dưỡng, nhà hàng, khách sạn, xây dựng...) yêu cầu kỹ năng và kinh nghiệm nhất định. Tối đa 5 năm, không được bảo lãnh gia đình.',
    standardScopeSummaryEn: 'Work in specified industrial fields requiring reasonable skills. Max 5 years total; family sponsorship not permitted.'
  },
  'specified-skilled-worker-2': {
    id: 'specified-skilled-worker-2',
    nameJa: '特定技能2号',
    nameVi: 'Kỹ năng đặc định số 2 (Tokutei Gino 2)',
    nameEn: 'Specified Skilled Worker (ii)',
    category: 'table-1-work',
    permitsWorkByDefault: true,
    unlimitedWorkScope: false,
    requiresExtraPermissionForWork: false,
    statutoryBasis: '入管法別表第一の二（特定技能2号）',
    sourceId: 'isa-ica-annexed-table-1',
    standardScopeSummaryJa: '特定産業分野に属する熟練した技能を要する業務に従事する活動。更新制限なし、家族帯同可能。',
    standardScopeSummaryVi: 'Làm việc yêu cầu kỹ năng tay nghề thành thạo trong các ngành chỉ định. Có thể gia hạn không giới hạn và được bảo lãnh vợ/chồng, con.',
    standardScopeSummaryEn: 'Work requiring proficient skills in specified industries. Renewable without upper duration limit; family sponsorship permitted.'
  },
  'technical-intern-training': {
    id: 'technical-intern-training',
    nameJa: '技能実習（1号・2号・3号）',
    nameVi: 'Thực tập sinh kỹ năng (Gino Jisshu)',
    nameEn: 'Technical Intern Training',
    category: 'table-1-work',
    permitsWorkByDefault: true,
    unlimitedWorkScope: false,
    requiresExtraPermissionForWork: false,
    statutoryBasis: '入管法別表第一の二（技能実習）',
    sourceId: 'isa-ica-annexed-table-1',
    standardScopeSummaryJa: '技能実習計画に基づいて技能等の修得、習熟又は熟達を図る活動。計画で定められた職種・作業のみ従事可能。',
    standardScopeSummaryVi: 'Hoạt động tiếp thu kỹ năng nghề theo kế hoạch thực tập sinh được phê duyệt. Chỉ được làm việc đúng ngành nghề và công việc trong kế hoạch.',
    standardScopeSummaryEn: 'Acquisition of skills based on accredited training plans. Restricted strictly to accredited task types.'
  },
  'nursing-care': {
    id: 'nursing-care',
    nameJa: '介護',
    nameVi: 'Hộ lý / Điều dưỡng viên có chứng chỉ quốc gia',
    nameEn: 'Nursing Care',
    category: 'table-1-work',
    permitsWorkByDefault: true,
    unlimitedWorkScope: false,
    requiresExtraPermissionForWork: false,
    statutoryBasis: '入管法別表第一の二（介護）',
    sourceId: 'isa-ica-annexed-table-1',
    standardScopeSummaryJa: '本邦の公私の機関との契約に基づいて介護福祉士の資格を有する者が行う介護又は介護の指導を行う業務に従事する活動。',
    standardScopeSummaryVi: 'Hoạt động chăm sóc người cao tuổi/người khuyết tật dành cho người có chứng chỉ Hộ lý quốc gia Nhật Bản (Kaigofukushishi).',
    standardScopeSummaryEn: 'Caregiving services provided by individuals certified as Japanese Certified Care Workers.'
  },
  'professor': {
    id: 'professor',
    nameJa: '教授',
    nameVi: 'Giáo sư đại học / Giảng viên cao cấp',
    nameEn: 'Professor',
    category: 'table-1-work',
    permitsWorkByDefault: true,
    unlimitedWorkScope: false,
    requiresExtraPermissionForWork: false,
    statutoryBasis: '入管法別表第一の一（教授）',
    sourceId: 'isa-ica-annexed-table-1',
    standardScopeSummaryJa: '本邦の大学若しくはこれに準ずる機関又は高等専門学校において研究、研究の指導又は教育をする活動。',
    standardScopeSummaryVi: 'Nghiên cứu hoặc giảng dạy tại trường đại học, cơ sở tương đương hoặc trường cao đẳng công nghệ kosen tại Nhật Bản.',
    standardScopeSummaryEn: 'Research, guidance, or education at universities or equivalent educational institutions in Japan.'
  },
  'legal-accounting': {
    id: 'legal-accounting',
    nameJa: '法律・会計業務',
    nameVi: 'Nghiệp vụ Luật & Kế toán có chứng chỉ',
    nameEn: 'Legal / Accounting Services',
    category: 'table-1-work',
    permitsWorkByDefault: true,
    unlimitedWorkScope: false,
    requiresExtraPermissionForWork: false,
    statutoryBasis: '入管法別表第一の二（法律・会計業務）',
    sourceId: 'isa-ica-annexed-table-1',
    standardScopeSummaryJa: '弁護士、公認会計士その他の法律上資格を有する者が行うこととされている法律又は会計に係る業務に従事する活動。',
    standardScopeSummaryVi: 'Hành nghề luật sư, kiểm toán viên công chứng hoặc các tư cách nghề nghiệp pháp lý/kế toán theo luật Nhật Bản.',
    standardScopeSummaryEn: 'Legal or accounting services provided by licensed attorneys, certified public accountants, etc.'
  },

  // =========================================================================
  // BIỂU 1 - NHÓM KHÔNG ĐƯỢC PHÉP LÀM VIỆC THEO NGUYÊN TẮC (別表第一の四)
  // =========================================================================
  'student': {
    id: 'student',
    nameJa: '留学',
    nameVi: 'Du học (Ryugaku)',
    nameEn: 'Student',
    category: 'table-1-non-work',
    permitsWorkByDefault: false,
    unlimitedWorkScope: false,
    requiresExtraPermissionForWork: true,
    statutoryBasis: '入管法別表第一の四（留学）及び第19条第2項',
    sourceId: 'isa-extra-activity-perm',
    standardScopeSummaryJa: '大学、高等専門学校、高等学校、専修学校等において教育を受ける活動。資格外活動許可を得た場合に限り、原則週28時間以内（長期休業期間は1日8時間・週40時間以内）のアルバイトが可能。風俗営業関連は厳禁。',
    standardScopeSummaryVi: 'Học tập tại các trường đại học, cao đẳng, chuyên môn hoặc trường Nhật ngữ. Chỉ được làm thêm khi có Giấy phép 資格外活動許可 (tối đa 28h/tuần trong học kỳ, tối đa 8h/ngày trong kỳ nghỉ dài). Nghiêm cấm tuyệt đối ngành phong tục/giải trí người lớn.',
    standardScopeSummaryEn: 'Receiving education at educational institutions. Part-time work permitted strictly up to 28 hrs/week with permission. Adult entertainment work strictly prohibited.'
  },
  'dependent': {
    id: 'dependent',
    nameJa: '家族滞在',
    nameVi: 'Gia đình / Người phụ thuộc (Kazoku Taizai)',
    nameEn: 'Dependent',
    category: 'table-1-non-work',
    permitsWorkByDefault: false,
    unlimitedWorkScope: false,
    requiresExtraPermissionForWork: true,
    statutoryBasis: '入管法別表第一の四（家族滞在）及び第19条第2項',
    sourceId: 'isa-family-stay-table',
    standardScopeSummaryJa: '教授、技術・人文知識・国際業務等の在留資格をもって在留する者の扶養を受ける配偶者又は子として行う日常的な活動。資格外活動許可を得た場合に限り週28時間以内の就労が可能。風俗営業関連は厳禁。',
    standardScopeSummaryVi: 'Sinh hoạt thường ngày với tư cách vợ/chồng hoặc con được chu cấp bởi người giữ tư cách lưu trú chuyên môn. Chỉ được làm thêm khi có Giấy phép 資格外活動許可 (tối đa 28h/tuần). Nghiêm cấm tuyệt đối ngành phong tục/giải trí người lớn.',
    standardScopeSummaryEn: 'Daily activities of spouse or unmarried child dependent on qualifying foreign resident. Part-time work up to 28 hrs/week allowed only with permission.'
  },
  'cultural-activities': {
    id: 'cultural-activities',
    nameJa: '文化活動',
    nameVi: 'Hoạt động văn hóa (Nghiên cứu văn hóa / Nghệ thuật không nhận lương)',
    nameEn: 'Cultural Activities',
    category: 'table-1-non-work',
    permitsWorkByDefault: false,
    unlimitedWorkScope: false,
    requiresExtraPermissionForWork: true,
    statutoryBasis: '入管法別表第一の三（文化活動）',
    sourceId: 'isa-ica-annexed-table-1',
    standardScopeSummaryJa: '収入を伴わない学術上若しくは芸術上の活動又は本邦特有の文化若しくは技芸について専門的な研究を行い若しくは指導を受ける活動。',
    standardScopeSummaryVi: 'Nghiên cứu văn hóa nghệ thuật truyền thống Nhật Bản không nhận thù lao (trà đạo, kiếm đạo, thư pháp...).',
    standardScopeSummaryEn: 'Academic or artistic activities without income, or specialized research into Japanese traditional culture.'
  },
  'temporary-visitor': {
    id: 'temporary-visitor',
    nameJa: '短期滞在',
    nameVi: 'Lưu trú ngắn hạn (Du lịch / Thăm thân / Công tác ngắn hạn)',
    nameEn: 'Temporary Visitor',
    category: 'table-1-non-work',
    permitsWorkByDefault: false,
    unlimitedWorkScope: false,
    requiresExtraPermissionForWork: false, // Không thể cấp 資格外活動許可 cho 短期滞在
    statutoryBasis: '入管法別表第一の三（短期滞在）',
    sourceId: 'isa-ica-annexed-table-1',
    standardScopeSummaryJa: '本邦に短期間滞在して行う観光、保養、スポーツ、親族の訪問、見学、講習若しくは会合への参加、業務連絡その他これらに類似する活動。就労不可（資格外活動許可も原則不可）。',
    standardScopeSummaryVi: 'Du lịch, thăm thân, công tác khảo sát ngắn ngày (15, 30, 90 ngày). Tuyệt đối không được làm việc có nhận thù lao tại Nhật Bản.',
    standardScopeSummaryEn: 'Tourism, business meetings, visiting relatives. Strictly prohibited from engaging in any remunerated work in Japan.'
  },
  'trainee': {
    id: 'trainee',
    nameJa: '研修',
    nameVi: 'Tu nghiệp (Không nhận lương)',
    nameEn: 'Trainee',
    category: 'table-1-non-work',
    permitsWorkByDefault: false,
    unlimitedWorkScope: false,
    requiresExtraPermissionForWork: true,
    statutoryBasis: '入管法別表第一の四（研修）',
    sourceId: 'isa-ica-annexed-table-1',
    standardScopeSummaryJa: '本邦の公私の機関により受け入れられて行う技術、技能又は知識の修得をする活動（実務作業を伴う実習は含まない）。',
    standardScopeSummaryVi: 'Học tập kỹ năng, nghiệp vụ thuần túy không có quan hệ lao động thực tế tại nhà xưởng.',
    standardScopeSummaryEn: 'Activities to acquire technology, skills or knowledge at organizations in Japan without operational labor.'
  },

  // =========================================================================
  // BIỂU 1 - HOẠT ĐỘNG CHỈ ĐỊNH (別表第一の五 - BẮT BUỘC THEO DÕI GIẤY CHỈ ĐỊNH)
  // =========================================================================
  'designated-activities': {
    id: 'designated-activities',
    nameJa: '特定活動',
    nameVi: 'Hoạt động chỉ định (Tokutei Katsudo)',
    nameEn: 'Designated Activities',
    category: 'table-1-designated',
    permitsWorkByDefault: false, // Tùy thuộc vào từng số chỉ định cụ thể
    unlimitedWorkScope: false,
    requiresExtraPermissionForWork: false,
    statutoryBasis: '入管法別表第一の五（特定活動）',
    sourceId: 'isa-ica-annexed-table-1',
    standardScopeSummaryJa: '法務大臣が個々の外国人について特に指定する活動（ワーキングホリデー、インターンシップ、EPA看護師・介護士、留学生の就職活動、デジタルノマド等）。就労可否および範囲はパスポートに貼付された「指定書」の記載内容により個別に定まります。',
    standardScopeSummaryVi: 'Hoạt động do Bộ trưởng Bộ Tư pháp chỉ định riêng cho từng cá nhân (Working Holiday, Thực tập sinh đại học, tìm việc sau tốt nghiệp, Digital Nomad...). Quyền làm việc và phạm vi phụ thuộc 100% vào nội dung in trên Giấy chỉ định (指定書) đính kèm hộ chiếu.',
    standardScopeSummaryEn: 'Activities designated individually by the Minister of Justice (e.g. Working Holiday, graduate job-hunting). Work scope is determined exclusively by the Designation Certificate attached to passport.'
  },

  // =========================================================================
  // BIỂU 2 - NHÓM THÂN PHẬN / VỊ TRÍ XÃ HỘI (別表第二 - HOÀN TOÀN KHÔNG GIỚI HẠN)
  // =========================================================================
  'permanent-resident': {
    id: 'permanent-resident',
    nameJa: '永住者',
    nameVi: 'Người vĩnh trú (Eijusha)',
    nameEn: 'Permanent Resident',
    category: 'table-2-status',
    permitsWorkByDefault: true,
    unlimitedWorkScope: true,
    requiresExtraPermissionForWork: false,
    statutoryBasis: '入管法別表第二（永住者）及び第22条',
    sourceId: 'isa-ica-annexed-table-2',
    standardScopeSummaryJa: '法務大臣から永住の許可を受けて本邦に在留する者。就労活動に一切の制限がなく、あらゆる合法的な職業、正社員、アルバイト、単純労働、会社経営に自由に従事可能。在留期間も無期限。',
    standardScopeSummaryVi: 'Được cấp quyền thường trú vĩnh viễn tại Nhật Bản. Không bị giới hạn bất kỳ ngành nghề nào, tự do làm việc toàn thời gian, bán thời gian, lao động chân tay, khởi nghiệp kinh doanh. Thời hạn cư trú vô thời hạn.',
    standardScopeSummaryEn: 'Permanent residence granted by the Minister of Justice. Zero restrictions on occupation, hours, or business management. Indefinite stay duration.'
  },
  'spouse-of-japanese': {
    id: 'spouse-of-japanese',
    nameJa: '日本人の配偶者等',
    nameVi: 'Vợ/chồng hoặc con của người Nhật',
    nameEn: 'Spouse or Child of Japanese National',
    category: 'table-2-status',
    permitsWorkByDefault: true,
    unlimitedWorkScope: true,
    requiresExtraPermissionForWork: false,
    statutoryBasis: '入管法別表第二（日本人の配偶者等）',
    sourceId: 'isa-ica-annexed-table-2',
    standardScopeSummaryJa: '日本人の配偶者若しくは特別養子又は日本人の子として出生した者。就労制限がなく、あらゆる職種に就労可能。',
    standardScopeSummaryVi: 'Vợ/chồng hợp pháp hoặc con đẻ/con nuôi đặc biệt của công dân Nhật Bản. Không bị giới hạn ngành nghề, tự do làm việc trong bất kỳ lĩnh vực hợp pháp nào.',
    standardScopeSummaryEn: 'Spouse, special adoptee, or biological child of a Japanese national. No work restrictions whatsoever.'
  },
  'spouse-of-permanent-resident': {
    id: 'spouse-of-permanent-resident',
    nameJa: '永住者の配偶者等',
    nameVi: 'Vợ/chồng hoặc con của người vĩnh trú',
    nameEn: 'Spouse or Child of Permanent Resident',
    category: 'table-2-status',
    permitsWorkByDefault: true,
    unlimitedWorkScope: true,
    requiresExtraPermissionForWork: false,
    statutoryBasis: '入管法別表第二（永住者の配偶者等）',
    sourceId: 'isa-ica-annexed-table-2',
    standardScopeSummaryJa: '永住者又は特別永住者の配偶者若しくは永住者等の子として本邦で出生し引き続き在留する者。就労活動に制限なし。',
    standardScopeSummaryVi: 'Vợ/chồng hoặc con sinh ra tại Nhật Bản của người vĩnh trú. Hoàn toàn không bị giới hạn ngành nghề lao động.',
    standardScopeSummaryEn: 'Spouse of a permanent resident or child born in Japan of a permanent resident. No occupational restrictions.'
  },
  'long-term-resident': {
    id: 'long-term-resident',
    nameJa: '定住者',
    nameVi: 'Người định trú (Teijusha)',
    nameEn: 'Long-Term Resident',
    category: 'table-2-status',
    permitsWorkByDefault: true,
    unlimitedWorkScope: true,
    requiresExtraPermissionForWork: false,
    statutoryBasis: '入管法別表第二（定住者）',
    sourceId: 'isa-ica-annexed-table-2',
    standardScopeSummaryJa: '法務大臣が特別な理由を考慮して一定の在留期間を指定して居住を認める者（日系人、日本人配偶者との死別・離婚定住、難民認定者等）。就労活動に制限なし。',
    standardScopeSummaryVi: 'Người được Bộ trưởng Bộ Tư pháp cấp phép cư trú vì lý do nhân đạo/đặc biệt (người gốc Nhật Nikkei, người ly hôn nuôi con sau khi kết hôn với người Nhật, tị nạn...). Không bị hạn chế công việc.',
    standardScopeSummaryEn: 'Authorized for residency based on special humanitarian or historical grounds. No restrictions on employment.'
  }
});

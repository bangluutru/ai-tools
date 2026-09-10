/**
 * @file packages/core/src/japan/immigration/statusChange/statusChangeEngine.js
 * @description
 * Động cơ thẩm định và hướng dẫn Thay đổi Tư cách Lưu trú (在留資格変更許可手続).
 * Tuân thủ nguyên tắc Zero-Inference & McLean Doctrine:
 * - Tuyệt đối không phán đoán "đậu visa" hay "rớt visa".
 * - Chỉ đối soát các tiêu chí pháp định khách quan và liệt kê hồ sơ cần chuẩn bị.
 */

import {
  STATUS_TRANSITION_ROUTES,
  STATUS_CHANGE_DOCUMENT_CATEGORIES,
  getStatusChangeFeeSchedule,
} from './statusChangeRules.js';

/**
 * Đánh giá hồ sơ xin thay đổi tư cách lưu trú
 * 
 * @param {Object} input
 * @param {string} input.currentStatusId - Mã tư cách lưu trú hiện tại (e.g. 'student', 'dependent', 'temporary_visitor')
 * @param {string} input.targetStatusId - Mã tư cách muốn chuyển sang (e.g. 'engineer_specialist', 'specified_skilled_1')
 * @param {string} [input.currentExpirationDate] - Ngày hết hạn thẻ cư trú hiện tại (YYYY-MM-DD)
 * @param {string} [input.applicationDate] - Ngày dự kiến nộp hồ sơ (YYYY-MM-DD)
 * @param {Object} [input.applicantProfile] - Thông tin điều kiện của đương đơn
 * @returns {Object} Kết quả đánh giá pháp lý và danh mục thủ tục
 */
export function evaluateStatusChange(input = {}) {
  const {
    currentStatusId = 'student',
    targetStatusId = 'engineer_specialist',
    currentExpirationDate = null,
    applicationDate = new Date().toISOString().slice(0, 10),
    applicantProfile = {}
  } = input;

  const warnings = [];
  const prerequisites = [];
  let readinessStatus = 'ready';
  let route = null;
  let isExceptional = false;

  // 1. Xác định tuyến chuyển đổi (Route Selection)
  if (currentStatusId === 'temporary_visitor') {
    route = STATUS_TRANSITION_ROUTES.TEMPORARY_VISITOR_CHANGE;
    isExceptional = true;
  } else if (targetStatusId === 'spouse_japanese') {
    route = STATUS_TRANSITION_ROUTES.ANY_TO_SPOUSE_JAPANESE;
  } else if (targetStatusId === 'spouse_permanent_resident') {
    route = STATUS_TRANSITION_ROUTES.ANY_TO_SPOUSE_PR;
  } else if (targetStatusId === 'business_manager') {
    route = STATUS_TRANSITION_ROUTES.WORK_TO_BUSINESS_MANAGER;
  } else if (targetStatusId === 'specified_skilled_1') {
    route = STATUS_TRANSITION_ROUTES.STUDENT_OR_TIT_TO_SSW;
  } else if (targetStatusId === 'engineer_specialist') {
    if (currentStatusId === 'student') {
      route = STATUS_TRANSITION_ROUTES.STUDENT_TO_WORK;
    } else if (currentStatusId === 'dependent') {
      route = STATUS_TRANSITION_ROUTES.DEPENDENT_TO_WORK;
    } else {
      route = STATUS_TRANSITION_ROUTES.STUDENT_TO_WORK;
    }
  }

  // 2. Thẩm tra quy tắc chuyển từ Visa Ngắn hạn (Điều 20 Khoản 2)
  if (currentStatusId === 'temporary_visitor') {
    const hasCOE = Boolean(applicantProfile.hasCOE);
    prerequisites.push({
      id: 'coe_or_exceptional_circumstance',
      title_ja: '在留資格認定証明書（COE）所持または特別の事情',
      title_vn: 'Có Giấy chứng nhận tư cách lưu trú (COE) hoặc hoàn cảnh đặc biệt',
      title_en: 'Certificate of Eligibility (COE) or special unavoidable circumstance',
      met: hasCOE,
      required: true,
      guidance_ja: '短期滞在からの変更は入管法第20条第2項により原則禁止されています。COEの交付を既に受けているか、特別な人道上の事由が必要です。',
      guidance_vn: 'Chuyển đổi từ Visa Ngắn hạn bị cấm theo Điều 20 Khoản 2 Luật Nhập quản, trừ khi bạn đã có COE sẵn trong tay hoặc có lý do đặc biệt.',
      guidance_en: 'Change from Temporary Visitor is prohibited by Art. 20 Para. 2 unless holding an issued COE or humanitarian circumstance.'
    });

    if (!hasCOE) {
      readinessStatus = 'restricted';
      warnings.push({
        code: 'TEMPORARY_VISITOR_RESTRICTION',
        severity: 'danger',
        title_ja: '短期滞在からの在留資格変更は原則不可（入管法第20条第2項）',
        title_vn: 'Không được phép đổi visa từ diện Du lịch / Ngắn hạn (Điều 20 Khoản 2)',
        title_en: 'Change from Temporary Visitor is barred by default (Immigration Act Art. 20 Para. 2)',
        message_ja: '有効な在留資格認定証明書（COE）をお持ちでない場合、申請は原則受理されません。一度出国し日本国外の領事館で査証発給を受ける必要があります。',
        message_vn: 'Nếu chưa được cấp Giấy chứng nhận COE, hồ sơ đổi visa sẽ bị từ chối tiếp nhận. Bạn phải xuất cảnh và xin visa tại Đại sứ quán/Lãnh sự quán Nhật ở nước ngoài.',
        message_en: 'Without a valid Certificate of Eligibility (COE), direct status change cannot be processed. You must depart and apply at an overseas Japanese embassy/consulate.'
      });
    }
  }

  // 3. Thẩm tra theo từng nhóm tư cách mục tiêu
  if (targetStatusId === 'engineer_specialist') {
    // a. Học vấn / Văn bằng
    const educationLevel = applicantProfile.educationLevel || 'none';
    const isEducationQualified = ['university_degree', 'japan_vocational_diploma'].includes(educationLevel);
    prerequisites.push({
      id: 'education_level',
      title_ja: '法定学歴要件（大卒または日本の専門学校専門士）',
      title_vn: 'Điều kiện học vấn chuẩn (Đại học hoặc Senmon-shi tại Nhật Bản)',
      title_en: 'Statutory education (University degree or JP vocational diploma)',
      met: isEducationQualified,
      required: true,
      guidance_ja: '日本の大学・大学院・短期大学、外国の大学卒業、または日本の専修学校専門士・高度専門士の称号が必要です。外国の専門学校は学歴要件を満たしません。',
      guidance_vn: 'Yêu cầu tốt nghiệp Đại học (tại Nhật hoặc nước ngoài) hoặc bằng Senmon-shi tại Nhật. Bằng trung cấp/nghề ngoài Nhật Bản KHÔNG được công nhận.',
      guidance_en: 'Requires university degree or Japanese vocational school Senmon-shi diploma. Overseas vocational diplomas are not eligible.'
    });

    // b. Tính liên quan chuyên ngành
    const jobMatchesMajor = Boolean(applicantProfile.jobMatchesMajor);
    prerequisites.push({
      id: 'major_relevance',
      title_ja: '専攻と業務の関連性',
      title_vn: 'Tính liên quan giữa chuyên ngành đào tạo và công việc dự kiến',
      title_en: 'Relevance of academic major to job responsibilities',
      met: jobMatchesMajor,
      required: true,
      guidance_ja: '特に専門学校卒（専門士）の場合、専攻科目と職務内容に直接の関連性が厳格に審査されます。大卒の場合は比較的広範囲に認められます。',
      guidance_vn: 'Đối với bằng Senmon-shi, Cục Nhập cảnh đối soát cực kỳ khắt khe sự trùng khớp giữa bảng điểm và mô tả công việc.',
      guidance_en: 'Vocational graduates undergo strict examination of alignment between transcripts and job descriptions.'
    });

    // c. Mức thù lao
    const salaryEquivalent = Boolean(applicantProfile.salaryEquivalentToJapanese);
    prerequisites.push({
      id: 'salary_equivalent',
      title_ja: '日本人と同等以上の報酬待遇',
      title_vn: 'Mức lương từ mức tương đương người Nhật cùng vị trí',
      title_en: 'Remuneration equal to or higher than Japanese peers',
      met: salaryEquivalent,
      required: true,
      guidance_ja: '会社内で同等の業務を行う日本人社員と同等以上の給与水準であることが雇用契約書上で求められます。',
      guidance_vn: 'Hợp đồng lao động phải ghi rõ mức thù lao không được thấp hơn mức chi trả cho nhân viên người Nhật ở vị trí tương đương.',
      guidance_en: 'The employment contract must demonstrate pay equality with Japanese employees doing comparable work.'
    });

    // d. Hợp đồng tuyển dụng
    const hasJobOffer = Boolean(applicantProfile.hasJobOffer);
    prerequisites.push({
      id: 'job_offer',
      title_ja: '雇用契約または採用内定通知書の受領',
      title_vn: 'Đã ký hợp đồng lao động hoặc nhận giấy thông báo trúng tuyển',
      title_en: 'Official job offer or signed employment contract',
      met: hasJobOffer,
      required: true,
      guidance_ja: '勤務条件明示書、労働契約書、または採用内定通知書が必要です。',
      guidance_vn: 'Cần có hợp đồng lao động hoặc văn bản thông báo điều kiện làm việc chính thức từ công ty tiếp nhận.',
      guidance_en: 'Requires signed contract or official employment offer specifying terms.'
    });

    if (!isEducationQualified || !jobMatchesMajor || !salaryEquivalent || !hasJobOffer) {
      if (readinessStatus !== 'restricted') readinessStatus = 'missing_requirements';
    }
  } else if (targetStatusId === 'specified_skilled_1') {
    const hasPassedSkills = Boolean(applicantProfile.hasPassedSkillsTest);
    const hasPassedLanguage = Boolean(applicantProfile.hasPassedLanguageTest);
    const completedIntern = Boolean(applicantProfile.completedInternTraining2);
    const examExemptOrPassed = (hasPassedSkills && hasPassedLanguage) || completedIntern;

    prerequisites.push({
      id: 'ssw_skill_language_qualification',
      title_ja: '技能評価試験及び日本語試験合格（または実習2号良好修了）',
      title_vn: 'Đậu kỳ thi kỹ năng & tiếng Nhật (hoặc Hoàn thành tốt TTS số 2)',
      title_en: 'Passed skills evaluation & Japanese exams (or completed TITP 2)',
      met: examExemptOrPassed,
      required: true,
      guidance_ja: '各特定産業分野の試験合格＋日本語試験（N4以上またはJFT-Basic）、または技能実習2号を同一職種・作業で良好に修了していることが必要です。',
      guidance_vn: 'Yêu cầu đậu kỳ thi kỹ năng ngành + JLPT N4 / JFT-Basic, hoặc hoàn thành tốt chương trình Thực tập sinh số 2 cùng ngành nghề.',
      guidance_en: 'Requires passing industry exam + JLPT N4 / JFT-Basic, or good-standing completion of TITP 2 in related field.'
    });

    const hasJobOffer = Boolean(applicantProfile.hasJobOffer);
    prerequisites.push({
      id: 'ssw_employment_contract',
      title_ja: '特定技能雇用契約及び支援計画',
      title_vn: 'Hợp đồng lao động kỹ năng đặc định và kế hoạch hỗ trợ',
      title_en: 'Specified skilled employment contract & support plan',
      met: hasJobOffer,
      required: true,
      guidance_ja: '特定技能外国人受入れ基準に合致した雇用契約書および支援委託契約が必要です。',
      guidance_vn: 'Hợp đồng lao động theo mẫu chuẩn và hợp đồng ủy thác hỗ trợ với Tổ chức hỗ trợ đăng ký (TSK).',
      guidance_en: 'Requires standard compliant contract and registered support organization agreement.'
    });

    if (!examExemptOrPassed || !hasJobOffer) {
      if (readinessStatus !== 'restricted') readinessStatus = 'missing_requirements';
    }
  } else if (targetStatusId === 'spouse_japanese' || targetStatusId === 'spouse_permanent_resident') {
    const hasLegalMarriage = Boolean(applicantProfile.hasLegalMarriage);
    prerequisites.push({
      id: 'marriage_validity',
      title_ja: '日・本国双方での法的婚姻成立',
      title_vn: 'Hôn nhân hợp pháp có hiệu lực tại cả 2 nước',
      title_en: 'Legally registered marriage in both countries',
      met: hasLegalMarriage,
      required: true,
      guidance_ja: '日本の戸籍謄本（配偶者記載あり）及び本国の婚姻証明書が必要です。',
      guidance_vn: 'Cần có Trích lục Hộ tịch Nhật Bản (Koseki Tohon) đã ghi tên bạn đời và Giấy chứng nhận kết hôn nước ngoài.',
      guidance_en: 'Requires Japanese family register (Koseki) with spouse entry and official home country marriage certificate.'
    });

    const livingTogether = Boolean(applicantProfile.livingTogether);
    prerequisites.push({
      id: 'cohabitation_evidence',
      title_ja: '同居および共同生活の実態',
      title_vn: 'Thực tế chung sống và sinh hoạt cùng nhau',
      title_en: 'Genuine cohabitation and shared marital household',
      met: livingTogether,
      required: true,
      guidance_ja: '住民票での同居記載、交際から結婚に至る経緯を記した質問書、写真、通信履歴等の疎明資料が必要です。',
      guidance_vn: 'Đứng tên chung trong cùng sổ Juminhyo, bản câu hỏi giải trình tình yêu/kết hôn, ảnh chụp chung với gia đình hai bên.',
      guidance_en: 'Requires shared resident certificate (Juminhyo), questionnaire on relationship history, and photos.'
    });

    const hasGuarantor = Boolean(applicantProfile.hasGuarantor);
    prerequisites.push({
      id: 'guarantor_and_income',
      title_ja: '身元保証人及び安定的生計能力',
      title_vn: 'Người bảo lãnh và năng lực kinh tế ổn định',
      title_en: 'Guarantor letter and demonstrated economic stability',
      met: hasGuarantor,
      required: true,
      guidance_ja: '日本人または永住者の配偶者による身元保証書、課税証明書・納税証明書等で生計の安定を立証します。',
      guidance_vn: 'Giấy cam kết bảo lãnh của người bạn đời, nộp đủ thuế cư trú, không nợ đọng ngân sách.',
      guidance_en: 'Guarantor document and local tax certificates confirming reliable income.'
    });

    if (!hasLegalMarriage || !livingTogether || !hasGuarantor) {
      if (readinessStatus !== 'restricted') readinessStatus = 'missing_requirements';
    }
  } else if (targetStatusId === 'business_manager') {
    const hasPhysicalOffice = Boolean(applicantProfile.hasPhysicalOffice);
    prerequisites.push({
      id: 'physical_office',
      title_ja: '独立した事業所の確保',
      title_vn: 'Có văn phòng kinh doanh độc lập tại Nhật Bản',
      title_en: 'Dedicated physical office premises in Japan',
      met: hasPhysicalOffice,
      required: true,
      guidance_ja: '住居と明確に分離された法人名義の賃貸借契約、事業用設備、看板・ポストの設置が必要です。バーチャルオフィスは不可。',
      guidance_vn: 'Văn phòng thuê đứng tên công ty, có biển hiệu, hòm thư riêng, tách biệt hoàn toàn với phòng ở. Văn phòng ảo không được chấp nhận.',
      guidance_en: 'Lease agreement under corporate name separated from residence. Virtual offices are not accepted.'
    });

    const capitalAtLeast5M = Boolean(applicantProfile.capitalAtLeast5M);
    prerequisites.push({
      id: 'capital_investment',
      title_ja: '500万円以上の資本金または2名以上の常勤職員雇用',
      title_vn: 'Vốn điều lệ tối thiểu 5.000.000 JPY hoặc tuyển 2 nhân sự chính thức',
      title_en: 'Capital investment of 5,000,000+ JPY or 2+ full-time resident staff',
      met: capitalAtLeast5M,
      required: true,
      guidance_ja: '登記事項証明書および出資資金の形成過程（預金通帳履歴、送金証明等）が厳格に審査されます。',
      guidance_vn: 'Đăng ký kinh doanh và sao kê tài khoản ngân hàng chứng minh nguồn gốc hình thành hợp pháp của 5 triệu yên vốn góp.',
      guidance_en: 'Corporate registration and bank statements proving the lawful formation of the 5M JPY capital.'
    });

    const hasFeasiblePlan = Boolean(applicantProfile.hasFeasibleBusinessPlan);
    prerequisites.push({
      id: 'business_plan_feasibility',
      title_ja: '事業計画書の実現可能性および継続性',
      title_vn: 'Bản kế hoạch kinh doanh khả thi và có tính liên tục',
      title_en: 'Detailed business plan continuity and feasibility',
      met: hasFeasiblePlan,
      required: true,
      guidance_ja: '事業概要、収支計画、取引先との契約・内諾書など、事業が安定して継続できる根拠を提示します。',
      guidance_vn: 'Bản dự toán thu chi, hợp đồng đối tác, phân tích thị trường chứng minh công ty có thể sinh lời và hoạt động lâu dài.',
      guidance_en: 'Revenue projections, supplier contracts, and market analysis demonstrating business viability.'
    });

    if (!hasPhysicalOffice || !capitalAtLeast5M || !hasFeasiblePlan) {
      if (readinessStatus !== 'restricted') readinessStatus = 'missing_requirements';
    }
  }

  // 4. Cảnh báo cấm làm việc trước khi có kết quả (Activity Prohibition Warning)
  warnings.push({
    code: 'ACTIVITY_PROHIBITION',
    severity: 'warning',
    title_ja: '重要：変更許可が交付される前の就労禁止',
    title_vn: 'LƯU Ý: Tuyệt đối không được làm việc theo tư cách mới trước khi nhận thẻ',
    title_en: 'CRITICAL: Employment of target status prohibited prior to approval',
    message_ja: '在留資格変更申請中であっても、新しい在留カードを受け取るまでは新しい業務内容でのフルタイム就労は法律上禁止されています。留学生の場合は資格外活動許可の範囲内（週28時間以内）にとどめる必要があります。',
    message_vn: 'Trong thời gian chờ Cục Nhập cảnh xét duyệt, bạn KHÔNG ĐƯỢC PHÉP bắt đầu công việc toàn thời gian theo tư cách mới. Nếu đang giữ visa Du học, bạn chỉ được làm việc tối đa 28 giờ/tuần theo giấy phép hoạt động ngoài tư cách.',
    message_en: 'Even while an application is pending, you are legally prohibited from engaging in activities of the target status until the new Residence Card is issued. Students remain bound by the 28-hour/week permit.'
  });

  // 5. Tính toán Thời hạn đặc lệ (Tokurei Period - 特例期間: Điều 20 Khoản 6)
  let tokureiExpirationDate = null;
  let daysUntilCurrentExpiration = null;
  if (currentExpirationDate) {
    const expDate = new Date(currentExpirationDate);
    const today = new Date();
    const diffTime = expDate.getTime() - today.getTime();
    daysUntilCurrentExpiration = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    // Tokurei: thêm tối đa 2 tháng sau ngày hết hạn
    const tokureiDate = new Date(expDate);
    tokureiDate.setMonth(tokureiDate.getMonth() + 2);
    tokureiExpirationDate = tokureiDate.toISOString().slice(0, 10);

    if (daysUntilCurrentExpiration <= 0) {
      warnings.push({
        code: 'ALREADY_EXPIRED',
        severity: 'danger',
        title_ja: '在留期限が経過しています',
        title_vn: 'Thẻ cư trú hiện tại đã hết hạn',
        title_en: 'Current residence period has expired',
        message_ja: '期限前に申請が受理されていない場合、不法残留（オーバーステイ）となる恐れがあります。直ちに入管または専門家にご相談ください。',
        message_vn: 'Nếu bạn chưa nộp hồ sơ trước ngày hết hạn, bạn có nguy cơ bị rơi vào tình trạng quá hạn lưu trú (overstay). Cần liên hệ ngay Cục Nhập cảnh.',
        message_en: 'If no application was submitted prior to expiry, you may be in unlawful overstay. Consult immigration authorities immediately.'
      });
      readinessStatus = 'restricted';
    } else if (daysUntilCurrentExpiration <= 14) {
      warnings.push({
        code: 'EXPIRATION_APPROACHING',
        severity: 'warning',
        title_ja: '在留期限まで2週間未満です',
        title_vn: 'Thẻ cư trú chỉ còn dưới 14 ngày nữa là hết hạn',
        title_en: 'Less than 14 days remaining on current residence status',
        message_ja: `期限日（${currentExpirationDate}）までに申請を受理させれば、結果が出るか期限後2か月（${tokureiExpirationDate}）まで適法に在留（特例期間）できます。至急申請を完了させてください。`,
        message_vn: `Nếu nộp kịp trước ngày ${currentExpirationDate}, bạn sẽ được hưởng thời hạn đặc lệ (特例期間) ở lại tối đa thêm 2 tháng (đến ${tokureiExpirationDate}) trong lúc chờ kết quả.`,
        message_en: `Filing before ${currentExpirationDate} entitles you to the Special Period (Tokurei) allowing legal stay up to 2 months (${tokureiExpirationDate}) while awaiting decision.`
      });
    }
  }

  // 6. Nhắc nhở Thẩm quyền Tự do Hành chính (McLean Doctrine Safeguard)
  warnings.push({
    code: 'MINISTERIAL_DISCRETION',
    severity: 'info',
    title_ja: '法務大臣の裁量に関する重要事項（マクリーン判決準拠）',
    title_vn: 'Bảo lưu thẩm quyền quyết định của Bộ Tư pháp (Án lệ McLean)',
    title_en: 'Ministerial Discretion Notice (McLean Doctrine)',
    message_ja: '在留資格の変更は「相当の理由があるときに限り」許可されると定められており（入管法第20条第3項）、形式的要件を満たしていても許可を法的に保証するものではありません。',
    message_vn: 'Theo Điều 20 Khoản 3 Luật Nhập cảnh, việc cấp phép thay đổi tư cách lưu trú thuộc toàn quyền xem xét của Bộ Tư pháp. Đáp ứng đủ hồ sơ không đồng nghĩa với cam kết chắc chắn 100% được cấp visa.',
    message_en: 'Change of status is granted at the discretion of the Minister of Justice under Art. 20 Para. 3. Fulfilling documentary criteria does not constitute guaranteed approval.'
  });

  // 7. Lệ phí
  const feeSchedule = getStatusChangeFeeSchedule(applicationDate);

  // 8. Danh mục tài liệu theo Category doanh nghiệp (nếu là visa lao động)
  const employerCategory = applicantProfile.employerCategory || 3;
  let documentChecklist = [];
  if (targetStatusId === 'engineer_specialist') {
    const catKey = `CAT_${employerCategory}`;
    const categoryConfig = STATUS_CHANGE_DOCUMENT_CATEGORIES[catKey] || STATUS_CHANGE_DOCUMENT_CATEGORIES.CAT_3;
    documentChecklist = categoryConfig.requiredDocs.map((doc, idx) => ({
      id: `doc_${idx + 1}`,
      name: doc,
      categoryInfo: categoryConfig.name_ja
    }));
  }

  return {
    currentStatusId,
    targetStatusId,
    routeId: route ? route.id : 'custom_transition',
    routeTitle: route ? { ja: route.title_ja, vn: route.title_vn, en: route.title_en } : null,
    legalBasis: route ? route.legalBasis : '出入国管理及び難民認定法第20条',
    isExceptional,
    readinessStatus,
    prerequisites,
    warnings,
    feeSchedule,
    tokureiInfo: currentExpirationDate ? {
      currentExpirationDate,
      daysRemaining: daysUntilCurrentExpiration,
      tokureiPeriodMonths: 2,
      tokureiExpirationDate,
      statutoryBasis: '出入国管理及び難民認定法第20条第6項（特例期間）'
    } : null,
    documentChecklist,
    processingEstimatedTime: {
      minWeeks: 2,
      maxWeeks: 8,
      note_ja: '申請時期（1月〜4月の卒業就職シーズン）や入管管轄地域により審査期間が2〜3か月に延びる場合があります。',
      note_vn: 'Thời gian xét duyệt thường kéo dài từ 2 đến 8 tuần, có thể lên đến 3 tháng vào mùa cao điểm tốt nghiệp/xin việc (tháng 1 - tháng 4).',
      note_en: 'Standard processing takes 2 to 8 weeks, potentially extending to 3 months during graduation/hiring season (Jan-April).'
    }
  };
}

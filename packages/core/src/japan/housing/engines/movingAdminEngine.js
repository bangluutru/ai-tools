/**
 * @file packages/core/src/japan/housing/engines/movingAdminEngine.js
 * @description
 * Engine đánh giá thủ tục hành chính chuyển nhà tại Nhật Bản:
 * - Đánh giá tư cách tham gia Dịch vụ Một Cửa MyNaPortal (引越しワンストップサービス)
 * - Tính toán hạn chót luật định 14 ngày (住民基本台帳法第22条〜第24条)
 * - Tổng hợp giấy tờ cần chuẩn bị theo nhân khẩu & tình trạng cư trú
 * - Cảnh báo mức phạt luật định (過料 5万円) và quy tắc 15 ngày trợ cấp trẻ em
 */

import {
  MOVING_TYPES,
  STATUTORY_DEADLINES,
  ONESTOP_SERVICE_RULES,
  REQUIRED_DOCUMENTS_MASTER,
  MOVING_ADMIN_SOURCES,
} from '../rules/movingAdminRules.js';

/**
 * Định dạng YYYY-MM-DD
 * @param {Date} d
 * @returns {string}
 */
function formatDate(d) {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Thêm số ngày vào ngày cho trước
 * @param {Date} d
 * @param {number} days
 * @returns {Date}
 */
function addDays(d, days) {
  const res = new Date(d);
  res.setDate(res.getDate() + days);
  return res;
}

/**
 * Đánh giá toàn diện thủ tục hành chính chuyển nhà Nhật Bản
 * @param {Object} inputs
 * @returns {Object}
 */
export function evaluateMovingAdminProcedures(inputs = {}) {
  const movingType = inputs.movingType === 'same_municipality' ? 'same_municipality' : 'different_municipality';
  const hasMyNumberCard = Boolean(inputs.hasMyNumberCard !== false);
  const hasNationalHealthInsurance = Boolean(inputs.hasNationalHealthInsurance);
  const hasNationalPension = Boolean(inputs.hasNationalPension);
  const hasChildren = Boolean(inputs.hasChildren);
  const hasPetsDog = Boolean(inputs.hasPetsDog);
  const hasCareInsurance = Boolean(inputs.hasCareInsurance);
  const isForeignResident = Boolean(inputs.isForeignResident !== false);

  // Parse move date
  let moveDateObj = new Date();
  if (inputs.moveDate) {
    const parsed = new Date(inputs.moveDate);
    if (!isNaN(parsed.getTime())) {
      moveDateObj = parsed;
    }
  }
  // Normalize to 00:00:00
  moveDateObj.setHours(0, 0, 0, 0);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Calculate Deadlines
  const tenshutsuStartDate = addDays(moveDateObj, -STATUTORY_DEADLINES.tenshutsuDaysBefore);
  const tenshutsuEndDate = addDays(moveDateObj, STATUTORY_DEADLINES.tenshutsuDaysAfter);
  const finalDeadlineDate = addDays(moveDateObj, STATUTORY_DEADLINES.tennyuDaysAfter);

  const msPerDay = 1000 * 60 * 60 * 24;
  const daysUntilMove = Math.round((moveDateObj - today) / msPerDay);
  const daysRemaining = Math.round((finalDeadlineDate - today) / msPerDay);
  const isOverdue = daysRemaining < 0;

  // One-Stop Service Evaluation
  const isDifferentMunicipality = movingType === 'different_municipality';
  const onestopEligible = isDifferentMunicipality && hasMyNumberCard;

  const onestopEvaluation = {
    eligible: onestopEligible,
    serviceNameJa: ONESTOP_SERVICE_RULES.serviceNameJa,
    serviceNameVi: ONESTOP_SERVICE_RULES.serviceNameVi,
    serviceNameEn: ONESTOP_SERVICE_RULES.serviceNameEn,
    canSubmitTenshutsuOnline: onestopEligible,
    requiresPhysicalTennyu: true, // Luật định: luôn phải mang thẻ đến quầy ủy ban mới
    reasonJa: onestopEligible
      ? 'マイナンバーカードを保有しているため、マイナポータルからオンラインで転出届を提出可能です。'
      : isDifferentMunicipality
      ? 'マイナンバーカードをお持ちでない場合は、旧住所の市区町村窓口（または郵送）で転出届が必要です。'
      : '同一市区町村内の転居のため、役所窓口での転居届のみとなります（ワンストップ不要）。',
    reasonVi: onestopEligible
      ? 'Bạn có thẻ My Number nên có thể nộp Giấy chuyển đi (Tenshutsu) 100% online trên ứng dụng MyNaPortal mà không cần ra ủy ban cũ.'
      : isDifferentMunicipality
      ? 'Do không có thẻ My Number, bạn cần trực tiếp đến quầy ủy ban quận cũ (hoặc gửi thư bưu điện) để xin Giấy chứng nhận chuyển đi (Tenshutsu Shomeisho).'
      : 'Chuyển trong cùng một quận/thành phố, chỉ cần làm thủ tục đổi địa chỉ (Tenkyo) trực tiếp tại ủy ban quận.',
    reasonEn: onestopEligible
      ? 'Because you hold a My Number Card, you can submit the Moving-Out notification (Tenshutsu) 100% online via MyNaPortal.'
      : isDifferentMunicipality
      ? 'Without a My Number Card, you must visit the previous municipal office in person (or by postal mail) to obtain a Moving-Out Certificate.'
      : 'Intra-city moving only requires an address update (Tenkyo) at your local city hall.',
    importantNoticeJa: ONESTOP_SERVICE_RULES.importantNoticeJa,
    importantNoticeVi: ONESTOP_SERVICE_RULES.importantNoticeVi,
    importantNoticeEn: ONESTOP_SERVICE_RULES.importantNoticeEn,
  };

  // Required Documents Compilation
  const requiredDocuments = [];

  // 1. Identity
  requiredDocuments.push({
    ...REQUIRED_DOCUMENTS_MASTER.identity[0],
    category: 'identity',
  });

  if (isDifferentMunicipality && !onestopEligible) {
    requiredDocuments.push({
      ...REQUIRED_DOCUMENTS_MASTER.identity[1],
      category: 'identity',
      mandatory: true,
    });
  }

  // 2. Foreign Resident
  if (isForeignResident) {
    requiredDocuments.push({
      ...REQUIRED_DOCUMENTS_MASTER.foreign_resident[0],
      category: 'foreign_resident',
      mandatory: true,
    });
  }

  // 3. Insurance & Pension
  if (hasNationalHealthInsurance) {
    requiredDocuments.push({
      ...REQUIRED_DOCUMENTS_MASTER.insurance_pension[0],
      category: 'insurance_pension',
      mandatory: true,
    });
  }
  if (hasNationalPension) {
    requiredDocuments.push({
      ...REQUIRED_DOCUMENTS_MASTER.insurance_pension[1],
      category: 'insurance_pension',
      mandatory: true,
    });
  }
  if (hasCareInsurance) {
    requiredDocuments.push({
      ...REQUIRED_DOCUMENTS_MASTER.insurance_pension[2],
      category: 'insurance_pension',
      mandatory: true,
    });
  }

  // 4. Family & Child
  if (hasChildren) {
    requiredDocuments.push({
      ...REQUIRED_DOCUMENTS_MASTER.family_child[0],
      category: 'family_child',
      mandatory: true,
    });
    requiredDocuments.push({
      ...REQUIRED_DOCUMENTS_MASTER.family_child[1],
      category: 'family_child',
      mandatory: true,
    });
  }

  // 5. Pets
  if (hasPetsDog) {
    requiredDocuments.push({
      ...REQUIRED_DOCUMENTS_MASTER.pets[0],
      category: 'pets',
      mandatory: true,
    });
  }

  // Procedure Steps Timeline
  const steps = [];

  if (isDifferentMunicipality) {
    // Phase 1: Before move
    steps.push({
      id: 'step_tenshutsu',
      phase: 'before_move',
      timingLabelJa: '引越し14日前〜引越し当日',
      timingLabelVi: 'Từ 14 ngày trước khi chuyển đến ngày chuyển',
      timingLabelEn: '14 days before move until moving day',
      titleJa: onestopEligible ? 'マイナポータルで転出届をオンライン提出' : '旧住所の役所で転出届を提出し転出証明書を取得',
      titleVi: onestopEligible ? 'Nộp Giấy chuyển đi (Tenshutsu) online trên MyNaPortal' : 'Đến ủy ban quận cũ nộp đơn chuyển đi và nhận Giấy chứng nhận 転出証明書',
      titleEn: onestopEligible ? 'Submit Moving-out notification online via MyNaPortal' : 'File moving-out notification at old city hall and receive certificate',
      locationJa: onestopEligible ? 'マイナポータル（スマホ・PC）' : '旧住所の市区町村役所窓口',
      locationVi: onestopEligible ? 'Ứng dụng MyNaPortal (Điện thoại / Máy tính)' : 'Quầy Ủy ban Nhân dân / Quận Cũ',
      locationEn: onestopEligible ? 'MyNaPortal App (Mobile / PC)' : 'Previous Municipal Office Window',
      isOnline: onestopEligible,
      deadlineDate: formatDate(tenshutsuEndDate),
      guidanceJa: onestopEligible
        ? '署名用電子証明書（英数字6〜16桁暗証番号）を入力して申請します。新住所の役所への「来庁予定日」を合わせて登録します。'
        : '本人確認書類を持参して窓口で申請します。「転出証明書」が発行されますので、引越し先で必ず使用します。',
      guidanceVi: onestopEligible
        ? 'Đăng nhập bằng mã PIN chữ ký điện tử (6-16 ký tự). Đăng ký trước ngày dự kiến đến ủy ban mới để được ưu tiên xử lý.'
        : 'Mang giấy tờ tùy thân ra ủy ban cũ để nộp. Bạn sẽ nhận được Giấy chứng nhận chuyển đi (Tenshutsu Shomeisho), tuyệt đối không làm mất.',
      guidanceEn: onestopEligible
        ? 'Sign with your 6-16 char electronic signature PIN. Pre-register your scheduled visit date at the new municipality.'
        : 'Bring identity documents to the counter. You will receive a Moving-Out Certificate required at your new municipality.',
    });

    // Phase 2: After move
    steps.push({
      id: 'step_tennyu',
      phase: 'after_move',
      timingLabelJa: '引越し後14日以内（法定厳守）',
      timingLabelVi: 'Trong vòng 14 ngày kể từ ngày chuyển đến (Bắt buộc theo luật)',
      timingLabelEn: 'Strictly within 14 days after moving in',
      titleJa: '新住所の市区町村役所窓口で【転入届】を提出',
      titleVi: 'Nộp Giấy chuyển đến (Tennyu) tại ủy ban quận/thành phố mới',
      titleEn: 'Submit Moving-in notification at new municipal office',
      locationJa: '新住所の市区町村役所窓口',
      locationVi: 'Quầy Ủy ban Nhân dân / Quận Mới',
      locationEn: 'New Municipal Office Window',
      isOnline: false,
      deadlineDate: formatDate(finalDeadlineDate),
      guidanceJa: onestopEligible
        ? 'マイナンバーカードと数字4桁暗証番号を持参して来庁します。「特例転入」により転出証明書の紙提出は不要です。カードの住所書き換え（継続利用）も同一窓口で行います。'
        : '転出証明書、本人確認書類を持参して窓口で転入届を提出します。',
      guidanceVi: onestopEligible
        ? 'BẮT BUỘC mang thẻ My Number và nhớ mã PIN 4 chữ số trực tiếp đến ủy ban mới. Nhờ quy trình đặc biệt Tokurei Tennyu, bạn không cần nộp giấy chứng nhận giấy. Ủy ban sẽ cập nhật chip và in địa chỉ mới lên thẻ.'
        : 'Mang theo Giấy chứng nhận chuyển đi (Tenshutsu Shomeisho) và giấy tờ tùy thân nộp tại quầy tiếp nhận cư dân.',
      guidanceEn: onestopEligible
        ? 'You MUST visit the counter with your My Number Card and 4-digit PIN. Under the special move-in procedure, no paper certificate is required.'
        : 'Bring your paper Moving-Out Certificate and ID documents to the residential window.',
    });
  } else {
    // Same municipality
    steps.push({
      id: 'step_tenkyo',
      phase: 'after_move',
      timingLabelJa: '引越し後14日以内（法定厳守）',
      timingLabelVi: 'Trong vòng 14 ngày sau khi chuyển nhà (Bắt buộc theo luật)',
      timingLabelEn: 'Strictly within 14 days after moving',
      titleJa: '同一市区町村の役所窓口で【転居届】を提出',
      titleVi: 'Nộp Giấy đổi địa chỉ cư trú (Tenkyo) tại ủy ban cùng quận/thành phố',
      titleEn: 'Submit Address Change notification (Tenkyo) at city hall',
      locationJa: '現住所の市区町村役所窓口',
      locationVi: 'Quầy Ủy ban Nhân dân quận hiện tại',
      locationEn: 'Current Municipal Office Window',
      isOnline: false,
      deadlineDate: formatDate(finalDeadlineDate),
      guidanceJa: '同一区役所・市役所で住所変更を行います。マイナンバーカードをお持ちの場合は券面更新と暗証番号入力を行います。',
      guidanceVi: 'Làm thủ tục đổi địa chỉ trong cùng quận. Nếu có thẻ My Number, ủy ban sẽ in địa chỉ mới lên thẻ và cập nhật chip điện tử.',
      guidanceEn: 'Update address within the same city/ward. Present My Number Card for address re-endorsement.',
    });
  }

  // Common additional step: Foreign resident card endorsement
  if (isForeignResident) {
    steps.push({
      id: 'step_zairyu_endorsement',
      phase: 'after_move',
      timingLabelJa: '転入・転居届と同時（14日以内）',
      timingLabelVi: 'Thực hiện cùng lúc khi nộp Tennyu/Tenkyo (Trong 14 ngày)',
      timingLabelEn: 'Simultaneously with moving notification (Within 14 days)',
      titleJa: '在留カード裏面への新住所記載（住居地届出）',
      titleVi: 'In địa chỉ mới vào mặt sau Thẻ Ngoại Kiều 在留カード',
      titleEn: 'Endorsement of new address on Residence Card',
      locationJa: '役所の住民課・外国人総合窓口',
      locationVi: 'Quầy quản lý cư dân / Hỗ trợ người nước ngoài tại Ủy ban',
      locationEn: 'Resident Section / Foreigner Window at City Hall',
      isOnline: false,
      deadlineDate: formatDate(finalDeadlineDate),
      guidanceJa: '出入国管理法に基づき、住居地変更後14日以内に在留カードを役所へ持参し、裏面に新住所の記載を受ける必要があります。',
      guidanceVi: 'Theo Luật Quản lý Xuất Nhập Cảnh: Trong vòng 14 ngày sau khi chuyển chỗ ở, người nước ngoài bắt buộc phải xuất trình thẻ ngoại kiều tại ủy ban để công chức in địa chỉ mới vào mặt sau.',
      guidanceEn: 'Under Immigration Control Act Art. 19-9, foreign residents must present their Residence Card at the municipal office within 14 days to have their new address endorsed on the back.',
    });
  }

  // Common additional step: Child Allowance 15-day rule
  if (hasChildren) {
    const childAllowanceDeadline = addDays(moveDateObj, 15);
    steps.push({
      id: 'step_child_allowance',
      phase: 'after_move',
      timingLabelJa: '転出予定日の翌日から15日以内（15日特例）',
      timingLabelVi: 'Trong vòng 15 ngày kể từ ngày kế tiếp ngày dự kiến chuyển',
      timingLabelEn: 'Within 15 days from the day following planned move date',
      titleJa: '児童手当の新規認定請求（新住所の役所窓口・マイナポータル）',
      titleVi: 'Nộp đơn đăng ký nhận Trợ cấp Trẻ em (Jido Teate) tại quận mới',
      titleEn: 'File Child Allowance claim at new municipality',
      locationJa: '新住所の役所 子育て支援課窓口 または マイナポータル',
      locationVi: 'Phòng hỗ trợ nuôi dạy trẻ (Kosodate Shienka) quận mới hoặc MyNaPortal',
      locationEn: 'Child Support Division at New City Hall or MyNaPortal',
      isOnline: true,
      deadlineDate: formatDate(childAllowanceDeadline),
      guidanceJa: '「15日特例」により、月末近くの引越しでも15日以内に請求すれば引越し翌月分から支給されます。遅れると受給できない月が生じます。',
      guidanceVi: 'Nhờ quy tắc đặc quyền 15 ngày: Dù chuyển nhà vào những ngày cuối tháng, miễn là nộp đơn trong vòng 15 ngày thì vẫn nhận đủ tiền trợ cấp của tháng tiếp theo. Nếu nộp muộn, bạn sẽ bị mất tiền trợ cấp của tháng đó.',
      guidanceEn: 'Under the 15-day grace rule, applying within 15 days ensures you receive allowance from the month following your move without losing a month of entitlement.',
    });
  }

  // Legal Warnings List
  const warnings = [];

  // Overdue warning
  if (isOverdue) {
    warnings.push({
      level: 'danger',
      titleJa: '法定提出期限（14日）を超過しています！',
      titleVi: 'ĐÃ QUÁ HẠN NỘP HỒ SƠ 14 NGÀY LUẬT ĐỊNH!',
      titleEn: 'Statutory 14-day filing deadline has been exceeded!',
      contentJa: `正当な理由なく14日以内に届出を行わない場合、住民基本台帳法第52条に基づき、簡易裁判所から最大5万円の過料（罰則）が科される恐れがあります。大至急窓口へ来庁してください。`,
      contentVi: `Nếu không làm thủ tục trong vòng 14 ngày mà không có lý do chính đáng, theo Điều 52 Luật Sổ bộ Cư trú, Tòa án có thể ra phán quyết phạt tiền đến 50.000 Yên. Hãy đến ủy ban giải quyết ngay lập tức!`,
      contentEn: `Under Art. 52 of the Resident Basic Book Act, failure to file within 14 days without justifiable cause may result in a non-penal court fine of up to 50,000 JPY. Please visit the municipal office immediately!`,
      citation: STATUTORY_DEADLINES.overdueFineLawJa,
    });
  } else if (daysRemaining <= 3) {
    warnings.push({
      level: 'warning',
      titleJa: `法定提出期限まであと${daysRemaining}日です`,
      titleVi: `Chỉ còn ${daysRemaining} ngày là hết hạn luật định!`,
      titleEn: `Only ${daysRemaining} days remaining before statutory deadline!`,
      contentJa: '役所の窓口は平日の日中のみ受付の自治体が多いため、速やかに来庁スケジュールを確保してください。',
      contentVi: 'Hầu hết ủy ban chỉ mở cửa ngày thường từ thứ 2 đến thứ 6 (8:30 - 17:00). Hãy sắp xếp xin nghỉ hoặc tranh thủ đến sớm.',
      contentEn: 'Most city offices only operate during weekday business hours. Secure an appointment as soon as possible.',
      citation: STATUTORY_DEADLINES.overdueFineLawJa,
    });
  }

  // My Number Card 90-day warning
  if (hasMyNumberCard && isDifferentMunicipality) {
    warnings.push({
      level: 'info',
      titleJa: 'マイナンバーカードの継続利用（90日ルール）',
      titleVi: 'Quy tắc gia hạn thẻ My Number trong vòng 90 ngày',
      titleEn: 'My Number Card 90-day Continuing Validity Rule',
      contentJa: '転入届提出後、または転出予定日から90日以内に新住所の窓口でマイナンバーカードの「継続利用手続き」を行わない場合、カードが失効（無効化）します。',
      contentVi: 'Nếu sau khi chuyển đến không mang thẻ My Number đi làm thủ tục duy trì hiệu lực tại ủy ban mới trong vòng 90 ngày, thẻ sẽ bị khóa vĩnh viễn và phải mất phí làm lại từ đầu.',
      contentEn: 'If the card continuing validity procedure is not completed within 90 days of moving in, the card will be permanently revoked.',
      citation: 'マイナンバー法（行政手続における特定の個人を識別するための番号の利用等に関する法律）',
    });
  }

  return {
    movingType,
    isDifferentMunicipality,
    hasMyNumberCard,
    moveDate: formatDate(moveDateObj),
    deadlines: {
      tenshutsuStart: formatDate(tenshutsuStartDate),
      tenshutsuEnd: formatDate(tenshutsuEndDate),
      finalDeadline: formatDate(finalDeadlineDate),
      daysUntilMove,
      daysRemaining,
      isOverdue,
      statutoryFineMaxYen: STATUTORY_DEADLINES.overdueFineMaxYen,
    },
    onestop: onestopEvaluation,
    requiredDocuments,
    steps,
    warnings,
    sources: MOVING_ADMIN_SOURCES,
  };
}

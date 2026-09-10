/**
 * @file packages/core/src/japan/housing/engines/movingWizardEngine.js
 * @description
 * Công cụ điều phối & lập kế hoạch Chuyển nhà tại Nhật Bản (Japan Moving Wizard Engine).
 * Xây dựng trên Nền tảng Sự Kiện Đời Sống (Life Event Foundation), tính toán mốc thời gian luật định,
 * cảnh báo rủi ro quá hạn (50.000 JPY tiền phạt, mất trợ cấp trẻ em), và sinh danh mục công việc (Checklist)
 * cá nhân hóa với khả năng deep-link chuyển tiếp tới các công cụ tính toán chi tiết.
 */

import {
  MOVING_STAGES,
  MOVING_WIZARD_SOURCES,
  MOVING_ACTION_ITEMS,
  movingWizardDefinition,
  movingWizardRuntime,
} from '../rules/movingWizardDefinition.js';

export {
  MOVING_STAGES,
  MOVING_WIZARD_SOURCES,
  MOVING_ACTION_ITEMS,
  movingWizardDefinition,
  movingWizardRuntime,
};

/**
 * Cộng thêm số ngày vào một chuỗi ngày 'YYYY-MM-DD'
 * @param {string} dateStr
 * @param {number} days
 * @returns {string}
 */
export function addDays(dateStr, days) {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

/**
 * Trừ đi số ngày từ một chuỗi ngày 'YYYY-MM-DD'
 * @param {string} dateStr
 * @param {number} days
 * @returns {string}
 */
export function subtractDays(dateStr, days) {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  d.setDate(d.getDate() - days);
  return d.toISOString().split('T')[0];
}

/**
 * Sinh kế hoạch chuyển nhà hoàn chỉnh và đồng bộ với Life Event Runtime
 * @param {Object} input
 * @param {string} [input.moveDate] - Ngày chuyển nhà ('YYYY-MM-DD')
 * @param {string} [input.movingType] - 'different_municipality' | 'same_municipality'
 * @param {boolean} [input.hasMyNumberCard] - Có thẻ My Number không
 * @param {boolean} [input.hasVehicle] - Có ô tô/xe máy không
 * @param {boolean} [input.hasChildren] - Có con nhỏ thuộc diện nhận trợ cấp trẻ em không
 * @param {boolean} [input.hasFixedInternet] - Có dùng mạng cáp quang cố định không
 * @param {boolean} [input.isForeignResident] - Có phải người nước ngoài mang thẻ ngoại kiều không
 * @returns {Object} Kế hoạch chi tiết với timeline, deadlines, checklist và công cụ liên quan
 */
export function generateMovingWizardPlan(input = {}) {
  const today = new Date().toISOString().split('T')[0];
  const moveDate = input.moveDate || addDays(today, 30);
  const movingType = input.movingType || 'different_municipality';
  const isSameMunicipality = movingType === 'same_municipality';
  const hasMyNumberCard = Boolean(input.hasMyNumberCard);
  const hasVehicle = Boolean(input.hasVehicle);
  const hasChildren = Boolean(input.hasChildren);
  const hasFixedInternet = input.hasFixedInternet !== false;
  const isForeignResident = input.isForeignResident !== false;

  // 1. Tính toán các mốc thời gian mấu chốt
  const oneMonthPriorDate = subtractDays(moveDate, 30);
  const tenshutsuStartDate = subtractDays(moveDate, 14);
  const oneWeekPriorDate = subtractDays(moveDate, 7);
  const tennyuDeadlineDate = addDays(moveDate, 14); // 14 ngày theo Điều 22 & 23 Luật Cư trú
  const childAllowanceDeadlineDate = addDays(moveDate, 15); // 15 ngày đặc lệ Điều 8 Luật Trợ cấp Trẻ em
  const vehicleUpdateDeadlineDate = addDays(moveDate, 15); // 15 ngày theo Điều 12 Luật Phương tiện Xe cơ giới
  const mynaKeizokuDeadlineDate = addDays(moveDate, 90); // 90 ngày tối đa để gia hạn thẻ My Number

  // 2. Phân tích các cảnh báo luật định bắt buộc
  const warnings = [];

  // Cảnh báo nộp 転入届 trong 14 ngày & phạt 50.000 JPY
  warnings.push({
    id: 'warning_tennyu_14days',
    severity: 'critical',
    titleJa: '住民票の手続き期限：引越し後14日以内厳守',
    titleVi: 'Hạn chót đăng ký cư trú: Nghiêm ngặt trong vòng 14 ngày sau khi chuyển',
    titleEn: 'Resident Record Deadline: Strict 14 days after moving',
    lawJa: '住民基本台帳法第22条・第23条・第52条（最高5万円の過料）',
    lawVi: 'Điều 22, 23 & 52 Luật Đăng ký Cư trú (Phạt tiền tới 50.000 yên nếu chậm trễ)',
    lawEn: 'Basic Resident Registration Act Arts. 22, 23 & 52 (Fines up to 50,000 JPY)',
    deadlineDate: tennyuDeadlineDate,
    descriptionJa: `新居に住み始めた日から14日以内に新自治体窓口で${isSameMunicipality ? '転居届' : '転入届'}を提出しなければなりません。正当な理由のない遅延には5万円以下の過料が科される可能性があります。`,
    descriptionVi: `Phải nộp ${isSameMunicipality ? 'Giấy chuyển chỗ ở (転居届)' : 'Giấy báo chuyển đến (転入届)'} tại ủy ban quận mới trong 14 ngày từ ngày dọn vào. Chậm trễ không lý do chính đáng có thể bị phạt tiền tới 50.000 yên.`,
    descriptionEn: `Must submit ${isSameMunicipality ? 'Tenkyo-todoke' : 'Tennyu-todoke'} within 14 days of moving in. Unjustified delay may incur fines up to 50,000 JPY.`,
  });

  // Cảnh báo trợ cấp trẻ em 15 ngày đặc lệ (nếu có con và chuyển khác quận)
  if (hasChildren && !isSameMunicipality) {
    warnings.push({
      id: 'warning_child_allowance_15days',
      severity: 'high',
      titleJa: '児童手当15日特例：引越し後15日以内に申請しないと1ヶ月分消滅',
      titleVi: 'Đặc lệ 15 ngày Trợ cấp Trẻ em: Phải nộp trong 15 ngày để không mất 1 tháng tiền trợ cấp',
      titleEn: 'Child Allowance 15-Day Rule: Must apply within 15 days or forfeit 1 full month',
      lawJa: '児童手当法第8条（15日特例規定）',
      lawVi: 'Điều 8 Luật Trợ cấp Trẻ em (Quy định đặc lệ 15 ngày chuyển nhà)',
      lawEn: 'Child Allowance Act Art. 8 (15-Day Transition Exception)',
      deadlineDate: childAllowanceDeadlineDate,
      descriptionJa: '児童手当は月末締め翌月支給が原則ですが、引越し日の翌日から15日以内に新自治体へ申請すれば転入月からの支給が保護されます。遅れると1ヶ月分の手当が永久に不支給となります。',
      descriptionVi: 'Trợ cấp trẻ em tính theo tháng. Nếu nộp trong vòng 15 ngày kể từ ngày kế tiếp ngày chuyển nhà, bạn sẽ được bảo lưu hưởng trợ cấp từ tháng chuyển đến. Nếu trễ, sẽ mất vĩnh viễn 1 tháng tiền trợ cấp.',
      descriptionEn: 'Filing within 15 days of move date preserves benefit continuity for the moving month. A single day delay permanently forfeits that entire month.',
    });
  }

  // Cảnh báo người nước ngoài về Thẻ ngoại kiều
  if (isForeignResident) {
    warnings.push({
      id: 'warning_zairyu_endorsement',
      severity: 'high',
      titleJa: '在留カード住居地届出：14日以内届出（90日放置で在留資格取消の恐れ）',
      titleVi: 'Đổi địa chỉ Thẻ ngoại kiều: Trong 14 ngày (Quá 90 ngày có thể bị tước visa)',
      titleEn: 'Residence Card Address Endorsement: Within 14 days (Risk of visa revocation past 90 days)',
      lawJa: '出入国管理法第19条の9 / 住民基本台帳法第30条の46',
      lawVi: 'Điều 19-9 Luật Quản lý Xuất nhập cảnh & Điều 30-46 Luật Đăng ký Cư trú',
      lawEn: 'Immigration Control Act Art. 19-9 & Basic Resident Registration Act Art. 30-46',
      deadlineDate: tennyuDeadlineDate,
      descriptionJa: '市区町村窓口で転入・転居届を提出する際、世帯全員の在留カード原本を持参して裏面に新住所の印字を受けてください。',
      descriptionVi: 'Khi nộp thủ tục chuyển đến tại ủy ban, mang theo thẻ ngoại kiều gốc của tất cả các thành viên trong nhà để nhân viên in địa chỉ mới vào mặt sau thẻ.',
      descriptionEn: 'Bring original residence cards for all family members to city hall for address endorsement on the reverse side.',
    });
  }

  // 3. Sinh danh sách công việc qua Life Event Runtime
  const rawTasks = movingWizardRuntime.evaluateChecklist({
    ...input,
    moveDate,
    movingType,
    hasMyNumberCard,
    hasVehicle,
    hasChildren,
    hasFixedInternet,
    isForeignResident,
  });

  const tasks = rawTasks.map((item) => ({
    ...item,
    deadlineDate: item.calculatedDeadlineDate || '',
  }));

  // 4. Lập trục thời gian tiến trình (Chronological Timeline)
  const timeline = [
    {
      date: oneMonthPriorDate,
      stageId: 'stage_1_month_prior',
      titleJa: '引越し準備スタート（見積もり・退去申出・光回線）',
      titleVi: 'Khởi động chuẩn bị chuyển nhà (Báo giá, báo trả nhà & cáp quang)',
      titleEn: 'Moving preparation kickoff (Quotes, lease notice & fiber)',
      isCritical: true,
      descriptionJa: '現在の物件の管理会社へ解約を申し入れ、引越し業者の見積もりを取り始めます。',
      descriptionVi: 'Báo đơn vị quản lý nhà về ngày trả phòng, liên hệ các bên chuyển nhà để lấy báo giá.',
    },
    {
      date: tenshutsuStartDate,
      stageId: 'stage_1_week_prior',
      titleJa: isSameMunicipality ? '引越し1〜2週間前（ライフライン・郵便転送）' : '転出届受付開始（引越し約14日前〜）',
      titleVi: isSameMunicipality ? '1-2 tuần trước khi chuyển (Điện nước gas & bưu điện)' : 'Bắt đầu nộp giấy chuyển đi Tenshutsu (Trước 14 ngày)',
      titleEn: isSameMunicipality ? '1-2 Weeks Prior (Utilities & Mail Forwarding)' : 'Tenshutsu move-out notice window opens (~14 days prior)',
      isCritical: !isSameMunicipality,
      descriptionJa: isSameMunicipality
        ? '電気・水道・ガスの移転予約と郵便e転居の登録を行います。'
        : 'マイナポータルまたは旧役所窓口で転出届を提出可能になります。',
      descriptionVi: isSameMunicipality
        ? 'Đăng ký chuyển điện, nước, gas và dịch vụ chuyển tiếp bưu điện e-Tenkyo.'
        : 'Có thể nộp giấy chuyển đi qua mạng (MyNaPortal) hoặc ra ủy ban cũ lấy giấy chứng nhận chuyển đi.',
    },
    {
      date: oneWeekPriorDate,
      stageId: 'stage_1_week_prior',
      titleJa: 'ライフライン手続き・ガス開栓予約・荷造り本格化',
      titleVi: 'Hoàn tất thủ tục điện nước gas, hẹn mở van ga & đóng gói đồ đạc',
      titleEn: 'Finalize utilities, gas turn-on booking & major packing',
      isCritical: true,
      descriptionJa: 'ガス開栓立ち会いの日時を確定させ、不用品の最終処分を進めます。',
      descriptionVi: 'Chốt giờ hẹn nhân viên gas đến mở van nhà mới, dọn sạch đồ đạc.',
    },
    {
      date: moveDate,
      stageId: 'stage_day_of_move',
      titleJa: '引越し当日（旧居立ち会い・搬出入・新居ガス開栓立ち会い）',
      titleVi: 'Ngày chuyển nhà (Bàn giao nhà cũ, vận chuyển đồ & đón thợ gas)',
      titleEn: 'Moving Day (Old inspection, transport & gas turn-on)',
      isCritical: true,
      descriptionJa: '旧居の鍵返却と敷金精算確認。新居でガス開栓に立ち会い、お湯と暖房の動作を確認。',
      descriptionVi: 'Trả chìa khóa nhà cũ, sang nhà mới đón thợ kiểm tra gas để có nước nóng và bếp nấu.',
    },
    {
      date: tennyuDeadlineDate,
      stageId: 'stage_within_14_days',
      titleJa: '役所手続き法定期限（転入届・マイナンバー・在留カード：14日以内）',
      titleVi: 'Hạn chót luật định tại Ủy ban quận mới (転入届, My Number, Thẻ ngoại kiều)',
      titleEn: 'Municipal Statutory Deadline (Tennyu, My Number, Zairyu: 14 days)',
      isCritical: true,
      descriptionJa: '住民基本台帳法第22条に基づく法定期限。過料5万円の対象となる前に完了必須。',
      descriptionVi: 'Hạn chót theo Điều 22 Luật Đăng ký Cư trú. Bắt buộc hoàn tất để không bị phạt 50.000 yên.',
    },
    {
      date: childAllowanceDeadlineDate,
      stageId: 'stage_within_14_days',
      titleJa: '児童手当15日特例期限（引越し後15日以内）',
      titleVi: 'Hạn chót nộp đơn Trợ cấp Trẻ em (Đặc lệ 15 ngày)',
      titleEn: 'Child Allowance 15-Day Exception Deadline',
      isCritical: hasChildren && !isSameMunicipality,
      descriptionJa: '引越し翌日から15日以内に新自治体へ認定請求書を提出。',
      descriptionVi: 'Nộp đơn trong vòng 15 ngày kể từ ngày kế tiếp ngày chuyển.',
    },
  ];

  // 5. Danh sách các công cụ chuyên sâu liên kết (Related Mini-apps)
  const relatedTools = [
    {
      toolId: 'moving-cost-jp',
      capabilityId: 'housing.moving.cost.calculate',
      titleJa: '引越し費用シミュレーター',
      titleVi: 'Mô phỏng chi phí chuyển nhà',
      titleEn: 'Moving Cost Calculator',
      badgeJa: '相場・相見積もり',
      badgeVi: 'Giá cả & Tiết kiệm',
      badgeEn: 'Rates & Budget',
      descriptionJa: '間取り・距離・時期別の国土交通省標準約款ベースの相場試算。',
      descriptionVi: 'Ước tính giá cước theo diện tích, khoảng cách và mùa chuyển nhà.',
      descriptionEn: 'Accurate cost estimate based on MLIT standards, distance and peak season.',
    },
    {
      toolId: 'moving-admin-checker-jp',
      capabilityId: 'housing.moving.admin.check',
      titleJa: '引越し役所手続きチェッカー',
      titleVi: 'Kiểm tra thủ tục hành chính chuyển nhà',
      titleEn: 'Moving Admin Checker',
      badgeJa: 'マイナポータル・過料',
      badgeVi: 'Hành chính & Pháp lý',
      badgeEn: 'Legal & One-Stop',
      descriptionJa: '転出届・転入届・マイナポータル引越しワンストップサービス・在留カードの総合判定。',
      descriptionVi: 'Kiểm tra điều kiện nộp online qua MyNaPortal, giấy tờ cần mang và hạn chót 14 ngày.',
      descriptionEn: 'Check MyNaPortal One-Stop eligibility, required documents, and 14-day statutory deadlines.',
    },
    {
      toolId: 'address-change-checklist-jp',
      capabilityId: 'housing.address.change.check',
      titleJa: '住所変更手続きチェックリスト',
      titleVi: 'Danh mục đổi địa chỉ toàn diện',
      titleEn: 'Address Change Checklist',
      badgeJa: 'ライフライン・免許',
      badgeVi: 'Điện nước & Giấy tờ',
      badgeEn: 'Utilities & Licenses',
      descriptionJa: '電気・ガス開栓立ち会い・水道・郵便e転居・光回線・免許証・車検証の漏れ防止。',
      descriptionVi: 'Hướng dẫn chi tiết mở ga có mặt, dịch vụ bưu điện e-Tenkyo, bằng lái, xe cộ.',
      descriptionEn: 'Ensure zero missed procedures for utilities, in-person gas checks, e-Tenkyo, and licenses.',
    },
    {
      toolId: 'child-allowance-jp',
      capabilityId: 'family.childAllowance.calculate',
      titleJa: '児童手当シミュレーター',
      titleVi: 'Tính tiền trợ cấp trẻ em',
      titleEn: 'Child Allowance Calculator',
      badgeJa: '15日特例',
      badgeVi: 'Trợ cấp trẻ em',
      badgeEn: '15-Day Rule',
      descriptionJa: '新制度（所得制限撤廃・第3子3万円）に基づく支給額試算と引越し15日特例の確認。',
      descriptionVi: 'Tính số tiền trợ cấp được hưởng theo chính sách mới và hướng dẫn bảo lưu theo đặc lệ 15 ngày.',
      descriptionEn: 'Calculate child allowance under reformed rules and protect benefits via the 15-day rule.',
    },
  ];

  // 6. Thống kê tổng quan
  const totalTasks = tasks.length;
  const applicableTasks = tasks.filter((t) => t.isApplicable).length;
  const urgentTasks = tasks.filter((t) => t.isApplicable && t.priority === 'urgent').length;

  return {
    profile: {
      moveDate,
      movingType,
      isSameMunicipality,
      hasMyNumberCard,
      hasVehicle,
      hasChildren,
      hasFixedInternet,
      isForeignResident,
    },
    milestones: {
      oneMonthPriorDate,
      tenshutsuStartDate,
      oneWeekPriorDate,
      moveDate,
      tennyuDeadlineDate,
      childAllowanceDeadlineDate,
      vehicleUpdateDeadlineDate,
      mynaKeizokuDeadlineDate,
    },
    warnings,
    timeline,
    tasks,
    relatedTools,
    stats: {
      totalTasks,
      applicableTasks,
      urgentTasks,
    },
  };
}

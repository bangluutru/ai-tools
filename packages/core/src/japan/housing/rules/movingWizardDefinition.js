/**
 * @file packages/core/src/japan/housing/rules/movingWizardDefinition.js
 * @description
 * Định nghĩa sự kiện đời sống "Chuyển nhà tại Nhật Bản" (Japan Moving Life Event Definition)
 * xây dựng trên Nền tảng Sự Kiện Đời Sống (Life Event Foundation).
 * 
 * Căn cứ pháp lý & Quy chuẩn nhà nước:
 * 1. 住民基本台帳法第22条（転入届：引越し後14日以内）
 * 2. 住民基本台帳法第23条（転居届：同一市区町村内14日以内）
 * 3. 住民基本台帳法第24条（転出届：概ね14日前から当日）
 * 4. 住民基本台帳法第52条（正当な理由のない届出遅延に対する5万円以下の過料罰則）
 * 5. デジタル庁 マイナポータル 引越しワンストップサービス（オンライン転出・転入予約）
 * 6. 郵便法第29条（郵便物転送サービス・e転居 1年間無償転送）
 * 7. 道路交通法第94条（運転免許証記載事項変更届：速やかに）
 * 8. 道路運送車両法第12条（自動車の変更登録：15日以内）
 * 9. 児童手当法第7条 / 第8条（児童手当15日特例：引越し翌日から15日以内申請で手当喪失防止）
 * 10. 国土交通省 標準引越運送約款第21条（見積もり・キャンセル料規定）
 */

import { createLifeEventRuntime } from '../../../life-events/index.js';

export const MOVING_STAGES = [
  {
    id: 'stage_1_month_prior',
    stageId: 'stage_1_month_prior',
    nameJa: '1ヶ月前〜：準備・見積もり・解約申出',
    nameVi: 'Từ 1 tháng trước: Lập kế hoạch, báo trả nhà & đặt lịch chuyển',
    nameEn: '1 Month Prior: Planning, Notice & Moving Estimates',
    order: 1,
  },
  {
    id: 'stage_1_week_prior',
    stageId: 'stage_1_week_prior',
    nameJa: '1〜2週間前：転出届・ライフライン・郵便転送',
    nameVi: '1-2 tuần trước: Báo chuyển đi (転出), điện nước & bưu điện e-Tenkyo',
    nameEn: '1-2 Weeks Prior: Move-out Notice, Utilities & Mail Forwarding',
    order: 2,
  },
  {
    id: 'stage_day_of_move',
    stageId: 'stage_day_of_move',
    nameJa: '引越し当日：旧居立ち会い・新居開栓・搬入',
    nameVi: 'Ngày chuyển nhà: Bàn giao nhà cũ, mở ga nhà mới & dọn đồ',
    nameEn: 'Moving Day: Old Key Handover, Gas Opening & Move-in',
    order: 3,
  },
  {
    id: 'stage_within_14_days',
    stageId: 'stage_within_14_days',
    nameJa: '引越し後14日以内：転入届・マイナンバー・在留カード',
    nameVi: 'Trong 14 ngày sau chuyển: Báo chuyển đến (転入), My Number & Thẻ ngoại kiều',
    nameEn: 'Within 14 Days Post-Move: Move-in Notice, My Number & Zairyu Card',
    order: 4,
  },
  {
    id: 'stage_post_move',
    stageId: 'stage_post_move',
    nameJa: '新生活安定期：銀行・クレカ・免許証・車検証',
    nameVi: 'Ổn định cuộc sống: Đổi địa chỉ ngân hàng, thẻ, bằng lái & xe cộ',
    nameEn: 'Settling In: Banks, Credit Cards, Driver License & Vehicle',
    order: 5,
  },
];

export const MOVING_WIZARD_SOURCES = [
  'mlit-standard-moving-contract-art21',
  'basic-resident-registration-act-art22-25',
  'basic-resident-registration-act-art52-fine',
  'digital-agency-myna-moving-onestop',
  'japan-post-act-art29-e-tenkyo',
  'road-traffic-act-art94-license',
  'road-transport-vehicle-act-art12',
  'child-allowance-act-art7-15day-rule',
];

/**
 * Danh sách toàn bộ các đầu việc chuẩn hóa trong sự kiện Chuyển nhà
 */
export const MOVING_ACTION_ITEMS = [
  // Stage 1: 1 Month Prior
  {
    id: 'task_moving_cost_estimate',
    stageId: 'stage_1_month_prior',
    category: 'packing',
    priority: 'urgent',
    titleJa: '引越し業者の一括見積もり・契約',
    titleVi: 'So sánh báo giá và đặt công ty chuyển nhà',
    titleEn: 'Get moving company quotes and sign contract',
    descriptionJa: '繁忙期（3〜4月）は料金が1.5〜2倍に跳ね上がり予約が埋まります。早めの相見積もりで相場を確認してください。',
    descriptionVi: 'Vào mùa cao điểm (tháng 3-4), giá cước tăng 1.5 - 2 lần và nhanh hết xe. Cần ước tính chi phí và đặt sớm.',
    descriptionEn: 'Peak season (March-April) rates spike 1.5-2x. Compare quotes early to secure reservations.',
    relatedCapabilityId: 'housing.moving.cost.calculate',
    deepLink: {
      toolId: 'moving-cost-jp',
      labelJa: '引越し費用シミュレーターを開く',
      labelVi: 'Tính toán chi phí chuyển nhà',
      labelEn: 'Open Moving Cost Calculator',
    },
    deadlineRule: {
      anchorKey: 'moveDate',
      offsetDays: 30,
      direction: 'before',
    },
    requiredDocuments: [
      { nameJa: '荷物リスト・家具家電サイズ一覧', nameVi: 'Danh sách đồ đạc, kích thước nội thất tủ lạnh máy giặt', nameEn: 'Inventory list with furniture/appliance dimensions' },
    ],
  },
  {
    id: 'task_lease_termination_notice',
    stageId: 'stage_1_month_prior',
    category: 'admin',
    priority: 'urgent',
    titleJa: '現在の賃貸物件の解約予告（退去申出）',
    titleVi: 'Thông báo trả nhà thuê hiện tại (Báo trước 1 tháng)',
    titleEn: 'Current rental lease termination notice',
    descriptionJa: '多くの賃貸契約で「退去の1ヶ月前（物件により2ヶ月前）」までの書面申出が義務付けられています。遅れると翌月分の二重家賃が発生します。',
    descriptionVi: 'Hợp đồng thuê nhà tại Nhật thường yêu cầu báo trước 1 tháng (hoặc 2 tháng). Báo trễ sẽ phải trả tiền nhà trùng tháng.',
    descriptionEn: 'Standard contracts require 1 month notice. Late notice triggers overlapping double rent.',
    deadlineRule: {
      anchorKey: 'moveDate',
      offsetDays: 30,
      direction: 'before',
    },
    requiredDocuments: [
      { nameJa: '賃貸借契約書・退去届出書', nameVi: 'Hợp đồng thuê nhà & Đơn xin trả nhà', nameEn: 'Lease agreement & Move-out notice form' },
    ],
  },
  {
    id: 'task_internet_optical_line',
    stageId: 'stage_1_month_prior',
    category: 'lifeline',
    priority: 'important',
    titleJa: 'インターネット光回線の移転・新規工事予約',
    titleVi: 'Đặt lịch chuyển mạng cáp quang / lắp mạng mới',
    titleEn: 'Internet optical fiber transfer / installation reservation',
    descriptionJa: '光回線の開通工事は混雑時2〜4週間待ちとなります。新居ですぐネットを使うため1ヶ月前に移転または新規工事を申し込みます。',
    descriptionVi: 'Kéo mạng cáp quang mất 2 - 4 tuần chờ đặt lịch. Cần đăng ký chuyển đường truyền từ 1 tháng trước để có mạng dùng ngay.',
    descriptionEn: 'Fiber installation takes 2-4 weeks. Reserve early to avoid internet blackout at new home.',
    relatedCapabilityId: 'housing.address.change.check',
    deepLink: {
      toolId: 'address-change-checklist-jp',
      labelJa: '住所変更チェックリストを開く',
      labelVi: 'Xem thủ tục đổi địa chỉ',
      labelEn: 'Open Address Change Checklist',
    },
    deadlineRule: {
      anchorKey: 'moveDate',
      offsetDays: 25,
      direction: 'before',
    },
    requiredDocuments: [
      { nameJa: '契約者ID・顧客番号（プロバイダ/回線事業者）', nameVi: 'Mã khách hàng / Hợp đồng nhà mạng Internet', nameEn: 'Subscriber ID / Provider account details' },
    ],
  },
  {
    id: 'task_oversized_trash',
    stageId: 'stage_1_month_prior',
    category: 'packing',
    priority: 'recommended',
    titleJa: '粗大ごみ（不用品・家具家電）の収集予約',
    titleVi: 'Đặt lịch thu gom rác khổ lớn (粗大ごみ)',
    titleEn: 'Oversized trash pickup reservation',
    descriptionJa: '自治体の粗大ごみ収集は予約から回収まで2〜3週間かかります。退去日までに間に合わないと不法投棄トラブルの原因になります。',
    descriptionVi: 'Ủy ban thu gom rác lớn cần đặt trước 2-3 tuần và mua tem rác (粗大ごみ処理券). Đặt trễ sẽ không kịp vứt trước khi trả nhà.',
    descriptionEn: 'Municipal oversized trash collection requires 2-3 weeks advance booking plus fee stickers.',
    deadlineRule: {
      anchorKey: 'moveDate',
      offsetDays: 20,
      direction: 'before',
    },
    requiredDocuments: [
      { nameJa: '粗大ごみ処理券（コンビニ・郵便局で購入）', nameVi: 'Tem thu gom rác lớn mua ở Konbini', nameEn: 'Disposal ticket voucher (purchased at convenience store)' },
    ],
  },

  // Stage 2: 1-2 Weeks Prior
  {
    id: 'task_tenshutsu_todoke',
    stageId: 'stage_1_week_prior',
    category: 'admin',
    priority: 'urgent',
    titleJa: '転出届の提出（マイナポータルまたは役所窓口）',
    titleVi: 'Nộp giấy báo chuyển đi (転出届 - Tenshutsu)',
    titleEn: 'Submit Move-out Notice (Tenshutsu-todoke)',
    descriptionJa: '住民基本台帳法第24条。引越し予定日の概ね14日前から提出可能。マイナンバーカードがあればマイナポータルからオンライン完結可能。',
    descriptionVi: 'Điều 24 Luật Đăng ký Cư trú. Nộp trước ngày chuyển khoảng 14 ngày. Có thẻ My Number có thể nộp online qua MyNaPortal.',
    descriptionEn: 'Basic Resident Registration Act Art. 24. Submittable ~14 days prior. Can be completed online via MyNaPortal with My Number Card.',
    relatedCapabilityId: 'housing.moving.admin.check',
    deepLink: {
      toolId: 'moving-admin-checker-jp',
      labelJa: '役所手続きチェッカーを開く',
      labelVi: 'Kiểm tra thủ tục hành chính chuyển nhà',
      labelEn: 'Open Moving Admin Checker',
    },
    deadlineRule: {
      anchorKey: 'moveDate',
      offsetDays: 14,
      direction: 'before',
    },
    requiredDocuments: [
      { nameJa: 'マイナンバーカード（署名用電子証明書暗証番号）または本人確認書類', nameVi: 'Thẻ My Number (mật khẩu 6-16 ký tự) hoặc giấy tờ tùy thân', nameEn: 'My Number Card (with digital signature PIN) or photo ID' },
    ],
  },
  {
    id: 'task_lifeline_electricity_water',
    stageId: 'stage_1_week_prior',
    category: 'lifeline',
    priority: 'urgent',
    titleJa: '電気・水道の停止・開始手続き',
    titleVi: 'Đăng ký cắt & mở điện, nước tại nhà cũ và nhà mới',
    titleEn: 'Electricity and Water shutoff and setup',
    descriptionJa: '旧居の停止日と新居の使用開始日を各電力・水道会社Webサイトから事前登録。ブレーカーを上げれば即日使用可能。',
    descriptionVi: 'Đăng ký ngày ngừng dùng ở nhà cũ và ngày bắt đầu ở nhà mới qua website. Đến nhà mới chỉ cần gạt aptomat là có điện.',
    descriptionEn: 'Register stop/start dates online with utility providers. Electricity turns on immediately upon flipping the breaker.',
    relatedCapabilityId: 'housing.address.change.check',
    deepLink: {
      toolId: 'address-change-checklist-jp',
      labelJa: '住所変更チェックリストを開く',
      labelVi: 'Xem danh mục thủ tục',
      labelEn: 'Open Address Checklist',
    },
    deadlineRule: {
      anchorKey: 'moveDate',
      offsetDays: 7,
      direction: 'before',
    },
    requiredDocuments: [
      { nameJa: '検針票（お客様番号・供給地点特定番号）', nameVi: 'Phiếu báo chỉ số điện nước (Mã khách hàng)', nameEn: 'Meter inspection slip / Customer account number' },
    ],
  },
  {
    id: 'task_gas_appointment_reservation',
    stageId: 'stage_1_week_prior',
    category: 'lifeline',
    priority: 'urgent',
    titleJa: 'ガスの開栓・閉栓立ち会い予約',
    titleVi: 'Đặt hẹn nhân viên gas đến kiểm tra mở van (Bắt buộc có mặt)',
    titleEn: 'Gas turn-on appointment booking (Mandatory presence)',
    descriptionJa: 'ガス開栓は安全点検・点火確認のため本人の立ち会いが法律上必須です。引越し当日の時間帯枠を1週間前までに確保してください。',
    descriptionVi: 'Mở ga nhà mới bắt buộc có người ở nhà để nhân viên kiểm tra rò rỉ và đánh lửa. Cần hẹn khung giờ từ 1 tuần trước.',
    descriptionEn: 'Gas turn-on legally requires in-person presence for leak and safety inspection. Reserve your time slot at least 1 week early.',
    relatedCapabilityId: 'housing.address.change.check',
    deepLink: {
      toolId: 'address-change-checklist-jp',
      labelJa: 'ライフライン手続きを確認',
      labelVi: 'Xem thủ tục điện nước gas',
      labelEn: 'Review Utility Checklist',
    },
    deadlineRule: {
      anchorKey: 'moveDate',
      offsetDays: 7,
      direction: 'before',
    },
    requiredDocuments: [
      { nameJa: '新居のガスの種類（都市ガス 12A/13A か プロパンガス LPG か）の確認', nameVi: 'Kiểm tra loại gas nhà mới: Gas thành phố (都市ガス) hay Gas bình (プロパン/LPG)', nameEn: 'Gas type confirmation (City gas 12A/13A vs LP Propane gas)' },
    ],
  },
  {
    id: 'task_post_office_e_tenkyo',
    stageId: 'stage_1_week_prior',
    category: 'lifeline',
    priority: 'important',
    titleJa: '郵便局の転居届（e転居）の登録',
    titleVi: 'Đăng ký dịch vụ chuyển tiếp thư tín e-Tenkyo (Bưu điện Nhật Bản)',
    titleEn: 'Japan Post mail forwarding application (e-Tenkyo)',
    descriptionJa: '郵便法第29条に基づく1年間の無料転送サービス。登録から適用開始まで3〜7営業日かかるため、引越し前の登録が鉄則です。',
    descriptionVi: 'Theo Điều 29 Luật Bưu chính, miễn phí chuyển tiếp thư tín trong 1 năm. Mất 3-7 ngày để kích hoạt nên cần đăng ký trước khi chuyển.',
    descriptionEn: 'Postal Act Art. 29 provides 1-year free mail forwarding. Takes 3-7 business days to activate; apply prior to moving.',
    relatedCapabilityId: 'housing.address.change.check',
    deepLink: {
      toolId: 'address-change-checklist-jp',
      labelJa: '郵便手続きを確認',
      labelVi: 'Xem chi tiết e-Tenkyo',
      labelEn: 'Review e-Tenkyo Details',
    },
    deadlineRule: {
      anchorKey: 'moveDate',
      offsetDays: 7,
      direction: 'before',
    },
    requiredDocuments: [
      { nameJa: 'ゆうID / 本人確認書類（マイナンバーカード/運転免許証）', nameVi: 'Tài khoản YuuID / Thẻ My Number hoặc Bằng lái', nameEn: 'Japan Post Yuu ID / Photo ID verification' },
    ],
  },

  // Stage 3: Moving Day
  {
    id: 'task_day_gas_closure_opening',
    stageId: 'stage_day_of_move',
    category: 'lifeline',
    priority: 'urgent',
    titleJa: 'ガスの閉栓（旧居）・開栓立ち会い（新居）',
    titleVi: 'Khóa van ga nhà cũ & Đón thợ gas kiểm tra mở van nhà mới',
    titleEn: 'Gas closing (old home) & In-person opening (new home)',
    descriptionJa: '新居で温水やお風呂を使うため、予約時間帯に立ち会ってガス器具の点火テストと警報器の確認を受けます。',
    descriptionVi: 'Có mặt đón nhân viên gas, kiểm tra bình nóng lạnh, bếp gas để có nước nóng và nấu nướng ngay trong ngày đầu.',
    descriptionEn: 'Be present at the new apartment for gas technician safety checks and water heater testing.',
    deadlineRule: {
      anchorKey: 'moveDate',
      offsetDays: 0,
      direction: 'after',
    },
    requiredDocuments: [
      { nameJa: '認印またはサイン・ガス機器（コンロ等）', nameVi: 'Bút/Chữ ký nhận biên bản & Bếp gas', nameEn: 'Signature / Stamp and connected gas appliances' },
    ],
  },
  {
    id: 'task_old_apartment_handover',
    stageId: 'stage_day_of_move',
    category: 'admin',
    priority: 'urgent',
    titleJa: '旧居の鍵返却・退去立ち会い（原状回復の確認）',
    titleVi: 'Bàn giao chìa khóa & Kiểm tra hiện trạng nhà cũ (敷金清算)',
    titleEn: 'Old apartment handover and inspection (Deposit settlement)',
    descriptionJa: '管理会社・大家立ち会いで傷や汚れの責任範囲を確認。国土交通省「原状回復をめぐるトラブルとガイドライン」を念頭に過剰請求を防ぎます。',
    descriptionVi: 'Cùng ban quản lý kiểm tra phòng, xác nhận vết xước cũ/mới để tránh bị trừ tiền đặt cọc (shikikin) oan.',
    descriptionEn: 'Inspect wear-and-tear with landlord/agency to protect your security deposit according to MLIT guidelines.',
    deadlineRule: {
      anchorKey: 'moveDate',
      offsetDays: 0,
      direction: 'after',
    },
    requiredDocuments: [
      { nameJa: '旧居の全鍵（スペアキー・宅配ボックスカード含む）・印鑑', nameVi: 'Toàn bộ chìa khóa nhà cũ (kể cả chìa phụ, thẻ hòm thư) & Con dấu', nameEn: 'All keys (including duplicate keys/mailbox cards) and seal' },
    ],
  },
  {
    id: 'task_new_apartment_check',
    stageId: 'stage_day_of_move',
    category: 'packing',
    priority: 'important',
    titleJa: '新居の入居前チェック（既存の傷・汚れの写真撮影）',
    titleVi: 'Chụp ảnh hiện trạng nhà mới trước khi kê đồ vào',
    titleEn: 'New apartment pre-move-in condition inspection & photos',
    descriptionJa: '荷物を運び入れる前に、床・壁・水回りの傷や凹みを日付入り写真で撮影。退去時の敷金トラブル防止の決定的な証拠となります。',
    descriptionVi: 'Trước khi khuân đồ vào, chụp ảnh lại các vết trầy xước, ố vàng có sẵn trên sàn và tường để làm bằng chứng khi trả nhà sau này.',
    descriptionEn: 'Take timestamped photos of existing scratches and stains before moving furniture in to safeguard future deposit return.',
    deadlineRule: {
      anchorKey: 'moveDate',
      offsetDays: 0,
      direction: 'after',
    },
    requiredDocuments: [
      { nameJa: 'スマートフォンカメラ / 入居時現況確認書', nameVi: 'Điện thoại chụp ảnh có ngày giờ / Phiếu ghi nhận hiện trạng ban đầu', nameEn: 'Smartphone camera / Initial condition checklist form' },
    ],
  },

  // Stage 4: Within 14 Days Post-Move
  {
    id: 'task_tennyu_todoke',
    stageId: 'stage_within_14_days',
    category: 'admin',
    priority: 'urgent',
    titleJa: '転入届／転居届の提出（法定期限14日以内厳守）',
    titleVi: 'Nộp giấy báo chuyển đến (転入届/転居届 - Trong 14 ngày)',
    titleEn: 'Submit Move-in Notice (Tennyu-todoke within strict 14 days)',
    descriptionJa: '住民基本台帳法第22条・第23条。住み始めた日から14日以内。遅延すると第52条により5万円以下の過料に処される恐れがあります。',
    descriptionVi: 'Điều 22 & 23 Luật Đăng ký Cư trú. Trong vòng 14 ngày từ ngày dọn vào. Chậm trễ có thể bị phạt tới 50.000 yên theo Điều 52.',
    descriptionEn: 'Basic Resident Registration Act Arts. 22-23. Strict 14-day limit. Delay subject to fines up to 50,000 JPY under Art. 52.',
    relatedCapabilityId: 'housing.moving.admin.check',
    deepLink: {
      toolId: 'moving-admin-checker-jp',
      labelJa: '役所手続きチェッカーを開く',
      labelVi: 'Xem hướng dẫn nộp 転入届',
      labelEn: 'Open Moving Admin Checker',
    },
    deadlineRule: {
      anchorKey: 'moveDate',
      offsetDays: 14,
      direction: 'after',
    },
    requiredDocuments: [
      { nameJa: '転出証明書（紙）またはマイナンバーカード', nameVi: 'Giấy chứng nhận chuyển đi (bản giấy) hoặc Thẻ My Number', nameEn: 'Move-out certificate (paper) or My Number Card' },
      { nameJa: '世帯全員の本人確認書類（在留カード・パスポート等）', nameVi: 'Giấy tờ tùy thân tất cả thành viên (Thẻ ngoại kiều, Hộ chiếu)', nameEn: 'Photo ID for all household members (Residence cards, passports)' },
    ],
  },
  {
    id: 'task_myna_card_continuation',
    stageId: 'stage_within_14_days',
    category: 'admin',
    priority: 'urgent',
    titleJa: 'マイナンバーカードの継続利用・券面更新手続き',
    titleVi: 'Cập nhật địa chỉ & Kích hoạt tiếp tục sử dụng Thẻ My Number',
    titleEn: 'My Number Card address update and continued use procedure',
    descriptionJa: '転入届と同時に手続き必須。転入届出から90日以内に継続利用処理を行わないとカードが失効し再発行手数料が発生します。署名用電子証明書の再発行も必要。',
    descriptionVi: 'Làm cùng lúc khi nộp 転入届. Nếu không cập nhật trong 90 ngày, thẻ sẽ bị vô hiệu hóa và mất phí làm lại. Cần tạo lại chữ ký điện tử.',
    descriptionEn: 'Must process alongside Tennyu. Unprocessed cards expire after 90 days requiring reissuance fees. Digital certificate must be reissued.',
    relatedCapabilityId: 'housing.moving.admin.check',
    deepLink: {
      toolId: 'moving-admin-checker-jp',
      labelJa: 'マイナンバー継続利用の詳細',
      labelVi: 'Xem chi tiết thủ tục My Number',
      labelEn: 'My Number Procedures Guide',
    },
    deadlineRule: {
      anchorKey: 'moveDate',
      offsetDays: 14,
      direction: 'after',
    },
    requiredDocuments: [
      { nameJa: '世帯全員のマイナンバーカード（数字4桁暗証番号および英数字6〜16桁暗証番号）', nameVi: 'Thẻ My Number của mọi người trong nhà (mật khẩu 4 số và mật khẩu chữ 6-16 số)', nameEn: 'My Number Cards for all members (4-digit PIN and 6-16 alphanumeric signature PIN)' },
    ],
  },
  {
    id: 'task_zairyu_card_endorsement',
    stageId: 'stage_within_14_days',
    category: 'admin',
    priority: 'urgent',
    titleJa: '在留カードの住居地届出・裏面記載（外国籍の方）',
    titleVi: 'Đăng ký địa chỉ mới lên mặt sau Thẻ ngoại kiều (Người nước ngoài)',
    titleEn: 'Residence Card (Zairyu) address registration & endorsement',
    descriptionJa: '出入国管理法第19条の9。新住居地に移転後14日以内に役所窓口へ届出必須。正当な理由なく90日以上届出を怠ると在留資格取消の対象となります。',
    descriptionVi: 'Điều 19-9 Luật Quản lý Xuất nhập cảnh. Phải trình thẻ tại ủy ban trong 14 ngày để in địa chỉ mới vào mặt sau. Quá 90 ngày có thể bị tước visa.',
    descriptionEn: 'Immigration Control Act Art. 19-9. Mandatory 14-day limit. Failure to register within 90 days without valid reason can trigger visa revocation.',
    relatedCapabilityId: 'housing.moving.admin.check',
    deepLink: {
      toolId: 'moving-admin-checker-jp',
      labelJa: '在留カード手続きを確認',
      labelVi: 'Xem thủ tục Thẻ ngoại kiều',
      labelEn: 'Review Zairyu Card Guide',
    },
    deadlineRule: {
      anchorKey: 'moveDate',
      offsetDays: 14,
      direction: 'after',
    },
    requiredDocuments: [
      { nameJa: '在留カード（原本）', nameVi: 'Thẻ ngoại kiều (bản gốc)', nameEn: 'Residence Card (Original)' },
    ],
  },
  {
    id: 'task_child_allowance_15day',
    stageId: 'stage_within_14_days',
    category: 'family',
    priority: 'urgent',
    titleJa: '児童手当の認定請求（引越し後15日以内厳守・15日特例）',
    titleVi: 'Nộp đơn xin Trợ cấp trẻ em tại quận mới (Quy tắc đặc lệ 15 ngày)',
    titleEn: 'Child Allowance new application (Strict 15-Day Rule)',
    descriptionJa: '児童手当法第8条。月末引越し等の場合でも、引越し日の翌日から15日以内に申請すれば引越し月からの支給が継続されます。1日でも遅れると1ヶ月分支給が消滅します！',
    descriptionVi: 'Điều 8 Luật Trợ cấp Trẻ em. Phải nộp trong vòng 15 ngày kể từ ngày hôm sau ngày chuyển. Trễ 1 ngày sẽ bị mất đứt 1 tháng tiền trợ cấp!',
    descriptionEn: 'Child Allowance Act Art. 8. Must file within 15 days of move date under the 15-day exception, otherwise 1 full month of benefits is forfeited forever!',
    relatedCapabilityId: 'family.childAllowance.calculate',
    deepLink: {
      toolId: 'child-allowance-jp',
      labelJa: '児童手当シミュレーターを開く',
      labelVi: 'Tính tiền trợ cấp trẻ em',
      labelEn: 'Open Child Allowance Calculator',
    },
    deadlineRule: {
      anchorKey: 'moveDate',
      offsetDays: 15,
      direction: 'after',
    },
    requiredDocuments: [
      { nameJa: '請求者の健康保険証の写し・振込先口座情報・マイナンバー', nameVi: 'Bản photo thẻ BHYT của người nhận, số tài khoản ngân hàng, mã My Number', nameEn: 'Health insurance card copy of claimant, bank account info, My Number' },
    ],
  },
  {
    id: 'task_driver_license_address',
    stageId: 'stage_within_14_days',
    category: 'lifeline',
    priority: 'important',
    titleJa: '運転免許証の住所変更（警察署・運転免許センター）',
    titleVi: 'Đổi địa chỉ bằng lái xe (Tại Đồn cảnh sát / Trung tâm sát hạch)',
    titleEn: 'Driver license address change (Police station / Center)',
    descriptionJa: '道路交通法第94条「速やかに届け出なければならない」。新住所記載の住民票を持参し裏面に新住所の押印・印字を受けます。最も確実な身分証となります。',
    descriptionVi: 'Điều 94 Luật Giao thông Đường bộ. Mang phiếu Juminhyo có địa chỉ mới đến đồn cảnh sát để đóng dấu địa chỉ mới vào mặt sau.',
    descriptionEn: 'Road Traffic Act Art. 94 requires prompt update. Bring your updated Juminhyo resident record to the local police station.',
    relatedCapabilityId: 'housing.address.change.check',
    deepLink: {
      toolId: 'address-change-checklist-jp',
      labelJa: '免許証手続きを確認',
      labelVi: 'Xem thủ tục đổi bằng lái',
      labelEn: 'Review Driver License Guide',
    },
    deadlineRule: {
      anchorKey: 'moveDate',
      offsetDays: 14,
      direction: 'after',
    },
    requiredDocuments: [
      { nameJa: '運転免許証・新住所が記載された住民票（マイナンバー記載なし）またはマイナンバーカード', nameVi: 'Bằng lái xe & Phiếu cư trú Juminhyo có địa chỉ mới (hoặc Thẻ My Number)', nameEn: 'Driver License & Resident Record (Juminhyo) showing new address' },
    ],
  },

  // Stage 5: Settling In (Post-Move)
  {
    id: 'task_vehicle_inspection_address',
    stageId: 'stage_post_move',
    category: 'lifeline',
    priority: 'important',
    titleJa: '自動車・バイクの車検証の変更登録（管轄運輸支局・軽自動車検査協会）',
    titleVi: 'Đổi địa chỉ trên Giấy đăng kiểm xe ô tô/xe máy (Trong 15 ngày)',
    titleEn: 'Vehicle Inspection Certificate (Shakensho) address update (Within 15 days)',
    descriptionJa: '道路運送車両法第12条。住所変更から15日以内に運輸支局へ変更登録を申請。自動車税納付書の送付先やナンバープレート変更に関わります。',
    descriptionVi: 'Điều 12 Luật Phương tiện Vận tải Đường bộ. Trong vòng 15 ngày phải làm thủ tục tại Cục Đăng kiểm. Có thể phải đổi biển số xe nếu khác tỉnh.',
    descriptionEn: 'Road Transport Vehicle Act Art. 12 mandates update within 15 days at Land Transport Bureau. Number plate may change across jurisdictions.',
    relatedCapabilityId: 'housing.address.change.check',
    deepLink: {
      toolId: 'address-change-checklist-jp',
      labelJa: '車検証手続きを確認',
      labelVi: 'Xem thủ tục xe cộ',
      labelEn: 'Review Vehicle Guide',
    },
    deadlineRule: {
      anchorKey: 'moveDate',
      offsetDays: 15,
      direction: 'after',
    },
    requiredDocuments: [
      { nameJa: '自動車検査証（車検証）・新住所の住民票・車庫証明書（自動車保管場所証明書）', nameVi: 'Giấy đăng kiểm xe (車検証), Phiếu cư trú mới, Giấy chứng nhận chỗ đỗ xe (車庫証明)', nameEn: 'Vehicle inspection certificate, new Juminhyo, garage certificate' },
    ],
  },
  {
    id: 'task_bicycle_crime_prevention',
    stageId: 'stage_post_move',
    category: 'lifeline',
    priority: 'recommended',
    titleJa: '自転車防犯登録の変更・再登録',
    titleVi: 'Đổi địa chỉ đăng ký chống trộm xe đạp (自転車防犯登録)',
    titleEn: 'Bicycle crime prevention registration update',
    descriptionJa: '自転車防犯登録は都道府県警察単位で管理されています。他県へ引越した場合は旧登録を抹消し新県で新規登録（防犯登録料約600〜700円）が必要です。',
    descriptionVi: 'Hệ thống chống trộm xe đạp quản lý theo từng tỉnh. Nếu chuyển sang tỉnh khác, cần hủy đăng ký cũ và đăng ký mới (phí khoảng 600-700 yên).',
    descriptionEn: 'Managed by prefectural police. If moving to another prefecture, cancel old registration and register anew at a local bicycle shop (~600-700 JPY).',
    relatedCapabilityId: 'housing.address.change.check',
    deepLink: {
      toolId: 'address-change-checklist-jp',
      labelJa: '自転車防犯登録の手続きを確認',
      labelVi: 'Xem thủ tục xe đạp',
      labelEn: 'Review Bicycle Guide',
    },
    deadlineRule: {
      anchorKey: 'moveDate',
      offsetDays: 20,
      direction: 'after',
    },
    requiredDocuments: [
      { nameJa: '自転車本体・防犯登録甲カード（お客様控）または保証書・身分証', nameVi: 'Xe đạp, phiếu đăng ký gốc (khách giữ) hoặc sổ bảo hành, giấy tờ tùy thân', nameEn: 'Bicycle, registration receipt slip or warranty card, photo ID' },
    ],
  },
  {
    id: 'task_banks_and_credit_cards',
    stageId: 'stage_post_move',
    category: 'finance',
    priority: 'important',
    titleJa: '銀行口座・クレジットカード・ネット通販の住所変更',
    titleVi: 'Đổi địa chỉ tài khoản ngân hàng, thẻ tín dụng & sàn thương mại điện tử',
    titleEn: 'Banks, credit cards & e-commerce address changes',
    descriptionJa: '重要書類や更新カードの返送事故を防ぐため、オンラインバンキングやカード会員アプリから住所を変更。Amazon等の配送先住所も更新。',
    descriptionVi: 'Cập nhật qua app ngân hàng và thẻ để tránh bị trả lại thẻ mới khi hết hạn. Cập nhật ngay địa chỉ mặc định trên Amazon, Rakuten.',
    descriptionEn: 'Update via mobile banking apps to ensure replacement cards reach you. Update default shipping on Amazon and Rakuten.',
    relatedCapabilityId: 'housing.address.change.check',
    deepLink: {
      toolId: 'address-change-checklist-jp',
      labelJa: '銀行・カード住所変更を確認',
      labelVi: 'Xem danh sách tài chính',
      labelEn: 'Review Financial Checklist',
    },
    deadlineRule: {
      anchorKey: 'moveDate',
      offsetDays: 20,
      direction: 'after',
    },
    requiredDocuments: [
      { nameJa: 'ワンタイムパスワード・オンライン認証・新住所確認書類', nameVi: 'OTP ngân hàng, xác thực bảo mật, ảnh giấy tờ địa chỉ mới', nameEn: 'One-time passwords, mobile auth, verification docs' },
    ],
  },
];

/**
 * Định nghĩa chuẩn cho sự kiện Chuyển nhà tại Nhật Bản
 * @type {import('../../../life-events/types/lifeEventTypes.js').LifeEventDefinition}
 */
export const movingWizardDefinition = {
  id: 'moving',
  country: 'JP',
  domain: 'housing',
  title: {
    ja: '引越し手続きガイド＆オーケストレーター',
    vi: 'Lộ trình & Thủ tục Chuyển nhà tại Nhật Bản',
    en: 'Japan Moving Guide & Orchestrator',
  },
  stages: MOVING_STAGES,
  sources: MOVING_WIZARD_SOURCES,
  capabilities: [
    'housing.moving.cost.calculate',
    'housing.moving.admin.check',
    'housing.address.change.check',
    'family.childAllowance.calculate',
  ],

  /**
   * Sinh danh mục việc cần làm (Checklist) cá nhân hóa theo ngữ cảnh
   * @param {Object} context
   * @param {string} [context.moveDate]
   * @param {string} [context.movingType] 'different_municipality' | 'same_municipality'
   * @param {boolean} [context.hasMyNumberCard]
   * @param {boolean} [context.hasVehicle]
   * @param {boolean} [context.hasChildren]
   * @param {boolean} [context.hasFixedInternet]
   * @param {boolean} [context.isForeignResident]
   * @param {Object} [options]
   * @returns {Array<Object>}
   */
  evaluateChecklist(context = {}, options = {}) {
    const movingType = context.movingType || 'different_municipality';
    const isSameMunicipality = movingType === 'same_municipality';
    const hasMyNumberCard = Boolean(context.hasMyNumberCard);
    const hasVehicle = Boolean(context.hasVehicle);
    const hasChildren = Boolean(context.hasChildren);
    const hasFixedInternet = context.hasFixedInternet !== false;
    const isForeignResident = context.isForeignResident !== false;

    return MOVING_ACTION_ITEMS.map((rawItem) => {
      const item = { ...rawItem };
      item.stage = item.stageId;
      let isApplicable = true;
      let customNoteJa = '';
      let customNoteVi = '';
      let customNoteEn = '';

      // Tùy biến theo ngữ cảnh
      if (item.id === 'task_tenshutsu_todoke') {
        if (isSameMunicipality) {
          isApplicable = false;
          customNoteJa = '同一市区町村内の引越しの場合は転出届は不要です（引越し後に「転居届」のみ提出）。';
          customNoteVi = 'Chuyển nhà trong cùng một quận/thị xã không cần nộp giấy chuyển đi (chỉ cần nộp Giấy chuyển chỗ ở 転居届 sau khi dọn).';
          customNoteEn = 'Not required when moving within the same municipality (only submit Tenkyo-todoke after moving).';
        } else if (hasMyNumberCard) {
          customNoteJa = 'マイナンバーカードをお持ちのため、マイナポータルからオンラインで転出届を完結できます（役所窓口への来庁不要）。';
          customNoteVi = 'Có thẻ My Number: Làm thủ tục 転出届 trực tuyến trên MyNaPortal, không cần đến ủy ban cũ.';
          customNoteEn = 'With My Number Card, you can submit Tenshutsu online via MyNaPortal without visiting former city hall.';
        }
      } else if (item.id === 'task_tennyu_todoke') {
        if (isSameMunicipality) {
          item.titleJa = '転居届の提出（同一市区町村内・14日以内厳守）';
          item.titleVi = 'Nộp giấy báo chuyển chỗ ở (転居届 - Cùng quận trong 14 ngày)';
          item.titleEn = 'Submit Intra-City Move Notice (Tenkyo-todoke within 14 days)';
          customNoteJa = '同一市区町村内での引越しの届出です。住民基本台帳法第23条。';
          customNoteVi = 'Thủ tục báo chuyển địa chỉ trong cùng quận theo Điều 23 Luật Đăng ký Cư trú.';
          customNoteEn = 'Notice of moving within the same municipality under Art. 23.';
        }
      } else if (item.id === 'task_child_allowance_15day') {
        if (!hasChildren) {
          isApplicable = false;
        } else if (isSameMunicipality) {
          customNoteJa = '同一市区町村内のため、転居届提出時に住所変更のみ処理され、受給資格の新規認定請求は不要です。';
          customNoteVi = 'Chuyển trong cùng quận: Tiền trợ cấp tự động chuyển địa chỉ theo hộ khẩu, không phải làm lại đơn xin mới.';
          customNoteEn = 'Same municipality: Allowance continues automatically; new certification claim is not required.';
        }
      } else if (item.id === 'task_driver_license_address') {
        if (!hasVehicle && context.hasDriverLicense === false) {
          isApplicable = false;
        }
      } else if (item.id === 'task_vehicle_inspection_address') {
        if (!hasVehicle) {
          isApplicable = false;
        }
      } else if (item.id === 'task_internet_optical_line') {
        if (!hasFixedInternet) {
          isApplicable = false;
        }
      } else if (item.id === 'task_zairyu_card_endorsement') {
        if (!isForeignResident) {
          isApplicable = false;
        }
      }

      return {
        ...item,
        isApplicable,
        customNoteJa,
        customNoteVi,
        customNoteEn,
      };
    });
  },
};

/**
 * Thực thể Life Event Runtime của Sự kiện Chuyển nhà
 */
export const movingWizardRuntime = createLifeEventRuntime(movingWizardDefinition);

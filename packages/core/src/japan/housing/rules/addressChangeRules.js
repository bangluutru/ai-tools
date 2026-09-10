/**
 * @file packages/core/src/japan/housing/rules/addressChangeRules.js
 * @description
 * Quy định và danh mục thủ tục đổi địa chỉ đa kênh tại Nhật Bản:
 * - Bưu điện Nhật Bản (日本郵便 e転居 - 郵便法第29条): Dịch vụ chuyển tiếp thư tín 1 năm miễn phí
 * - Hạ tầng đời sống (Lifelines: Điện, Khí đốt 都市ガス/LPガス, Nước, Internet cáp quang)
 * - Tài chính & Giấy tờ (Bằng lái xe 道路交通法第94条, Ngân hàng, Thẻ tín dụng, Di động, Xe máy/Ô tô)
 */

export const ADDRESS_CHANGE_SOURCES = [
  'japan-post-transfer-service',
  'soumu-resident-basic-book-act',
];

/**
 * Phân loại danh mục dịch vụ đổi địa chỉ
 */
export const ADDRESS_CHANGE_CATEGORIES = Object.freeze({
  POSTAL: {
    id: 'postal',
    nameJa: '郵便・配送転送',
    nameVi: 'Bưu điện & Chuyển tiếp thư từ',
    nameEn: 'Postal & Mail Forwarding',
    color: '#ef4444',
  },
  LIFELINE: {
    id: 'lifeline',
    nameJa: 'ライフライン（電気・ガス・水道・通信）',
    nameVi: 'Hạ tầng thiết yếu (Điện, Ga, Nước, Mạng)',
    nameEn: 'Lifelines (Electricity, Gas, Water, Internet)',
    color: '#06b6d4',
  },
  FINANCIAL: {
    id: 'financial',
    nameJa: '金融・カード・通信キャリア',
    nameVi: 'Ngân hàng, Thẻ tín dụng & Điện thoại',
    nameEn: 'Banks, Credit Cards & Telecom',
    color: '#10b981',
  },
  IDENTIFICATION: {
    id: 'identification',
    nameJa: '身分証明書・公的登録',
    nameVi: 'Giấy tờ tùy thân & Đăng ký pháp lý',
    nameEn: 'Identity & Official Registrations',
    color: '#3b82f6',
  },
  VEHICLE: {
    id: 'vehicle',
    nameJa: '自動車・バイク・自転車',
    nameVi: 'Phương tiện (Ô tô, Xe máy, Xe đạp)',
    nameEn: 'Vehicles, Motorcycles & Bicycles',
    color: '#8b5cf6',
  },
  SUBSCRIPTION: {
    id: 'subscription',
    nameJa: 'EC・定期購入・サブスクリプション',
    nameVi: 'Mua sắm trực tuyến & Dịch vụ số',
    nameEn: 'E-Commerce & Subscriptions',
    color: '#f59e0b',
  },
});

/**
 * Các mốc thời gian thực hiện (Timing Bands)
 */
export const TIMING_BANDS = Object.freeze({
  ONE_MONTH_PRIOR: {
    id: '1_month_prior',
    labelJa: '引越し1ヶ月前〜2週間前',
    labelVi: '1 tháng đến 2 tuần trước khi chuyển',
    labelEn: '1 Month to 2 Weeks Prior',
    order: 1,
  },
  ONE_WEEK_PRIOR: {
    id: '1_week_prior',
    labelJa: '引越し1週間前〜数日前',
    labelVi: '1 tuần trước đến vài ngày trước khi chuyển',
    labelEn: '1 Week to a Few Days Prior',
    order: 2,
  },
  DAY_OF_MOVE: {
    id: 'day_of_move',
    labelJa: '引越し当日',
    labelVi: 'Ngày dọn nhà',
    labelEn: 'Day of Move',
    order: 3,
  },
  WITHIN_14_DAYS: {
    id: 'within_14_days',
    labelJa: '引越し後 14日以内',
    labelVi: 'Trong vòng 14 ngày sau khi chuyển',
    labelEn: 'Within 14 Days After Move',
    order: 4,
  },
  POST_MOVE: {
    id: 'post_move',
    labelJa: '引越し後 落ち着いてから（随時）',
    labelVi: 'Sau khi ổn định chỗ ở (Càng sớm càng tốt)',
    labelEn: 'Post-Move (As Soon As Convenient)',
    order: 5,
  },
});

/**
 * Master Checklist thủ tục đổi địa chỉ Nhật Bản
 */
export const ADDRESS_CHANGE_ITEMS_MASTER = [
  // ==========================================
  // 1. POSTAL (BƯU ĐIỆN)
  // ==========================================
  {
    id: 'japan_post_e_tenkyo',
    categoryId: 'postal',
    timingBandId: '1_week_prior',
    titleJa: '日本郵便「e転居」郵便物転送届の申し込み',
    titleVi: 'Đăng ký chuyển tiếp thư tín e-Tenkyo tại Bưu điện Nhật Bản',
    titleEn: 'Apply for Japan Post 1-Year Mail Forwarding (e-Tenkyo)',
    descJa: '旧住所宛ての郵便物を新住所へ1年間無料で転送します。反映までに3〜7営業日要するため、引越しの1週間前までに手続きを済ませてください。',
    descVi: 'Chuyển tiếp miễn phí toàn bộ thư tín gửi đến địa chỉ cũ sang địa chỉ mới trong vòng 1 năm. Thủ tục mất từ 3-7 ngày làm việc để có hiệu lực nên cần đăng ký trước 1-2 tuần.',
    descEn: 'Free mail forwarding from old to new address for 1 calendar year. Takes 3-7 business days to activate; submit at least 1 week in advance.',
    method: 'online_or_window',
    methodLabelJa: 'オンライン（スマホ）または郵便局窓口',
    methodLabelVi: 'Online trên điện thoại hoặc tại bưu điện',
    methodLabelEn: 'Online (Smartphone) or Post Office Window',
    requiresPresence: false,
    url: 'https://welcometown.post.japanpost.jp/etn/',
    isCritical: true,
  },

  // ==========================================
  // 2. LIFELINES (ĐIỆN, GA, NƯỚC, INTERNET)
  // ==========================================
  {
    id: 'electricity_change',
    categoryId: 'lifeline',
    timingBandId: '1_week_prior',
    titleJa: '電気の使用停止（旧居）＆ 開始手続き（新居）',
    titleVi: 'Cắt điện nhà cũ & Đăng ký cấp điện nhà mới',
    titleEn: 'Electricity Disconnection & Reconnection Setup',
    descJa: '電力会社のマイページまたは電話で旧居の停止日と新居の開始日を指定します。スマートメーターの場合立ち会いは不要です。',
    descVi: 'Liên hệ công ty điện lực báo ngày ngừng cấp điện nhà cũ và ngày bắt đầu đóng điện nhà mới. Đồng hồ điện thông minh (Smart meter) không cần người ở nhà.',
    descEn: 'Schedule disconnection at old residence and connection at new home online. Smart meters do not require in-person presence.',
    method: 'online',
    methodLabelJa: '電力会社Webサイト（24時間受付）',
    methodLabelVi: 'Website công ty điện lực (Online 24/7)',
    methodLabelEn: 'Utility Provider Website',
    requiresPresence: false,
    isCritical: true,
  },
  {
    id: 'gas_valve_opening',
    categoryId: 'lifeline',
    timingBandId: '1_week_prior',
    titleJa: 'ガスの閉栓（旧居）＆ 開栓立ち会い予約（新居）',
    titleVi: 'Khóa ga nhà cũ & Đặt hẹn CÔNG CHỨC GA ĐẾN MỞ VAN NHÀ MỚI (Bắt buộc có mặt)',
    titleEn: 'Gas Disconnection & MANDATORY In-Person Valve Opening Inspection',
    descJa: '【重要】新居でのガス開栓・点火確認は法律に基づき必ず契約者または代理人の「立ち会い（立会）」が必要です。繁忙期は予約が埋まるため2週間前の確保を推奨します。',
    descVi: '【Cực kỳ quan trọng】Mở van ga tại nhà mới BẮT BUỘC PHẢI CÓ NGƯỜI Ở NHÀ ĐÓN NHÂN VIÊN GA đến kiểm tra an toàn rò rỉ và đánh lửa. Mùa chuyển nhà cần đặt hẹn trước 1-2 tuần.',
    descEn: '[CRITICAL] Gas valve opening and burner safety inspection at the new home legally requires in-person presence. Book your appointment 1-2 weeks in advance.',
    method: 'online_or_phone',
    methodLabelJa: 'ガス会社Web予約 / 電話',
    methodLabelVi: 'Web công ty ga hoặc gọi điện thoại',
    methodLabelEn: 'Gas Provider Portal / Phone',
    requiresPresence: true, // BẮT BUỘC CÓ MẶT
    isCritical: true,
  },
  {
    id: 'water_change',
    categoryId: 'lifeline',
    timingBandId: '1_week_prior',
    titleJa: '水道の使用停止（旧居）＆ 開栓手続き（新居）',
    titleVi: 'Báo cắt nước nhà cũ & Mở nước nhà mới',
    titleEn: 'Water Service Discontinuation & Activation',
    descJa: '管轄の自治体水道局へ引越し日を連絡します。多くの自治体でWeb申請に対応しており、立ち会いは原則不要です。',
    descVi: 'Liên hệ Cục cấp nước quận/thành phố (Suidokyoku) để chốt số nước nhà cũ và mở nước nhà mới. Hầu hết không cần có mặt trực tiếp.',
    descEn: 'Contact municipal water bureau online. In-person presence is usually not required.',
    method: 'online',
    methodLabelJa: '自治体水道局Web窓口',
    methodLabelVi: 'Cổng trực tuyến Cục Cấp nước Thành phố',
    methodLabelEn: 'Municipal Water Bureau Portal',
    requiresPresence: false,
    isCritical: true,
  },
  {
    id: 'internet_fiber_transfer',
    categoryId: 'lifeline',
    timingBandId: '1_month_prior',
    titleJa: '固定光回線（インターネット）の移転・開通工事予約',
    titleVi: 'Dời đường truyền mạng cáp quang / Hẹn ngày thợ đến kéo mạng mới',
    titleEn: 'Fiber Optic Broadband Transfer & Installation Booking',
    descJa: '【所要期間に注意】光回線の撤去・新設工事は予約完了から開通まで通常2〜4週間、繁忙期（3〜4月）は1〜2ヶ月待ちとなる場合があります。直ちにプロバイダへ連絡してください。',
    descVi: '【Chú ý thời gian chờ】Đăng ký kéo mạng cáp quang mới mất từ 2 đến 4 tuần, riêng đợt cao điểm tháng 3-4 có thể phải chờ 1-2 tháng mới có lịch thợ đến lắp. Cần làm ngay 1 tháng trước khi chuyển.',
    descEn: 'Fiber optic installation takes 2-4 weeks (up to 1-2 months during March/April peak season). Request broadband transfer at least 1 month in advance.',
    method: 'online_or_phone',
    methodLabelJa: 'プロバイダ・光回線事業者',
    methodLabelVi: 'Nhà mạng viễn thông (NTT, SoftBank, KDDI, etc.)',
    methodLabelEn: 'ISP / Telecom Carrier Portal',
    requiresPresence: true,
    condition: 'has_fiber_internet',
    isCritical: true,
  },

  // ==========================================
  // 3. IDENTIFICATION (GIẤY TỜ TÙY THÂN)
  // ==========================================
  {
    id: 'drivers_license_address_change',
    categoryId: 'identification',
    timingBandId: 'within_14_days',
    titleJa: '運転免許証の記載事項変更（新住所の裏書き）',
    titleVi: 'Đổi địa chỉ bằng lái xe (In địa chỉ mới vào mặt sau bằng lái)',
    titleEn: 'Driver\'s License Address Update (Endorsement)',
    descJa: '新住所を管轄する警察署または運転免許更新センターへ行き、裏面に新住所を記載してもらいます。住民票またはマイナンバーカードを持参してください（道路交通法第94条）。',
    descVi: 'Mang bằng lái cùng Giấy chứng nhận cư trú (Juminhyo) hoặc thẻ My Number ra Đồn Cảnh Sát (Keisatsusho) khu vực mới để cảnh sát in địa chỉ mới vào mặt sau bằng.',
    descEn: 'Visit the local police station or Driver License Center with your new Resident Record (Juminhyo) or My Number Card. Required under Road Traffic Act Art. 94.',
    method: 'window',
    methodLabelJa: '新住所の警察署 交通課 または 免許更新センター',
    methodLabelVi: 'Phòng CSGT Đồn Cảnh Sát hoặc Trung tâm Bằng Lái',
    methodLabelEn: 'Local Police Station / Driver License Center',
    requiresPresence: true,
    condition: 'has_drivers_license',
    isCritical: true,
  },
  {
    id: 'my_number_card_continuation',
    categoryId: 'identification',
    timingBandId: 'within_14_days',
    titleJa: 'マイナンバーカードの継続利用・券面更新（暗証番号入力）',
    titleVi: 'Gia hạn chip & In địa chỉ mới lên thẻ My Number (nhập mã PIN tại Ủy ban)',
    titleEn: 'My Number Card Continuous Use & Chip Address Update',
    descJa: '新住所の役所窓口で転入・転居届を出す際に、暗証番号（数字4桁＋英数字6〜16桁）を入力してカード内の住所チップと券面を書き換えます。90日放置で失効します。',
    descVi: 'Làm đồng thời khi nộp giấy chuyển đến tại quầy ủy ban. Nhập mã PIN 4 số và PIN 6-16 ký tự để công chức nạp địa chỉ mới vào chip và in lên mặt trước thẻ. Quá 90 ngày thẻ sẽ bị hủy.',
    descEn: 'Completed at the municipal office counter when submitting move-in notification. Enter your PINs to update the chip and card face. Expires if left unrenewed after 90 days.',
    method: 'window',
    methodLabelJa: '市区町村役所 住民課窓口',
    methodLabelVi: 'Quầy quản lý cư dân Ủy ban Nhân dân',
    methodLabelEn: 'City Hall Resident Services Counter',
    requiresPresence: true,
    condition: 'has_my_number_card',
    isCritical: true,
  },

  // ==========================================
  // 4. FINANCIAL (NGÂN HÀNG, THẺ, DI ĐỘNG)
  // ==========================================
  {
    id: 'bank_account_address_change',
    categoryId: 'financial',
    timingBandId: 'within_14_days',
    titleJa: '銀行口座・ゆうちょ銀行の住所変更',
    titleVi: 'Cập nhật địa chỉ tài khoản ngân hàng & Yucho Ginko',
    titleEn: 'Bank Account & Japan Post Bank Address Update',
    descJa: '重要書類やキャッシュカード更新時の未着返送を防ぐため、ネットバンキングアプリ等で速やかに住所を変更してください。',
    descVi: 'Cập nhật qua app ngân hàng online để tránh trường hợp thẻ ngân hàng mới gửi thư bảo đảm bị trả về do không khớp địa chỉ.',
    descEn: 'Update via your mobile banking app to prevent new bank cards or statements from being returned as undeliverable.',
    method: 'online',
    methodLabelJa: '各行インターネットバンキング / スマホアプリ',
    methodLabelVi: 'App Internet Banking của ngân hàng',
    methodLabelEn: 'Mobile Banking App / Online Portal',
    requiresPresence: false,
    isCritical: false,
  },
  {
    id: 'credit_card_address_change',
    categoryId: 'financial',
    timingBandId: 'within_14_days',
    titleJa: 'クレジットカードの登録住所変更',
    titleVi: 'Đổi địa chỉ thanh toán thẻ tín dụng (Credit Card)',
    titleEn: 'Credit Card Billing Address Update',
    descJa: 'カード会社Webサイト（会員専用マイページ）で請求先住所を変更します。更新カードの送付先となるため重要です。',
    descVi: 'Đổi địa chỉ trên web/app của công ty thẻ tín dụng (Rakuten, SMBC, JCB, Epos...). Thẻ gia hạn định kỳ sẽ được gửi về địa chỉ này.',
    descEn: 'Update billing address in the cardholder member portal to ensure renewal cards are delivered to the correct address.',
    method: 'online',
    methodLabelJa: '各カード会社 会員マイページ（Web/アプリ）',
    methodLabelVi: 'Cổng thành viên công ty thẻ tín dụng',
    methodLabelEn: 'Credit Card Member Portal',
    requiresPresence: false,
    isCritical: false,
  },
  {
    id: 'mobile_carrier_address_change',
    categoryId: 'financial',
    timingBandId: 'within_14_days',
    titleJa: '携帯電話・スマートフォン契約の住所変更',
    titleVi: 'Đổi địa chỉ hợp đồng nhà mạng di động (docomo, au, SoftBank, Rakuten)',
    titleEn: 'Mobile Phone Subscription Address Update',
    descJa: '各キャリアのマイページ（My docomo, My au, My SoftBank, my 楽天モバイル等）からオンラインで数分で完了します。',
    descVi: 'Đổi địa chỉ online trong 3 phút qua tài khoản nhà mạng (My docomo, My au, My SoftBank, my Rakuten Mobile, UQ, Y!mobile...).',
    descEn: 'Completed online within minutes via your carrier customer portal.',
    method: 'online',
    methodLabelJa: '各キャリア マイページ（Web/アプリ）',
    methodLabelVi: 'App quản lý sim nhà mạng di động',
    methodLabelEn: 'Mobile Carrier Account Portal',
    requiresPresence: false,
    isCritical: false,
  },

  // ==========================================
  // 5. VEHICLE (PHƯƠNG TIỆN GIAO THÔNG)
  // ==========================================
  {
    id: 'vehicle_inspection_cert_change',
    categoryId: 'vehicle',
    timingBandId: 'within_14_days',
    titleJa: '自動車・軽自動車・バイクの車検証住所変更＆車庫証明',
    titleVi: 'Đổi địa chỉ Giấy chứng nhận đăng kiểm xe (車検証) & Giấy xác nhận chỗ đậu xe (Shako Shomei)',
    titleEn: 'Vehicle Inspection Certificate & Parking Space Certificate (Shako Shomei)',
    descJa: '道路運送車両法第12条により、住所変更から15日以内の手続きが義務付けられています。普通自動車は運輸支局、軽自動車は軽自動車検査協会で行います。',
    descVi: 'Theo Luật Phương tiện Vận tải đường bộ: Phải đổi địa chỉ đăng ký xe trong vòng 15 ngày. Xe biển trắng làm tại Cục Vận tải (Unyu Shikyoku), xe biển vàng làm tại Hiệp hội Kiểm định Xe nhẹ.',
    descEn: 'Required within 15 days under Road Transport Vehicle Act Art. 12. Standard cars at Transport Branch Office; Kei cars at Light Motor Vehicle Inspection Organization.',
    method: 'window',
    methodLabelJa: '運輸支局 または 軽自動車検査協会',
    methodLabelVi: 'Cục Vận tải đường bộ hoặc Hiệp hội Đăng kiểm Xe nhẹ',
    methodLabelEn: 'Transport Bureau / Kei Car Inspection Association',
    requiresPresence: true,
    condition: 'has_vehicle',
    isCritical: true,
  },
  {
    id: 'bicycle_theft_prevention_registration',
    categoryId: 'vehicle',
    timingBandId: 'post_move',
    titleJa: '自転車の防犯登録 住所変更または再登録',
    titleVi: 'Cập nhật địa chỉ đăng ký phòng chống trộm cắp xe đạp (Bouhan Toroku)',
    titleEn: 'Bicycle Crime Prevention Anti-Theft Registration Update',
    descJa: '都道府県をまたぐ引越しの場合は旧登録の抹消と新居住地での新規登録が必要です。同一都道府県内の場合は自転車店で住所変更可能です。',
    descVi: 'Nếu chuyển sang tỉnh khác, cần hủy đăng ký cũ và đăng ký mới tại tiệm xe đạp tỉnh mới. Nếu chuyển trong cùng tỉnh, chỉ cần ra tiệm xe đạp đổi địa chỉ.',
    descEn: 'Moving across prefectures requires deregistration and new registration at a bicycle shop in the new prefecture.',
    method: 'window',
    methodLabelJa: '最寄りの「自転車防犯登録所」（自転車店・ホームセンター）',
    methodLabelVi: 'Tiệm bán xe đạp hoặc siêu thị đồ gia dụng gần nhà',
    methodLabelEn: 'Local Bicycle Shop / Home Center',
    requiresPresence: true,
    condition: 'has_bicycle',
    isCritical: false,
  },

  // ==========================================
  // 6. SUBSCRIPTION & SHOPPING (DỊCH VỤ SỐ)
  // ==========================================
  {
    id: 'ecommerce_addresses_update',
    categoryId: 'subscription',
    timingBandId: 'day_of_move',
    titleJa: 'Amazon・楽天市場・メルカリ等の配送先住所変更',
    titleVi: 'Đổi địa chỉ giao hàng mặc định trên Amazon, Rakuten, Mercari, Uber Eats',
    titleEn: 'E-Commerce & Delivery Apps Default Shipping Address Update',
    descJa: '引越し直後の誤配送トラブルで最も多いのが通販サイトの旧住所への誤注文です。引越し当日にデフォルト配送先を変更してください。',
    descVi: 'Lỗi nhầm địa chỉ phổ biến nhất sau khi dọn nhà là đặt hàng ship nhầm về nhà cũ. Hãy vào sửa địa chỉ mặc định ngay trong ngày chuyển nhà.',
    descEn: 'The most common post-move mishap is misdelivering online orders to the old home. Switch default delivery addresses on moving day.',
    method: 'online',
    methodLabelJa: '各通販・デリバリーアプリ設定画面',
    methodLabelVi: 'Mục cài đặt địa chỉ giao hàng trong từng app',
    methodLabelEn: 'E-Commerce App Settings',
    requiresPresence: false,
    isCritical: false,
  },
];

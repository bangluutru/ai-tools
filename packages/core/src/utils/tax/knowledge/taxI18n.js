/**
 * @file packages/core/src/utils/tax/knowledge/taxI18n.js
 * @description Bản dịch tam ngữ (JA, VI, EN) đầy đủ cho miniapp "日本の税金ガイド・シミュレーター".
 * Ưu tiên công bằng cho cả 3 ngôn ngữ, giữ nguyên thuật ngữ tiếng Nhật chính thức để đối chiếu giấy tờ.
 */

export const TaxI18nStrings = {
  ja: {
    appTitle: '日本の税金ガイド・シミュレーター',
    appSubtitle: 'あなたの働き方に合わせて、関係する税金・社会保険料を瞬時に判定・試算・解説。',
    privacyBadge: '100% ブラウザ内処理・入力された財務データは外部サーバーに一切送信されません。',
    disclaimer: '【ご注意】本シミュレーターは税制の理解と概算把握を目的としたシミュレーションツールです。確定申告書等の税務申告そのものではなく、税理士法に定める個別具体的な税務相談ではありません。実際の納税額は個別の事情によって異なる場合がありますので、必要に応じて所轄の税務署や税理士、自治体窓口にご相談ください。',

    // Profiles
    selectProfile: '① あなたの働き方・状況を選択',
    selectProfileDesc: '現在の主な収入源や働き方を選んでください。必要な質問項目のみが自動で展開されます。',
    customIncomePrompt: '複数の収入源（給与＋副業、会社役員＋個人事業など）がある場合も柔軟に計算できます。',

    // Form Steps
    stepBasic: '② 収入・基本情報の入力',
    stepDetail: '③ 該当条件の詳細',
    yearLabel: '計算対象の税年度',
    prefectureLabel: 'お住まいの都道府県',
    prefectureHelp: '住民税の均等割や協会けんぽの健康保険料率が地域ごとに反映されます。',
    ageLabel: '年齢',
    ageHelp: '40歳以上65歳未満の場合、介護保険料（約1.6%）が自動で加算されます。',

    salaryLabel: '年間の額面給与収入（年収）',
    salaryPlaceholder: '例: 4,500,000',
    salaryHelp: '賞与（ボーナス）を含めた源泉徴収前の総支給額を入力してください。',

    businessRevLabel: '事業の年間売上高（税抜）',
    businessRevPlaceholder: '例: 8,000,000',
    businessExpLabel: '事業の年間必要経費',
    businessExpPlaceholder: '例: 2,500,000',

    blueReturnLabel: '確定申告の申告方式',
    blueReturn_etax_65: '青色申告（e-Tax・複式簿記・65万円控除）',
    blueReturn_paper_55: '青色申告（紙面提出・複式簿記・55万円控除）',
    blueReturn_simple_10: '青色申告（簡易簿記・10万円控除）',
    blueReturn_white_0: '白色申告（青色控除なし）',

    businessCatLabel: '個人事業税の業種区分',
    businessCatHelp: '業種によって税率（5%、4%、3%、または非課税）が異なります。',
    operatingMonthsLabel: '本年の営業月数',

    sideIncomeToggle: '副業（雑所得等）の収入はありますか？',
    sideIncomeRevLabel: '副業の年間総収入',
    sideIncomeExpLabel: '副業の年間必要経費',

    consumptionTaxSection: '消費税の関連情報',
    invoiceRegisteredLabel: 'インボイス（適格請求書発行事業者）に登録していますか？',
    invoiceRegisteredHelp: '登録済みの場合は、売上高にかかわらず消費税の課税事業者となります。',
    basePeriodSalesLabel: '前々年（2年前）の課税売上高',
    basePeriodSalesHelp: '1,000万円を超えると本年は自動的に消費税の課税事業者となります。',
    consumptionMethodLabel: '消費税の計算方式',
    consumption_standard: '本則課税（売上税額 − 実際の仕入税額）',
    consumption_simplified: '簡易課税（みなし仕入率方式）',
    consumption_special20: 'インボイス2割特例（売上税額の20%のみ納付）',
    simplifiedCatLabel: '簡易課税の業種区分',
    taxablePurchasesLabel: '年間の課税仕入高（税抜）',

    corporateSection: '法人の会社情報',
    corporateIncomeLabel: '法人の年間課税所得（税引前利益）',
    corporateCapitalLabel: '資本金',
    corporateEmployeesLabel: '従業員数',

    familySection: '扶養・各種控除',
    hasSpouseLabel: '控除対象配偶者（配偶者控除）あり',
    dependentsCountLabel: '扶養親族の人数（16歳以上）',
    idecoMonthlyLabel: 'iDeCo・小規模企業共済（月額掛金）',
    idecoHelp: '掛け金全額が所得控除となり、所得税・住民税が軽減されます。',

    // Buttons
    btnCalculate: '税額・社会保険料を計算する',
    btnRecalculate: '再計算',
    btnReset: '初期値に戻す',
    btnFilingDiagnosis: '「私は確定申告が必要？」を判定する',
    btnWhatIfSimulation: 'What-If シナリオシミュレーション',
    btnExportPdf: 'PDFレポートを保存',
    btnExportCsv: 'CSVデータを保存',

    // Results Tabs
    tabSummary: 'サマリー（概算把握）',
    tabBreakdown: '税金・社保の内訳一覧',
    tabDetails: '計算根拠と公式情報',

    // Summary Card Labels
    cardGrossEarnings: '年間総収入 / 売上',
    cardTotalTaxes: '概算 税金合計',
    cardTotalSocial: '概算 社会保険料合計',
    cardTakeHome: '概算 手取り額 / 可処分所得',
    cardEffectiveRate: '実効公的負担率',

    // Breakdown Section Titles
    taxSectionTitle: '公租公課（税金）',
    socialSectionTitle: '社会保障（社会保険料）',
    taxTotalLabel: '税金合計',
    socialTotalLabel: '社会保険料合計',
    grandTotalLabel: '公的負担総額（税金＋社保）',

    // Drawer Titles
    drawerTitle: '税金・社会保険の計算根拠と公式解説',
    level1Tab: 'かんたん解説',
    level2Tab: 'あなたの場合の計算式',
    level3Tab: '根拠条文・公式リンク',
    closeDrawer: '閉じる',

    // Scenario Simulator
    scenarioTitle: 'What-If シミュレーター（条件を変更して比較）',
    scenarioDesc: '収入の増減や青色申告、インボイス特例の有無をスライダーで切り替えて、税負担と手取りの変化をリアルタイムに確認できます。',
    sliderRevenue: '収入 / 売上のシミュレーション',
    toggleBlueReturn: '青色申告（65万円控除）を適用',
    toggleInvoice: 'インボイス登録事業者とする',
    scenarioDiffTax: '税金の変動',
    scenarioDiffTakeHome: '手取りの変動',

    // Applicable Taxes Box
    applicableTaxesTitle: 'あなたの状況に関連する税金・義務',
    applicableTaxesDesc: 'ご入力いただいたプロファイルに基づき、以下の公的義務が関係します:',
  },

  vi: {
    appTitle: 'Hướng Dẫn & Mô Phỏng Thuế Nhật Bản',
    appSubtitle: 'Mô phỏng tức thì các loại thuế & bảo hiểm xã hội Nhật Bản phù hợp với từng hoàn cảnh làm việc, chuẩn xác và dễ hiểu.',
    privacyBadge: '100% xử lý trực tiếp trên trình duyệt — dữ liệu tài chính của bạn không bao giờ gửi lên máy chủ.',
    disclaimer: '【LƯU Ý QUAN TRỌNG】Công cụ này phục vụ mục đích giáo dục và ước tính định hướng tài chính. Đây không phải là tờ khai thuế chính thức và không thay thế tư vấn nghiệp vụ thuế cá nhân của Chuyên viên Thuế (税理士). Nghĩa vụ thực tế có thể khác biệt do hoàn cảnh cụ thể. Hãy đối chiếu với Cơ quan thuế (税務署), Tòa thị chính (役所) khi làm thủ tục.',

    // Profiles
    selectProfile: '① Chọn hoàn cảnh & hình thức làm việc của bạn',
    selectProfileDesc: 'Chọn phương thức kiếm thu nhập chính. Hệ thống sẽ tự động hiển thị đúng những câu hỏi cần thiết.',
    customIncomePrompt: 'Hệ thống hỗ trợ cả trường hợp kết hợp đa nguồn thu nhập (đi làm công ty + việc phụ, chủ công ty + nhận lương giám đốc...).',

    // Form Steps
    stepBasic: '② Thu nhập & Thông tin cơ bản',
    stepDetail: '③ Điều kiện chi tiết theo ngữ cảnh',
    yearLabel: 'Năm tính thuế',
    prefectureLabel: 'Tỉnh / Thành phố sinh sống (都道府県)',
    prefectureHelp: 'Biểu phí thuế cư trú và tỷ lệ BHYT 協会けんぽ sẽ tự động tính theo từng địa phương.',
    ageLabel: 'Độ tuổi',
    ageHelp: 'Người từ 40 đến 64 tuổi sẽ tự động được tính thêm Bảo hiểm chăm sóc người già (介護保険 khoảng 1.6%).',

    salaryLabel: 'Tổng thu nhập tiền lương hàng năm (Lương Gross)',
    salaryPlaceholder: 'Ví dụ: 4,500,000',
    salaryHelp: 'Tổng số tiền lương trước khi trừ bảo hiểm và thuế (đã gồm cả thưởng/bonus) ghi trên phiếu 源泉徴収票.',

    businessRevLabel: 'Tổng doanh thu kinh doanh trong năm (chưa gồm thuế)',
    businessRevPlaceholder: 'Ví dụ: 8,000,000',
    businessExpLabel: 'Tổng chi phí kinh doanh hợp lý trong năm',
    businessExpPlaceholder: 'Ví dụ: 2,500,000',

    blueReturnLabel: 'Hình thức kê khai thuế thu nhập',
    blueReturn_etax_65: 'Khai thuế xanh 青色申告 (Kê khai điện tử e-Tax + Sổ kép: Giảm trừ 65 vạn yên)',
    blueReturn_paper_55: 'Khai thuế xanh 青色申告 (Nộp giấy + Sổ kép: Giảm trừ 55 vạn yên)',
    blueReturn_simple_10: 'Khai thuế xanh 青色申告 (Sổ đơn giản: Giảm trừ 10 vạn yên)',
    blueReturn_white_0: 'Khai thuế trắng 白色申告 (Không có giảm trừ thuế xanh)',

    businessCatLabel: 'Phân loại ngành tính Thuế kinh doanh cá nhân (個人事業税)',
    businessCatHelp: 'Thuế suất dao động từ 3% đến 5% tùy ngành, hoặc 0% nếu thuộc các ngành ngoài luật định.',
    operatingMonthsLabel: 'Số tháng hoạt động trong năm',

    sideIncomeToggle: 'Bạn có thu nhập từ việc làm phụ / ngoài giờ không?',
    sideIncomeRevLabel: 'Doanh thu từ việc làm phụ (副業売上)',
    sideIncomeExpLabel: 'Chi phí phục vụ việc làm phụ (副業経費)',

    consumptionTaxSection: 'Thông tin Thuế tiêu thụ (消費税 - VAT Nhật Bản)',
    invoiceRegisteredLabel: 'Bạn đã đăng ký Hóa đơn hợp lệ Invoice (適格請求書)?',
    invoiceRegisteredHelp: 'Nếu đã đăng ký Invoice, bạn tự động là đối tượng chịu thuế tiêu thụ bất kể mức doanh thu.',
    basePeriodSalesLabel: 'Doanh thu chịu thuế của 2 năm trước (基準期間)',
    basePeriodSalesHelp: 'Nếu doanh thu 2 năm trước vượt quá 1,000 vạn yên, năm nay bạn bắt buộc phải nộp thuế tiêu thụ.',
    consumptionMethodLabel: 'Phương pháp tính thuế tiêu thụ',
    consumption_standard: 'Phương pháp thông thường 本則課税 (Thuế đầu ra − Thuế đầu vào thực tế)',
    consumption_simplified: 'Phương pháp giản dịch 簡易課税 (Khấu trừ danh nghĩa theo ngành)',
    consumption_special20: 'Đặc lệ 20% Invoice (2割特例 - Chỉ nộp 20% thuế đầu ra)',
    simplifiedCatLabel: 'Nhóm ngành tính thuế giản dịch',
    taxablePurchasesLabel: 'Chi phí mua vào chịu thuế trong năm (chưa gồm thuế)',

    corporateSection: 'Thông tin Doanh nghiệp / Pháp nhân (法人)',
    corporateIncomeLabel: 'Lợi nhuận chịu thuế của công ty (Lợi nhuận trước thuế)',
    corporateCapitalLabel: 'Vốn điều lệ (資本金)',
    corporateEmployeesLabel: 'Số lượng nhân viên',

    familySection: 'Gia cảnh & Các khoản giảm trừ',
    hasSpouseLabel: 'Có vợ/chồng thuộc diện phụ thuộc (配偶者控除)',
    dependentsCountLabel: 'Số người phụ thuộc khác (từ 16 tuổi trở lên)',
    idecoMonthlyLabel: 'Đóng quỹ hưu trí tự nguyện iDeCo / Doanh nghiệp nhỏ (mỗi tháng)',
    idecoHelp: 'Toàn bộ số tiền đóng được khấu trừ 100% vào thu nhập tính thuế thu nhập và thuế cư trú.',

    // Buttons
    btnCalculate: 'Tính toán nghĩa vụ thuế & bảo hiểm',
    btnRecalculate: 'Tính lại',
    btnReset: 'Đặt lại ban đầu',
    btnFilingDiagnosis: 'Chẩn đoán: 「Tôi có cần khai thuế 確定申告 không?」',
    btnWhatIfSimulation: 'Mô phỏng kịch bản (What-If)',
    btnExportPdf: 'Tải Báo Cáo PDF',
    btnExportCsv: 'Tải Dữ Liệu CSV',

    // Results Tabs
    tabSummary: 'Tổng quan (Summary)',
    tabBreakdown: 'Bảng chi tiết các khoản thuế & BHXH',
    tabDetails: 'Căn cứ tính toán & Nguồn chính thức',

    // Summary Card Labels
    cardGrossEarnings: 'Tổng thu nhập / Doanh thu',
    cardTotalTaxes: 'Ước tính Tổng Tiền Thuế',
    cardTotalSocial: 'Ước tính Bảo Hiểm Xã Hội',
    cardTakeHome: 'Ước tính Thực Nhận / Khả Dụng',
    cardEffectiveRate: 'Tỷ lệ gánh nặng công thực tế',

    // Breakdown Section Titles
    taxSectionTitle: 'Các Khoản Thuế (税金)',
    socialSectionTitle: 'Bảo Hiểm Xã Hội (社会保険料)',
    taxTotalLabel: 'Tổng Tiền Thuế',
    socialTotalLabel: 'Tổng Bảo Hiểm Xã Hội',
    grandTotalLabel: 'Tổng Nghĩa Vụ Tài Chính Công (Thuế ＋ BHXH)',

    // Drawer Titles
    drawerTitle: 'Căn cứ tính toán & Giải thích chi tiết',
    level1Tab: 'Giải thích ngắn gọn',
    level2Tab: 'Trường hợp của bạn',
    level3Tab: 'Điều luật & Đường dẫn chính thức',
    closeDrawer: 'Đóng',

    // Scenario Simulator
    scenarioTitle: 'Bảng Mô Phỏng Kịch Bản (What-If)',
    scenarioDesc: 'Kéo thanh trượt hoặc bật tắt các tùy chọn (Khai thuế xanh, Invoice) để thấy ngay số thuế và số tiền tay về biến động theo thời gian thực.',
    sliderRevenue: 'Mô phỏng thay đổi Thu nhập / Doanh thu',
    toggleBlueReturn: 'Áp dụng Khai thuế xanh 青色申告 (Giảm 65 vạn yên)',
    toggleInvoice: 'Đã đăng ký cơ sở xuất hóa đơn Invoice',
    scenarioDiffTax: 'Biến động tiền thuế',
    scenarioDiffTakeHome: 'Biến động tiền thực nhận',

    // Applicable Taxes Box
    applicableTaxesTitle: 'Các loại thuế & nghĩa vụ tài chính liên quan đến bạn',
    applicableTaxesDesc: 'Dựa trên hoàn cảnh bạn đã chọn, các nghĩa vụ tài chính công sau đây có khả năng liên quan:',
  },

  en: {
    appTitle: 'Japan Tax Guide & Simulator',
    appSubtitle: 'Identify, estimate, and understand your Japanese tax obligations and social insurance based on your work profile.',
    privacyBadge: '100% client-side processing — your financial data never leaves your device.',
    disclaimer: '【DISCLAIMER】This simulator is an educational estimation tool. It is not an official tax return filing and does not constitute certified tax accountancy (Zeirishi) advice. Actual tax liability may vary according to individual circumstances. Consult local tax offices (Zeimusho) or certified professionals for filing.',

    // Profiles
    selectProfile: '① Select Your Employment or Work Profile',
    selectProfileDesc: 'Choose your primary source of earnings. Only relevant questionnaires will progressively appear.',
    customIncomePrompt: 'Supports hybrid income streams (salaried + side business, corporate executive + sole proprietor).',

    // Form Steps
    stepBasic: '② Income & Basic Information',
    stepDetail: '③ Context-specific Details',
    yearLabel: 'Tax Year',
    prefectureLabel: 'Prefecture of Residence (都道府県)',
    prefectureHelp: 'Local resident tax rates and Kyokai Kenpo health insurance rates are tailored to your prefecture.',
    ageLabel: 'Age',
    ageHelp: 'If aged 40 to 64, Nursing Care Insurance (~1.6%) will be automatically calculated.',

    salaryLabel: 'Gross Annual Salary (Before Tax & Insurance)',
    salaryPlaceholder: 'e.g. 4,500,000',
    salaryHelp: 'Total pre-tax earnings including bonuses as shown on your Withholding Slip (源泉徴収票).',

    businessRevLabel: 'Annual Business Gross Revenue (Excluding Tax)',
    businessRevPlaceholder: 'e.g. 8,000,000',
    businessExpLabel: 'Annual Necessary Business Expenses',
    businessExpPlaceholder: 'e.g. 2,500,000',

    blueReturnLabel: 'Income Tax Return Filing Method',
    blueReturn_etax_65: 'Blue Return (e-Tax + Double-entry: 650,000 JPY deduction)',
    blueReturn_paper_55: 'Blue Return (Paper + Double-entry: 550,000 JPY deduction)',
    blueReturn_simple_10: 'Blue Return (Single-entry: 100,000 JPY deduction)',
    blueReturn_white_0: 'White Return (No blue deduction)',

    businessCatLabel: 'Individual Enterprise Tax Business Category',
    businessCatHelp: 'Tax rates vary from 3% to 5% by statutory category, or 0% for non-statutory professions.',
    operatingMonthsLabel: 'Operating Months in Tax Year',

    sideIncomeToggle: 'Do you have side hustle or freelance earnings?',
    sideIncomeRevLabel: 'Side Hustle Gross Revenue',
    sideIncomeExpLabel: 'Side Hustle Necessary Expenses',

    consumptionTaxSection: 'Consumption Tax (Japanese VAT)',
    invoiceRegisteredLabel: 'Are you a Qualified Invoice Issuer (インボイス)?',
    invoiceRegisteredHelp: 'Registered invoice businesses are automatically taxable regardless of revenue volume.',
    basePeriodSalesLabel: 'Taxable Sales from 2 Years Prior (基準期間)',
    basePeriodSalesHelp: 'Sales exceeding 10M JPY two years ago make you taxable in the current year.',
    consumptionMethodLabel: 'Consumption Tax Calculation Method',
    consumption_standard: 'Standard Method (Output Tax − Actual Input Purchases)',
    consumption_simplified: 'Simplified Tax Method (Deemed Purchase Ratio)',
    consumption_special20: 'Invoice 20% Special Rule (Pay only 20% of output tax)',
    simplifiedCatLabel: 'Simplified Tax Industry Category',
    taxablePurchasesLabel: 'Annual Taxable Purchases (Excluding Tax)',

    corporateSection: 'Corporate Business Information (法人)',
    corporateIncomeLabel: 'Corporate Taxable Income (Net Pre-tax Profit)',
    corporateCapitalLabel: 'Stated Capital (資本金)',
    corporateEmployeesLabel: 'Employee Headcount',

    familySection: 'Dependents & Relief Deductions',
    hasSpouseLabel: 'Eligible Dependent Spouse (配偶者控除)',
    dependentsCountLabel: 'Number of Dependents (Age 16+)',
    idecoMonthlyLabel: 'iDeCo / Small Business Mutual Aid (Monthly Premium)',
    idecoHelp: '100% of contributions are fully deductible against income and resident taxes.',

    // Buttons
    btnCalculate: 'Calculate Taxes & Social Insurance',
    btnRecalculate: 'Recalculate',
    btnReset: 'Reset to Defaults',
    btnFilingDiagnosis: 'Diagnose: Do I Need to File a Tax Return?',
    btnWhatIfSimulation: 'What-If Scenario Simulation',
    btnExportPdf: 'Export PDF Report',
    btnExportCsv: 'Export CSV Data',

    // Results Tabs
    tabSummary: 'Summary Overview',
    tabBreakdown: 'Taxes & Insurance Breakdown',
    tabDetails: 'Formulas & Official Grounds',

    // Summary Card Labels
    cardGrossEarnings: 'Total Gross Earnings / Revenue',
    cardTotalTaxes: 'Estimated Total Taxes',
    cardTotalSocial: 'Estimated Social Insurance',
    cardTakeHome: 'Estimated Net Take-Home Pay',
    cardEffectiveRate: 'Effective Public Burden Rate',

    // Breakdown Section Titles
    taxSectionTitle: 'Public Taxes (税金)',
    socialSectionTitle: 'Social Insurance (社会保険料)',
    taxTotalLabel: 'Total Taxes',
    socialTotalLabel: 'Total Social Insurance',
    grandTotalLabel: 'Total Public Financial Burden (Taxes + Insurance)',

    // Drawer Titles
    drawerTitle: 'Tax Calculation Details & Official Reference',
    level1Tab: 'Quick Explanation',
    level2Tab: 'In Your Case (Formula Trace)',
    level3Tab: 'Statutory Articles & Links',
    closeDrawer: 'Close',

    // Scenario Simulator
    scenarioTitle: 'What-If Scenario Simulator',
    scenarioDesc: 'Adjust income levels, toggle blue return deductions or invoice special rules to inspect immediate changes in take-home pay and tax burden.',
    sliderRevenue: 'Simulate Earnings / Revenue Adjustments',
    toggleBlueReturn: 'Apply Blue Return (650,000 JPY deduction)',
    toggleInvoice: 'Register as Qualified Invoice Issuer',
    scenarioDiffTax: 'Tax Burden Variance',
    scenarioDiffTakeHome: 'Take-Home Variance',

    // Applicable Taxes Box
    applicableTaxesTitle: 'Applicable Taxes & Financial Obligations',
    applicableTaxesDesc: 'Based on your selected profile, the following public duties are relevant:',
  },
};

/**
 * Trả về chuỗi đa ngữ theo mã ngôn ngữ người dùng chọn
 */
export function getTaxI18n(lang = 'ja') {
  const selectedLang = String(lang).toLowerCase();
  if (TaxI18nStrings[selectedLang]) {
    return TaxI18nStrings[selectedLang];
  }
  return TaxI18nStrings.ja;
}

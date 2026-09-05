export const categories = [
  { id: 'all', label_vn: 'Tất cả', label_en: 'All', label_ja: 'すべて', icon: 'Sparkles' },
  { id: 'pdf', label_vn: 'PDF & Tài liệu', label_en: 'PDF & Documents', label_ja: 'PDF・ドキュメント', icon: 'FileText' },
  { id: 'image', label_vn: 'Ảnh & WebP', label_en: 'Images & WebP', label_ja: '画像・WebP', icon: 'Image' },
  { id: 'office', label_vn: 'Kế toán & Hóa đơn', label_en: 'Finance & Invoices', label_ja: '会計・請求書', icon: 'FileSpreadsheet' },
  { id: 'utils', label_vn: 'Tiện ích', label_en: 'Utilities', label_ja: '便利ツール', icon: 'Wrench' },
  { id: 'ai', label_vn: 'Dịch thuật & AI', label_en: 'AI & Translation', label_ja: 'AI・翻訳', icon: 'Globe' },
  // Nhóm riêng cho miniapp tạm dừng. Chúng không xuất hiện ở bất kỳ nhóm nào
  // khác, kể cả "Tất cả công cụ", nhưng vẫn được liệt kê ở đây để nhắc rằng
  // các công cụ này đang chờ phát triển tiếp.
  { id: 'in-development', label_vn: 'Đang phát triển', label_en: 'In development', label_ja: '開発中', icon: 'Wrench' }
];

// Miniapp tạm dừng phát triển. Chúng không được build vào portal, không mở được
// từ URL/command palette, và chỉ xuất hiện trong nhóm "Đang phát triển" — không
// nằm trong bất kỳ nhóm nào khác, kể cả "Tất cả công cụ". Xem
// hub/src/tools-in-development/README.md trước khi mở lại bất kỳ công cụ nào.
export const IN_DEVELOPMENT = 'in-development';

const toolGovernance = {
  'image-convert': {
    readiness: 'beta',
    processing: 'browser',
    priority: 3,
    outputPurpose: 'utility'
  },
  'screen-capture': { readiness: 'beta', processing: 'browser', outputPurpose: 'utility' },
  'barcode-qr': { readiness: 'beta', processing: 'browser', outputPurpose: 'utility' },
  'pdf-toolkit': { readiness: 'beta', processing: 'browser', outputPurpose: 'utility' },
  'pdf-overlay': {
    readiness: IN_DEVELOPMENT,
    processing: 'browser',
    outputPurpose: 'reference',
    unavailableReason: 'Tạm dừng phát triển. Luồng hiện tại dựng HTML thay vì overlay lên PDF nguồn và còn rủi ro XSS; sẽ làm lại bằng pdf-lib khi có nhu cầu.'
  },
  'legal-studio': {
    readiness: IN_DEVELOPMENT,
    processing: 'backend-antigravity',
    outputPurpose: 'reference',
    unavailableReason: 'Tạm dừng phát triển. Phụ thuộc quyết định runtime Antigravity và kiểm thử đầu ra pháp lý.'
  },
  'long-translator': {
    readiness: IN_DEVELOPMENT,
    processing: 'backend-antigravity',
    outputPurpose: 'reference',
    unavailableReason: 'Tạm dừng phát triển theo định hướng sản phẩm; sẽ nghiên cứu lại khi cần.'
  },
  'certificate-studio': {
    readiness: IN_DEVELOPMENT,
    processing: 'manual',
    outputPurpose: 'reference',
    unavailableReason: 'Tạm dừng phát triển. Cần sanitize SVG/HTML đầu vào và bỏ dữ liệu mẫu gây hiểu nhầm.'
  },
  // priority chỉ đánh dấu ba miniapp ưu tiên sản phẩm (kế toán, hóa đơn, ảnh);
  // omniconvert là tiện ích nên không mang số ưu tiên.
  'omniconvert': {
    readiness: 'beta',
    processing: 'browser',
    outputPurpose: 'utility'
  },
  'excel-mapping': {
    readiness: 'experimental',
    processing: 'hybrid',
    outputPurpose: 'reference'
  },
  'editor-studio': { readiness: 'experimental', processing: 'browser', outputPurpose: 'reference' },
  'invoice-studio': {
    readiness: 'beta',
    processing: 'browser',
    priority: 2,
    outputPurpose: 'reference'
  },
  'contract-auditor': {
    readiness: IN_DEVELOPMENT,
    processing: 'browser',
    outputPurpose: 'reference',
    unavailableReason: 'Tạm dừng phát triển. Luồng hiện tại chưa đọc đủ ba bộ chứng từ và còn fallback dữ liệu giả.'
  },
  'auto-bi': { readiness: 'experimental', processing: 'browser', outputPurpose: 'reference' },
  'policy-assistant': {
    readiness: IN_DEVELOPMENT,
    processing: 'browser',
    outputPurpose: 'reference',
    unavailableReason: 'Tạm dừng phát triển. Cần kho chính sách có nguồn, phiên bản và ngày hiệu lực do pháp chế duyệt.'
  },
  'accounting-reconcile': {
    readiness: 'beta',
    processing: 'browser',
    priority: 1,
    outputPurpose: 'reference'
  },
  'watermark-studio': {
    readiness: 'beta',
    processing: 'browser',
    outputPurpose: 'utility'
  },
  'id-photo-studio': {
    readiness: 'beta',
    processing: 'browser',
    outputPurpose: 'utility'
  },
  'business-card-studio': {
    readiness: 'beta',
    processing: 'browser',
    outputPurpose: 'utility'
  }
};

const toolDefinitions = [
  {
    id: 'business-card-studio',
    name_vn: 'Tạo Danh Thiếp & Namecard AI',
    name_en: 'AI Business Card & Meishi Studio',
    name_ja: '名刺作成＆ビジネスカードスタジオ',
    desc_vn: 'Thiết kế danh thiếp chuẩn in 300 DPI kèm bù xén 3mm & dấu Tonbo. Quét AI OCR từ ảnh danh thiếp cũ, 28 phong cách và in hàng loạt nhân viên.',
    desc_en: 'Commercial 300 DPI business card maker with 3mm bleed & Japanese Tonbo marks. AI OCR old cards, 28 templates & CSV batch employee generator.',
    desc_ja: '塗り足し3mm・トンボ付き300 DPI印刷用名刺ジェネレーター。名刺写真からのAI OCR認識、28種類のテンプレート、CSV社員一括作成対応。',
    category: 'image',
    icon: 'Contact',
    gradient: 'from-blue-600 via-indigo-600 to-amber-500',
    color: '#3b82f6',
    badge: 'PRINT READY',
    popular: true,
    tags: ['business card', 'namecard', 'danh thiếp', 'meishi', '名刺', 'in ấn', 'tonbo', 'トンボ', 'ocr', 'vcard', 'qr', 'print']
  },
  {
    id: 'id-photo-studio',
    name_vn: 'Tạo Ảnh Thẻ & Hộ Chiếu Chuẩn',
    name_en: 'ID & Passport Photo Studio',
    name_ja: '証明写真＆パスポートスタジオ',
    desc_vn: 'Tách nền AI Studio HD, căn chuẩn khuôn mặt theo lưới ICAO/Combini, xuất file đơn Ultra HD và sheet in 300/600 DPI.',
    desc_en: 'AI Studio HD background removal, ICAO standard face framing, Ultra HD single photo & 300/600 DPI combini print sheet export.',
    desc_ja: 'AI高精度背景透過、規格準拠の自動顔位置調整、ウルトラHD単体出力およびコンビニ印刷用シート生成。',
    category: 'image',
    icon: 'UserCheck',
    gradient: 'from-blue-600 via-indigo-600 to-cyan-500',
    color: '#2563eb',
    badge: 'AI & PHOTO',
    popular: true,
    tags: ['id photo', 'passport', 'ảnh thẻ', 'hộ chiếu', 'combini', 'cv', 'visa', 'ai matting', '履歴書']
  },
  {
    id: 'image-convert',
    name_vn: 'WebP Master & Nén Ảnh',
    name_en: 'WebP Image Converter',
    name_ja: 'WebP 画像変換',
    desc_vn: 'Chuyển đổi hàng loạt PNG, JPG, GIF và WebP, nén dung lượng và so sánh chất lượng trực quan.',
    desc_en: 'Batch convert PNG, JPG, GIF and WebP images, compress and visually compare output.',
    desc_ja: 'PNG、JPG、GIF、WebPを一括変換し、圧縮して画質を比較します。',
    category: 'image',
    icon: 'Image',
    gradient: 'from-emerald-500 to-teal-600',
    color: '#10b981',
    badge: 'POPULAR',
    popular: true,
    tags: ['image', 'webp', 'convert', 'png', 'jpg', 'gif', 'compress', 'ảnh']
  },
  {
    id: 'screen-capture',
    name_vn: 'Chụp Màn Hình & Chú Thích',
    name_en: 'SnapCraft Screen Capture',
    name_ja: '画面キャプチャ＆注釈',
    desc_vn: 'Chụp nhanh màn hình, kéo chọn vùng tự động copy Clipboard 1-chạm và biên tập vẽ mũi tên, ghi chú, làm mờ.',
    desc_en: 'Fast screen capture, instant auto-copy to clipboard on snipping release, with live vector annotation & blur.',
    desc_ja: '画面を素早くキャプチャ、選択領域を即時クリップボードにコピーし、矢印や文字注釈・ぼかしを追加。',
    category: 'image',
    icon: 'Camera',
    gradient: 'from-brand-500 to-cyan-500',
    color: '#7c3aed',
    badge: 'CLIPBOARD',
    popular: true,
    tags: ['screenshot', 'capture', 'chụp màn hình', 'clipboard', 'snip', 'annotate', 'mũi tên', 'arrow', 'blur']
  },
  {
    id: 'barcode-qr',
    name_vn: 'Tạo Mã QR & Barcode Chuẩn',
    name_en: 'CodeCraft QR & Barcode Studio',
    name_ja: 'QRコード＆バーコード作成',
    desc_vn: 'Tạo mã QR nghệ thuật nhúng logo, gradient màu và mã vạch 1D chuẩn GS1 (Code128, EAN-13, UPC, ITF-14) 100% offline.',
    desc_en: 'Create styled QR codes with custom logos, dual gradients, and GS1 industrial 1D barcodes 100% in-browser.',
    desc_ja: 'ロゴ埋め込みQRコード、グラデーションカラー、GS1産業用バーコード（Code128、EAN-13、UPC）を完全ローカルで生成。',
    category: 'utils',
    icon: 'QrCode',
    gradient: 'from-brand-600 via-indigo-600 to-cyan-500',
    color: '#8b5cf6',
    badge: 'GS1 & LOGO',
    popular: true,
    tags: ['qr', 'barcode', 'mã vạch', 'mã qr', 'ean', 'code128', 'upc', 'itf-14', 'logo', 'batch', 'generator']
  },
  {
    id: 'pdf-toolkit',
    name_vn: 'Công Cụ PDF Đa Năng',
    name_en: 'PDF Toolkit',
    name_ja: 'PDF ツールキット',
    desc_vn: 'Tách, gộp và nén file PDF 100% trên trình duyệt — tất cả trong một.',
    desc_en: 'Split, merge and compress PDF files 100% in-browser — all in one.',
    desc_ja: 'ブラウザ上で100%完結するPDF分割・結合・圧縮ツール。',
    category: 'pdf',
    icon: 'FileText',
    gradient: 'from-rose-500 via-violet-500 to-teal-500',
    color: '#8b5cf6',
    badge: '3-IN-1',
    popular: true,
    tags: ['pdf', 'split', 'tách', 'trích xuất', 'extract', 'merge', 'gộp', 'ghép', 'combine', 'compress', 'nén', 'thu nhỏ', 'dung lượng', 'size', 'slim', 'optimizer']
  },
  {
    id: 'pdf-overlay',
    name_vn: 'Đè Dữ Liệu Lên Form PDF',
    name_en: 'PDF Template Overlay',
    name_ja: 'PDF テンプレート重ね合わせ',
    desc_vn: 'Điền dữ liệu, văn bản, chữ ký trực tiếp lên phôi biểu mẫu PDF có sẵn.',
    desc_en: 'Overlay dynamic text, signatures, and fields onto pre-existing PDF forms.',
    desc_ja: '既存のPDFフォーム上にテキスト、署名、フィールドを重ねて入力します。',
    category: 'pdf',
    icon: 'Printer',
    gradient: 'from-fuchsia-500 to-purple-600',
    color: '#d946ef',
    badge: 'CANVAS',
    popular: false,
    tags: ['pdf', 'overlay', 'template', 'form', 'đè dữ liệu', 'chữ ký']
  },
  {
    id: 'legal-studio',
    name_vn: 'Soạn Thảo & Dịch Pháp Lý',
    name_en: 'Legal Document Studio',
    name_ja: '法律文書スタジオ',
    desc_vn: 'Soạn thảo, đối chiếu và dịch văn bản pháp lý 2 cột song ngữ chuẩn xác.',
    desc_en: 'Draft, compare, and translate legal contracts with dual-column bilingual alignment.',
    desc_ja: '2列のバイリンガル表示で契約書や法律文書を作成・翻訳します。',
    category: 'ai',
    icon: 'Scale',
    gradient: 'from-emerald-600 to-cyan-600',
    color: '#059669',
    badge: 'AI READY',
    popular: true,
    tags: ['legal', 'pháp lý', 'hợp đồng', 'song ngữ', 'dịch', 'contract']
  },
  {
    id: 'long-translator',
    name_vn: 'Dịch Tài Liệu Dài EJV',
    name_en: 'Long Doc & EJV Translator',
    name_ja: '長文ドキュメント翻訳',
    desc_vn: 'Dịch thuật tài liệu dài đa trang (Anh - Nhật - Việt) giữ nguyên bố cục định dạng.',
    desc_en: 'Translate multi-page documents (English, Japanese, Vietnamese) preserving formatting.',
    desc_ja: '書式を維持したまま長文ドキュメント（英語・日本語・ベトナム語）を翻訳します。',
    category: 'ai',
    icon: 'Globe',
    gradient: 'from-teal-500 to-cyan-600',
    color: '#0d9488',
    badge: 'EJV ENGINE',
    popular: true,
    tags: ['translator', 'dịch thuật', 'tiếng nhật', 'tiếng anh', 'long doc']
  },
  {
    id: 'certificate-studio',
    name_vn: 'Dịch Bằng Cấp & Chứng Chỉ',
    name_en: 'Certificate Studio',
    name_ja: '証明書・資格証スタジオ',
    desc_vn: 'Phân tích cấu trúc, dịch thuật và xuất bản mẫu bằng lái, bằng đại học, chứng chỉ A4.',
    desc_en: 'Analyze, translate and generate A4 print-ready certificates, diplomas, and licenses.',
    desc_ja: '卒業証明書、資格証、免許証のA4印刷レイアウトを作成・翻訳します。',
    category: 'ai',
    icon: 'Award',
    gradient: 'from-indigo-500 to-blue-600',
    color: '#6366f1',
    badge: 'A4 LAYOUT',
    popular: false,
    tags: ['certificate', 'bằng cấp', 'chứng chỉ', 'bằng lái', 'diploma']
  },
  {
    id: 'omniconvert',
    name_vn: 'Chuyển Đổi Đa Năng OmniConvert',
    name_en: 'OmniConvert Universal File Converter',
    name_ja: 'OmniConvert ユニバーサルファイル変換',
    desc_vn: 'Chuyển đổi cực nhanh các định dạng DOCX, PPTX, XLSX và hình ảnh sang PDF 100% bảo mật trên trình duyệt.',
    desc_en: 'Lightning-fast client-side conversion of DOCX, PPTX, XLSX, and images to PDF with zero server uploads.',
    desc_ja: 'サーバーにアップロードせずに、ブラウザ上でDOCX、PPTX、XLSX、および画像をPDFに高速変換します。',
    category: 'pdf',
    icon: 'RefreshCw',
    gradient: 'from-orange-500 to-amber-600',
    color: '#f97316',
    badge: 'NEW',
    popular: true,
    tags: ['convert', 'pdf', 'docx', 'pptx', 'xlsx', 'chuyển đổi']
  },
  {
    id: 'excel-mapping',
    name_vn: 'Tự Động Hóa & Mapping Excel',
    name_en: 'Excel Data Mapping',
    name_ja: 'Excel データマッピング',
    desc_vn: 'Tự động ánh xạ các cột dữ liệu Excel của khách hàng vào biểu mẫu nhà cung cấp.',
    desc_en: 'Automatically map customer Excel fields into supplier order templates.',
    desc_ja: '顧客のExcelデータをサプライヤーの発注書フォーマットに自動マッピングします。',
    category: 'utils',
    icon: 'FileSpreadsheet',
    gradient: 'from-blue-500 to-indigo-600',
    color: '#3b82f6',
    badge: 'AUTOMATION',
    popular: true,
    tags: ['excel', 'mapping', 'xlsx', 'data', 'tự động hóa']
  },
  {
    id: 'editor-studio',
    name_vn: 'Bộ Soạn Thảo Template Nâng Cao',
    name_en: 'Interactive Document Studio',
    name_ja: 'インタラクティブ文書エディタ',
    desc_vn: 'Trình tạo biểu mẫu tương tác, thiết kế dàn trang A4 và xuất file DOCX/PDF.',
    desc_en: 'Interactive form and template builder with smart layout formatting and DOCX/PDF export.',
    desc_ja: 'スマートなレイアウト書式設定とDOCX/PDF出力を備えた文書作成ツール。',
    category: 'pdf',
    icon: 'LayoutTemplate',
    gradient: 'from-indigo-600 to-purple-600',
    color: '#4f46e5',
    badge: 'DOCX EXPORT',
    popular: false,
    tags: ['editor', 'template', 'docx', 'form', 'soạn thảo']
  },
  {
    id: 'invoice-studio',
    name_vn: 'Xử Lý Hóa Đơn & Đề Nghị Thanh Toán',
    name_en: 'Invoice to Payment Request',
    name_ja: '請求書・支払申請自動化',
    desc_vn: 'Trích xuất dữ liệu hóa đơn điện tử XML/PDF và tự động xuất bảng Excel Đề nghị thanh toán.',
    desc_en: 'Extract electronic invoice XML/PDF data and generate Excel Payment Requests.',
    desc_ja: '電子請求書XML/PDFからデータを抽出し、支払依頼Excelを自動生成します。',
    category: 'office',
    icon: 'Receipt',
    gradient: 'from-amber-500 to-orange-600',
    color: '#f59e0b',
    badge: 'INVOICE AI',
    popular: true,
    tags: ['invoice', 'hóa đơn', 'thanh toán', 'xml', 'pdf', 'excel']
  },
  {
    id: 'contract-auditor',
    name_vn: 'Đối Soát Hợp Đồng & Thanh Quyết Toán',
    name_en: 'Contract & Payment Auditor',
    name_ja: '契約書・支払突合監査',
    desc_vn: 'Đối chiếu chéo 3 chiều (Hợp đồng ↔ Biên bản nghiệm thu ↔ Hóa đơn) và phát hiện sai lệch.',
    desc_en: '3-way matching cross-audit between Contracts, Acceptance Records, and Invoices.',
    desc_ja: '契約書、検収書、請求書の3者間突合を行い、差異や上限超過を検出します。',
    category: 'office',
    icon: 'Scale',
    gradient: 'from-emerald-500 to-teal-600',
    color: '#10b981',
    badge: '3-WAY AUDIT',
    popular: true,
    tags: ['contract', 'hợp đồng', 'đối soát', 'nghiệm thu', 'audit', 'matching']
  },
  {
    id: 'auto-bi',
    name_vn: 'Phân Tích Dữ Liệu & Báo Cáo BI',
    name_en: 'Auto-BI Smart Analytics',
    name_ja: '自動BIデータ分析',
    desc_vn: 'Nạp file Excel/CSV thô, tự động nhận diện chỉ số, vẽ biểu đồ tương tác và sinh nhận xét điều hành.',
    desc_en: 'Upload raw Excel/CSV, auto-detect metrics, render interactive charts and executive insights.',
    desc_ja: 'Excel/CSVデータを読み込み、指標を自動集計してグラフと要約レポートを生成します。',
    category: 'office',
    icon: 'BarChart3',
    gradient: 'from-cyan-500 to-blue-600',
    color: '#06b6d4',
    badge: 'SMART BI',
    popular: true,
    tags: ['bi', 'chart', 'analytics', 'báo cáo', 'phân tích', 'excel', 'csv']
  },
  {
    id: 'policy-assistant',
    name_vn: 'Trợ Lý Quy Chế & Soạn Biểu Mẫu',
    name_en: 'Policy & Expense Assistant',
    name_ja: '規程・旅費申請アシスタント',
    desc_vn: 'Tra cứu định mức công tác phí theo vùng, tự động tính toán dự toán và xuất biểu mẫu đề xuất.',
    desc_en: 'Look up per-diem policy rates by region, auto-calculate travel budget and generate forms.',
    desc_ja: '地域別の旅費日当基準を参照し、出張予算を自動計算して申請書を作成します。',
    category: 'ai',
    icon: 'HelpCircle',
    gradient: 'from-purple-500 to-indigo-600',
    color: '#a855f7',
    badge: 'POLICY AI',
    popular: true,
    tags: ['policy', 'quy chế', 'công tác phí', 'expense', 'dự toán'],
  },
  {
    id: 'accounting-reconcile',
    name_vn: 'Đối Chiếu Kế Toán',
    name_en: 'Accounting Reconciliation',
    name_ja: '経理照合ツール',
    desc_vn: 'Tự động đối chiếu chênh lệch doanh thu và thuế GTGT giữa sổ kế toán nội bộ (511, 33311) và bảng kê thuế (BR).',
    desc_en: 'Automatically reconcile revenue and VAT discrepancies between internal ledgers (511, 33311) and tax invoices (BR).',
    desc_ja: '内部元帳（511、33311）と税金請求書（BR）の間の収益とVATの差異を自動的に照合します。',
    category: 'office',
    icon: 'Calculator',
    gradient: 'from-blue-600 to-indigo-700',
    color: '#4f46e5',
    badge: 'NEW',
    popular: true,
    tags: ['accounting', 'reconcile', 'đối chiếu', 'kế toán', 'thuế', 'doanh thu', '511', '33311', 'br', 'excel']
  },
  {
    id: 'watermark-studio',
    name_vn: 'Watermark Studio — Đóng Dấu Tài Liệu',
    name_en: 'Watermark Studio — Document Stamping',
    name_ja: 'ウォーターマークスタジオ — 文書透かし',
    desc_vn: 'Đóng dấu watermark văn bản hoặc logo lên PDF, DOCX, XLSX, PPTX và ảnh. Tùy chỉnh màu sắc, độ đậm nhạt, bố cục lưới/đơn. 100% xử lý trên trình duyệt.',
    desc_en: 'Stamp text or logo watermarks on PDF, DOCX, XLSX, PPTX and images. Customizable color, opacity, tiled/single layout. 100% client-side processing.',
    desc_ja: 'PDF、DOCX、XLSX、PPTXや画像にテキストまたはロゴの透かしを追加。色、透明度、レイアウトをカスタマイズ。100%ブラウザ処理。',
    category: 'utils',
    icon: 'Stamp',
    gradient: 'from-indigo-500 to-violet-600',
    color: '#6366f1',
    badge: 'NEW',
    popular: true,
    tags: ['watermark', 'stamp', 'đóng dấu', 'bản quyền', 'confidential', 'draft', 'logo', 'pdf', 'docx', 'xlsx', 'pptx', 'ảnh']
  }
];

export const tools = toolDefinitions.map((tool) => ({
  readiness: 'experimental',
  processing: 'browser',
  outputPurpose: 'reference',
  ...tool,
  ...toolGovernance[tool.id]
}));

export const isInDevelopment = (tool) => tool?.readiness === IN_DEVELOPMENT;

/** Miniapp được build vào portal và mở được từ UI/URL. */
export const activeTools = tools.filter((tool) => !isInDevelopment(tool));

/** Miniapp đã tạm dừng; giữ lại trong registry để portal công bố trạng thái. */
export const inDevelopmentTools = tools.filter(isInDevelopment);

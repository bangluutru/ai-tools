export const categories = [
  { id: 'all', label_vn: 'Tất cả công cụ', label_en: 'All Tools', label_ja: 'すべてのツール', icon: 'Sparkles' },
  { id: 'pdf', label_vn: 'Công cụ PDF', label_en: 'PDF Tools', label_ja: 'PDF ツール', icon: 'FileText' },
  { id: 'image', label_vn: 'Hình ảnh & WebP', label_en: 'Image & WebP', label_ja: '画像＆WebP', icon: 'Image' },
  { id: 'office', label_vn: 'Excel & Hóa đơn', label_en: 'Excel & Invoices', label_ja: 'Excel・請求書', icon: 'FileSpreadsheet' },
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
  'pdf-split': { readiness: 'beta', processing: 'browser', outputPurpose: 'utility' },
  'pdf-merge': { readiness: 'beta', processing: 'browser', outputPurpose: 'utility' },
  'pdf-compress': { readiness: 'beta', processing: 'browser', outputPurpose: 'utility' },
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
  'excel-mapping': {
    readiness: 'experimental',
    processing: 'hybrid',
    outputPurpose: 'reference'
  },
  'editor-studio': { readiness: 'experimental', processing: 'browser', outputPurpose: 'reference' },
  'invoice-webapp': {
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
  }
};

const toolDefinitions = [
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
    id: 'pdf-split',
    name_vn: 'Tách Tệp PDF (Splitter)',
    name_en: 'PDF Splitter',
    name_ja: 'PDF 分割',
    desc_vn: 'Trích xuất, cắt nhỏ trang hoặc chia tách tệp PDF lớn trực quan ngay trên trình duyệt.',
    desc_en: 'Extract individual pages or split large PDF files into smaller documents visually.',
    desc_ja: 'ブラウザ上で直感的にPDFのページを抽出または分割します。',
    category: 'pdf',
    icon: 'Scissors',
    gradient: 'from-rose-500 to-pink-600',
    color: '#f43f5e',
    badge: 'CLIENT-SIDE',
    popular: true,
    tags: ['pdf', 'split', 'tách', 'trích xuất', 'extract']
  },
  {
    id: 'pdf-merge',
    name_vn: 'Gộp Tệp PDF (Merger)',
    name_en: 'PDF Merger',
    name_ja: 'PDF 結合',
    desc_vn: 'Ghép nhiều tệp PDF thành một tài liệu duy nhất với thao tác kéo thả sắp xếp thứ tự.',
    desc_en: 'Combine multiple PDF files into a single document with drag-and-drop reordering.',
    desc_ja: 'ドラッグ＆ドロップで順番を並べ替えて複数のPDFを1つに結合します。',
    category: 'pdf',
    icon: 'Combine',
    gradient: 'from-violet-500 to-purple-600',
    color: '#8b5cf6',
    badge: 'FAST',
    popular: true,
    tags: ['pdf', 'merge', 'gộp', 'ghép', 'combine']
  },
  {
    id: 'pdf-compress',
    name_vn: 'Nén & Thu Nhỏ File PDF',
    name_en: 'PDF Slim Compressor',
    name_ja: 'PDF 圧縮・最適化',
    desc_vn: 'Thu nhỏ dung lượng PDF 100% trên trình duyệt với 3 mức độ nén: Tối Đa, Cân Bằng, Chất Lượng Cao và tùy chỉnh sâu.',
    desc_en: '100% in-browser PDF compression with 3 presets: Maximum, Balanced, High Quality, and custom precision.',
    desc_ja: 'ブラウザ上で100%完結するPDF圧縮ツール。最大圧縮・バランス・高品質・詳細カスタムに対応。',
    category: 'pdf',
    icon: 'Minimize2',
    gradient: 'from-teal-500 to-emerald-600',
    color: '#0d9488',
    badge: '100% LOCAL',
    popular: true,
    tags: ['pdf', 'compress', 'nén', 'thu nhỏ', 'dung lượng', 'size', 'slim', 'optimizer']
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
    id: 'excel-mapping',
    name_vn: 'Tự Động Hóa & Mapping Excel',
    name_en: 'Excel Data Mapping',
    name_ja: 'Excel データマッピング',
    desc_vn: 'Tự động ánh xạ các cột dữ liệu Excel của khách hàng vào biểu mẫu nhà cung cấp.',
    desc_en: 'Automatically map customer Excel fields into supplier order templates.',
    desc_ja: '顧客のExcelデータをサプライヤーの発注書フォーマットに自動マッピングします。',
    category: 'office',
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
    category: 'office',
    icon: 'LayoutTemplate',
    gradient: 'from-indigo-600 to-purple-600',
    color: '#4f46e5',
    badge: 'DOCX EXPORT',
    popular: false,
    tags: ['editor', 'template', 'docx', 'form', 'soạn thảo']
  },
  {
    id: 'invoice-webapp',
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

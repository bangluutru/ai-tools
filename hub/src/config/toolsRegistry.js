export const categories = [
  { id: 'all', label_vn: 'Tất cả công cụ', label_en: 'All Tools', label_ja: 'すべてのツール', icon: 'Sparkles' },
  { id: 'pdf', label_vn: 'Công cụ PDF', label_en: 'PDF Tools', label_ja: 'PDF ツール', icon: 'FileText' },
  { id: 'image', label_vn: 'Hình ảnh & WebP', label_en: 'Image & WebP', label_ja: '画像＆WebP', icon: 'Image' },
  { id: 'office', label_vn: 'Excel & Hóa đơn', label_en: 'Excel & Invoices', label_ja: 'Excel・請求書', icon: 'FileSpreadsheet' }
];

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
  }
};

const toolDefinitions = [
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
    category: 'image',
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
    desc_vn: 'Tách và gộp file PDF 100% trên trình duyệt.',
    desc_en: 'Split and merge PDF files 100% in-browser.',
    desc_ja: 'ブラウザ上で100%完結するPDF分割・結合ツール。',
    category: 'pdf',
    icon: 'FileText',
    gradient: 'from-rose-500 via-violet-500 to-teal-500',
    color: '#8b5cf6',
    badge: 'SPLIT & MERGE',
    popular: true,
    tags: ['pdf', 'split', 'tách', 'trích xuất', 'extract', 'merge', 'gộp', 'ghép', 'combine']
  },
  {
    id: 'omniconvert',
    name_vn: 'Chuyển Đổi Đa Năng OmniConvert',
    name_en: 'OmniConvert Universal File Converter',
    name_ja: 'OmniConvert ユニバーサルファイル変換',
    desc_vn: 'Chuyển đổi DOCX, XLSX và hình ảnh sang PDF trên trình duyệt.',
    desc_en: 'Convert DOCX, XLSX, and images to PDF in the browser.',
    desc_ja: 'ブラウザ上でDOCX、XLSX、および画像をPDFに変換します。',
    category: 'office',
    icon: 'RefreshCw',
    gradient: 'from-orange-500 to-amber-600',
    color: '#f97316',
    badge: 'NEW',
    popular: true,
    tags: ['convert', 'pdf', 'docx', 'xlsx', 'chuyển đổi']
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
    category: 'office',
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

/** Miniapp được build vào portal và mở được từ UI/URL. */
export const activeTools = tools;

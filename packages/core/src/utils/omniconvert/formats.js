export const FORMAT_TYPES = {
  DOCX: 'docx',
  PPTX: 'pptx',
  XLSX: 'xlsx',
  PDF: 'pdf',
  PNG: 'png',
  JPG: 'jpg',
  JPEG: 'jpeg',
  WEBP: 'webp',
  SVG: 'svg',
  BMP: 'bmp',
  TXT: 'txt',
  CSV: 'csv'
};

export const FORMAT_DETAILS = {
  docx: {
    ext: 'docx',
    name_vn: 'Microsoft Word (.docx)',
    name_en: 'Microsoft Word (.docx)',
    name_ja: 'Microsoft Word (.docx)',
    category: 'document',
    color: 'bg-blue-600/20 text-blue-400 border-blue-500/30',
    badgeColor: 'bg-blue-600 text-white'
  },
  pptx: {
    ext: 'pptx',
    name_vn: 'PowerPoint Slide (.pptx)',
    name_en: 'PowerPoint Slide (.pptx)',
    name_ja: 'PowerPoint スライド (.pptx)',
    category: 'presentation',
    color: 'bg-orange-600/20 text-orange-400 border-orange-500/30',
    badgeColor: 'bg-orange-600 text-white'
  },
  xlsx: {
    ext: 'xlsx',
    name_vn: 'Excel Bảng Tính (.xlsx)',
    name_en: 'Excel Spreadsheet (.xlsx)',
    name_ja: 'Excel スプレッドシート (.xlsx)',
    category: 'spreadsheet',
    color: 'bg-emerald-600/20 text-emerald-400 border-emerald-500/30',
    badgeColor: 'bg-emerald-600 text-white'
  },
  pdf: {
    ext: 'pdf',
    name_vn: 'Tài liệu PDF (.pdf)',
    name_en: 'Portable Document (.pdf)',
    name_ja: 'PDF ドキュメント (.pdf)',
    category: 'pdf',
    color: 'bg-red-600/20 text-red-400 border-red-500/30',
    badgeColor: 'bg-red-600 text-white'
  },
  png: {
    ext: 'png',
    name_vn: 'Hình ảnh PNG (.png)',
    name_en: 'PNG Image (.png)',
    name_ja: 'PNG 画像 (.png)',
    category: 'image',
    color: 'bg-purple-600/20 text-purple-400 border-purple-500/30',
    badgeColor: 'bg-purple-600 text-white'
  },
  jpg: {
    ext: 'jpg',
    name_vn: 'Hình ảnh JPEG (.jpg)',
    name_en: 'JPEG Image (.jpg)',
    name_ja: 'JPEG 画像 (.jpg)',
    category: 'image',
    color: 'bg-pink-600/20 text-pink-400 border-pink-500/30',
    badgeColor: 'bg-pink-600 text-white'
  },
  jpeg: {
    ext: 'jpeg',
    name_vn: 'Hình ảnh JPEG (.jpeg)',
    name_en: 'JPEG Image (.jpeg)',
    name_ja: 'JPEG 画像 (.jpeg)',
    category: 'image',
    color: 'bg-pink-600/20 text-pink-400 border-pink-500/30',
    badgeColor: 'bg-pink-600 text-white'
  },
  webp: {
    ext: 'webp',
    name_vn: 'Ảnh WebP Thế Hệ Mới (.webp)',
    name_en: 'WebP Image (.webp)',
    name_ja: 'WebP 画像 (.webp)',
    category: 'image',
    color: 'bg-cyan-600/20 text-cyan-400 border-cyan-500/30',
    badgeColor: 'bg-cyan-600 text-white'
  },
  svg: {
    ext: 'svg',
    name_vn: 'Vector SVG (.svg)',
    name_en: 'Vector SVG (.svg)',
    name_ja: 'SVG ベクター (.svg)',
    category: 'image',
    color: 'bg-amber-600/20 text-amber-400 border-amber-500/30',
    badgeColor: 'bg-amber-600 text-white'
  },
  bmp: {
    ext: 'bmp',
    name_vn: 'Ảnh Bitmap (.bmp)',
    name_en: 'Bitmap Image (.bmp)',
    name_ja: 'Bitmap 画像 (.bmp)',
    category: 'image',
    color: 'bg-indigo-600/20 text-indigo-400 border-indigo-500/30',
    badgeColor: 'bg-indigo-600 text-white'
  },
  txt: {
    ext: 'txt',
    name_vn: 'Văn bản thuần (.txt)',
    name_en: 'Plain Text (.txt)',
    name_ja: 'テキストファイル (.txt)',
    category: 'document',
    color: 'bg-slate-600/20 text-slate-300 border-slate-500/30',
    badgeColor: 'bg-slate-600 text-white'
  },
  csv: {
    ext: 'csv',
    name_vn: 'Bảng CSV (.csv)',
    name_en: 'CSV Table (.csv)',
    name_ja: 'CSV テーブル (.csv)',
    category: 'spreadsheet',
    color: 'bg-teal-600/20 text-teal-300 border-teal-500/30',
    badgeColor: 'bg-teal-600 text-white'
  }
};

export const COMPATIBILITY_MATRIX = {
  docx: ['pdf', 'txt'],
  pptx: ['pdf'],
  xlsx: ['pdf', 'csv'],
  // PDF→PPTX đã gỡ cùng pptxgenjs: thư viện phụ thuộc image-size, vốn dính
  // advisory DoS ở mọi phiên bản và không có bản vá. Chiều PPTX→PDF giữ nguyên.
  pdf: ['docx', 'xlsx', 'png', 'jpg', 'webp', 'txt'],
  png: ['pdf', 'jpg', 'webp'],
  jpg: ['pdf', 'png', 'webp'],
  jpeg: ['pdf', 'png', 'webp'],
  webp: ['pdf', 'png', 'jpg'],
  svg: ['pdf', 'png'],
  bmp: ['pdf', 'png', 'jpg'],
  txt: ['pdf'],
  csv: ['pdf']
};

export const POPULAR_PRESETS = [
  { id: 'all-to-pdf', label_vn: 'Tất cả ➔ PDF', label_en: 'All ➔ PDF', label_ja: 'すべて ➔ PDF', from: '*', to: 'pdf' },
  { id: 'pdf-to-office', label_vn: 'PDF ➔ Word/Excel/PPT', label_en: 'PDF ➔ Office', label_ja: 'PDF ➔ Office', from: 'pdf', to: 'docx' },
  { id: 'img-to-pdf', label_vn: 'Gộp ảnh ➔ PDF', label_en: 'Images ➔ PDF', label_ja: '画像結合 ➔ PDF', from: 'image', to: 'pdf' },
  { id: 'pdf-to-img', label_vn: 'PDF ➔ Bộ ảnh (PNG/JPG)', label_en: 'PDF ➔ Images', label_ja: 'PDF ➔ 画像一括', from: 'pdf', to: 'png' },
  { id: 'custom', label_vn: 'Tùy chọn tự do', label_en: 'Custom pair', label_ja: 'カスタム', from: 'custom', to: 'custom' }
];

export function getFileExtension(filename) {
  if (!filename) return '';
  const parts = filename.split('.');
  return parts.length > 1 ? parts.pop().toLowerCase() : '';
}

export function getSupportedTargets(sourceExt) {
  const ext = (sourceExt || '').toLowerCase();
  return COMPATIBILITY_MATRIX[ext] || [];
}

export function isFormatSupported(ext) {
  return Boolean(FORMAT_DETAILS[ext?.toLowerCase()]);
}

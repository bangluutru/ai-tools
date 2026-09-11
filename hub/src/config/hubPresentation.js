/**
 * @file hub/src/config/hubPresentation.js
 * ============================================================================
 * Presentation Metadata for Toolio Hub Top-Level Domains (SOT for Presentation)
 * Strictly presentation-only metadata:
 * - Trilingual labels (VI, EN, JA) for Top-level domains, subtitles, descriptions, filters
 * - Visual identity cues (accent colors, illustration component mappings)
 * - Pure data, ZERO business logic or hardcoded tool lists
 * ============================================================================
 */

export const HUB_DOMAINS = {
  common: {
    id: 'common',
    route: 'tools',
    name: {
      vi: 'Công cụ',
      en: 'Tools',
      ja: 'ツール',
    },
    cardTitle: 'Tools',
    subtitle: {
      vi: 'Các công cụ tiện ích hàng ngày, giúp bạn xử lý công việc nhanh hơn.',
      en: 'Everyday utility tools to help you get work done faster.',
      ja: '毎日の作業をより迅速かつ効率的にする便利ツール。',
    },
    description: {
      vi: 'Các công cụ tiện ích hàng ngày xử lý PDF, hình ảnh, Excel, văn bản và nhiều công cụ hữu ích khác.',
      en: 'Everyday utilities for PDF handling, images, Excel, documents, QR codes, and more.',
      ja: 'PDF、画像、Excel、文書処理、QRコードなど、日々の業務を支援する多彩なツール。',
    },
    badge: {
      vi: 'Tools',
      en: 'Tools',
      ja: 'ツール',
    },
    accentColor: '#0284c7', // Toolio cyan / blue family
    themeClass: 'text-primary',
    bgClass: 'bg-sky-500/10',
    borderClass: 'border-sky-500/20',
    hoverBorderClass: 'hover:border-sky-500/50',
    illustration: 'ToolboxIcon',
    watermark: 'ToolsWatermark',
    // Content filter chips for Tools (Khớp 100% Mockup)
    filters: [
      { id: 'all', label: { vi: 'Tất cả', en: 'All', ja: 'すべて' } },
      { id: 'pdf', label: { vi: 'PDF', en: 'PDF', ja: 'PDF' } },
      { id: 'image', label: { vi: 'Hình ảnh & Web', en: 'Images & Web', ja: '画像・Web' } },
      { id: 'office', label: { vi: 'Excel & Hóa đơn', en: 'Excel & Invoices', ja: 'Excel・請求書' } },
      { id: 'text', label: { vi: 'Văn bản', en: 'Documents', ja: '文書・エディタ' } },
      { id: 'qr', label: { vi: 'Mã QR & Barcode', en: 'QR & Barcode', ja: 'QR・バーコード' } },
      { id: 'utils', label: { vi: 'Tiện ích khác', en: 'Other Utilities', ja: 'その他の便利ツール' } },
    ],
  },
  'japan-life': {
    id: 'japan-life',
    route: 'japan-life',
    name: {
      vi: 'Đời sống Nhật Bản',
      en: 'Japan Life',
      ja: '日本生活',
    },
    cardTitle: 'Japan Life',
    subtitle: {
      vi: 'Hỗ trợ đời sống tại Nhật Bản với thông tin chính xác, dễ hiểu.',
      en: 'Life support in Japan with verified and intuitive tools.',
      ja: '日本での暮らしと手続きを、正確かつ分かりやすくサポート。',
    },
    description: {
      vi: 'Đời sống Nhật Bản: Thuế, bảo hiểm, việc làm, cư trú, gia đình, nhà ở và các thủ tục hành chính.',
      en: 'Life in Japan: Income tax, social insurance, employment, residence, family, housing, and municipal procedures.',
      ja: '日本での生活：税金、社会保険、年金、就労、在留資格、子育て、引越、行政手続きまで網羅。',
    },
    badge: {
      vi: 'Japan Life',
      en: 'Japan Life',
      ja: '日本生活',
    },
    accentColor: '#f43f5e', // Sakura rose
    themeClass: 'text-rose-500 dark:text-rose-400',
    bgClass: 'bg-rose-500/10',
    borderClass: 'border-rose-500/20',
    hoverBorderClass: 'hover:border-rose-500/50',
    illustration: 'SakuraIcon',
    watermark: 'JapanLifeWatermark',
    // Content filter chips based on verified regulatory domains (Khớp 100% Mockup)
    filters: [
      { id: 'all', label: { vi: 'Tất cả', en: 'All', ja: 'すべて' } },
      { id: 'tax', label: { vi: 'Thuế & Tài chính', en: 'Tax & Finance', ja: '税金・財務' } },
      { id: 'insurance', label: { vi: 'Bảo hiểm & Lương hưu', en: 'Insurance & Pension', ja: '保険・年金' } },
      { id: 'employment', label: { vi: 'Việc làm & Trợ cấp', en: 'Jobs & Benefits', ja: '労働・手当' } },
      { id: 'family', label: { vi: 'Gia đình & Trẻ em', en: 'Family & Children', ja: '子育て・家族' } },
      { id: 'housing', label: { vi: 'Nhà ở & Chuyển nhà', en: 'Housing & Moving', ja: '住まい・引越' } },
      { id: 'immigration', label: { vi: 'Cư trú & Nhập cảnh', en: 'Immigration & Visa', ja: '在留・入管' } },
      { id: 'procedures-documents', label: { vi: 'Thủ tục hành chính', en: 'Procedures & Forms', ja: '行政手続・書類' } },
    ],
  },
  'vietnam-life': {
    id: 'vietnam-life',
    route: 'vietnam-life',
    name: {
      vi: 'Đời sống Việt Nam',
      en: 'Vietnam Life',
      ja: 'ベトナム生活',
    },
    cardTitle: 'Vietnam Life',
    subtitle: {
      vi: 'Hỗ trợ đời sống tại Việt Nam (đang phát triển).',
      en: 'Life support in Vietnam (under development).',
      ja: 'ベトナム生活サポート（開発中）。',
    },
    description: {
      vi: 'Đời sống Việt Nam: Thuế, bảo hiểm, hành chính, giáo dục và các tiện ích cho đời sống tại Việt Nam.',
      en: 'Life in Vietnam: Personal tax, social insurance, public administration, education, and daily life utilities.',
      ja: 'ベトナムでの生活：税金、社会保障、行政手続き、教育、生活便利ツールを順次提供予定。',
    },
    badge: {
      vi: 'Sắp ra mắt',
      en: 'Coming Soon',
      ja: '近日公開',
    },
    accentColor: '#10b981', // Lotus emerald
    themeClass: 'text-emerald-500 dark:text-emerald-400',
    bgClass: 'bg-emerald-500/10',
    borderClass: 'border-emerald-500/20',
    hoverBorderClass: 'hover:border-emerald-500/50',
    illustration: 'LotusIcon',
    status: 'coming_soon',
    // Content filter chips for Vietnam Life (Khớp 100% Mockup)
    filters: [
      { id: 'all', label: { vi: 'Tất cả', en: 'All', ja: 'すべて' } },
      { id: 'tax', label: { vi: 'Thuế & Tài chính', en: 'Tax & Finance', ja: '税金・財務' } },
      { id: 'insurance', label: { vi: 'Bảo hiểm & An sinh', en: 'Insurance & Welfare', ja: '保険・福祉' } },
      { id: 'education', label: { vi: 'Giáo dục & Trẻ em', en: 'Education & Children', ja: '教育・子ども' } },
      { id: 'admin', label: { vi: 'Hành chính & Giấy tờ', en: 'Procedures & Documents', ja: '行政・書類' } },
      { id: 'housing', label: { vi: 'Nhà ở & Đời sống', en: 'Housing & Daily Life', ja: '住まい・生活' } },
      { id: 'utils', label: { vi: 'Tiện ích khác', en: 'Other Utilities', ja: 'その他の便利ツール' } },
    ],
  },
};

/**
 * Helper to get localized domain name
 * @param {string} groupId
 * @param {string} lang ('vi' | 'en' | 'ja')
 * @returns {string}
 */
export function getDomainName(groupId, lang = 'vi') {
  const domain = HUB_DOMAINS[groupId] || HUB_DOMAINS.common;
  return domain.name[lang] || domain.name.vi;
}

/**
 * Helper to get localized domain presentation config
 * @param {string} groupId
 * @returns {object}
 */
export function getDomainConfig(groupId) {
  return HUB_DOMAINS[groupId] || HUB_DOMAINS.common;
}

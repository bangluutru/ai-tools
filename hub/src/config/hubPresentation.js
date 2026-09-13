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
      vi: 'Công cụ tính toán',
      en: 'Calculation Tools',
      ja: '計算ツール',
    },
    description: {
      vi: 'Các công cụ tính toán chính xác, giúp bạn lập kế hoạch tài chính và đưa ra quyết định dễ dàng hơn.',
      en: 'Accurate calculation tools to help you plan your finances and make decisions more easily.',
      ja: '高精度な計算ツールで、資金計画や意思決定をより簡単にサポート。',
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
      vi: 'Đời sống Nhật Bản',
      en: 'Japan Life',
      ja: '日本生活',
    },
    description: {
      vi: 'Thông tin và hướng dẫn đầy đủ về cuộc sống tại Nhật: thuế, bảo hiểm, việc làm, cư trú, gia đình, nhà ở, thủ tục hành chính và lãnh sự Việt Nam.',
      en: 'Comprehensive guide for life in Japan: taxes, insurance, jobs, residence, family, housing, administrative and VN consular procedures.',
      ja: '日本での生活に関する完全ガイド：税金、保険、就職、在留資格、家族、住居、行政手続きおよびベトナム領事手続き。',
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
      { id: 'consular-vn', label: { vi: '🇻🇳 Lãnh sự Việt Nam', en: 'VN Consular', ja: '領事手続き' } },
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
      vi: 'Đời sống Việt Nam',
      en: 'Vietnam Life',
      ja: 'ベトナム生活',
    },
    description: {
      vi: 'Thông tin hữu ích cho cuộc sống tại Việt Nam: thủ tục hành chính, pháp lý, tài chính, giáo dục và nhiều hơn nữa.',
      en: 'Helpful information for life in Vietnam: administrative procedures, legal, finance, education and more.',
      ja: 'ベトナムでの生活に役立つ情報：行政手続、法務、金融、教育など。',
    },
    badge: {
      vi: 'Mới ra mắt',
      en: 'New',
      ja: '新登場',
    },
    accentColor: '#10b981', // Lotus emerald
    themeClass: 'text-emerald-500 dark:text-emerald-400',
    bgClass: 'bg-emerald-500/10',
    borderClass: 'border-emerald-500/20',
    hoverBorderClass: 'hover:border-emerald-500/50',
    illustration: 'LotusIcon',
    status: 'active',
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

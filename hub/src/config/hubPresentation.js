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
    subtitle: {
      vi: 'Các công cụ tiện ích hàng ngày',
      en: 'Everyday utility tools',
      ja: '毎日の便利ツール',
    },
    description: {
      vi: 'Nén ảnh, chuyển đổi PDF, mã QR, hóa đơn và các tiện ích làm việc nhanh chóng.',
      en: 'Image compression, PDF converter, QR codes, invoices, and everyday work utilities.',
      ja: '画像圧縮、PDF変換、QRコード、請求書、日々の作業を快適にする便利ツール。',
    },
    badge: {
      vi: 'Công cụ',
      en: 'Tools',
      ja: 'ツール',
    },
    accentColor: '#0284c7', // Toolio cyan / blue family
    themeClass: 'text-primary',
    bgClass: 'bg-primary/10',
    borderClass: 'border-primary/20',
    hoverBorderClass: 'hover:border-primary/50',
    illustration: 'ToolboxIllustration',
    // Content filter chips for Tools
    filters: [
      { id: 'all', label: { vi: 'Tất cả', en: 'All', ja: 'すべて' } },
      { id: 'pdf', label: { vi: 'PDF & Tài liệu', en: 'PDF & Documents', ja: 'PDF・文書' } },
      { id: 'image', label: { vi: 'Hình ảnh & WebP', en: 'Images & WebP', ja: '画像・WebP' } },
      { id: 'office', label: { vi: 'Kế toán & Hóa đơn', en: 'Finance & Invoices', ja: '会計・請求書' } },
      { id: 'utils', label: { vi: 'Tiện ích', en: 'Utilities', ja: '便利ツール' } },
      { id: 'ai', label: { vi: 'Dịch thuật & AI', en: 'AI & Translation', ja: 'AI・翻訳' } },
    ],
  },
  'japan-life': {
    id: 'japan-life',
    route: 'japan-life',
    name: {
      vi: 'Cuộc sống tại Nhật',
      en: 'Japan Life',
      ja: '日本生活',
    },
    subtitle: {
      vi: 'Hỗ trợ cuộc sống tại Nhật Bản',
      en: 'Life support in Japan',
      ja: '日本での暮らしと手続きを支援',
    },
    description: {
      vi: 'Thuế thu nhập, bảo hiểm xã hội, nenkin, trợ cấp, visa, chuyển việc và thủ tục hành chính.',
      en: 'Income tax, social insurance, pension, benefits, visa, job changing, and municipal procedures.',
      ja: '所得税、社会保険、年金、手当、ビザ、転職、行政手続きまで幅広くサポート。',
    },
    badge: {
      vi: 'Cuộc sống Nhật',
      en: 'Japan Life',
      ja: '日本生活',
    },
    accentColor: '#f43f5e', // Sakura rose
    themeClass: 'text-rose-500 dark:text-rose-400',
    bgClass: 'bg-rose-500/10',
    borderClass: 'border-rose-500/20',
    hoverBorderClass: 'hover:border-rose-500/50',
    illustration: 'SakuraIllustration',
    headerIllustration: 'SakuraBranchIllustration',
    // Content filter chips based on verified regulatory domains
    filters: [
      { id: 'all', label: { vi: 'Tất cả', en: 'All', ja: 'すべて' } },
      { id: 'tax', label: { vi: 'Thuế & Tài chính', en: 'Tax & Finance', ja: '税金・財務' } },
      { id: 'insurance', label: { vi: 'Bảo hiểm & Hưu trí', en: 'Insurance & Pension', ja: '保険・年金' } },
      { id: 'employment', label: { vi: 'Việc làm & Quyền lợi', en: 'Employment & Labor', ja: '労働・雇用' } },
      { id: 'family', label: { vi: 'Gia đình & Trẻ em', en: 'Family & Childcare', ja: '子育て・家族' } },
      { id: 'housing', label: { vi: 'Nhà ở & Chuyển nhà', en: 'Housing & Moving', ja: '住まい・引越' } },
      { id: 'immigration', label: { vi: 'Cư trú & Nhập cảnh', en: 'Immigration & Visa', ja: '在留・入管' } },
      { id: 'procedures-documents', label: { vi: 'Thủ tục & Giấy tờ', en: 'Procedures & Forms', ja: '行政手続・書類' } },
    ],
  },
  'vietnam-life': {
    id: 'vietnam-life',
    route: 'vietnam-life',
    name: {
      vi: 'Cuộc sống tại Việt Nam',
      en: 'Vietnam Life',
      ja: 'ベトナム生活',
    },
    subtitle: {
      vi: 'Hỗ trợ cuộc sống tại Việt Nam',
      en: 'Life support in Vietnam',
      ja: 'ベトナムでの生活支援',
    },
    description: {
      vi: 'Các công cụ hỗ trợ thủ tục, tính thuế và đời sống tại Việt Nam đang được phát triển.',
      en: 'Tools supporting procedures, personal tax, and life in Vietnam are under development.',
      ja: 'ベトナムでの税金、行政手続き、生活サポートツールを順次追加予定です。',
    },
    badge: {
      vi: 'Cuộc sống VN',
      en: 'Vietnam Life',
      ja: 'ベトナム生活',
    },
    accentColor: '#10b981', // Lotus emerald
    themeClass: 'text-emerald-500 dark:text-emerald-400',
    bgClass: 'bg-emerald-500/10',
    borderClass: 'border-emerald-500/20',
    hoverBorderClass: 'hover:border-emerald-500/50',
    illustration: 'LotusIllustration',
    headerIllustration: 'TurtleTowerIllustration',
    status: 'coming_soon',
    filters: [
      { id: 'all', label: { vi: 'Tất cả', en: 'All', ja: 'すべて' } },
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

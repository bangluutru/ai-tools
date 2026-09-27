/**
 * DocStudio layout presets shared by the HTML preview, print CSS and DOCX export,
 * so that what the user sees is what gets exported.
 *
 * ND30 preset (Nghị định 30/2020/NĐ-CP, Phụ lục I) covers only page/typography:
 *  - Phông Times New Roman, cỡ chữ 13–14 (dùng 13pt)
 *  - Lề trên/dưới 20–25 mm, lề trái 30–35 mm, lề phải 15–20 mm (dùng 20/20/30/15)
 *  - Giãn dòng từ đơn đến 1,5 dòng
 * It does NOT build the two-column quốc hiệu/tiêu ngữ block, số–ký hiệu, nơi nhận,
 * chữ ký or other thể thức elements — the user must check those manually.
 */

export const FONT_OPTIONS = [
    { id: 'font-times', name: 'Times New Roman', css: '"Times New Roman", Times, serif', docx: 'Times New Roman' },
    { id: 'font-sans', name: 'Arial (Sans-serif)', css: 'Arial, Helvetica, sans-serif', docx: 'Arial' },
    { id: 'font-serif', name: 'Georgia (Serif)', css: 'Georgia, "Times New Roman", serif', docx: 'Georgia' },
    { id: 'font-mono', name: 'Courier New (Mono)', css: '"Courier New", Courier, monospace', docx: 'Courier New' },
];

// Sizes are in points so that preview and DOCX match.
export const SIZE_OPTIONS = [
    { id: 'text-sm', name: '11 pt', pt: 11 },
    { id: 'text-base', name: '12 pt', pt: 12 },
    { id: 'pt-13', name: '13 pt', pt: 13 },
    { id: 'text-lg', name: '14 pt', pt: 14 },
];

export const SPACING_OPTIONS = [
    { id: 'leading-single', name: '1,0 (Đơn)', ratio: 1.0 },
    { id: 'leading-snug', name: '1,3', ratio: 1.3 },
    { id: 'leading-onehalf', name: '1,5', ratio: 1.5 },
    { id: 'leading-relaxed', name: '1,6', ratio: 1.6 },
    { id: 'leading-loose', name: '2,0 (Thưa)', ratio: 2.0 },
];

// Margins in millimetres: top, right, bottom, left.
export const MARGIN_OPTIONS = [
    { id: 'nd30', name: 'NĐ30 (T20 · D20 · Tr30 · P15 mm)', mm: { top: 20, right: 15, bottom: 20, left: 30 } },
    { id: 'p-[1.27cm]', name: 'Hẹp (12,7 mm)', mm: { top: 12.7, right: 12.7, bottom: 12.7, left: 12.7 } },
    { id: 'p-[2cm]', name: 'Đều 20 mm', mm: { top: 20, right: 20, bottom: 20, left: 20 } },
    { id: 'p-[2.5cm]', name: 'Đều 25 mm', mm: { top: 25, right: 25, bottom: 25, left: 25 } },
    { id: 'p-[2.54cm]', name: 'Rộng (25,4 mm)', mm: { top: 25.4, right: 25.4, bottom: 25.4, left: 25.4 } },
];

export const ND30_LAYOUT = Object.freeze({
    fontFamily: 'font-times',
    fontSize: 'pt-13',
    lineSpacing: 'leading-snug',
    margins: 'nd30',
});

export const DEFAULT_LAYOUT_CONFIG = Object.freeze({
    ...ND30_LAYOUT,
    headerOptions: { enabled: false, text: '' },
    footerOptions: { enabled: false, pageNumbers: true },
});

const pick = (options, id, fallbackId) =>
    options.find(o => o.id === id) || options.find(o => o.id === fallbackId) || options[0];

export const isNd30Layout = (config = {}) =>
    Object.entries(ND30_LAYOUT).every(([key, value]) => config[key] === value);

export const mmToTwip = (mm) => Math.round((mm * 1440) / 25.4);

/** Resolve a layout config (possibly from older saved ids) into concrete values. */
export function resolveLayout(config = DEFAULT_LAYOUT_CONFIG) {
    const font = pick(FONT_OPTIONS, config.fontFamily, ND30_LAYOUT.fontFamily);
    const size = pick(SIZE_OPTIONS, config.fontSize, ND30_LAYOUT.fontSize);
    const spacing = pick(SPACING_OPTIONS, config.lineSpacing, ND30_LAYOUT.lineSpacing);
    const margin = pick(MARGIN_OPTIONS, config.margins, ND30_LAYOUT.margins);
    return {
        fontCss: font.css,
        fontDocx: font.docx,
        sizePt: size.pt,
        lineRatio: spacing.ratio,
        marginsMm: { ...margin.mm },
        marginsTwip: {
            top: mmToTwip(margin.mm.top),
            right: mmToTwip(margin.mm.right),
            bottom: mmToTwip(margin.mm.bottom),
            left: mmToTwip(margin.mm.left),
        },
        // DOCX line spacing in 240ths of a line ("auto" rule)
        docxLine: Math.round(spacing.ratio * 240),
        headerOptions: config.headerOptions || DEFAULT_LAYOUT_CONFIG.headerOptions,
        footerOptions: config.footerOptions || DEFAULT_LAYOUT_CONFIG.footerOptions,
    };
}

/** Normalise hub language codes (vi/ja) to DocStudio keys (vn/jp). */
export const normalizeDocStudioLang = (lang) => {
    if (lang === 'vi' || lang === 'vn') return 'vn';
    if (lang === 'ja' || lang === 'jp') return 'jp';
    if (lang === 'en') return 'en';
    return 'vn';
};

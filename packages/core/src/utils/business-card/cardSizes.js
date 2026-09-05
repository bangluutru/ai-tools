import { getLocalizedCardDimension } from "./translations.js";
export const CARD_DIMENSIONS = [
  {
    id: "jp-standard",
    name: "Japanese Standard (91 \xD7 55 mm)",
    nameJp: "\u65E5\u672C\u6A19\u6E96\u540D\u523A (\u6771\u4EAC4\u53F7 / \u5927\u962A9\u53F7)",
    widthMm: 91,
    heightMm: 55,
    bleedMm: 3,
    safeMarginMm: 3,
    region: "japan",
    description: "\u6700\u3082\u666E\u53CA\u3057\u3066\u3044\u308B\u6A19\u6E96\u30B5\u30A4\u30BA\u3002\u30E9\u30AF\u30B9\u30EB\u3001\u30B0\u30E9\u30D5\u30A3\u30C3\u30AF\u7B49\u306E\u4E3B\u8981\u5370\u5237\u6240\u6A19\u6E96\u3002"
  },
  {
    id: "jp-compact",
    name: "Japanese Compact / 3-Gou (89 \xD7 49 mm)",
    nameJp: "\u5973\u6027\u7528\u30FB\u5C0F\u578B\u540D\u523A (\u6771\u4EAC3\u53F7)",
    widthMm: 89,
    heightMm: 49,
    bleedMm: 3,
    safeMarginMm: 3,
    region: "japan",
    description: "\u624B\u5E33\u3084\u5C0F\u578B\u540D\u523A\u5165\u308C\u306B\u3059\u3063\u304D\u308A\u53CE\u307E\u308B\u30B9\u30EA\u30E0\u3067\u4E0A\u54C1\u306A\u30B5\u30A4\u30BA\u3002"
  },
  {
    id: "us-standard",
    name: "US / Canada Standard (3.5 \xD7 2 in)",
    nameJp: "\u6B27\u7C73\u6A19\u6E96 (88.9 \xD7 50.8 mm)",
    widthMm: 88.9,
    heightMm: 50.8,
    bleedMm: 3.175,
    // 1/8 inch
    safeMarginMm: 3.175,
    region: "us",
    description: "\u30A2\u30E1\u30EA\u30AB\u30FB\u30AB\u30CA\u30C0\u3067\u6A19\u6E96\u7684\u306B\u4F7F\u7528\u3055\u308C\u308B\u56FD\u969B\u30D3\u30B8\u30CD\u30B9\u30B5\u30A4\u30BA\u3002"
  },
  {
    id: "eu-standard",
    name: "European / ISO 7810 (85 \xD7 55 mm)",
    nameJp: "\u30E8\u30FC\u30ED\u30C3\u30D1\u30FB\u56FD\u969B\u30AB\u30FC\u30C9\u6A19\u6E96 (85 \xD7 55 mm)",
    widthMm: 85,
    heightMm: 55,
    bleedMm: 3,
    safeMarginMm: 3,
    region: "eu",
    description: "\u30AF\u30EC\u30B8\u30C3\u30C8\u30AB\u30FC\u30C9\u3084EU\u570F\u306E\u30D3\u30B8\u30CD\u30B9\u30AB\u30FC\u30C9\u3068\u540C\u3058\u6BD4\u7387\u306E\u30B5\u30A4\u30BA\u3002"
  },
  {
    id: "china-standard",
    name: "China Standard (90 \xD7 54 mm)",
    nameJp: "\u4E2D\u56FD\u30FB\u30A2\u30B8\u30A2\u6A19\u6E96 (90 \xD7 54 mm)",
    widthMm: 90,
    heightMm: 54,
    bleedMm: 3,
    safeMarginMm: 3,
    region: "custom",
    description: "\u4E2D\u56FD\u672C\u571F\u3084\u6771\u5357\u30A2\u30B8\u30A2\u3067\u5E83\u304F\u63A1\u7528\u3055\u308C\u3066\u3044\u308B\u6A19\u6E96\u30D5\u30A9\u30FC\u30DE\u30C3\u30C8\u3002"
  }
];
export const DEFAULT_CARD_DIMENSION = CARD_DIMENSIONS[0];
export function getDimensionDisplay(dim, language) {
  return getLocalizedCardDimension(dim.id, language);
}

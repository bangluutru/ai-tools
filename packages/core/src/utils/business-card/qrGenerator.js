import QRCode from "qrcode";

// Các URL dự phòng mà mẫu thiết kế dùng khi hồ sơ chưa có website/SNS.
// Đây là tên miền giả (không tồn tại hoặc không thuộc về người dùng) — không được in lên danh thiếp thật.
const PLACEHOLDER_QR_PATTERNS = [
  /^https?:\/\/[^/]*\.sample(?:[/:?#]|$)/i,
  /^https?:\/\/(?:www\.)?github\.com\/?(?:developer\/?)?$/i,
  /^https?:\/\/clinic\.health\.jp(?:[/?#]|$)/i,
  /^https?:\/\/matrix\.dev\/?$/i,
  /^https?:\/\/studio-darkroom\.visual(?:[/?#]|$)/i,
  /^https?:\/\/global-trade\.corp(?:[/?#]|$)/i
];

/** Escape a vCard 3.0 text value (RFC 2426 §4: backslash, comma, semicolon, newline). */
export function escapeVCardValue(value) {
  return String(value ?? "").trim().replace(/\\/g, "\\\\").replace(/\r\n|\r|\n/g, "\\n").replace(/,/g, "\\,").replace(/;/g, "\\;");
}

function clean(value) {
  if (value === undefined || value === null) return "";
  const s = String(value).trim();
  return s === "undefined" || s === "null" ? "" : s;
}

function splitName(fullName) {
  const parts = clean(fullName).split(/[\s\u3000]+/).filter(Boolean);
  if (parts.length === 0) return { family: "", given: "" };
  if (parts.length === 1) return { family: parts[0], given: "" };
  return { family: parts[0], given: parts.slice(1).join(" ") };
}

export class QrCodeService {
  /**
   * Generates a vCard 3.0 string (CRLF line endings, escaped values, empty fields omitted)
   */
  static formatVCard(profile = {}) {
    const fullName = clean(profile.fullName) || clean(profile.fullNameEn);
    const { family, given } = splitName(fullName);
    const kana = splitName(profile.fullNameKana);
    const esc = escapeVCardValue;
    const company = clean(profile.companyName);
    const department = clean(profile.department);
    const street = [clean(profile.address), clean(profile.building)].filter(Boolean).join(" ");
    const postal = clean(profile.postalCode).replace(/^\u3012\s*/, "");
    const lines = [
      "BEGIN:VCARD",
      "VERSION:3.0",
      `N:${esc(family)};${esc(given)};;;`,
      `FN:${esc(fullName)}`,
      kana.family ? `X-PHONETIC-LAST-NAME:${esc(kana.family)}` : "",
      kana.given ? `X-PHONETIC-FIRST-NAME:${esc(kana.given)}` : "",
      company || department ? `ORG:${esc(company)}${department ? ";" + esc(department) : ""}` : "",
      clean(profile.jobTitle) ? `TITLE:${esc(profile.jobTitle)}` : "",
      clean(profile.phone) ? `TEL;TYPE=WORK,VOICE:${esc(profile.phone)}` : "",
      clean(profile.mobile) ? `TEL;TYPE=CELL,VOICE:${esc(profile.mobile)}` : "",
      clean(profile.fax) ? `TEL;TYPE=WORK,FAX:${esc(profile.fax)}` : "",
      clean(profile.email) ? `EMAIL;TYPE=INTERNET,PREF:${esc(profile.email)}` : "",
      clean(profile.website) ? `URL:${esc(profile.website)}` : "",
      street || postal ? `ADR;TYPE=WORK:;;${esc(street)};;;${esc(postal)};` : "",
      "END:VCARD"
    ].filter(Boolean);
    return lines.join("\r\n");
  }
  /**
   * True when QR data points at a template's fictional fallback URL (e.g. https://tech.sample)
   */
  static isPlaceholderData(data) {
    const s = clean(data);
    if (!s) return true;
    return PLACEHOLDER_QR_PATTERNS.some((re) => re.test(s));
  }
  /**
   * Generates a high-resolution Data URL for the QR code
   */
  static async generateQrDataUrl(data, foregroundColor = "#000000", backgroundColor = "#ffffff") {
    try {
      return await QRCode.toDataURL(data, {
        errorCorrectionLevel: "M",
        margin: 1,
        width: 512,
        color: {
          dark: foregroundColor,
          light: backgroundColor
        }
      });
    } catch (err) {
      console.error("QR generation error:", err);
      return "";
    }
  }
}

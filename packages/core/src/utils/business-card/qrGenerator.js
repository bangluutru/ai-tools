import QRCode from "qrcode";
export class QrCodeService {
  /**
   * Generates a vCard 3.0 string from a CardholderProfile
   */
  static formatVCard(profile) {
    const lines = [
      "BEGIN:VCARD",
      "VERSION:3.0",
      `FN:${profile.fullName}`,
      profile.fullNameEn ? `X-PHONETIC-FIRST-NAME:${profile.fullNameEn}` : "",
      `ORG:${profile.companyName}`,
      profile.jobTitle ? `TITLE:${profile.jobTitle}` : "",
      profile.phone ? `TEL;TYPE=WORK,VOICE:${profile.phone}` : "",
      profile.mobile ? `TEL;TYPE=CELL,VOICE:${profile.mobile}` : "",
      profile.email ? `EMAIL;TYPE=PREF,INTERNET:${profile.email}` : "",
      profile.website ? `URL:${profile.website}` : "",
      profile.address ? `ADR;TYPE=WORK:;;${profile.address};;;${profile.postalCode || ""};Japan` : "",
      "END:VCARD"
    ].filter(Boolean);
    return lines.join("\r\n");
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

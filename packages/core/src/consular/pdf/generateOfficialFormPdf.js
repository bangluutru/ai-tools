/**
 * @file packages/core/src/consular/pdf/generateOfficialFormPdf.js
 * @description Trình tạo PDF BẢN NHÁP không dấu (ASCII) bằng pdf-lib.
 *
 * GIỚI HẠN: pdf-lib chỉ có font chuẩn WinAnsi; repo không có @pdf-lib/fontkit trong lockfile nên không nhúng được
 * font Unicode → tiếng Việt bị bỏ dấu, chữ Kanji bị thay bằng khoảng trắng. Vì vậy UI KHÔNG dùng hàm này để tải/in;
 * UI in bản xem trước HTML (hiển thị đúng tiếng Việt & tiếng Nhật) qua hộp thoại in của trình duyệt ("Lưu thành PDF").
 * Hàm này chỉ còn là tiện ích xuất bản nháp không dấu (isAsciiFallback: true). pdf-lib được import động.
 */

import { getFormTemplate } from './formTemplateRegistry.js';
import { buildFieldIndex, formatFormFieldValue, sanitizeFilenamePart } from './formValueFormat.js';
import { getFormById } from '../forms/index.js';

/**
 * Chuẩn hóa ký tự để tương thích an toàn với WinAnsi Font trong pdf-lib
 */
export function sanitizeForWinAnsi(text) {
  if (!text) return '';
  return String(text)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .replace(/〒/g, '')
    .replace(/[^\x20-\x7E\xA0-\xFF]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Tạo tên tệp tải về có cấu trúc chuẩn
 */
export function generatePdfFilename(formCode, formData) {
  // Mã như 'TP/HT-2020-TKKS.1' chứa '/', không được đưa nguyên vào tên file.
  const code = sanitizeFilenamePart(formCode || 'FORM').toUpperCase() || 'FORM';
  const rawName =
    formData?.applicantName ||
    formData?.requester_name ||
    formData?.mandatorName ||
    formData?.maleFullName ||
    formData?.father_name ||
    'DON_DE_NGHI';

  const cleanName = (sanitizeFilenamePart(sanitizeForWinAnsi(rawName)).toUpperCase() || 'DON_DE_NGHI').slice(0, 40);

  return `${code}_${cleanName}.pdf`;
}

/**
 * Tạo file PDF biểu mẫu chính thức từ dữ liệu đã điền
 * @param {object} params
 * @param {string} params.formId - ID biểu mẫu (form_passport_tk02, ...)
 * @param {object} params.formData - Dữ liệu biểu mẫu do người dùng nhập
 * @param {string} [params.lang='vi'] - Ngôn ngữ hiển thị
 * @returns {Promise<{ pdfBytes: Uint8Array, blob: Blob | null, objectUrl: string | null, filename: string, pageCount: number }>}
 */
/** Cắt văn bản thành nhiều dòng vừa độ rộng maxWidth. */
function wrapText(text, font, size, maxWidth) {
  const words = String(text || '').split(' ');
  const lines = [];
  let line = '';
  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word;
    if (font.widthOfTextAtSize(candidate, size) <= maxWidth || !line) {
      line = candidate;
    } else {
      lines.push(line);
      line = word;
    }
  }
  if (line) lines.push(line);
  // Từ quá dài (email, URL): cắt cứng theo ký tự
  return lines.flatMap((l) => {
    if (font.widthOfTextAtSize(l, size) <= maxWidth) return [l];
    const parts = [];
    let cur = '';
    for (const ch of l) {
      if (font.widthOfTextAtSize(cur + ch, size) > maxWidth && cur) {
        parts.push(cur);
        cur = ch;
      } else cur += ch;
    }
    if (cur) parts.push(cur);
    return parts;
  });
}

export async function generateOfficialFormPdf({ formId, formData = {}, officeCity = null }) {
  const { PDFDocument, rgb, StandardFonts } = await import('pdf-lib');
  const fieldIndex = buildFieldIndex(getFormById(formId));
  const fv = (id, fallback = '') => sanitizeForWinAnsi(formatFormFieldValue(fieldIndex.get(id), formData[id]) || fallback);
  const signaturePlace = sanitizeForWinAnsi(officeCity || '..........');
  const template = getFormTemplate(formId) || {
    id: formId,
    code: 'FORM',
    pageCount: 1,
    title: { vi: 'BIỂU MẪU LÃNH SỰ' },
  };

  const pdfDoc = await PDFDocument.create();
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontOblique = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);

  // Kích thước chuẩn A4 (Portrait) tính theo point: 595.28 x 841.89 pt (210 x 297 mm)
  const A4_WIDTH_PT = 595.28;
  const A4_HEIGHT_PT = 841.89;
  const MARGIN_LEFT = 45;
  const MARGIN_RIGHT = A4_WIDTH_PT - 45;
  const CONTENT_WIDTH = MARGIN_RIGHT - MARGIN_LEFT;

  if (template.code === 'TK02') {
    // ==========================================
    // TRANG 1: BẢN NHÁP BỐ CỤC TK02 (TT 31/2023/TT-BCA, sửa đổi bởi TT 69/2026/TT-BCA)
    // ==========================================
    const page1 = pdfDoc.addPage([A4_WIDTH_PT, A4_HEIGHT_PT]);
    let y = A4_HEIGHT_PT - 40;

    // Quốc hiệu & Tiêu ngữ
    page1.drawText('CONG HOA XA HOI CHU NGHIA VIET NAM', {
      x: MARGIN_LEFT + 70,
      y,
      size: 10.5,
      font: fontBold,
      color: rgb(0, 0, 0),
    });
    y -= 14;
    page1.drawText('Doc lap - Tu do - Hanh phuc', {
      x: MARGIN_LEFT + 120,
      y,
      size: 10,
      font: fontBold,
      color: rgb(0, 0, 0),
    });
    // Đường gạch dưới tiêu ngữ
    page1.drawLine({
      start: { x: MARGIN_LEFT + 115, y: y - 2 },
      end: { x: MARGIN_LEFT + 245, y: y - 2 },
      thickness: 0.8,
      color: rgb(0, 0, 0),
    });

    // Khung ảnh 4x6 cm ở góc trên phải
    const photoWidth = 90;
    const photoHeight = 115;
    const photoX = MARGIN_RIGHT - photoWidth;
    const photoY = A4_HEIGHT_PT - 40 - photoHeight;
    page1.drawRectangle({
      x: photoX,
      y: photoY,
      width: photoWidth,
      height: photoHeight,
      borderWidth: 0.8,
      borderColor: rgb(0.3, 0.3, 0.3),
      borderDashArray: [3, 2],
    });
    page1.drawText('ANH 4x6 cm', {
      x: photoX + 15,
      y: photoY + 55,
      size: 8.5,
      font: fontBold,
      color: rgb(0.4, 0.4, 0.4),
    });
    page1.drawText('(Mat nhin thang,', {
      x: photoX + 10,
      y: photoY + 40,
      size: 6.5,
      font: fontOblique,
      color: rgb(0.5, 0.5, 0.5),
    });
    page1.drawText('khong deo kinh)', {
      x: photoX + 12,
      y: photoY + 28,
      size: 6.5,
      font: fontOblique,
      color: rgb(0.5, 0.5, 0.5),
    });

    y -= 25;
    // Mã hiệu và căn cứ Thông tư 31/2023/TT-BCA
    page1.drawText('Mau TK02', {
      x: MARGIN_LEFT,
      y,
      size: 9.5,
      font: fontBold,
      color: rgb(0, 0, 0),
    });
    y -= 12;
    page1.drawText('(BAN NHAP THAM KHAO - to khai nop phai khai truc tuyen tai passport.mofa.gov.vn; mau theo TT 31/2023/TT-BCA sua doi boi TT 69/2026/TT-BCA)', {
      x: MARGIN_LEFT,
      y,
      size: 7.5,
      font: fontOblique,
      color: rgb(0.3, 0.3, 0.3),
    });

    y -= 30;
    // Tiêu đề tờ khai
    page1.drawText('TO KHAI DE NGHI CAP HO CHIEU PHO THONG O NUOC NGOAI', {
      x: MARGIN_LEFT + 30,
      y,
      size: 11.5,
      font: fontBold,
      color: rgb(0, 0, 0),
    });
    y -= 13;
    page1.drawText('(Dung cho cong dan Viet Nam dang o nuoc ngoai)', {
      x: MARGIN_LEFT + 130,
      y,
      size: 8.5,
      font: fontOblique,
      color: rgb(0.2, 0.2, 0.2),
    });

    y -= 20;
    // Kính gửi
    page1.drawText('Kinh gui: Co quan dai dien Viet Nam tai Nhat Ban', {
      x: MARGIN_LEFT + 100,
      y,
      size: 9.5,
      font: fontBold,
      color: rgb(0, 0, 0),
    });

    y -= 22;

    // Các trường dữ liệu trang 1
    const p1Fields = [
      { label: '1. Ho va ten (chu in hoa):', val: fv('applicantName') },
      { label: '2. Gioi tinh:', val: fv('gender') },
      { label: '3. Ngay, thang, nam sinh:', val: fv('dob') },
      { label: '4. Noi sinh (tinh/thanh pho hoac quoc gia):', val: fv('birthPlace') },
      { label: '5. So CCCD / so dinh danh ca nhan:', val: fv('idCardNumber') },
      { label: '   Ngay cap:', val: fv('idCardIssueDate') },
      { label: '   Noi cap:', val: fv('idCardIssuePlace') },
      { label: '6. Dan toc:', val: fv('ethnic') },
      { label: '7. Ton giao:', val: fv('religion') },
      { label: '8. Dia chi thuong tru truoc khi xuat canh tai VN:', val: fv('permanentAddressVN') },
      { label: '9. Dia chi cu tru hien nay tai Nhat Ban:', val: fv('residenceAddressJP') },
      { label: '10. So dien thoai lien he:', val: fv('phoneNumber') },
      { label: '    Email thong bao:', val: fv('email') },
      { label: '11. Nghe nghiep / Noi lam viec tai Nhat Ban:', val: fv('occupation') },
      { label: '12. Ho ten cha:', val: fv('fatherName') },
      { label: '    Ho ten me:', val: fv('motherName') },
      { label: '    Ho ten vo/chong:', val: fv('spouseName') },
      { label: '13. Ho chieu cap lan gan nhat (so):', val: fv('oldPassportNumber') },
      { label: '    Ngay cap:', val: fv('oldPassportIssueDate') },
      { label: '    Noi cap:', val: fv('oldPassportIssuePlace') },
      { label: '14. Noi dung de nghi:', val: fv('requestType') },
      { label: '    Loai ho chieu:', val: fv('passportChipOption') },
    ];

    p1Fields.forEach((f) => {
      page1.drawText(f.label, {
        x: MARGIN_LEFT,
        y,
        size: 8.5,
        font: fontBold,
        color: rgb(0.1, 0.1, 0.1),
      });

      const textVal = f.val || '....................................................................';
      const lines = wrapText(textVal, fontRegular, 8.5, MARGIN_RIGHT - (MARGIN_LEFT + 190));
      lines.forEach((line, i) => {
        page1.drawText(line, {
          x: MARGIN_LEFT + 190,
          y: y - i * 11,
          size: 8.5,
          font: fontRegular,
          color: rgb(0, 0, 0),
        });
      });
      const lastY = y - (lines.length - 1) * 11;

      // Kẻ đường gạch mờ hành chính
      page1.drawLine({
        start: { x: MARGIN_LEFT + 190, y: lastY - 2 },
        end: { x: MARGIN_RIGHT, y: lastY - 2 },
        thickness: 0.4,
        color: rgb(0.8, 0.8, 0.8),
      });

      y = lastY - 19;
    });

    // Đánh số trang 1
    page1.drawText('Trang 1 / 2', {
      x: A4_WIDTH_PT / 2 - 25,
      y: 25,
      size: 8,
      font: fontRegular,
      color: rgb(0.5, 0.5, 0.5),
    });

    // ==========================================
    // TRANG 2: MẪU TK02 — Ý KIẾN & XÁC NHẬN
    // ==========================================
    const page2 = pdfDoc.addPage([A4_WIDTH_PT, A4_HEIGHT_PT]);
    let y2 = A4_HEIGHT_PT - 45;

    page2.drawText('BAN NHAP TK02 - TRANG 2 (Y KIEN & CAM DOAN)', {
      x: MARGIN_LEFT + 40,
      y: y2,
      size: 10,
      font: fontBold,
      color: rgb(0, 0, 0),
    });
    y2 -= 30;

    // Mục 15: Ý kiến của cha, mẹ hoặc người giám hộ
    page2.drawText('15. Y kien cua cha, me hoac nguoi giam ho (neu co):', {
      x: MARGIN_LEFT,
      y: y2,
      size: 9,
      font: fontBold,
      color: rgb(0.1, 0.1, 0.1),
    });
    y2 -= 13;
    page2.drawText('(Ap dung doi voi nguoi chua du 14 tuoi, nguoi mat nang luc hanh vi dan su)', {
      x: MARGIN_LEFT + 15,
      y: y2,
      size: 7.5,
      font: fontOblique,
      color: rgb(0.4, 0.4, 0.4),
    });
    y2 -= 18;

    // Kẻ các dòng kẻ ghi ý kiến
    for (let i = 0; i < 4; i++) {
      page2.drawLine({
        start: { x: MARGIN_LEFT + 15, y: y2 },
        end: { x: MARGIN_RIGHT, y: y2 },
        thickness: 0.5,
        color: rgb(0.7, 0.7, 0.7),
        dashArray: [2, 2],
      });
      y2 -= 18;
    }

    y2 -= 15;
    // Lời cam đoan
    page2.drawText('Loi cam doan cua nguoi de nghi cap ho chieu:', {
      x: MARGIN_LEFT,
      y: y2,
      size: 9,
      font: fontBold,
      color: rgb(0.1, 0.1, 0.1),
    });
    y2 -= 14;
    page2.drawText(
      'Toi xin cam doan nhung loi khai tren la dung su that va hoan toan chiu trach nhiem truoc phap luat.',
      {
        x: MARGIN_LEFT,
        y: y2,
        size: 8.5,
        font: fontOblique,
        color: rgb(0.2, 0.2, 0.2),
      }
    );

    y2 -= 40;
    // Chữ ký người đề nghị
    page2.drawText(`${signaturePlace}, ngay ..... thang ..... nam 20...`, {
      x: MARGIN_RIGHT - 210,
      y: y2,
      size: 8.5,
      font: fontOblique,
      color: rgb(0.3, 0.3, 0.3),
    });
    y2 -= 15;
    page2.drawText('NGUOI DE NGHI', {
      x: MARGIN_RIGHT - 160,
      y: y2,
      size: 9.5,
      font: fontBold,
      color: rgb(0, 0, 0),
    });
    y2 -= 12;
    page2.drawText('(Ky, ghi ro ho ten)', {
      x: MARGIN_RIGHT - 165,
      y: y2,
      size: 7.5,
      font: fontOblique,
      color: rgb(0.4, 0.4, 0.4),
    });

    const applicantSignatureName = sanitizeForWinAnsi(formData.applicantName || '');
    if (applicantSignatureName) {
      page2.drawText(applicantSignatureName, {
        x: MARGIN_RIGHT - 175,
        y: y2 - 50,
        size: 9.5,
        font: fontBold,
        color: rgb(0, 0, 0),
      });
    }

    // Khung xác nhận của cơ quan đại diện
    const boxY = 120;
    const boxHeight = 140;
    page2.drawRectangle({
      x: MARGIN_LEFT,
      y: boxY,
      width: CONTENT_WIDTH,
      height: boxHeight,
      borderWidth: 0.8,
      borderColor: rgb(0.2, 0.2, 0.2),
    });

    page2.drawText('XAC NHAN CUA CO QUAN DAI DIEN VIET NAM TAI NHAT BAN', {
      x: MARGIN_LEFT + 60,
      y: boxY + boxHeight - 20,
      size: 9,
      font: fontBold,
      color: rgb(0, 0, 0),
    });
    page2.drawText('(Phan danh cho can bo tiep nhan ho so kiem tra va xac nhan theo quy dinh)', {
      x: MARGIN_LEFT + 75,
      y: boxY + boxHeight - 33,
      size: 7.5,
      font: fontOblique,
      color: rgb(0.4, 0.4, 0.4),
    });

    page2.drawText('Can bo tiep nhan: .......................................', {
      x: MARGIN_LEFT + 25,
      y: boxY + 40,
      size: 8.5,
      font: fontRegular,
      color: rgb(0.2, 0.2, 0.2),
    });
    page2.drawText('Nguoi co tham quyen ky duyet: ..........................', {
      x: MARGIN_RIGHT - 240,
      y: boxY + 40,
      size: 8.5,
      font: fontRegular,
      color: rgb(0.2, 0.2, 0.2),
    });

    // Đánh số trang 2
    page2.drawText('Trang 2 / 2', {
      x: A4_WIDTH_PT / 2 - 25,
      y: 25,
      size: 8,
      font: fontRegular,
      color: rgb(0.5, 0.5, 0.5),
    });
  } else {
    // ==========================================
    // CÁC BIỂU MẪU ĐƠN TRANG KHÁC (1 TRANG A4 CHUẨN)
    // ==========================================
    const page = pdfDoc.addPage([A4_WIDTH_PT, A4_HEIGHT_PT]);
    let y = A4_HEIGHT_PT - 45;

    // Quốc hiệu & Tiêu ngữ
    page.drawText('CONG HOA XA HOI CHU NGHIA VIET NAM', {
      x: A4_WIDTH_PT / 2 - 110,
      y,
      size: 11,
      font: fontBold,
      color: rgb(0, 0, 0),
    });
    y -= 14;
    page.drawText('Doc lap - Tu do - Hanh phuc', {
      x: A4_WIDTH_PT / 2 - 65,
      y,
      size: 10,
      font: fontBold,
      color: rgb(0, 0, 0),
    });
    page.drawLine({
      start: { x: A4_WIDTH_PT / 2 - 70, y: y - 2 },
      end: { x: A4_WIDTH_PT / 2 + 70, y: y - 2 },
      thickness: 0.8,
      color: rgb(0, 0, 0),
    });

    y -= 35;
    const formTitle = sanitizeForWinAnsi(template.title?.vi || template.title || 'BIEU MAU HANH CHINH');
    page.drawText(formTitle.toUpperCase(), {
      x: MARGIN_LEFT + 30,
      y,
      size: 11.5,
      font: fontBold,
      color: rgb(0, 0, 0),
    });
    y -= 14;
    page.drawText(`Can cu: ${sanitizeForWinAnsi(template.standardBasis || template.legal_basis || '')}`, {
      x: MARGIN_LEFT + 40,
      y,
      size: 8,
      font: fontOblique,
      color: rgb(0.3, 0.3, 0.3),
    });

    y -= 30;

    // Render danh sách các trường theo định nghĩa form (nhãn thay vì khóa nội bộ, enum → nhãn, ngày dd/mm/yyyy)
    const entries = fieldIndex.size
      ? Array.from(fieldIndex.values()).map((f) => [f.label?.vi || f.label || f.id, formatFormFieldValue(f, formData[f.id])])
      : Object.entries(formData).map(([k, v]) => [k, formatFormFieldValue(null, v)]);
    entries.forEach(([label, val]) => {
      if (!val || y < 130) return;
      const labelLines = wrapText(sanitizeForWinAnsi(label) + ':', fontBold, 8.5, 140);
      const valLines = wrapText(sanitizeForWinAnsi(val), fontRegular, 8.5, MARGIN_RIGHT - (MARGIN_LEFT + 150));
      labelLines.forEach((line, i) =>
        page.drawText(line, { x: MARGIN_LEFT, y: y - i * 11, size: 8.5, font: fontBold, color: rgb(0.2, 0.2, 0.2) })
      );
      valLines.forEach((line, i) =>
        page.drawText(line, { x: MARGIN_LEFT + 150, y: y - i * 11, size: 8.5, font: fontRegular, color: rgb(0, 0, 0) })
      );
      const rows = Math.max(labelLines.length, valLines.length);
      const lastY = y - (rows - 1) * 11;
      page.drawLine({
        start: { x: MARGIN_LEFT + 150, y: lastY - 2 },
        end: { x: MARGIN_RIGHT, y: lastY - 2 },
        thickness: 0.4,
        color: rgb(0.8, 0.8, 0.8),
      });
      y = lastY - 20;
    });

    page.drawText(`${signaturePlace}, ngay ..... thang ..... nam 20...`, {
      x: MARGIN_RIGHT - 190,
      y: 115,
      size: 8.5,
      font: fontOblique,
      color: rgb(0.3, 0.3, 0.3),
    });

    // Chữ ký
    page.drawText('Nguoi lam don (Ky, ghi ro ho ten)', {
      x: MARGIN_RIGHT - 180,
      y: 100,
      size: 9,
      font: fontBold,
      color: rgb(0, 0, 0),
    });
  }

  const pdfBytes = await pdfDoc.save();
  const filename = generatePdfFilename(template.code, formData);

  let blob = null;
  let objectUrl = null;
  if (typeof Blob !== 'undefined') {
    blob = new Blob([pdfBytes], { type: 'application/pdf' });
    if (typeof URL !== 'undefined' && typeof URL.createObjectURL === 'function') {
      objectUrl = URL.createObjectURL(blob);
    }
  }

  return {
    pdfBytes,
    blob,
    objectUrl,
    filename,
    pageCount: pdfDoc.getPageCount(),
    isAsciiFallback: true,
  };
}

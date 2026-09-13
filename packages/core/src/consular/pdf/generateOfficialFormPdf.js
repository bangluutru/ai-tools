/**
 * @file packages/core/src/consular/pdf/generateOfficialFormPdf.js
 * @description Trình tạo tài liệu PDF biểu mẫu lãnh sự chính thức sử dụng pdf-lib (SSOT).
 * Đảm bảo kích thước A4 chuẩn (595.28 x 841.89 pt), vẽ đúng cấu trúc biểu mẫu theo Thông tư / Nghị định quy định,
 * hỗ trợ form nhiều trang (TK02 = 2 trang) và trả về bytes, Blob, ObjectURL.
 */

import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { getFormTemplate } from './formTemplateRegistry.js';
import { TK02_PAGE_MAPPING } from './pdfFieldMapping.js';

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
  const code = (formCode || 'FORM').toUpperCase();
  const rawName =
    formData?.applicantName ||
    formData?.requester_name ||
    formData?.mandatorName ||
    formData?.maleFullName ||
    formData?.father_name ||
    'DON_DE_NGHI';

  const cleanName = sanitizeForWinAnsi(rawName)
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '_')
    .replace(/_+/g, '_')
    .slice(0, 40);

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
export async function generateOfficialFormPdf({ formId, formData = {}, lang = 'vi' }) {
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
    // TRANG 1: MẪU TK02 — THÔNG TƯ 31/2023/TT-BCA
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
    page1.drawText('(Ban hanh kem theo Thong tu so 31/2023/TT-BCA cua Bo Cong an)', {
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
      { label: '1. Ho va ten (chu in hoa):', val: sanitizeForWinAnsi(formData.applicantName || '') },
      { label: '2. Gioi tinh:', val: sanitizeForWinAnsi(formData.gender || 'Nam') },
      { label: '3. Ngay, thang, nam sinh:', val: sanitizeForWinAnsi(formData.dob || '') },
      { label: '4. Noi sinh (tinh/thanh pho hoac quoc gia):', val: sanitizeForWinAnsi(formData.birthPlace || '') },
      { label: '5. So CCCD/CMND/Dinh danh:', val: sanitizeForWinAnsi(formData.idCardNumber || '') },
      { label: '   Ngay cap:', val: sanitizeForWinAnsi(formData.idCardIssueDate || '') },
      { label: '   Noi cap:', val: sanitizeForWinAnsi(formData.idCardIssuePlace || '') },
      { label: '6. Dan toc:', val: sanitizeForWinAnsi(formData.ethnic || 'Kinh') },
      { label: '7. Ton giao:', val: sanitizeForWinAnsi(formData.religion || 'Khong') },
      { label: '8. Dia chi thuong tru truoc khi xuat canh tai VN:', val: sanitizeForWinAnsi(formData.permanentAddressVN || '') },
      { label: '9. Dia chi cu tru hien nay tai Nhat Ban:', val: sanitizeForWinAnsi(formData.residenceAddressJP || '') },
      { label: '10. So dien thoai lien he:', val: sanitizeForWinAnsi(formData.phoneNumber || '') },
      { label: '    Email thong bao:', val: sanitizeForWinAnsi(formData.email || '') },
      { label: '11. Nghe nghiep / Noi lam viec tai Nhat Ban:', val: sanitizeForWinAnsi(formData.occupation || '') },
      { label: '12. Ho ten cha:', val: sanitizeForWinAnsi(formData.fatherName || '') },
      { label: '    Ho ten me:', val: sanitizeForWinAnsi(formData.motherName || '') },
      { label: '    Ho ten vo/chong:', val: sanitizeForWinAnsi(formData.spouseName || '') },
      { label: '13. Ho chieu cap lan gan nhat (so):', val: sanitizeForWinAnsi(formData.oldPassportNumber || '') },
      { label: '    Ngay cap:', val: sanitizeForWinAnsi(formData.oldPassportIssueDate || '') },
      { label: '    Noi cap:', val: sanitizeForWinAnsi(formData.oldPassportIssuePlace || '') },
      { label: '14. Noi dung de nghi:', val: sanitizeForWinAnsi(formData.requestType || 'Cap doi ho chieu') },
      { label: '    Loai ho chieu:', val: formData.passportChipOption === 'khong_gan_chip' ? 'Khong gan chip' : 'Co gan chip dien tu' },
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
      page1.drawText(textVal, {
        x: MARGIN_LEFT + 190,
        y,
        size: 8.5,
        font: fontRegular,
        color: rgb(0, 0, 0),
      });

      // Kẻ đường gạch mờ hành chính
      page1.drawLine({
        start: { x: MARGIN_LEFT + 190, y: y - 2 },
        end: { x: MARGIN_RIGHT, y: y - 2 },
        thickness: 0.4,
        color: rgb(0.8, 0.8, 0.8),
      });

      y -= 19;
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

    page2.drawText('MAU TK02 — TRANG 2 (Y KIEN & XAC NHAN CHINH THUC)', {
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
    page2.drawText('Tokyo/Osaka, ngay ..... thang ..... nam 202...', {
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

    // Render danh sách các trường
    Object.entries(formData).forEach(([key, val]) => {
      if (!val || typeof val !== 'string') return;
      page.drawText(`${key}:`, {
        x: MARGIN_LEFT,
        y,
        size: 8.5,
        font: fontBold,
        color: rgb(0.2, 0.2, 0.2),
      });

      page.drawText(sanitizeForWinAnsi(val), {
        x: MARGIN_LEFT + 150,
        y,
        size: 8.5,
        font: fontRegular,
        color: rgb(0, 0, 0),
      });

      page.drawLine({
        start: { x: MARGIN_LEFT + 150, y: y - 2 },
        end: { x: MARGIN_RIGHT, y: y - 2 },
        thickness: 0.4,
        color: rgb(0.8, 0.8, 0.8),
      });

      y -= 20;
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
  };
}

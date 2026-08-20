/**
 * Dựng "GIẤY ĐỀ NGHỊ THANH TOÁN" theo đúng biểu mẫu mà chủ sở hữu đang dùng
 * (sổ ĐN THANH TOÁN 2022~2026): khổ A4 dọc, bảy cột A..G, Times New Roman 12,
 * khối tiêu đề đơn vị → tiêu đề giấy → thông tin người đề nghị → bảng kê chi
 * tiết có viền → tổng cộng → link hóa đơn → số tiền bằng chữ → khối ký.
 *
 * Mỗi pháp nhân đứng tên trên hóa đơn là một giấy riêng, nhưng cả tháng nằm
 * chung một sheet và xếp nối tiếp nhau đúng như sổ gốc — mỗi giấy được ngắt
 * sang một trang in riêng.
 */

import {
  A4_PAPER_SIZE,
  downloadWorkbook,
  loadExcelJs,
  MONEY_FORMAT,
} from '../excelReport.js';
import { numberToWordsVN } from './numberToWords.js';

const FONT_NAME = 'Times New Roman';
const BASE_SIZE = 12;
const TITLE_SIZE = 16;

/** Bề rộng cột lấy đúng từ biểu mẫu gốc. */
const COLUMN_WIDTHS = [5.75, 16.13, 11.88, 12.63, 10.63, 12.63, 13.88];
const COLUMN_COUNT = COLUMN_WIDTHS.length;
const LAST_COLUMN = 'G';

const THIN = { style: 'thin', color: { argb: 'FF000000' } };
const BOX_BORDER = Object.freeze({ top: THIN, left: THIN, bottom: THIN, right: THIN });
/**
 * Biểu mẫu gốc tô nền trắng toàn vùng in để đường lưới của Excel không lẫn vào
 * khung bảng. Giữ nguyên cách làm đó thay vì tắt lưới toàn sheet.
 */
const PAPER_FILL = Object.freeze({ type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFFFF' } });

/** Số dòng trống chừa sẵn để ký tay giữa "(Ký, họ tên)" và dòng tên. */
const SIGNING_GAP_ROWS = 5;
/** Số dòng trống giữa hai giấy đề nghị nối tiếp nhau, lấy theo sổ gốc. */
const BLOCK_SPACING_ROWS = 3;

const font = (options = {}) => ({
  name: FONT_NAME,
  size: options.size ?? BASE_SIZE,
  bold: Boolean(options.bold),
  italic: Boolean(options.italic),
  underline: Boolean(options.underline),
});

const pad2 = (value) => String(value).padStart(2, '0');

export function formatFormDateLong(date) {
  return `Ngày ${pad2(date.getDate())} tháng ${pad2(date.getMonth() + 1)} năm ${date.getFullYear()}`;
}

/**
 * Tên sheet mặc định là kỳ lập chứng từ dạng YYMM ("2606"), giống cách sổ gốc
 * đặt tên từng tháng.
 */
export function monthSheetName(date) {
  return `${pad2(date.getFullYear() % 100)}${pad2(date.getMonth() + 1)}`;
}

/** Sheet name của Excel: tối đa 31 ký tự và không chứa : \ / ? * [ ] */
function sanitizeSheetName(label) {
  const cleaned = String(label ?? '')
    .replace(/[:\\/?*[\]]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return (cleaned || 'Đề nghị thanh toán').slice(0, 31);
}

/** Nền trắng + font nền cho toàn bộ bề ngang biểu mẫu trên một dòng. */
function paintRow(sheet, rowNumber) {
  const row = sheet.getRow(rowNumber);
  for (let column = 1; column <= COLUMN_COUNT; column += 1) {
    const cell = row.getCell(column);
    cell.fill = PAPER_FILL;
    cell.font = font();
  }
  return row;
}

function put(sheet, rowNumber, column, value, style = {}) {
  const cell = sheet.getRow(rowNumber).getCell(column);
  cell.value = value;
  cell.font = font(style);
  cell.alignment = {
    horizontal: style.align ?? 'left',
    vertical: style.vertical ?? 'middle',
    wrapText: Boolean(style.wrap),
  };
  if (style.numFmt) cell.numFmt = style.numFmt;
  return cell;
}

/** Kẻ viền cho các cột A..G (hoặc dải cột chỉ định) của một dòng đã merge. */
function boxRow(sheet, rowNumber, from = 1, to = COLUMN_COUNT) {
  const row = sheet.getRow(rowNumber);
  for (let column = from; column <= to; column += 1) {
    row.getCell(column).border = BOX_BORDER;
  }
}

/**
 * Ghi một Giấy đề nghị thanh toán bắt đầu tại `startRow`.
 * Trả về dòng cuối cùng đã dùng để người gọi biết chỗ đặt giấy tiếp theo.
 */
export function writePaymentRequestForm(sheet, startRow, form, options = {}) {
  const issuedAt = options.issuedAt ?? new Date();
  const rows = Array.isArray(form.rows) ? form.rows : [];
  const dataRowCount = Math.max(rows.length, 1);

  const headerRow = startRow + 12;
  const firstDataRow = headerRow + 1;
  const lastDataRow = headerRow + dataRowCount;
  const totalRow = lastDataRow + 1;
  const linkRow = totalRow + 1;
  const amountRow = totalRow + 3;
  const wordsRow = amountRow + 1;
  const signatureTitleRow = amountRow + 3;
  const signatureHintRow = signatureTitleRow + 1;
  const signatureNameRow = signatureTitleRow + 1 + SIGNING_GAP_ROWS;

  for (let rowNumber = startRow; rowNumber <= signatureNameRow; rowNumber += 1) {
    paintRow(sheet, rowNumber);
  }

  // 1. Đơn vị đứng tên chứng từ.
  put(sheet, startRow, 1, form.company?.name ?? '', { bold: true, wrap: true });
  sheet.mergeCells(`A${startRow}:${LAST_COLUMN}${startRow}`);
  put(sheet, startRow + 1, 1, form.company?.address ?? '', { wrap: true });
  sheet.mergeCells(`A${startRow + 1}:${LAST_COLUMN}${startRow + 1}`);

  // 2. Tiêu đề và ngày lập.
  put(sheet, startRow + 3, 1, 'GIẤY ĐỀ NGHỊ THANH TOÁN', { bold: true, size: TITLE_SIZE, align: 'center' });
  sheet.mergeCells(`A${startRow + 3}:${LAST_COLUMN}${startRow + 3}`);
  put(sheet, startRow + 4, 5, formatFormDateLong(issuedAt), { italic: true, align: 'right' });
  sheet.mergeCells(`E${startRow + 4}:${LAST_COLUMN}${startRow + 4}`);

  // 3. Người nhận đề nghị và thông tin người đề nghị.
  put(sheet, startRow + 6, 1, `Kính gửi: ${form.company?.name ?? ''}`, { bold: true, italic: true });
  put(sheet, startRow + 8, 1, 'Người đề nghị thanh toán: ', { bold: true });
  put(sheet, startRow + 8, 4, options.requester ?? '');
  put(sheet, startRow + 9, 1, 'Bộ phận (Hoặc địa chỉ):', { bold: true });
  put(sheet, startRow + 9, 4, options.department ?? '');
  put(sheet, startRow + 10, 1, 'Nội dung thanh toán', { bold: true });
  sheet.mergeCells(`A${startRow + 10}:C${startRow + 10}`);
  put(sheet, startRow + 10, 4, form.content ?? '');

  // 4. Bảng kê chi tiết.
  put(sheet, headerRow, 1, 'STT', { bold: true, align: 'center' });
  put(sheet, headerRow, 2, 'Ngày tháng', { bold: true, align: 'center' });
  put(sheet, headerRow, 3, 'Nội dung', { bold: true, align: 'center' });
  sheet.mergeCells(`C${headerRow}:E${headerRow}`);
  put(sheet, headerRow, 6, 'Số tiền', { bold: true, align: 'center', numFmt: MONEY_FORMAT });
  put(sheet, headerRow, 7, 'Hoá đơn', { bold: true, align: 'center' });
  boxRow(sheet, headerRow);

  let total = 0;
  for (let index = 0; index < dataRowCount; index += 1) {
    const entry = rows[index];
    const rowNumber = firstDataRow + index;

    if (entry) {
      put(sheet, rowNumber, 1, index + 1, { align: 'center' });
      put(sheet, rowNumber, 2, entry.date ?? '', { align: 'center' });
      put(sheet, rowNumber, 3, entry.description ?? '', { wrap: true });
      put(sheet, rowNumber, 6, Number(entry.amount) || 0, { align: 'right', numFmt: MONEY_FORMAT });
      put(sheet, rowNumber, 7, entry.invoiceNo ?? '', { align: 'center' });
      total += Number(entry.amount) || 0;
    } else {
      put(sheet, rowNumber, 3, '', { wrap: true });
      put(sheet, rowNumber, 6, null, { align: 'right', numFmt: MONEY_FORMAT });
    }
    sheet.mergeCells(`C${rowNumber}:E${rowNumber}`);
    boxRow(sheet, rowNumber);
  }

  // 5. Tổng cộng — để công thức để người duyệt kiểm tra được ngay trên file.
  put(sheet, totalRow, 1, 'Tổng cộng', { bold: true, align: 'center' });
  sheet.mergeCells(`A${totalRow}:B${totalRow}`);
  put(sheet, totalRow, 3, '', {});
  sheet.mergeCells(`C${totalRow}:E${totalRow}`);
  const totalCell = sheet.getRow(totalRow).getCell(6);
  totalCell.value = { formula: `SUM(F${firstDataRow}:F${lastDataRow})`, result: total };
  totalCell.font = font({ bold: true });
  totalCell.alignment = { horizontal: 'right', vertical: 'middle' };
  totalCell.numFmt = MONEY_FORMAT;
  boxRow(sheet, totalRow);

  // 6. Link hóa đơn: ô nhãn cao hai dòng đúng như biểu mẫu gốc.
  put(sheet, linkRow, 1, 'Link Hoá đơn', { bold: true, align: 'center' });
  sheet.mergeCells(`A${linkRow}:B${linkRow + 1}`);
  const link = String(options.invoiceLink ?? '').trim();
  const linkCell = sheet.getRow(linkRow).getCell(6);
  if (/^https?:\/\//i.test(link)) {
    linkCell.value = { text: link, hyperlink: link };
  } else {
    linkCell.value = link;
  }
  linkCell.font = font({ underline: Boolean(link) });
  linkCell.alignment = { horizontal: 'right', vertical: 'middle' };
  for (const rowNumber of [linkRow, linkRow + 1]) {
    put(sheet, rowNumber, 3, '', {});
    sheet.mergeCells(`C${rowNumber}:E${rowNumber}`);
    sheet.mergeCells(`F${rowNumber}:${LAST_COLUMN}${rowNumber}`);
    boxRow(sheet, rowNumber);
  }

  // 7. Số tiền và số tiền bằng chữ.
  put(sheet, amountRow, 1, 'Số tiền:', { bold: true, align: 'right' });
  sheet.mergeCells(`A${amountRow}:B${amountRow}`);
  const amountCell = sheet.getRow(amountRow).getCell(3);
  amountCell.value = { formula: `F${totalRow}`, result: total };
  amountCell.font = font({ bold: true });
  amountCell.alignment = { horizontal: 'left', vertical: 'middle' };
  amountCell.numFmt = MONEY_FORMAT;
  sheet.mergeCells(`C${amountRow}:E${amountRow}`);

  put(sheet, wordsRow, 1, `(Viết bằng chữ: ${numberToWordsVN(total, { suffix: 'đồng chẵn./.' })})`, {
    italic: true,
    wrap: true,
  });
  sheet.mergeCells(`A${wordsRow}:${LAST_COLUMN}${wordsRow}`);

  // 8. Khối ký.
  put(sheet, signatureTitleRow, 1, 'Người đề nghị thanh toán', { bold: true, italic: true, align: 'center', vertical: 'top' });
  put(sheet, signatureTitleRow, 6, 'Kế toán', { bold: true, italic: true, align: 'center', vertical: 'top' });
  put(sheet, signatureHintRow, 1, '(Ký, họ tên)', { italic: true, align: 'center', vertical: 'top' });
  put(sheet, signatureHintRow, 6, '(Ký, họ tên)', { italic: true, align: 'center', vertical: 'top' });
  for (const rowNumber of [signatureTitleRow, signatureHintRow]) {
    sheet.mergeCells(`A${rowNumber}:B${rowNumber}`);
    sheet.mergeCells(`C${rowNumber}:E${rowNumber}`);
    sheet.mergeCells(`F${rowNumber}:${LAST_COLUMN}${rowNumber}`);
  }
  for (let rowNumber = signatureHintRow + 1; rowNumber < signatureNameRow; rowNumber += 1) {
    sheet.mergeCells(`C${rowNumber}:E${rowNumber}`);
  }

  const requesterSignature = options.requesterSignature || (options.requester ?? '').toUpperCase();
  put(sheet, signatureNameRow, 1, requesterSignature, { bold: true, align: 'center' });
  put(sheet, signatureNameRow, 6, (options.accountant ?? '').toUpperCase(), { bold: true, align: 'center' });
  sheet.mergeCells(`A${signatureNameRow}:B${signatureNameRow}`);
  sheet.mergeCells(`F${signatureNameRow}:${LAST_COLUMN}${signatureNameRow}`);

  return { lastRow: signatureNameRow, total };
}

function prepareSheet(workbook, name) {
  const sheet = workbook.addWorksheet(name);
  COLUMN_WIDTHS.forEach((width, index) => {
    sheet.getColumn(index + 1).width = width;
  });
  sheet.pageSetup = {
    paperSize: A4_PAPER_SIZE,
    orientation: 'portrait',
    fitToPage: true,
    fitToWidth: 1,
    fitToHeight: 0,
    margins: { left: 0.7, right: 0.7, top: 0.75, bottom: 0.75, header: 0.3, footer: 0.3 },
  };
  return sheet;
}

/**
 * Dựng workbook một sheet cho cả kỳ: mỗi công ty một giấy đề nghị, xếp nối
 * tiếp nhau và ngắt trang giữa hai giấy để in ra vẫn là các tờ rời.
 *
 * `forms` là danh sách đã gom nhóm theo công ty:
 * { company: { name, address, taxCode }, content, rows }.
 */
export async function buildPaymentRequestForms(forms, options = {}) {
  const issuedAt = options.issuedAt ?? new Date();
  const ExcelJS = await loadExcelJs();
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'AI-Tools • Giấy đề nghị thanh toán';
  workbook.created = issuedAt;

  const formList = Array.isArray(forms) && forms.length > 0 ? forms : [{ company: {}, rows: [] }];
  const sheet = prepareSheet(workbook, sanitizeSheetName(options.sheetName || monthSheetName(issuedAt)));
  const totals = [];
  let startRow = 1;

  formList.forEach((form, index) => {
    const { lastRow, total } = writePaymentRequestForm(sheet, startRow, form, { ...options, issuedAt });
    totals.push({
      company: form.company?.name ?? '',
      total,
      count: form.rows?.length ?? 0,
      startRow,
      lastRow,
    });

    if (index < formList.length - 1) {
      sheet.getRow(lastRow).addPageBreak();
      startRow = lastRow + 1 + BLOCK_SPACING_ROWS;
    }
  });

  return {
    workbook,
    sheetName: sheet.name,
    totals,
    grandTotal: totals.reduce((sum, item) => sum + item.total, 0),
  };
}

export async function exportPaymentRequestForms(forms, options = {}) {
  const issuedAt = options.issuedAt ?? new Date();
  const { workbook, sheetName } = await buildPaymentRequestForms(forms, { ...options, issuedAt });
  await downloadWorkbook(workbook, `Giay_de_nghi_thanh_toan_${sheetName}.xlsx`);
}

export { COLUMN_WIDTHS };

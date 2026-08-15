import {
  addTitleBlock,
  applyPrintSetup,
  BOX_BORDER,
  columnLetter,
  downloadWorkbook,
  loadExcelJs,
  MONEY_FORMAT,
  REPORT_COLORS,
  setColumnWidths,
  styleDataRow,
  styleHeaderRow,
  styleTotalRow,
} from '../excelReport.js';
import { numberToWordsVN } from './numberToWords.js';

const COLUMNS = [
  { header: 'STT', width: 6, center: true },
  { header: 'Ngày hóa đơn', width: 14, center: true },
  { header: 'Số hóa đơn', width: 16, center: true },
  { header: 'Đơn vị bán hàng', width: 38 },
  { header: 'Mã số thuế', width: 15, center: true },
  { header: 'Tiền trước thuế', width: 18, money: true },
  { header: 'Tiền thuế GTGT', width: 17, money: true },
  { header: 'Tổng thanh toán', width: 20, money: true },
  { header: 'Ghi chú', width: 26 },
];

const MONEY_COLUMNS = COLUMNS
  .map((column, index) => (column.money ? index + 1 : null))
  .filter((value) => value !== null);
const CENTER_COLUMNS = COLUMNS
  .map((column, index) => (column.center ? index + 1 : null))
  .filter((value) => value !== null);

const COLUMN_COUNT = COLUMNS.length;
const LAST_COLUMN = columnLetter(COLUMN_COUNT);

function formatDate(date) {
  const pad = (value) => String(value).padStart(2, '0');
  return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()}`;
}

function mergedRow(sheet, text, style = {}) {
  const row = sheet.addRow([text]);
  sheet.mergeCells(`A${row.number}:${LAST_COLUMN}${row.number}`);
  const cell = row.getCell(1);
  cell.font = {
    name: 'Times New Roman',
    size: style.size ?? 11,
    bold: style.bold ?? false,
    italic: style.italic ?? false,
    color: style.color ? { argb: style.color } : undefined,
  };
  cell.alignment = { horizontal: style.align ?? 'left', vertical: 'middle', wrapText: style.wrap ?? false };
  if (style.height) row.height = style.height;
  return row;
}

/**
 * Dựng bảng kê đề nghị thanh toán dạng biểu mẫu Việt Nam: quốc hiệu, tiêu đề,
 * bảng chi tiết có tổng cộng, số tiền bằng chữ và khối ký duyệt — in vừa khổ A4
 * nằm ngang.
 */
export async function buildPaymentRequestWorkbook(invoices, options = {}) {
  const generatedAt = options.generatedAt ?? new Date();
  const ExcelJS = await loadExcelJs();
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'AI-Tools • Đề nghị thanh toán';
  workbook.created = generatedAt;

  const sheet = workbook.addWorksheet('Bảng kê ĐNTT', { views: [{ showGridLines: false }] });
  setColumnWidths(sheet, COLUMNS.map((column) => column.width));

  const titleLines = addTitleBlock(sheet, {
    columnCount: COLUMN_COUNT,
    lines: [
      { text: 'CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM', bold: true, size: 11 },
      { text: 'Độc lập - Tự do - Hạnh phúc', bold: true, italic: true, size: 11 },
      { text: '---------------o0o---------------', size: 10 },
      { text: '' },
      { text: 'BẢNG KÊ ĐỀ NGHỊ THANH TOÁN', bold: true, size: 16, height: 26 },
      {
        text: 'BẢN NHÁP THAM KHẢO — CHƯA PHÊ DUYỆT',
        bold: true,
        size: 10,
        color: 'FFC00000',
      },
      { text: `Ngày lập: ${formatDate(generatedAt)}`, italic: true, size: 10, align: 'right' },
      { text: '' },
    ],
  });

  const headerRow = sheet.addRow(COLUMNS.map((column) => column.header));
  styleHeaderRow(headerRow);

  const totals = { amountBeforeTax: 0, vatAmount: 0, totalAmount: 0 };

  invoices.forEach((invoice, index) => {
    const row = sheet.addRow([
      index + 1,
      invoice.date || '',
      invoice.invoiceNo || '',
      invoice.seller || '',
      invoice.sellerTax || '',
      invoice.amountBeforeTax || 0,
      invoice.vatAmount || 0,
      invoice.totalAmount || 0,
      invoice.rawFileName || '',
    ]);
    styleDataRow(row, { moneyColumns: MONEY_COLUMNS, centerColumns: CENTER_COLUMNS });

    totals.amountBeforeTax += invoice.amountBeforeTax || 0;
    totals.vatAmount += invoice.vatAmount || 0;
    totals.totalAmount += invoice.totalAmount || 0;
  });

  const totalRow = sheet.addRow([
    'Tổng cộng', '', '', '', '',
    totals.amountBeforeTax,
    totals.vatAmount,
    totals.totalAmount,
    '',
  ]);
  sheet.mergeCells(`A${totalRow.number}:E${totalRow.number}`);
  styleTotalRow(totalRow, { moneyColumns: MONEY_COLUMNS });
  totalRow.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' };

  sheet.addRow([]);
  mergedRow(sheet, `Số tiền bằng chữ: ${numberToWordsVN(totals.totalAmount)}`, {
    bold: true,
    size: 11,
    height: 20,
  });
  mergedRow(sheet, `Số chứng từ kèm theo: ${invoices.length}`, { size: 10, italic: true });
  sheet.addRow([]);

  // Khối ký: người đề nghị bên trái, người duyệt bên phải, cách nhau đủ chỗ ký.
  const signatureDate = sheet.addRow([]);
  signatureDate.getCell(6).value = `Ngày ${generatedAt.getDate()} tháng ${generatedAt.getMonth() + 1} năm ${generatedAt.getFullYear()}`;
  sheet.mergeCells(`F${signatureDate.number}:${LAST_COLUMN}${signatureDate.number}`);
  signatureDate.getCell(6).font = { name: 'Times New Roman', size: 10, italic: true };
  signatureDate.getCell(6).alignment = { horizontal: 'center' };

  const signatureTitles = sheet.addRow([]);
  signatureTitles.getCell(1).value = 'NGƯỜI ĐỀ NGHỊ';
  signatureTitles.getCell(6).value = 'KẾ TOÁN TRƯỞNG / NGƯỜI DUYỆT';
  sheet.mergeCells(`A${signatureTitles.number}:C${signatureTitles.number}`);
  sheet.mergeCells(`F${signatureTitles.number}:${LAST_COLUMN}${signatureTitles.number}`);
  for (const column of [1, 6]) {
    signatureTitles.getCell(column).font = { name: 'Times New Roman', size: 11, bold: true };
    signatureTitles.getCell(column).alignment = { horizontal: 'center' };
  }

  const signatureHint = sheet.addRow([]);
  signatureHint.getCell(1).value = '(Ký, ghi rõ họ tên)';
  signatureHint.getCell(6).value = '(Ký, ghi rõ họ tên)';
  sheet.mergeCells(`A${signatureHint.number}:C${signatureHint.number}`);
  sheet.mergeCells(`F${signatureHint.number}:${LAST_COLUMN}${signatureHint.number}`);
  for (const column of [1, 6]) {
    signatureHint.getCell(column).font = { name: 'Times New Roman', size: 10, italic: true };
    signatureHint.getCell(column).alignment = { horizontal: 'center' };
  }
  // Chừa khoảng trắng để ký tay khi in.
  sheet.addRow([]).height = 60;

  const disclaimer = mergedRow(
    sheet,
    'Bản nháp do công cụ tổng hợp tự động từ hóa đơn XML/PDF người dùng tải lên. Số liệu phải được đối chiếu với chứng từ gốc và phê duyệt theo quy trình nội bộ trước khi thanh toán.',
    { size: 9, italic: true, color: REPORT_COLORS.muted, wrap: true, height: 30 },
  );
  disclaimer.getCell(1).border = { top: BOX_BORDER.top };

  sheet.views = [{ state: 'frozen', ySplit: headerRow.number, showGridLines: false }];
  sheet.autoFilter = {
    from: { row: headerRow.number, column: 1 },
    to: { row: headerRow.number, column: COLUMN_COUNT },
  };

  applyPrintSetup(sheet, {
    orientation: 'landscape',
    titleRows: `${titleLines + 1}:${headerRow.number}`,
    footerNote: 'Bản nháp tham khảo — chưa phê duyệt',
  });

  return { workbook, totals };
}

export async function exportPaymentRequest(invoices, options = {}) {
  const generatedAt = options.generatedAt ?? new Date();
  const { workbook } = await buildPaymentRequestWorkbook(invoices, { generatedAt });
  const stamp = generatedAt.toISOString().slice(0, 10);
  await downloadWorkbook(workbook, `Ban_Nhap_De_Nghi_Thanh_Toan_${stamp}.xlsx`);
}

export { MONEY_FORMAT };

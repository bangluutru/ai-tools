/**
 * Nguyên liệu dựng workbook in được: khổ A4, vừa bề ngang một trang, lặp lại
 * dòng tiêu đề trên mọi trang và có số trang ở chân trang.
 *
 * SheetJS bản cộng đồng không ghi được định dạng ô, nên mọi file xuất ra cho
 * người dùng in đều đi qua ExcelJS.
 */

export const A4_PAPER_SIZE = 9;
export const MONEY_FORMAT = '#,##0';
export const MONEY_FORMAT_SIGNED = '#,##0;[Red]-#,##0';

export const REPORT_COLORS = Object.freeze({
  headerFill: 'FF1F3864',
  headerText: 'FFFFFFFF',
  subHeaderFill: 'FFD9E2F3',
  totalFill: 'FFFFF2CC',
  warnFill: 'FFFDE9E9',
  reviewFill: 'FFFFF4D6',
  okFill: 'FFE7F4E4',
  muted: 'FF808080',
});

const THIN = { style: 'thin', color: { argb: 'FF9AA5B1' } };
export const BOX_BORDER = Object.freeze({ top: THIN, left: THIN, bottom: THIN, right: THIN });

export const loadExcelJs = () => import('exceljs').then((module) => module.default ?? module);

/**
 * Khối tiêu đề quốc ngữ ở đầu biểu mẫu. Trả về số dòng đã dùng để phần sau tự
 * biết bắt đầu từ đâu.
 */
export function columnLetter(columnNumber) {
  let letters = '';
  let remaining = columnNumber;
  while (remaining > 0) {
    const modulo = (remaining - 1) % 26;
    letters = String.fromCharCode(65 + modulo) + letters;
    remaining = Math.floor((remaining - modulo) / 26);
  }
  return letters;
}

export function addTitleBlock(sheet, { lines, columnCount }) {
  const lastColumn = columnLetter(columnCount);

  lines.forEach((line, index) => {
    const rowNumber = index + 1;
    const row = sheet.getRow(rowNumber);
    row.getCell(1).value = line.text;
    sheet.mergeCells(`A${rowNumber}:${lastColumn}${rowNumber}`);
    row.getCell(1).alignment = { horizontal: line.align ?? 'center', vertical: 'middle' };
    row.getCell(1).font = {
      name: 'Times New Roman',
      size: line.size ?? 11,
      bold: line.bold ?? false,
      italic: line.italic ?? false,
      color: line.color ? { argb: line.color } : undefined,
    };
    row.height = line.height ?? (line.size && line.size >= 14 ? 22 : 16);
  });

  return lines.length;
}

/** Dòng tiêu đề bảng: nền đậm, chữ trắng, xuống dòng, có viền. */
export function styleHeaderRow(row) {
  row.eachCell({ includeEmpty: true }, (cell) => {
    cell.font = { name: 'Times New Roman', size: 10, bold: true, color: { argb: REPORT_COLORS.headerText } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: REPORT_COLORS.headerFill } };
    cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    cell.border = BOX_BORDER;
  });
  row.height = 30;
}

/** Viền + font cho vùng dữ liệu, kèm định dạng số cho các cột tiền. */
export function styleDataRow(row, { moneyColumns = [], centerColumns = [] } = {}) {
  row.eachCell({ includeEmpty: true }, (cell, columnNumber) => {
    cell.font = { name: 'Times New Roman', size: 10 };
    cell.border = BOX_BORDER;
    if (moneyColumns.includes(columnNumber)) {
      cell.numFmt = MONEY_FORMAT_SIGNED;
      cell.alignment = { horizontal: 'right', vertical: 'middle' };
    } else if (centerColumns.includes(columnNumber)) {
      cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    } else {
      cell.alignment = { horizontal: 'left', vertical: 'middle', wrapText: true };
    }
  });
}

export function styleTotalRow(row, { moneyColumns = [] } = {}) {
  row.eachCell({ includeEmpty: true }, (cell, columnNumber) => {
    cell.font = { name: 'Times New Roman', size: 10, bold: true };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: REPORT_COLORS.totalFill } };
    cell.border = BOX_BORDER;
    if (moneyColumns.includes(columnNumber)) {
      cell.numFmt = MONEY_FORMAT_SIGNED;
      cell.alignment = { horizontal: 'right', vertical: 'middle' };
    }
  });
}

/**
 * Thiết lập in. `titleRows` là vùng dòng lặp lại đầu mỗi trang, ví dụ '5:6'.
 */
export function applyPrintSetup(sheet, { orientation = 'portrait', titleRows, footerNote = '' } = {}) {
  sheet.pageSetup = {
    paperSize: A4_PAPER_SIZE,
    orientation,
    fitToPage: true,
    fitToWidth: 1,
    fitToHeight: 0,
    horizontalCentered: true,
    printTitlesRow: titleRows,
    margins: { left: 0.4, right: 0.4, top: 0.55, bottom: 0.55, header: 0.25, footer: 0.25 },
  };

  sheet.headerFooter = {
    oddFooter: `&L&8${footerNote}&R&8Trang &P/&N`,
    evenFooter: `&L&8${footerNote}&R&8Trang &P/&N`,
  };
}

export function setColumnWidths(sheet, widths) {
  widths.forEach((width, index) => {
    sheet.getColumn(index + 1).width = width;
  });
}

/** Tải workbook về máy người dùng mà không rời khỏi trình duyệt. */
export async function downloadWorkbook(workbook, fileName) {
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const { saveAs } = await import('file-saver');
  saveAs(blob, fileName);
}

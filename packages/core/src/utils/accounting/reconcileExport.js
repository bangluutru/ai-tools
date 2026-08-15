import {
  addTitleBlock,
  applyPrintSetup,
  BOX_BORDER,
  downloadWorkbook,
  loadExcelJs,
  MONEY_FORMAT,
  REPORT_COLORS,
  setColumnWidths,
  styleDataRow,
  styleHeaderRow,
  styleTotalRow,
} from '../excelReport.js';
import { ACCOUNTING_RULE_VERSION } from './reconcile.js';

export const STATUS_LABELS = Object.freeze({
  MATCH: 'Khớp',
  DIFF: 'Lệch',
  MISSING_BR: 'Thiếu trên BR',
  MISSING_LEDGER: 'Thiếu trên sổ',
});

export const statusLabel = (status) => STATUS_LABELS[status] ?? status;

export const evidenceLabel = (records = []) => records
  .map((record) => `${record.sourceFile || '?'} | ${record.sourceSheet || '?'} | dòng ${record.sourceRow || '?'}`)
  .join('; ');

const FOOTER_NOTE = 'Kết quả tham khảo — cần kế toán kiểm tra trước khi sử dụng';

/** Ngày giờ dạng dd/MM/yyyy HH:mm, cố định để file xuất ra đọc được ở mọi máy. */
function formatTimestamp(date) {
  const pad = (value) => String(value).padStart(2, '0');
  return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()} `
    + `${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function addSummarySheet(workbook, results, generatedAt) {
  const sheet = workbook.addWorksheet('Tổng hợp', {
    views: [{ showGridLines: false }],
  });
  setColumnWidths(sheet, [46, 22]);

  const titleRows = addTitleBlock(sheet, {
    columnCount: 2,
    lines: [
      { text: 'BÁO CÁO ĐỐI CHIẾU KẾ TOÁN', bold: true, size: 16, height: 26 },
      { text: 'Đối chiếu doanh thu (511) và thuế GTGT đầu ra (33311) với bảng kê hóa đơn', italic: true, size: 10 },
      {
        text: 'KẾT QUẢ THAM KHẢO — CẦN KẾ TOÁN KIỂM TRA / PHÊ DUYỆT',
        bold: true,
        size: 10,
        color: 'FFC00000',
      },
      { text: '' },
    ],
  });

  const section = (label) => {
    const row = sheet.addRow([label, '']);
    sheet.mergeCells(`A${row.number}:B${row.number}`);
    row.getCell(1).font = { name: 'Times New Roman', size: 11, bold: true };
    row.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: REPORT_COLORS.subHeaderFill } };
    row.getCell(1).alignment = { horizontal: 'left', vertical: 'middle' };
    row.getCell(1).border = BOX_BORDER;
    row.height = 20;
  };

  const entry = (label, value, { money = false, highlight = false } = {}) => {
    const row = sheet.addRow([label, value]);
    row.eachCell((cell, columnNumber) => {
      cell.font = { name: 'Times New Roman', size: 10, bold: highlight };
      cell.border = BOX_BORDER;
      cell.alignment = columnNumber === 1
        ? { horizontal: 'left', vertical: 'middle', wrapText: true }
        : { horizontal: 'right', vertical: 'middle' };
      if (columnNumber === 2 && money) cell.numFmt = MONEY_FORMAT;
      if (highlight) {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: REPORT_COLORS.warnFill } };
      }
    });
  };

  section('THÔNG TIN LẦN ĐỐI CHIẾU');
  entry('Ngày tạo báo cáo', formatTimestamp(generatedAt));
  entry('Phiên bản quy tắc', results.ruleVersion || ACCOUNTING_RULE_VERSION);
  entry('Sai số cho phép (đồng)', results.tolerance);
  entry('Tổng số hóa đơn đối chiếu', results.summary.total, { money: true });

  sheet.addRow([]);
  section('ĐỐI CHIẾU DOANH THU (511 vs BR)');
  entry('Số hóa đơn khớp', results.summary.matched511, { money: true });
  entry('Số hóa đơn lệch', results.summary.unmatched511, {
    money: true,
    highlight: results.summary.unmatched511 > 0,
  });

  sheet.addRow([]);
  section('ĐỐI CHIẾU THUẾ GTGT (33311 vs BR)');
  entry('Số hóa đơn khớp', results.summary.matched33311, { money: true });
  entry('Số hóa đơn lệch', results.summary.unmatched33311, {
    money: true,
    highlight: results.summary.unmatched33311 > 0,
  });

  sheet.addRow([]);
  section('CẢNH BÁO CẦN XỬ LÝ');
  entry('Có trên sổ, thiếu trên bảng kê BR', results.summary.missingInBR, {
    money: true,
    highlight: results.summary.missingInBR > 0,
  });
  entry('Có trên bảng kê BR, thiếu trên sổ', results.summary.missingInLedger, {
    money: true,
    highlight: results.summary.missingInLedger > 0,
  });
  entry('Hóa đơn trùng bản ghi BR, cần xác nhận thủ công', results.summary.needsReview, {
    money: true,
    highlight: results.summary.needsReview > 0,
  });

  sheet.addRow([]);
  const noteRow = sheet.addRow(['Báo cáo do công cụ tạo tự động từ file người dùng tải lên. Mọi số liệu phải được kế toán đối chiếu lại với chứng từ gốc trước khi dùng cho mục đích kê khai hoặc quyết toán.', '']);
  sheet.mergeCells(`A${noteRow.number}:B${noteRow.number}`);
  noteRow.getCell(1).font = { name: 'Times New Roman', size: 9, italic: true, color: { argb: REPORT_COLORS.muted } };
  noteRow.getCell(1).alignment = { horizontal: 'left', vertical: 'top', wrapText: true };
  noteRow.height = 46;

  applyPrintSetup(sheet, { orientation: 'portrait', titleRows: `1:${titleRows}`, footerNote: FOOTER_NOTE });
  return sheet;
}

/**
 * Bảng chi tiết dùng chung cho mọi sheet đối chiếu: tiêu đề in lặp lại, khóa
 * dòng tiêu đề, bộ lọc, tô màu dòng lệch và dòng tổng cộng.
 */
function addDetailSheet(workbook, { name, heading, columns, rows, generatedAt }) {
  const sheet = workbook.addWorksheet(name, { views: [{ showGridLines: false }] });
  setColumnWidths(sheet, columns.map((column) => column.width));

  const titleLines = addTitleBlock(sheet, {
    columnCount: columns.length,
    lines: [
      { text: heading, bold: true, size: 14, height: 24 },
      { text: `Ngày tạo: ${formatTimestamp(generatedAt)} — kết quả tham khảo, cần kế toán kiểm tra`, italic: true, size: 9 },
      { text: '' },
    ],
  });

  const headerRow = sheet.addRow(columns.map((column) => column.header));
  styleHeaderRow(headerRow);

  const moneyColumns = columns
    .map((column, index) => (column.money ? index + 1 : null))
    .filter((value) => value !== null);
  const centerColumns = columns
    .map((column, index) => (column.center ? index + 1 : null))
    .filter((value) => value !== null);

  if (rows.length === 0) {
    const emptyRow = sheet.addRow([`Không có dữ liệu trong nhóm "${name}"`]);
    sheet.mergeCells(emptyRow.number, 1, emptyRow.number, columns.length);
    emptyRow.getCell(1).font = { name: 'Times New Roman', size: 10, italic: true };
    emptyRow.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' };
    emptyRow.getCell(1).border = BOX_BORDER;
  } else {
    for (const item of rows) {
      const row = sheet.addRow(columns.map((column) => column.value(item)));
      styleDataRow(row, { moneyColumns, centerColumns });

      if (item.status === 'DIFF' || String(item.status).startsWith('MISSING_')) {
        row.eachCell({ includeEmpty: true }, (cell) => {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: REPORT_COLORS.warnFill } };
        });
      } else if (item.needsReview) {
        row.eachCell({ includeEmpty: true }, (cell) => {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: REPORT_COLORS.reviewFill } };
        });
      }
    }

    const totals = columns.map((column, index) => {
      if (index === 0) return 'TỔNG CỘNG';
      if (!column.money) return '';
      return rows.reduce((sum, item) => sum + (Number(column.value(item)) || 0), 0);
    });
    styleTotalRow(sheet.addRow(totals), { moneyColumns });
  }

  sheet.autoFilter = {
    from: { row: headerRow.number, column: 1 },
    to: { row: headerRow.number, column: columns.length },
  };
  sheet.views = [{
    state: 'frozen',
    ySplit: headerRow.number,
    showGridLines: false,
  }];

  applyPrintSetup(sheet, {
    orientation: 'landscape',
    titleRows: `${titleLines + 1}:${headerRow.number}`,
    footerNote: FOOTER_NOTE,
  });

  return sheet;
}

const EVIDENCE_COLUMNS = [
  { header: 'Nguồn trên sổ', width: 34, value: (row) => evidenceLabel(row.ledgerEvidence) },
  { header: 'Nguồn trên BR', width: 34, value: (row) => evidenceLabel(row.brEvidence) },
];

const columnsFor511 = () => [
  { header: 'Số hóa đơn', width: 16, center: true, value: (row) => row.invoice },
  { header: 'Sổ 511\n(Phát sinh Có)', width: 20, money: true, value: (row) => row.val511 },
  { header: 'Bảng kê BR\n(Chưa thuế)', width: 20, money: true, value: (row) => row.valBR },
  { header: 'Chênh lệch', width: 18, money: true, value: (row) => row.diff },
  { header: 'Trạng thái', width: 16, center: true, value: (row) => statusLabel(row.status) },
  { header: 'Cần xác nhận', width: 13, center: true, value: (row) => (row.needsReview ? 'Có' : '') },
  ...EVIDENCE_COLUMNS,
];

const columnsFor33311 = () => [
  { header: 'Số hóa đơn', width: 16, center: true, value: (row) => row.invoice },
  { header: 'Sổ 33311\n(Tổng VAT)', width: 20, money: true, value: (row) => row.val33311 },
  { header: 'Trong đó\nVAT hàng tặng', width: 18, money: true, value: (row) => row.vatTang },
  { header: 'Bảng kê BR\n(Thuế)', width: 20, money: true, value: (row) => row.valBR },
  { header: 'Chênh lệch', width: 18, money: true, value: (row) => row.diff },
  { header: 'Trạng thái', width: 16, center: true, value: (row) => statusLabel(row.status) },
  { header: 'Cần xác nhận', width: 13, center: true, value: (row) => (row.needsReview ? 'Có' : '') },
  ...EVIDENCE_COLUMNS,
];

const workflowColumns = () => [
  { header: 'Tài khoản', width: 12, center: true, value: (row) => row.account },
  { header: 'Số hóa đơn', width: 16, center: true, value: (row) => row.invoice },
  { header: 'Giá trị trên sổ', width: 20, money: true, value: (row) => row.ledgerValue },
  { header: 'Giá trị trên BR', width: 20, money: true, value: (row) => row.brValue },
  { header: 'Chênh lệch', width: 18, money: true, value: (row) => row.diff },
  { header: 'Trạng thái', width: 16, center: true, value: (row) => statusLabel(row.status) },
  { header: 'Cần xác nhận', width: 13, center: true, value: (row) => (row.needsReview ? 'Có' : '') },
  ...EVIDENCE_COLUMNS,
];

/** Bảng chẩn đoán để kế toán biết công cụ đã đọc đúng dòng/cột nào của từng file. */
function addSourceSheet(workbook, diagnostics, generatedAt) {
  const columns = [
    { header: 'File nguồn', width: 34, value: (row) => row.sourceFile },
    { header: 'Sheet', width: 20, value: (row) => row.sourceSheet },
    { header: 'Loại', width: 12, center: true, value: (row) => row.kind ?? '' },
    { header: 'Dòng tiêu đề', width: 13, center: true, value: (row) => row.headerRow ?? '' },
    { header: 'Số dòng đã đọc', width: 15, center: true, value: (row) => row.rowCount ?? 0 },
    { header: 'Kết quả', width: 14, center: true, value: (row) => (row.ok ? 'Đọc được' : 'Không đọc được') },
    { header: 'Ghi chú', width: 52, value: (row) => row.reason || '' },
  ];

  return addDetailSheet(workbook, {
    name: 'Nguồn dữ liệu',
    heading: 'NHẬT KÝ ĐỌC FILE NGUỒN',
    columns,
    rows: diagnostics,
    generatedAt,
  });
}

export async function buildReconcileWorkbook(results, { diagnostics = [], generatedAt = new Date() } = {}) {
  const ExcelJS = await loadExcelJs();
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'AI-Tools • Đối chiếu kế toán';
  workbook.created = generatedAt;

  addSummarySheet(workbook, results, generatedAt);

  addDetailSheet(workbook, {
    name: 'Đối chiếu 511',
    heading: 'ĐỐI CHIẾU DOANH THU — TÀI KHOẢN 511 VỚI BẢNG KÊ BR',
    columns: columnsFor511(),
    rows: results.report511,
    generatedAt,
  });

  addDetailSheet(workbook, {
    name: 'Đối chiếu 33311',
    heading: 'ĐỐI CHIẾU THUẾ GTGT ĐẦU RA — TÀI KHOẢN 33311 VỚI BẢNG KÊ BR',
    columns: columnsFor33311(),
    rows: results.report33311,
    generatedAt,
  });

  const workflowRows = [
    ...results.report511.map((row) => ({ ...row, account: '511', ledgerValue: row.val511, brValue: row.valBR })),
    ...results.report33311.map((row) => ({ ...row, account: '33311', ledgerValue: row.val33311, brValue: row.valBR })),
  ];

  const groups = [
    ['Đã khớp', 'DANH SÁCH HÓA ĐƠN ĐÃ KHỚP', workflowRows.filter((row) => row.status === 'MATCH' && !row.needsReview)],
    ['Chênh lệch', 'DANH SÁCH HÓA ĐƠN CÓ CHÊNH LỆCH', workflowRows.filter((row) => row.status === 'DIFF')],
    ['Không tìm thấy', 'DANH SÁCH HÓA ĐƠN THIẾU MỘT PHÍA', workflowRows.filter((row) => String(row.status).startsWith('MISSING_'))],
    ['Cần xác nhận', 'HÓA ĐƠN TRÙNG BẢN GHI BR — CẦN XÁC NHẬN THỦ CÔNG', workflowRows.filter((row) => row.needsReview)],
  ];

  for (const [name, heading, rows] of groups) {
    addDetailSheet(workbook, { name, heading, columns: workflowColumns(), rows, generatedAt });
  }

  if (diagnostics.length > 0) addSourceSheet(workbook, diagnostics, generatedAt);

  return workbook;
}

export async function exportReconcileWorkbook(results, options = {}) {
  const generatedAt = options.generatedAt ?? new Date();
  const workbook = await buildReconcileWorkbook(results, { ...options, generatedAt });
  const stamp = generatedAt.toISOString().slice(0, 10);
  await downloadWorkbook(workbook, `Ket_qua_doi_chieu_${stamp}.xlsx`);
}

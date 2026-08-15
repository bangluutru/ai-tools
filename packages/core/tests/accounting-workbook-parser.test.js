import assert from 'node:assert/strict';
import test from 'node:test';

import {
  classifyBrSheet,
  detectWorkbookKind,
  findHeaderRow,
  LEDGER_COLUMN_SPEC,
  BR_COLUMN_SPEC,
  normalizeLabel,
  parseBrWorkbook,
  parseLedgerSheet,
  parseLedgerWorkbook,
  resolveColumns,
} from '../src/utils/accounting/workbookParser.js';

// Sổ chi tiết có hai dòng tiêu đề văn bản, một dòng trống, rồi mới tới header.
const ledgerRows = [
  ['CÔNG TY TNHH ABC'],
  ['SỔ CHI TIẾT TÀI KHOẢN 511'],
  [],
  ['Ngày', 'Chứng từ', 'Ngày CT', 'Số hóa đơn', 'Diễn giải', 'TK đối ứng', 'Phát sinh Nợ', 'Phát sinh Có'],
  ['01/07/2026', 'BH01', '01/07/2026', '00012345', 'Bán hàng', '131', 0, 10000000],
  ['01/07/2026', 'BH02', '01/07/2026', '12346', 'Bán hàng', '131', 0, '20.000.000'],
  ['', '', '', 'Tổng cộng', '', '', 0, 30000000],
];

const brGtgtRows = [
  ['BẢNG KÊ HÓA ĐƠN BÁN RA'],
  ['Kỳ: Tháng 07/2026'],
  [],
  [],
  ['STT', 'Ký hiệu', 'Mẫu số', 'Số hóa đơn', 'Ngày', 'Người mua', 'MST', 'Thuế suất', 'Doanh số chưa thuế', 'Thuế GTGT'],
  [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
  [1, 'C26TAA', '1', '00012345', '01/07/2026', 'KH A', '010000001', '10%', 10000000, 1000000],
  [2, 'C26TAA', '1', '12346', '02/07/2026', 'KH B', '010000002', '10%', 20000000, 2000000],
];

// BR MTT đặt cột tiền ở vị trí khác BR GTGT.
const brMttRows = [
  ['BẢNG KÊ MÁY TÍNH TIỀN'],
  [],
  ['STT', 'Ký hiệu', 'Số hóa đơn', 'Ngày', 'Người mua', 'Đơn giá', 'Doanh số chưa thuế', 'Tiền thuế'],
  [1, 'C26TAA', '00012347', '03/07/2026', 'KH C', 5000000, 5000000, 500000],
];


test('normalizes Vietnamese column labels regardless of diacritics and spacing', () => {
  assert.equal(normalizeLabel('  Số  Hóa Đơn '), 'so hoa don');
  assert.equal(normalizeLabel('Phát sinh Có'), 'phat sinh co');
  assert.equal(normalizeLabel('Doanh số chưa thuế'), 'doanh so chua thue');
  assert.equal(normalizeLabel(null), '');
});


test('resolves ledger columns by label and never reuses one column twice', () => {
  const columns = resolveColumns(ledgerRows[3], LEDGER_COLUMN_SPEC);
  assert.equal(columns.invoice, 3);
  assert.equal(columns.desc, 4);
  // "Phát sinh Có" phải thắng "Phát sinh Nợ".
  assert.equal(columns.value, 7);
});


test('never mistakes a tax-rate column for the tax amount column', () => {
  const columns = resolveColumns(brGtgtRows[4], BR_COLUMN_SPEC);
  assert.equal(columns.invoice, 3);
  assert.equal(columns.chuaThue, 8);
  assert.equal(columns.thue, 9);
  assert.notEqual(columns.thue, 7, 'cột "Thuế suất" không phải cột tiền thuế');
});


test('finds the header by content instead of a fixed offset', () => {
  assert.equal(findHeaderRow(ledgerRows, LEDGER_COLUMN_SPEC, ['invoice', 'value']).index, 3);
  assert.equal(findHeaderRow(brGtgtRows, BR_COLUMN_SPEC, ['invoice', 'chuaThue']).index, 4);
  assert.equal(findHeaderRow(brMttRows, BR_COLUMN_SPEC, ['invoice', 'chuaThue']).index, 2);
});


test('reads every ledger row and reports the real Excel row as evidence', () => {
  const { records, diagnostics } = parseLedgerSheet(ledgerRows, {
    sourceFile: 'So_511.xlsx',
    sourceSheet: 'So 511',
  });

  assert.equal(diagnostics.ok, true);
  assert.equal(diagnostics.headerRow, 4);
  assert.equal(records.length, 2, 'không được bỏ sót dòng đầu và không được đọc dòng tổng cộng');

  assert.deepEqual(records.map((record) => record.invoice), ['12345', '12346']);
  // Dòng dữ liệu đầu tiên nằm ở dòng 5 của file Excel.
  assert.deepEqual(records.map((record) => record.sourceRow), [5, 6]);
  // Số dạng "20.000.000" phải được đọc theo locale, không thành 20.
  assert.deepEqual(records.map((record) => record.value), [10000000, 20000000]);
});


test('skips the column-numbering row that sits under a BR header', () => {
  const { records } = parseBrWorkbook({
    sheetNames: ['BR GTGT'],
    sheetRows: { 'BR GTGT': brGtgtRows },
    sourceFile: 'BR.xlsx',
  });

  assert.deepEqual(records.map((record) => record.invoice), ['12345', '12346']);
  assert.deepEqual(records.map((record) => record.chuaThue), [10000000, 20000000]);
  assert.deepEqual(records.map((record) => record.sourceRow), [7, 8]);
});


test('parses BR sheets independently so MTT column drift cannot corrupt GTGT', () => {
  const { records, diagnostics } = parseBrWorkbook({
    sheetNames: ['BR GTGT', 'BR MTT'],
    sheetRows: { 'BR GTGT': brGtgtRows, 'BR MTT': brMttRows },
    sourceFile: 'BR.xlsx',
  });

  assert.equal(diagnostics.length, 2);
  const mtt = records.find((record) => record.invoice === '12347');
  assert.equal(mtt.type, 'MTT');
  assert.equal(mtt.chuaThue, 5000000);
  assert.equal(mtt.thue, 500000);
});


test('classifies BR sheets by name', () => {
  assert.equal(classifyBrSheet('BR MTT'), 'MTT');
  assert.equal(classifyBrSheet('BR GTGT'), 'GTGT');
});


test('detects workbook kind from sheet names and heading text', () => {
  assert.equal(
    detectWorkbookKind({ sheetNames: ['BR GTGT', 'BR MTT'], sheetRows: { 'BR GTGT': brGtgtRows } }),
    'br',
  );
  assert.equal(
    detectWorkbookKind({ sheetNames: ['So 511'], sheetRows: { 'So 511': ledgerRows } }),
    '511',
  );
  assert.equal(
    detectWorkbookKind({
      sheetNames: ['Sheet1'],
      sheetRows: { Sheet1: [['SỔ CHI TIẾT TÀI KHOẢN 33311 - Thuế GTGT đầu ra']] },
    }),
    '33311',
  );
  assert.equal(detectWorkbookKind({ sheetNames: ['Sheet1'], sheetRows: { Sheet1: [['Linh tinh']] } }), null);
});


test('reports a readable reason when a sheet has no recognisable header', () => {
  const { records, diagnostics } = parseLedgerWorkbook({
    sheetNames: ['Sheet1'],
    sheetRows: { Sheet1: [['Không phải sổ kế toán'], ['a', 'b', 'c']] },
    sourceFile: 'Linh_tinh.xlsx',
  });

  assert.deepEqual(records, []);
  assert.equal(diagnostics[0].ok, false);
  assert.match(diagnostics[0].reason, /Không tìm thấy dòng tiêu đề/);
});

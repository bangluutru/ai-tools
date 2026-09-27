import assert from 'node:assert/strict';
import test from 'node:test';

import {
  BR_COLUMN_SPEC,
  detectWorkbookKind,
  LEDGER_COLUMN_SPEC,
  parseAmountCell,
  parseLedgerSheet,
  resolveColumns,
} from '../src/utils/accounting/workbookParser.js';
import { invoiceLabel, reconcileAccountingData } from '../src/utils/accounting/reconcile.js';
import { reconcileWorkbooks } from '../src/utils/accounting/reconcilePipeline.js';
import { buildReconcileWorkbook } from '../src/utils/accounting/reconcileExport.js';

const LEDGER_HEADER = ['Ngày', 'Chứng từ', 'Ngày CT', 'Số hóa đơn', 'Diễn giải', 'TK đối ứng', 'Phát sinh Nợ', 'Phát sinh Có'];

const ledger = (account, rows) => [
  ['CÔNG TY TNHH MẪU'],
  [`SỔ CHI TIẾT TÀI KHOẢN ${account}`],
  [],
  LEDGER_HEADER,
  ...rows,
];

const BR_HEADER = ['STT', 'Ký hiệu', 'Mẫu số', 'Số hóa đơn', 'Ngày', 'Người mua', 'MST', 'Thuế suất', 'Doanh số chưa thuế', 'Thuế GTGT'];

// ---------------------------------------------------------------------------
// I8 — nhận diện sổ 33311 chỉ qua số hiệu tài khoản ở phần tiêu đề.

test('I8: "33311" inside invoice numbers or amounts does not make a 511 ledger a VAT ledger', () => {
  const rows = ledger('511', [
    ['01/07/2026', 'BH', '01/07/2026', '00033311', 'Bán hàng HĐ 33311', '131', 0, 3331100],
  ]);
  assert.equal(detectWorkbookKind({ sheetNames: ['Sheet1'], sheetRows: { Sheet1: rows } }), '511');
});

test('I8: the account number must be a whole token in the title', () => {
  const rows = [['SỔ CHI TIẾT TÀI KHOẢN 5111 - Doanh thu bán hàng hóa'], [], LEDGER_HEADER];
  assert.equal(detectWorkbookKind({ sheetNames: ['Sheet1'], sheetRows: { Sheet1: rows } }), '511');
  const vat = [['Sổ chi tiết TK 33311'], [], LEDGER_HEADER];
  assert.equal(detectWorkbookKind({ sheetNames: ['Sheet1'], sheetRows: { Sheet1: vat } }), '33311');
  const noise = [['Báo cáo 1511233311'], [], LEDGER_HEADER];
  assert.equal(detectWorkbookKind({ sheetNames: ['Sheet1'], sheetRows: { Sheet1: noise } }), null);
});

// ---------------------------------------------------------------------------
// I9 — so khớp cột theo nguyên ô / trọn từ.

test('I9: "Mẫu số HĐ" is never taken as the invoice-number column', () => {
  const columns = resolveColumns(['STT', 'Mẫu số HĐ', 'Ký hiệu HĐ', 'Số HĐ', 'Doanh thu chưa có thuế GTGT', 'Thuế GTGT'], BR_COLUMN_SPEC);
  assert.equal(columns.invoice, 3);
  assert.equal(columns.symbol, 2);
});

test('I9: the official 01-1/GTGT header "Doanh thu chưa có thuế GTGT" is recognised', () => {
  const columns = resolveColumns(
    ['STT', 'Số hóa đơn', 'Doanh thu chưa có thuế GTGT', 'Thuế GTGT', 'Tổng cộng tiền thanh toán đã có thuế GTGT'],
    BR_COLUMN_SPEC,
  );
  assert.equal(columns.chuaThue, 2);
  assert.equal(columns.thue, 3);
});

test('I9: a total-payment column is not taken as the VAT column', () => {
  const columns = resolveColumns(
    ['Số hóa đơn', 'Doanh số chưa thuế', 'Tổng cộng tiền thanh toán đã có thuế GTGT', 'Tiền thuế'],
    BR_COLUMN_SPEC,
  );
  assert.equal(columns.thue, 3);
});

test('I9: a bare "co" never matches "Mã công trình"', () => {
  const columns = resolveColumns(['Số hóa đơn', 'Mã công trình', 'Diễn giải', 'Có'], LEDGER_COLUMN_SPEC);
  assert.equal(columns.value, 3);
  const noCredit = resolveColumns(['Số hóa đơn', 'Mã công trình', 'Diễn giải'], LEDGER_COLUMN_SPEC);
  assert.equal(noCredit.value, undefined);
});

// ---------------------------------------------------------------------------
// I12 — doanh thu thuần = Có − Nợ.

test('I12: returns booked on the debit side reduce the ledger value', () => {
  const { records } = parseLedgerSheet(ledger('511', [
    ['01/07/2026', 'BH', '01/07/2026', '00012345', 'Bán hàng', '131', 0, 10_000_000],
    ['05/07/2026', 'TL', '05/07/2026', '00012345', 'Hàng bán bị trả lại', '131', 2_000_000, 0],
  ]), { sourceFile: 'So_511.xlsx', sourceSheet: 'So 511' });

  assert.deepEqual(records.map((record) => record.value), [10_000_000, -2_000_000]);
  const { report511 } = reconcileAccountingData({ 511: records, 33311: [], br: [] });
  assert.equal(report511[0].val511, 8_000_000);
});

// ---------------------------------------------------------------------------
// LOW — số dòng bằng chứng khi sheet không bắt đầu ở dòng 1.

test('evidence rows include the sheet start offset', () => {
  const { records, diagnostics } = parseLedgerSheet(ledger('511', [
    ['01/07/2026', 'BH', '01/07/2026', '00012345', 'Bán hàng', '131', 0, 10_000_000],
  ]), { sourceFile: 'So_511.xlsx', sourceSheet: 'So 511', rowOffset: 2 });
  assert.equal(records[0].sourceRow, 7);
  assert.equal(diagnostics.headerRow, 6);
});

test('a text cell "0.125" is a decimal, not 125', () => {
  assert.equal(parseAmountCell('0.125'), 0.125);
  assert.equal(parseAmountCell('0,5'), 0.5);
  assert.equal(parseAmountCell('1.250'), 1250);
  assert.equal(parseAmountCell(125), 125);
});

// ---------------------------------------------------------------------------
// I10 — hai file cùng loại được gộp và báo lại.

test('I10: a second ledger of the same kind is merged and reported, not silently dropped', () => {
  const july = {
    sourceFile: 'So_511_T7.xlsx', sheetNames: ['So 511'],
    sheetRows: { 'So 511': ledger('511', [['01/07/2026', 'BH', '01/07/2026', '00000001', 'Bán hàng', '131', 0, 1_000_000]]) },
  };
  const august = {
    sourceFile: 'So_511_T8.xlsx', sheetNames: ['So 511'],
    sheetRows: { 'So 511': ledger('511', [['01/08/2026', 'BH', '01/08/2026', '00000002', 'Bán hàng', '131', 0, 2_000_000]]) },
  };
  const outcome = reconcileWorkbooks([july, august]);
  assert.equal(outcome.data['511'].length, 2);
  assert.equal(outcome.files['511'], 'So_511_T7.xlsx, So_511_T8.xlsx');
  assert.ok(outcome.diagnostics.some((entry) => entry.merged && /Đã gộp với So_511_T7\.xlsx/.test(entry.reason)));

  const duplicate = reconcileWorkbooks([july, july]);
  assert.equal(duplicate.data['511'].length, 1);
  assert.ok(duplicate.diagnostics.some((entry) => !entry.ok && /trùng tên/.test(entry.reason)));
});

// ---------------------------------------------------------------------------
// I11 — cùng số hóa đơn, khác ký hiệu.

test('I11: the same number under two symbols is reconciled as two invoices', () => {
  const brRows = [
    ['BẢNG KÊ HÓA ĐƠN BÁN RA'],
    [],
    BR_HEADER,
    [1, 'C25TAA', '1', '00000001', '30/12/2025', 'KH', '0100000001', '10%', 1_000_000, 100_000],
    [2, 'C26TAA', '1', '00000001', '02/01/2026', 'KH', '0100000001', '10%', 3_000_000, 300_000],
  ];
  const ledgerRows = ledger('511', [
    ['30/12/2025', 'BH', '30/12/2025', '00000001', 'Bán hàng', '131', 0, 1_000_000],
    ['02/01/2026', 'BH', '02/01/2026', '00000001', 'Bán hàng', '131', 0, 3_000_000],
  ]);

  const outcome = reconcileWorkbooks([
    { sourceFile: 'So_511.xlsx', sheetNames: ['So 511'], sheetRows: { 'So 511': ledgerRows } },
    { sourceFile: 'BR.xlsx', sheetNames: ['BR GTGT'], sheetRows: { 'BR GTGT': brRows } },
  ]);

  const rows = outcome.results.report511;
  assert.equal(rows.length, 2);
  assert.deepEqual(rows.map((row) => row.status), ['MATCH', 'MATCH']);
  assert.deepEqual(rows.map(invoiceLabel).sort(), ['1 (C25TAA)', '1 (C26TAA)']);
  assert.equal(rows.some((row) => row.needsReview), false);
});

test('I11: a single symbol keeps the plain invoice-number key', () => {
  const { report511 } = reconcileAccountingData({
    511: [{ invoice: '12345', value: 10 }],
    br: [{ invoice: '12345', symbol: 'C26TAA', chuaThue: 10, thue: 1 }],
  });
  assert.equal(report511[0].invoice, '12345');
  assert.equal(report511[0].symbol, undefined);
  assert.equal(report511[0].status, 'MATCH');
});

test('I11: a ledger row that cannot be tied to one symbol is flagged for review', () => {
  const { report511, summary } = reconcileAccountingData({
    511: [{ invoice: '1', value: 4 }],
    br: [
      { invoice: '1', symbol: 'C26TAA', chuaThue: 1, thue: 0 },
      { invoice: '1', symbol: 'C26TBB', chuaThue: 3, thue: 0 },
    ],
  });
  const ambiguous = report511.find((row) => row.ambiguousSymbol);
  assert.ok(ambiguous);
  assert.equal(ambiguous.needsReview, true);
  assert.ok(summary.needsReview >= 1);
});

// ---------------------------------------------------------------------------
// I13 — sheet quy trình cộng riêng 511 và 33311.

test('I13: workflow sheets total 511 and 33311 separately', async () => {
  const results = reconcileAccountingData({
    511: [{ invoice: '1', value: 10_000_000 }],
    33311: [{ invoice: '1', value: 1_000_000 }],
    br: [{ invoice: '1', chuaThue: 10_000_000, thue: 1_000_000 }],
  });
  const workbook = await buildReconcileWorkbook(results, { generatedAt: new Date(2026, 8, 28, 9, 0) });
  const sheet = workbook.getWorksheet('Đã khớp');
  const labels = [];
  sheet.eachRow((row) => {
    const label = row.getCell(1).value;
    if (typeof label === 'string' && label.startsWith('TỔNG CỘNG')) labels.push([label, row.getCell(3).value]);
  });
  assert.deepEqual(labels, [['TỔNG CỘNG 511', 10_000_000], ['TỔNG CỘNG 33311', 1_000_000]]);

  // Số hóa đơn trên sheet tổng hợp là số đếm, không mang định dạng tiền.
  const summarySheet = workbook.getWorksheet('Tổng hợp');
  let countFormat = null;
  summarySheet.eachRow((row) => {
    if (row.getCell(1).value === 'Tổng số hóa đơn đối chiếu') countFormat = row.getCell(2).numFmt;
  });
  assert.equal(countFormat, '#,##0');
});

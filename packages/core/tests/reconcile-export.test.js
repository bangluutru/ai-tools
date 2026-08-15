import assert from 'node:assert/strict';
import test from 'node:test';

import { reconcileAccountingData } from '../src/utils/accounting/reconcile.js';
import { buildReconcileWorkbook, evidenceLabel, statusLabel } from '../src/utils/accounting/reconcileExport.js';
import { A4_PAPER_SIZE } from '../src/utils/excelReport.js';

const GENERATED_AT = new Date('2026-08-15T09:30:00');

const sample = () => reconcileAccountingData({
  511: [
    { invoice: '12345', value: 10000000, sourceFile: 'So_511.xlsx', sourceSheet: 'So 511', sourceRow: 5 },
    { invoice: '12346', value: 20000000, sourceFile: 'So_511.xlsx', sourceSheet: 'So 511', sourceRow: 6 },
    { invoice: '12348', value: 7000000, sourceFile: 'So_511.xlsx', sourceSheet: 'So 511', sourceRow: 7 },
  ],
  33311: [
    { invoice: '12345', value: 1000000, desc: 'Thuế GTGT', sourceFile: 'So_33311.xlsx', sourceSheet: 'So 33311', sourceRow: 5 },
    { invoice: '12346', value: 2000000, desc: 'Thuế GTGT hàng tặng', sourceFile: 'So_33311.xlsx', sourceSheet: 'So 33311', sourceRow: 6 },
  ],
  br: [
    { invoice: '12345', chuaThue: 10000000, thue: 1000000, sourceFile: 'BR.xlsx', sourceSheet: 'BR GTGT', sourceRow: 7 },
    // Lệch 500.000 so với sổ 511.
    { invoice: '12346', chuaThue: 19500000, thue: 2000000, sourceFile: 'BR.xlsx', sourceSheet: 'BR GTGT', sourceRow: 8 },
  ],
});


test('reconciliation separates matched, different and one-sided invoices', () => {
  const results = sample();

  assert.equal(results.summary.matched511, 1);
  assert.equal(results.summary.unmatched511, 2);
  // 12348 chỉ có trên sổ, không có trên bảng kê.
  assert.equal(results.summary.missingInBR, 1);

  const byInvoice = Object.fromEntries(results.report511.map((row) => [row.invoice, row]));
  assert.equal(byInvoice['12345'].status, 'MATCH');
  assert.equal(byInvoice['12346'].status, 'DIFF');
  assert.equal(byInvoice['12346'].diff, 500000);
  assert.equal(byInvoice['12348'].status, 'MISSING_BR');

  // VAT hàng tặng được tách riêng để kế toán soát.
  const vatRow = results.report33311.find((row) => row.invoice === '12346');
  assert.equal(vatRow.vatTang, 2000000);
});


test('evidence keeps the file, sheet and source row of every record', () => {
  const results = sample();
  const row = results.report511.find((entry) => entry.invoice === '12346');

  assert.equal(evidenceLabel(row.ledgerEvidence), 'So_511.xlsx | So 511 | dòng 6');
  assert.equal(evidenceLabel(row.brEvidence), 'BR.xlsx | BR GTGT | dòng 8');
  assert.equal(statusLabel('MISSING_BR'), 'Thiếu trên BR');
});


test('every exported sheet is set up to print on A4', async () => {
  const workbook = await buildReconcileWorkbook(sample(), { generatedAt: GENERATED_AT });

  assert.deepEqual(
    workbook.worksheets.map((sheet) => sheet.name),
    ['Tổng hợp', 'Đối chiếu 511', 'Đối chiếu 33311', 'Đã khớp', 'Chênh lệch', 'Không tìm thấy', 'Cần xác nhận'],
  );

  for (const sheet of workbook.worksheets) {
    assert.equal(sheet.pageSetup.paperSize, A4_PAPER_SIZE, `${sheet.name} phải in khổ A4`);
    // Vừa đúng một trang theo bề ngang, dài bao nhiêu trang cũng được.
    assert.equal(sheet.pageSetup.fitToPage, true, `${sheet.name} phải fit-to-page`);
    assert.equal(sheet.pageSetup.fitToWidth, 1, `${sheet.name} phải vừa bề ngang một trang`);
    assert.equal(sheet.pageSetup.fitToHeight, 0);
    assert.match(sheet.headerFooter.oddFooter, /Trang &P\/&N/, `${sheet.name} phải có số trang`);
    assert.equal(typeof sheet.pageSetup.printTitlesRow, 'string');
  }
});


test('detail sheets repeat and freeze their header row and carry a total line', async () => {
  const workbook = await buildReconcileWorkbook(sample(), { generatedAt: GENERATED_AT });
  const sheet = workbook.getWorksheet('Đối chiếu 511');

  const headerRow = sheet.getRow(4);
  assert.equal(headerRow.getCell(1).value, 'Số hóa đơn');
  assert.equal(sheet.pageSetup.printTitlesRow, '4:4', 'tiêu đề bảng phải lặp lại ở mọi trang in');
  assert.equal(sheet.views[0].state, 'frozen');
  assert.equal(sheet.views[0].ySplit, 4);
  assert.equal(sheet.autoFilter.to.column, 8);

  // Cột tiền phải là số có định dạng, không phải chuỗi đã format sẵn.
  const firstDataRow = sheet.getRow(5);
  assert.equal(typeof firstDataRow.getCell(2).value, 'number');
  assert.match(firstDataRow.getCell(2).numFmt, /#,##0/);

  const totalRow = sheet.getRow(sheet.rowCount);
  assert.equal(totalRow.getCell(1).value, 'TỔNG CỘNG');
  assert.equal(totalRow.getCell(2).value, 37000000);
});


test('rows that need attention are shaded so a printed page stays readable', async () => {
  const workbook = await buildReconcileWorkbook(sample(), { generatedAt: GENERATED_AT });
  const sheet = workbook.getWorksheet('Đối chiếu 511');

  const shaded = [];
  sheet.eachRow((row, rowNumber) => {
    if (rowNumber < 5 || rowNumber === sheet.rowCount) return;
    if (row.getCell(1).fill?.fgColor?.argb === 'FFFDE9E9') shaded.push(row.getCell(1).value);
  });

  assert.deepEqual(shaded.sort(), ['12346', '12348'], 'dòng lệch và dòng thiếu phải được tô nền');
});


test('the source-log sheet is added only when diagnostics exist', async () => {
  const withLog = await buildReconcileWorkbook(sample(), {
    generatedAt: GENERATED_AT,
    diagnostics: [{ sourceFile: 'So_511.xlsx', sourceSheet: 'So 511', kind: '511', headerRow: 4, rowCount: 3, ok: true, reason: '' }],
  });

  const sheet = withLog.getWorksheet('Nguồn dữ liệu');
  assert.notEqual(sheet, undefined);
  assert.equal(sheet.getRow(5).getCell(1).value, 'So_511.xlsx');
  assert.equal(sheet.getRow(5).getCell(4).value, 4);
});

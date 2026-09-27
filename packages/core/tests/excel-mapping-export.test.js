import assert from 'node:assert/strict';
import test from 'node:test';
import ExcelJS from 'exceljs';

import {
  parseExcelBuffer,
  exportMappedExcel,
  autoMapFields,
  isFooterLabel,
  classifySourceRow,
  updateZoneCell,
  serializeZoneEdits,
  applyZoneEdits,
} from '../src/utils/excel.js';

const buildTemplate = async () => {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet('PO');
  ws.getCell('A1').value = { richText: [{ text: 'ACME ', font: { bold: true } }, { text: 'Supplier' }] };
  ws.getCell('A2').value = 'Order No:';
  ws.getCell('B2').value = 'PO-000';
  ws.getCell('A3').value = 'Date:';
  ws.getCell('B3').value = new Date(Date.UTC(2026, 0, 15));
  ws.getRow(4).values = ['No', 'Item Name', 'Qty', 'Unit Price', 'Amount'];
  // 3 empty data slots (rows 5-7), with a style on the first one
  ws.getCell('B5').font = { italic: true };
  ws.getCell('D8').value = 'Total';
  ws.getCell('E8').value = { formula: 'SUM(E5:E7)' };
  ws.getCell('E9').value = { formula: 'E8*1.1' };
  ws.getCell('A10').value = 'Other comments';
  ws.mergeCells('A10:C10');

  const lookup = wb.addWorksheet('Lookup');
  lookup.getCell('A1').value = 'Units';
  lookup.getCell('A2').value = 'pcs';
  return wb.xlsx.writeBuffer();
};

const buildSource = async () => {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet('Order');
  ws.getRow(1).values = ['Customer order'];
  ws.getRow(2).values = ['No', 'Product', 'Quantity', 'Price'];
  ws.getRow(3).values = [1, 'Mother board', 2, 100];
  ws.getRow(4).values = [2, 'Other-brand cable', 5, 3];
  ws.getRow(5).values = [];
  ws.getRow(6).values = [3, 'Keyboard', 1, 20];
  ws.getRow(7).values = [4, 'Mouse', 4, 10];
  ws.getRow(8).values = [5, 'Monitor', 1, 150];
  ws.getRow(9).values = ['Total', '', '', 283];
  ws.getRow(10).values = [6, 'Should not be read', 1, 1];
  return wb.xlsx.writeBuffer();
};

test('footer label detection uses whole words on the first cells', () => {
  assert.equal(isFooterLabel('Total'), true);
  assert.equal(isFooterLabel('Sub Total (VND):'), true);
  assert.equal(isFooterLabel('Tổng cộng'), true);
  assert.equal(isFooterLabel('合計'), true);
  assert.equal(isFooterLabel('Mother board'), false);
  assert.equal(isFooterLabel('Totalizer'), false);
  assert.equal(classifySourceRow([1, 'Mother board', 2, 100], 4), 'data');
  assert.equal(classifySourceRow(['', '', 'Grand total', 5], 4), 'footer');
  // keyword far to the right is not a label
  assert.equal(classifySourceRow([7, 'Cable', 2, 'tax included'], 4), 'data');
  assert.equal(classifySourceRow(['', '', '', ''], 4), 'blank');
});

test('source parsing reads all product rows and stops at the footer', async () => {
  const src = await parseExcelBuffer(await buildSource(), true);
  assert.deepEqual(src.headers, ['No', 'Product', 'Quantity', 'Price']);
  assert.equal(src.parsedRowCount, 5);
  assert.equal(src.allRows[0].Product, 'Mother board');
  assert.equal(src.allRows[1].Product, 'Other-brand cable');
  assert.equal(src.stoppedAtRow, 9);
  assert.equal(src.stopLabel, 'Total');
});

test('exportMappedExcel fills the template and returns an xlsx buffer', async () => {
  const src = await parseExcelBuffer(await buildSource(), true);
  const tpl = await parseExcelBuffer(await buildTemplate(), false);
  assert.equal(tpl.headerRowIndex, 3);
  assert.equal(tpl.footerStartRow, 8);
  assert.equal(tpl.existingDataSlots, 3);

  const rules = autoMapFields(src.headers, tpl.headers);
  assert.ok(rules.some(r => r.sourceCol === 'Product' && r.targetCol === 'Item Name'));

  // User edits the order number only (row 2 → index 1, col B → index 1)
  const headerZone = updateZoneCell(tpl.headerZone, 1, 1, 'PO-2026-09');

  const out = await exportMappedExcel({
    sourceAllRows: src.allRows,
    mappingRules: rules,
    targetBuffer: tpl.rawBuffer,
    headerRowIndex: tpl.headerRowIndex,
    headerZone,
    footerZone: tpl.footerZone,
    footerStartRow: tpl.footerStartRow,
    existingDataSlots: tpl.existingDataSlots,
  });
  assert.ok(out && out.byteLength > 0, 'returns a non-empty buffer');

  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(out);
  assert.deepEqual(wb.worksheets.map(s => s.name), ['PO', 'Lookup'], 'other sheets are kept');
  const ws = wb.getWorksheet('PO');

  // Header zone: edited cell changed, untouched rich text + date preserved
  assert.equal(ws.getCell('B2').value, 'PO-2026-09');
  assert.ok(Array.isArray(ws.getCell('A1').value.richText), 'rich text kept');
  assert.ok(ws.getCell('B3').value instanceof Date, 'date kept');

  // Data rows 5..9
  assert.equal(ws.getCell('B5').value, 'Mother board');
  assert.equal(ws.getCell('C5').value, 2);
  assert.equal(ws.getCell('B9').value, 'Monitor');

  // Footer shifted by 2 rows with formulas adjusted
  assert.equal(ws.getCell('D10').value, 'Total');
  assert.equal(ws.getCell('E10').value.formula, 'SUM(E5:E9)');
  assert.equal(ws.getCell('E11').value.formula, 'E10*1.1');
  assert.equal(ws.getCell('A12').value, 'Other comments');
  assert.ok(ws.getCell('A12').isMerged, 'footer merge shifted');
});

test('zone edit profiles persist only edited cells by rowNum/col', () => {
  const zone = [
    { rowNum: 1, cells: [{ col: 1, value: 'Title' }, { col: 2, value: '' }] },
    { rowNum: 2, cells: [{ col: 1, value: 'Order No:' }, { col: 2, value: 'PO-000' }] },
  ];
  const edited = updateZoneCell(zone, 1, 1, 'PO-123');
  assert.equal(zone[1].cells[1].value, 'PO-000', 'immutable');
  const saved = serializeZoneEdits(edited);
  assert.deepEqual(saved, [{ rowNum: 2, cells: [{ col: 2, value: 'PO-123' }] }]);

  const restored = applyZoneEdits(zone, saved);
  assert.equal(restored[1].cells[1].value, 'PO-123');
  assert.equal(restored[1].cells[1].edited, true);
  assert.equal(restored[0].cells[0].edited, undefined);

  // legacy profile format (rowIdx/address) is ignored safely
  assert.deepEqual(applyZoneEdits(zone, [{ rowIdx: 0, cells: [{ address: 'A1', value: 'x' }] }]), zone);
});

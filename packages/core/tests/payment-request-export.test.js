import assert from 'node:assert/strict';
import test from 'node:test';

import { buildPaymentRequestWorkbook } from '../src/utils/invoice/paymentRequestExport.js';
import { A4_PAPER_SIZE } from '../src/utils/excelReport.js';

const GENERATED_AT = new Date('2026-08-15T10:00:00');

const INVOICES = [
  {
    date: '01/07/2026',
    invoiceSymbol: '1C26TAA',
    invoiceNo: '00012345',
    seller: 'Công ty TNHH Thương mại Dịch vụ Minh Anh',
    sellerTax: '0101234567',
    amountBeforeTax: 10000000,
    vatAmount: 1000000,
    totalAmount: 11000000,
    rawFileName: 'HD_12345.xml',
  },
  {
    date: '05/07/2026',
    invoiceSymbol: '1C26TAA',
    invoiceNo: '00012346',
    seller: 'Vietjet Air',
    sellerTax: '0102030405',
    amountBeforeTax: 4545455,
    vatAmount: 454545,
    totalAmount: 5000000,
    rawFileName: 'vietjet.pdf',
  },
];

const build = () => buildPaymentRequestWorkbook(INVOICES, { generatedAt: GENERATED_AT });


test('totals are summed from the confirmed invoices only', async () => {
  const { totals } = await build();

  assert.equal(totals.amountBeforeTax, 14545455);
  assert.equal(totals.vatAmount, 1454545);
  assert.equal(totals.totalAmount, 16000000);
});


test('the sheet carries the Vietnamese form heading', async () => {
  const { workbook } = await build();
  const sheet = workbook.getWorksheet('Bảng kê ĐNTT');

  assert.equal(sheet.getRow(1).getCell(1).value, 'CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM');
  assert.equal(sheet.getRow(5).getCell(1).value, 'BẢNG KÊ ĐỀ NGHỊ THANH TOÁN');
  assert.match(String(sheet.getRow(6).getCell(1).value), /^Ngày lập:/);
});


// Chủ sở hữu đã chốt dùng mẫu này nên tờ in không còn đóng dấu bản nháp.
test('the printed form carries no draft stamp', async () => {
  const { workbook } = await build();
  const sheet = workbook.getWorksheet('Bảng kê ĐNTT');

  const printed = [];
  sheet.eachRow((row) => row.eachCell({ includeEmpty: false }, (cell) => {
    if (typeof cell.value === 'string') printed.push(cell.value);
  }));

  assert.equal(printed.some((text) => /BẢN NHÁP|CHƯA PHÊ DUYỆT/i.test(text)), false);
  assert.equal(/Bản nháp/i.test(sheet.headerFooter.oddFooter ?? ''), false);
});


test('money columns stay numeric with a thousands format', async () => {
  const { workbook } = await build();
  const sheet = workbook.getWorksheet('Bảng kê ĐNTT');
  const firstInvoice = sheet.getRow(9);

  assert.equal(firstInvoice.getCell(1).value, 1);
  // Ký hiệu hóa đơn là tiêu thức bắt buộc nên phải có cột riêng trên bảng kê.
  assert.equal(firstInvoice.getCell(3).value, '1C26TAA');
  assert.equal(firstInvoice.getCell(4).value, '00012345');
  assert.equal(firstInvoice.getCell(6).value, '0101234567');
  assert.equal(firstInvoice.getCell(7).value, 10000000);
  assert.match(firstInvoice.getCell(7).numFmt, /#,##0/);
  assert.equal(firstInvoice.getCell(9).value, 11000000);
});


test('a highlighted total row closes the table', async () => {
  const { workbook } = await build();
  const sheet = workbook.getWorksheet('Bảng kê ĐNTT');
  const totalRow = sheet.getRow(11);

  assert.equal(totalRow.getCell(1).value, 'Tổng cộng');
  assert.equal(totalRow.getCell(7).value, 14545455);
  assert.equal(totalRow.getCell(9).value, 16000000);
  assert.equal(totalRow.getCell(9).font.bold, true);
  assert.equal(totalRow.getCell(9).fill.fgColor.argb, 'FFFFF2CC');
});


test('the amount in words matches the printed total', async () => {
  const { workbook } = await build();
  const sheet = workbook.getWorksheet('Bảng kê ĐNTT');

  const wordsRow = sheet.getRow(13);
  assert.equal(wordsRow.getCell(1).value, 'Số tiền bằng chữ: Mười sáu triệu đồng ./.');
  assert.equal(sheet.getRow(14).getCell(1).value, 'Số chứng từ kèm theo: 2');
});


test('signature blocks and a signing gap are laid out for printing', async () => {
  const { workbook } = await build();
  const sheet = workbook.getWorksheet('Bảng kê ĐNTT');

  assert.equal(sheet.getRow(17).getCell(1).value, 'NGƯỜI ĐỀ NGHỊ');
  assert.equal(sheet.getRow(17).getCell(6).value, 'KẾ TOÁN TRƯỞNG / NGƯỜI DUYỆT');
  assert.equal(sheet.getRow(18).getCell(1).value, '(Ký, ghi rõ họ tên)');
  // Dòng trống cao để ký tay.
  assert.equal(sheet.getRow(19).height, 60);
});


test('the form is set up to print on one A4 width with repeating headers', async () => {
  const { workbook } = await build();
  const sheet = workbook.getWorksheet('Bảng kê ĐNTT');

  assert.equal(sheet.pageSetup.paperSize, A4_PAPER_SIZE);
  assert.equal(sheet.pageSetup.orientation, 'landscape');
  assert.equal(sheet.pageSetup.fitToWidth, 1);
  assert.equal(sheet.pageSetup.fitToHeight, 0);
  assert.equal(sheet.pageSetup.printTitlesRow, '8:8');
  assert.match(sheet.headerFooter.oddFooter, /Trang &P\/&N/);
  assert.equal(sheet.views[0].state, 'frozen');
});


test('an empty invoice list still produces a valid form', async () => {
  const { workbook, totals } = await buildPaymentRequestWorkbook([], { generatedAt: GENERATED_AT });
  const sheet = workbook.getWorksheet('Bảng kê ĐNTT');

  assert.equal(totals.totalAmount, 0);
  assert.equal(sheet.getRow(9).getCell(1).value, 'Tổng cộng');
  assert.equal(sheet.getRow(11).getCell(1).value, 'Số tiền bằng chữ: Không đồng ./.');
});

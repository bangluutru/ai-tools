import assert from 'node:assert/strict';
import test from 'node:test';

import {
  buildPaymentRequestForms,
  COLUMN_WIDTHS,
  monthSheetName,
} from '../src/utils/invoice/paymentRequestForm.js';
import { A4_PAPER_SIZE } from '../src/utils/excelReport.js';

const ISSUED_AT = new Date(2026, 5, 23);

const FORMS = [
  {
    company: {
      name: 'CÔNG TY SẢN XUẤT VÀ THƯƠNG MẠI HUMA MEDICAL',
      address: 'Số 107 ngõ 192 Lê Trọng Tấn, Phường Phương Liệt, Thành phố Hà Nội, Việt Nam',
    },
    content: 'Chi phí đi lại công tác từ 09/06/2026 đến 18/06/2026',
    rows: [
      { date: '19/05/2026', description: 'Vé máy bay TP Hà Nội - TP Huế', amount: 2859000, invoiceNo: '02236513' },
      { date: '13/06/2026', description: 'Phí đi lại', amount: 8000, invoiceNo: '01588440' },
      { date: '18/06/2026', description: 'Chi phí khám sức khỏe', amount: 1290000, invoiceNo: '8517' },
    ],
  },
  {
    company: { name: 'CÔNG TY CỔ PHẦN GENKI FAMI VIỆT NAM', address: 'Số 107 ngõ 192 Lê Trọng Tấn, Hà Nội' },
    content: 'Chi phí đi lại công tác ngày 14/06/2026',
    rows: [{ date: '14/06/2026', description: 'Phòng khách sạn', amount: 1515024, invoiceNo: '5529' }],
  },
];

const build = (forms = FORMS, options = {}) => buildPaymentRequestForms(forms, {
  issuedAt: ISSUED_AT,
  requester: 'Trần Hải Bằng',
  department: 'Ban Giám Đốc',
  accountant: 'Đào Thị Chích',
  invoiceLink: '20260609 - VIETNAM-LAO',
  ...options,
});


test('the whole period lands on one sheet named after the month', async () => {
  const { workbook, sheetName, totals, grandTotal } = await build();

  assert.equal(workbook.worksheets.length, 1);
  assert.equal(sheetName, '2606');
  assert.equal(monthSheetName(ISSUED_AT), '2606');
  assert.deepEqual(totals.map((item) => item.total), [4157000, 1515024]);
  assert.equal(grandTotal, 5672024);
});


test('a hand-typed period name replaces the default sheet name', async () => {
  const { sheetName } = await build(FORMS, { sheetName: '2606 bổ sung' });

  assert.equal(sheetName, '2606 bổ sung');
});


test('each company keeps its own form, stacked down the same sheet', async () => {
  const { workbook, totals } = await build();
  const sheet = workbook.worksheets[0];

  const [first, second] = totals;
  assert.equal(first.startRow, 1);
  // Ba dòng trống giữa hai giấy, đúng khoảng cách của sổ gốc.
  assert.equal(second.startRow, first.lastRow + 4);

  assert.equal(sheet.getCell(`A${second.startRow}`).value, 'CÔNG TY CỔ PHẦN GENKI FAMI VIỆT NAM');
  assert.equal(sheet.getCell(`A${second.startRow + 3}`).value, 'GIẤY ĐỀ NGHỊ THANH TOÁN');
  assert.equal(
    sheet.getCell(`A${second.startRow + 6}`).value,
    'Kính gửi: CÔNG TY CỔ PHẦN GENKI FAMI VIỆT NAM',
  );
  assert.equal(sheet.getCell(`A${second.lastRow}`).value, 'TRẦN HẢI BẰNG');
});


// In ra vẫn phải là các tờ rời để mỗi công ty ký một bản.
test('a page break separates one form from the next', async () => {
  const { workbook, totals } = await build();
  const sheet = workbook.worksheets[0];

  assert.deepEqual(
    sheet.rowBreaks.map((rowBreak) => rowBreak.id ?? rowBreak),
    [totals[0].lastRow],
  );
});


test('the heading block follows the Vietnamese payment request form', async () => {
  const { workbook } = await build();
  const sheet = workbook.worksheets[0];

  assert.equal(sheet.getCell('A1').value, 'CÔNG TY SẢN XUẤT VÀ THƯƠNG MẠI HUMA MEDICAL');
  assert.equal(sheet.getCell('A4').value, 'GIẤY ĐỀ NGHỊ THANH TOÁN');
  assert.equal(sheet.getCell('E5').value, 'Ngày 23 tháng 06 năm 2026');
  assert.equal(sheet.getCell('A7').value, 'Kính gửi: CÔNG TY SẢN XUẤT VÀ THƯƠNG MẠI HUMA MEDICAL');
  assert.equal(sheet.getCell('D9').value, 'Trần Hải Bằng');
  assert.equal(sheet.getCell('D10').value, 'Ban Giám Đốc');
  assert.equal(sheet.getCell('D11').value, 'Chi phí đi lại công tác từ 09/06/2026 đến 18/06/2026');
});


test('the detail table keeps the STT / date / content / amount / invoice columns', async () => {
  const { workbook } = await build();
  const sheet = workbook.worksheets[0];

  assert.deepEqual(
    ['A13', 'B13', 'C13', 'F13', 'G13'].map((ref) => sheet.getCell(ref).value),
    ['STT', 'Ngày tháng', 'Nội dung', 'Số tiền', 'Hoá đơn'],
  );
  assert.equal(sheet.getCell('A14').value, 1);
  assert.equal(sheet.getCell('B14').value, '19/05/2026');
  assert.equal(sheet.getCell('C14').value, 'Vé máy bay TP Hà Nội - TP Huế');
  assert.equal(sheet.getCell('F14').value, 2859000);
  assert.equal(sheet.getCell('F14').numFmt, '#,##0');
  // Số hóa đơn giữ nguyên số 0 đứng đầu nên phải là chuỗi.
  assert.equal(sheet.getCell('G14').value, '02236513');
});


test('the table is boxed with thin borders like the paper form', async () => {
  const { workbook } = await build();
  const sheet = workbook.worksheets[0];

  for (const ref of ['A13', 'G13', 'A14', 'G16', 'A17', 'F17']) {
    assert.equal(sheet.getCell(ref).border.top.style, 'thin', ref);
    assert.equal(sheet.getCell(ref).border.bottom.style, 'thin', ref);
  }
  // Khối chữ và khối ký nằm ngoài bảng nên không kẻ viền.
  assert.equal(sheet.getCell('A21').border?.top, undefined);
});


test('the total, invoice link and amount rows sit where the form expects them', async () => {
  const { workbook } = await build();
  const sheet = workbook.worksheets[0];

  assert.equal(sheet.getCell('A17').value, 'Tổng cộng');
  assert.deepEqual(sheet.getCell('F17').value, { formula: 'SUM(F14:F16)', result: 4157000 });
  assert.equal(sheet.getCell('A18').value, 'Link Hoá đơn');
  assert.equal(sheet.getCell('F18').value, '20260609 - VIETNAM-LAO');
  assert.equal(sheet.getCell('A20').value, 'Số tiền:');
  assert.deepEqual(sheet.getCell('C20').value, { formula: 'F17', result: 4157000 });
});


test('the amount in words uses the form wording', async () => {
  const { workbook } = await build();
  const sheet = workbook.worksheets[0];

  assert.equal(
    sheet.getCell('A21').value,
    '(Viết bằng chữ: Bốn triệu một trăm năm mươi bảy nghìn đồng chẵn./.)',
  );
});


test('an http invoice link becomes a real hyperlink', async () => {
  const { workbook } = await build(FORMS, { invoiceLink: 'https://drive.example.com/hoa-don' });
  const sheet = workbook.worksheets[0];

  assert.deepEqual(sheet.getCell('F18').value, {
    text: 'https://drive.example.com/hoa-don',
    hyperlink: 'https://drive.example.com/hoa-don',
  });
});


test('the signature block leaves room to sign by hand', async () => {
  const { workbook } = await build();
  const sheet = workbook.worksheets[0];

  assert.equal(sheet.getCell('A23').value, 'Người đề nghị thanh toán');
  assert.equal(sheet.getCell('F23').value, 'Kế toán');
  assert.equal(sheet.getCell('A24').value, '(Ký, họ tên)');
  assert.equal(sheet.getCell('A29').value, 'TRẦN HẢI BẰNG');
  assert.equal(sheet.getCell('F29').value, 'ĐÀO THỊ CHÍCH');
});


test('a shorter table pulls the whole block up with it', async () => {
  const { workbook, totals } = await build();
  const sheet = workbook.worksheets[0];
  const { startRow } = totals[1];

  assert.equal(sheet.getCell(`A${startRow + 14}`).value, 'Tổng cộng');
  assert.equal(sheet.getCell(`A${startRow + 15}`).value, 'Link Hoá đơn');
  assert.equal(sheet.getCell(`A${startRow + 17}`).value, 'Số tiền:');
  assert.equal(sheet.getCell(`A${startRow + 26}`).value, 'TRẦN HẢI BẰNG');
});


test('every sheet prints on portrait A4 with the form column widths', async () => {
  const { workbook } = await build();

  for (const sheet of workbook.worksheets) {
    assert.equal(sheet.pageSetup.paperSize, A4_PAPER_SIZE);
    assert.equal(sheet.pageSetup.orientation, 'portrait');
    assert.equal(sheet.pageSetup.fitToWidth, 1);
    assert.deepEqual(
      COLUMN_WIDTHS.map((_, index) => sheet.getColumn(index + 1).width),
      COLUMN_WIDTHS,
    );
  }
});


test('an empty list still produces one printable blank form', async () => {
  const { workbook, grandTotal } = await buildPaymentRequestForms([], { issuedAt: ISSUED_AT });
  const sheet = workbook.worksheets[0];

  assert.equal(grandTotal, 0);
  assert.equal(sheet.getCell('A4').value, 'GIẤY ĐỀ NGHỊ THANH TOÁN');
  assert.equal(sheet.getCell('A15').value, 'Tổng cộng');
  assert.equal(sheet.getCell('A19').value, '(Viết bằng chữ: Không đồng chẵn./.)');
});

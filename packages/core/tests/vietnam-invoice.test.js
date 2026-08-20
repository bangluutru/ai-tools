import assert from 'node:assert/strict';
import test from 'node:test';

import {
  extractInvoiceFields,
  findLabeledAmount,
  findLabeledValue,
  INVOICE_FORM_TYPES,
  LABELS,
  missingInvoiceFields,
  normalizeTaxCode,
  parseInvoiceSymbol,
  validateInvoiceFields,
} from '../src/utils/invoice/vietnamInvoice.js';

// Bố cục theo Mẫu số 01/GTGT Phụ lục V Thông tư 91/2026/TT-BTC.
const VAT_INVOICE = `
HÓA ĐƠN GIÁ TRỊ GIA TĂNG
(VAT INVOICE)
Ký hiệu: 1C26TAA
Số: 00012345
Ngày 05 tháng 07 năm 2026
Tên người bán: CÔNG TY TNHH THƯƠNG MẠI DỊCH VỤ MINH ANH
Mã số thuế: 0101234567
Địa chỉ: Số 12 phố Lý Thường Kiệt, Hà Nội
Điện thoại: 024 3456 7890 Số tài khoản: 1234567890123
Tên người mua: CÔNG TY CỔ PHẦN HUMA
Mã số thuế: 0108889999
Địa chỉ: Số 5 Nguyễn Trãi, Hà Nội
Hình thức thanh toán: CK Số tài khoản 9876543210
Đồng tiền thanh toán: VND
STT Tên hàng hóa, dịch vụ Đơn vị tính Số lượng Đơn giá Thuế suất Thành tiền chưa có thuế GTGT
1 Vật tư văn phòng Bộ 10 1.000.000 10% 10.000.000
Tổng tiền chưa có thuế GTGT: 10.000.000
Thuế suất GTGT: 10%
Tiền thuế GTGT: 1.000.000
Tổng tiền thanh toán: 11.000.000
Số tiền viết bằng chữ: Mười một triệu đồng chẵn
`;

// Mẫu số 02/BH - phương pháp trực tiếp, không có thuế GTGT.
const SALES_INVOICE = `
HÓA ĐƠN BÁN HÀNG
Ký hiệu: 2C26TBB
Số: 45
Ngày 12 tháng 07 năm 2026
Tên người bán: HỘ KINH DOANH TRẦN VĂN B
Mã số thuế: 0109999888
Địa chỉ: 45 Lê Lợi, Đà Nẵng
Tên người mua: CÔNG TY CỔ PHẦN HUMA
Hình thức thanh toán: TM MST: 0108889999
Đồng tiền thanh toán: VND
STT Tên hàng hóa, dịch vụ Đơn vị tính Số lượng Đơn giá Thành tiền
1 Dịch vụ ăn uống Lần 1 2.500.000 2.500.000
Tổng tiền thanh toán: 2.500.000
Số tiền viết bằng chữ: Hai triệu năm trăm nghìn đồng
`;

// Bản thể hiện tách nhãn và giá trị thành hai dòng khác nhau.
const SPLIT_LAYOUT = `
HÓA ĐƠN GIÁ TRỊ GIA TĂNG
Ký hiệu:
1K26TYY
Số:
00000078
Ngày 01 tháng 08 năm 2026
Tên người bán:
KHÁCH SẠN MƯỜNG THANH ĐÀ NẴNG
Mã số thuế:
0400111222
Tên người mua:
CÔNG TY CỔ PHẦN HUMA
Mã số thuế:
0108889999
Tổng tiền chưa có thuế GTGT:
5.000.000
Tiền thuế GTGT:
400.000
Tổng tiền thanh toán:
5.400.000
Số tiền viết bằng chữ: Năm triệu bốn trăm nghìn đồng
`;


// Bản thể hiện song ngữ của các phần mềm phát hành (Viettel, VNPT, MISA...):
// khoản 2 Điều 5 cho phép đặt tiếng Anh trong ngoặc ngay sau nhãn tiếng Việt.
const BILINGUAL_INVOICE = `
HÓA ĐƠN GIÁ TRỊ GIA TĂNG
(VAT INVOICE)
Ký hiệu (Serial): 1C26TAA
Số (No.): 00000123
Ngày (Date) 05 tháng (month) 07 năm (year) 2026
Đơn vị bán hàng (Seller): CÔNG TY TNHH THƯƠNG MẠI DỊCH VỤ MINH ANH
Mã số thuế (Tax code): 0101234567
Địa chỉ (Address): Số 12 phố Lý Thường Kiệt, Hà Nội
Họ tên người mua hàng (Buyer): Nguyễn Văn A
Tên đơn vị (Company): CÔNG TY CỔ PHẦN HUMA
Mã số thuế (Tax code): 0108889999
Hình thức thanh toán (Payment method): CK
Cộng tiền hàng (Total amount): 10.000.000
Thuế suất GTGT (VAT rate): 10% Tiền thuế GTGT (VAT amount): 1.000.000
Tổng cộng tiền thanh toán (Total payment): 11.000.000
Số tiền viết bằng chữ (In words): Mười một triệu đồng chẵn
`;


test('reads a bilingual invoice where English labels sit in brackets', () => {
  const fields = extractInvoiceFields(BILINGUAL_INVOICE);

  // "Số (No.):" và "Ngày (Date) ... tháng (month) ..." từng làm hỏng cả hai trường này.
  assert.equal(fields.invoiceNo, '00000123');
  assert.equal(fields.date, '05/07/2026');
  // Bản dịch trong ngoặc không được dính vào giá trị.
  assert.equal(fields.seller, 'CÔNG TY TNHH THƯƠNG MẠI DỊCH VỤ MINH ANH');
  assert.equal(fields.amountInWords, 'Mười một triệu đồng chẵn');
  assert.equal(fields.sellerTax, '0101234567');
  assert.equal(fields.buyerTax, '0108889999');
  assert.deepEqual(missingInvoiceFields(fields), []);
  assert.deepEqual(validateInvoiceFields(fields), []);
});


test('does not let a bracketed translation hijack the total', () => {
  const fields = extractInvoiceFields(BILINGUAL_INVOICE);

  // "Cộng tiền hàng (Total amount)" chứa nhãn tiếng Anh của tổng thanh toán,
  // nhưng dòng tổng thật mới là dòng bắt đầu bằng nhãn của nó.
  assert.equal(fields.totalAmount, 11000000);
  assert.equal(fields.amountBeforeTax, 10000000);
  assert.equal(fields.vatAmount, 1000000);
});


test('picks the longest matching label so buyer name is not truncated', () => {
  const fields = extractInvoiceFields(BILINGUAL_INVOICE);
  assert.equal(fields.buyer, 'Nguyễn Văn A');
});


test('falls back to the amount in words when the total line cannot be read', () => {
  const fields = extractInvoiceFields(`
HÓA ĐƠN GIÁ TRỊ GIA TĂNG
Ký hiệu: 1C26TAA
Số: 00000123
Ngày 05 tháng 07 năm 2026
Tên người bán: CÔNG TY ABC
Mã số thuế: 0101234567
Số tiền viết bằng chữ: Mười một triệu đồng chẵn
`);

  assert.equal(fields.totalAmount, 11000000);
  assert.equal(fields.totalSource, 'words');
  // Nguồn số liệu bất thường phải được nói rõ chứ không im lặng.
  assert.equal(
    validateInvoiceFields(fields).some((warning) => /Số tiền viết bằng chữ/.test(warning)),
    true,
  );
});


test('parses the invoice symbol exactly as Phụ lục I defines it', () => {
  const symbol = parseInvoiceSymbol('1C26TAA');

  assert.equal(symbol.raw, '1C26TAA');
  assert.equal(symbol.symbol, 'C26TAA');
  assert.equal(symbol.formCode, INVOICE_FORM_TYPES[1].code);
  assert.equal(symbol.hasTaxAuthorityCode, true, 'C là hóa đơn có mã của cơ quan thuế');
  assert.equal(symbol.year, 2026);
  assert.equal(symbol.usageChar, 'T');
  assert.equal(symbol.expectsVat, true);

  const noCode = parseInvoiceSymbol('1K26TYY');
  assert.equal(noCode.hasTaxAuthorityCode, false, 'K là hóa đơn không có mã');

  const sales = parseInvoiceSymbol('2C26TBB');
  assert.equal(sales.formCode, 'BH');
  assert.equal(sales.expectsVat, false);

  const cashRegister = parseInvoiceSymbol('1C26MAA');
  assert.equal(cashRegister.usageChar, 'M');
  assert.match(cashRegister.usageName, /máy tính tiền/);
});


test('rejects strings that do not follow the six-character symbol rule', () => {
  // Chữ thứ tư phải thuộc T D L M N B G H X F.
  assert.equal(parseInvoiceSymbol('1C26ZAA'), null);
  // Năm phải là hai chữ số.
  assert.equal(parseInvoiceSymbol('1C6TAA'), null);
  // Ký tự đầu phải là C hoặc K.
  assert.equal(parseInvoiceSymbol('1A26TAA'), null);
});


test('normalises Vietnamese tax codes including 13-digit branch codes', () => {
  assert.equal(normalizeTaxCode('0101234567'), '0101234567');
  assert.equal(normalizeTaxCode('MST: 0101234567'), '0101234567');
  assert.equal(normalizeTaxCode('0101234567-001'), '0101234567-001');
  assert.equal(normalizeTaxCode('không có'), '');
});


test('reads every mandatory field from a VAT invoice', () => {
  const fields = extractInvoiceFields(VAT_INVOICE);

  assert.equal(fields.symbol.raw, '1C26TAA');
  assert.equal(fields.invoiceNo, '00012345');
  assert.equal(fields.date, '05/07/2026');
  assert.equal(fields.seller, 'CÔNG TY TNHH THƯƠNG MẠI DỊCH VỤ MINH ANH');
  assert.equal(fields.amountBeforeTax, 10000000);
  assert.equal(fields.vatAmount, 1000000);
  assert.equal(fields.totalAmount, 11000000);
  assert.equal(fields.amountInWordsValue, 11000000);
  assert.deepEqual(missingInvoiceFields(fields), []);
  assert.deepEqual(validateInvoiceFields(fields), []);
});


test('assigns the first tax code to the seller and the second to the buyer', () => {
  const fields = extractInvoiceFields(VAT_INVOICE);

  // Cả hai bên đều mang nhãn "Mã số thuế"; thứ tự khối quyết định chủ sở hữu.
  assert.equal(fields.sellerTax, '0101234567');
  assert.equal(fields.buyerTax, '0108889999');
});


test('never mistakes Số tài khoản, Số lượng or Mã số thuế for the invoice number', () => {
  const fields = extractInvoiceFields(VAT_INVOICE);

  assert.equal(fields.invoiceNo, '00012345');
  assert.notEqual(fields.invoiceNo, '1234567890123');
  assert.notEqual(fields.invoiceNo, '0101234567');
});


test('reads a direct-method sales invoice without inventing VAT', () => {
  const fields = extractInvoiceFields(SALES_INVOICE);

  assert.equal(fields.symbol.formCode, 'BH');
  assert.equal(fields.invoiceNo, '45');
  assert.equal(fields.sellerTax, '0109999888');
  assert.equal(fields.totalAmount, 2500000);
  assert.equal(fields.vatAmount, 0, 'hóa đơn bán hàng không có thuế GTGT');
  assert.equal(fields.amountInWordsValue, 2500000);

  // Không được đòi hỏi phần tách thuế ở loại hóa đơn vốn không có thuế.
  assert.equal(missingInvoiceFields(fields).includes('taxBreakdown'), false);
  assert.deepEqual(validateInvoiceFields(fields), []);
});


test('reads a layout where labels and values sit on separate lines', () => {
  const fields = extractInvoiceFields(SPLIT_LAYOUT);

  assert.equal(fields.symbol.raw, '1K26TYY');
  assert.equal(fields.invoiceNo, '00000078');
  assert.equal(fields.date, '01/08/2026');
  assert.equal(fields.seller, 'KHÁCH SẠN MƯỜNG THANH ĐÀ NẴNG');
  assert.equal(fields.sellerTax, '0400111222');
  assert.equal(fields.buyerTax, '0108889999');
  assert.equal(fields.totalAmount, 5400000);
  assert.deepEqual(validateInvoiceFields(fields), []);
});


test('flags a total that disagrees with the printed amount in words', () => {
  const fields = extractInvoiceFields(
    VAT_INVOICE.replace('Số tiền viết bằng chữ: Mười một triệu đồng chẵn', 'Số tiền viết bằng chữ: Mười triệu đồng chẵn'),
  );

  const warnings = validateInvoiceFields(fields);
  assert.equal(warnings.length, 1);
  assert.match(warnings[0], /Số tiền bằng chữ.*không khớp tổng thanh toán/);
});


test('flags a tax breakdown that does not add up to the total', () => {
  const fields = extractInvoiceFields(VAT_INVOICE.replace('Tiền thuế GTGT: 1.000.000', 'Tiền thuế GTGT: 900.000'));

  const warnings = validateInvoiceFields(fields);
  assert.equal(warnings.some((warning) => /không khớp tổng thanh toán/.test(warning)), true);
});


test('flags a symbol year that disagrees with the invoice date', () => {
  const fields = extractInvoiceFields(VAT_INVOICE.replace('Ký hiệu: 1C26TAA', 'Ký hiệu: 1C25TAA'));

  const warnings = validateInvoiceFields(fields);
  assert.equal(warnings.some((warning) => /Năm trên ký hiệu/.test(warning)), true);
});


test('reports which mandatory fields are missing instead of guessing them', () => {
  const fields = extractInvoiceFields('Biên nhận thanh toán\nCảm ơn quý khách');

  const missing = missingInvoiceFields(fields);
  assert.equal(missing.includes('invoiceNo'), true);
  assert.equal(missing.includes('sellerTax'), true);
  assert.equal(missing.includes('totalAmount'), true);
  assert.equal(fields.totalAmount, 0, 'không được bịa số tiền');
});


test('label helpers pick the most specific amount label first', () => {
  const lines = [
    'Tổng tiền chưa có thuế GTGT: 10.000.000',
    'Tổng tiền thanh toán: 11.000.000',
  ];

  assert.equal(findLabeledAmount(lines, LABELS.totalAmount).amount, 11000000);
  assert.equal(findLabeledAmount(lines, LABELS.amountBeforeTax).amount, 10000000);
  assert.equal(findLabeledValue(['Ký hiệu: 1C26TAA'], LABELS.symbol).value, '1C26TAA');
});


// Bản thể hiện vé máy bay hay dùng dấu cách làm dấu phân nhóm nghìn. Cắt số ở
// dấu cách đầu tiên biến "2 859 000" thành 2 — đúng lỗi người dùng gặp.
const SPACED_TICKET = [
  'HÓA ĐƠN GIÁ TRỊ GIA TĂNG',
  'Ký hiệu: 1C26TAA',
  'Số: 02236513',
  'Ngày 19 tháng 05 năm 2026',
  'Tên người bán: CÔNG TY CỔ PHẦN HÀNG KHÔNG VIETJET',
  'Mã số thuế: 0102325399',
  'Tên người mua: CÔNG TY SẢN XUẤT VÀ THƯƠNG MẠI HUMA MEDICAL',
  'Mã số thuế: 0101234567',
  'STT Tên hàng hóa, dịch vụ Số lượng Đơn giá Thành tiền',
  '1 Vé máy bay HAN-VTE 1 2 859 000 2 859 000',
  'Tổng tiền thanh toán: 2 859 000',
  'Số tiền viết bằng chữ: Hai triệu tám trăm năm mươi chín nghìn đồng chẵn',
].join('\n');


test('reads thousands grouped with spaces instead of stopping at the first digit', () => {
  const fields = extractInvoiceFields(SPACED_TICKET);

  assert.equal(fields.totalAmount, 2_859_000);
  assert.equal(fields.amountInWordsValue, 2_859_000);
});


test('a leading line number does not get mistaken for the amount', () => {
  const fields = extractInvoiceFields(
    SPACED_TICKET.replace('Tổng tiền thanh toán: 2 859 000', 'Tổng tiền thanh toán: 1 2.859.000'),
  );

  assert.equal(fields.totalAmount, 2_859_000);
});


// Đọc lệch dấu chấm nghìn khiến 4.246.000 thành 4.246.000.000; chữ viết không
// có dấu phân nhóm nên là bản đối chứng bắt được lỗi này.
test('an amount read a thousand times too big is corrected from the words', () => {
  const fields = extractInvoiceFields([
    'Ký hiệu: 1C26TAA',
    'Số: 02236510',
    'Ngày 19 tháng 05 năm 2026',
    'Tên người bán: CÔNG TY CỔ PHẦN HÀNG KHÔNG VIETJET',
    'Mã số thuế: 0102325399',
    'Tổng tiền thanh toán: 4.246.000.000',
    'Số tiền viết bằng chữ: Bốn triệu hai trăm bốn mươi sáu nghìn đồng chẵn',
  ].join('\n'));

  assert.equal(fields.totalAmount, 4_246_000);
  assert.equal(fields.numericTotal, 4_246_000_000);
  assert.equal(fields.totalSource, 'words-override');
  assert.match(validateInvoiceFields(fields)[0], /đã lấy theo chữ/);
});


// Khi bảng thuế xác nhận cột số thì cột số mới là bên đáng tin.
test('a total backed by the tax breakdown is kept even if the words disagree', () => {
  const fields = extractInvoiceFields([
    'Ký hiệu: 1C26TAA',
    'Số: 00012345',
    'Ngày 19 tháng 05 năm 2026',
    'Tên người bán: CÔNG TY TNHH ABC',
    'Mã số thuế: 0102325399',
    'Tổng tiền chưa có thuế GTGT: 10.000.000',
    'Tiền thuế GTGT: 1.000.000',
    'Tổng tiền thanh toán: 11.000.000',
    'Số tiền viết bằng chữ: Mười triệu đồng chẵn',
  ].join('\n'));

  assert.equal(fields.totalAmount, 11_000_000);
  assert.equal(fields.totalSource, 'label');
  assert.match(validateInvoiceFields(fields)[0], /Số tiền bằng chữ.*không khớp/);
});

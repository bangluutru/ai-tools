import assert from 'node:assert/strict';
import test from 'node:test';

import { analyzeVietnameseAmountWords, parseVietnameseAmountWords } from '../src/utils/invoice/amountWords.js';
import {
  extractInvoiceFields,
  isValidTaxCodeChecksum,
  validateInvoiceFields,
} from '../src/utils/invoice/vietnamInvoice.js';
import {
  deriveInvoiceAmounts,
  isSameInvoiceDocument,
  linkRelatedInvoices,
  matchingVatRate,
  mergeInvoiceBatch,
  REPLACED_WARNING_PREFIX,
} from '../src/utils/invoice/validation.js';
import {
  convertForeignAmounts,
  readInvoiceCurrency,
  readInvoiceRelation,
} from '../src/utils/invoice/xmlInvoiceFields.js';
import { localDateStamp } from '../src/utils/invoice/paymentRequestExport.js';
import {
  checkEditedMetadataAgainstXml,
  extractMetadataFromXmlString,
  findFallbackInvoiceNumber,
  getProviderById,
  validateInvoiceXml,
} from '../src/utils/invoice/xmlFetcher/index.js';

// ---------------------------------------------------------------------------
// I1 — hóa đơn điều chỉnh giảm: số âm và chữ "Âm".

test('I1: amount words starting with "Âm" read as a negative amount', () => {
  assert.equal(parseVietnameseAmountWords('Âm một triệu không trăm tám mươi nghìn đồng'), -1_080_000);
  assert.equal(parseVietnameseAmountWords('Âm năm trăm nghìn đồng chẵn'), -500_000);
});

const ADJUSTMENT_INVOICE = [
  'HÓA ĐƠN GIÁ TRỊ GIA TĂNG',
  'Ký hiệu: 1C26TAA',
  'Số: 00000456',
  'Ngày 10 tháng 07 năm 2026',
  'Tên người bán: CÔNG TY TNHH ABC',
  'Mã số thuế: 0102325399',
  'Tổng tiền chưa có thuế GTGT: -1.000.000',
  'Tiền thuế GTGT: -80.000',
  'Tổng tiền thanh toán: -1.080.000',
  'Số tiền viết bằng chữ: Âm một triệu không trăm tám mươi nghìn đồng',
].join('\n');

test('I1: a leading minus on a PDF amount is kept', () => {
  const fields = extractInvoiceFields(ADJUSTMENT_INVOICE);
  assert.equal(fields.totalAmount, -1_080_000);
  assert.equal(fields.amountBeforeTax, -1_000_000);
  assert.equal(fields.vatAmount, -80_000);
  assert.equal(fields.amountInWordsValue, -1_080_000);
  const warnings = validateInvoiceFields(fields);
  assert.ok(warnings.some((warning) => /điều chỉnh giảm/.test(warning)));
  assert.ok(!warnings.some((warning) => /không khớp/.test(warning)));
});

test('I1: an accounting-style (1.080.000) amount is negative', () => {
  const fields = extractInvoiceFields(ADJUSTMENT_INVOICE
    .replace('Tổng tiền thanh toán: -1.080.000', 'Tổng tiền thanh toán: (1.080.000)'));
  assert.equal(fields.totalAmount, -1_080_000);
});

test('I1: a hyphen that is not a minus sign does not flip the amount', () => {
  const fields = extractInvoiceFields(ADJUSTMENT_INVOICE
    .replace('Tổng tiền thanh toán: -1.080.000', 'Tổng tiền thanh toán - 1.080.000')
    .replace('Tổng tiền chưa có thuế GTGT: -1.000.000', 'Tổng tiền chưa có thuế GTGT: 1.000.000')
    .replace('Tiền thuế GTGT: -80.000', 'Tiền thuế GTGT: 80.000')
    .replace('Âm một', 'Một'));
  assert.equal(fields.totalAmount, 1_080_000);
});

test('I1: words "Âm" correct a total whose minus sign was lost', () => {
  const fields = extractInvoiceFields([
    'Ký hiệu: 1C26TAA',
    'Số: 00000456',
    'Tên người bán: CÔNG TY TNHH ABC',
    'Mã số thuế: 0102325399',
    'Tổng tiền thanh toán: 1.080.000',
    'Số tiền viết bằng chữ: Âm một triệu không trăm tám mươi nghìn đồng',
  ].join('\n'));
  assert.equal(fields.totalAmount, -1_080_000);
  assert.equal(fields.totalSource, 'words-override');
});

// ---------------------------------------------------------------------------
// I2 — tiền thuế suy ra phải khớp một mức thuế suất.

test('I2: VAT derived from total − before-tax is accepted only at a real VAT rate', () => {
  // Vé máy bay: 2.363.636 chưa thuế + 236.364 thuế 10% + 250.000 thu hộ chưa đọc được.
  const airline = deriveInvoiceAmounts({ totalAmount: 2_850_000, amountBeforeTax: 2_363_636 });
  assert.equal(airline.vatAmount, 0, 'không được ghi 486.364 là tiền thuế');
  assert.equal(airline.vatAmountDerived, false);
  assert.equal(airline.warnings.length, 1);
  assert.match(airline.warnings[0], /không khớp mức thuế suất/);

  const plain = deriveInvoiceAmounts({ totalAmount: 2_600_000, amountBeforeTax: 2_363_636 });
  assert.equal(plain.vatAmount, 236_364);
  assert.equal(plain.vatAmountDerived, true);
  assert.deepEqual(plain.warnings, []);

  // Có khoản thu hộ đọc được thì phần còn lại đúng là thuế.
  const withCollection = deriveInvoiceAmounts({
    totalAmount: 2_850_000, amountBeforeTax: 2_363_636, authorityCollection: 250_000,
  });
  assert.equal(withCollection.vatAmount, 236_364);
});

test('I2: rate matching tolerates per-line rounding but not arbitrary gaps', () => {
  assert.equal(matchingVatRate(1_000_000, 80_000), 8);
  assert.equal(matchingVatRate(1_000_000, 80_002), 8);
  assert.equal(matchingVatRate(1_000_000, 50_000), 5);
  assert.equal(matchingVatRate(1_000_000, 123_456), null);
  assert.equal(matchingVatRate(-1_000_000, -100_000), 10);
  assert.equal(matchingVatRate(1_000_000, -100_000), null);
});

test('I2/I5: derivation keeps the sign of an adjustment invoice', () => {
  const amounts = deriveInvoiceAmounts({ totalAmount: -1_080_000, amountBeforeTax: -1_000_000 });
  assert.equal(amounts.vatAmount, -80_000);
  assert.equal(amounts.totalAmount, -1_080_000);
});

// ---------------------------------------------------------------------------
// I3 — "tỉ", "nghìn tỷ" và chỉ cho chữ thay số khi chắc chắn.

test('I3: tỉ/tỷ and nghìn tỷ are read at the right scale', () => {
  assert.equal(parseVietnameseAmountWords('Một tỉ hai trăm triệu đồng'), 1_200_000_000);
  assert.equal(parseVietnameseAmountWords('Một tỷ hai trăm triệu đồng'), 1_200_000_000);
  assert.equal(parseVietnameseAmountWords('Một nghìn tỷ đồng'), 1_000_000_000_000);
  assert.equal(parseVietnameseAmountWords('Hai nghìn năm trăm tỷ đồng'), 2_500_000_000_000);
  assert.equal(parseVietnameseAmountWords('Một ngàn tỉ không trăm linh năm triệu đồng'), 1_000_005_000_000);
  assert.equal(parseVietnameseAmountWords('Một tỷ một nghìn đồng'), 1_000_001_000);
  assert.equal(parseVietnameseAmountWords('Một trăm lẻ năm nghìn đồng'), 105_000);
  assert.equal(parseVietnameseAmountWords('Ba mươi mốt nghìn đồng'), 31_000);
  assert.equal(parseVietnameseAmountWords('Mười lăm triệu đồng'), 15_000_000);
});

test('I3: "Việt Nam đồng" does not add a phantom five', () => {
  assert.equal(parseVietnameseAmountWords('Một triệu Việt Nam đồng'), 1_000_000);
});

test('I3: unknown words lower the confidence of the parse', () => {
  assert.equal(analyzeVietnameseAmountWords('Một triệu đồng').confident, true);
  assert.equal(analyzeVietnameseAmountWords('Một triệu abc đồng').confident, false);
  assert.equal(analyzeVietnameseAmountWords('Một hai triệu đồng').confident, false);
});

const WORDS_INVOICE = (total, words) => [
  'Ký hiệu: 1C26TAA',
  'Số: 00012345',
  'Ngày 19 tháng 05 năm 2026',
  'Tên người bán: CÔNG TY TNHH ABC',
  'Mã số thuế: 0102325399',
  `Tổng tiền thanh toán: ${total}`,
  `Số tiền viết bằng chữ: ${words}`,
].join('\n');

test('I3: "Một tỉ hai trăm triệu" no longer overrides a correct total with 201,000,000', () => {
  const fields = extractInvoiceFields(WORDS_INVOICE('1.200.000.000', 'Một tỉ hai trăm triệu đồng'));
  assert.equal(fields.totalAmount, 1_200_000_000);
  assert.equal(fields.totalSource, 'label');
});

test('I3: a mismatch that is not a scale misread is warned about, not overridden', () => {
  const fields = extractInvoiceFields(WORDS_INVOICE('1.200.000', 'Một triệu một trăm nghìn đồng'));
  assert.equal(fields.totalAmount, 1_200_000);
  assert.equal(fields.totalSource, 'label');
  assert.ok(validateInvoiceFields(fields).some((warning) => /không khớp tổng thanh toán/.test(warning)));
});

test('I3: an unconfident words parse never overrides the numeric total', () => {
  const fields = extractInvoiceFields(WORDS_INVOICE('4.246.000.000', 'Bốn triệu hai trăm bốn mươi sáu nghìn xyz đồng'));
  assert.equal(fields.totalAmount, 4_246_000_000);
  assert.equal(fields.totalSource, 'label');
});

// ---------------------------------------------------------------------------
// Mã số thuế: chữ số kiểm tra và câu cảnh báo.

test('tax code checksum follows the GDT mod-11 rule', () => {
  assert.equal(isValidTaxCodeChecksum('0100107518'), true); // Vietnam Airlines
  assert.equal(isValidTaxCodeChecksum('0102325399'), true); // Vietjet
  assert.equal(isValidTaxCodeChecksum('0102325399-001'), true);
  assert.equal(isValidTaxCodeChecksum('0102325398'), false);
  assert.equal(isValidTaxCodeChecksum('001099012345'), true, 'mã 12 chữ số không có chữ số kiểm tra mod 11');
  assert.equal(isValidTaxCodeChecksum('12345'), null);
});

test('tax code warnings name 10, 12 or 13 digits and flag a bad check digit', () => {
  const base = { symbol: null, date: '', totalAmount: 0 };
  assert.deepEqual(validateInvoiceFields({ ...base, sellerTax: '001099012345' }), []);
  assert.match(validateInvoiceFields({ ...base, sellerTax: '12345' })[0], /10, 12 hoặc 13 chữ số/);
  assert.match(validateInvoiceFields({ ...base, sellerTax: '0102325398' })[0], /sai chữ số kiểm tra/);
});

// ---------------------------------------------------------------------------
// I4 — ghép cặp XML/PDF.

test('I4: same base name is not enough to drop a PDF of a different invoice', () => {
  const xml = { rawType: 'XML', rawFileName: 'hoadon.xml', invoiceNo: '00000123', sellerTax: '0102325399', totalAmount: 8000 };
  const otherPdf = { rawType: 'PDF', rawFileName: 'hoadon.pdf', invoiceNo: '00000999', sellerTax: '0100107518', totalAmount: 5000 };
  assert.equal(isSameInvoiceDocument(xml, otherPdf), false);

  const { invoices } = mergeInvoiceBatch([], [xml, otherPdf]);
  assert.equal(invoices.length, 2);
});

test('I4: same name pairs when one identifying field agrees and none conflict', () => {
  const xml = { rawType: 'XML', rawFileName: 'hoadon.xml', invoiceNo: '123', sellerTax: '0102325399', totalAmount: 8000 };
  // PDF in số có số 0 đứng đầu và không đọc được tổng tiền.
  const pdf = { rawType: 'PDF', rawFileName: 'hoadon.pdf', invoiceNo: '00000123', sellerTax: '', totalAmount: 0 };
  assert.equal(isSameInvoiceDocument(xml, pdf), true);
  assert.deepEqual(mergeInvoiceBatch([], [pdf, xml]).invoices.map((item) => item.rawType), ['XML']);
});

test('I4: inside a ZIP only files in the same folder are paired', () => {
  const xml = {
    rawType: 'XML', rawFileName: 'hd1.xml', entryPath: 'thang6/hd1.xml', zipName: 'q3.zip',
    invoiceNo: 'Chưa rõ số', sellerTax: '0102325399', totalAmount: 8000,
  };
  const pdfOtherFolder = { ...xml, rawType: 'PDF', rawFileName: 'hd1.pdf', entryPath: 'thang7/hd1.pdf', date: '' };
  const pdfSameFolder = { ...pdfOtherFolder, entryPath: 'thang6/hd1.pdf' };
  assert.equal(isSameInvoiceDocument(xml, pdfOtherFolder), false);
  assert.equal(isSameInvoiceDocument(xml, pdfSameFolder), true);
});

// ---------------------------------------------------------------------------
// I6 — hóa đơn ngoại tệ.

const getter = (map) => (selectors) => {
  for (const selector of selectors) if (map[selector]) return map[selector];
  return '';
};

test('I6: a USD invoice is converted to VND with TGia and flagged', () => {
  const info = readInvoiceCurrency(getter({ DVTTe: 'USD', TGia: '25400' }));
  assert.deepEqual(info, { currency: 'USD', exchangeRate: 25400, isForeign: true });

  const result = convertForeignAmounts({ totalAmount: 108, amountBeforeTax: 100, vatAmount: 8 }, info);
  assert.deepEqual(result.amounts, { totalAmount: 2_743_200, amountBeforeTax: 2_540_000, vatAmount: 203_200 });
  assert.deepEqual(result.original, { totalAmount: 108, amountBeforeTax: 100, vatAmount: 8 });
  assert.equal(result.converted, true);
  assert.match(result.warnings[0], /USD/);
});

test('I6: a foreign invoice without an exchange rate is not silently treated as VND', () => {
  const info = readInvoiceCurrency(getter({ DVTTe: 'EUR' }));
  const result = convertForeignAmounts({ totalAmount: 108 }, info);
  assert.equal(result.converted, false);
  assert.equal(result.amounts.totalAmount, 108);
  assert.match(result.warnings[0], /không có tỷ giá/);
});

test('I6: VND invoices are untouched', () => {
  const info = readInvoiceCurrency(getter({ DVTTe: 'VND', TGia: '1' }));
  assert.equal(info.isForeign, false);
  assert.deepEqual(convertForeignAmounts({ totalAmount: 1000 }, info).warnings, []);
  assert.equal(readInvoiceCurrency(getter({})).isForeign, false);
});

// ---------------------------------------------------------------------------
// I16 — hóa đơn thay thế / điều chỉnh.

test('I16: TTHDLQuan is read as a replacement or adjustment relation', () => {
  const relation = readInvoiceRelation(getter({
    'TTHDLQuan TCHDon': '1', 'TTHDLQuan KHMSHDCLQuan': '1', 'TTHDLQuan KHHDCLQuan': 'C26TAA',
    'TTHDLQuan SHDCLQuan': '123', 'TTHDLQuan NLHDCLQuan': '2026-07-01',
  }));
  assert.deepEqual(relation, {
    kind: 'replacement', invoiceNo: '123', symbol: '1C26TAA', formNo: '1', date: '01/07/2026',
  });
  assert.equal(readInvoiceRelation(getter({ TCHDon: '2', SHDCLQuan: '5' })).kind, 'adjustment');
  assert.equal(readInvoiceRelation(getter({})), null);
});

test('I16: a replaced original is unconfirmed so it is not counted twice', () => {
  const original = {
    id: 'a', rawType: 'XML', invoiceNo: '00000123', invoiceSymbol: '1C26TAA', sellerTax: '0102325399',
    totalAmount: 1_080_000, isConfirmed: true, needsReview: false, warnings: [],
  };
  const replacement = {
    id: 'b', rawType: 'XML', invoiceNo: '00000200', invoiceSymbol: '1C26TAA', sellerTax: '0102325399',
    totalAmount: 1_100_000, isConfirmed: true, warnings: [],
    relation: { kind: 'replacement', invoiceNo: '123', symbol: '1C26TAA' },
  };

  const linked = linkRelatedInvoices([original, replacement]);
  const [first, second] = linked;
  assert.equal(first.isConfirmed, false);
  assert.equal(first.replacedBy, 'b');
  assert.ok(first.warnings.some((warning) => warning.startsWith(REPLACED_WARNING_PREFIX)));
  assert.equal(second.relatedTo, 'a');

  // Gọi lại không nhân đôi cảnh báo.
  const again = linkRelatedInvoices(linked);
  assert.equal(again[0].warnings.length, first.warnings.length);

  // mergeInvoiceBatch áp dụng liên kết cho cả mẻ.
  const merged = mergeInvoiceBatch([], [original, replacement]).invoices;
  assert.equal(merged.find((item) => item.id === 'a').isConfirmed, false);
});

test('I16: an adjustment keeps both invoices but flags the link', () => {
  const original = { id: 'a', invoiceNo: '123', invoiceSymbol: '1C26TAA', isConfirmed: true, warnings: [] };
  const adjustment = {
    id: 'c', invoiceNo: '300', invoiceSymbol: '1C26TAA', totalAmount: -1_080_000, isConfirmed: true, warnings: [],
    relation: { kind: 'adjustment', invoiceNo: '123', symbol: 'C26TAA' },
  };
  const [first, second] = linkRelatedInvoices([original, adjustment]);
  assert.equal(first.isConfirmed, true);
  assert.equal(second.needsReview, true);
  assert.match(second.warnings[0], /điều chỉnh/);
});

// ---------------------------------------------------------------------------
// Invoice number fallback (pdfExtractor) không đọc nhầm địa chỉ.

test('PDF invoice-number fallback ignores street addresses', () => {
  assert.equal(findFallbackInvoiceNumber('Địa chỉ: Số 123 Đường Nguyễn Huệ'), '');
  assert.equal(findFallbackInvoiceNumber('Số 45 ngõ 12 Láng Hạ'), '');
  assert.equal(findFallbackInvoiceNumber('Số: 12, đường Trần Phú'), '');
  assert.equal(findFallbackInvoiceNumber('Số (No.) : 73293447'), '73293447');
  assert.equal(findFallbackInvoiceNumber('Số / No : 00123456'), '00123456');
});

// ---------------------------------------------------------------------------
// I14 — mã tra cứu Minvoice.

test('I14: the Minvoice lookup code does not swallow the next word', () => {
  const minvoice = getProviderById('minvoice');
  assert.equal(minvoice.extractLookupCode('Mã tra cứu: ABCD1234EF Tra cứu tại minvoice'), 'ABCD1234EF');
  assert.equal(minvoice.extractLookupCode('Mã tra cứu: ABCD1234EF Ngay ky 01/07'), 'ABCD1234EF');
  assert.equal(
    minvoice.extractLookupCode('Mã tra cứu: J Y R E 6 7 V G 1 2 E T M 8 0 P D B R Y'),
    'JYRE67VG12ETM80PDBRY',
  );
});

// ---------------------------------------------------------------------------
// I15 — xmlValidator với namespace và không lấy MST người mua.

test('I15: namespaced tags are compared instead of silently skipped', () => {
  const xml = '<?xml version="1.0"?><inv:HDon xmlns:inv="urn:x"><inv:TTChung><inv:KHMSHDon>1</inv:KHMSHDon>'
    + '<inv:KHHDon>C26TAA</inv:KHHDon><inv:SHDon>9</inv:SHDon></inv:TTChung>'
    + '<inv:NBan><inv:MST>0102325399</inv:MST></inv:NBan></inv:HDon>';
  const result = validateInvoiceXml(xml, { taxCode: '0100107518', invoiceNumber: '9' });
  assert.equal(result.hasMismatch, true);
  assert.match(result.mismatchDetails[0], /Mã số thuế người bán không khớp/);
  assert.equal(result.parsedMetadata.symbol, '1C26TAA');
});

test('I15: an empty seller MST never falls back to the buyer MST', () => {
  const xml = '<HDon><NBan><Ten>A</Ten><MST></MST></NBan><NMua><MST>0100107518</MST></NMua><SHDon>5</SHDon></HDon>';
  assert.equal(extractMetadataFromXmlString(xml).taxCode, undefined);

  const noSellerBlock = '<HDon><NMua><MST>0100107518</MST></NMua><SHDon>5</SHDon></HDon>';
  assert.equal(extractMetadataFromXmlString(noSellerBlock).taxCode, undefined);
});

// ---------------------------------------------------------------------------
// I16b — sửa thông tin một hóa đơn đã có XML.

test('I16b: edited metadata that still matches the XML keeps it READY', () => {
  const xml = '<HDon><KHMSHDon>1</KHMSHDon><KHHDon>C26TAA</KHHDon><SHDon>123</SHDon><NBan><MST>0102325399</MST></NBan></HDon>';
  assert.equal(checkEditedMetadataAgainstXml(xml, {
    sellerTaxCode: '0102325399', invoiceSymbol: '1C26TAA', invoiceNumber: '00000123', invoiceDate: '2026-07-01',
  }).stillMatches, true);

  const changed = checkEditedMetadataAgainstXml(xml, { sellerTaxCode: '0102325399', invoiceNumber: '456' });
  assert.equal(changed.stillMatches, false);
  assert.match(changed.mismatchDetails[0], /Số hóa đơn không khớp/);
});

// ---------------------------------------------------------------------------
// Tên file xuất theo ngày giờ máy, không theo UTC.

test('export file names use the local calendar date', () => {
  // 06:30 sáng giờ máy ngày 28/09 — bản UTC sẽ ra 27/09 ở múi giờ +07.
  assert.equal(localDateStamp(new Date(2026, 8, 28, 6, 30)), '2026-09-28');
});

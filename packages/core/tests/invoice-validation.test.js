import assert from 'node:assert/strict';
import test from 'node:test';

import {
  deriveInvoiceAmounts,
  INVOICE_LIMITS,
  invoiceIdentityKey,
  isKnownInvoiceNumber,
  isInvoiceDocument,
  isSameInvoiceDocument,
  isUnsafeZipPath,
  mergeInvoiceBatch,
} from '../src/utils/invoice/validation.js';


test('never invents a tax rate when only the total is known', () => {
  assert.deepEqual(
    deriveInvoiceAmounts({ totalAmount: 1_080_000 }),
    { totalAmount: 1_080_000, amountBeforeTax: 0, vatAmount: 0, authorityCollection: 0 },
  );
});


test('derives only direct arithmetic from fields present in the document', () => {
  assert.deepEqual(
    deriveInvoiceAmounts({ amountBeforeTax: 1_000_000, vatAmount: 80_000 }),
    { totalAmount: 1_080_000, amountBeforeTax: 1_000_000, vatAmount: 80_000, authorityCollection: 0 },
  );
  assert.deepEqual(
    deriveInvoiceAmounts({ totalAmount: 1_080_000, amountBeforeTax: 1_000_000 }),
    { totalAmount: 1_080_000, amountBeforeTax: 1_000_000, vatAmount: 80_000, authorityCollection: 0 },
  );
});


// Hóa đơn hàng không: 3.450.000 + 276.000 + 351.543 thu hộ = 4.077.543.
test('an airline authorized collection is part of the amount payable', () => {
  assert.deepEqual(
    deriveInvoiceAmounts({ amountBeforeTax: 3_450_000, vatAmount: 276_000, authorityCollection: 351_543 }),
    {
      totalAmount: 4_077_543,
      amountBeforeTax: 3_450_000,
      vatAmount: 276_000,
      authorityCollection: 351_543,
    },
  );

  // Biết tổng và chưa thuế thì phần thuế còn lại đã trừ khoản thu hộ.
  assert.deepEqual(
    deriveInvoiceAmounts({ totalAmount: 4_077_543, amountBeforeTax: 3_450_000, authorityCollection: 351_543 }),
    {
      totalAmount: 4_077_543,
      amountBeforeTax: 3_450_000,
      vatAmount: 276_000,
      authorityCollection: 351_543,
    },
  );
});


test('detects unsafe ZIP paths and unknown invoice numbers', () => {
  assert.equal(isUnsafeZipPath('../invoice.xml'), true);
  assert.equal(isUnsafeZipPath('/absolute/invoice.xml'), true);
  assert.equal(isUnsafeZipPath('safe/invoice.xml'), false);
  assert.equal(isKnownInvoiceNumber('000123'), true);
  assert.equal(isKnownInvoiceNumber('N/A'), false);
});


test('the batch limits cover a full month of invoice archives', async () => {
  assert.equal(INVOICE_LIMITS.maxFiles, 200);
  // Thư mục nén cả tháng có ngưỡng riêng, rộng hơn một hóa đơn lẻ.
  assert.ok(INVOICE_LIMITS.maxZipBytes > INVOICE_LIMITS.maxFileBytes);
  assert.ok(INVOICE_LIMITS.maxZipDepth >= 2);
});


test('the same invoice number from two sellers stays two invoices', async () => {
  const taxi = { invoiceNo: '00000123', sellerTax: '0109999888', invoiceSymbol: '1C26MAA', totalAmount: 8000 };
  const hotel = { invoiceNo: '00000123', sellerTax: '3300111222', invoiceSymbol: '1C26TBB', totalAmount: 8000 };

  assert.notEqual(invoiceIdentityKey(taxi), invoiceIdentityKey(hotel));
  assert.equal(isSameInvoiceDocument(taxi, hotel), false);
});


test('files with the same name in two archives are not collapsed', async () => {
  const fromFirst = { invoiceNo: 'Chưa rõ số', rawFileName: 'hoadon.pdf', zipName: 'thang6.zip', totalAmount: 50000 };
  const fromSecond = { ...fromFirst, zipName: 'thang7.zip' };

  assert.notEqual(invoiceIdentityKey(fromFirst), invoiceIdentityKey(fromSecond));
});


test('the XML and the PDF rendering of one invoice are recognised as one', async () => {
  const xml = { invoiceNo: '00000123', sellerTax: '0109999888', invoiceSymbol: '1C26MAA', totalAmount: 8000 };
  // Bản thể hiện PDF thường không đọc được mã số thuế người bán.
  const pdf = { invoiceNo: '00000123', sellerTax: '', invoiceSymbol: '', totalAmount: 8000 };

  assert.equal(isSameInvoiceDocument(xml, pdf), true);
  // Khác số tiền thì là hai chứng từ khác nhau, không được gộp.
  assert.equal(isSameInvoiceDocument(xml, { ...pdf, totalAmount: 9000 }), false);
});


test('documents with no readable invoice number are never merged by number', async () => {
  const left = { invoiceNo: 'Chưa rõ số', rawFileName: 'a.pdf', totalAmount: 1000 };
  const right = { invoiceNo: 'Chưa rõ số', rawFileName: 'b.pdf', totalAmount: 1000 };

  assert.equal(isSameInvoiceDocument(left, right), false);
  assert.notEqual(invoiceIdentityKey(left), invoiceIdentityKey(right));
});


const xmlDoc = (overrides) => ({
  rawType: 'XML', invoiceNo: '00000123', sellerTax: '0109999888',
  invoiceSymbol: '1C26MAA', totalAmount: 8000, rawFileName: 'hoadon.xml', ...overrides,
});


test('two archives holding different sellers both land on the table', async () => {
  const { invoices, added } = mergeInvoiceBatch([], [
    xmlDoc({ zipName: 'thang6.zip' }),
    // Cùng số hóa đơn, cùng số tiền, khác người bán — vẫn là hai chứng từ thật.
    xmlDoc({ zipName: 'thang7.zip', sellerTax: '3300111222', invoiceSymbol: '1C26TBB' }),
  ]);

  assert.equal(added, 2);
  assert.equal(invoices.length, 2);
});


test('re-reading the same archive adds nothing', async () => {
  const first = mergeInvoiceBatch([], [xmlDoc({ zipName: 'thang6.zip' })]);
  const second = mergeInvoiceBatch(first.invoices, [xmlDoc({ zipName: 'thang6.zip' })]);

  assert.equal(second.added, 0);
  assert.equal(second.invoices.length, 1);
});


test('the XML replaces the PDF rendering whichever order they arrive in', async () => {
  const pdf = { rawType: 'PDF', invoiceNo: '00000123', sellerTax: '', totalAmount: 8000, rawFileName: 'hoadon.pdf' };

  const pdfFirst = mergeInvoiceBatch(mergeInvoiceBatch([], [pdf]).invoices, [xmlDoc({})]);
  assert.deepEqual(pdfFirst.invoices.map((item) => item.rawType), ['XML']);

  const xmlFirst = mergeInvoiceBatch(mergeInvoiceBatch([], [xmlDoc({})]).invoices, [pdf]);
  assert.deepEqual(xmlFirst.invoices.map((item) => item.rawType), ['XML']);
  assert.equal(xmlFirst.added, 0);
});


// Lịch trình bay đi kèm trong cùng thư mục nén trông rất giống hóa đơn của
// chính chuyến đó, nên trước đây bảng bị lặp một dòng cho mỗi bản đính kèm.
test('an itinerary with neither invoice number nor seller tax code is not an invoice', async () => {
  assert.equal(isInvoiceDocument({
    invoiceNo: 'Chưa rõ số', sellerTax: '', seller: 'Vietjet Air [HAN-VTE]', totalAmount: 0,
  }), false);
});


test('a hard-to-read invoice still counts as one when a mandatory field survives', async () => {
  // Chỉ đọc được số hóa đơn.
  assert.equal(isInvoiceDocument({ invoiceNo: '02236513', sellerTax: '' }), true);
  // Chỉ đọc được mã số thuế người bán.
  assert.equal(isInvoiceDocument({ invoiceNo: 'Chưa rõ số', sellerTax: '0102325399' }), true);
});


test('the user can overrule the tool and pull an attachment into the table', async () => {
  const attachment = { invoiceNo: 'Chưa rõ số', sellerTax: '' };

  assert.equal(isInvoiceDocument(attachment), false);
  assert.equal(isInvoiceDocument({ ...attachment, forcedAsInvoice: true }), true);
});


test('a file that could not be opened is never treated as an invoice', async () => {
  assert.equal(isInvoiceDocument({
    invoiceNo: 'Lỗi đọc tệp', sellerTax: '', missingFields: ['readError'],
  }), false);
});

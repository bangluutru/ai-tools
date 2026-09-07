import assert from 'node:assert/strict';
import test from 'node:test';

import {
  STATUS_TYPES,
  sanitizeLookupUrl,
  sanitizeLookupCode,
  buildStandardXmlFilename,
  validateInvoiceXml,
  detectProvider,
  extractCandidateUrls,
  extractCandidateLookupCode,
  parsePdfInvoiceDocument,
} from '../src/utils/invoice/xmlFetcher/index.js';

// 1. PDF có URL + mã rõ
test('Test Case 1: extracts URL and lookup code from clear text', async () => {
  const sampleText = `
HÓA ĐƠN GIÁ TRỊ GIA TĂNG
Ký hiệu: 1C26TAA
Số: 00012345
Ngày 15 tháng 08 năm 2026
Tên người bán: CÔNG TY TNHH CÔNG NGHỆ MINH ANH
Mã số thuế: 0101234567
Tra cứu hóa đơn tại Website: https://tracuu.vnpt-invoice.com.vn
Mã tra cứu: VNPT-2026-9988-ABC
  `;

  const doc = await parsePdfInvoiceDocument({ rawText: sampleText, fileName: 'invoice1.pdf' });
  assert.equal(doc.providerId, 'vnpt');
  assert.equal(doc.providerName, 'VNPT Invoice');
  assert.equal(doc.lookupUrl, 'https://tracuu.vnpt-invoice.com.vn/');
  assert.equal(doc.lookupCode, 'VNPT-2026-9988-ABC');
  assert.equal(doc.sellerTaxCode, '0101234567');
  assert.equal(doc.invoiceNumber, '00012345');
  assert.equal(doc.invoiceSymbol, '1C26TAA');
  assert.equal(doc.status, STATUS_TYPES.CAPTCHA_REQUIRED);
});

// 2. URL bị xuống dòng
test('Test Case 2: normalizes wrapped URL split across lines', () => {
  const brokenUrlText = `
Tra cứu hóa đơn tại: https://tracuu.vnpt-
invoice.com.vn/portal/index.html
Mã tra cứu: 88776655
  `;
  const urls = extractCandidateUrls(brokenUrlText);
  assert.ok(urls.length > 0);
  assert.equal(urls[0], 'https://tracuu.vnpt-invoice.com.vn/portal/index.html');
});

// 3. Mã tra cứu bị xuống dòng (split layout)
test('Test Case 3: extracts lookup code when placed on the next line', () => {
  const splitLayoutText = `
Tra cứu tại: https://sinvoice.viettel.vn/tracuuhoadon
Mã số bí mật (Access code):
ABCXYZ123456
  `;
  const code = extractCandidateLookupCode(splitLayoutText);
  assert.equal(code, 'ABCXYZ123456');
});

// 4. Nhiều URL trong PDF
test('Test Case 4: handles multiple URLs and selects candidate lookup URL', () => {
  const multiUrlText = `
Trang chủ: https://company-homepage.com.vn
Email: lienhe@company.com.vn
Cổng phát hành: https://www.meinvoice.vn/tra-cuu/
Mã nhận hóa đơn: ME998877
  `;
  const urls = extractCandidateUrls(multiUrlText);
  assert.ok(urls.length >= 2);
  const provider = detectProvider(urls[1], multiUrlText);
  assert.equal(provider.id, 'misa');
});

// 5. Không có URL
test('Test Case 5: handles PDF without URL gracefully', async () => {
  const noUrlText = `
HÓA ĐƠN BÁN HÀNG
Số: 45
Ngày 10/05/2026
Tên người bán: CÔNG TY ABC
Mã số thuế: 0109999888
Mã tra cứu: XYZ12345
  `;
  const doc = await parsePdfInvoiceDocument({ rawText: noUrlText, fileName: 'nourl.pdf' });
  assert.equal(doc.lookupUrl, '');
  assert.equal(doc.lookupCode, 'XYZ12345');
  assert.equal(doc.status, STATUS_TYPES.MANUAL_REQUIRED);
});

// 6. Không có lookup code
test('Test Case 6: handles PDF without lookup code', async () => {
  const noCodeText = `
HÓA ĐƠN ĐIỆN TỬ
Tra cứu tại: https://einvoice.vn/tra-cuu
Tên người bán: CÔNG TY THÁI SƠN
Mã số thuế: 0102030405
  `;
  const doc = await parsePdfInvoiceDocument({ rawText: noCodeText, fileName: 'nocode.pdf' });
  assert.equal(doc.providerId, 'thaison');
  assert.equal(doc.lookupUrl, 'https://einvoice.vn/tra-cuu');
  assert.equal(doc.lookupCode, '');
  assert.equal(doc.status, STATUS_TYPES.CAPTCHA_REQUIRED);
});

// 7. Provider Unknown (Generic)
test('Test Case 7: detects unknown provider as Generic', () => {
  const genericText = `
Tra cứu tại: https://hoadon.randomcompany.vn/view
Mã tra cứu: RC987654
  `;
  const provider = detectProvider('https://hoadon.randomcompany.vn/view', genericText);
  assert.equal(provider.id, 'generic');
  assert.equal(provider.name, 'Hóa đơn điện tử');
});

// 8. XML hợp lệ
test('Test Case 8: validates authentic XML invoice structure', () => {
  const validXml = `<?xml version="1.0" encoding="utf-8"?>
<HDon>
  <DLHDon>
    <TTChung>
      <KHMSHDon>1</KHMSHDon>
      <KHieu>1C26TAA</KHieu>
      <SHDon>00012345</SHDon>
      <NLap>2026-08-15</NLap>
    </TTChung>
    <NDHDon>
      <NBan>
        <Ten>CÔNG TY TNHH CÔNG NGHỆ MINH ANH</Ten>
        <MST>0101234567</MST>
      </NBan>
    </NDHDon>
  </DLHDon>
</HDon>`;

  const result = validateInvoiceXml(validXml, {
    taxCode: '0101234567',
    symbol: '1C26TAA',
    invoiceNumber: '00012345',
  });

  assert.equal(result.isValid, true);
  assert.equal(result.hasMismatch, false);
  assert.equal(result.parsedMetadata.taxCode, '0101234567');
  assert.equal(result.parsedMetadata.invoiceNumber, '00012345');
});

// 9. Response HTML thay vì XML (từ chối an toàn)
test('Test Case 9: rejects HTML masquerading as XML', () => {
  const htmlMasquerade = `<!DOCTYPE html>
<html>
<head><title>Captcha Verification</title></head>
<body><h1>Vui lòng nhập mã bảo vệ</h1></body>
</html>`;

  const result = validateInvoiceXml(htmlMasquerade);
  assert.equal(result.isValid, false);
  assert.match(result.reason, /HTML/i);
});

// 10. CAPTCHA Response detection
test('Test Case 10: detects HTML login or captcha page from provider portal', () => {
  const loginHtml = `<html>
<body><form action="/login"><input type="text" name="captcha" /></form></body>
</html>`;
  const result = validateInvoiceXml(loginHtml);
  assert.equal(result.isValid, false);
});

// 11. Mismatch giữa XML và PDF
test('Test Case 11: detects tax code and invoice number mismatch between XML and PDF', () => {
  const xmlWithDifferentMst = `<?xml version="1.0" encoding="utf-8"?>
<HDon>
  <DLHDon>
    <TTChung><KHieu>1C26TAA</KHieu><SHDon>00099999</SHDon></TTChung>
    <NDHDon><NBan><MST>0399999999</MST></NBan></NDHDon>
  </DLHDon>
</HDon>`;

  const result = validateInvoiceXml(xmlWithDifferentMst, {
    taxCode: '0101234567',
    symbol: '1C26TAA',
    invoiceNumber: '00012345',
  });

  assert.equal(result.isValid, true);
  assert.equal(result.hasMismatch, true);
  assert.ok(result.mismatchDetails.length >= 2);
  assert.match(result.mismatchDetails[0], /Mã số thuế/);
  assert.match(result.mismatchDetails[1], /Số hóa đơn/);
});

// 12. Standardized XML Filename
test('Test Case 12: builds standard filename YYYY-MM-DD_MST_SYMBOL_INVOICE-NUMBER.xml', () => {
  const filename = buildStandardXmlFilename({
    issueDate: '2026-08-14',
    taxCode: '1700166450',
    symbol: 'C26TQA',
    invoiceNumber: 807,
  });
  assert.equal(filename, '2026-08-14_1700166450_C26TQA_00000807.xml');
});

// 13. PDF scan không có text
test('Test Case 13: detects scanned PDF lacking text layer', async () => {
  const emptyText = '   \n  \n ';
  const doc = await parsePdfInvoiceDocument({ rawText: emptyText, fileName: 'scan_doc.pdf' });
  assert.equal(doc.isScan, true);
  assert.equal(doc.status, STATUS_TYPES.UNSUPPORTED);
  assert.match(doc.statusMessage, /file scan/i);
});

// 14. Support for Hilo (GSM Xanh SM) & Thái Sơn
test('Test Case 14: identifies Hilo Invoice (GSM) and Thai Son eInvoice', async () => {
  const hiloText = `
Tra cứu hóa đơn tại: https://gsm-einvoice.hilo.com.vn/
Mã nhận hóa đơn: GSM-998822
Tên người bán: CÔNG TY CỔ PHẦN DI CHUYỂN XANH VÀ THÔNG MINH GSM
Mã số thuế: 0110271745
  `;
  const hiloDoc = await parsePdfInvoiceDocument({ rawText: hiloText });
  assert.equal(hiloDoc.providerId, 'hilo');
  assert.equal(hiloDoc.lookupCode, 'GSM-998822');

  const thaisonText = `
Website tra cứu: https://einvoice.vn/tra-cuu
Mã tra cứu: TS-554433
Tên người bán: CÔNG TY THÁI SƠN
Mã số thuế: 0102030405
  `;
  const thaisonDoc = await parsePdfInvoiceDocument({ rawText: thaisonText });
  assert.equal(thaisonDoc.providerId, 'thaison');
  assert.equal(thaisonDoc.lookupCode, 'TS-554433');
});

// 15. Nhận diện MST có khoảng trắng giữa các chữ số (Spaced digits)
test('Test Case 15: extracts tax code when digits are separated by spaces', async () => {
  const spacedMstText = `
HÓA ĐƠN GIÁ TRỊ GIA TĂNG
Tên người bán : CÔNG TY CỔ PHẦN THƯƠNG MẠI
Mã số thuế : 1 6 0 2 0 6 6 7 0 8
Địa chỉ : Số 123 Đường ABC, Phường XYZ
Tra cứu hóa đơn: https://1602066708-tt78.vnpt-invoice.com.vn/
Mã tra cứu: VNPT123456
  `;
  const doc = await parsePdfInvoiceDocument({ rawText: spacedMstText });
  assert.equal(doc.sellerTaxCode, '1602066708');
});

// 16. Nhận diện MST cá nhân / hộ kinh doanh 12 chữ số
test('Test Case 16: extracts 12-digit personal/household tax code', async () => {
  const householdText = `
HÓA ĐƠN BÁN HÀNG
Tên người bán: HỘ KINH DOANH NGUYỄN VĂN A
Mã số thuế: 012345678901
Địa chỉ: Chợ Bến Thành, Quận 1, TP.HCM
Mã tra cứu: HKD-998811
  `;
  const doc = await parsePdfInvoiceDocument({ rawText: householdText });
  assert.equal(doc.sellerTaxCode, '012345678901');
});

// 17. Giữ nguyên subdomain tra cứu đầy đủ và xử lý khoảng trắng sau protocol
test('Test Case 17: preserves complete subdomain and cleans space after protocol', () => {
  const textWithSubdomain = `
Tra cứu hóa đơn: https:// 1602066708-tt78.vnpt-invoice.com.vn/
Mã số bí mật: 998877
  `;
  const urls = extractCandidateUrls(textWithSubdomain);
  assert.ok(urls.length > 0);
  assert.equal(urls[0], 'https://1602066708-tt78.vnpt-invoice.com.vn/');
});

// 18. Nhận diện nhãn mã tra cứu song ngữ có dấu ngoặc đơn
test('Test Case 18: extracts candidate lookup code with bilingual bracketed label', () => {
  const bilingualText = `
- Mã tra cứu (Invoice code) : KZFVIQ69GPQR
Tra cứu tại: https://meinvoice.vn/tra-cuu
  `;
  const code = extractCandidateLookupCode(bilingualText);
  assert.equal(code, 'KZFVIQ69GPQR');
});

// 19. Nhận diện nhà cung cấp Petrolimex
test('Test Case 19: detects Petrolimex provider and extracts secret code', async () => {
  const petrolimexText = `
TẬP ĐOÀN XĂNG DẦU VIỆT NAM (PETROLIMEX)
CÔNG TY XĂNG DẦU HÀ GIANG
Mã số thuế : 1500207131-103
Ký hiệu : 1K26TXN
Số : 00045678
Mã tra cứu : 6A843AHQG
Trang tra cứu: https://hoadon.petrolimex.com.vn/
  `;
  const doc = await parsePdfInvoiceDocument({ rawText: petrolimexText });
  assert.equal(doc.providerId, 'petrolimex');
  assert.equal(doc.providerName, 'Petrolimex Invoice');
  assert.equal(doc.sellerTaxCode, '1500207131-103');
  assert.equal(doc.lookupCode, '6A843AHQG');
  assert.equal(doc.invoiceSymbol, '1K26TXN');
  assert.equal(doc.lookupUrl, 'https://hoadon.petrolimex.com.vn/');
});

// 20. Bảo toàn nguyên vẹn ký tự '*' trong mã tra cứu bí mật Viettel S-Invoice
test('Test Case 20: preserves asterisk (*) at end of Viettel secret code', async () => {
  const viettelText = `
HÓA ĐƠN GIÁ TRỊ GIA TĂNG
Tra cứu hóa đơn điện tử tại Website: https://vinvoice.viettel.vn/utilities/invoice-search
Mã số bí mật: 2AAT8SAU2K4STCI*
Mã của cơ quan thuế: 00CD43590D45B14E8DABDF35297668E0FA
Tên người bán: TẬP ĐOÀN CÔNG NGHIỆP - VIỄN THÔNG QUÂN ĐỘI
Mã số thuế: 0100109106
  `;
  const doc = await parsePdfInvoiceDocument({ rawText: viettelText });
  assert.equal(doc.providerId, 'viettel');
  assert.equal(doc.lookupCode, '2AAT8SAU2K4STCI*');

  // Test trailing sentence period after asterisk e.g. "CODE*." -> "CODE*"
  const codeWithDot = sanitizeLookupCode('2AAT8SAU2K4STCI*.');
  assert.equal(codeWithDot, '2AAT8SAU2K4STCI*');
});

// 21. Bảo toàn ký tự '*' trong mã tra cứu của các nhà cung cấp khác
test('Test Case 21: preserves asterisk (*) across all provider adapters and sanitizer', () => {
  const providers = ['vnpt', 'misa', 'easyinvoice', 'bkav', 'fpt', 'hilo', 'thaison'];
  for (const p of providers) {
    const text = `
Tra cứu tại: https://example.com/
Mã tra cứu: PROV_${p.toUpperCase()}_9988*
    `;
    const code = extractCandidateLookupCode(text);
    assert.equal(code, `PROV_${p.toUpperCase()}_9988*`);
  }
});



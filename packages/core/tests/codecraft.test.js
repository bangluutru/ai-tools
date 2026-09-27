import assert from 'node:assert/strict';
import test from 'node:test';
import JsBarcode from 'jsbarcode';

import { calculateGS1CheckDigit, validateAndFixBarcode } from '../src/utils/codecraft/checksumValidators.js';
import { GS1_FNC1, parseGs1ElementString } from '../src/utils/codecraft/gs1.js';
import {
  buildQrPayload,
  emptyQrContent,
  escapeVcardValue,
  escapeWifiValue,
  quietZoneMarginPx,
  splitCsvLine,
  toUtf8ByteString,
} from '../src/utils/codecraft/qrPayload.js';
import { BARCODE_I18N } from '../src/utils/codecraft/i18n.js';

const qr = (contentType, patch = {}) => {
  const base = emptyQrContent();
  const section = Object.keys(patch)[0];
  return buildQrPayload({
    ...base,
    contentType,
    ...(section && section !== 'rawText' ? { [section]: { ...base[section], ...patch[section] } } : patch),
  });
};

test('GS1 check digit matches published examples', () => {
  assert.equal(calculateGS1CheckDigit('590123412345'), 7); // EAN-13 5901234123457
  assert.equal(calculateGS1CheckDigit('0950600013435'), 2); // GTIN-14 09506000134352
  assert.equal(calculateGS1CheckDigit('03600029145'), 2); // UPC-A 036000291452
});

test('a wrong EAN/UPC check digit is rejected with the expected digit, never silently replaced', () => {
  const wrong = validateAndFixBarcode('EAN13', '5901234123458');
  assert.equal(wrong.isValid, false);
  assert.equal(wrong.errorCode, 'CHECK_DIGIT_MISMATCH');
  assert.equal(wrong.expectedCheckDigit, 7);
  assert.equal(wrong.actualCheckDigit, 8);
  assert.equal(wrong.suggestedValue, '5901234123457');
  assert.match(wrong.error, /7/);

  const upc = validateAndFixBarcode('UPC', '036000291453', 'en');
  assert.equal(upc.isValid, false);
  assert.equal(upc.suggestedValue, '036000291452');
  assert.match(upc.error, /check digit/i);

  const itf = validateAndFixBarcode('ITF14', '09506000134353');
  assert.equal(itf.isValid, false);
  assert.equal(itf.expectedCheckDigit, 2);

  assert.deepEqual(
    { ...validateAndFixBarcode('EAN13', '5901234123457') },
    { isValid: true, value: '5901234123457' }
  );
});

test('missing check digits are appended (the entered digits are kept)', () => {
  const r = validateAndFixBarcode('EAN13', '590123412345');
  assert.equal(r.isValid, true);
  assert.equal(r.value, '5901234123457');
  assert.equal(r.computedCheckDigit, 7);
  assert.equal(validateAndFixBarcode('EAN8', '9638507').value, '96385074');
});

test('GTIN inputs with letters are rejected instead of being stripped into another number', () => {
  const r = validateAndFixBarcode('EAN13', '59012AB34123457');
  assert.equal(r.isValid, false);
  assert.equal(r.errorCode, 'GTIN_CHARS');
  assert.equal(validateAndFixBarcode('EAN13', '5901-2341-23457').isValid, true);
});

test('Code 128 refuses non-ASCII text that JsBarcode cannot encode', () => {
  assert.equal(validateAndFixBarcode('CODE128', 'Bánh tráng').isValid, false);
  assert.equal(validateAndFixBarcode('CODE128', 'LOGIS-2026-VN').isValid, true);
  assert.equal(validateAndFixBarcode('EAN13', '', 'ja').error, 'バーコードの値を入力してください');
});

test('GS1-128 inserts FNC1 only after variable-length AIs and validates each element', () => {
  const parsed = parseGs1ElementString('(01)09506000134352(10)LOT42(17)261231');
  assert.equal(parsed.ok, true);
  assert.equal(parsed.data, `0109506000134352` + `10LOT42${GS1_FNC1}` + `17261231`);
  assert.equal(parsed.humanReadable, '(01)09506000134352(10)LOT42(17)261231');

  // Phần tử cuối là AI biến đổi: không có FNC1 thừa ở cuối.
  assert.equal(parseGs1ElementString('(01)09506000134352(21)SN1').data, '0109506000134352' + '21SN1');

  assert.equal(parseGs1ElementString('(01)09506000134353').errorCode, 'GS1_CHECK_DIGIT');
  assert.equal(parseGs1ElementString('(17)261332').errorCode, 'GS1_DATE');
  assert.equal(parseGs1ElementString('(17)260230').errorCode, 'GS1_DATE');
  assert.equal(parseGs1ElementString('(17)261200').ok, true); // ngày 00 = cuối tháng
  assert.equal(parseGs1ElementString('(01)123').errorCode, 'GS1_LENGTH');
  assert.equal(parseGs1ElementString('(10)Lô1').errorCode, 'GS1_CHARS');
  assert.equal(parseGs1ElementString('(99999)X').errorCode, 'GS1_SYNTAX');
  assert.equal(parseGs1ElementString('0109506000134352').errorCode, 'GS1_SYNTAX');
  assert.equal(parseGs1ElementString('(3103)000750').ok, true);

  const v = validateAndFixBarcode('GS1_128', '(01)09506000134352(17)261231');
  assert.equal(v.isValid, true);
  assert.equal(v.format, 'CODE128');
  assert.equal(v.ean128, true);
});

test('GS1-128 output starts with Start C + FNC1 when rendered by JsBarcode', () => {
  const v = validateAndFixBarcode('GS1_128', '(01)09506000134352(10)A1(17)261231');
  const target = {};
  JsBarcode(target, v.value, { format: v.format, ean128: v.ean128, text: v.text });
  const bars = target.encodings.map((e) => e.data).join('');
  const START_C = '11010011100';
  const FNC1 = '11110101110';
  assert.ok(bars.startsWith(START_C + FNC1), 'GS1-128 must begin with Start C followed by FNC1');
  assert.equal(target.encodings[0].text, '(01)09506000134352(10)A1(17)261231');
});

test('QR types without data are not encoded (no hidden demo payloads)', () => {
  for (const type of ['url', 'text', 'wifi', 'vcard', 'email', 'sms', 'geo', 'crypto']) {
    const r = buildQrPayload({ ...emptyQrContent(), contentType: type });
    assert.equal(r.ok, false, `${type} should require input`);
    assert.equal(r.payload, '');
  }
});

test('email, SMS, geo and BIP21 payloads use the standard URI schemes', () => {
  assert.equal(
    qr('email', { email: { to: 'a@b.co', subject: 'Xin chào & hẹn', body: 'Dòng 1\nDòng 2' } }).payload,
    'mailto:a@b.co?subject=Xin%20ch%C3%A0o%20%26%20h%E1%BA%B9n&body=D%C3%B2ng%201%0AD%C3%B2ng%202'
  );
  assert.equal(qr('email', { email: { to: 'a@b.co' } }).payload, 'mailto:a@b.co');
  assert.equal(qr('email', { email: { to: 'not-an-email' } }).errorCode, 'EMAIL_INVALID');

  assert.equal(qr('sms', { sms: { phone: '+84 912-345-678', message: 'Hi' } }).payload, 'SMSTO:+84912345678:Hi');
  assert.equal(qr('sms', { sms: { phone: '0912345678' } }).payload, 'SMSTO:0912345678');

  assert.equal(qr('geo', { geo: { latitude: '21.028511', longitude: '105,854444' } }).payload, 'geo:21.028511,105.854444');
  assert.equal(qr('geo', { geo: { latitude: '91', longitude: '0' } }).errorCode, 'GEO_INVALID');

  const btc = qr('crypto', {
    crypto: { currency: 'BTC', address: 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh', amount: '0.01', label: 'Cà phê' },
  });
  assert.equal(btc.payload, 'bitcoin:bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh?amount=0.01&label=C%C3%A0%20ph%C3%AA');
  assert.ok(!btc.payload.startsWith('btc:'));
  assert.equal(
    qr('crypto', { crypto: { address: 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh', amount: '0.000000001' } }).errorCode,
    'CRYPTO_AMOUNT_INVALID'
  );
});

test('Wi-Fi and vCard payloads escape reserved characters and carry no hidden defaults', () => {
  assert.equal(escapeWifiValue('a;b,c:d\\e"f'), 'a\\;b\\,c\\:d\\\\e\\"f');
  assert.equal(
    qr('wifi', { wifi: { ssid: 'Café;5G', password: 'p:ss', encryption: 'WPA' } }).payload,
    'WIFI:T:WPA;S:Café\\;5G;P:p\\:ss;;'
  );
  assert.equal(qr('wifi', { wifi: { ssid: 'Guest', encryption: 'nopass' } }).payload, 'WIFI:T:nopass;S:Guest;;');

  assert.equal(escapeVcardValue('A, B; C\\D\nE'), 'A\\, B\\; C\\\\D\\nE');
  const card = buildQrPayload(
    { ...emptyQrContent(), contentType: 'vcard', vcard: { ...emptyQrContent().vcard, firstName: 'Hải Bằng', lastName: 'Trần', organization: 'ACME, Inc.' } },
    { familyNameFirst: true }
  ).payload;
  assert.equal(
    card,
    ['BEGIN:VCARD', 'VERSION:3.0', 'N:Trần;Hải Bằng;;;', 'FN:Trần Hải Bằng', 'ORG:ACME\\, Inc.', 'END:VCARD'].join('\r\n')
  );
  assert.ok(!/github|ai-tools|Hà Nội/.test(card));
});

test('UTF-8 byte string survives the charCode & 0xFF encoding used by qr-code-styling', () => {
  const text = 'Phở bò 🍜 東京';
  const bytes = toUtf8ByteString(text);
  const roundTrip = new TextDecoder().decode(Uint8Array.from(bytes, (ch) => ch.charCodeAt(0) & 0xff));
  assert.equal(roundTrip, text);
  assert.equal(toUtf8ByteString('ABC'), 'ABC');
});

test('quiet zone margin yields the requested number of modules', () => {
  const size = 400;
  const count = 25;
  const margin = quietZoneMarginPx(size, count, 4);
  const moduleSize = (size - 2 * margin) / count;
  assert.ok(margin / moduleSize >= 3.9 && margin / moduleSize <= 4.1);
  assert.equal(quietZoneMarginPx(size, count, 0), 0);
});

test('CSV splitting handles quotes and separators', () => {
  assert.deepEqual(splitCsvLine('"A,1","Tên ""đẹp"""; x'), ['A,1', 'Tên "đẹp"', 'x']);
  assert.deepEqual(splitCsvLine('PROD-001\tSản phẩm'), ['PROD-001', 'Sản phẩm']);
});

test('barcode dictionaries expose the same keys in vi/en/ja', () => {
  const keysOf = (obj, prefix = '') =>
    Object.entries(obj).flatMap(([k, v]) =>
      v && typeof v === 'object' ? keysOf(v, `${prefix}${k}.`) : [`${prefix}${k}`]
    ).sort();
  const vi = keysOf(BARCODE_I18N.vi);
  assert.deepEqual(keysOf(BARCODE_I18N.en), vi);
  assert.deepEqual(keysOf(BARCODE_I18N.ja), vi);
});

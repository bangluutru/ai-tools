/**
 * Dựng chuỗi dữ liệu cho mã QR theo từng loại nội dung.
 * Mọi hàm đều thuần (không DOM) để test bằng node.
 *
 * Nguyên tắc: không bao giờ mã hoá dữ liệu mẫu/ẩn. Thiếu dữ liệu bắt buộc thì
 * trả `{ ok: false, errorCode }` để giao diện không vẽ mã và không cho tải về.
 */

export const QR_CONTENT_TYPES = Object.freeze(['url', 'text', 'wifi', 'vcard', 'email', 'sms', 'geo', 'crypto']);

/** Tiền tố URI theo BIP21 (bitcoin:) và tương đương cho Litecoin. */
export const CRYPTO_SCHEMES = Object.freeze({
  BTC: 'bitcoin',
  LTC: 'litecoin',
});

export function emptyQrContent() {
  return {
    rawText: '',
    wifi: { ssid: '', password: '', encryption: 'WPA', hidden: false },
    vcard: {
      firstName: '',
      lastName: '',
      organization: '',
      title: '',
      phone: '',
      email: '',
      website: '',
      address: '',
      note: '',
    },
    email: { to: '', subject: '', body: '' },
    sms: { phone: '', message: '' },
    geo: { latitude: '', longitude: '' },
    crypto: { currency: 'BTC', address: '', amount: '', label: '', message: '' },
  };
}

/** WIFI: cần thoát \ ; , : " (ZXing / chuẩn WPA3 QR). */
export function escapeWifiValue(value) {
  return String(value ?? '').replace(/([\\;,:"])/g, '\\$1');
}

/** vCard 3.0 (RFC 2426 §5 / RFC 6350 §3.4): thoát \ , ; và xuống dòng. */
export function escapeVcardValue(value) {
  return String(value ?? '')
    .replace(/\\/g, '\\\\')
    .replace(/\r\n|\r|\n/g, '\\n')
    .replace(/,/g, '\\,')
    .replace(/;/g, '\\;');
}

function trimmed(value) {
  return String(value ?? '').trim();
}

function fail(errorCode) {
  return { ok: false, errorCode, payload: '' };
}

function ok(payload) {
  return { ok: true, payload };
}

function buildWifi(wifi = {}) {
  const ssid = String(wifi.ssid ?? '');
  if (!ssid.trim()) return fail('WIFI_SSID_REQUIRED');
  const encryption = ['WPA', 'WEP', 'nopass'].includes(wifi.encryption) ? wifi.encryption : 'WPA';
  const parts = [`T:${encryption}`, `S:${escapeWifiValue(ssid)}`];
  if (encryption !== 'nopass') {
    if (!String(wifi.password ?? '')) return fail('WIFI_PASSWORD_REQUIRED');
    parts.push(`P:${escapeWifiValue(wifi.password)}`);
  }
  if (wifi.hidden) parts.push('H:true');
  return ok(`WIFI:${parts.join(';')};;`);
}

function buildVcard(vcard = {}, { familyNameFirst = false } = {}) {
  const first = trimmed(vcard.firstName);
  const last = trimmed(vcard.lastName);
  const org = trimmed(vcard.organization);
  const fullName = (familyNameFirst ? [last, first] : [first, last]).filter(Boolean).join(' ');
  const displayName = fullName || org;
  if (!displayName) return fail('VCARD_NAME_REQUIRED');

  const lines = [
    'BEGIN:VCARD',
    'VERSION:3.0',
    `N:${escapeVcardValue(last)};${escapeVcardValue(first)};;;`,
    `FN:${escapeVcardValue(displayName)}`,
  ];
  const push = (prop, value) => {
    const v = trimmed(value);
    if (v) lines.push(`${prop}:${escapeVcardValue(v)}`);
  };
  push('ORG', org);
  push('TITLE', vcard.title);
  push('TEL;TYPE=CELL', vcard.phone);
  push('EMAIL;TYPE=INTERNET', vcard.email);
  push('URL', vcard.website);
  const address = trimmed(vcard.address);
  // ADR có 7 thành phần phân cách bằng ';' — đặt địa chỉ tự do vào "street".
  if (address) lines.push(`ADR;TYPE=WORK:;;${escapeVcardValue(address)};;;;`);
  push('NOTE', vcard.note);
  lines.push('END:VCARD');
  return ok(lines.join('\r\n'));
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function buildEmail(email = {}) {
  const to = trimmed(email.to);
  if (!to) return fail('EMAIL_TO_REQUIRED');
  const recipients = to.split(/[,;]\s*/).filter(Boolean);
  if (!recipients.every((r) => EMAIL_RE.test(r))) return fail('EMAIL_INVALID');
  const params = [];
  if (trimmed(email.subject)) params.push(`subject=${encodeURIComponent(email.subject.trim())}`);
  if (String(email.body ?? '').trim()) params.push(`body=${encodeURIComponent(String(email.body))}`);
  return ok(`mailto:${recipients.join(',')}${params.length ? `?${params.join('&')}` : ''}`);
}

function buildSms(sms = {}) {
  const phone = trimmed(sms.phone).replace(/[\s().-]/g, '');
  if (!phone) return fail('SMS_PHONE_REQUIRED');
  if (!/^\+?\d{3,15}$/.test(phone)) return fail('SMS_PHONE_INVALID');
  const message = String(sms.message ?? '');
  // SMSTO:số:nội dung — định dạng được iOS Camera và ZXing/Android đọc được.
  return ok(message.trim() ? `SMSTO:${phone}:${message}` : `SMSTO:${phone}`);
}

function parseCoordinate(value, limit) {
  const text = trimmed(value).replace(',', '.');
  if (!/^[-+]?\d+(\.\d+)?$/.test(text)) return null;
  const n = Number(text);
  return Math.abs(n) <= limit ? n : null;
}

function buildGeo(geo = {}) {
  if (!trimmed(geo.latitude) || !trimmed(geo.longitude)) return fail('GEO_REQUIRED');
  const lat = parseCoordinate(geo.latitude, 90);
  const lng = parseCoordinate(geo.longitude, 180);
  if (lat === null || lng === null) return fail('GEO_INVALID');
  // RFC 5870: geo:<lat>,<lng>
  return ok(`geo:${lat},${lng}`);
}

function buildCrypto(crypto = {}) {
  const scheme = CRYPTO_SCHEMES[crypto.currency] || CRYPTO_SCHEMES.BTC;
  const address = trimmed(crypto.address);
  if (!address) return fail('CRYPTO_ADDRESS_REQUIRED');
  if (!/^[A-Za-z0-9]{20,90}$/.test(address)) return fail('CRYPTO_ADDRESS_INVALID');
  const params = [];
  const amount = trimmed(crypto.amount);
  if (amount) {
    // BIP21: số thập phân theo đơn vị coin, dấu chấm, tối đa 8 chữ số lẻ.
    if (!/^\d+(\.\d{1,8})?$/.test(amount) || Number(amount) <= 0) return fail('CRYPTO_AMOUNT_INVALID');
    params.push(`amount=${amount}`);
  }
  if (trimmed(crypto.label)) params.push(`label=${encodeURIComponent(crypto.label.trim())}`);
  if (trimmed(crypto.message)) params.push(`message=${encodeURIComponent(crypto.message.trim())}`);
  return ok(`${scheme}:${address}${params.length ? `?${params.join('&')}` : ''}`);
}

/**
 * @param {object} config  { contentType, rawText, wifi, vcard, email, sms, geo, crypto }
 * @param {{familyNameFirst?: boolean}} [options]
 * @returns {{ok: boolean, payload: string, errorCode?: string}}
 */
export function buildQrPayload(config = {}, options = {}) {
  switch (config.contentType) {
    case 'wifi':
      return buildWifi(config.wifi);
    case 'vcard':
      return buildVcard(config.vcard, options);
    case 'email':
      return buildEmail(config.email);
    case 'sms':
      return buildSms(config.sms);
    case 'geo':
      return buildGeo(config.geo);
    case 'crypto':
      return buildCrypto(config.crypto);
    case 'text':
    case 'url':
    default: {
      const text = String(config.rawText ?? '');
      if (!text.trim()) return fail('TEXT_REQUIRED');
      return ok(config.contentType === 'url' ? text.trim() : text);
    }
  }
}

/**
 * qr-code-styling 1.9 mã hoá chế độ Byte bằng `charCode & 0xFF`, nên chữ có dấu
 * (Tiếng Việt, tiếng Nhật…) bị hỏng. Chuyển trước sang chuỗi "nhị phân" UTF-8:
 * mỗi ký tự là một byte, để thư viện ghi đúng các byte UTF-8.
 */
export function toUtf8ByteString(text) {
  const bytes = new TextEncoder().encode(String(text ?? ''));
  let out = '';
  for (let i = 0; i < bytes.length; i++) out += String.fromCharCode(bytes[i]);
  return out;
}

/** Số byte UTF-8 (giới hạn QR phiên bản 40, mức L ≈ 2953 byte). */
export function utf8ByteLength(text) {
  return new TextEncoder().encode(String(text ?? '')).length;
}

/**
 * Lề tĩnh (quiet zone) tính bằng pixel để có đúng `modules` mô-đun trắng quanh mã.
 * qr-code-styling vẽ mã trong (size - 2*margin), chia đều cho moduleCount.
 */
export function quietZoneMarginPx(size, moduleCount, modules = 4) {
  const n = Math.max(0, Number(modules) || 0);
  if (!n) return 0;
  if (!moduleCount) return Math.round(size * 0.08);
  return Math.floor((size * n) / (moduleCount + 2 * n));
}

/**
 * Tách một dòng CSV đơn giản (hỗ trợ ngoặc kép, dấu , ; hoặc tab).
 */
export function splitCsvLine(line) {
  const out = [];
  let cur = '';
  let quoted = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (quoted) {
      if (ch === '"' && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else if (ch === '"') {
        quoted = false;
      } else {
        cur += ch;
      }
    } else if (ch === '"' && cur.trim() === '') {
      quoted = true;
      cur = '';
    } else if (ch === ',' || ch === ';' || ch === '\t') {
      out.push(cur.trim());
      cur = '';
    } else {
      cur += ch;
    }
  }
  out.push(cur.trim());
  return out;
}

import { BaseProviderAdapter } from './base.js';
import { sanitizeLookupUrl } from '../sanitizer.js';
import { STATUS_TYPES } from '../types.js';

export class MisaProviderAdapter extends BaseProviderAdapter {
  constructor() {
    super('misa', 'MISA meInvoice');
  }

  match(url, text) {
    const cleanUrl = String(url || '').toLowerCase();
    const cleanText = String(text || '').toLowerCase();

    return (
      cleanUrl.includes('meinvoice.vn') ||
      cleanText.includes('meinvoice') ||
      cleanText.includes('công ty cổ phần misa')
    );
  }

  extractLookupCode(text) {
    if (!text) return null;
    const match =
      text.match(/(?:mã\s+tra\s+cứu|mã\s+nhận\s+hóa\s+đơn)\s*[:.]?\s*([A-Za-z0-9\-_]{6,32})/i) ||
      text.match(/(?:tra\s+cứu\s+tại[\s\S]*?mã)\s*[:.]?\s*([A-Za-z0-9\-_]{6,32})/i);
    return match ? match[1].trim() : null;
  }

  buildLookupUrl(rawUrl, code, metadata) {
    const sanitized = sanitizeLookupUrl(rawUrl);
    if (sanitized) {
      // If URL already has code embedded or direct portal
      return sanitized;
    }
    return 'https://www.meinvoice.vn/tra-cuu/';
  }

  getInitialStatus({ url, code }) {
    if (!url && !code) return STATUS_TYPES.UNSUPPORTED;
    return STATUS_TYPES.MANUAL_REQUIRED;
  }
}

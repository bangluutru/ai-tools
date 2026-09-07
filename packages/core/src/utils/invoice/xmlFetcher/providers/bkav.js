import { BaseProviderAdapter } from './base.js';
import { sanitizeLookupUrl } from '../sanitizer.js';
import { STATUS_TYPES } from '../types.js';

export class BkavProviderAdapter extends BaseProviderAdapter {
  constructor() {
    super('bkav', 'BKAV eHoadon');
  }

  match(url, text) {
    const cleanUrl = String(url || '').toLowerCase();
    const cleanText = String(text || '').toLowerCase();

    return (
      cleanUrl.includes('ehoadon.vn') ||
      cleanText.includes('ehoadon') ||
      cleanText.includes('tập đoàn công nghệ bkav') ||
      (cleanText.includes('bkav') && cleanText.includes('hóa đơn'))
    );
  }

  extractLookupCode(text) {
    if (!text) return null;
    const match = text.match(/(?:mã\s+tra\s+cứu|mã\s+tra\s+cứu\s+hóa\s+đơn)\s*[:.]?\s*([A-Za-z0-9\-_]{5,32})/i);
    return match ? match[1].trim() : null;
  }

  buildLookupUrl(rawUrl, code, metadata) {
    const sanitized = sanitizeLookupUrl(rawUrl);
    if (sanitized) return sanitized;
    return 'https://tracuu.ehoadon.vn';
  }

  getInitialStatus({ url, code }) {
    if (!url && !code) return STATUS_TYPES.UNSUPPORTED;
    return STATUS_TYPES.CAPTCHA_REQUIRED;
  }
}

import { BaseProviderAdapter } from './base.js';
import { sanitizeLookupUrl } from '../sanitizer.js';
import { STATUS_TYPES } from '../types.js';

export class ThaisonProviderAdapter extends BaseProviderAdapter {
  constructor() {
    super('thaison', 'Thái Sơn E-Invoice');
  }

  match(url, text) {
    const cleanUrl = String(url || '').toLowerCase();
    const cleanText = String(text || '').toLowerCase();

    return (
      cleanUrl.includes('einvoice.vn') ||
      cleanText.includes('thaison') ||
      cleanText.includes('thái sơn') ||
      (cleanText.includes('einvoice.vn') && cleanText.includes('tra cứu'))
    );
  }

  extractLookupCode(text) {
    if (!text) return null;
    const match =
      text.match(/(?:mã\s+nhận\s+hóa\s+đơn|mã\s+tra\s+cứu)\s*[:.]?\s*([A-Za-z0-9\-_]{6,35})/i) ||
      text.match(/(?:mã\s+số\s+bí\s+mật)\s*[:.]?\s*([A-Za-z0-9\-_]{6,35})/i);
    return match ? match[1].trim() : null;
  }

  buildLookupUrl(rawUrl, code, metadata) {
    const sanitized = sanitizeLookupUrl(rawUrl);
    if (sanitized) return sanitized;
    return 'https://einvoice.vn/tra-cuu';
  }

  getInitialStatus({ url, code }) {
    if (!url && !code) return STATUS_TYPES.UNSUPPORTED;
    return STATUS_TYPES.CAPTCHA_REQUIRED;
  }
}

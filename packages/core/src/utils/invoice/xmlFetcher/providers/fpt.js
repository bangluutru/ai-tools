import { BaseProviderAdapter } from './base.js';
import { sanitizeLookupUrl } from '../sanitizer.js';
import { STATUS_TYPES } from '../types.js';

export class FptProviderAdapter extends BaseProviderAdapter {
  constructor() {
    super('fpt', 'FPT eInvoice');
  }

  match(url, text) {
    const cleanUrl = String(url || '').toLowerCase();
    const cleanText = String(text || '').toLowerCase();

    return (
      cleanUrl.includes('einvoice.fpt.com.vn') ||
      cleanText.includes('fpt e-invoice') ||
      cleanText.includes('fpt einvoice') ||
      (cleanText.includes('fpt') && cleanText.includes('hóa đơn điện tử'))
    );
  }

  extractLookupCode(text) {
    if (!text) return null;
    const match = text.match(/(?:mã\s+nhận\s+hóa\s+đơn|mã\s+tra\s+cứu)\s*[:.]?\s*([A-Za-z0-9\-_*]{5,40})/i);
    return match ? match[1].trim() : null;
  }

  buildLookupUrl(rawUrl, code, metadata) {
    const sanitized = sanitizeLookupUrl(rawUrl);
    if (sanitized) return sanitized;
    return 'https://einvoice.fpt.com.vn/tracuu';
  }

  getInitialStatus({ url, code }) {
    if (!url && !code) return STATUS_TYPES.UNSUPPORTED;
    return STATUS_TYPES.CAPTCHA_REQUIRED;
  }
}

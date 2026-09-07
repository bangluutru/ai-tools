import { BaseProviderAdapter } from './base.js';
import { sanitizeLookupUrl } from '../sanitizer.js';
import { STATUS_TYPES } from '../types.js';

export class EasyInvoiceProviderAdapter extends BaseProviderAdapter {
  constructor() {
    super('easyinvoice', 'EasyInvoice (SoftDreams)');
  }

  match(url, text) {
    const cleanUrl = String(url || '').toLowerCase();
    const cleanText = String(text || '').toLowerCase();

    return (
      cleanUrl.includes('easyinvoice.vn') ||
      cleanText.includes('easyinvoice') ||
      cleanText.includes('softdreams')
    );
  }

  extractLookupCode(text) {
    if (!text) return null;
    const match = text.match(/(?:mã\s+tra\s+cứu|mã\s+nhận)\s*[:.]?\s*([A-Za-z0-9\-_]{6,32})/i);
    return match ? match[1].trim() : null;
  }

  buildLookupUrl(rawUrl, code, metadata) {
    const sanitized = sanitizeLookupUrl(rawUrl);
    if (sanitized) return sanitized;
    return 'https://tracuu.easyinvoice.vn';
  }

  getInitialStatus({ url, code }) {
    if (!url && !code) return STATUS_TYPES.UNSUPPORTED;
    return STATUS_TYPES.CAPTCHA_REQUIRED;
  }
}

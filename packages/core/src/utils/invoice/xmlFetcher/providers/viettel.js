import { BaseProviderAdapter } from './base.js';
import { sanitizeLookupUrl } from '../sanitizer.js';
import { STATUS_TYPES } from '../types.js';

export class ViettelProviderAdapter extends BaseProviderAdapter {
  constructor() {
    super('viettel', 'Viettel S-Invoice');
  }

  match(url, text) {
    const cleanUrl = String(url || '').toLowerCase();
    const cleanText = String(text || '').toLowerCase();

    return (
      cleanUrl.includes('sinvoice.viettel.vn') ||
      cleanUrl.includes('vinvoice.viettel.vn') ||
      cleanText.includes('s-invoice') ||
      cleanText.includes('sinvoice') ||
      (cleanText.includes('viettel') && cleanText.includes('hóa đơn điện tử'))
    );
  }

  extractLookupCode(text) {
    if (!text) return null;
    // Viettel uses "Mã số bí mật", "Access code", or "Mã bí mật"
    const match =
      text.match(/(?:mã\s+số\s+bí\s+mật|mã\s+bí\s+mật|access\s+code)\s*(?:\([^)]*\))?\s*[:.]?\s*([A-Za-z0-9\-_]{6,32})/i) ||
      text.match(/(?:mã\s+tra\s+cứu)\s*[:.]?\s*([A-Za-z0-9\-_]{6,32})/i);
    return match ? match[1].trim() : null;
  }

  buildLookupUrl(rawUrl, code, metadata) {
    const sanitized = sanitizeLookupUrl(rawUrl);
    if (sanitized) return sanitized;
    return 'https://sinvoice.viettel.vn/tracuuhoadon';
  }

  getInitialStatus({ url, code }) {
    if (!url && !code) return STATUS_TYPES.UNSUPPORTED;
    return STATUS_TYPES.CAPTCHA_REQUIRED;
  }
}

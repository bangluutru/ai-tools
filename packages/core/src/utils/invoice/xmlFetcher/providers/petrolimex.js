import { BaseProviderAdapter } from './base.js';
import { sanitizeLookupUrl } from '../sanitizer.js';
import { STATUS_TYPES } from '../types.js';

export class PetrolimexProviderAdapter extends BaseProviderAdapter {
  constructor() {
    super('petrolimex', 'Petrolimex Invoice');
  }

  match(url, text) {
    const cleanUrl = String(url || '').toLowerCase();
    const cleanText = String(text || '').toLowerCase();

    return (
      cleanUrl.includes('petrolimex.com.vn') ||
      cleanText.includes('petrolimex') ||
      cleanText.includes('xăng dầu việt nam')
    );
  }

  extractLookupCode(text) {
    if (!text) return null;
    const match =
      text.match(/(?:mã\s+tra\s+cứu)\s*[:.]?\s*([A-Za-z0-9\-_*]{5,35})/i) ||
      text.match(/(?:mã\s+số\s+bí\s+mật)\s*[:.]?\s*([A-Za-z0-9\-_*]{5,35})/i);
    return match ? match[1].trim() : null;
  }

  buildLookupUrl(rawUrl, code, metadata) {
    const sanitized = sanitizeLookupUrl(rawUrl);
    if (sanitized && sanitized.includes('petrolimex')) return sanitized;
    return 'https://hoadon.petrolimex.com.vn/';
  }

  getInitialStatus({ url, code }) {
    if (!url && !code) return STATUS_TYPES.UNSUPPORTED;
    return STATUS_TYPES.CAPTCHA_REQUIRED;
  }
}

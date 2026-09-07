import { BaseProviderAdapter } from './base.js';
import { sanitizeLookupUrl } from '../sanitizer.js';
import { STATUS_TYPES } from '../types.js';

export class VnptProviderAdapter extends BaseProviderAdapter {
  constructor() {
    super('vnpt', 'VNPT Invoice');
  }

  match(url, text) {
    const cleanUrl = String(url || '').toLowerCase();
    const cleanText = String(text || '').toLowerCase();

    return (
      cleanUrl.includes('vnpt-invoice.com.vn') ||
      cleanText.includes('vnpt-invoice') ||
      cleanText.includes('bưu chính viễn thông việt nam')
    );
  }

  extractLookupCode(text) {
    if (!text) return null;
    // VNPT often has "Mã nhận hóa đơn:", "Mã tra cứu:", or alphanumeric string with dashes
    const match =
      text.match(/(?:mã\s+nhận\s+hóa\s+đơn|mã\s+tra\s+cứu)\s*[:.]?\s*([A-Za-z0-9\-_*]{5,40})/i) ||
      text.match(/(?:mã\s+số\s+bí\s+mật)\s*[:.]?\s*([A-Za-z0-9\-_*]{5,40})/i);
    return match ? match[1].trim() : null;
  }

  buildLookupUrl(rawUrl, code, metadata) {
    const sanitized = sanitizeLookupUrl(rawUrl);
    if (sanitized) return sanitized;
    return 'https://tracuu.vnpt-invoice.com.vn';
  }

  getInitialStatus({ url, code }) {
    if (!url && !code) return STATUS_TYPES.UNSUPPORTED;
    // VNPT requires CAPTCHA on web search
    return STATUS_TYPES.CAPTCHA_REQUIRED;
  }
}

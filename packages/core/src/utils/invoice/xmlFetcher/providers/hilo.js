import { BaseProviderAdapter } from './base.js';
import { sanitizeLookupUrl } from '../sanitizer.js';
import { STATUS_TYPES } from '../types.js';

export class HiloProviderAdapter extends BaseProviderAdapter {
  constructor() {
    super('hilo', 'Hilo Invoice (GSM / Xanh SM)');
  }

  match(url, text) {
    const cleanUrl = String(url || '').toLowerCase();
    const cleanText = String(text || '').toLowerCase();

    return (
      cleanUrl.includes('hilo.com.vn') ||
      cleanUrl.includes('gsm-einvoice') ||
      cleanText.includes('hilo') ||
      (cleanText.includes('t-van hilo') && cleanText.includes('hóa đơn'))
    );
  }

  extractLookupCode(text) {
    if (!text) return null;
    const match =
      text.match(/(?:mã\s+nhận\s+hóa\s+đơn|mã\s+tra\s+cứu|mã\s+truy\s+cập)\s*[:.]?\s*([A-Za-z0-9\-_*]{5,40})/i) ||
      text.match(/(?:mã\s+số\s+bí\s+mật)\s*[:.]?\s*([A-Za-z0-9\-_*]{5,40})/i);
    return match ? match[1].trim() : null;
  }

  buildLookupUrl(rawUrl, code, metadata) {
    const sanitized = sanitizeLookupUrl(rawUrl);
    if (sanitized) return sanitized;
    return 'https://gsm-einvoice.hilo.com.vn/';
  }

  getInitialStatus({ url, code }) {
    if (!url && !code) return STATUS_TYPES.UNSUPPORTED;
    return STATUS_TYPES.CAPTCHA_REQUIRED;
  }
}

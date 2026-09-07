import { BaseProviderAdapter } from './base.js';
import { sanitizeLookupUrl } from '../sanitizer.js';
import { STATUS_TYPES } from '../types.js';

export class GenericProviderAdapter extends BaseProviderAdapter {
  constructor() {
    super('generic', 'Hóa đơn điện tử');
  }

  match() {
    return true; // Catch-all fallback
  }

  extractLookupCode(text) {
    if (!text) return null;
    const match =
      text.match(/(?:mã\s+tra\s+cứu\s+hóa\s+đơn|mã\s+tra\s+cứu|mã\s+nhận\s+hóa\s+đơn|mã\s+số\s+bí\s+mật|mã\s+bí\s+mật|lookup\s+code|access\s+code)\s*[:.]?\s*([A-Za-z0-9\-_]{5,40})/i);
    return match ? match[1].trim() : null;
  }

  buildLookupUrl(rawUrl) {
    return sanitizeLookupUrl(rawUrl);
  }

  getInitialStatus({ url, code }) {
    if (!url && !code) return STATUS_TYPES.UNSUPPORTED;
    return STATUS_TYPES.MANUAL_REQUIRED;
  }
}

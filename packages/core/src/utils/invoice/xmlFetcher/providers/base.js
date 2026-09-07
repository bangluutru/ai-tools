import { sanitizeLookupUrl, sanitizeLookupCode } from '../sanitizer.js';
import { STATUS_TYPES } from '../types.js';

/**
 * Base class for e-invoice provider adapters.
 */
export class BaseProviderAdapter {
  constructor(id, name) {
    this.id = id;
    this.name = name;
  }

  /**
   * Determines if a given URL and/or text matches this provider.
   * @param {string} url
   * @param {string} text
   * @returns {boolean}
   */
  match(url, text) {
    return false;
  }

  /**
   * Custom extraction logic for lookup code if the provider uses unique patterns.
   * @param {string} text
   * @returns {string|null}
   */
  extractLookupCode(text) {
    return null;
  }

  /**
   * Custom extraction logic for metadata if the provider has unique layouts.
   * @param {string} text
   * @returns {Object|null}
   */
  extractMetadata(text) {
    return null;
  }

  /**
   * Returns whether direct XML download from the client browser is reliably supported.
   * @param {string} url
   * @param {string} code
   * @returns {boolean}
   */
  canDirectDownload(url, code) {
    return false;
  }

  /**
   * Normalizes the lookup portal URL to open in a new tab.
   * @param {string} rawUrl
   * @param {string} [code]
   * @param {Object} [metadata]
   * @returns {string}
   */
  buildLookupUrl(rawUrl, code, metadata) {
    return sanitizeLookupUrl(rawUrl);
  }

  /**
   * Returns the initial assessment status: READY, CAPTCHA_REQUIRED, MANUAL_REQUIRED.
   * @param {Object} params
   * @returns {string}
   */
  getInitialStatus(params) {
    const { url, code, hasDirectDownload } = params || {};
    if (!url && !code) return STATUS_TYPES.UNSUPPORTED;
    if (hasDirectDownload || this.canDirectDownload(url, code)) return STATUS_TYPES.READY;
    return STATUS_TYPES.CAPTCHA_REQUIRED;
  }

  /**
   * Alias for getInitialStatus for compatibility
   */
  getLookupStatus(params) {
    return this.getInitialStatus(params);
  }

  /**
   * User-friendly instructions for manual handoff
   */
  getInstructions({ url, code } = {}) {
    if (!url && !code) {
      return 'Không tìm thấy đường link hoặc mã tra cứu trong file PDF.';
    }
    return `Nhấn "Mở trang tra cứu" và dán mã tra cứu để tải file XML từ ${this.name}.`;
  }

  /**
   * Attempts direct XML download if supported.
   * Default implementation returns null (manual required).
   * @param {string} url
   * @param {string} code
   * @param {Object} metadata
   * @returns {Promise<string|null>}
   */
  async tryDirectXml(url, code, metadata) {
    return null;
  }
}

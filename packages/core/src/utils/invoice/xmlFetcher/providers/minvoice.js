import JSZip from 'jszip';
import { BaseProviderAdapter } from './base.js';
import { sanitizeLookupUrl, sanitizeLookupCode } from '../sanitizer.js';
import { STATUS_TYPES } from '../types.js';

export class MinvoiceProviderAdapter extends BaseProviderAdapter {
  constructor() {
    super('minvoice', 'Minvoice (M-Invoice)');
  }

  match(url, text) {
    const cleanUrl = String(url || '').toLowerCase();
    const cleanText = String(text || '').toLowerCase();

    return (
      cleanUrl.includes('minvoice.com.vn') ||
      cleanUrl.includes('minvoice.vn') ||
      cleanText.includes('minvoice') ||
      cleanText.includes('m-invoice') ||
      cleanText.includes('hóa đơn điện tử minvoice')
    );
  }

  extractLookupCode(text) {
    if (!text) return null;

    // 1. Spaced-out lookup code (e.g. "Mã tra cứu: J Y R E 6 7 V G 1 2 E T M 8 0 P D B R Y")
    const spacedMatch = text.match(/(?:mã\s+tra\s+cứu|mã\s+nhận\s+hóa\s+đơn|mã\s+bảo\s+mật|số\s+bảo\s+mật)\s*[:.]?\s*([A-Za-z0-9\-_* ]{10,80})/i);
    if (spacedMatch && spacedMatch[1]) {
      const candidate = spacedMatch[1].replace(/\s+/g, '').trim();
      if (candidate.length >= 8 && /^[A-Za-z0-9\-_*]+$/.test(candidate)) {
        return sanitizeLookupCode(candidate);
      }
    }

    // 2. Standard lookup code
    const standardMatch = text.match(/(?:mã\s+tra\s+cứu|mã\s+nhận\s+hóa\s+đơn|mã\s+bảo\s+mật|số\s+bảo\s+mật)\s*[:.]?\s*([A-Za-z0-9\-_*]{5,40})/i);
    return standardMatch ? sanitizeLookupCode(standardMatch[1]) : null;
  }

  buildLookupUrl(rawUrl, code, metadata) {
    const sanitized = sanitizeLookupUrl(rawUrl);
    if (sanitized && sanitized.includes('minvoice')) return sanitized;
    return 'https://tracuuhoadon.minvoice.com.vn/';
  }

  canDirectDownload(url, code) {
    return Boolean(code);
  }

  getInitialStatus({ url, code, hasDirectDownload }) {
    if (!url && !code) return STATUS_TYPES.UNSUPPORTED;
    // Minvoice has open public REST API supporting direct XML download without CAPTCHA
    if (code) return STATUS_TYPES.READY;
    return STATUS_TYPES.MANUAL_REQUIRED;
  }

  getInstructions({ url, code } = {}) {
    if (!url && !code) {
      return 'Không tìm thấy đường link hoặc mã tra cứu trong file PDF.';
    }
    return 'Hệ thống tự động tải file XML trực tiếp từ cổng Minvoice không cần CAPTCHA. Bạn cũng có thể mở trang tra cứu để xem hóa đơn gốc.';
  }

  async tryDirectXml(url, code, metadata = {}) {
    const taxCode = metadata.sellerTaxCode || metadata.taxCode || '';
    if (!code || !taxCode) {
      return null;
    }

    const cleanTax = String(taxCode).replace(/[^0-9]/g, '');
    const cleanCode = sanitizeLookupCode(code);
    const downloadApiUrl = `https://tracuuhoadon.minvoice.com.vn/api/Search/DownloadXml?masothue=${encodeURIComponent(cleanTax)}&sobaomat=${encodeURIComponent(cleanCode)}`;

    try {
      const response = await fetch(downloadApiUrl, {
        method: 'GET',
        headers: {
          Accept: 'application/zip, application/xml, text/xml, */*',
        },
      });

      if (!response.ok) {
        return null;
      }

      const contentType = response.headers.get('content-type') || '';
      const arrayBuffer = await response.arrayBuffer();

      // Check if response is a ZIP archive
      const isZip =
        contentType.includes('zip') ||
        (arrayBuffer.byteLength >= 4 &&
          new Uint8Array(arrayBuffer, 0, 4).every((byte, idx) => byte === [0x50, 0x4b, 0x03, 0x04][idx]));

      if (isZip) {
        const zip = await JSZip.loadAsync(arrayBuffer);
        const xmlEntry = Object.values(zip.files).find((f) => !f.dir && f.name.toLowerCase().endsWith('.xml'));
        if (!xmlEntry) {
          return null;
        }

        const xmlText = await xmlEntry.async('string');
        return xmlText;
      }

      // If already XML text
      const textDecoder = new TextDecoder('utf-8');
      const text = textDecoder.decode(arrayBuffer);
      if (text.trim().startsWith('<?xml') || text.trim().startsWith('<')) {
        return text;
      }

      return null;
    } catch (err) {
      return null;
    }
  }
}

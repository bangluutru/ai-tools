/**
 * Tải một Blob xuống máy.
 *
 * Thu hồi object URL ngay sau `a.click()` khiến Safari/Firefox đôi khi huỷ
 * lượt tải (lượt tải bắt đầu bất đồng bộ). URL chỉ được thu hồi sau một
 * khoảng trễ.
 */
export const DOWNLOAD_REVOKE_DELAY_MS = 60_000;

export function scheduleRevoke(url, delayMs = DOWNLOAD_REVOKE_DELAY_MS) {
  if (!url || typeof URL === 'undefined') return;
  setTimeout(() => {
    try {
      URL.revokeObjectURL(url);
    } catch {}
  }, delayMs);
}

export function downloadBlob(blob, filename, { revokeDelayMs = DOWNLOAD_REVOKE_DELAY_MS } = {}) {
  if (!blob) throw new Error('Nothing to download');
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.rel = 'noopener';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  scheduleRevoke(url, revokeDelayMs);
  return url;
}

const MIME_EXTENSIONS = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/webp': 'webp',
  'image/avif': 'avif',
  'image/gif': 'gif',
  'image/svg+xml': 'svg',
};

/** Phần mở rộng thật theo MIME của Blob (vd Safari trả PNG khi xin WebP). */
export function extensionForMime(mime, fallback = 'png') {
  return MIME_EXTENSIONS[String(mime || '').split(';')[0].trim().toLowerCase()] || fallback;
}

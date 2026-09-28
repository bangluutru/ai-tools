/**
 * @file hub/src/utils/navigation.js
 * ============================================================================
 * Định tuyến bằng đường dẫn thật (/tools/:toolId, /japan-life…) để từng miniapp có
 * URL riêng mà công cụ tìm kiếm index được — Google bỏ qua mọi thứ sau dấu `#`.
 *
 * URL hash cũ (#/tools/:id) vẫn chạy: bookmark cũ, link từ chottoday.com và các
 * `href="#/tools/…"` bên trong miniapp đều được đổi sang đường dẫn tương ứng bằng
 * replaceState. Bộ phân giải route (hubRoute.js / toolRoute.js) giữ nguyên hợp đồng
 * nhận chuỗi dạng hash — `routeKey()` chuyển vị trí hiện tại về dạng đó.
 * ============================================================================
 */

export const NAVIGATE_EVENT = 'toolio:navigate';

/** Các tiền tố đường dẫn thuộc SPA; link nội bộ khác (/samples, /assets…) để trình duyệt tự xử lý. */
const APP_PATH = /^\/(?:$|\?|tools(?:$|[/?])|common(?:$|\?)|japan-life(?:$|\?)|vietnam-life(?:$|\?))/;

/**
 * Chuỗi route dạng hash cho bộ phân giải: ưu tiên hash cũ nếu có, không thì dựng từ pathname.
 * @param {{ pathname?: string, search?: string, hash?: string }} loc
 * @returns {string} VD '#/tools/pdf-toolkit?tab=merge'
 */
export function routeKey(loc = window.location) {
  const hash = loc.hash || '';
  if (hash.startsWith('#/') && hash.length > 2) return hash;
  const pathname = (loc.pathname || '/').replace(/\/+$/, '') || '/';
  return `#${pathname}${loc.search || ''}`;
}

/**
 * '#/tools/x?y' → '/tools/x?y'. Trả null nếu không phải hash route của hub.
 * @param {string} hash
 */
export function hashToPath(hash) {
  if (!hash || !hash.startsWith('#/')) return null;
  const path = hash.slice(1);
  return APP_PATH.test(path) ? path : null;
}

/** Đường dẫn của một miniapp. */
export function toolPath(toolId) {
  return toolId ? `/tools/${toolId}` : '/';
}

/**
 * Đường dẫn của trang domain, cùng quy ước với buildDomainHash.
 * @param {string} domainId - 'common' | 'japan-life' | 'vietnam-life' | 'home'
 * @param {string} [filterId]
 */
export function buildDomainPath(domainId, filterId) {
  if (!domainId || domainId === 'home') return '/';
  const slug = domainId === 'common' ? 'tools' : domainId;
  const paramKey = domainId === 'common' ? 'category' : 'domain';
  if (filterId && filterId !== 'all') return `/${slug}?${paramKey}=${encodeURIComponent(filterId)}`;
  return `/${slug}`;
}

/**
 * Chuyển trang trong SPA. Phát NAVIGATE_EVENT để App đồng bộ route (pushState không
 * tự phát popstate).
 * @param {string} path
 * @param {{ replace?: boolean }} [options]
 */
export function navigate(path, { replace = false } = {}) {
  const current = `${window.location.pathname}${window.location.search}${window.location.hash}`;
  if (path !== current) {
    window.history[replace ? 'replaceState' : 'pushState'](null, '', path);
  }
  window.dispatchEvent(new Event(NAVIGATE_EVENT));
}

/**
 * Nếu URL đang ở dạng hash cũ, đổi tại chỗ sang đường dẫn thật (không tạo mục lịch sử).
 * @returns {boolean} true nếu đã đổi
 */
export function upgradeLegacyHashUrl() {
  const path = hashToPath(window.location.hash);
  if (!path) return false;
  window.history.replaceState(null, '', path);
  return true;
}

/**
 * Chặn click vào <a href="/tools/…"> (và các đường dẫn SPA khác) để chuyển trang không
 * tải lại. Giữ nguyên hành vi mặc định khi mở tab mới, có modifier, target khác hoặc
 * link ngoài.
 * @returns {() => void} hàm gỡ listener
 */
export function interceptInternalLinks() {
  const onClick = (event) => {
    if (event.defaultPrevented || event.button !== 0) return;
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const anchor = event.target instanceof Element ? event.target.closest('a[href]') : null;
    if (!anchor || (anchor.target && anchor.target !== '_self') || anchor.hasAttribute('download')) return;
    const href = anchor.getAttribute('href') || '';
    let path = null;
    if (href.startsWith('#/')) {
      path = hashToPath(href);
    } else if (href.startsWith('/') && !href.startsWith('//')) {
      path = APP_PATH.test(href) ? href : null;
    } else {
      try {
        const url = new URL(anchor.href, window.location.href);
        if (url.origin === window.location.origin && APP_PATH.test(url.pathname + url.search)) {
          path = `${url.pathname}${url.search}`;
        }
      } catch {
        path = null;
      }
    }
    if (!path) return;
    event.preventDefault();
    navigate(path);
    window.scrollTo({ top: 0 });
  };
  document.addEventListener('click', onClick);
  return () => document.removeEventListener('click', onClick);
}

/**
 * Đọc một query param của route hiện tại, bất kể URL đang dạng đường dẫn hay hash cũ.
 * @param {string} key
 */
export function getRouteQueryParam(key) {
  const keyStr = routeKey();
  const idx = keyStr.indexOf('?');
  if (idx === -1) return null;
  return new URLSearchParams(keyStr.slice(idx + 1)).get(key);
}

/**
 * Ghi đè một query param của route hiện tại (replaceState, không tạo mục lịch sử).
 * @param {string} key
 * @param {string|null} value
 */
export function setRouteQueryParam(key, value) {
  upgradeLegacyHashUrl();
  const params = new URLSearchParams(window.location.search);
  if (value === null || value === undefined || value === '') params.delete(key);
  else params.set(key, value);
  const qs = params.toString();
  window.history.replaceState(null, '', `${window.location.pathname}${qs ? `?${qs}` : ''}`);
}

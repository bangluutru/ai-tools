/**
 * @file hub/src/utils/routeMeta.js
 * ============================================================================
 * Title / mô tả / canonical cho từng route. Dùng chung cho hai nơi để chúng không
 * lệch nhau:
 *   - runtime: applyRouteMeta() cập nhật <head> khi người dùng chuyển trang;
 *   - build:  hub/scripts/prerender.mjs sinh HTML tĩnh cho từng miniapp.
 * Hàm thuần (trừ applyRouteMeta) — chạy được trong Node.
 * ============================================================================
 */
import { HUB_DOMAINS } from '../config/hubPresentation.js';

export const SITE_ORIGIN = 'https://toolio.chottoday.com';
export const SITE_NAME = 'Toolio';

const HOME_META = {
  title: 'Toolio — Công cụ miễn phí cho người Việt ở Nhật và Việt Nam | ChottoDay',
  description:
    'Toolio (ChottoDay): công cụ miễn phí chạy trên trình duyệt — tính thuế, bảo hiểm, trợ cấp và thủ tục visa tại Nhật; thuế TNCN, BHXH, tiền điện tại Việt Nam; xử lý PDF, ảnh, hóa đơn. Dữ liệu không rời máy bạn.',
  path: '/',
};

// Mô tả SEO riêng cho trang domain (mô tả trong hubPresentation là khẩu hiệu thẻ, không
// nói trang có gì).
const DOMAIN_DESCRIPTIONS = {
  common:
    'Công cụ miễn phí chạy trên trình duyệt: tách/gộp PDF, chuyển đổi tài liệu, nén ảnh, ảnh thẻ, danh thiếp, mã QR, hóa đơn điện tử, đóng dấu watermark. File không tải lên máy chủ.',
  'japan-life':
    'Công cụ cho người Việt ở Nhật: mô phỏng thuế thu nhập và thuế cư trú, bảo hiểm xã hội, lương hưu, trợ cấp thất nghiệp, nghỉ sinh và nuôi con, gia hạn/đổi visa, vĩnh trú, chuyển nhà, giấy tờ và thủ tục lãnh sự.',
  'vietnam-life':
    'Công cụ cho đời sống tại Việt Nam: tính lương Gross ↔ Net và thuế TNCN 2026, BHXH/BHYT/BHTN, lãi vay thực tế (APR), tiền điện sinh hoạt theo bậc.',
};

const DOMAIN_SLUG = { common: 'tools', 'japan-life': 'japan-life', 'vietnam-life': 'vietnam-life' };

function clip(text, max = 160) {
  const clean = String(text || '').replace(/\s+/g, ' ').trim();
  if (clean.length <= max) return clean;
  const cut = clean.slice(0, max - 1);
  return `${cut.slice(0, Math.max(cut.lastIndexOf(' '), max - 20))}…`;
}

export { DOMAIN_DESCRIPTIONS };

/** Đường dẫn canonical của một domain. */
export function domainPath(domainId) {
  return `/${DOMAIN_SLUG[domainId] || 'tools'}`;
}

/**
 * @param {{ type: 'home'|'domain'|'tool', domain?: string, toolId?: string }} route
 * @param {Array} tools - toolsRegistry.tools
 * @returns {{ title: string, description: string, path: string, url: string }}
 */
export function getRouteMeta(route, tools) {
  let meta = HOME_META;
  if (route?.type === 'tool') {
    const tool = tools.find((t) => t.id === route.toolId);
    if (tool) {
      meta = {
        title: `${tool.name_vn} — Toolio | ChottoDay`,
        description: clip(tool.desc_vn),
        path: `/tools/${tool.id}`,
      };
    }
  } else if (route?.type === 'domain') {
    const domain = HUB_DOMAINS[route.domain];
    if (domain) {
      meta = {
        title: `${domain.name.vi} — Toolio | ChottoDay`,
        description: clip(DOMAIN_DESCRIPTIONS[route.domain] || domain.description?.vi || HOME_META.description),
        path: domainPath(route.domain),
      };
    }
  }
  return { ...meta, url: `${SITE_ORIGIN}${meta.path === '/' ? '/' : meta.path}` };
}

function upsertMeta(selector, create) {
  let el = document.head.querySelector(selector);
  if (!el) {
    el = create();
    document.head.appendChild(el);
  }
  return el;
}

/** Cập nhật <head> theo route hiện tại (chỉ chạy trong trình duyệt). */
export function applyRouteMeta(route, tools) {
  if (typeof document === 'undefined') return;
  const meta = getRouteMeta(route, tools);
  document.title = meta.title;
  const set = (attr, key, value) => {
    upsertMeta(`meta[${attr}="${key}"]`, () => {
      const el = document.createElement('meta');
      el.setAttribute(attr, key);
      return el;
    }).setAttribute('content', value);
  };
  set('name', 'description', meta.description);
  set('property', 'og:title', meta.title);
  set('property', 'og:description', meta.description);
  set('property', 'og:url', meta.url);
  upsertMeta('link[rel="canonical"]', () => {
    const el = document.createElement('link');
    el.setAttribute('rel', 'canonical');
    return el;
  }).setAttribute('href', meta.url);
}

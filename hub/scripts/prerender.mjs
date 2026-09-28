#!/usr/bin/env node
/**
 * Prerender SEO cho Toolio: mỗi miniapp và mỗi trang domain có một tệp HTML riêng.
 *
 * Chạy sau `vite build` (xem script "build" của hub). Lấy dist/index.html làm khuôn và
 * sinh:
 *   dist/tools/<id>.html     — /tools/<id>
 *   dist/tools.html, dist/japan-life.html, dist/vietnam-life.html — trang domain
 *   dist/index.html          — trang chủ (thêm canonical, OG, JSON-LD, danh sách link)
 *   dist/sitemap.xml         — toàn bộ URL trên
 *
 * Cloudflare Pages phục vụ `tools/x.html` tại `/tools/x` (và chuyển `/tools/x.html` về
 * đó), nên URL canonical không có đuôi. Đường dẫn nào không có tệp thì Pages trả
 * index.html (chế độ SPA vì dist không có 404.html) và App tự phân giải route.
 *
 * HTML chỉ chứa metadata + nội dung tĩnh ngắn (tên, mô tả, link liên quan) bên trong
 * #root; React thay thế nó khi chạy. Tiêu đề/mô tả lấy từ src/utils/routeMeta.js — cùng
 * nguồn với applyRouteMeta() ở runtime, để hai phía không lệch nhau.
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { activeTools, tools } from '../src/config/toolsRegistry.js';
import { HUB_DOMAINS } from '../src/config/hubPresentation.js';
import { getRouteMeta, domainPath, SITE_ORIGIN, SITE_NAME } from '../src/utils/routeMeta.js';

const hubDir = join(dirname(fileURLToPath(import.meta.url)), '..');
const distDir = join(hubDir, 'dist');
const template = readFileSync(join(distDir, 'index.html'), 'utf8');
const buildDate = new Date().toISOString().slice(0, 10);

const DOMAINS = ['common', 'japan-life', 'vietnam-life'];

const esc = (value) =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

/** JSON trong <script type="application/ld+json">: chặn `</script>` và ký tự dòng JS. */
const jsonLd = (data) =>
  JSON.stringify(data)
    .replace(/</g, '\\u003c')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029');

const groupOf = (tool) => tool.group || 'common';
const toolUrl = (tool) => `${SITE_ORIGIN}/tools/${tool.id}`;

function headTags(meta, structuredData) {
  return [
    `<title>${esc(meta.title)}</title>`,
    `<meta name="description" content="${esc(meta.description)}" />`,
    `<link rel="canonical" href="${esc(meta.url)}" />`,
    `<meta property="og:type" content="website" />`,
    `<meta property="og:site_name" content="${SITE_NAME} — ChottoDay" />`,
    `<meta property="og:locale" content="vi_VN" />`,
    `<meta property="og:title" content="${esc(meta.title)}" />`,
    `<meta property="og:description" content="${esc(meta.description)}" />`,
    `<meta property="og:url" content="${esc(meta.url)}" />`,
    `<meta name="twitter:card" content="summary" />`,
    ...structuredData.map((data) => `<script type="application/ld+json">${jsonLd(data)}</script>`),
  ].join('\n    ');
}

function breadcrumb(items) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

const linkList = (list) =>
  `<ul>${list.map((t) => `<li><a href="/tools/${t.id}">${esc(t.name_vn)}</a> — ${esc(t.desc_vn)}</li>`).join('')}</ul>`;

/** Nội dung tĩnh trong #root: đọc được khi chưa chạy JS, React thay thế khi mount. */
function staticBody({ crumbs, heading, intro, sections }) {
  const nav = crumbs
    .map((c, i) => (i === crumbs.length - 1 ? esc(c.name) : `<a href="${esc(c.path)}">${esc(c.name)}</a>`))
    .join(' › ');
  const body = sections.map((s) => `<h2>${esc(s.title)}</h2>${s.html}`).join('');
  return `<main class="toolio-prerender" style="max-width:960px;margin:0 auto;padding:24px 16px;font-family:Inter,system-ui,sans-serif;line-height:1.6">` +
    `<nav aria-label="breadcrumb">${nav}</nav><h1>${esc(heading)}</h1><p>${esc(intro)}</p>` +
    `<p><em>Đang tải công cụ… Toolio chạy hoàn toàn trên trình duyệt; dữ liệu bạn nhập không gửi lên máy chủ.</em></p>` +
    `${body}</main>`;
}

function render(meta, structuredData, bodyHtml) {
  let html = template
    .replace(/<title>[\s\S]*?<\/title>/, '')
    .replace(/<meta name="description"[^>]*>/, '')
    .replace(/<link rel="canonical"[^>]*>/, '');
  html = html.replace('<meta charset="UTF-8" />', `<meta charset="UTF-8" />\n    ${headTags(meta, structuredData)}`);
  if (!html.includes('<div id="root"></div>')) throw new Error('dist/index.html thiếu <div id="root"></div>');
  return html.replace('<div id="root"></div>', `<div id="root">${bodyHtml}</div>`);
}

function write(relPath, html) {
  const out = join(distDir, relPath);
  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, html);
}

const homeCrumb = { name: 'Toolio', path: '/', url: `${SITE_ORIGIN}/` };
const domainCrumb = (domainId) => ({
  name: HUB_DOMAINS[domainId].name.vi,
  path: domainPath(domainId),
  url: `${SITE_ORIGIN}${domainPath(domainId)}`,
});

// --- Miniapp ---
for (const tool of activeTools) {
  const meta = getRouteMeta({ type: 'tool', toolId: tool.id }, tools);
  const group = groupOf(tool);
  const related = activeTools
    .filter((t) => t.id !== tool.id && groupOf(t) === group && (t.domain || null) === (tool.domain || null))
    .slice(0, 8);
  const crumbs = [homeCrumb, domainCrumb(group), { name: tool.name_vn, path: `/tools/${tool.id}`, url: toolUrl(tool) }];
  const app = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: tool.name_vn,
    alternateName: [tool.name_en, tool.name_ja].filter(Boolean),
    description: tool.desc_vn,
    url: toolUrl(tool),
    applicationCategory: group === 'common' ? 'UtilitiesApplication' : 'FinanceApplication',
    operatingSystem: 'Web browser',
    inLanguage: 'vi',
    isAccessibleForFree: true,
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'JPY' },
    keywords: (tool.tags || []).join(', '),
    isPartOf: { '@type': 'WebSite', name: 'ChottoDay', url: 'https://chottoday.com' },
  };
  const sections = [];
  if (related.length) sections.push({ title: 'Công cụ liên quan', html: linkList(related) });
  write(
    `tools/${tool.id}.html`,
    render(meta, [app, breadcrumb(crumbs)], staticBody({ crumbs, heading: tool.name_vn, intro: tool.desc_vn, sections })),
  );
}

// --- Trang domain ---
for (const domainId of DOMAINS) {
  const meta = getRouteMeta({ type: 'domain', domain: domainId }, tools);
  const list = activeTools.filter((t) => groupOf(t) === domainId);
  const crumbs = [homeCrumb, domainCrumb(domainId)];
  const collection = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: HUB_DOMAINS[domainId].name.vi,
    description: meta.description,
    url: meta.url,
    hasPart: list.map((t) => ({ '@type': 'WebApplication', name: t.name_vn, url: toolUrl(t) })),
  };
  write(
    `${domainPath(domainId).slice(1)}.html`,
    render(meta, [collection, breadcrumb(crumbs)], staticBody({
      crumbs,
      heading: HUB_DOMAINS[domainId].name.vi,
      intro: meta.description,
      sections: [{ title: `${list.length} công cụ`, html: linkList(list) }],
    })),
  );
}

// --- Trang chủ ---
{
  const meta = getRouteMeta({ type: 'home' }, tools);
  const site = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Toolio — ChottoDay',
    url: `${SITE_ORIGIN}/`,
    inLanguage: 'vi',
    isPartOf: { '@type': 'WebSite', name: 'ChottoDay', url: 'https://chottoday.com' },
  };
  const sections = DOMAINS.map((domainId) => ({
    title: HUB_DOMAINS[domainId].name.vi,
    html: `<p><a href="${domainPath(domainId)}">Xem tất cả</a></p>${linkList(activeTools.filter((t) => groupOf(t) === domainId))}`,
  }));
  write('index.html', render(meta, [site], staticBody({ crumbs: [homeCrumb], heading: 'Toolio', intro: meta.description, sections })));
}

// --- Sitemap ---
const urls = [
  { loc: `${SITE_ORIGIN}/`, priority: '1.0' },
  ...DOMAINS.map((d) => ({ loc: `${SITE_ORIGIN}${domainPath(d)}`, priority: '0.8' })),
  ...activeTools.map((t) => ({ loc: toolUrl(t), priority: '0.7' })),
];
write(
  'sitemap.xml',
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls
    .map((u) => `  <url>\n    <loc>${esc(u.loc)}</loc>\n    <lastmod>${buildDate}</lastmod>\n    <priority>${u.priority}</priority>\n  </url>`)
    .join('\n')}\n</urlset>\n`,
);

console.log(`✓ Prerender: ${activeTools.length} miniapp, ${DOMAINS.length} trang domain, trang chủ, sitemap ${urls.length} URL.`);

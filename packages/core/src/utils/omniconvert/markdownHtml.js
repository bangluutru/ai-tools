/**
 * Trình phân tích Markdown tối giản, an toàn (không phụ thuộc DOM).
 *
 * - Mọi văn bản đều được escape: HTML thô trong Markdown hiển thị như chữ,
 *   không bao giờ lọt thành thẻ (tránh XSS khi mở tệp .html xuất ra).
 * - Liên kết chỉ nhận http(s)/mailto; `javascript:` và scheme lạ bị bỏ.
 * - Mục danh sách luôn nằm trong <ul>/<ol>.
 */
import { escapeHtml } from './htmlPdfRenderer.js';

const SAFE_URL_RE = /^(https?:\/\/|mailto:)/i;

/** Định dạng inline: `code`, **đậm**, *nghiêng* / _nghiêng_, ~~gạch~~, [chữ](url). */
export function renderInline(text) {
  const parts = String(text ?? '').split(/(`[^`]+`)/g);
  return parts.map((part) => {
    if (part.length > 1 && part.startsWith('`') && part.endsWith('`')) {
      return `<code>${escapeHtml(part.slice(1, -1))}</code>`;
    }
    let html = escapeHtml(part);
    html = html.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_m, label, url) => {
      // url đã escape; so khớp scheme trên chuỗi gốc tương đương.
      const decoded = url.replace(/&amp;/g, '&');
      return SAFE_URL_RE.test(decoded) ? `<a href="${url}">${label}</a>` : label;
    });
    html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/__([^_]+)__/g, '<strong>$1</strong>');
    html = html.replace(/(^|[^*])\*([^*\s][^*]*)\*/g, '$1<em>$2</em>');
    html = html.replace(/(^|[^\w])_([^_\s][^_]*)_(?=[^\w]|$)/g, '$1<em>$2</em>');
    html = html.replace(/~~([^~]+)~~/g, '<del>$1</del>');
    return html;
  }).join('');
}

const TABLE_SEPARATOR_RE = /^\|?\s*:?-+:?\s*(\|\s*:?-+:?\s*)*\|?$/;

function splitTableRow(line) {
  let body = line.trim();
  if (body.startsWith('|')) body = body.slice(1);
  if (body.endsWith('|')) body = body.slice(0, -1);
  return body.split('|').map((cell) => cell.trim());
}

/**
 * Phân tích Markdown thành danh sách khối có cấu trúc.
 * @returns {Array<{type: string, [key: string]: any}>}
 */
export function parseMarkdownBlocks(markdown) {
  const lines = String(markdown ?? '').replace(/\r\n?/g, '\n').split('\n');
  const blocks = [];
  let paragraph = [];

  const flushParagraph = () => {
    if (paragraph.length) {
      blocks.push({ type: 'p', text: paragraph.join(' ') });
      paragraph = [];
    }
  };

  for (let i = 0; i < lines.length; i += 1) {
    const raw = lines[i];
    const line = raw.trim();

    const fence = line.match(/^(```|~~~)/);
    if (fence) {
      flushParagraph();
      const code = [];
      i += 1;
      while (i < lines.length && !lines[i].trim().startsWith(fence[1])) {
        code.push(lines[i]);
        i += 1;
      }
      blocks.push({ type: 'code', lines: code });
      continue;
    }

    if (!line) { flushParagraph(); continue; }

    const heading = line.match(/^(#{1,6})\s+(.*?)\s*#*$/);
    if (heading) {
      flushParagraph();
      blocks.push({ type: 'heading', level: heading[1].length, text: heading[2] });
      continue;
    }

    if (/^(\*\s*){3,}$|^(-\s*){3,}$|^(_\s*){3,}$/.test(line)) {
      flushParagraph();
      blocks.push({ type: 'hr' });
      continue;
    }

    if (line.includes('|') && i + 1 < lines.length && TABLE_SEPARATOR_RE.test(lines[i + 1].trim())) {
      flushParagraph();
      const header = splitTableRow(line);
      const rows = [];
      i += 2;
      while (i < lines.length && lines[i].trim() && lines[i].includes('|')) {
        rows.push(splitTableRow(lines[i]));
        i += 1;
      }
      i -= 1;
      blocks.push({ type: 'table', header, rows });
      continue;
    }

    const bullet = raw.match(/^(\s*)[-*+]\s+(.*)$/);
    const ordered = raw.match(/^(\s*)(\d+)[.)]\s+(.*)$/);
    if (bullet || ordered) {
      flushParagraph();
      const ordered_ = Boolean(ordered);
      const text = ordered ? ordered[3] : bullet[2];
      const last = blocks[blocks.length - 1];
      const item = text.replace(/^\[( |x|X)\]\s+/, (m, mark) => (mark.trim() ? '☑ ' : '☐ '));
      if (last && last.type === 'list' && last.ordered === ordered_) {
        last.items.push(item);
      } else {
        blocks.push({ type: 'list', ordered: ordered_, start: ordered ? Number(ordered[2]) : 1, items: [item] });
      }
      continue;
    }

    if (line.startsWith('>')) {
      flushParagraph();
      const text = line.replace(/^>\s?/, '');
      const last = blocks[blocks.length - 1];
      if (last && last.type === 'quote') last.lines.push(text);
      else blocks.push({ type: 'quote', lines: [text] });
      continue;
    }

    paragraph.push(line);
  }
  flushParagraph();
  return blocks;
}

function blockToHtml(block) {
  switch (block.type) {
    case 'heading':
      return `<h${block.level}>${renderInline(block.text)}</h${block.level}>`;
    case 'p':
      return `<p>${renderInline(block.text)}</p>`;
    case 'hr':
      return '<hr />';
    case 'code':
      return `<pre><code>${escapeHtml(block.lines.join('\n'))}</code></pre>`;
    case 'quote':
      return `<blockquote>${block.lines.map(renderInline).join('<br />')}</blockquote>`;
    case 'list': {
      const tag = block.ordered ? 'ol' : 'ul';
      const start = block.ordered && block.start !== 1 ? ` start="${block.start}"` : '';
      return `<${tag}${start}>${block.items.map((item) => `<li>${renderInline(item)}</li>`).join('')}</${tag}>`;
    }
    case 'table':
      return `<table><thead><tr>${block.header.map((c) => `<th>${renderInline(c)}</th>`).join('')}</tr></thead>`
        + `<tbody>${block.rows.map((r) => `<tr>${block.header.map((_, idx) => `<td>${renderInline(r[idx] ?? '')}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
    default:
      return '';
  }
}

/** Markdown → đoạn HTML an toàn (không kèm <html>/<body>). */
export function markdownToHtml(markdown) {
  return parseMarkdownBlocks(markdown).map(blockToHtml).join('\n');
}

export const MARKDOWN_DOCUMENT_CSS = `
  .omni-md h1 { font-size:26px; font-weight:700; color:#0f172a; margin:0 0 14px; padding-bottom:8px; border-bottom:2px solid #e2e8f0; }
  .omni-md h2 { font-size:20px; font-weight:700; color:#1e293b; margin:18px 0 10px; }
  .omni-md h3 { font-size:16px; font-weight:600; color:#334155; margin:14px 0 8px; }
  .omni-md h4, .omni-md h5, .omni-md h6 { font-size:14px; font-weight:600; margin:12px 0 6px; }
  .omni-md p { margin:0 0 10px; }
  .omni-md ul, .omni-md ol { margin:0 0 6px; padding-left:24px; }
  .omni-md ul { list-style:disc outside; }
  .omni-md ol { list-style:decimal outside; }
  .omni-md strong { font-weight:700; }
  .omni-md em { font-style:italic; }
  .omni-md del { text-decoration:line-through; }
  .omni-md li { margin:0 0 4px; }
  .omni-md blockquote { margin:0 0 10px; padding:6px 12px; border-left:4px solid #cbd5e1; color:#475569; background:#f8fafc; }
  .omni-md pre { margin:0; padding:2px 12px; background:#f1f5f9; font-family:ui-monospace, Menlo, Consolas, monospace; font-size:12px; white-space:pre-wrap; word-break:break-word; }
  .omni-md code { font-family:ui-monospace, Menlo, Consolas, monospace; font-size:12px; background:#f1f5f9; padding:0 3px; border-radius:3px; }
  .omni-md hr { border:none; border-top:1px solid #e2e8f0; margin:14px 0; }
  .omni-md a { color:#0369a1; text-decoration:underline; }
  .omni-md-table { font-size:12px; margin:0 0 12px; }
  .omni-md-table th { background:#f1f5f9; font-weight:600; }
  .omni-md-table th, .omni-md-table td { border:1px solid #cbd5e1; padding:6px 10px; text-align:left; vertical-align:top; }
  .omni-txt { white-space:pre-wrap; word-break:break-word; font-size:13px; line-height:1.55; min-height:1.55em; }
`;

/**
 * Markdown → danh sách khối cho htmlPdfRenderer. Danh sách và khối code được
 * tách từng mục / từng dòng để có thể ngắt trang giữa chừng; bảng ngắt theo hàng.
 */
export function markdownToRenderBlocks(markdown) {
  const wrap = (inner) => ({ html: `<div class="omni-md">${inner}</div>` });
  const out = [];
  for (const block of parseMarkdownBlocks(markdown)) {
    if (block.type === 'list') {
      const tag = block.ordered ? 'ol' : 'ul';
      block.items.forEach((item, idx) => {
        const start = block.ordered ? ` start="${block.start + idx}"` : '';
        out.push(wrap(`<${tag}${start}><li>${renderInline(item)}</li></${tag}>`));
      });
    } else if (block.type === 'code') {
      const codeLines = block.lines.length ? block.lines : [''];
      codeLines.forEach((line) => out.push(wrap(`<pre>${escapeHtml(line) || ' '}</pre>`)));
    } else if (block.type === 'table') {
      out.push({
        table: {
          className: 'omni-md-table',
          headerHtml: `<tr>${block.header.map((c) => `<th>${renderInline(c)}</th>`).join('')}</tr>`,
          rowsHtml: block.rows.map((r) => `<tr>${block.header.map((_, idx) => `<td>${renderInline(r[idx] ?? '')}</td>`).join('')}</tr>`),
        },
      });
    } else {
      out.push(wrap(blockToHtml(block)));
    }
  }
  return out;
}

/** Văn bản thuần → mỗi dòng một khối (giữ khoảng trắng, dòng trống). */
export function textToRenderBlocks(text) {
  return String(text ?? '').replace(/\r\n?/g, '\n').split('\n')
    .map((line) => ({ html: `<div class="omni-txt">${escapeHtml(line.replace(/\t/g, '    '))}</div>` }));
}

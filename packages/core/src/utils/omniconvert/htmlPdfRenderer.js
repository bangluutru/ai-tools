/**
 * Dàn trang khối HTML thành PDF A4 bằng html2canvas + jsPDF.
 *
 * Vì sao không vẽ chữ trực tiếp bằng jsPDF: font chuẩn của jsPDF (helvetica…)
 * chỉ có bảng mã WinAnsi, tiếng Việt và tiếng Nhật ra ký tự rác, còn repo không
 * có sẵn font TTF phủ đủ CJK. Trình duyệt thì tự chọn font hệ thống cho từng
 * glyph, nên dựng HTML rồi chụp lại là cách duy nhất ra đúng chữ ở cả vi/en/ja.
 * Đổi lại, chữ trong PDF là ảnh (không bôi đen / tìm kiếm được).
 *
 * Dàn trang theo từng khối: khối nào làm tràn trang thì sang trang mới; bảng
 * được cắt theo hàng và lặp lại hàng tiêu đề ở mỗi trang. Một khối đơn lẻ cao
 * hơn cả trang (đoạn văn cực dài) mới phải cắt ảnh, có chặn lát mỏng.
 */

/** Khổ A4 theo pt (jsPDF) và theo px CSS ở 96 dpi. */
export const A4_PT = Object.freeze({ portrait: [595.28, 841.89], landscape: [841.89, 595.28] });
export const A4_PX = Object.freeze({ portrait: [794, 1123], landscape: [1123, 794] });

/** Phần dư mỏng hơn ngần này (px canvas) thì bỏ, không dựng thêm trang trắng. */
export const MIN_SLICE_PX = 2;

export const DOCUMENT_FONT_STACK = '"Noto Sans", "Noto Sans JP", "Hiragino Sans", "Hiragino Kaku Gothic ProN", "Yu Gothic", Meiryo, "Segoe UI", Roboto, Arial, sans-serif';

/**
 * Chia phần cao `totalPx` thành các lát nguyên pixel, mỗi lát ≤ `sliceLimitPx`,
 * bỏ phần đuôi mỏng hơn MIN_SLICE_PX. Hàm thuần để kiểm thử được.
 */
export function computeSlices(totalPx, sliceLimitPx) {
  const total = Math.round(totalPx);
  const limit = Math.max(1, Math.floor(sliceLimitPx));
  const slices = [];
  for (let y = 0; y < total; y += limit) {
    const height = Math.min(limit, total - y);
    if (height < MIN_SLICE_PX && slices.length > 0) break;
    slices.push({ y, height });
  }
  return slices;
}

function waitFrame() {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

/**
 * @param {Array<{html: string} | {table: {headerHtml?: string, rowsHtml: string[], className?: string}}>} blocks
 * @param {{ orientation?: 'portrait'|'landscape', css?: string, marginPx?: number, scale?: number, quality?: number,
 *           onProgress?: (fraction:number)=>void, maxPages?: number }} options
 * @returns {Promise<Blob>}
 */
export async function renderBlocksToPdf(blocks, options = {}) {
  const {
    orientation = 'portrait',
    css = '',
    marginPx = 48,
    scale = 2,
    quality = 0.85,
    onProgress,
    maxPages = 500,
  } = options;
  const [{ jsPDF }, { default: html2canvas }] = await Promise.all([import('jspdf'), import('html2canvas')]);

  const [pageWpx, pageHpx] = A4_PX[orientation] || A4_PX.portrait;
  const [pageWpt, pageHpt] = A4_PT[orientation] || A4_PT.portrait;
  const contentMaxH = pageHpx - marginPx * 2;

  const pdf = new jsPDF({ orientation, unit: 'pt', format: 'a4' });
  let pdfPageCount = 0;

  const staging = document.createElement('div');
  staging.setAttribute('aria-hidden', 'true');
  Object.assign(staging.style, {
    position: 'fixed', top: '0', left: '-100000px', zIndex: '-1', pointerEvents: 'none',
    width: `${pageWpx}px`, background: '#ffffff',
  });
  const styleEl = document.createElement('style');
  styleEl.textContent = `
    .omni-page { width:${pageWpx}px; box-sizing:border-box; padding:${marginPx}px; background:#fff; color:#1e293b;
      font-family:${DOCUMENT_FONT_STACK}; font-size:14px; line-height:1.6; }
    .omni-page * { box-sizing:border-box; }
    .omni-page table { width:100%; border-collapse:collapse; }
    ${css}
  `;
  staging.appendChild(styleEl);
  document.body.appendChild(staging);

  const addCanvasToPdf = (canvas) => {
    // Tỷ lệ px canvas cho một trang PDF đầy đủ.
    const pxPerPage = canvas.width * (pageHpt / pageWpt);
    const slices = canvas.height <= pxPerPage + MIN_SLICE_PX
      ? [{ y: 0, height: canvas.height }]
      : computeSlices(canvas.height, pxPerPage);
    for (const slice of slices) {
      if (pdfPageCount >= maxPages) {
        throw new Error(`Tài liệu vượt quá ${maxPages} trang PDF, hãy chia nhỏ tệp nguồn.`);
      }
      let source = canvas;
      if (slices.length > 1) {
        source = document.createElement('canvas');
        source.width = canvas.width;
        source.height = Math.max(1, Math.round(slice.height));
        source.getContext('2d').drawImage(canvas, 0, slice.y, canvas.width, source.height, 0, 0, canvas.width, source.height);
      }
      if (pdfPageCount > 0) pdf.addPage('a4', orientation);
      const renderH = Math.min(pageHpt, (source.height / source.width) * pageWpt);
      pdf.addImage(source.toDataURL('image/jpeg', quality), 'JPEG', 0, 0, pageWpt, renderH, undefined, 'FAST');
      pdfPageCount += 1;
      if (source !== canvas) { source.width = 0; source.height = 0; }
    }
  };

  let page = null;
  let content = null;
  let currentTable = null;
  let hasContent = false;

  const newPage = () => {
    page = document.createElement('div');
    page.className = 'omni-page';
    content = document.createElement('div');
    page.appendChild(content);
    staging.appendChild(page);
    currentTable = null;
    hasContent = false;
  };

  const flushPage = async () => {
    if (!page) return;
    if (hasContent) {
      if (document.fonts?.ready) await document.fonts.ready;
      await waitFrame();
      const canvas = await html2canvas(page, {
        scale, backgroundColor: '#ffffff', logging: false, useCORS: true,
        width: pageWpx, windowWidth: pageWpx,
      });
      if (!canvas.width || !canvas.height) throw new Error('Không dựng được trang PDF (ảnh rỗng).');
      addCanvasToPdf(canvas);
      canvas.width = 0;
      canvas.height = 0;
    }
    page.remove();
    page = null;
  };

  const overflows = () => content.scrollHeight > contentMaxH;

  try {
    newPage();
    for (let i = 0; i < blocks.length; i += 1) {
      const block = blocks[i];
      if (block.breakBefore && hasContent) {
        await flushPage();
        newPage();
      }
      if (block.table) {
        const { headerHtml = '', rowsHtml = [], className = '' } = block.table;
        const startTable = () => {
          const table = document.createElement('table');
          if (className) table.className = className;
          if (headerHtml) {
            const thead = document.createElement('thead');
            thead.innerHTML = headerHtml;
            table.appendChild(thead);
          }
          const tbody = document.createElement('tbody');
          table.appendChild(tbody);
          content.appendChild(table);
          currentTable = tbody;
          hasContent = true;
        };
        startTable();
        for (const rowHtml of rowsHtml) {
          const holder = document.createElement('tbody');
          holder.innerHTML = rowHtml;
          const row = holder.firstElementChild;
          if (!row) continue;
          currentTable.appendChild(row);
          if (!overflows()) continue;
          const tableIsAlone = content.children.length === 1;
          if (currentTable.children.length > 1 || !tableIsAlone) {
            // Hàng đầu tiên không vừa phần còn lại của trang: bỏ cả bảng rỗng
            // (chỉ còn tiêu đề) để tiêu đề không nằm lẻ loi cuối trang.
            if (currentTable.children.length === 1) currentTable.parentElement.remove();
            else row.remove();
            await flushPage();
            newPage();
            startTable();
            currentTable.appendChild(row);
          }
        }
        currentTable = null;
      } else {
        const el = document.createElement('div');
        el.innerHTML = block.html;
        content.appendChild(el);
        hasContent = true;
        if (overflows() && content.children.length > 1) {
          el.remove();
          await flushPage();
          newPage();
          content.appendChild(el);
          hasContent = true;
        }
      }
      if (onProgress && i % 20 === 0) onProgress(i / Math.max(1, blocks.length));
    }
    await flushPage();
    if (pdfPageCount === 0) {
      // Tài liệu rỗng: vẫn trả PDF một trang trắng hợp lệ.
      pdfPageCount = 1;
    }
    if (onProgress) onProgress(1);
    return pdf.output('blob');
  } finally {
    staging.remove();
  }
}

export function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

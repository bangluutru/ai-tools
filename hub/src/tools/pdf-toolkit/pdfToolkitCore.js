/**
 * Logic thuần của PDF Toolkit (không phụ thuộc React/DOM) để kiểm thử bằng node.
 * Nhận module pdf-lib qua tham số nên không kéo pdf-lib vào chunk ban đầu.
 */

/** Khổ A4 theo pt. */
export const A4_SIZE = Object.freeze({ width: 595.28, height: 841.89 });

/** Góc xoay luôn về 0/90/180/270 (kể cả số âm hoặc ≥ 360 từ PDF gốc). */
export function normalizeRotation(angle) {
  const n = Math.round(Number(angle) / 90) * 90;
  return ((n % 360) + 360) % 360;
}

/**
 * Phân tích chuỗi dải trang kiểu "1-3, 5, 8-" (đánh số từ 1).
 * - "8-" nghĩa là từ trang 8 đến hết.
 * - Không âm thầm bỏ qua lỗi: mọi mục sai đều trả về `errors`.
 *
 * @returns {{ ranges: number[][], errors: string[] }} ranges: mỗi dải là mảng số trang (1-based)
 */
export function parsePageRanges(input, totalPages) {
  const ranges = [];
  const errors = [];
  const text = String(input ?? '').trim();
  if (!text) return { ranges, errors: ['empty'] };

  for (const rawPart of text.split(/[,;，、]/)) {
    const part = rawPart.trim();
    if (!part) continue;
    const m = part.match(/^(\d+)\s*(?:[-–~]\s*(\d*))?$/);
    if (!m) {
      errors.push(`"${part}"`);
      continue;
    }
    const start = Number(m[1]);
    const isRange = part.includes('-') || part.includes('–') || part.includes('~');
    const end = isRange ? (m[2] ? Number(m[2]) : totalPages) : start;
    if (start < 1 || end < 1 || start > totalPages || end > totalPages) {
      errors.push(`"${part}" (1–${totalPages})`);
      continue;
    }
    if (end < start) {
      errors.push(`"${part}"`);
      continue;
    }
    const pages = [];
    for (let p = start; p <= end; p += 1) pages.push(p);
    ranges.push(pages);
  }
  if (ranges.length === 0 && errors.length === 0) errors.push('empty');
  return { ranges, errors };
}

/**
 * Tọa độ đặt số trang ở giữa mép dưới *theo hướng hiển thị* của trang
 * (trang có /Rotate thì mép dưới hiển thị là một cạnh khác của MediaBox).
 */
export function pageNumberPlacement({ x0 = 0, y0 = 0, width, height }, rotation, textWidth, margin = 18) {
  switch (normalizeRotation(rotation)) {
    case 90:
      return { x: x0 + width - margin, y: y0 + height / 2 - textWidth / 2, rotate: 90 };
    case 180:
      return { x: x0 + width / 2 + textWidth / 2, y: y0 + height - margin, rotate: 180 };
    case 270:
      return { x: x0 + margin, y: y0 + height / 2 + textWidth / 2, rotate: 270 };
    default:
      return { x: x0 + width / 2 - textWidth / 2, y: y0 + margin, rotate: 0 };
  }
}

/**
 * Vị trí vẽ một trang nhúng (PDFEmbeddedPage) lên trang A4 sao cho hiển thị
 * giống trang gốc đã xoay `rotation` độ theo chiều kim đồng hồ, co giãn vừa khổ
 * và căn giữa. Trả về cả khổ A4 dọc/ngang phù hợp.
 */
export function fitToA4Placement(srcWidth, srcHeight, rotation) {
  const r = normalizeRotation(rotation);
  const quarter = r === 90 || r === 270;
  const visW = quarter ? srcHeight : srcWidth;
  const visH = quarter ? srcWidth : srcHeight;
  const landscape = visW > visH;
  const pageW = landscape ? A4_SIZE.height : A4_SIZE.width;
  const pageH = landscape ? A4_SIZE.width : A4_SIZE.height;
  const scale = Math.min(pageW / visW, pageH / visH);
  const offX = (pageW - visW * scale) / 2;
  const offY = (pageH - visH * scale) / 2;
  const ws = srcWidth * scale;
  const hs = srcHeight * scale;
  // drawPage xoay ngược chiều kim đồng hồ quanh (x, y) → xoay -r rồi bù tịnh tiến.
  const anchor = {
    0: { x: offX, y: offY },
    90: { x: offX, y: offY + ws },
    180: { x: offX + ws, y: offY + hs },
    270: { x: offX + hs, y: offY },
  }[r];
  return { pageSize: [pageW, pageH], x: anchor.x, y: anchor.y, scale, rotate: -r };
}

/**
 * Dựng một PDF từ danh sách trang đã chọn.
 *
 * @param {object} PDFLib      module pdf-lib ({ PDFDocument, degrees, StandardFonts, rgb })
 * @param {Array<{ key: string, bytes: ArrayBuffer|Uint8Array }>} sources
 * @param {Array<{ sourceKey: string, pageIndex: number, rotation?: number }>} pages  theo thứ tự xuất
 * @param {{ normalizeA4?: boolean, pageNumbering?: boolean, title?: string }} options
 * @returns {Promise<{ bytes: Uint8Array, pageCount: number }>}
 */
export async function buildPdf(PDFLib, sources, pages, options = {}) {
  const { PDFDocument, degrees, StandardFonts, rgb } = PDFLib;
  const { normalizeA4 = false, pageNumbering = false, title } = options;
  if (!pages.length) throw new Error('NO_PAGES');

  const outDoc = await PDFDocument.create();
  if (title) outDoc.setTitle(title);
  outDoc.setProducer('Toolio PDF Toolkit (pdf-lib)');

  const loaded = new Map();
  const getSource = async (key) => {
    if (!loaded.has(key)) {
      const src = sources.find((s) => s.key === key);
      if (!src) throw new Error(`Missing source ${key}`);
      loaded.set(key, await PDFDocument.load(src.bytes, { updateMetadata: false }));
    }
    return loaded.get(key);
  };

  // Gom trang liên tiếp cùng nguồn để copy/embed theo lô (chia sẻ font, ảnh).
  const groups = [];
  for (const page of pages) {
    const last = groups[groups.length - 1];
    if (last && last.sourceKey === page.sourceKey) last.items.push(page);
    else groups.push({ sourceKey: page.sourceKey, items: [page] });
  }

  for (const group of groups) {
    const srcDoc = await getSource(group.sourceKey);
    const indices = group.items.map((p) => p.pageIndex);
    if (normalizeA4) {
      const srcPages = indices.map((i) => srcDoc.getPage(i));
      const embedded = await outDoc.embedPages(srcPages);
      embedded.forEach((emb, idx) => {
        const item = group.items[idx];
        const totalRotation = normalizeRotation((srcPages[idx].getRotation().angle || 0) + (item.rotation || 0));
        const place = fitToA4Placement(emb.width, emb.height, totalRotation);
        const page = outDoc.addPage(place.pageSize);
        page.drawPage(emb, {
          x: place.x,
          y: place.y,
          xScale: place.scale,
          yScale: place.scale,
          rotate: degrees(place.rotate),
        });
      });
    } else {
      const copied = await outDoc.copyPages(srcDoc, indices);
      copied.forEach((page, idx) => {
        const item = group.items[idx];
        if (item.rotation) {
          page.setRotation(degrees(normalizeRotation((page.getRotation().angle || 0) + item.rotation)));
        }
        outDoc.addPage(page);
      });
    }
  }

  const pageCount = outDoc.getPageCount();
  if (pageNumbering) {
    // Chỉ chữ số và "/" nên Helvetica (WinAnsi) đủ, không cần nhúng font Unicode.
    const font = await outDoc.embedFont(StandardFonts.Helvetica);
    const size = 10;
    outDoc.getPages().forEach((page, idx) => {
      const label = `${idx + 1} / ${pageCount}`;
      const textWidth = font.widthOfTextAtSize(label, size);
      const box = page.getCropBox();
      const place = pageNumberPlacement(
        { x0: box.x, y0: box.y, width: box.width, height: box.height },
        page.getRotation().angle || 0,
        textWidth,
      );
      page.drawText(label, {
        x: place.x,
        y: place.y,
        size,
        font,
        color: rgb(0.2, 0.2, 0.2),
        rotate: degrees(place.rotate),
      });
    });
  }

  const bytes = await outDoc.save({ useObjectStreams: true, addDefaultPage: false });
  return { bytes, pageCount };
}

/** Tên tệp an toàn, luôn kết thúc bằng .pdf. */
export function ensurePdfName(name, fallback = 'document') {
  const cleaned = String(name || '').replace(/[\\/:*?"<>|]+/g, '_').trim() || fallback;
  return /\.pdf$/i.test(cleaned) ? cleaned : `${cleaned}.pdf`;
}

/** "1-3" / "5" cho tên tệp tách. */
export function rangeLabel(pages) {
  if (!pages.length) return '';
  return pages.length === 1 ? String(pages[0]) : `${pages[0]}-${pages[pages.length - 1]}`;
}

/** Phần trăm giảm dung lượng, làm tròn, không âm. */
export function savedPercent(originalSize, newSize) {
  if (!(originalSize > 0)) return 0;
  return Math.max(0, Math.round((1 - newSize / originalSize) * 100));
}

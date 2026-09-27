/**
 * Tải document PDF từ File, Blob hoặc ArrayBuffer.
 * Người gọi phải `destroy()` tài liệu khi dùng xong (xem `withPdfDocument`).
 */
export async function loadPdfDocument(fileOrBuffer) {
  if (!(fileOrBuffer instanceof Blob) && !(fileOrBuffer instanceof ArrayBuffer) && !ArrayBuffer.isView(fileOrBuffer)) {
    throw new Error('Dữ liệu PDF không hợp lệ');
  }
  // Nạp động: bộ nạp pdf.js chứa import `?url` của Vite, chỉ cần khi thật sự mở PDF.
  const { openPdfDocument } = await import('../pdfjs.js');
  return openPdfDocument(fileOrBuffer);
}

/** Mở PDF, chạy `fn(pdfDoc)` rồi luôn giải phóng worker/bộ nhớ của pdf.js. */
export async function withPdfDocument(fileOrBuffer, fn) {
  const pdfDoc = await loadPdfDocument(fileOrBuffer);
  try {
    return await fn(pdfDoc);
  } finally {
    const { destroyPdfDocument } = await import('../pdfjs.js');
    await destroyPdfDocument(pdfDoc);
  }
}

/** Trần số điểm ảnh cho một trang render: canvas lớn hơn làm tab trình duyệt sập. */
export const MAX_RENDER_PIXELS = 36_000_000;

/**
 * Render 1 trang PDF ra Canvas HTML5
 */
export async function renderPdfPageToCanvas(pdfDoc, pageNum, scale = 2.0) {
  const page = await pdfDoc.getPage(pageNum);
  let viewport = page.getViewport({ scale });
  const pixels = viewport.width * viewport.height;
  if (pixels > MAX_RENDER_PIXELS) {
    // Trang khổ lớn (bản vẽ A0…) ở scale 3 vượt giới hạn canvas → hạ scale.
    viewport = page.getViewport({ scale: scale * Math.sqrt(MAX_RENDER_PIXELS / pixels) });
  }

  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d', { alpha: false });
  canvas.width = Math.floor(viewport.width);
  canvas.height = Math.floor(viewport.height);

  // Background trắng
  context.fillStyle = '#ffffff';
  context.fillRect(0, 0, canvas.width, canvas.height);

  const renderContext = {
    canvasContext: context,
    viewport: viewport,
  };

  try {
    await page.render(renderContext).promise;
  } finally {
    page.cleanup();
  }
  return canvas;
}

/**
 * Trích xuất toàn bộ text và cấu trúc dòng từ PDF
 */
export async function extractPdfStructuredText(pdfDoc, onProgress) {
  const numPages = pdfDoc.numPages;
  const pagesData = [];

  for (let i = 1; i <= numPages; i++) {
    if (onProgress) onProgress(Math.round((i / numPages) * 50));
    const page = await pdfDoc.getPage(i);
    const textContent = await page.getTextContent();
    const viewport = page.getViewport({ scale: 1.0 });
    page.cleanup();

    const items = textContent.items.map(item => ({
      text: item.str,
      x: item.transform[4],
      y: viewport.height - item.transform[5],
      width: item.width,
      height: item.height,
      fontSize: Math.round(Math.hypot(item.transform[0], item.transform[1])),
      hasEOL: item.hasEOL
    }));

    items.sort((a, b) => {
      if (Math.abs(a.y - b.y) > 4) {
        return a.y - b.y;
      }
      return a.x - b.x;
    });

    const lines = [];
    let currentLine = [];
    let lastY = null;

    for (const item of items) {
      if (lastY === null || Math.abs(item.y - lastY) > 5) {
        if (currentLine.length > 0) {
          lines.push(currentLine);
        }
        currentLine = [item];
        lastY = item.y;
      } else {
        currentLine.push(item);
      }
    }
    if (currentLine.length > 0) {
      lines.push(currentLine);
    }

    pagesData.push({
      pageNumber: i,
      width: viewport.width,
      height: viewport.height,
      lines: lines.map(line => ({
        text: line.map(item => item.text).join(' ').trim(),
        maxFontSize: Math.max(...line.map(item => item.fontSize || 12)),
        items: line
      }))
    });
  }

  return pagesData;
}

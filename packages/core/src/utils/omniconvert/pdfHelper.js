import * as pdfjsLib from 'pdfjs-dist';

// Cấu hình Worker an toàn cho PDF.js
try {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version || '6.2.108'}/build/pdf.worker.min.mjs`;
} catch {
  console.warn('PDF.js worker initialization notice');
}

/**
 * Tải document PDF từ File hoặc ArrayBuffer
 */
export async function loadPdfDocument(fileOrBuffer) {
  let arrayBuffer;
  if (fileOrBuffer instanceof File || fileOrBuffer instanceof Blob) {
    arrayBuffer = await fileOrBuffer.arrayBuffer();
  } else if (fileOrBuffer instanceof ArrayBuffer) {
    arrayBuffer = fileOrBuffer;
  } else {
    throw new Error('Dữ liệu PDF không hợp lệ');
  }

  const loadingTask = pdfjsLib.getDocument({
    data: new Uint8Array(arrayBuffer),
    cMapUrl: 'https://unpkg.com/pdfjs-dist@6.2.108/cmaps/',
    cMapPacked: true,
  });

  return await loadingTask.promise;
}

/**
 * Render 1 trang PDF ra Canvas HTML5
 */
export async function renderPdfPageToCanvas(pdfDoc, pageNum, scale = 2.0) {
  const page = await pdfDoc.getPage(pageNum);
  const viewport = page.getViewport({ scale });

  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d', { alpha: false });
  canvas.width = viewport.width;
  canvas.height = viewport.height;

  // Background trắng
  context.fillStyle = '#ffffff';
  context.fillRect(0, 0, canvas.width, canvas.height);

  const renderContext = {
    canvasContext: context,
    viewport: viewport,
  };

  await page.render(renderContext).promise;
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

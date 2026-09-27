import { PDFDocument } from 'pdf-lib';
import JSZip from 'jszip';
import { withPdfDocument, renderPdfPageToCanvas } from './pdfHelper.js';

/** Định dạng có thể mang kênh alpha: nhúng PNG để giữ trong suốt thay vì JPEG nền đen. */
const ALPHA_CAPABLE_TYPES = new Set(['image/png', 'image/webp', 'image/svg+xml', 'image/gif', 'image/avif']);
const ALPHA_CAPABLE_EXTS = new Set(['png', 'webp', 'svg', 'gif', 'avif']);

/** Trần điểm ảnh khi raster hóa (ảnh nguồn và trang PDF→ảnh). */
export const MAX_IMAGE_PIXELS = 40_000_000;

/** SVG không khai báo width/height có naturalWidth = 0 → dùng kích thước mặc định. */
const FALLBACK_SVG_SIZE = 1024;

function fileExt(file) {
  const name = file?.name || '';
  const dot = name.lastIndexOf('.');
  return dot >= 0 ? name.slice(dot + 1).toLowerCase() : '';
}

export function mayHaveAlpha(file) {
  return ALPHA_CAPABLE_TYPES.has(file?.type) || ALPHA_CAPABLE_EXTS.has(fileExt(file));
}

/** Kích thước raster an toàn cho một ảnh (xử lý SVG không có kích thước và ảnh quá lớn). */
export function resolveRasterSize(naturalWidth, naturalHeight, maxPixels = MAX_IMAGE_PIXELS) {
  let width = naturalWidth > 0 ? naturalWidth : FALLBACK_SVG_SIZE;
  let height = naturalHeight > 0 ? naturalHeight : FALLBACK_SVG_SIZE;
  if (!(naturalWidth > 0) && naturalHeight > 0) width = naturalHeight;
  if (!(naturalHeight > 0) && naturalWidth > 0) height = naturalWidth;
  const pixels = width * height;
  if (pixels > maxPixels) {
    const ratio = Math.sqrt(maxPixels / pixels);
    width = Math.max(1, Math.floor(width * ratio));
    height = Math.max(1, Math.floor(height * ratio));
  }
  return { width: Math.round(width), height: Math.round(height) };
}

function canvasToBlob(canvas, type, quality) {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('Không xuất được ảnh từ canvas (ảnh quá lớn?).'))), type, quality);
  });
}

export async function convertImagesToPdf(files, options = {}, onProgress) {
  const {
    pageSize = 'a4',
    orientation = 'auto',
    margin = 20,
    quality = 0.92
  } = options;

  const pdfDoc = await PDFDocument.create();
  const fileList = Array.isArray(files) ? files : [files];
  const total = fileList.length;

  for (let i = 0; i < total; i++) {
    const file = fileList[i];
    if (onProgress) onProgress(Math.round(((i + 0.2) / total) * 90));

    const imgElement = await loadImageElement(file);
    const { width: rasterW, height: rasterH } = resolveRasterSize(
      imgElement.naturalWidth || imgElement.width,
      imgElement.naturalHeight || imgElement.height,
    );
    const canvas = document.createElement('canvas');
    canvas.width = rasterW;
    canvas.height = rasterH;
    const ctx = canvas.getContext('2d');
    const keepAlpha = mayHaveAlpha(file);
    if (!keepAlpha) {
      // JPEG không có alpha: tô nền trắng để vùng trống không thành đen.
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, rasterW, rasterH);
    }
    ctx.drawImage(imgElement, 0, 0, rasterW, rasterH);

    let embeddedImage;
    if (keepAlpha) {
      const pngBlob = await canvasToBlob(canvas, 'image/png');
      embeddedImage = await pdfDoc.embedPng(await pngBlob.arrayBuffer());
    } else {
      const jpegBlob = await canvasToBlob(canvas, 'image/jpeg', quality);
      embeddedImage = await pdfDoc.embedJpg(await jpegBlob.arrayBuffer());
    }

    const imgWidth = embeddedImage.width;
    const imgHeight = embeddedImage.height;

    let pageWidth, pageHeight;
    if (pageSize === 'fit') {
      pageWidth = imgWidth + margin * 2;
      pageHeight = imgHeight + margin * 2;
    } else if (pageSize === 'letter') {
      const isLandscape = orientation === 'landscape' || (orientation === 'auto' && imgWidth > imgHeight);
      pageWidth = isLandscape ? 792 : 612;
      pageHeight = isLandscape ? 612 : 792;
    } else {
      const isLandscape = orientation === 'landscape' || (orientation === 'auto' && imgWidth > imgHeight);
      pageWidth = isLandscape ? 841.89 : 595.28;
      pageHeight = isLandscape ? 595.28 : 841.89;
    }

    const page = pdfDoc.addPage([pageWidth, pageHeight]);

    const printableWidth = pageWidth - margin * 2;
    const printableHeight = pageHeight - margin * 2;
    const scale = Math.min(printableWidth / imgWidth, printableHeight / imgHeight);

    const renderWidth = imgWidth * scale;
    const renderHeight = imgHeight * scale;
    const x = margin + (printableWidth - renderWidth) / 2;
    const y = margin + (printableHeight - renderHeight) / 2;

    page.drawImage(embeddedImage, {
      x,
      y,
      width: renderWidth,
      height: renderHeight,
    });
  }

  if (onProgress) onProgress(95);
  const pdfBytes = await pdfDoc.save();
  if (onProgress) onProgress(100);

  return new Blob([pdfBytes], { type: 'application/pdf' });
}

export async function convertPdfToImages(file, targetFormat = 'png', options = {}, onProgress) {
  const { scale = 2.0, quality = 0.92 } = options;

  return withPdfDocument(file, async (pdfDoc) => {
  const numPages = pdfDoc.numPages;
  const mimeType = targetFormat === 'jpg' || targetFormat === 'jpeg'
    ? 'image/jpeg'
    : targetFormat === 'webp'
      ? 'image/webp'
      : 'image/png';

  const baseName = file.name ? file.name.replace(/\.[^/.]+$/, "") : 'document';

  if (numPages === 1) {
    if (onProgress) onProgress(50);
    const canvas = await renderPdfPageToCanvas(pdfDoc, 1, scale);
    const blob = await canvasToBlob(canvas, mimeType, quality);
    if (onProgress) onProgress(100);
    return {
      blob,
      filename: `${baseName}.${targetFormat}`,
      mimeType,
      isZip: false,
      pageCount: 1
    };
  }

  const zip = new JSZip();
  const folder = zip.folder(`${baseName}_images`);
  const padWidth = Math.max(2, String(numPages).length);

  for (let i = 1; i <= numPages; i++) {
    if (onProgress) onProgress(Math.round((i / numPages) * 90));
    const canvas = await renderPdfPageToCanvas(pdfDoc, i, scale);
    const pageBlob = await canvasToBlob(canvas, mimeType, quality);
    canvas.width = 0;
    canvas.height = 0;
    const pageNumStr = String(i).padStart(padWidth, '0');
    folder.file(`page_${pageNumStr}.${targetFormat}`, await pageBlob.arrayBuffer());
  }

  if (onProgress) onProgress(95);
  const zipBlob = await zip.generateAsync({ type: 'blob' });
  if (onProgress) onProgress(100);

  return {
    blob: zipBlob,
    filename: `${baseName}_images_${targetFormat}.zip`,
    mimeType: 'application/zip',
    isZip: true,
    pageCount: numPages
  };
  });
}

export async function convertImageToImage(file, targetFormat = 'png', options = {}, onProgress) {
  const { quality = 0.92 } = options;
  if (onProgress) onProgress(30);

  const img = await loadImageElement(file);
  const { width: rasterW, height: rasterH } = resolveRasterSize(img.naturalWidth || img.width, img.naturalHeight || img.height);
  const canvas = document.createElement('canvas');
  canvas.width = rasterW;
  canvas.height = rasterH;
  const ctx = canvas.getContext('2d');

  if (targetFormat === 'jpg' || targetFormat === 'jpeg') {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  ctx.drawImage(img, 0, 0, rasterW, rasterH);

  if (onProgress) onProgress(70);

  const mimeType = targetFormat === 'jpg' || targetFormat === 'jpeg' 
    ? 'image/jpeg' 
    : targetFormat === 'webp' 
      ? 'image/webp' 
      : 'image/png';

  const blob = await canvasToBlob(canvas, mimeType, quality);
  const baseName = file.name ? file.name.replace(/\.[^/.]+$/, "") : 'image';

  if (onProgress) onProgress(100);

  return {
    blob,
    filename: `${baseName}.${targetFormat}`,
    mimeType,
    isZip: false
  };
}

function loadImageElement(fileOrBlob) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(fileOrBlob);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Không thể đọc tệp hình ảnh.'));
    };
    img.src = url;
  });
}

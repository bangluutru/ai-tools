import { PDFDocument } from 'pdf-lib';
import JSZip from 'jszip';
import { loadPdfDocument, renderPdfPageToCanvas } from './pdfHelper.js';

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
    const canvas = document.createElement('canvas');
    canvas.width = imgElement.naturalWidth || imgElement.width;
    canvas.height = imgElement.naturalHeight || imgElement.height;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(imgElement, 0, 0);

    const isPng = file.type === 'image/png';
    let embeddedImage;

    if (isPng) {
      const pngBlob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
      const pngBytes = await pngBlob.arrayBuffer();
      embeddedImage = await pdfDoc.embedPng(pngBytes);
    } else {
      const jpegBlob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', quality));
      const jpegBytes = await jpegBlob.arrayBuffer();
      embeddedImage = await pdfDoc.embedJpg(jpegBytes);
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

  const pdfDoc = await loadPdfDocument(file);
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
    const blob = await new Promise(resolve => canvas.toBlob(resolve, mimeType, quality));
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

  for (let i = 1; i <= numPages; i++) {
    if (onProgress) onProgress(Math.round((i / numPages) * 90));
    const canvas = await renderPdfPageToCanvas(pdfDoc, i, scale);
    const pageBlob = await new Promise(resolve => canvas.toBlob(resolve, mimeType, quality));
    const pageBuffer = await pageBlob.arrayBuffer();
    const pageNumStr = String(i).padStart(2, '0');
    folder.file(`page_${pageNumStr}.${targetFormat}`, pageBuffer);
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
}

export async function convertImageToImage(file, targetFormat = 'png', options = {}, onProgress) {
  const { quality = 0.92 } = options;
  if (onProgress) onProgress(30);

  const img = await loadImageElement(file);
  const canvas = document.createElement('canvas');
  canvas.width = img.naturalWidth || img.width;
  canvas.height = img.naturalHeight || img.height;
  const ctx = canvas.getContext('2d');

  if (targetFormat === 'jpg' || targetFormat === 'jpeg') {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  ctx.drawImage(img, 0, 0);

  if (onProgress) onProgress(70);

  const mimeType = targetFormat === 'jpg' || targetFormat === 'jpeg' 
    ? 'image/jpeg' 
    : targetFormat === 'webp' 
      ? 'image/webp' 
      : 'image/png';

  const blob = await new Promise(resolve => canvas.toBlob(resolve, mimeType, quality));
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

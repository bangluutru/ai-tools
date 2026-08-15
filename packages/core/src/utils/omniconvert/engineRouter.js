import { getFileExtension } from './formats.js';
import { convertImagesToPdf, convertPdfToImages, convertImageToImage } from './imagePdfConverter.js';
import { convertDocxToPdf, convertPdfToDocx, convertDocxToTxt, convertPdfToTxt } from './docxPdfConverter.js';
import { convertXlsxToPdf, convertPdfToXlsx, convertXlsxToCsv } from './xlsxPdfConverter.js';
import { convertPdfToPptx, convertPptxToPdf } from './pptxPdfConverter.js';

export async function executeConversion(file, targetFormat, options = {}, onProgress = () => {}) {
  const sourceExt = getFileExtension(file.name);
  const targetExt = (targetFormat || '').toLowerCase();

  if (!sourceExt) {
    throw new Error('Không thể nhận diện định dạng tệp tải lên (thiếu phần mở rộng file).');
  }

  if (sourceExt === targetExt) {
    throw new Error(`Định dạng nguồn và đích đều là .${targetExt}. Vui lòng chọn một định dạng khác để chuyển đổi.`);
  }

  // 1. DOCX
  if (sourceExt === 'docx') {
    if (targetExt === 'pdf') return await convertDocxToPdf(file, options, onProgress);
    if (targetExt === 'txt') return await convertDocxToTxt(file, options, onProgress);
  }

  // 2. XLSX / CSV
  if (sourceExt === 'xlsx' || sourceExt === 'xls') {
    if (targetExt === 'pdf') return await convertXlsxToPdf(file, options, onProgress);
    if (targetExt === 'csv') return await convertXlsxToCsv(file, options, onProgress);
  }
  if (sourceExt === 'csv') {
    if (targetExt === 'pdf') return await convertXlsxToPdf(file, options, onProgress);
  }

  // 3. PPTX
  if (sourceExt === 'pptx') {
    if (targetExt === 'pdf') return await convertPptxToPdf(file, options, onProgress);
  }

  // 4. PDF
  if (sourceExt === 'pdf') {
    if (targetExt === 'docx') return await convertPdfToDocx(file, options, onProgress);
    if (targetExt === 'xlsx') return await convertPdfToXlsx(file, options, onProgress);
    if (targetExt === 'pptx') return await convertPdfToPptx(file, options, onProgress);
    if (['png', 'jpg', 'jpeg', 'webp'].includes(targetExt)) {
      return await convertPdfToImages(file, targetExt, options, onProgress);
    }
    if (targetExt === 'txt') return await convertPdfToTxt(file, options, onProgress);
  }

  // 5. Images
  const isSourceImage = ['png', 'jpg', 'jpeg', 'webp', 'svg', 'bmp'].includes(sourceExt);
  if (isSourceImage) {
    if (targetExt === 'pdf') {
      const blob = await convertImagesToPdf([file], options, onProgress);
      const baseName = file.name.replace(/\.[^/.]+$/, "");
      return {
        blob,
        filename: `${baseName}.pdf`,
        mimeType: 'application/pdf',
        isZip: false
      };
    }
    if (['png', 'jpg', 'jpeg', 'webp'].includes(targetExt)) {
      return await convertImageToImage(file, targetExt, options, onProgress);
    }
  }

  throw new Error(`Chưa hỗ trợ chuyển đổi trực tiếp từ .${sourceExt.toUpperCase()} sang .${targetExt.toUpperCase()}.`);
}

export async function mergeMultipleImagesToPdf(files, options = {}, onProgress = () => {}) {
  const blob = await convertImagesToPdf(files, options, onProgress);
  return {
    blob,
    filename: `merged_images_${Date.now()}.pdf`,
    mimeType: 'application/pdf',
    isZip: false
  };
}

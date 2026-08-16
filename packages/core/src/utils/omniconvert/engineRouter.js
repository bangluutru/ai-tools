import { getFileExtension } from './formats.js';
/**
 * Bốn engine được nạp theo yêu cầu. Nếu import tĩnh, mở công cụ là kéo về cả
 * jspdf, mammoth, docx-preview, pptxgenjs và html2canvas (~1,4 MB) dù người
 * dùng chỉ định chuyển một tấm ảnh.
 */
const imageEngine = () => import('./imagePdfConverter.js');
const docxEngine = () => import('./docxPdfConverter.js');
const xlsxEngine = () => import('./xlsxPdfConverter.js');
const pptxEngine = () => import('./pptxPdfConverter.js');

const convertImagesToPdf = async (...args) => (await imageEngine()).convertImagesToPdf(...args);
const convertPdfToImages = async (...args) => (await imageEngine()).convertPdfToImages(...args);
const convertImageToImage = async (...args) => (await imageEngine()).convertImageToImage(...args);
const convertDocxToPdf = async (...args) => (await docxEngine()).convertDocxToPdf(...args);
const convertPdfToDocx = async (...args) => (await docxEngine()).convertPdfToDocx(...args);
const convertDocxToTxt = async (...args) => (await docxEngine()).convertDocxToTxt(...args);
const convertPdfToTxt = async (...args) => (await docxEngine()).convertPdfToTxt(...args);
const convertXlsxToPdf = async (...args) => (await xlsxEngine()).convertXlsxToPdf(...args);
const convertPdfToXlsx = async (...args) => (await xlsxEngine()).convertPdfToXlsx(...args);
const convertXlsxToCsv = async (...args) => (await xlsxEngine()).convertXlsxToCsv(...args);
const convertPdfToPptx = async (...args) => (await pptxEngine()).convertPdfToPptx(...args);
const convertPptxToPdf = async (...args) => (await pptxEngine()).convertPptxToPdf(...args);

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
  // 6. TXT
  if (sourceExt === 'txt') {
    if (targetExt === 'pdf') {
      if (onProgress) onProgress(20);
      const text = await file.text();
      // Chỉ nhánh TXT→PDF cần jspdf, nạp tại chỗ để nhánh khác khỏi gánh.
      const { jsPDF } = await import('jspdf');
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' });
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(11);
      const pageWidth = 595.28;
      const marginX = 40;
      const marginTop = 50;
      const marginBottom = 50;
      const usableWidth = pageWidth - marginX * 2;
      const lineHeight = 15;
      const pageHeight = 841.89;
      const maxY = pageHeight - marginBottom;

      const wrappedLines = pdf.splitTextToSize(text, usableWidth);
      let y = marginTop;
      for (let i = 0; i < wrappedLines.length; i++) {
        if (y + lineHeight > maxY) {
          pdf.addPage();
          y = marginTop;
        }
        pdf.text(wrappedLines[i], marginX, y);
        y += lineHeight;
      }
      if (onProgress) onProgress(90);
      const baseName = file.name ? file.name.replace(/\.[^/.]+$/, '') : 'text';
      if (onProgress) onProgress(100);
      return {
        blob: pdf.output('blob'),
        filename: `${baseName}.pdf`,
        mimeType: 'application/pdf',
        isZip: false
      };
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

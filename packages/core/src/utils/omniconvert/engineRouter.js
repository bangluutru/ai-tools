import { getFileExtension } from './formats.js';
/**
 * Các engine được nạp theo yêu cầu. Nếu import tĩnh, mở công cụ là kéo về cả
 * jspdf, mammoth, docx-preview và html2canvas (~1,4 MB) dù người
 * dùng chỉ định chuyển một tấm ảnh.
 */
const imageEngine = () => import('./imagePdfConverter.js');
const docxEngine = () => import('./docxPdfConverter.js');
const xlsxEngine = () => import('./xlsxPdfConverter.js');
const markdownEngine = () => import('./markdownConverter.js');
const pptxEngine = () => import('./pptxTextConverter.js');

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
const convertDocxToMd = async (...args) => (await markdownEngine()).convertDocxToMd(...args);
const convertPdfToMd = async (...args) => (await markdownEngine()).convertPdfToMd(...args);
const convertXlsxToMd = async (...args) => (await markdownEngine()).convertXlsxToMd(...args);
const convertCsvToMd = async (...args) => (await markdownEngine()).convertCsvToMd(...args);
const convertTxtToMd = async (...args) => (await markdownEngine()).convertTxtToMd(...args);
const convertMdToPdf = async (...args) => (await markdownEngine()).convertMdToPdf(...args);
const convertMdToDocx = async (...args) => (await markdownEngine()).convertMdToDocx(...args);
const convertMdToTxt = async (...args) => (await markdownEngine()).convertMdToTxt(...args);
const convertMdToHtml = async (...args) => (await markdownEngine()).convertMdToHtml(...args);
const convertPptxToTxt = async (...args) => (await pptxEngine()).convertPptxToTxt(...args);
const convertPptxToMd = async (...args) => (await pptxEngine()).convertPptxToMd(...args);

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
    if (targetExt === 'md') return await convertDocxToMd(file, options, onProgress);
  }

  // 1b. PPTX — chỉ trích xuất chữ của các slide
  if (sourceExt === 'pptx') {
    if (targetExt === 'txt') return await convertPptxToTxt(file, options, onProgress);
    if (targetExt === 'md') return await convertPptxToMd(file, options, onProgress);
  }

  // 2. XLSX / CSV
  if (sourceExt === 'xlsx' || sourceExt === 'xls') {
    if (targetExt === 'pdf') return await convertXlsxToPdf(file, options, onProgress);
    if (targetExt === 'csv') return await convertXlsxToCsv(file, options, onProgress);
    if (targetExt === 'md') return await convertXlsxToMd(file, options, onProgress);
  }
  if (sourceExt === 'csv') {
    if (targetExt === 'pdf') return await convertXlsxToPdf(file, options, onProgress);
    if (targetExt === 'md') return await convertCsvToMd(file, options, onProgress);
    if (targetExt === 'xlsx') {
      if (onProgress) onProgress(30);
      const arrayBuffer = await file.arrayBuffer();
      const XLSX = await import('xlsx');
      const workbook = XLSX.read(arrayBuffer, { type: 'array' });
      if (onProgress) onProgress(70);
      const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([excelBuffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });
      const baseName = file.name ? file.name.replace(/\.[^/.]+$/, '') : 'data';
      if (onProgress) onProgress(100);
      return {
        blob,
        filename: `${baseName}.xlsx`,
        mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        isZip: false
      };
    }
  }

  // 3. PDF
  if (sourceExt === 'pdf') {
    if (targetExt === 'docx') return await convertPdfToDocx(file, options, onProgress);
    if (targetExt === 'xlsx') return await convertPdfToXlsx(file, options, onProgress);
    if (targetExt === 'md') return await convertPdfToMd(file, options, onProgress);
    if (['png', 'jpg', 'jpeg', 'webp'].includes(targetExt)) {
      return await convertPdfToImages(file, targetExt, options, onProgress);
    }
    if (targetExt === 'txt') return await convertPdfToTxt(file, options, onProgress);
  }

  // 4. Images
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

  // 5. TXT
  if (sourceExt === 'txt') {
    if (targetExt === 'md') return await convertTxtToMd(file, options, onProgress);
    if (targetExt === 'pdf') {
      if (onProgress) onProgress(20);
      const text = await file.text();
      // Dựng HTML rồi chụp theo trang: helvetica của jsPDF không có glyph
      // tiếng Việt/Nhật (ra ký tự rác).
      const [{ renderBlocksToPdf }, { textToRenderBlocks, MARKDOWN_DOCUMENT_CSS }] = await Promise.all([
        import('./htmlPdfRenderer.js'),
        import('./markdownHtml.js'),
      ]);
      const blob = await renderBlocksToPdf(textToRenderBlocks(text), {
        css: MARKDOWN_DOCUMENT_CSS,
        onProgress: (f) => onProgress && onProgress(20 + Math.round(f * 75)),
      });
      const baseName = file.name ? file.name.replace(/\.[^/.]+$/, '') : 'text';
      if (onProgress) onProgress(100);
      return {
        blob,
        filename: `${baseName}.pdf`,
        mimeType: 'application/pdf',
        isZip: false
      };
    }
  }

  // 7. Markdown (.md)
  if (sourceExt === 'md') {
    if (targetExt === 'pdf') return await convertMdToPdf(file, options, onProgress);
    if (targetExt === 'docx') return await convertMdToDocx(file, options, onProgress);
    if (targetExt === 'txt') return await convertMdToTxt(file, options, onProgress);
    if (targetExt === 'html') return await convertMdToHtml(file, options, onProgress);
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

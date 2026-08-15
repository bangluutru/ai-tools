import PptxGenJS from 'pptxgenjs';
import JSZip from 'jszip';
import { jsPDF } from 'jspdf';
import { loadPdfDocument, renderPdfPageToCanvas } from './pdfHelper.js';

export async function convertPdfToPptx(file, _options = {}, onProgress) {
  if (onProgress) onProgress(15);
  const pdfDoc = await loadPdfDocument(file);
  const numPages = pdfDoc.numPages;

  const pptx = new PptxGenJS();
  pptx.layout = 'LAYOUT_16x9';
  pptx.title = file.name || 'Presentation';

  for (let i = 1; i <= numPages; i++) {
    if (onProgress) onProgress(15 + Math.round((i / numPages) * 70));

    const canvas = await renderPdfPageToCanvas(pdfDoc, i, 2.5);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.95);

    const slide = pptx.addSlide();
    slide.addImage({
      data: dataUrl,
      x: 0,
      y: 0,
      w: '100%',
      h: '100%',
      sizing: { type: 'contain', w: 10, h: 5.625 }
    });
  }

  if (onProgress) onProgress(90);
  const pptxBlob = await pptx.writeFile({ outputType: 'blob' });
  const baseName = file.name ? file.name.replace(/\.[^/.]+$/, "") : 'presentation';
  if (onProgress) onProgress(100);

  return {
    blob: pptxBlob,
    filename: `${baseName}.pptx`,
    mimeType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    isZip: false
  };
}

export async function convertPptxToPdf(file, _options = {}, onProgress) {
  if (onProgress) onProgress(20);
  const arrayBuffer = await file.arrayBuffer();
  const zip = await JSZip.loadAsync(arrayBuffer);

  const slideEntries = [];
  zip.folder('ppt/slides')?.forEach((relativePath, zipEntry) => {
    if (/slide\d+\.xml$/i.test(zipEntry.name)) {
      slideEntries.push(zipEntry);
    }
  });

  slideEntries.sort((a, b) => {
    const numA = parseInt(a.name.match(/\d+/)?.[0] || '0', 10);
    const numB = parseInt(b.name.match(/\d+/)?.[0] || '0', 10);
    return numA - numB;
  });

  if (onProgress) onProgress(45);

  const pdf = new jsPDF({
    orientation: 'landscape',
    unit: 'pt',
    format: [960, 540]
  });

  const totalSlides = Math.max(slideEntries.length, 1);

  for (let sIndex = 0; sIndex < totalSlides; sIndex++) {
    if (sIndex > 0) {
      pdf.addPage([960, 540], 'landscape');
    }

    pdf.setFillColor(248, 250, 252);
    pdf.rect(0, 0, 960, 540, 'F');

    pdf.setFillColor(14, 140, 233);
    pdf.rect(0, 0, 960, 8, 'F');

    pdf.setFontSize(22);
    pdf.setTextColor(15, 23, 42);
    pdf.text(`Slide ${sIndex + 1}`, 50, 60);

    if (slideEntries[sIndex]) {
      const slideXml = await slideEntries[sIndex].async('text');
      const textMatches = slideXml.match(/<a:t>([^<]+)<\/a:t>/g) || [];
      const slideTexts = textMatches.map(m => m.replace(/<\/?a:t>/g, '').trim()).filter(Boolean);

      pdf.setFontSize(14);
      pdf.setTextColor(51, 65, 85);
      let currentY = 110;

      for (const text of slideTexts.slice(0, 15)) {
        const splitText = pdf.splitTextToSize(text, 860);
        pdf.text(splitText, 50, currentY);
        currentY += splitText.length * 20 + 8;
        if (currentY > 480) break;
      }
    }

    pdf.setFontSize(10);
    pdf.setTextColor(148, 163, 184);
    pdf.text(`Slide ${sIndex + 1} / ${totalSlides}`, 860, 515);

    if (onProgress) onProgress(45 + Math.round(((sIndex + 1) / totalSlides) * 45));
  }

  const baseName = file.name ? file.name.replace(/\.[^/.]+$/, "") : 'presentation';
  const pdfBlob = pdf.output('blob');
  if (onProgress) onProgress(100);

  return {
    blob: pdfBlob,
    filename: `${baseName}.pdf`,
    mimeType: 'application/pdf',
    isZip: false
  };
}

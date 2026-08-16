import PptxGenJS from 'pptxgenjs';
import JSZip from 'jszip';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { loadPdfDocument, renderPdfPageToCanvas } from './pdfHelper.js';

export async function convertPdfToPptx(file, _options = {}, onProgress = () => {}) {
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
  const baseName = file.name ? file.name.replace(/\.[^/.]+$/, '') : 'presentation';
  if (onProgress) onProgress(100);

  return {
    blob: pptxBlob,
    filename: `${baseName}.pptx`,
    mimeType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    isZip: false
  };
}

export async function convertPptxToPdf(file, _options = {}, onProgress = () => {}) {
  if (onProgress) onProgress(20);
  const arrayBuffer = await file.arrayBuffer();
  const zip = await JSZip.loadAsync(arrayBuffer);

  const slideEntries = [];
  zip.folder('ppt/slides')?.forEach((_relativePath, zipEntry) => {
    if (/slide\d+\.xml$/i.test(zipEntry.name)) {
      slideEntries.push(zipEntry);
    }
  });

  slideEntries.sort((a, b) => {
    const numA = parseInt(a.name.match(/\d+/)?.[0] || '0', 10);
    const numB = parseInt(b.name.match(/\d+/)?.[0] || '0', 10);
    return numA - numB;
  });

  if (onProgress) onProgress(40);

  const pdf = new jsPDF({
    orientation: 'landscape',
    unit: 'pt',
    format: [960, 540]
  });

  const totalSlides = Math.max(slideEntries.length, 1);

  // Tạo staging container để render các slide với font chữ Unicode và layout đẹp mắt
  const staging = document.createElement('div');
  staging.style.position = 'fixed';
  staging.style.top = '0';
  staging.style.left = '-9999px';
  staging.style.zIndex = '-9999';
  staging.style.pointerEvents = 'none';
  staging.style.width = '960px';
  staging.style.height = '540px';
  staging.style.fontFamily = '"Plus Jakarta Sans", "Inter", "Roboto", "Arial", sans-serif';
  document.body.appendChild(staging);

  try {
    for (let sIndex = 0; sIndex < totalSlides; sIndex++) {
      staging.innerHTML = '';

      let slideTexts = [];
      if (slideEntries[sIndex]) {
        const slideXml = await slideEntries[sIndex].async('text');
        const textMatches = slideXml.match(/<a:t>([^<]+)<\/a:t>/g) || [];
        slideTexts = textMatches.map((m) => m.replace(/<\/?a:t>/g, '').trim()).filter(Boolean);
      }

      const title = slideTexts[0] || `Slide ${sIndex + 1}`;
      const bodyTexts = slideTexts.slice(1);

      const slideCard = document.createElement('div');
      slideCard.style.width = '960px';
      slideCard.style.height = '540px';
      slideCard.style.backgroundColor = '#ffffff';
      slideCard.style.padding = '48px 56px';
      slideCard.style.boxSizing = 'border-box';
      slideCard.style.display = 'flex';
      slideCard.style.flexDirection = 'column';
      slideCard.style.justifyContent = 'flex-start';
      slideCard.style.borderTop = '8px solid #0284c7';
      slideCard.style.position = 'relative';

      slideCard.innerHTML = `
        <div style="font-size: 28px; font-weight: 700; color: #0f172a; margin-bottom: 24px; line-height: 1.3;">
          ${escapeHtml(title)}
        </div>
        <div style="flex: 1; font-size: 16px; color: #334155; line-height: 1.7; overflow: hidden;">
          ${bodyTexts.map((t) => `<p style="margin-bottom: 12px;">• ${escapeHtml(t)}</p>`).join('')}
        </div>
        <div style="position: absolute; bottom: 24px; right: 56px; font-size: 12px; color: #94a3b8;">
          Slide ${sIndex + 1} / ${totalSlides}
        </div>
      `;

      staging.appendChild(slideCard);
      await new Promise((r) => setTimeout(r, 20));

      const canvas = await html2canvas(slideCard, {
        scale: 2.0,
        backgroundColor: '#ffffff',
        useCORS: true,
        logging: false
      });

      if (sIndex > 0) {
        pdf.addPage([960, 540], 'landscape');
      }

      const imgData = canvas.toDataURL('image/jpeg', 0.96);
      pdf.addImage(imgData, 'JPEG', 0, 0, 960, 540);

      if (onProgress) onProgress(40 + Math.round(((sIndex + 1) / totalSlides) * 50));
    }

    const baseName = file.name ? file.name.replace(/\.[^/.]+$/, '') : 'presentation';
    const pdfBlob = pdf.output('blob');
    if (onProgress) onProgress(100);

    return {
      blob: pdfBlob,
      filename: `${baseName}.pdf`,
      mimeType: 'application/pdf',
      isZip: false
    };
  } finally {
    if (staging.parentNode) {
      staging.parentNode.removeChild(staging);
    }
  }
}

function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

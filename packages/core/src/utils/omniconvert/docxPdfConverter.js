import mammoth from 'mammoth';
import { jsPDF } from 'jspdf';
import { Document, Packer, Paragraph, TextRun, HeadingLevel } from 'docx';
import { loadPdfDocument, extractPdfStructuredText } from './pdfHelper.js';

export async function convertDocxToPdf(file, _options = {}, onProgress) {
  if (onProgress) onProgress(20);
  const arrayBuffer = await file.arrayBuffer();

  const result = await mammoth.convertToHtml({ arrayBuffer });
  const htmlContent = result.value || '';
  if (onProgress) onProgress(45);

  const container = document.createElement('div');
  container.className = 'doc-sandbox';
  container.style.position = 'fixed';
  container.style.left = '-9999px';
  container.style.top = '0';
  container.style.width = '794px';
  container.style.background = '#ffffff';
  container.style.color = '#1e293b';
  container.style.padding = '40px';
  container.style.fontFamily = 'system-ui, -apple-system, sans-serif';
  container.innerHTML = htmlContent || '<p>Tài liệu trống</p>';
  document.body.appendChild(container);

  try {
    if (onProgress) onProgress(60);

    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'pt',
      format: 'a4'
    });

    await pdf.html(container, {
      callback: function () {},
      x: 30,
      y: 30,
      width: 535,
      windowWidth: 794,
      autoPaging: 'text'
    });

    if (onProgress) onProgress(90);
    const pdfBlob = pdf.output('blob');

    const baseName = file.name ? file.name.replace(/\.[^/.]+$/, "") : 'document';
    if (onProgress) onProgress(100);

    return {
      blob: pdfBlob,
      filename: `${baseName}.pdf`,
      mimeType: 'application/pdf',
      isZip: false
    };
  } finally {
    document.body.removeChild(container);
  }
}

export async function convertPdfToDocx(file, _options = {}, onProgress) {
  if (onProgress) onProgress(20);
  const pdfDoc = await loadPdfDocument(file);

  if (onProgress) onProgress(40);
  const pagesData = await extractPdfStructuredText(pdfDoc, (p) => {
    if (onProgress) onProgress(40 + Math.round(p * 0.4));
  });

  const children = [];

  for (let pIndex = 0; pIndex < pagesData.length; pIndex++) {
    const page = pagesData[pIndex];

    if (pIndex > 0) {
      children.push(
        new Paragraph({
          children: [new TextRun({ text: '', break: 1 })],
          pageBreakBefore: true
        })
      );
    }

    for (const line of page.lines) {
      const trimmed = line.text.trim();
      if (!trimmed) continue;

      let heading = undefined;
      let isBold = false;
      if (line.maxFontSize >= 18) {
        heading = HeadingLevel.HEADING_1;
        isBold = true;
      } else if (line.maxFontSize >= 14) {
        heading = HeadingLevel.HEADING_2;
        isBold = true;
      } else if (line.maxFontSize >= 12 && trimmed.length < 60) {
        heading = HeadingLevel.HEADING_3;
      }

      children.push(
        new Paragraph({
          heading,
          spacing: { after: 120, before: 60 },
          children: [
            new TextRun({
              text: trimmed,
              bold: isBold,
              size: Math.max(20, Math.min(48, line.maxFontSize * 2)),
              font: 'Calibri'
            })
          ]
        })
      );
    }
  }

  const doc = new Document({
    sections: [
      {
        properties: {},
        children: children.length > 0 ? children : [
          new Paragraph({
            children: [new TextRun({ text: 'Tài liệu trống hoặc không chứa văn bản có thể trích xuất.' })]
          })
        ]
      }
    ]
  });

  if (onProgress) onProgress(90);
  const docxBlob = await Packer.toBlob(doc);
  const baseName = file.name ? file.name.replace(/\.[^/.]+$/, "") : 'document';
  if (onProgress) onProgress(100);

  return {
    blob: docxBlob,
    filename: `${baseName}.docx`,
    mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    isZip: false
  };
}

export async function convertDocxToTxt(file, _options = {}, onProgress) {
  if (onProgress) onProgress(30);
  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer });
  if (onProgress) onProgress(80);

  const baseName = file.name ? file.name.replace(/\.[^/.]+$/, "") : 'document';
  const blob = new Blob([result.value || ''], { type: 'text/plain;charset=utf-8' });
  if (onProgress) onProgress(100);

  return {
    blob,
    filename: `${baseName}.txt`,
    mimeType: 'text/plain',
    isZip: false
  };
}

export async function convertPdfToTxt(file, _options = {}, onProgress) {
  if (onProgress) onProgress(20);
  const pdfDoc = await loadPdfDocument(file);
  const pagesData = await extractPdfStructuredText(pdfDoc, onProgress);

  let fullText = '';
  for (const page of pagesData) {
    fullText += `--- Trang ${page.pageNumber} ---\n\n`;
    for (const line of page.lines) {
      fullText += line.text + '\n';
    }
    fullText += '\n\n';
  }

  const baseName = file.name ? file.name.replace(/\.[^/.]+$/, "") : 'document';
  const blob = new Blob([fullText], { type: 'text/plain;charset=utf-8' });
  if (onProgress) onProgress(100);

  return {
    blob,
    filename: `${baseName}.txt`,
    mimeType: 'text/plain',
    isZip: false
  };
}

import { renderAsync } from 'docx-preview';
import mammoth from 'mammoth';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { Document, Packer, Paragraph, TextRun, HeadingLevel } from 'docx';
import { loadPdfDocument, extractPdfStructuredText } from './pdfHelper.js';

/**
 * Chuyển đổi tệp Word (.docx) sang PDF giữ nguyên 100% bố cục, hình ảnh, bảng biểu và font chữ Unicode
 */
export async function convertDocxToPdf(file, _options = {}, onProgress = () => {}) {
  if (onProgress) onProgress(10);
  const arrayBuffer = await file.arrayBuffer();

  // Tạo staging container trong DOM để render Word trung thực 1:1
  const staging = document.createElement('div');
  staging.id = 'docx-render-staging-' + Date.now();
  staging.style.position = 'fixed';
  staging.style.top = '0';
  staging.style.left = '0';
  staging.style.zIndex = '-9999';
  staging.style.opacity = '0';
  staging.style.pointerEvents = 'none';
  staging.style.width = '816px'; // Chuẩn A4 pixel tại 96 DPI
  staging.style.background = '#ffffff';
  staging.style.color = '#000000';
  staging.style.fontFamily = '"Plus Jakarta Sans", "Inter", "Roboto", "Times New Roman", "Arial", sans-serif';
  document.body.appendChild(staging);

  try {
    if (onProgress) onProgress(25);

    let usedDocxPreview = false;

    // 1. Ưu tiên render bằng docx-preview để giữ nguyên 1:1 format Word (bảng, layout, margins, fonts, images)
    try {
      await renderAsync(arrayBuffer, staging, undefined, {
        className: 'docx-preview-root',
        inWrapper: true,
        ignoreWidth: false,
        ignoreHeight: false,
        ignoreFonts: false,
        breakPages: true,
        renderHeaders: true,
        renderFooters: true,
        renderFootnotes: true,
        renderEndnotes: true,
        useBase64URL: true
      });
      usedDocxPreview = true;
    } catch (docxErr) {
      console.warn('docx-preview fallback to mammoth:', docxErr);
    }

    if (onProgress) onProgress(45);

    // Nếu docx-preview không render được nội dung, sử dụng Mammoth làm fallback
    if (!usedDocxPreview || staging.children.length === 0 || !staging.innerText.trim()) {
      staging.innerHTML = '';
      const mammothResult = await mammoth.convertToHtml({ arrayBuffer });
      const html = mammothResult.value || '<p>Không có nội dung</p>';

      const wrapper = document.createElement('div');
      wrapper.className = 'docx-mammoth-fallback';
      wrapper.style.padding = '48px';
      wrapper.style.lineHeight = '1.6';
      wrapper.style.fontSize = '14px';
      wrapper.style.color = '#1e293b';
      wrapper.innerHTML = `
        <style>
          .docx-mammoth-fallback h1 { font-size: 24px; font-weight: 700; margin-bottom: 16px; color: #0f172a; }
          .docx-mammoth-fallback h2 { font-size: 18px; font-weight: 600; margin-top: 20px; margin-bottom: 12px; color: #1e293b; }
          .docx-mammoth-fallback h3 { font-size: 16px; font-weight: 600; margin-top: 16px; margin-bottom: 8px; color: #334155; }
          .docx-mammoth-fallback p { margin-bottom: 12px; font-size: 13px; }
          .docx-mammoth-fallback table { width: 100%; border-collapse: collapse; margin: 16px 0; font-size: 12px; }
          .docx-mammoth-fallback th, .docx-mammoth-fallback td { border: 1px solid #cbd5e1; padding: 8px 12px; text-align: left; }
          .docx-mammoth-fallback th { background-color: #f1f5f9; font-weight: 600; }
          .docx-mammoth-fallback img { max-width: 100%; height: auto; display: block; margin: 16px auto; }
          .docx-mammoth-fallback ul, .docx-mammoth-fallback ol { padding-left: 24px; margin-bottom: 12px; }
          .docx-mammoth-fallback li { margin-bottom: 4px; }
        </style>
        ${html}
      `;
      staging.appendChild(wrapper);
    }

    if (onProgress) onProgress(60);

    // Chờ tất cả hình ảnh tải xong
    const images = Array.from(staging.querySelectorAll('img'));
    await Promise.all(
      images.map((img) => {
        if (img.complete) return Promise.resolve();
        return new Promise((res) => {
          img.onload = res;
          img.onerror = res;
        });
      })
    );

    // Cho DOM reflow hoàn chỉnh
    await new Promise((r) => setTimeout(r, 120));

    // Tìm các trang được phân chia bởi docx-preview
    let pageElements = Array.from(staging.querySelectorAll('section.docx, article.docx, .docx-preview-root > section'));
    if (pageElements.length === 0) {
      pageElements = [staging];
    }

    if (onProgress) onProgress(70);

    // Khởi tạo tài liệu PDF khổ A4 tiêu chuẩn (595.28 x 841.89 pt)
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'pt',
      format: 'a4'
    });

    const totalPages = pageElements.length;

    for (let i = 0; i < totalPages; i++) {
      const pageEl = pageElements[i];

      // Chụp trang dưới dạng Canvas độ nét cao (2.0x scale cho độ phân giải retina/print)
      const canvas = await html2canvas(pageEl, {
        scale: 2.0,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        windowWidth: 816
      });

      if (i > 0) {
        pdf.addPage('a4', 'portrait');
      }

      const imgData = canvas.toDataURL('image/jpeg', 0.96);
      const pdfWidth = 595.28;
      const pdfHeight = 841.89;

      // Tính tỷ lệ vừa trang
      const canvasRatio = canvas.height / canvas.width;
      const targetHeight = pdfWidth * canvasRatio;

      if (targetHeight > pdfHeight && totalPages === 1) {
        // Nếu chỉ có 1 trang dài (từ fallback), tự động chia nhỏ thành các trang A4
        let remainingHeight = canvas.height;
        let yOffset = 0;
        const pageCanvasHeight = canvas.width * (pdfHeight / pdfWidth);

        let sliceIndex = 0;
        while (remainingHeight > 0) {
          if (sliceIndex > 0) {
            pdf.addPage('a4', 'portrait');
          }

          const sliceCanvas = document.createElement('canvas');
          sliceCanvas.width = canvas.width;
          sliceCanvas.height = Math.min(pageCanvasHeight, remainingHeight);
          const sCtx = sliceCanvas.getContext('2d');

          sCtx.drawImage(
            canvas,
            0,
            yOffset,
            canvas.width,
            sliceCanvas.height,
            0,
            0,
            canvas.width,
            sliceCanvas.height
          );

          const sliceImgData = sliceCanvas.toDataURL('image/jpeg', 0.96);
          const sliceRenderHeight = (sliceCanvas.height / canvas.width) * pdfWidth;
          pdf.addImage(sliceImgData, 'JPEG', 0, 0, pdfWidth, sliceRenderHeight);

          yOffset += pageCanvasHeight;
          remainingHeight -= pageCanvasHeight;
          sliceIndex++;
        }
      } else {
        pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, Math.min(targetHeight, pdfHeight));
      }

      if (onProgress) onProgress(70 + Math.round(((i + 1) / totalPages) * 25));
    }

    const pdfBlob = pdf.output('blob');
    const baseName = file.name ? file.name.replace(/\.[^/.]+$/, '') : 'document';
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

/**
 * Chuyển đổi PDF sang DOCX (Microsoft Word) giữ nguyên các khối văn bản và tiêu đề
 */
export async function convertPdfToDocx(file, _options = {}, onProgress = () => {}) {
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
  const baseName = file.name ? file.name.replace(/\.[^/.]+$/, '') : 'document';
  if (onProgress) onProgress(100);

  return {
    blob: docxBlob,
    filename: `${baseName}.docx`,
    mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    isZip: false
  };
}

/**
 * Chuyển đổi DOCX sang Text thuần
 */
export async function convertDocxToTxt(file, _options = {}, onProgress = () => {}) {
  if (onProgress) onProgress(30);
  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer });
  if (onProgress) onProgress(80);

  const baseName = file.name ? file.name.replace(/\.[^/.]+$/, '') : 'document';
  const blob = new Blob([result.value || ''], { type: 'text/plain;charset=utf-8' });
  if (onProgress) onProgress(100);

  return {
    blob,
    filename: `${baseName}.txt`,
    mimeType: 'text/plain',
    isZip: false
  };
}

/**
 * Chuyển đổi PDF sang Text thuần
 */
export async function convertPdfToTxt(file, _options = {}, onProgress = () => {}) {
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

  const baseName = file.name ? file.name.replace(/\.[^/.]+$/, '') : 'document';
  const blob = new Blob([fullText], { type: 'text/plain;charset=utf-8' });
  if (onProgress) onProgress(100);

  return {
    blob,
    filename: `${baseName}.txt`,
    mimeType: 'text/plain',
    isZip: false
  };
}

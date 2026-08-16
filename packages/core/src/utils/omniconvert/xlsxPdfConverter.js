import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { loadPdfDocument, extractPdfStructuredText } from './pdfHelper.js';

export async function convertXlsxToPdf(file, _options = {}, onProgress = () => {}) {
  if (onProgress) onProgress(15);
  const arrayBuffer = await file.arrayBuffer();

  const workbook = XLSX.read(arrayBuffer, { type: 'array' });
  const sheetNames = workbook.SheetNames;

  if (sheetNames.length === 0) {
    throw new Error('Tệp Excel không chứa sheet nào.');
  }

  if (onProgress) onProgress(30);

  const pdf = new jsPDF({
    orientation: 'landscape',
    unit: 'pt',
    format: 'a4'
  });

  const totalSheets = sheetNames.length;
  let hasRenderedAnyPage = false;

  const staging = document.createElement('div');
  staging.style.position = 'fixed';
  staging.style.top = '0';
  staging.style.left = '0';
  staging.style.zIndex = '-9999';
  staging.style.opacity = '0';
  staging.style.pointerEvents = 'none';
  staging.style.width = '1120px';
  staging.style.background = '#ffffff';
  staging.style.fontFamily = '"Plus Jakarta Sans", "Inter", "Roboto", "Arial", sans-serif';
  document.body.appendChild(staging);

  try {
    for (let sIndex = 0; sIndex < totalSheets; sIndex++) {
      const sheetName = sheetNames[sIndex];
      const worksheet = workbook.Sheets[sheetName];
      const rawData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });

      if (rawData.length === 0) continue;

      const headers = rawData[0] || [];
      const rows = rawData.slice(1);

      // Render table thành DOM element với styling đẹp và font Unicode chuẩn
      staging.innerHTML = '';
      const tableWrapper = document.createElement('div');
      tableWrapper.style.padding = '32px';
      tableWrapper.style.backgroundColor = '#ffffff';
      tableWrapper.style.boxSizing = 'border-box';

      tableWrapper.innerHTML = `
        <div style="font-size: 18px; font-weight: 700; color: #0f172a; margin-bottom: 16px;">
          Bảng tính: ${escapeHtml(sheetName)}
        </div>
        <table style="width: 100%; border-collapse: collapse; font-size: 11px; font-family: inherit;">
          <thead>
            <tr style="background-color: #0284c7; color: #ffffff;">
              ${headers.map((h) => `<th style="border: 1px solid #0369a1; padding: 6px 10px; text-align: left; font-weight: 600;">${escapeHtml(String(h))}</th>`).join('')}
            </tr>
          </thead>
          <tbody>
            ${rows
              .slice(0, 100) // Giới hạn tối đa 100 hàng cho 1 sheet
              .map(
                (row, rIdx) => `
              <tr style="background-color: ${rIdx % 2 === 0 ? '#ffffff' : '#f8fafc'}; color: #334155;">
                ${headers.map((_, cIdx) => `<td style="border: 1px solid #cbd5e1; padding: 5px 10px; word-break: break-word;">${escapeHtml(String(row[cIdx] !== undefined ? row[cIdx] : ''))}</td>`).join('')}
              </tr>
            `
              )
              .join('')}
          </tbody>
        </table>
      `;

      staging.appendChild(tableWrapper);
      await new Promise((r) => setTimeout(r, 20));

      const canvas = await html2canvas(tableWrapper, {
        scale: 2.0,
        backgroundColor: '#ffffff',
        useCORS: true,
        logging: false
      });

      if (hasRenderedAnyPage) {
        pdf.addPage('a4', 'landscape');
      }
      hasRenderedAnyPage = true;

      const pdfWidth = 841.89; // A4 landscape width in pt
      const pdfHeight = 595.28; // A4 landscape height in pt

      const canvasRatio = canvas.height / canvas.width;
      const targetHeight = pdfWidth * canvasRatio;

      if (targetHeight <= pdfHeight) {
        const imgData = canvas.toDataURL('image/jpeg', 0.96);
        pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, targetHeight);
      } else {
        let remainingHeight = canvas.height;
        let yOffset = 0;
        const pageCanvasHeight = canvas.width * (pdfHeight / pdfWidth);

        let sliceIndex = 0;
        while (remainingHeight > 0) {
          if (sliceIndex > 0) {
            pdf.addPage('a4', 'landscape');
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
      }

      if (onProgress) onProgress(30 + Math.round(((sIndex + 1) / totalSheets) * 60));
    }

    const baseName = file.name ? file.name.replace(/\.[^/.]+$/, '') : 'spreadsheet';
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

export async function convertPdfToXlsx(file, _options = {}, onProgress = () => {}) {
  if (onProgress) onProgress(20);
  const pdfDoc = await loadPdfDocument(file);

  if (onProgress) onProgress(40);
  const pagesData = await extractPdfStructuredText(pdfDoc, (p) => {
    if (onProgress) onProgress(40 + Math.round(p * 0.4));
  });

  const workbook = XLSX.utils.book_new();

  for (let pIndex = 0; pIndex < pagesData.length; pIndex++) {
    const page = pagesData[pIndex];
    const sheetData = [];

    for (const line of page.lines) {
      if (!line.items || line.items.length === 0) continue;

      const rowCells = [];
      for (const item of line.items) {
        const text = item.text.trim();
        if (!text) continue;
        rowCells.push(text);
      }

      if (rowCells.length > 0) {
        sheetData.push(rowCells);
      }
    }

    const worksheet = XLSX.utils.aoa_to_sheet(
      sheetData.length > 0 ? sheetData : [['Không tìm thấy dữ liệu bảng trong trang này']]
    );
    XLSX.utils.book_append_sheet(workbook, worksheet, `Trang ${page.pageNumber}`);
  }

  if (onProgress) onProgress(90);
  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([excelBuffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  });

  const baseName = file.name ? file.name.replace(/\.[^/.]+$/, '') : 'spreadsheet';
  if (onProgress) onProgress(100);

  return {
    blob,
    filename: `${baseName}.xlsx`,
    mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    isZip: false
  };
}

export async function convertXlsxToCsv(file, _options = {}, onProgress = () => {}) {
  if (onProgress) onProgress(30);
  const arrayBuffer = await file.arrayBuffer();
  const workbook = XLSX.read(arrayBuffer, { type: 'array' });
  const firstSheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[firstSheetName];

  if (onProgress) onProgress(70);
  const csvData = XLSX.utils.sheet_to_csv(worksheet);
  const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8' });

  const baseName = file.name ? file.name.replace(/\.[^/.]+$/, '') : 'data';
  if (onProgress) onProgress(100);

  return {
    blob,
    filename: `${baseName}.csv`,
    mimeType: 'text/csv',
    isZip: false
  };
}

function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

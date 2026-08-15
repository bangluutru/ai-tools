import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { loadPdfDocument, extractPdfStructuredText } from './pdfHelper.js';

export async function convertXlsxToPdf(file, _options = {}, onProgress) {
  if (onProgress) onProgress(20);
  const arrayBuffer = await file.arrayBuffer();

  const workbook = XLSX.read(arrayBuffer, { type: 'array' });
  const sheetNames = workbook.SheetNames;

  if (sheetNames.length === 0) {
    throw new Error('Tệp Excel không chứa sheet nào.');
  }

  if (onProgress) onProgress(40);

  const pdf = new jsPDF({
    orientation: 'landscape',
    unit: 'pt',
    format: 'a4'
  });

  let isFirstPage = true;
  const totalSheets = sheetNames.length;

  for (let sIndex = 0; sIndex < totalSheets; sIndex++) {
    const sheetName = sheetNames[sIndex];
    const worksheet = workbook.Sheets[sheetName];
    const rawData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });

    if (rawData.length === 0) continue;

    if (!isFirstPage) {
      pdf.addPage('a4', 'landscape');
    }
    isFirstPage = false;

    pdf.setFontSize(14);
    pdf.setTextColor(15, 23, 42);
    pdf.text(`Bảng tính: ${sheetName}`, 40, 40);

    const headers = rawData[0] || [];
    const rows = rawData.slice(1);

    autoTable(pdf, {
      head: [headers],
      body: rows,
      startY: 55,
      margin: { left: 40, right: 40, top: 40, bottom: 40 },
      theme: 'grid',
      styles: {
        fontSize: 8,
        cellPadding: 4,
        overflow: 'linebreak',
        textColor: [30, 41, 59]
      },
      headStyles: {
        fillColor: [14, 140, 233],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        halign: 'center'
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252]
      },
      didDrawPage: (data) => {
        const pageCount = pdf.internal.getNumberOfPages();
        pdf.setFontSize(8);
        pdf.setTextColor(148, 163, 184);
        pdf.text(
          `Trang ${data.pageNumber} / ${pageCount}`,
          pdf.internal.pageSize.getWidth() - 80,
          pdf.internal.pageSize.getHeight() - 20
        );
      }
    });

    if (onProgress) onProgress(40 + Math.round(((sIndex + 1) / totalSheets) * 50));
  }

  const baseName = file.name ? file.name.replace(/\.[^/.]+$/, "") : 'spreadsheet';
  const pdfBlob = pdf.output('blob');
  if (onProgress) onProgress(100);

  return {
    blob: pdfBlob,
    filename: `${baseName}.pdf`,
    mimeType: 'application/pdf',
    isZip: false
  };
}

export async function convertPdfToXlsx(file, _options = {}, onProgress) {
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

  const baseName = file.name ? file.name.replace(/\.[^/.]+$/, "") : 'spreadsheet';
  if (onProgress) onProgress(100);

  return {
    blob,
    filename: `${baseName}.xlsx`,
    mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    isZip: false
  };
}

export async function convertXlsxToCsv(file, _options = {}, onProgress) {
  if (onProgress) onProgress(30);
  const arrayBuffer = await file.arrayBuffer();
  const workbook = XLSX.read(arrayBuffer, { type: 'array' });
  const firstSheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[firstSheetName];

  if (onProgress) onProgress(70);
  const csvData = XLSX.utils.sheet_to_csv(worksheet);
  const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8' });

  const baseName = file.name ? file.name.replace(/\.[^/.]+$/, "") : 'data';
  if (onProgress) onProgress(100);

  return {
    blob,
    filename: `${baseName}.csv`,
    mimeType: 'text/csv',
    isZip: false
  };
}

import * as XLSX from 'xlsx';
import { renderBlocksToPdf, escapeHtml } from './htmlPdfRenderer.js';
import { withPdfDocument, extractPdfStructuredText } from './pdfHelper.js';

/** Số dòng tối đa đưa vào PDF cho mỗi sheet (chặn tệp khổng lồ làm treo tab). */
export const XLSX_PDF_MAX_ROWS_PER_SHEET = 20000;

const XLSX_TABLE_CSS = `
  .omni-sheet-title { font-size:18px; font-weight:700; color:#0f172a; margin-bottom:12px; }
  .omni-sheet-note { font-size:11px; color:#64748b; margin:-6px 0 10px; }
  .omni-sheet { font-size:11px; }
  .omni-sheet th { background:#0284c7; color:#fff; border:1px solid #0369a1; padding:5px 8px; text-align:left; font-weight:600; }
  .omni-sheet td { border:1px solid #cbd5e1; padding:4px 8px; word-break:break-word; vertical-align:top; color:#334155; }
  .omni-sheet tr:nth-child(even) td { background:#f8fafc; }
`;

/**
 * Dựng danh sách khối (tiêu đề sheet + bảng cắt được theo hàng) cho bộ dàn trang.
 * Hàm thuần: nhận mảng hai chiều `rows` (hàng đầu là tiêu đề).
 */
export function buildSheetBlocks(sheetName, rows, maxRows = XLSX_PDF_MAX_ROWS_PER_SHEET) {
  if (!rows || rows.length === 0) return [];
  const columnCount = rows.reduce((max, row) => Math.max(max, Array.isArray(row) ? row.length : 0), 0);
  if (columnCount === 0) return [];
  const headers = Array.from({ length: columnCount }, (_, c) => rows[0]?.[c] ?? '');
  const body = rows.slice(1, 1 + maxRows);
  const blocks = [{ html: `<div class="omni-sheet-title">${escapeHtml(sheetName)}</div>` }];
  if (rows.length - 1 > maxRows) {
    blocks.push({ html: `<div class="omni-sheet-note">Chỉ xuất ${maxRows} / ${rows.length - 1} dòng đầu.</div>` });
  }
  blocks.push({
    table: {
      className: 'omni-sheet',
      headerHtml: `<tr>${headers.map((h) => `<th>${escapeHtml(h)}</th>`).join('')}</tr>`,
      rowsHtml: body.map((row) => `<tr>${headers.map((_, c) => `<td>${escapeHtml(row?.[c] ?? '')}</td>`).join('')}</tr>`),
    },
  });
  return blocks;
}

export async function convertXlsxToPdf(file, _options = {}, onProgress = () => {}) {
  if (onProgress) onProgress(15);
  const arrayBuffer = await file.arrayBuffer();

  // cellDates: ô ngày trong xlsx lưu dưới dạng số sê-ri; không bật cờ này thì
  // "15/01/2026" đọc ra thành 46037.
  const workbook = XLSX.read(arrayBuffer, { type: 'array', cellDates: true });
  const sheetNames = workbook.SheetNames;

  if (sheetNames.length === 0) {
    throw new Error('Tệp Excel không chứa sheet nào.');
  }

  if (onProgress) onProgress(30);

  const blocks = [];
  for (const sheetName of sheetNames) {
    // raw: false trả về chuỗi đã áp định dạng của ô, nên ngày, tiền tệ và
    // phần trăm hiện trong PDF đúng như người dùng thấy trong Excel.
    const rawData = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { header: 1, defval: '', raw: false });
    const sheetBlocks = buildSheetBlocks(sheetName, rawData);
    if (sheetBlocks.length === 0) continue;
    // Mỗi sheet bắt đầu ở trang mới.
    if (blocks.length > 0) sheetBlocks[0] = { ...sheetBlocks[0], breakBefore: true };
    blocks.push(...sheetBlocks);
  }
  if (blocks.length === 0) throw new Error('Các sheet trong tệp đều trống.');

  // Trước đây cả sheet được chụp trong một lần html2canvas: quá ~650 dòng thì
  // canvas vượt giới hạn trình duyệt và ra trang trắng, còn lát cắt lẻ pixel
  // làm jsPDF ném lỗi. Giờ dàn theo trang, mỗi trang lặp lại hàng tiêu đề.
  const pdfBlob = await renderBlocksToPdf(blocks, {
    orientation: 'landscape',
    marginPx: 32,
    // Bảng nhiều trang: 1.5x vẫn đọc rõ nhưng PDF nhẹ gần một nửa so với 2x.
    scale: 1.5,
    css: XLSX_TABLE_CSS,
    onProgress: (f) => onProgress && onProgress(30 + Math.round(f * 65)),
  });

  const baseName = file.name ? file.name.replace(/\.[^/.]+$/, '') : 'spreadsheet';
  if (onProgress) onProgress(100);
  return {
    blob: pdfBlob,
    filename: `${baseName}.pdf`,
    mimeType: 'application/pdf',
    isZip: false
  };
}


export async function convertPdfToXlsx(file, _options = {}, onProgress = () => {}) {
  if (onProgress) onProgress(20);
  const pagesData = await withPdfDocument(file, (pdfDoc) => {
    if (onProgress) onProgress(40);
    return extractPdfStructuredText(pdfDoc, (p) => {
      if (onProgress) onProgress(40 + Math.round(p * 0.4));
    });
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

/** Tên tệp an toàn cho một sheet trong ZIP. */
export function sheetFileName(sheetName, index) {
  const cleaned = String(sheetName || '').replace(/[\\/:*?"<>|]+/g, '_').trim();
  return `${String(index + 1).padStart(2, '0')}_${cleaned || 'Sheet'}.csv`;
}

export async function convertXlsxToCsv(file, _options = {}, onProgress = () => {}) {
  if (onProgress) onProgress(30);
  const arrayBuffer = await file.arrayBuffer();
  // cellDates: ô ngày trong xlsx lưu dưới dạng số sê-ri; không bật cờ này thì
  // "15/01/2026" đọc ra thành 46037.
  const workbook = XLSX.read(arrayBuffer, { type: 'array', cellDates: true });
  const baseName = file.name ? file.name.replace(/\.[^/.]+$/, '') : 'data';
  // BOM để Excel trên Windows mở CSV UTF-8 không vỡ dấu tiếng Việt/Nhật.
  const BOM = '﻿';

  const sheets = workbook.SheetNames
    .map((name, index) => ({ name, index, csv: XLSX.utils.sheet_to_csv(workbook.Sheets[name]) }))
    .filter((sheet) => sheet.csv.replace(/[,\s]/g, '') !== '');

  if (onProgress) onProgress(70);

  if (sheets.length <= 1) {
    const csvData = sheets[0]?.csv ?? '';
    if (onProgress) onProgress(100);
    return {
      blob: new Blob([BOM + csvData], { type: 'text/csv;charset=utf-8' }),
      filename: `${baseName}.csv`,
      mimeType: 'text/csv',
      isZip: false
    };
  }

  // CSV chỉ chứa được một bảng: nhiều sheet có dữ liệu thì xuất mỗi sheet một tệp trong ZIP.
  const { default: JSZip } = await import('jszip');
  const zip = new JSZip();
  for (const sheet of sheets) {
    zip.file(sheetFileName(sheet.name, sheet.index), BOM + sheet.csv);
  }
  const blob = await zip.generateAsync({ type: 'blob' });
  if (onProgress) onProgress(100);
  return {
    blob,
    filename: `${baseName}_csv.zip`,
    mimeType: 'application/zip',
    isZip: true,
    sheetCount: sheets.length
  };
}

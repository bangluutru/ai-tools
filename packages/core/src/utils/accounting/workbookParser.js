import { normalizeInvoiceNumber, parseLocalizedNumber } from './reconcile.js';

export const PARSER_VERSION = 'accounting-parser-v1';

/** Số dòng đầu sheet được quét để tìm dòng tiêu đề. */
const HEADER_SEARCH_DEPTH = 40;

/**
 * Bỏ dấu tiếng Việt và chuẩn hóa khoảng trắng để so khớp nhãn cột không phụ thuộc
 * cách gõ dấu, chữ hoa/thường hay khoảng trắng thừa trong file của từng công ty.
 */
export function normalizeLabel(value) {
  if (value === null || value === undefined) return '';
  return String(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/gi, 'd')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

/**
 * Nhãn cột theo thứ tự ưu tiên. Cột nào khớp trước sẽ được lấy trước, và một cột
 * đã dùng thì không gán lại cho khóa khác.
 */
export const LEDGER_COLUMN_SPEC = Object.freeze({
  invoice: ['so hoa don', 'so hd', 'so chung tu', 'so seri'],
  value: ['phat sinh co', 'ps co', 'phat sinh ben co', 'co'],
  desc: ['dien giai', 'noi dung', 'ghi chu'],
});

export const BR_COLUMN_SPEC = Object.freeze({
  invoice: ['so hoa don', 'so hd', 'so chung tu'],
  chuaThue: [
    'doanh so ban chua co thue',
    'doanh so chua thue',
    'thanh tien chua thue',
    'gia tri chua thue',
    'doanh thu chua thue',
    'chua thue',
  ],
  thue: ['thue gtgt', 'tien thue gtgt', 'tien thue', 'thue gia tri gia tang'],
});

/** Cột thuế suất (%) không phải cột tiền thuế; loại trừ để không cộng nhầm. */
const RATE_HINTS = ['suat', 'ty le', 'percent'];

function matchColumn(headerCells, candidates, taken) {
  for (const candidate of candidates) {
    for (let index = 0; index < headerCells.length; index += 1) {
      if (taken.has(index)) continue;
      const cell = headerCells[index];
      if (!cell) continue;
      if (RATE_HINTS.some((hint) => cell.includes(hint))) continue;
      if (cell === candidate || cell.includes(candidate)) return index;
    }
  }
  return -1;
}

export function resolveColumns(headerRow, spec) {
  const headerCells = (headerRow ?? []).map(normalizeLabel);
  const taken = new Set();
  const columns = {};

  for (const [key, candidates] of Object.entries(spec)) {
    const index = matchColumn(headerCells, candidates, taken);
    if (index >= 0) {
      columns[key] = index;
      taken.add(index);
    }
  }

  return columns;
}

/**
 * Tìm dòng tiêu đề bằng nội dung thay vì vị trí cố định. Sổ kế toán và bảng kê
 * xuất từ các phần mềm khác nhau có số dòng tiêu đề/dòng trống khác nhau, nên
 * offset cứng sẽ âm thầm bỏ sót hoặc đọc lệch dữ liệu.
 */
export function findHeaderRow(rows, spec, requiredKeys) {
  let best = { index: -1, columns: {}, score: 0 };

  const depth = Math.min(rows.length, HEADER_SEARCH_DEPTH);
  for (let index = 0; index < depth; index += 1) {
    const columns = resolveColumns(rows[index], spec);
    if (!requiredKeys.every((key) => columns[key] !== undefined)) continue;

    const score = Object.keys(columns).length;
    if (score > best.score) best = { index, columns, score };
  }

  return best;
}

/** Dòng đánh số cột kiểu 1,2,3,... nằm ngay dưới tiêu đề, không phải dữ liệu. */
function isColumnNumberingRow(row) {
  const values = (row ?? []).filter((cell) => cell !== null && cell !== undefined && cell !== '');
  if (values.length < 3) return false;
  return values.every((cell, position) => Number(cell) === position + 1);
}

/** Dòng tổng cộng/lũy kế không phải một hóa đơn. */
function isAggregateRow(invoiceText) {
  const normalized = normalizeLabel(invoiceText);
  if (!normalized) return false;
  return ['tong', 'cong', 'luy ke', 'tong cong', 'so du'].some((token) => normalized.startsWith(token));
}

function extractRecords(rows, columns, { valueKeys, meta }) {
  const records = [];
  let skippedRows = 0;

  for (let index = meta.headerIndex + 1; index < rows.length; index += 1) {
    const row = rows[index];
    if (!row || row.length === 0) continue;
    if (isColumnNumberingRow(row)) continue;

    const invoiceRaw = row[columns.invoice];
    if (invoiceRaw === null || invoiceRaw === undefined || invoiceRaw === '') continue;
    if (isAggregateRow(invoiceRaw)) continue;

    const invoice = normalizeInvoiceNumber(invoiceRaw);
    if (!invoice) continue;

    const values = {};
    let hasValue = false;
    for (const key of valueKeys) {
      const parsed = columns[key] === undefined ? null : parseLocalizedNumber(row[columns[key]]);
      values[key] = parsed ?? 0;
      if (parsed !== null) hasValue = true;
    }

    if (!hasValue) {
      skippedRows += 1;
      continue;
    }

    records.push({
      invoice,
      originalInvoice: invoiceRaw,
      ...values,
      desc: columns.desc === undefined ? '' : String(row[columns.desc] ?? ''),
      sourceFile: meta.sourceFile,
      sourceSheet: meta.sourceSheet,
      // rows đọc với blankrows:true nên index khớp đúng số dòng thật trong Excel.
      sourceRow: index + 1,
    });
  }

  return { records, skippedRows };
}

export function parseLedgerSheet(rows, meta) {
  const header = findHeaderRow(rows, LEDGER_COLUMN_SPEC, ['invoice', 'value']);
  if (header.index < 0) {
    return {
      records: [],
      diagnostics: {
        ...meta,
        ok: false,
        reason: 'Không tìm thấy dòng tiêu đề có cột "Số hóa đơn" và "Phát sinh Có".',
      },
    };
  }

  const { records, skippedRows } = extractRecords(rows, header.columns, {
    valueKeys: ['value'],
    meta: { ...meta, headerIndex: header.index },
  });

  return {
    records,
    diagnostics: {
      ...meta,
      ok: records.length > 0,
      headerRow: header.index + 1,
      columns: header.columns,
      rowCount: records.length,
      skippedRows,
      reason: records.length === 0 ? 'Tìm thấy tiêu đề nhưng không đọc được dòng dữ liệu nào.' : '',
    },
  };
}

export function parseBrSheet(rows, meta) {
  const header = findHeaderRow(rows, BR_COLUMN_SPEC, ['invoice', 'chuaThue']);
  if (header.index < 0) {
    return {
      records: [],
      diagnostics: {
        ...meta,
        ok: false,
        reason: 'Không tìm thấy dòng tiêu đề có cột "Số hóa đơn" và "Doanh số chưa thuế".',
      },
    };
  }

  const { records, skippedRows } = extractRecords(rows, header.columns, {
    valueKeys: ['chuaThue', 'thue'],
    meta: { ...meta, headerIndex: header.index },
  });

  return {
    records: records.map((record) => ({ ...record, type: meta.brType })),
    diagnostics: {
      ...meta,
      ok: records.length > 0,
      headerRow: header.index + 1,
      columns: header.columns,
      rowCount: records.length,
      skippedRows,
      reason: records.length === 0 ? 'Tìm thấy tiêu đề nhưng không đọc được dòng dữ liệu nào.' : '',
    },
  };
}

/**
 * Nhận diện loại file. Sổ chi tiết được nhận qua số hiệu tài khoản ở phần đầu
 * sheet; bảng kê BR nhận qua tên sheet hoặc tiêu đề bảng kê.
 */
export function detectWorkbookKind({ sheetNames, sheetRows }) {
  const nameText = normalizeLabel(sheetNames.join(' '));
  if (/\bbr\b/.test(nameText) || nameText.includes('bang ke')) return 'br';

  const firstRows = (sheetRows[sheetNames[0]] ?? []).slice(0, HEADER_SEARCH_DEPTH);
  const topText = normalizeLabel(firstRows.map((row) => (row ?? []).join(' ')).join(' '));
  if (topText.includes('bang ke')) return 'br';

  // 33311 phải kiểm tra trước 511: tiêu đề sổ thuế thường nhắc cả hai tài khoản.
  if (topText.includes('33311')) return '33311';
  if (topText.includes('511')) return '511';
  return null;
}

/** Sheet BR MTT có bố cục cột khác BR GTGT nên phải phân biệt theo tên sheet. */
export function classifyBrSheet(sheetName) {
  const normalized = normalizeLabel(sheetName);
  if (normalized.includes('mtt')) return 'MTT';
  return 'GTGT';
}

export function parseBrWorkbook({ sheetNames, sheetRows, sourceFile }) {
  const records = [];
  const diagnostics = [];

  for (const sheetName of sheetNames) {
    const rows = sheetRows[sheetName] ?? [];
    if (rows.length === 0) continue;

    const result = parseBrSheet(rows, {
      sourceFile,
      sourceSheet: sheetName,
      brType: classifyBrSheet(sheetName),
    });
    records.push(...result.records);
    diagnostics.push(result.diagnostics);
  }

  return { records, diagnostics };
}

export function parseLedgerWorkbook({ sheetNames, sheetRows, sourceFile }) {
  const sheetName = sheetNames[0];
  const result = parseLedgerSheet(sheetRows[sheetName] ?? [], {
    sourceFile,
    sourceSheet: sheetName,
  });
  return { records: result.records, diagnostics: [result.diagnostics] };
}

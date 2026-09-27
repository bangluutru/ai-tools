import { normalizeInvoiceNumber, parseLocalizedNumber } from './reconcile.js';

export const PARSER_VERSION = 'accounting-parser-v2';

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
 * Nhãn cột theo thứ tự ưu tiên. Mỗi nhãn được so trên văn bản đã bỏ dấu: trước
 * hết so khớp nguyên ô, sau đó so khớp trọn từ (không khớp giữa từ, để "co" không
 * dính vào "cong trinh"). Nhãn dạng `{ exact }` chỉ được khớp nguyên ô — dùng cho
 * tiêu đề hai tầng kiểu "Số phát sinh" / "Nợ" | "Có".
 *
 * `exclude`: ô chứa một trong các cụm này không bao giờ được nhận cho khóa đó
 * (ví dụ "Mẫu số HĐ" không phải số hóa đơn, "Tổng cộng tiền thanh toán đã có
 * thuế" không phải tiền thuế).
 *
 * Cột nào khớp trước sẽ được lấy trước, và một cột đã dùng thì không gán lại cho
 * khóa khác.
 */
export const LEDGER_COLUMN_SPEC = Object.freeze({
  invoice: {
    labels: ['so hoa don', 'so hd', 'so chung tu', 'so seri'],
    exclude: ['mau', 'ky hieu', 'ngay'],
  },
  // Phát sinh Có. Doanh thu/thuế thuần = Có − Nợ (xem `debit`).
  value: {
    labels: ['phat sinh co', 'ps co', 'phat sinh ben co', 'so phat sinh co', { exact: 'co' }],
    exclude: ['no', 'tai khoan', 'tk', 'doi ung'],
  },
  debit: {
    labels: ['phat sinh no', 'ps no', 'phat sinh ben no', 'so phat sinh no', { exact: 'no' }],
    exclude: ['co', 'tai khoan', 'tk', 'doi ung'],
  },
  desc: { labels: ['dien giai', 'noi dung', 'ghi chu'] },
  symbol: { labels: ['ky hieu hoa don', 'ky hieu hd', 'ky hieu'], exclude: ['mau'] },
  date: { labels: ['ngay hoa don', 'ngay lap', 'ngay chung tu', 'ngay ct', 'ngay'], exclude: ['ghi so'] },
});

export const BR_COLUMN_SPEC = Object.freeze({
  invoice: {
    labels: ['so hoa don', 'so hd', 'so chung tu'],
    exclude: ['mau', 'ky hieu', 'ngay'],
  },
  chuaThue: {
    labels: [
      'doanh so ban chua co thue',
      'doanh thu chua co thue',
      'doanh so chua thue',
      'doanh thu chua thue',
      'thanh tien chua thue',
      'gia tri chua thue',
      'chua co thue',
      'chua thue',
    ],
    exclude: ['thanh toan'],
  },
  thue: {
    labels: ['thue gtgt', 'tien thue gtgt', 'tien thue', 'thue gia tri gia tang'],
    exclude: ['thanh toan', 'chua', 'da co thue', 'doanh so', 'doanh thu'],
  },
  symbol: { labels: ['ky hieu hoa don', 'ky hieu hd', 'ky hieu'], exclude: ['mau'] },
  date: { labels: ['ngay hoa don', 'ngay lap', 'ngay chung tu', 'ngay ct', 'ngay'] },
});

/** Cột thuế suất (%) không phải cột tiền thuế; loại trừ để không cộng nhầm. */
const RATE_HINTS = ['suat', 'ty le', 'percent'];

const hasWord = (cell, phrase) => ` ${cell} `.includes(` ${phrase} `);

function normalizeSpecEntry(entry) {
  if (Array.isArray(entry)) return { labels: entry, exclude: [] };
  return { labels: entry?.labels ?? [], exclude: entry?.exclude ?? [] };
}

function matchColumn(headerCells, entry, taken) {
  const { labels, exclude } = normalizeSpecEntry(entry);
  const usable = (index) => {
    if (taken.has(index)) return false;
    const cell = headerCells[index];
    if (!cell) return false;
    if (RATE_HINTS.some((hint) => hasWord(cell, hint))) return false;
    if (exclude.some((phrase) => hasWord(cell, phrase))) return false;
    return true;
  };

  for (const label of labels) {
    const exactOnly = typeof label === 'object';
    const phrase = exactOnly ? label.exact : label;
    for (let index = 0; index < headerCells.length; index += 1) {
      if (usable(index) && headerCells[index] === phrase) return index;
    }
    if (exactOnly) continue;
    for (let index = 0; index < headerCells.length; index += 1) {
      if (usable(index) && hasWord(headerCells[index], phrase)) return index;
    }
  }
  return -1;
}

export function resolveColumns(headerRow, spec) {
  const headerCells = Array.from(headerRow ?? [], normalizeLabel);
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

/**
 * Đọc ô tiền. Ô text "0.125"/"0,125" là số thập phân chứ không phải 125: nhóm
 * nghìn không bao giờ bắt đầu bằng 0, nên không để bộ đọc số theo locale hiểu
 * nhầm dấu chấm thành dấu phân nhóm.
 */
export function parseAmountCell(value) {
  if (typeof value === 'string') {
    const text = value.trim();
    const decimal = /^(-)?0[.,](\d+)$/.exec(text);
    if (decimal) return Number(`${decimal[1] ?? ''}0.${decimal[2]}`);
  }
  return parseLocalizedNumber(value);
}

/** Ký hiệu hóa đơn đã chuẩn hóa, bỏ mẫu số đứng đầu: "1C26TAA" -> "C26TAA". */
export function normalizeInvoiceSymbol(value) {
  const compact = String(value ?? '').replace(/[^A-Za-z0-9]/g, '').toUpperCase();
  if (/^\d[CK]\d{2}[A-Z][A-Z0-9]{2}$/.test(compact)) return compact.slice(1);
  return compact;
}

/** Năm của một ô ngày (dd/mm/yyyy, yyyy-mm-dd hoặc số ngày Excel), hoặc null. */
export function yearOfCell(value) {
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value.getFullYear();
  if (typeof value === 'number' && value > 20000 && value < 80000) {
    // Số ngày kiểu Excel (gốc 1899-12-30).
    return new Date(Math.round((value - 25569) * 86400 * 1000)).getUTCFullYear();
  }
  const text = String(value ?? '');
  const dmy = /\b\d{1,2}[/.-]\d{1,2}[/.-](\d{4})\b/.exec(text);
  if (dmy) return Number(dmy[1]);
  const iso = /\b(\d{4})-\d{2}-\d{2}\b/.exec(text);
  if (iso) return Number(iso[1]);
  return null;
}

function extractRecords(rows, columns, { valueKeys, meta }) {
  const records = [];
  let skippedRows = 0;
  // Sheet không bắt đầu từ ô A1 (vùng dữ liệu bắt đầu ở dòng khác) thì chỉ số
  // mảng lệch khỏi số dòng thật của Excel đúng bằng offset này.
  const rowOffset = Number(meta.rowOffset) || 0;

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
      const parsed = columns[key] === undefined ? null : parseAmountCell(row[columns[key]]);
      values[key] = parsed ?? 0;
      if (parsed !== null) hasValue = true;
    }

    if (!hasValue) {
      skippedRows += 1;
      continue;
    }

    const symbol = columns.symbol === undefined ? '' : normalizeInvoiceSymbol(row[columns.symbol]);
    const year = columns.date === undefined ? null : yearOfCell(row[columns.date]);

    records.push({
      invoice,
      originalInvoice: invoiceRaw,
      ...values,
      ...(symbol ? { symbol } : {}),
      ...(year ? { year } : {}),
      desc: columns.desc === undefined ? '' : String(row[columns.desc] ?? ''),
      sourceFile: meta.sourceFile,
      sourceSheet: meta.sourceSheet,
      // rows đọc với blankrows:true nên index + offset khớp đúng số dòng thật trong Excel.
      sourceRow: index + 1 + rowOffset,
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

  const { records: rawRecords, skippedRows } = extractRecords(rows, header.columns, {
    valueKeys: ['value', 'debit'],
    meta: { ...meta, headerIndex: header.index },
  });

  // Doanh thu / thuế đầu ra thuần = Phát sinh Có − Phát sinh Nợ: hàng bán bị
  // trả lại, chiết khấu, hóa đơn điều chỉnh giảm ghi bên Nợ phải làm giảm số
  // đối chiếu, không được bỏ qua.
  const records = rawRecords.map(({ value, debit, ...rest }) => ({
    ...rest,
    value: (value ?? 0) - (debit ?? 0),
    credit: value ?? 0,
    debit: debit ?? 0,
  }));

  return {
    records,
    diagnostics: {
      ...meta,
      ok: records.length > 0,
      headerRow: header.index + 1 + (Number(meta.rowOffset) || 0),
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
      headerRow: header.index + 1 + (Number(meta.rowOffset) || 0),
      columns: header.columns,
      rowCount: records.length,
      skippedRows,
      reason: records.length === 0 ? 'Tìm thấy tiêu đề nhưng không đọc được dòng dữ liệu nào.' : '',
    },
  };
}

/** Số dòng đầu sheet dùng làm vùng tiêu đề khi không tìm được dòng header. */
const TITLE_FALLBACK_ROWS = 10;

/**
 * Dòng tiêu đề văn bản nằm trên dòng header của bảng (tên công ty, "SỔ CHI TIẾT
 * TÀI KHOẢN 511", kỳ báo cáo…). Chỉ phần này mới nói file là loại gì; các dòng
 * dữ liệu có thể chứa bất kỳ chuỗi số nào (số hóa đơn, số tiền, diễn giải).
 */
function titleRowsOf(rows) {
  const ledgerHeader = findHeaderRow(rows, LEDGER_COLUMN_SPEC, ['invoice', 'value']).index;
  const brHeader = findHeaderRow(rows, BR_COLUMN_SPEC, ['invoice', 'chuaThue']).index;
  const found = [ledgerHeader, brHeader].filter((index) => index >= 0);
  const end = found.length > 0 ? Math.min(...found) : Math.min(rows.length, TITLE_FALLBACK_ROWS);
  return { rows: rows.slice(0, end), ledgerHeader, brHeader };
}

/** Các số hiệu tài khoản xuất hiện như một từ riêng trong văn bản. */
function accountTokens(text) {
  return new Set(text.match(/\b\d{3,5}\b/g) ?? []);
}

/**
 * Nhận diện loại file. Sổ chi tiết được nhận qua số hiệu tài khoản đứng riêng
 * trong phần tiêu đề phía trên dòng header (hoặc tên sheet); bảng kê BR nhận qua
 * tên sheet, tiêu đề bảng kê, hoặc bố cục cột chưa thuế/thuế.
 */
export function detectWorkbookKind({ sheetNames, sheetRows }) {
  const nameText = normalizeLabel(sheetNames.join(' '));
  if (/\bbr\b/.test(nameText) || nameText.includes('bang ke')) return 'br';

  const firstRows = (sheetRows[sheetNames[0]] ?? []).slice(0, HEADER_SEARCH_DEPTH);
  const title = titleRowsOf(firstRows);
  const topText = normalizeLabel(title.rows.map((row) => Array.from(row ?? [], (cell) => cell ?? '').join(' ')).join(' '));
  if (topText.includes('bang ke')) return 'br';

  const tokens = accountTokens(`${normalizeLabel(sheetNames[0] ?? '')} ${topText}`);
  // 33311 phải kiểm tra trước 511: tiêu đề sổ thuế thường nhắc cả hai tài khoản.
  if (tokens.has('33311') || tokens.has('3331')) return '33311';
  if ([...tokens].some((token) => /^511\d?$/.test(token))) return '511';

  if (title.brHeader >= 0 && title.ledgerHeader < 0) return 'br';
  return null;
}

/** Sheet BR MTT có bố cục cột khác BR GTGT nên phải phân biệt theo tên sheet. */
export function classifyBrSheet(sheetName) {
  const normalized = normalizeLabel(sheetName);
  if (normalized.includes('mtt')) return 'MTT';
  return 'GTGT';
}

export function parseBrWorkbook({ sheetNames, sheetRows, sourceFile, sheetRowOffsets }) {
  const records = [];
  const diagnostics = [];

  for (const sheetName of sheetNames) {
    const rows = sheetRows[sheetName] ?? [];
    if (rows.length === 0) continue;

    const result = parseBrSheet(rows, {
      sourceFile,
      sourceSheet: sheetName,
      brType: classifyBrSheet(sheetName),
      rowOffset: sheetRowOffsets?.[sheetName] ?? 0,
    });
    records.push(...result.records);
    diagnostics.push(result.diagnostics);
  }

  return { records, diagnostics };
}

export function parseLedgerWorkbook({ sheetNames, sheetRows, sourceFile, sheetRowOffsets }) {
  const sheetName = sheetNames[0];
  const result = parseLedgerSheet(sheetRows[sheetName] ?? [], {
    sourceFile,
    sourceSheet: sheetName,
    rowOffset: sheetRowOffsets?.[sheetName] ?? 0,
  });
  return { records: result.records, diagnostics: [result.diagnostics] };
}

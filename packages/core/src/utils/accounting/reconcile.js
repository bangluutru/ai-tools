export const ACCOUNTING_RULE_VERSION = 'accounting-reconcile-v3';
export const DEFAULT_TOLERANCE = 0.5;

export function normalizeInvoiceNumber(value) {
  if (value === null || value === undefined) return '';
  const normalized = String(value).trim().toUpperCase().replace(/\s+/g, '');
  return normalized.replace(/^0+(?=\d)/, '');
}

import { parseLocalizedNumber } from '../numbers.js';
export { parseLocalizedNumber };

/** Ký hiệu hóa đơn đã chuẩn hóa, bỏ mẫu số đứng đầu: "1C26TAA" -> "C26TAA". */
function normalizeSymbol(value) {
  const compact = String(value ?? '').replace(/[^A-Za-z0-9]/g, '').toUpperCase();
  if (/^\d[CK]\d{2}[A-Z][A-Z0-9]{2}$/.test(compact)) return compact.slice(1);
  return compact;
}

/** Năm lập hóa đơn suy từ ký hiệu (C26TAA -> 2026), hoặc null. */
function yearOfSymbol(symbol) {
  const match = /^[CK](\d{2})/.exec(symbol);
  return match ? 2000 + Number(match[1]) : null;
}

/**
 * Khóa đối chiếu của từng bản ghi trên cả ba nguồn (511, 33311, BR).
 *
 * Số hóa đơn chỉ duy nhất trong một ký hiệu (mỗi ký hiệu mang năm lập), nên hai
 * hóa đơn cùng số khác ký hiệu — ví dụ số 1 của C25TAA và số 1 của C26TAA —
 * không được cộng dồn làm một. Quy tắc:
 *  - Mọi bản ghi của một số hóa đơn có tối đa một ký hiệu: khóa là số hóa đơn,
 *    giữ nguyên hành vi cũ (sổ thường không có cột ký hiệu, BR thì có).
 *    Nếu không bên nào có ký hiệu nhưng các bản ghi đều có năm và khác năm
 *    nhau thì tách theo năm.
 *  - Có từ hai ký hiệu trở lên: tách theo ký hiệu. Bản ghi không có ký hiệu
 *    được gán vào ký hiệu duy nhất cùng năm; không xác định được thì để riêng
 *    và đánh dấu cần xác nhận.
 *
 * @returns {Map<object, { key: string, invoice: string, symbol: string, year: number|null, ambiguous: boolean }>}
 */
function assignInvoiceKeys(recordSets) {
  const byNumber = new Map();
  for (const records of recordSets) {
    for (const record of records) {
      const invoice = normalizeInvoiceNumber(record.invoice);
      if (!invoice) continue;
      const symbol = normalizeSymbol(record.symbol);
      const year = Number(record.year) || yearOfSymbol(symbol) || null;
      if (!byNumber.has(invoice)) byNumber.set(invoice, []);
      byNumber.get(invoice).push({ record, invoice, symbol, year });
    }
  }

  const keys = new Map();
  for (const [invoice, entries] of byNumber) {
    const symbols = [...new Set(entries.map((entry) => entry.symbol).filter(Boolean))];

    if (symbols.length <= 1) {
      const years = new Set(entries.map((entry) => entry.year));
      const splitByYear = symbols.length === 0 && years.size > 1 && !years.has(null);
      for (const entry of entries) {
        keys.set(entry.record, splitByYear
          ? { key: `${invoice}|${entry.year}`, invoice, symbol: '', year: entry.year, ambiguous: false }
          : { key: invoice, invoice, symbol: '', year: null, ambiguous: false });
      }
      continue;
    }

    for (const entry of entries) {
      let symbol = entry.symbol;
      let ambiguous = false;
      if (!symbol) {
        const sameYear = symbols.filter((candidate) => entry.year && yearOfSymbol(candidate) === entry.year);
        if (sameYear.length === 1) [symbol] = sameYear;
        else ambiguous = true;
      }
      keys.set(entry.record, ambiguous
        ? { key: `${invoice}|?`, invoice, symbol: '', year: entry.year, ambiguous: true }
        : { key: `${invoice}|${symbol}`, invoice, symbol, year: yearOfSymbol(symbol), ambiguous: false });
    }
  }
  return keys;
}

function groupRecords(records, valueFields, keys) {
  const grouped = new Map();

  for (const record of records) {
    const identity = keys.get(record);
    if (!identity) continue;
    if (!grouped.has(identity.key)) {
      grouped.set(identity.key, {
        ...identity,
        records: [],
        sums: Object.fromEntries(valueFields.map((field) => [field, 0])),
      });
    }
    const group = grouped.get(identity.key);
    group.records.push(record);
    for (const field of valueFields) {
      const value = parseLocalizedNumber(record[field]);
      if (value !== null) group.sums[field] += value;
    }
  }

  return grouped;
}

/**
 * Nhãn hiển thị của một dòng đối chiếu: số hóa đơn, kèm ký hiệu/năm khi cùng
 * một số hóa đơn phải tách thành nhiều dòng.
 */
export function invoiceLabel(row) {
  if (!row) return '';
  if (row.symbol) return `${row.invoice} (${row.symbol})`;
  if (row.ambiguousSymbol) return `${row.invoice} (chưa rõ ký hiệu)`;
  if (row.invoiceKey && row.year) return `${row.invoice} (${row.year})`;
  return row.invoice;
}

function comparisonStatus(hasLedger, hasBR, difference, tolerance) {
  if (hasLedger && !hasBR) return 'MISSING_BR';
  if (!hasLedger && hasBR) return 'MISSING_LEDGER';
  return Math.abs(difference) <= tolerance ? 'MATCH' : 'DIFF';
}

function compareInvoice({
  invoice,
  ledgerGroup,
  brGroup,
  ledgerField,
  brField,
  tolerance,
}) {
  const ledgerValue = ledgerGroup?.sums[ledgerField] ?? 0;
  const brValue = brGroup?.sums[brField] ?? 0;
  const difference = ledgerValue - brValue;
  const status = comparisonStatus(Boolean(ledgerGroup), Boolean(brGroup), difference, tolerance);

  return {
    invoice,
    ledgerValue,
    brValue,
    diff: Math.abs(difference) <= tolerance ? 0 : difference,
    status,
    ledgerEvidence: ledgerGroup?.records ?? [],
    brEvidence: brGroup?.records ?? [],
    needsReview: (brGroup?.records.length ?? 0) > 1,
  };
}

export function reconcileAccountingData(data, options = {}) {
  const tolerance = options.tolerance ?? DEFAULT_TOLERANCE;
  const keys = assignInvoiceKeys([data['511'] ?? [], data['33311'] ?? [], data.br ?? []]);
  const ledger511 = groupRecords(data['511'] ?? [], ['value'], keys);
  const ledger33311 = groupRecords(data['33311'] ?? [], ['value'], keys);
  const br = groupRecords(data.br ?? [], ['chuaThue', 'thue'], keys);
  const invoices = new Set([...ledger511.keys(), ...ledger33311.keys(), ...br.keys()]);

  const report511 = [];
  const report33311 = [];
  const summary = {
    total: invoices.size,
    matched511: 0,
    unmatched511: 0,
    matched33311: 0,
    unmatched33311: 0,
    missingInBR: 0,
    missingInLedger: 0,
    needsReview: 0,
  };

  for (const key of invoices) {
    const group511 = ledger511.get(key);
    const group33311 = ledger33311.get(key);
    const brGroup = br.get(key);
    const identity = group511 ?? group33311 ?? brGroup;
    const { invoice } = identity;
    // Chỉ gắn ký hiệu/năm khi phải tách cùng một số hóa đơn thành nhiều dòng.
    const extra = {
      ...(identity.symbol ? { symbol: identity.symbol } : {}),
      ...(key !== invoice && identity.year ? { year: identity.year } : {}),
      ...(key !== invoice ? { invoiceKey: key } : {}),
      ...(identity.ambiguous ? { ambiguousSymbol: true } : {}),
    };
    const hasAnyLedger = Boolean(group511 || group33311);

    if (hasAnyLedger && !brGroup) summary.missingInBR += 1;
    if (brGroup && !hasAnyLedger) summary.missingInLedger += 1;

    if (group511 || brGroup) {
      const row = compareInvoice({
        invoice,
        ledgerGroup: group511,
        brGroup,
        ledgerField: 'value',
        brField: 'chuaThue',
        tolerance,
      });
      if (identity.ambiguous) row.needsReview = true;
      report511.push({ ...row, ...extra, val511: row.ledgerValue, valBR: row.brValue });
      if (row.status === 'MATCH') summary.matched511 += 1;
      else summary.unmatched511 += 1;
    }

    if (group33311 || brGroup) {
      const row = compareInvoice({
        invoice,
        ledgerGroup: group33311,
        brGroup,
        ledgerField: 'value',
        brField: 'thue',
        tolerance,
      });
      const vatTang = (group33311?.records ?? [])
        .filter((record) => String(record.desc ?? '').toLowerCase().includes('tặng'))
        .reduce((sum, record) => sum + (parseLocalizedNumber(record.value) ?? 0), 0);
      if (identity.ambiguous) row.needsReview = true;
      report33311.push({
        ...row,
        ...extra,
        val33311: row.ledgerValue,
        valBR: row.brValue,
        vatTang,
      });
      if (row.status === 'MATCH') summary.matched33311 += 1;
      else summary.unmatched33311 += 1;
    }

    if ((brGroup?.records.length ?? 0) > 1 || identity.ambiguous) summary.needsReview += 1;
  }

  const sortRows = (rows) => rows.sort((a, b) => {
    if (a.needsReview !== b.needsReview) return a.needsReview ? -1 : 1;
    return Math.abs(b.diff) - Math.abs(a.diff);
  });

  return {
    report511: sortRows(report511),
    report33311: sortRows(report33311),
    summary,
    tolerance,
    ruleVersion: ACCOUNTING_RULE_VERSION,
  };
}

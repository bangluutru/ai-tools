export const ACCOUNTING_RULE_VERSION = 'accounting-reconcile-v2';
export const DEFAULT_TOLERANCE = 0.5;

export function normalizeInvoiceNumber(value) {
  if (value === null || value === undefined) return '';
  const normalized = String(value).trim().toUpperCase().replace(/\s+/g, '');
  return normalized.replace(/^0+(?=\d)/, '');
}

export function parseLocalizedNumber(value) {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  if (value === null || value === undefined) return null;

  let text = String(value).trim();
  if (!text) return null;

  const negative = /^\(.*\)$/.test(text) || text.startsWith('-');
  text = text.replace(/[()\s₫đVND]/gi, '').replace(/[^\d,.-]/g, '');
  text = text.replace(/^-/, '');
  if (!text || !/\d/.test(text)) return null;

  const lastComma = text.lastIndexOf(',');
  const lastDot = text.lastIndexOf('.');
  let normalized;

  if (lastComma >= 0 && lastDot >= 0) {
    const decimalSeparator = lastComma > lastDot ? ',' : '.';
    const thousandsSeparator = decimalSeparator === ',' ? '.' : ',';
    normalized = text.split(thousandsSeparator).join('').replace(decimalSeparator, '.');
  } else {
    const separator = lastComma >= 0 ? ',' : lastDot >= 0 ? '.' : null;
    if (!separator) {
      normalized = text;
    } else {
      const groups = text.split(separator);
      const lastGroup = groups.at(-1);
      const looksLikeThousands =
        groups.length > 2 || (groups.length === 2 && lastGroup.length === 3);
      normalized = looksLikeThousands
        ? groups.join('')
        : `${groups.slice(0, -1).join('')}.${lastGroup}`;
    }
  }

  const parsed = Number(normalized);
  if (!Number.isFinite(parsed)) return null;
  return negative ? -parsed : parsed;
}

function groupRecords(records, valueFields) {
  const grouped = new Map();

  for (const record of records) {
    const invoice = normalizeInvoiceNumber(record.invoice);
    if (!invoice) continue;
    if (!grouped.has(invoice)) {
      grouped.set(invoice, {
        invoice,
        records: [],
        sums: Object.fromEntries(valueFields.map((field) => [field, 0])),
      });
    }
    const group = grouped.get(invoice);
    group.records.push(record);
    for (const field of valueFields) {
      const value = parseLocalizedNumber(record[field]);
      if (value !== null) group.sums[field] += value;
    }
  }

  return grouped;
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
  const ledger511 = groupRecords(data['511'] ?? [], ['value']);
  const ledger33311 = groupRecords(data['33311'] ?? [], ['value']);
  const br = groupRecords(data.br ?? [], ['chuaThue', 'thue']);
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

  for (const invoice of invoices) {
    const group511 = ledger511.get(invoice);
    const group33311 = ledger33311.get(invoice);
    const brGroup = br.get(invoice);
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
      report511.push({ ...row, val511: row.ledgerValue, valBR: row.brValue });
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
      report33311.push({
        ...row,
        val33311: row.ledgerValue,
        valBR: row.brValue,
        vatTang,
      });
      if (row.status === 'MATCH') summary.matched33311 += 1;
      else summary.unmatched33311 += 1;
    }

    if ((brGroup?.records.length ?? 0) > 1) summary.needsReview += 1;
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

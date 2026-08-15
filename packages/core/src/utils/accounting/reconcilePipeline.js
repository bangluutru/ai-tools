import { detectWorkbookKind, parseBrWorkbook, parseLedgerWorkbook } from './workbookParser.js';
import { reconcileAccountingData } from './reconcile.js';

/**
 * Một đường đi duy nhất từ workbook đã đọc tới kết quả đối chiếu.
 *
 * Cả miniapp và bộ golden test đều gọi hàm này, nên kết quả kế toán đã duyệt
 * chính là kết quả người dùng nhìn thấy — không có nhánh xử lý song song nào
 * có thể lệch đi mà test không bắt được.
 *
 * @param {Array<{sourceFile: string, sheetNames: string[], sheetRows: Record<string, unknown[][]>}>} workbooks
 */
export function reconcileWorkbooks(workbooks, options = {}) {
  const data = { 511: [], 33311: [], br: [] };
  const diagnostics = [];
  const files = { 511: null, 33311: null, br: null };

  for (const workbook of workbooks) {
    const kind = detectWorkbookKind(workbook);

    // File không nhận diện được phải được báo, không được bỏ qua im lặng.
    if (!kind) {
      diagnostics.push({
        sourceFile: workbook.sourceFile,
        sourceSheet: workbook.sheetNames.join(', '),
        ok: false,
        reason: 'Không nhận diện được là Sổ 511, Sổ 33311 hay Bảng kê BR.',
      });
      continue;
    }

    const parsed = kind === 'br' ? parseBrWorkbook(workbook) : parseLedgerWorkbook(workbook);
    diagnostics.push(...parsed.diagnostics.map((entry) => ({ ...entry, kind })));

    if (parsed.records.length > 0) {
      data[kind] = parsed.records;
      files[kind] = workbook.sourceFile;
    }
  }

  const hasData = data['511'].length > 0 || data['33311'].length > 0 || data.br.length > 0;

  return {
    data,
    files,
    diagnostics,
    results: hasData ? reconcileAccountingData(data, options) : null,
  };
}

/**
 * Rút gọn kết quả thành dạng so sánh được và đọc được cho người duyệt: chỉ giữ
 * số liệu quyết định kết luận, bỏ evidence vốn phụ thuộc tên file.
 */
export function summariseForGolden(results) {
  if (!results) return null;

  const row = (entry) => ({
    invoice: entry.invoice,
    ledger: entry.ledgerValue,
    br: entry.brValue,
    diff: entry.diff,
    status: entry.status,
    needsReview: entry.needsReview,
  });

  return {
    ruleVersion: results.ruleVersion,
    tolerance: results.tolerance,
    summary: results.summary,
    report511: results.report511.map(row),
    report33311: results.report33311.map((entry) => ({ ...row(entry), vatTang: entry.vatTang })),
  };
}

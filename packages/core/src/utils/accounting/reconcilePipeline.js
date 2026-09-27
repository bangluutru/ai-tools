import { detectWorkbookKind, parseBrWorkbook, parseLedgerWorkbook } from './workbookParser.js';
import { invoiceLabel, reconcileAccountingData } from './reconcile.js';

/**
 * Một đường đi duy nhất từ workbook đã đọc tới kết quả đối chiếu.
 *
 * Cả miniapp và bộ golden test đều gọi hàm này, nên kết quả kế toán đã duyệt
 * chính là kết quả người dùng nhìn thấy — không có nhánh xử lý song song nào
 * có thể lệch đi mà test không bắt được.
 *
 * Nhiều file cùng loại trong một lần tải được gộp (kèm ghi chú trong
 * diagnostics); `files[kind]` khi đó là danh sách tên file ngăn cách bởi dấu phẩy.
 * `sheetRowOffsets` (tùy chọn) là chỉ số dòng 0-based nơi vùng dữ liệu của mỗi
 * sheet bắt đầu, để số dòng bằng chứng khớp file gốc.
 *
 * @param {Array<{sourceFile: string, sheetNames: string[], sheetRows: Record<string, unknown[][]>, sheetRowOffsets?: Record<string, number>}>} workbooks
 */
export function reconcileWorkbooks(workbooks, options = {}) {
  const data = { 511: [], 33311: [], br: [] };
  const diagnostics = [];
  const files = { 511: null, 33311: null, br: null };
  const seenFiles = new Set();

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

    // Cùng một file nạp hai lần thì bỏ lần sau, không cộng đôi số liệu.
    if (seenFiles.has(`${kind}::${workbook.sourceFile}`)) {
      diagnostics.push({
        sourceFile: workbook.sourceFile,
        sourceSheet: workbook.sheetNames.join(', '),
        kind,
        ok: false,
        reason: `File trùng tên với file ${kind === 'br' ? 'Bảng kê BR' : `Sổ ${kind}`} đã nạp trong cùng lần tải; đã bỏ qua để không cộng trùng.`,
      });
      continue;
    }
    seenFiles.add(`${kind}::${workbook.sourceFile}`);

    const parsed = kind === 'br' ? parseBrWorkbook(workbook) : parseLedgerWorkbook(workbook);
    const alreadyLoaded = files[kind];
    diagnostics.push(...parsed.diagnostics.map((entry) => ({
      ...entry,
      kind,
      // Hai file cùng loại (ví dụ sổ 511 tách theo tháng) được gộp, nhưng phải
      // báo để kế toán chắc rằng đó không phải hai bản của cùng một sổ.
      ...(alreadyLoaded && parsed.records.length > 0
        ? { reason: [entry.reason, `Đã gộp với ${alreadyLoaded} (cùng loại ${kind === 'br' ? 'Bảng kê BR' : `Sổ ${kind}`}); kiểm tra hai file không trùng kỳ.`].filter(Boolean).join(' '), merged: true }
        : {}),
    })));

    if (parsed.records.length > 0) {
      data[kind] = [...data[kind], ...parsed.records];
      files[kind] = alreadyLoaded ? `${alreadyLoaded}, ${workbook.sourceFile}` : workbook.sourceFile;
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
    invoice: invoiceLabel(entry),
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

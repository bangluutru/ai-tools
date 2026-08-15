/**
 * Dựng hồ sơ trình kế toán duyệt cho công cụ Đối chiếu kế toán.
 *
 * Nhận các file Excel thật đã khử nhạy cảm, chạy đúng pipeline mà miniapp dùng,
 * rồi xuất ra hai thứ:
 *   1. <ten>.review.xlsx  — kết quả đối chiếu ở dạng đọc được để kế toán soát.
 *   2. <ten>.golden.json  — fixture ứng viên; sau khi kế toán xác nhận thì điền
 *      approvedBy/approvedOn rồi chuyển vào
 *      packages/core/tests/fixtures/accounting/ để khóa hành vi lại bằng test.
 *
 * Dùng:
 *   npm run golden:accounting -- --name thang-07-2026 So_511.xlsx So_33311.xlsx BR.xlsx
 */

import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import * as XLSX from 'xlsx';
import * as NodeFS from 'node:fs';

import {
  reconcileWorkbooks,
  summariseForGolden,
} from '../src/utils/accounting/reconcilePipeline.js';
import { buildReconcileWorkbook } from '../src/utils/accounting/reconcileExport.js';

XLSX.set_fs(NodeFS);

function parseArgs(argv) {
  const files = [];
  let name = 'golden';
  let outDir = 'fixtures/generated';

  for (let index = 0; index < argv.length; index += 1) {
    if (argv[index] === '--name') { name = argv[index + 1]; index += 1; continue; }
    if (argv[index] === '--out') { outDir = argv[index + 1]; index += 1; continue; }
    files.push(argv[index]);
  }

  return { files, name, outDir };
}

/** Đọc workbook giữ nguyên dòng trống để số dòng bằng chứng khớp file gốc. */
function readWorkbook(filePath) {
  const workbook = XLSX.readFile(filePath);
  const sheetRows = {};
  for (const sheetName of workbook.SheetNames) {
    sheetRows[sheetName] = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { header: 1 });
  }
  return { sourceFile: path.basename(filePath), sheetNames: workbook.SheetNames, sheetRows };
}

const { files, name, outDir } = parseArgs(process.argv.slice(2));

if (files.length === 0) {
  console.error('Cần ít nhất một file Excel. Ví dụ:');
  console.error('  npm run golden:accounting -- --name thang-07-2026 So_511.xlsx So_33311.xlsx BR.xlsx');
  process.exit(1);
}

const workbooks = files.map(readWorkbook);
const outcome = reconcileWorkbooks(workbooks);

console.log('\nĐọc file nguồn');
for (const entry of outcome.diagnostics) {
  const status = entry.ok ? 'OK  ' : 'LỖI ';
  const detail = entry.ok
    ? `tiêu đề dòng ${entry.headerRow}, đọc ${entry.rowCount} dòng`
    : entry.reason;
  console.log(`  ${status} ${entry.sourceFile} / ${entry.sourceSheet ?? '-'} — ${detail}`);
}

if (!outcome.results) {
  console.error('\nKhông đọc được dữ liệu đối chiếu từ các file đã cho.');
  process.exit(1);
}

const { summary } = outcome.results;
console.log('\nTổng hợp');
console.log(`  Tổng số hóa đơn        : ${summary.total}`);
console.log(`  511 khớp / lệch        : ${summary.matched511} / ${summary.unmatched511}`);
console.log(`  33311 khớp / lệch      : ${summary.matched33311} / ${summary.unmatched33311}`);
console.log(`  Thiếu trên BR / trên sổ: ${summary.missingInBR} / ${summary.missingInLedger}`);
console.log(`  Cần xác nhận thủ công  : ${summary.needsReview}`);

mkdirSync(outDir, { recursive: true });

const reviewPath = path.join(outDir, `${name}.review.xlsx`);
const workbook = await buildReconcileWorkbook(outcome.results, {
  diagnostics: outcome.diagnostics,
  generatedAt: new Date(),
});
await workbook.xlsx.writeFile(reviewPath);

const goldenPath = path.join(outDir, `${name}.golden.json`);
const golden = summariseForGolden(outcome.results);
const fixture = {
  name,
  description: 'TODO: mô tả bộ chứng từ này đại diện cho tình huống nào.',
  source: 'real-deidentified',
  approvedBy: '',
  approvedOn: '',
  workbooks,
  expected: {
    summary: golden.summary,
    report511: Object.fromEntries(golden.report511.map((row) => [row.invoice, {
      ledger: row.ledger, br: row.br, diff: row.diff, status: row.status, needsReview: row.needsReview,
    }])),
    report33311: Object.fromEntries(golden.report33311.map((row) => [row.invoice, {
      ledger: row.ledger, br: row.br, diff: row.diff, status: row.status, needsReview: row.needsReview, vatTang: row.vatTang,
    }])),
  },
};
writeFileSync(goldenPath, `${JSON.stringify(fixture, null, 2)}\n`, 'utf8');

console.log('\nĐã tạo');
console.log(`  ${reviewPath}  → gửi kế toán soát`);
console.log(`  ${goldenPath}  → fixture ứng viên`);
console.log('\nBước tiếp theo');
console.log('  1. Kế toán đối chiếu file .review.xlsx với chứng từ gốc.');
console.log('  2. Nếu đúng: điền approvedBy/approvedOn và description trong file .golden.json,');
console.log('     rồi chuyển vào packages/core/tests/fixtures/accounting/.');
console.log('  3. Nếu sai: báo lại số hóa đơn và giá trị đúng — sửa engine trước, không sửa golden.');
console.log('\nLưu ý: file .golden.json chứa nguyên dữ liệu nguồn, chỉ commit khi đã khử nhạy cảm.');

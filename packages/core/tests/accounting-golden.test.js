import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import { reconcileWorkbooks, summariseForGolden } from '../src/utils/accounting/reconcilePipeline.js';

const FIXTURE_DIR = fileURLToPath(new URL('./fixtures/accounting/', import.meta.url));

const loadFixtures = () => readdirSync(FIXTURE_DIR)
  .filter((name) => name.endsWith('.json'))
  .sort()
  .map((name) => ({ name, ...JSON.parse(readFileSync(FIXTURE_DIR + name, 'utf8')) }));

const fixtures = loadFixtures();

const byInvoice = (rows) => Object.fromEntries(rows.map((row) => [row.invoice, row]));


test('the fixture set is present and each case documents what it protects', () => {
  assert.ok(fixtures.length >= 5, 'cần đủ bộ case biên, không chỉ case khớp đẹp');

  for (const fixture of fixtures) {
    assert.equal(typeof fixture.name, 'string');
    assert.ok(fixture.description.length > 40, `${fixture.name} phải nói rõ nó bảo vệ điều gì`);
    assert.match(fixture.source, /^(synthetic|real-deidentified)$/);
    assert.ok(Array.isArray(fixture.workbooks) && fixture.workbooks.length > 0);
  }
});


// Mỗi fixture chạy qua đúng pipeline mà miniapp dùng, nên golden đã duyệt là
// cam kết về hành vi người dùng thấy chứ không phải về một hàm nội bộ.
for (const fixture of fixtures) {
  test(`golden: ${fixture.name}`, () => {
    const outcome = reconcileWorkbooks(fixture.workbooks);

    assert.notEqual(outcome.results, null, `${fixture.name}: không đọc được dữ liệu nào`);
    for (const entry of outcome.diagnostics) {
      assert.equal(entry.ok, true, `${fixture.name}: đọc hỏng ${entry.sourceFile} / ${entry.sourceSheet} — ${entry.reason}`);
    }

    const actual = summariseForGolden(outcome.results);

    assert.deepEqual(
      actual.summary,
      fixture.expected.summary,
      `${fixture.name}: bảng tổng hợp lệch golden`,
    );

    for (const [report, expected] of [
      ['report511', fixture.expected.report511],
      ['report33311', fixture.expected.report33311],
    ]) {
      const rows = byInvoice(actual[report]);
      assert.deepEqual(
        Object.keys(rows).sort(),
        Object.keys(expected).sort(),
        `${fixture.name}: danh sách hóa đơn trong ${report} lệch golden`,
      );

      for (const [invoice, want] of Object.entries(expected)) {
        const got = rows[invoice];
        assert.equal(got.ledger, want.ledger, `${fixture.name}/${report}/${invoice}: giá trị trên sổ`);
        assert.equal(got.br, want.br, `${fixture.name}/${report}/${invoice}: giá trị trên bảng kê`);
        assert.equal(got.diff, want.diff, `${fixture.name}/${report}/${invoice}: chênh lệch`);
        assert.equal(got.status, want.status, `${fixture.name}/${report}/${invoice}: trạng thái`);
        assert.equal(got.needsReview, want.needsReview, `${fixture.name}/${report}/${invoice}: cờ cần xác nhận`);
        if (want.vatTang !== undefined) {
          assert.equal(got.vatTang, want.vatTang, `${fixture.name}/${report}/${invoice}: VAT hàng tặng`);
        }
      }
    }
  });
}


test('rows needing manual confirmation are listed before the rest', () => {
  const fixture = fixtures.find((entry) => entry.name.includes('hai dòng cùng số hóa đơn'));
  const { results } = reconcileWorkbooks(fixture.workbooks);

  assert.equal(results.report511[0].needsReview, true);
});


test('an unrecognised workbook is reported rather than dropped', () => {
  const outcome = reconcileWorkbooks([
    ...fixtures[0].workbooks,
    { sourceFile: 'Linh_tinh.xlsx', sheetNames: ['Sheet1'], sheetRows: { Sheet1: [['Không phải sổ kế toán']] } },
  ]);

  const rejected = outcome.diagnostics.find((entry) => entry.sourceFile === 'Linh_tinh.xlsx');
  assert.notEqual(rejected, undefined);
  assert.equal(rejected.ok, false);
  assert.match(rejected.reason, /Không nhận diện được/);
});


// Golden chỉ có giá trị khi gắn với phiên bản quy tắc đã duyệt: đổi quy tắc mà
// quên duyệt lại thì test này đỏ.
test('the approved rule version and tolerance are pinned', () => {
  const { results } = reconcileWorkbooks(fixtures[0].workbooks);

  assert.equal(results.ruleVersion, 'accounting-reconcile-v2');
  assert.equal(results.tolerance, 0.5);
});

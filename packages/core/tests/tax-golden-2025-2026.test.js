/**
 * @file packages/core/tests/tax-golden-2025-2026.test.js
 * @description Golden scenarios (Tokyo, single, salary only, age 30) cho 令和7年分 và 令和8年分,
 * cùng test render bảng kê TaxBreakdownTable (không NaN/undefined, các dòng cộng đúng tổng mục).
 *
 * Giá trị kỳ vọng được tính tay:
 * - 給与所得控除 (No.1410), 基礎控除 (No.1199: R7 bậc 95/88/68/63/58万; R8 104/67/62万)
 * - BHXH theo 標準報酬月額 (年収÷12), 協会けんぽ 東京 R7 9.91% (3月分〜) / R8 9.85% (2026年3月分〜),
 *   子ども・子育て支援金 0.23% từ 2026年4月分, 雇用保険 R6 6/1000 → R7 5.5/1000 → R8 5/1000 (từ tháng 4).
 * - 所得税 = floor((基準所得税額 + floor(基準×2.1%)) / 100) × 100
 * - 住民税: 県4% / 市6% trừ 調整控除 (2,500円), mỗi phần làm tròn 100円, 均等割 4,000 + 森林環境税 1,000.
 */

import assert from 'node:assert/strict';
import test from 'node:test';
import { mkdtempSync, rmSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

import { simulateJapanTaxes } from '../src/utils/tax/index.js';

const GOLDEN = [
  // year, salary, 健康保険, 社保合計, 所得税+復興, 住民税
  { year: 2025, salary: 3000000, health: 12883 * 12, social: 12883 * 12 + 23790 * 12 + 1500 * 3 + 1375 * 9, incomeTax: 34800, residentTax: 115700 },
  { year: 2025, salary: 4500000, health: 18829 * 12, social: 18829 * 12 + 34770 * 12 + 2250 * 3 + 2062 * 9, incomeTax: 82200, residentTax: 208500 },
  { year: 2025, salary: 8000000, health: 33694 * 12, social: 33694 * 12 + 59475 * 12 + 4000 * 3 + 3667 * 9, incomeTax: 442800, residentTax: 453000 },
  { year: 2026, salary: 3000000, health: 12883 * 2 + 12805 * 10, social: 153816 + 299 * 9 + 23790 * 12 + 1375 * 3 + 1250 * 9, incomeTax: 26600, residentTax: 115600 },
  { year: 2026, salary: 4500000, health: 18829 * 2 + 18715 * 10, social: 224808 + 437 * 9 + 34770 * 12 + 2062 * 3 + 1875 * 9, incomeTax: 74000, residentTax: 208500 },
  { year: 2026, salary: 8000000, health: 33694 * 2 + 33490 * 10, social: 402288 + 782 * 9 + 59475 * 12 + 3667 * 3 + 3333 * 9, incomeTax: 434400, residentTax: 453000 },
];

for (const g of GOLDEN) {
  test(`GOLDEN ${g.year}: Tokyo single salary ${g.salary.toLocaleString()} JPY`, () => {
    const r = simulateJapanTaxes({ year: g.year, profile: 'employee', prefecture: 'tokyo', age: 30, salary: g.salary });
    assert.equal(r.socialInsurance.healthInsurance, g.health, 'health insurance');
    assert.equal(r.socialInsurance.totalSocialInsurance, g.social, 'social insurance total');
    assert.equal(r.incomeTax.totalIncomeTax, g.incomeTax, 'income tax + reconstruction');
    assert.equal(r.residentTax.totalResidentTax, g.residentTax, 'resident tax');
    assert.equal(r.incomeTax.totalIncomeTax % 100, 0);
  });
}

test('GOLDEN 2026: 基礎控除 104万 applies up to 合計所得 489万 (no step at 132万/336万)', () => {
  // salary 4.5M → 給与所得 3,160,000 → R7 88万, R8 104万
  const r25 = simulateJapanTaxes({ year: 2025, salary: 4500000 });
  const r26 = simulateJapanTaxes({ year: 2026, salary: 4500000 });
  assert.equal(r25.incomeTax.deductions.basic, 880000);
  assert.equal(r26.incomeTax.deductions.basic, 1040000);
  // salary 8M → 給与所得 6,100,000 → R7 58万, R8 62万? No: 6.1M ≤ 6.55M → R7 63万, R8 67万
  const h25 = simulateJapanTaxes({ year: 2025, salary: 8000000 });
  const h26 = simulateJapanTaxes({ year: 2026, salary: 8000000 });
  assert.equal(h25.incomeTax.deductions.basic, 630000);
  assert.equal(h26.incomeTax.deductions.basic, 670000);
});

test('GOLDEN 2025: 給与所得控除 65万 flat up to 190万 (no 40%−10万 band)', () => {
  const r = simulateJapanTaxes({ year: 2025, salary: 1800000 });
  assert.equal(r.incomeTax.employmentDeduction, 650000);
  const r2 = simulateJapanTaxes({ year: 2025, salary: 1900001 });
  assert.equal(r2.incomeTax.employmentDeduction, Math.floor(1900001 * 0.3 + 80000));
  const r3 = simulateJapanTaxes({ year: 2026, salary: 2200000 });
  assert.equal(r3.incomeTax.employmentDeduction, 740000);
});

test('Spouse deduction phases by taxpayer income and spouse income', () => {
  // Taxpayer 合計所得 ≤900万, spouse 0 → 38万; spouse 100万 (R8) → 配偶者特別控除 36万
  const base = { year: 2026, salary: 6000000, hasSpouse: true };
  assert.equal(simulateJapanTaxes({ ...base, spouseIncome: 0 }).incomeTax.deductions.spouse, 380000);
  assert.equal(simulateJapanTaxes({ ...base, spouseIncome: 620000 }).incomeTax.deductions.spouse, 380000);
  assert.equal(simulateJapanTaxes({ ...base, spouseIncome: 1000000 }).incomeTax.deductions.spouse, 360000);
  assert.equal(simulateJapanTaxes({ ...base, spouseIncome: 1400000 }).incomeTax.deductions.spouse, 0);
  // R7: spouse 60万 > 58万 → 配偶者特別控除 38万 (58万超95万以下)
  assert.equal(simulateJapanTaxes({ ...base, year: 2025, spouseIncome: 600000 }).incomeTax.deductions.spouseType, 'spouse_special');
  // Taxpayer salary 12M → 給与所得 10,050,000 > 1,000万 → 0
  assert.equal(simulateJapanTaxes({ ...base, salary: 12000000, spouseIncome: 0 }).incomeTax.deductions.spouse, 0);
  // Taxpayer salary 11M → 給与所得 9,050,000 (900万超950万以下) → 26万
  assert.equal(simulateJapanTaxes({ ...base, salary: 11000000, spouseIncome: 0 }).incomeTax.deductions.spouse, 260000);
  // Resident tax: 33万 / 22万
  assert.equal(simulateJapanTaxes({ ...base, spouseIncome: 0 }).residentTax.deductionsResident.spouse, 330000);
  assert.equal(simulateJapanTaxes({ ...base, salary: 11000000, spouseIncome: 0 }).residentTax.deductionsResident.spouse, 220000);
});

test('Dependents: 特定扶養 63万 (住民税45万), 老人扶養 48万, 同居老親 58万', () => {
  const r = simulateJapanTaxes({ year: 2026, salary: 6000000, specificDependentsCount: 1, elderlyDependentsCount: 1, cohabitingElderlyParentsCount: 1 });
  assert.equal(r.incomeTax.deductions.dependents, 630000 + 480000 + 580000);
  assert.equal(r.residentTax.deductionsResident.dependents, 450000 + 380000 + 450000);
});

test('Filing necessity: secondary salary rule and computed tax', () => {
  const two = simulateJapanTaxes({ year: 2026, salary: 4500000, employersCount: 2, secondarySalary: 150000 });
  assert.equal(two.filingNecessity.status, 'NOT_REQUIRED');
  const twoHigh = simulateJapanTaxes({ year: 2026, salary: 4500000, employersCount: 2, secondarySalary: 250000 });
  assert.equal(twoHigh.filingNecessity.status, 'REQUIRED');
  const twoUnknown = simulateJapanTaxes({ year: 2026, salary: 4500000, employersCount: 2 });
  assert.equal(twoUnknown.filingNecessity.status, 'NEED_MORE_INFO');
  // Freelancer with small profit: no income tax → not REQUIRED
  const small = simulateJapanTaxes({ year: 2026, profile: 'freelance', businessRevenue: 1500000, businessExpenses: 200000 });
  assert.equal(small.incomeTax.totalIncomeTax, 0);
  assert.equal(small.filingNecessity.status, 'CONDITIONAL');
  const big = simulateJapanTaxes({ year: 2026, profile: 'freelance', businessRevenue: 5000000, businessExpenses: 1500000 });
  assert.equal(big.filingNecessity.status, 'REQUIRED');
});

// ---------------------------------------------------------------------------
// Render test: TaxBreakdownTable
// ---------------------------------------------------------------------------
test('TaxBreakdownTable renders real engine fields (no NaN/undefined) and rows sum to section totals', async (t) => {
  const esbuild = await import('esbuild');
  const here = dirname(fileURLToPath(import.meta.url));
  // Output inside the package so bare imports (react, lucide-react) resolve from node_modules
  const tmp = mkdtempSync(join(here, '.tmp-breakdown-'));
  t.after(() => rmSync(tmp, { recursive: true, force: true }));
  const outfile = join(tmp, 'render.mjs');
  await esbuild.build({
    stdin: {
      contents: `
        import React from 'react';
        import { renderToString } from 'react-dom/server';
        import TaxBreakdownTable from './src/components/tax/TaxBreakdownTable.jsx';
        export function render(result, lang) {
          return renderToString(React.createElement(TaxBreakdownTable, { result, lang, onSelectTaxDetail: () => {} }));
        }
      `,
      resolveDir: join(here, '..'),
      loader: 'jsx',
    },
    bundle: true,
    platform: 'node',
    format: 'esm',
    outfile,
    jsx: 'automatic',
    loader: { '.js': 'jsx' },
    external: ['react', 'react-dom', 'react-dom/server', 'lucide-react'],
    logLevel: 'silent',
  });
  const { render } = await import(pathToFileURL(outfile).href);

  const profiles = [
    { year: 2026, profile: 'employee', salary: 4500000, age: 45 },
    { year: 2025, profile: 'employee', salary: 8000000 },
    { year: 2026, profile: 'freelance', businessRevenue: 6000000, businessExpenses: 1500000 },
    { year: 2026, profile: 'sole_proprietor', businessRevenue: 12000000, businessExpenses: 3000000, isInvoiceRegistered: true },
  ];

  const yen = (html) => [...html.matchAll(/¥(-?[\d,]+)/g)].map((m) => Number(m[1].replace(/,/g, '')));

  for (const p of profiles) {
    const result = simulateJapanTaxes(p);
    for (const lang of ['ja', 'vi', 'en']) {
      const html = render(result, lang);
      assert.ok(!/NaN|undefined|null%/.test(html), `No NaN/undefined in ${p.profile} ${lang}`);
    }
    const html = render(result, 'ja');
    // Amount cells use this class; section totals are rendered separately
    const taxAmounts = [...html.matchAll(/text-right font-mono font-bold text-rose-700[^>]*>¥(-?[\d,]+)</g)].map((m) => Number(m[1].replace(/,/g, '')));
    const socialAmounts = [...html.matchAll(/text-right font-mono font-bold text-indigo-600[^>]*>¥(-?[\d,]+)</g)].map((m) => Number(m[1].replace(/,/g, '')));
    assert.equal(taxAmounts.reduce((a, b) => a + b, 0), result.summary.totalTaxes, `${p.profile}: tax rows sum`);
    assert.equal(socialAmounts.reduce((a, b) => a + b, 0), result.summary.totalSocialInsurance, `${p.profile}: social rows sum`);
    assert.ok(yen(html).length > 0);

    if (p.profile === 'employee') {
      assert.match(html, /厚生年金保険料/);
      assert.match(html, /雇用保険料/);
      if (p.year === 2026) assert.match(html, /子ども・子育て支援金/);
      assert.doesNotMatch(html, /0\.6% \(一般事業\)/);
    } else {
      assert.match(html, /国民健康保険料/);
      assert.match(html, /国民年金保険料/);
      assert.doesNotMatch(html, /16,980円/);
    }
  }
});

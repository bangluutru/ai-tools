/**
 * @file packages/core/tests/tax-resident.test.js
 * @description Unit tests cho residentTaxEngine (住民税, 均等割, 森林環境税, 非課税判定).
 */

import assert from 'node:assert/strict';
import test from 'node:test';

import { getTaxRules } from '../src/utils/tax/taxRulesRegistry.js';
import {
  calculateResidentTax,
  isResidentTaxExempt,
} from '../src/utils/tax/engines/residentTaxEngine.js';

test('isResidentTaxExempt detects low income single taxpayer exemption limit 450,000 JPY', () => {
  assert.equal(isResidentTaxExempt({ totalGrossIncome: 450000, dependentsCount: 0 }), true);
  assert.equal(isResidentTaxExempt({ totalGrossIncome: 450001, dependentsCount: 0 }), false);
  assert.equal(isResidentTaxExempt({ totalGrossIncome: 0, dependentsCount: 0 }), true);
});

test('calculateResidentTax computes 10% income levy minus 調整控除 + 均等割 4,000 + forest 1,000 JPY', () => {
  const rules = getTaxRules(2025);
  const result = calculateResidentTax({
    rules,
    prefecture: 'tokyo',
    totalGrossIncome: 3560000, // Lương 500 vạn sau khi trừ giảm trừ lương
    socialInsurancePaid: 750000,
    dependentsCount: 0,
    hasSpouse: false,
  });

  assert.equal(result.isExempt, false);
  assert.equal(result.prefectureName_ja, '東京都');

  // Khấu trừ cư trú: 基礎控除 430,000 + 社保 750,000 = 1,180,000 JPY
  assert.equal(result.deductionsResident.basic, 430000);
  assert.equal(result.deductionsResident.socialInsurance, 750000);

  // 課税所得 = 3,560,000 - 1,180,000 = 2,380,000 JPY
  assert.equal(result.taxableIncome, 2380000);

  // 調整控除: 課税所得 > 200万 → max(人的控除差 5万 − 38万, 5万) × 5% = 2,500 (県1,000 / 市1,500)
  assert.equal(result.adjustmentCredit.prefecture, 1000);
  assert.equal(result.adjustmentCredit.municipal, 1500);

  // 所得割: Tỉnh 95,200 − 1,000 = 94,200; Xã 142,800 − 1,500 = 141,300 (mỗi phần làm tròn 100円)
  assert.equal(result.prefectureIncomeLevy, 94200);
  assert.equal(result.municipalIncomeLevy, 141300);
  assert.equal(result.incomeLevy, 235500);

  // 均等割 標準 4,000 (県1,000 + 市3,000) + 森林環境税 1,000 = 5,000 JPY
  assert.equal(result.perCapitaFlat, 4000);
  assert.equal(result.forestryTax, 1000);

  // Tổng thuế cư trú: 235,500 + 4,000 + 1,000 = 240,500 JPY
  assert.equal(result.totalResidentTax, 240500);
});

test('calculateResidentTax handles prefecture with special environmental tax like Osaka', () => {
  const rules = getTaxRules(2025);
  const result = calculateResidentTax({
    rules,
    prefecture: 'osaka',
    totalGrossIncome: 2000000,
    socialInsurancePaid: 300000,
  });

  // Osaka: 均等割 4,000 + 大阪府森林環境税 300 = 4,300 JPY
  assert.equal(result.perCapitaFlat, 4300);
  assert.equal(result.perCapitaSurcharge, 300);
  assert.equal(result.forestryTax, 1000);
});

test('calculateResidentTax: 調整控除 when taxable income ≤ 2M and separate 所得割 / 均等割 thresholds', () => {
  const rules = getTaxRules(2026);
  // Single, gross 1,500,000, shaho 200,000 → taxable 870,000; credit = min(5万, 87万) × 5% = 2,500
  const r = calculateResidentTax({ rules, prefecture: 'tokyo', totalGrossIncome: 1500000, socialInsurancePaid: 200000 });
  assert.equal(r.taxableIncome, 870000);
  assert.equal(r.adjustmentCredit.total, 2500);
  assert.equal(r.prefectureIncomeLevy, 34800 - 1000); // 33,800
  assert.equal(r.municipalIncomeLevy, 52200 - 1500); // 50,700
  assert.equal(r.totalResidentTax, 33800 + 50700 + 4000 + 1000);

  // Family of 3 (spouse + 1 dependent): 均等割 limit 35万×3+10万+21万 = 1,360,000; 所得割 limit +32万 = 1,470,000
  const mid = calculateResidentTax({ rules, totalGrossIncome: 1400000, hasSpouse: true, dependentsCount: 1 });
  assert.equal(mid.isPerCapitaExempt, false);
  assert.equal(mid.isIncomeLevyExempt, true);
  assert.equal(mid.incomeLevy, 0);
  assert.equal(mid.totalResidentTax, 5000);
  const low = calculateResidentTax({ rules, totalGrossIncome: 1360000, hasSpouse: true, dependentsCount: 1 });
  assert.equal(low.totalResidentTax, 0);
});

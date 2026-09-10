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

test('calculateResidentTax computes standard 10% income levy + flat 5,000 + forest 1,000 JPY', () => {
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

  // 所得割: 10% -> 238,000 JPY (Tỉnh 4%: 95,200 JPY + Xã 6%: 142,800 JPY)
  assert.equal(result.prefectureIncomeLevy, 95200);
  assert.equal(result.municipalIncomeLevy, 142800);
  assert.equal(result.incomeLevy, 238000);

  // 均等割 5,000 + 森林環境税 1,000 = 6,000 JPY
  assert.equal(result.perCapitaFlat, 5000);
  assert.equal(result.forestryTax, 1000);

  // Tổng thuế cư trú: 238,000 + 5,000 + 1,000 = 244,000 JPY
  assert.equal(result.totalResidentTax, 244000);
});

test('calculateResidentTax handles prefecture with special environmental tax like Osaka', () => {
  const rules = getTaxRules(2025);
  const result = calculateResidentTax({
    rules,
    prefecture: 'osaka',
    totalGrossIncome: 2000000,
    socialInsurancePaid: 300000,
  });

  // Osaka has 5,300 JPY flat fee (includes 300 JPY local forest tax)
  assert.equal(result.perCapitaFlat, 5300);
  assert.equal(result.forestryTax, 1000);
});

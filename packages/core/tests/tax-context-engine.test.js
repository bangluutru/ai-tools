/**
 * @file packages/core/tests/tax-context-engine.test.js
 * @description Unit tests cho taxContextEngine (Profile detection, 確定申告判定).
 */

import assert from 'node:assert/strict';
import test from 'node:test';

import {
  assessFilingNecessity,
  inferApplicableTaxes,
  UserProfiles,
} from '../src/utils/tax/engines/taxContextEngine.js';

test('UserProfiles contains 6 defined profiles', () => {
  assert.equal(UserProfiles.length, 6);
  const ids = UserProfiles.map((p) => p.id);
  assert.deepEqual(ids, ['part_time', 'employee', 'employee_side', 'freelance', 'sole_proprietor', 'corporate']);
});

test('assessFilingNecessity returns REQUIRED for blue return sole proprietors', () => {
  const result = assessFilingNecessity({
    profile: 'sole_proprietor',
    hasBusinessIncome: true,
    isBlueReturn: true,
  });

  assert.equal(result.status, 'REQUIRED');
  assert.ok(result.reasons_ja.length > 0);
  assert.ok(result.reasons_vi.length > 0);
  assert.ok(result.reasons_en.length > 0);
});

test('assessFilingNecessity returns REQUIRED for employee with side income profit > 200,000 JPY', () => {
  const result = assessFilingNecessity({
    profile: 'employee_side',
    annualSalary: 5000000,
    hasYearEndAdjustment: true,
    sideIncomeProfit: 250000, // > 20 vạn yên
  });

  assert.equal(result.status, 'REQUIRED');
});

test('assessFilingNecessity returns NOT_REQUIRED for employee with side profit <= 200,000 JPY but includes local resident tax warning', () => {
  const result = assessFilingNecessity({
    profile: 'employee_side',
    annualSalary: 5000000,
    hasYearEndAdjustment: true,
    sideIncomeProfit: 150000, // <= 20 vạn yên
  });

  assert.equal(result.status, 'NOT_REQUIRED');
  assert.ok(result.residentTaxNote !== null, 'Must include resident tax caveat for side income <= 200,000 JPY');
  assert.ok(result.residentTaxNote.desc_ja.includes('住民税申告'));
  assert.ok(result.residentTaxNote.desc_vi.includes('Tòa thị chính'));
});

test('inferApplicableTaxes includes consumption and enterprise tax when sales > 10M for sole proprietor', () => {
  const taxes = inferApplicableTaxes('sole_proprietor', {
    businessRevenue: 15000000,
    businessIncome: 5000000,
    isInvoiceRegistered: true,
  });

  const ids = taxes.map((t) => t.id);
  assert.ok(ids.includes('income_tax'));
  assert.ok(ids.includes('resident_tax'));
  assert.ok(ids.includes('enterprise_tax'));
  assert.ok(ids.includes('consumption_tax'));
});

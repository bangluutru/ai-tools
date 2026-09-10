/**
 * @file packages/core/tests/tax-consumption.test.js
 * @description Unit tests cho consumptionTaxEngine (消費税, 簡易課税, 2割特例).
 */

import assert from 'node:assert/strict';
import test from 'node:test';

import { getTaxRules } from '../src/utils/tax/taxRulesRegistry.js';
import {
  calculateConsumptionTax,
  determineTaxableStatus,
} from '../src/utils/tax/engines/consumptionTaxEngine.js';

test('determineTaxableStatus correctly marks invoice registered taxpayer as taxable', () => {
  const status = determineTaxableStatus({
    basePeriodSales: 3000000,
    isInvoiceRegistered: true,
  });
  assert.equal(status.isTaxable, true);
  assert.equal(status.canUse20PercentRule, true);
});

test('determineTaxableStatus marks sales > 10M as taxable without 20% exception', () => {
  const status = determineTaxableStatus({
    basePeriodSales: 12000000,
    isInvoiceRegistered: false,
  });
  assert.equal(status.isTaxable, true);
  assert.equal(status.canUse20PercentRule, false);
});

test('calculateConsumptionTax with 2割特例 pays exactly 20% of output tax', () => {
  const rules = getTaxRules(2025);
  const result = calculateConsumptionTax({
    rules,
    taxableSales: 10000000, // 1,000万円
    isInvoiceRegistered: true,
    calcMethod: 'special_20',
  });

  // Output tax (10%): 1,000,000 JPY
  assert.equal(result.outputTax, 1000000);
  // Input tax credit (80%): 800,000 JPY
  assert.equal(result.inputTaxCredit, 800000);
  // Payable: 200,000 JPY
  assert.equal(result.payableTax, 200000);
});

test('calculateConsumptionTax with 簡易課税 for Service/IT (50% deemed purchase rate)', () => {
  const rules = getTaxRules(2025);
  const result = calculateConsumptionTax({
    rules,
    taxableSales: 10000000,
    basePeriodSales: 12000000,
    calcMethod: 'simplified',
    simplifiedCatId: 'cat5_service_it', // 50%
  });

  assert.equal(result.outputTax, 1000000);
  assert.equal(result.inputTaxCredit, 500000);
  assert.equal(result.payableTax, 500000);
});

test('calculateConsumptionTax returns zero when tax-exempt', () => {
  const rules = getTaxRules(2025);
  const result = calculateConsumptionTax({
    rules,
    taxableSales: 6000000,
    basePeriodSales: 5000000,
    isInvoiceRegistered: false,
  });

  assert.equal(result.isTaxable, false);
  assert.equal(result.payableTax, 0);
});

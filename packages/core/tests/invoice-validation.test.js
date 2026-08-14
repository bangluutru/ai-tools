import assert from 'node:assert/strict';
import test from 'node:test';

import {
  deriveInvoiceAmounts,
  isKnownInvoiceNumber,
  isUnsafeZipPath,
} from '../src/utils/invoice/validation.js';


test('never invents a tax rate when only the total is known', () => {
  assert.deepEqual(
    deriveInvoiceAmounts({ totalAmount: 1_080_000 }),
    { totalAmount: 1_080_000, amountBeforeTax: 0, vatAmount: 0 },
  );
});


test('derives only direct arithmetic from fields present in the document', () => {
  assert.deepEqual(
    deriveInvoiceAmounts({ amountBeforeTax: 1_000_000, vatAmount: 80_000 }),
    { totalAmount: 1_080_000, amountBeforeTax: 1_000_000, vatAmount: 80_000 },
  );
  assert.deepEqual(
    deriveInvoiceAmounts({ totalAmount: 1_080_000, amountBeforeTax: 1_000_000 }),
    { totalAmount: 1_080_000, amountBeforeTax: 1_000_000, vatAmount: 80_000 },
  );
});


test('detects unsafe ZIP paths and unknown invoice numbers', () => {
  assert.equal(isUnsafeZipPath('../invoice.xml'), true);
  assert.equal(isUnsafeZipPath('/absolute/invoice.xml'), true);
  assert.equal(isUnsafeZipPath('safe/invoice.xml'), false);
  assert.equal(isKnownInvoiceNumber('000123'), true);
  assert.equal(isKnownInvoiceNumber('N/A'), false);
});

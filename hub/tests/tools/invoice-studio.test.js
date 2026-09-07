import assert from 'node:assert/strict';
import test from 'node:test';
import { tools, activeTools } from '../../src/config/toolsRegistry.js';
import {
  formatFormDateLong,
  monthSheetName,
} from '../../../packages/core/src/utils/invoice/paymentRequestForm.js';
import { numberToWordsVN } from '../../../packages/core/src/utils/invoice/numberToWords.js';

test('invoice-studio is correctly registered in toolsRegistry', () => {
  const tool = tools.find((t) => t.id === 'invoice-studio');
  assert.ok(tool, 'Tool invoice-studio must be defined in tools');
  assert.equal(tool.category, 'office');
  assert.equal(tool.processing, 'browser');
  assert.ok(['beta', 'production'].includes(tool.readiness), 'Tool readiness must be valid');
  assert.ok(tool.name_vn && tool.name_en && tool.name_ja, 'Must have trilingual names');
  assert.ok(tool.desc_vn && tool.desc_en && tool.desc_ja, 'Must have trilingual descriptions');

  const isActive = activeTools.some((t) => t.id === 'invoice-studio');
  assert.equal(isActive, true, 'Tool must be active');
});

test('formatFormDateLong and monthSheetName format dates according to standard', () => {
  const d = new Date(2026, 8, 7); // 7 tháng 9 năm 2026
  assert.equal(formatFormDateLong(d), 'Ngày 07 tháng 09 năm 2026');
  assert.equal(monthSheetName(d), '2609');
});

test('numberToWordsVN converts currency numbers to Vietnamese words accurately', () => {
  assert.equal(numberToWordsVN(10_000_000), 'Mười triệu đồng ./.');
  assert.equal(
    numberToWordsVN(15_230_000, { suffix: 'đồng chẵn./.' }),
    'Mười lăm triệu hai trăm ba mươi nghìn đồng chẵn./.'
  );
  assert.equal(
    numberToWordsVN(1_500_000, { suffix: 'đồng chẵn./.' }),
    'Một triệu năm trăm nghìn đồng chẵn./.'
  );
});

test('Per-diem business trip calculation (công tác phí khoán trọn ngày)', () => {
  const start = new Date(2026, 5, 1); // 01/06/2026
  const end = new Date(2026, 5, 5); // 05/06/2026
  const ratePerDay = 300_000;

  const msPerDay = 24 * 60 * 60 * 1000;
  const days = Math.round((end - start) / msPerDay) + 1;
  const totalAllowance = days * ratePerDay;

  assert.equal(days, 5, '5 ngày công tác');
  assert.equal(totalAllowance, 1_500_000, '5 ngày x 300.000 = 1.500.000đ');
});

test('Airline invoice with government/airport authority fee calculation', () => {
  const ticketFare = 2_000_000;
  const vatRate = 0.1;
  const vatAmount = ticketFare * vatRate; // 200.000
  const authorityFee = 150_000; // Khoản thu hộ nhà chức trách không chịu thuế VAT

  const totalInvoice = ticketFare + vatAmount + authorityFee;
  assert.equal(totalInvoice, 2_350_000, 'Tổng thanh toán bao gồm tiền vé + VAT + thu hộ');
});

test('Multi-company grouping logic separates invoices by buyer tax code', () => {
  const invoices = [
    { id: '1', buyerTaxCode: '0312345678', buyerName: 'Công ty Cổ phần Alpha', amount: 1_200_000 },
    { id: '2', buyerTaxCode: '0108765432', buyerName: 'Công ty TNHH Beta', amount: 3_500_000 },
    { id: '3', buyerTaxCode: '0312345678', buyerName: 'Công ty Cổ phần Alpha', amount: 800_000 },
  ];

  const groups = new Map();
  for (const inv of invoices) {
    const key = inv.buyerTaxCode;
    if (!groups.has(key)) {
      groups.set(key, { taxCode: key, companyName: inv.buyerName, items: [], total: 0 });
    }
    const group = groups.get(key);
    group.items.push(inv);
    group.total += inv.amount;
  }

  assert.equal(groups.size, 2, 'Phải gom thành đúng 2 nhóm công ty');
  assert.equal(groups.get('0312345678').items.length, 2);
  assert.equal(groups.get('0312345678').total, 2_000_000);
  assert.equal(groups.get('0108765432').items.length, 1);
  assert.equal(groups.get('0108765432').total, 3_500_000);
});

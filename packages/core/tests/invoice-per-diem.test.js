import assert from 'node:assert/strict';
import test from 'node:test';

import {
  buildPerDiemRow,
  parseIsoDate,
  perDiemAmount,
  perDiemDays,
} from '../src/utils/invoice/perDiem.js';

const ISSUED_AT = new Date(2026, 5, 23);


test('counts the days of a trip as end minus start', () => {
  assert.equal(perDiemDays('2026-06-09', '2026-06-18'), 9);
  assert.equal(perDiemDays('2026-06-09', '2026-06-10'), 1);
});


test('a trip that does not move forward pays nothing', () => {
  assert.equal(perDiemDays('2026-06-09', '2026-06-09'), 0);
  assert.equal(perDiemDays('2026-06-18', '2026-06-09'), 0);
  assert.equal(perDiemDays('', '2026-06-18'), 0);
});


// Đổi giờ mùa hè làm phép trừ mốc thời gian lệch một phần ngày.
test('day counting survives a daylight saving shift', () => {
  assert.equal(perDiemDays('2026-03-01', '2026-04-01'), 31);
  assert.equal(perDiemDays('2026-10-01', '2026-11-01'), 31);
});


test('the amount is the day count times the daily rate', () => {
  assert.equal(perDiemAmount({ amountPerDay: 200_000, from: '2026-06-09', to: '2026-06-18' }), 1_800_000);
  assert.equal(perDiemAmount({ amountPerDay: 0, from: '2026-06-09', to: '2026-06-18' }), 0);
});


test('the row is dated the day the request is raised, not the trip', () => {
  const row = buildPerDiemRow({
    amountPerDay: 200_000, from: '2026-06-09', to: '2026-06-18', issuedAt: ISSUED_AT,
  });

  assert.equal(row.date, '23/06/2026');
  assert.equal(row.description, 'Công tác phí từ 09/06/2026 đến 18/06/2026');
  assert.equal(row.amount, 1_800_000);
  // Khoản khoán không có hóa đơn nên cột hóa đơn để trống.
  assert.equal(row.invoiceNo, '');
});


test('no row is produced while the fields are still incomplete', () => {
  assert.equal(buildPerDiemRow({ amountPerDay: 200_000, from: '2026-06-09', to: '', issuedAt: ISSUED_AT }), null);
  assert.equal(buildPerDiemRow({ amountPerDay: 0, from: '2026-06-09', to: '2026-06-18', issuedAt: ISSUED_AT }), null);
});


test('rejects dates that do not exist', () => {
  assert.equal(parseIsoDate('2026-02-31'), null);
  assert.equal(parseIsoDate('09/06/2026'), null);
  assert.equal(parseIsoDate('2026-06-09').getDate(), 9);
});

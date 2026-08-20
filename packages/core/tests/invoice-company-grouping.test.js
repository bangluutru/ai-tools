import assert from 'node:assert/strict';
import test from 'node:test';

import {
  buildFormsFromGroups,
  companyKeyOf,
  describeFormContent,
  groupInvoicesByCompany,
  parseFormDate,
  shortCompanyName,
} from '../src/utils/invoice/companyGrouping.js';
import { describeExpense, describeRoute } from '../src/utils/invoice/expenseCategory.js';

const HUMA = {
  buyer: 'CÔNG TY SẢN XUẤT VÀ THƯƠNG MẠI HUMA MEDICAL',
  buyerTax: '0101234567',
  buyerAddress: 'Số 107 ngõ 192 Lê Trọng Tấn, Hà Nội',
};
const GENKI = {
  buyer: 'CÔNG TY CỔ PHẦN GENKI FAMI VIỆT NAM',
  buyerTax: '0107654321',
  buyerAddress: 'Số 107 ngõ 192 Lê Trọng Tấn, Hà Nội',
};

const invoice = (overrides) => ({
  date: '14/06/2026',
  invoiceNo: '00000001',
  totalAmount: 100000,
  sellerName: 'Công ty CP Di chuyển Xanh',
  itemName: 'Cước vận chuyển hành khách',
  ...overrides,
});


test('invoices are grouped by the buyer tax code, not the buyer name', async () => {
  const groups = groupInvoicesByCompany([
    invoice({ ...HUMA }),
    // Cùng mã số thuế nhưng nhà cung cấp viết hoa/viết tắt khác nhau.
    invoice({ ...HUMA, buyer: 'Cty SX và TM HUMA MEDICAL', totalAmount: 50000 }),
    invoice({ ...GENKI, totalAmount: 25000 }),
  ]);

  assert.equal(groups.length, 2);
  const byTax = Object.fromEntries(groups.map((group) => [group.company.taxCode, group]));
  assert.equal(byTax['0101234567'].invoices.length, 2);
  assert.equal(byTax['0101234567'].total, 150000);
  assert.equal(byTax['0107654321'].total, 25000);
});


test('an invoice without a buyer falls into one clearly-unassigned group', async () => {
  const groups = groupInvoicesByCompany([invoice({}), invoice({ totalAmount: 1 })]);

  assert.equal(groups.length, 1);
  assert.equal(groups[0].key, companyKeyOf({}));
  assert.equal(groups[0].company.name, '');
});


test('a manual company key overrides what the invoice says', async () => {
  const groups = groupInvoicesByCompany([
    invoice({ ...HUMA }),
    invoice({ ...GENKI, companyKey: 'mst:0101234567' }),
  ]);

  assert.equal(groups.length, 1);
  assert.equal(groups[0].invoices.length, 2);
});


test('user edits to the company name and address win over the invoice', async () => {
  const groups = groupInvoicesByCompany([invoice({ ...HUMA })], {
    'mst:0101234567': { name: 'HUMA MEDICAL - CHI NHÁNH ĐÀ NẴNG', address: 'Số 46 Tô Hiệu, Đà Nẵng' },
  });

  assert.equal(groups[0].company.name, 'HUMA MEDICAL - CHI NHÁNH ĐÀ NẴNG');
  assert.equal(groups[0].company.address, 'Số 46 Tô Hiệu, Đà Nẵng');
});


test('form rows come out sorted by document date', async () => {
  const groups = groupInvoicesByCompany([
    invoice({ ...HUMA, date: '18/06/2026', invoiceNo: 'C' }),
    invoice({ ...HUMA, date: '09/06/2026', invoiceNo: 'A' }),
    invoice({ ...HUMA, date: '14/06/2026', invoiceNo: 'B' }),
  ]);
  const [form] = buildFormsFromGroups(groups);

  assert.deepEqual(form.rows.map((row) => row.invoiceNo), ['A', 'B', 'C']);
  assert.equal(form.content, 'Chi phí đi lại công tác từ 09/06/2026 đến 18/06/2026');
  assert.equal(form.label, 'HUMA MEDICAL');
});


test('a hand-typed expense note replaces the auto description', async () => {
  const groups = groupInvoicesByCompany([invoice({ ...HUMA, expenseNote: 'Phí đi lại nội thành' })]);
  const [form] = buildFormsFromGroups(groups);

  assert.equal(form.rows[0].description, 'Phí đi lại nội thành');
});


test('the payment content only claims a date range it could read', async () => {
  assert.equal(describeFormContent([{ date: '14/06/2026' }]), 'Chi phí đi lại công tác ngày 14/06/2026');
  assert.equal(describeFormContent([{ date: 'Chưa rõ ngày' }]), 'Chi phí đi lại công tác');
  assert.equal(parseFormDate('31/02/2026'), null);
  assert.equal(parseFormDate('2026-06-14'), null);
});


test('expenses are described the way the form words them', async () => {
  assert.equal(describeExpense({ sellerName: 'Công ty CP Hàng không Vietjet', route: 'HAN-HUI' }), 'Vé máy bay TP Hà Nội - TP Huế');
  assert.equal(describeExpense({ sellerName: 'Công ty CP Di chuyển Xanh' }), 'Phí đi lại');
  // "Cước vận chuyển hành khách" là taxi, không phải chuyển phát hàng hóa.
  assert.equal(describeExpense({ sellerName: 'Công ty CP Vận tải ABC', itemName: 'Cước vận chuyển hành khách' }), 'Phí đi lại');
  assert.equal(describeExpense({ sellerName: 'Viettel Post', itemName: 'Cước chuyển phát nhanh' }), 'Cước chuyển phát');
  assert.equal(describeExpense({ sellerName: 'Khách sạn Mường Thanh' }), 'Phòng khách sạn');
  assert.equal(describeExpense({ itemName: 'Tiền phòng nghỉ 2 đêm' }), 'Phòng khách sạn');
  assert.equal(describeExpense({ sellerName: 'Nhà hàng Sen Tây Hồ' }), 'Phí ăn uống tiếp khách');
  // Không nhận diện được thì ghi lại tên hàng hóa, dịch vụ chứ không đoán.
  assert.equal(describeExpense({ sellerName: 'Công ty ABC', itemName: 'Bàn ghế văn phòng' }), 'Bàn ghế văn phòng');
});


test('unknown airport codes are printed as-is instead of guessed', async () => {
  assert.equal(describeRoute('HAN-SGN'), 'TP Hà Nội - TP Hồ Chí Minh');
  assert.equal(describeRoute('HAN-ZZZ'), 'TP Hà Nội - ZZZ');
  assert.equal(describeRoute('HAN'), '');
});


test('the short company label drops the legal-form prefix', async () => {
  assert.equal(shortCompanyName('CÔNG TY CỔ PHẦN GENKI FAMI VIỆT NAM'), 'GENKI FAMI VIỆT NAM');
  assert.equal(shortCompanyName('CÔNG TY SẢN XUẤT VÀ THƯƠNG MẠI HUMA MEDICAL'), 'HUMA MEDICAL');
  assert.equal(shortCompanyName('CÔNG TY TNHH ABC'), 'ABC');
});


test('an extra row is appended after the last invoice of its company only', async () => {
  const groups = groupInvoicesByCompany([
    invoice({ ...HUMA, date: '18/06/2026', invoiceNo: 'B' }),
    invoice({ ...HUMA, date: '09/06/2026', invoiceNo: 'A' }),
    invoice({ ...GENKI }),
  ]);
  const perDiem = { date: '23/06/2026', description: 'Công tác phí từ 09/06/2026 đến 18/06/2026', amount: 1_800_000, invoiceNo: '' };
  const forms = buildFormsFromGroups(groups, { extraRows: { 'mst:0101234567': [perDiem] } });

  const huma = forms.find((form) => form.company.taxCode === '0101234567');
  const genki = forms.find((form) => form.company.taxCode === '0107654321');

  assert.deepEqual(huma.rows.map((row) => row.invoiceNo), ['A', 'B', '']);
  assert.equal(huma.rows.at(-1).amount, 1_800_000);
  // Khoản khoán chỉ vào giấy của một đơn vị, không nhân lên cho đơn vị khác.
  assert.equal(genki.rows.length, 1);
});


test('the payment content ignores the per diem row when reading the date range', async () => {
  const groups = groupInvoicesByCompany([invoice({ ...HUMA, date: '09/06/2026' })]);
  const perDiem = { date: '23/06/2026', description: 'Công tác phí', amount: 1_800_000, invoiceNo: '' };
  const [form] = buildFormsFromGroups(groups, { extraRows: { 'mst:0101234567': [perDiem] } });

  // Ngày lập giấy (23/06) không được kéo dài khoảng thời gian công tác.
  assert.equal(form.content, 'Chi phí đi lại công tác ngày 09/06/2026');
});

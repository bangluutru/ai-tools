import assert from 'node:assert/strict';
import test from 'node:test';

import { numberToWordsVN } from '../src/utils/invoice/numberToWords.js';

const check = (value, expected) => assert.equal(numberToWordsVN(value), expected, `sai ở ${value}`);


test('reads the leading group without a spurious "không trăm" or "linh"', () => {
  // Lỗi cũ đọc thành "Linh một tỷ" / "Linh một triệu" ngay trên chứng từ in ra.
  check(1_000_000_000, 'Một tỷ đồng ./.');
  check(1_000_000, 'Một triệu đồng ./.');
  check(1_000, 'Một nghìn đồng ./.');
  check(1, 'Một đồng ./.');
  check(1_234_567_890, 'Một tỷ hai trăm ba mươi bốn triệu năm trăm sáu mươi bảy nghìn tám trăm chín mươi đồng ./.');
});


test('keeps "không trăm linh" inside trailing groups so the value stays unambiguous', () => {
  check(2_000_005, 'Hai triệu không trăm linh năm đồng ./.');
  check(1_001, 'Một nghìn không trăm linh một đồng ./.');
  check(105_000_000, 'Một trăm linh năm triệu đồng ./.');
});


test('applies Vietnamese readings for mười, mươi, mốt and lăm', () => {
  check(10, 'Mười đồng ./.');
  check(11, 'Mười một đồng ./.');
  check(15, 'Mười lăm đồng ./.');
  check(21, 'Hai mươi mốt đồng ./.');
  check(25, 'Hai mươi lăm đồng ./.');
  check(101, 'Một trăm linh một đồng ./.');
  check(110, 'Một trăm mười đồng ./.');
  check(115, 'Một trăm mười lăm đồng ./.');
});


test('handles realistic invoice totals', () => {
  check(21_450_000, 'Hai mươi mốt triệu bốn trăm năm mươi nghìn đồng ./.');
  check(55_555_555, 'Năm mươi lăm triệu năm trăm năm mươi lăm nghìn năm trăm năm mươi lăm đồng ./.');
  check(500_000, 'Năm trăm nghìn đồng ./.');
  check(15_000_500, 'Mười lăm triệu năm trăm đồng ./.');
});


test('handles zero, decimals and negative amounts safely', () => {
  check(0, 'Không đồng ./.');
  check(null, 'Không đồng ./.');
  check(undefined, 'Không đồng ./.');
  // Số lẻ được làm tròn để chữ khớp với số tiền hiển thị.
  check(1_000_000.4, 'Một triệu đồng ./.');
  check(-5_000, 'Âm năm nghìn đồng ./.');
});

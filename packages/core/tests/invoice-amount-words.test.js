import assert from 'node:assert/strict';
import test from 'node:test';

import { parseVietnameseAmountWords } from '../src/utils/invoice/amountWords.js';
import { numberToWordsVN } from '../src/utils/invoice/numberToWords.js';

const check = (words, expected) => assert.equal(parseVietnameseAmountWords(words), expected, words);


test('reads the amount-in-words line printed on an invoice', () => {
  check('Hai mươi mốt triệu bốn trăm nghìn đồng', 21400000);
  check('Mười một triệu đồng chẵn', 11000000);
  check('Năm triệu đồng', 5000000);
  check('Năm trăm nghìn đồng', 500000);
  check('Một tỷ hai trăm ba mươi bốn triệu năm trăm sáu mươi bảy nghìn tám trăm chín mươi đồng', 1234567890);
});


test('handles linh, mốt, lăm, tư and mười versus mươi', () => {
  check('Hai triệu không trăm linh năm đồng', 2000005);
  check('Một nghìn không trăm linh một đồng', 1001);
  check('Mười lăm đồng', 15);
  check('Hai mươi mốt đồng', 21);
  check('Hai mươi tư đồng', 24);
  check('Hai mươi lăm nghìn đồng', 25000);
  check('Năm mươi lăm triệu năm trăm năm mươi lăm nghìn năm trăm năm mươi lăm đồng', 55555555);
});


test('accepts ngàn as a synonym of nghìn and ignores trailing notes', () => {
  check('Năm trăm ngàn đồng', 500000);
  check('Mười một triệu đồng chẵn ./.', 11000000);
  check('Không đồng ./.', 0);
});


test('returns null when no Vietnamese number words are present', () => {
  assert.equal(parseVietnameseAmountWords(''), null);
  assert.equal(parseVietnameseAmountWords('.....................'), null);
  assert.equal(parseVietnameseAmountWords(null), null);
});


// Hai chiều phải khớp nhau, nếu không phần đối chiếu chéo sẽ báo động giả.
test('round-trips against the number-to-words writer', () => {
  const amounts = [
    0, 1, 15, 21, 105, 1001, 500000, 2000005, 11000000, 15000500,
    21400000, 55555555, 105000000, 1000000000, 1234567890,
  ];

  for (const amount of amounts) {
    const words = numberToWordsVN(amount);
    assert.equal(parseVietnameseAmountWords(words), amount, `${amount} -> "${words}"`);
  }
});

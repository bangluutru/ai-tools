/**
 * Phân tích chuỗi GS1 dạng "(AI)giá trị(AI)giá trị" thành dữ liệu cho GS1-128.
 *
 * - AI độ dài cố định nối liền nhau; sau AI độ dài biến đổi (trừ phần tử cuối)
 *   phải chèn ký tự FNC1 làm dấu phân cách (GS1 General Specifications §5.4.7).
 * - JsBarcode (option `ean128: true`) tự thêm FNC1 đầu mã; FNC1 phân cách được
 *   truyền bằng ký tự \xCF (207) mà JsBarcode CODE128 hiểu là FNC1.
 * Bảng AI dưới đây là tập con hay dùng trong bán lẻ/logistics, không phải toàn bộ.
 */
export const GS1_FNC1 = String.fromCharCode(207);

// kind: 'N' = chỉ số, 'X' = bộ ký tự GS1 (ASCII in được); fixed = độ dài cố định; max = tối đa.
const AI_TABLE = {
  '00': { kind: 'N', fixed: 18, check: true, title: 'SSCC' },
  '01': { kind: 'N', fixed: 14, check: true, title: 'GTIN' },
  '02': { kind: 'N', fixed: 14, check: true, title: 'CONTENT' },
  10: { kind: 'X', max: 20, title: 'BATCH/LOT' },
  11: { kind: 'N', fixed: 6, date: true, title: 'PROD DATE' },
  12: { kind: 'N', fixed: 6, date: true, title: 'DUE DATE' },
  13: { kind: 'N', fixed: 6, date: true, title: 'PACK DATE' },
  15: { kind: 'N', fixed: 6, date: true, title: 'BEST BEFORE' },
  16: { kind: 'N', fixed: 6, date: true, title: 'SELL BY' },
  17: { kind: 'N', fixed: 6, date: true, title: 'USE BY' },
  20: { kind: 'N', fixed: 2, title: 'VARIANT' },
  21: { kind: 'X', max: 20, title: 'SERIAL' },
  22: { kind: 'X', max: 20, title: 'CPV' },
  240: { kind: 'X', max: 30, title: 'ADDITIONAL ID' },
  241: { kind: 'X', max: 30, title: 'CUST. PART No.' },
  250: { kind: 'X', max: 30, title: 'SECONDARY SERIAL' },
  30: { kind: 'N', max: 8, title: 'VAR. COUNT' },
  37: { kind: 'N', max: 8, title: 'COUNT' },
  400: { kind: 'X', max: 30, title: 'ORDER NUMBER' },
  401: { kind: 'X', max: 30, title: 'GINC' },
  402: { kind: 'N', fixed: 17, check: true, title: 'GSIN' },
  410: { kind: 'N', fixed: 13, check: true, title: 'SHIP TO LOC' },
  411: { kind: 'N', fixed: 13, check: true, title: 'BILL TO' },
  412: { kind: 'N', fixed: 13, check: true, title: 'PURCHASE FROM' },
  413: { kind: 'N', fixed: 13, check: true, title: 'SHIP FOR LOC' },
  414: { kind: 'N', fixed: 13, check: true, title: 'LOC No.' },
  420: { kind: 'X', max: 20, title: 'SHIP TO POST' },
  421: { kind: 'X', max: 12, title: 'SHIP TO POST' },
  422: { kind: 'N', fixed: 3, title: 'ORIGIN' },
  8005: { kind: 'N', fixed: 6, title: 'PRICE PER UNIT' },
  8020: { kind: 'X', max: 25, title: 'REF No.' },
  90: { kind: 'X', max: 30, title: 'INTERNAL' },
};

function lookupAi(ai) {
  if (AI_TABLE[ai]) return AI_TABLE[ai];
  // 310n–316n, 320n–369n: số đo thương mại, 6 chữ số, n = vị trí dấu thập phân.
  if (/^3[1-6]\d\d$/.test(ai)) {
    const group = Number(ai.slice(0, 3));
    if ((group >= 310 && group <= 316) || (group >= 320 && group <= 369)) {
      return { kind: 'N', fixed: 6, title: 'MEASURE' };
    }
  }
  // 91–99: thông tin nội bộ công ty.
  if (/^9[1-9]$/.test(ai)) return { kind: 'X', max: 90, title: 'INTERNAL' };
  return null;
}

// Bộ ký tự GS1 AI encodable character set 82 (ASCII in được, trừ một số dấu).
const GS1_CSET82 = /^[!"%&'()*+,\-./0-9:;<=>?A-Z_a-z]+$/;

function gs1Check(digits) {
  let sum = 0;
  for (let i = digits.length - 1, w = 3; i >= 0; i--, w = w === 3 ? 1 : 3) sum += Number(digits[i]) * w;
  return (10 - (sum % 10)) % 10;
}

function isValidYymmdd(value) {
  const month = Number(value.slice(2, 4));
  const day = Number(value.slice(4, 6));
  if (month < 1 || month > 12) return false;
  if (day === 0) return true; // "00" = ngày cuối tháng (được GS1 cho phép)
  const year = 2000 + Number(value.slice(0, 2));
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  return day <= daysInMonth;
}

/**
 * @param {string} input vd "(01)09506000134352(17)261231(10)LOT42"
 * @returns {{ok:true,data:string,humanReadable:string,elements:Array}|{ok:false,errorCode:string,params:object}}
 */
export function parseGs1ElementString(input) {
  const source = String(input ?? '').trim();
  const pattern = /\((\d{2,4})\)([^()]*)/g;
  const elements = [];
  let consumed = 0;
  let match;
  while ((match = pattern.exec(source)) !== null) {
    if (match.index !== consumed) return { ok: false, errorCode: 'GS1_SYNTAX', params: {} };
    consumed = pattern.lastIndex;
    elements.push({ ai: match[1], value: match[2].trim() });
  }
  if (elements.length === 0 || consumed !== source.length) {
    return { ok: false, errorCode: 'GS1_SYNTAX', params: {} };
  }

  for (const el of elements) {
    const spec = lookupAi(el.ai);
    if (!spec) return { ok: false, errorCode: 'GS1_UNKNOWN_AI', params: { ai: el.ai } };
    el.spec = spec;
    const len = el.value.length;
    if (spec.fixed && len !== spec.fixed) {
      return { ok: false, errorCode: 'GS1_LENGTH', params: { ai: el.ai, expected: spec.fixed, actual: len } };
    }
    if (!spec.fixed && (len < 1 || len > spec.max)) {
      return { ok: false, errorCode: 'GS1_MAX_LENGTH', params: { ai: el.ai, max: spec.max, actual: len } };
    }
    if (spec.kind === 'N' && !/^\d+$/.test(el.value)) {
      return { ok: false, errorCode: 'GS1_NUMERIC', params: { ai: el.ai } };
    }
    if (spec.kind === 'X' && !GS1_CSET82.test(el.value)) {
      return { ok: false, errorCode: 'GS1_CHARS', params: { ai: el.ai } };
    }
    if (spec.date && !isValidYymmdd(el.value)) {
      return { ok: false, errorCode: 'GS1_DATE', params: { ai: el.ai } };
    }
    if (spec.check) {
      const expected = gs1Check(el.value.slice(0, -1));
      const actual = Number(el.value.slice(-1));
      if (expected !== actual) {
        return { ok: false, errorCode: 'GS1_CHECK_DIGIT', params: { ai: el.ai, expected, actual } };
      }
    }
  }

  let data = '';
  elements.forEach((el, idx) => {
    data += el.ai + el.value;
    const isLast = idx === elements.length - 1;
    if (!el.spec.fixed && !isLast) data += GS1_FNC1;
  });

  return {
    ok: true,
    data,
    humanReadable: elements.map((el) => `(${el.ai})${el.value}`).join(''),
    elements: elements.map(({ ai, value, spec }) => ({ ai, value, title: spec.title })),
  };
}

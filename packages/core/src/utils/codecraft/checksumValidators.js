import { parseGs1ElementString } from './gs1.js';

/**
 * Calculates GS1 standard Modulo 10 Check Digit
 * Used for EAN-13, EAN-8, UPC-A, ITF-14, SSCC, GLN
 */
export function calculateGS1CheckDigit(digits) {
  const clean = String(digits).replace(/\D/g, '');
  let sum = 0;
  const len = clean.length;
  for (let i = len - 1; i >= 0; i--) {
    const digit = parseInt(clean[i], 10);
    const weight = (len - 1 - i) % 2 === 0 ? 3 : 1;
    sum += digit * weight;
  }
  const remainder = sum % 10;
  return remainder === 0 ? 0 : 10 - remainder;
}

const MESSAGES = {
  vi: {
    EMPTY: 'Vui lòng nhập giá trị mã vạch',
    GTIN_CHARS: '{name} chỉ chấp nhận chữ số (được phép có khoảng trắng hoặc dấu gạch ngang)',
    GTIN_LENGTH: '{name} yêu cầu {short} chữ số (tự tính số kiểm tra) hoặc {long} chữ số (đã có số kiểm tra)',
    CHECK_DIGIT_MISMATCH:
      'Số kiểm tra không đúng: chữ số cuối là {actual} nhưng theo GS1 phải là {expected}. Mã {suggested} là một mã KHÁC — chỉ sửa nếu bạn chắc chắn đã gõ nhầm số cuối.',
    CODE39_CHARS: 'Code 39 chỉ chấp nhận chữ in hoa A–Z, số 0–9 và các ký tự - . $ / + % và khoảng trắng',
    CODE128_CHARS: 'Code 128 chỉ mã hoá được ký tự ASCII (không dấu). Hãy bỏ dấu tiếng Việt hoặc dùng mã QR.',
    PHARMA_RANGE: 'Pharmacode chỉ nhận số nguyên từ 3 đến 131070',
    CODABAR_FORMAT: 'Codabar phải bắt đầu và kết thúc bằng ký tự A, B, C hoặc D (ví dụ: A123456B)',
    MSI_DIGITS: 'MSI Plessey chỉ chấp nhận các chữ số (0-9)',
    GS1_SYNTAX: 'GS1-128 cần dạng (AI)giá trị, ví dụ (01)09506000134352(17)261231(10)LOT42',
    GS1_UNKNOWN_AI: 'AI ({ai}) chưa được hỗ trợ trong công cụ này',
    GS1_LENGTH: 'AI ({ai}) yêu cầu {expected} ký tự, bạn nhập {actual}',
    GS1_MAX_LENGTH: 'AI ({ai}) tối đa {max} ký tự, bạn nhập {actual}',
    GS1_NUMERIC: 'AI ({ai}) chỉ chấp nhận chữ số',
    GS1_CHARS: 'AI ({ai}) chứa ký tự không nằm trong bộ ký tự GS1 (chỉ ASCII không dấu)',
    GS1_DATE: 'AI ({ai}) phải là ngày hợp lệ dạng YYMMDD',
    GS1_CHECK_DIGIT: 'AI ({ai}): số kiểm tra phải là {expected} (đang là {actual})',
  },
  en: {
    EMPTY: 'Please enter a barcode value',
    GTIN_CHARS: '{name} accepts digits only (spaces or hyphens are allowed)',
    GTIN_LENGTH: '{name} requires {short} digits (check digit computed) or {long} digits (check digit included)',
    CHECK_DIGIT_MISMATCH:
      'Wrong check digit: the last digit is {actual} but GS1 requires {expected}. {suggested} is a DIFFERENT code — only fix it if you are sure you mistyped the last digit.',
    CODE39_CHARS: 'Code 39 accepts A–Z, 0–9, space and - . $ / + % only',
    CODE128_CHARS: 'Code 128 can only encode ASCII characters. Remove diacritics or use a QR code.',
    PHARMA_RANGE: 'Pharmacode accepts whole numbers from 3 to 131070',
    CODABAR_FORMAT: 'Codabar must start and end with A, B, C or D (e.g. A123456B)',
    MSI_DIGITS: 'MSI Plessey accepts digits (0-9) only',
    GS1_SYNTAX: 'GS1-128 expects (AI)value pairs, e.g. (01)09506000134352(17)261231(10)LOT42',
    GS1_UNKNOWN_AI: 'AI ({ai}) is not supported by this tool',
    GS1_LENGTH: 'AI ({ai}) requires {expected} characters, got {actual}',
    GS1_MAX_LENGTH: 'AI ({ai}) allows at most {max} characters, got {actual}',
    GS1_NUMERIC: 'AI ({ai}) accepts digits only',
    GS1_CHARS: 'AI ({ai}) contains characters outside the GS1 character set (plain ASCII only)',
    GS1_DATE: 'AI ({ai}) must be a valid YYMMDD date',
    GS1_CHECK_DIGIT: 'AI ({ai}): check digit must be {expected} (got {actual})',
  },
  ja: {
    EMPTY: 'バーコードの値を入力してください',
    GTIN_CHARS: '{name}は数字のみ入力できます（スペース・ハイフンは可）',
    GTIN_LENGTH: '{name}は{short}桁（チェックデジットを自動計算）または{long}桁（チェックデジット込み）が必要です',
    CHECK_DIGIT_MISMATCH:
      'チェックデジットが正しくありません：末尾は{actual}ですが、GS1では{expected}になります。{suggested}は別のコードです。末尾の入力ミスが確実な場合のみ修正してください。',
    CODE39_CHARS: 'Code 39で使えるのはA–Z、0–9、スペース、- . $ / + % のみです',
    CODE128_CHARS: 'Code 128はASCII文字のみ符号化できます。QRコードをご利用ください。',
    PHARMA_RANGE: 'Pharmacodeは3〜131070の整数のみです',
    CODABAR_FORMAT: 'CodabarはA・B・C・Dのいずれかで始まり終わる必要があります（例：A123456B）',
    MSI_DIGITS: 'MSI Plesseyは数字（0-9）のみです',
    GS1_SYNTAX: 'GS1-128は(AI)値の形式で入力してください。例：(01)09506000134352(17)261231(10)LOT42',
    GS1_UNKNOWN_AI: 'AI ({ai}) はこのツールでは未対応です',
    GS1_LENGTH: 'AI ({ai}) は{expected}文字が必要です（入力：{actual}文字）',
    GS1_MAX_LENGTH: 'AI ({ai}) は最大{max}文字です（入力：{actual}文字）',
    GS1_NUMERIC: 'AI ({ai}) は数字のみです',
    GS1_CHARS: 'AI ({ai}) にGS1文字セット外の文字が含まれています（ASCIIのみ）',
    GS1_DATE: 'AI ({ai}) はYYMMDD形式の有効な日付が必要です',
    GS1_CHECK_DIGIT: 'AI ({ai}) のチェックデジットは{expected}です（入力：{actual}）',
  },
};

export function barcodeMessage(code, params = {}, lang = 'vi') {
  const table = MESSAGES[lang] || MESSAGES.vi;
  const template = table[code] || MESSAGES.vi[code] || code;
  return template.replace(/\{(\w+)\}/g, (_, key) => (key in params ? String(params[key]) : `{${key}}`));
}

const GTIN_RULES = {
  EAN13: { name: 'EAN-13', long: 13 },
  EAN8: { name: 'EAN-8', long: 8 },
  UPC: { name: 'UPC-A', long: 12 },
  ITF14: { name: 'ITF-14', long: 14 },
};

function fail(code, params, lang, extra = {}) {
  return { isValid: false, errorCode: code, error: barcodeMessage(code, params, lang), ...extra };
}

function validateGtin(symbology, trimmed, lang) {
  const rule = GTIN_RULES[symbology];
  const short = rule.long - 1;
  if (!/^[\d\s-]+$/.test(trimmed)) {
    return fail('GTIN_CHARS', { name: rule.name }, lang, { value: trimmed });
  }
  const digits = trimmed.replace(/\D/g, '');
  if (digits.length === short) {
    const check = calculateGS1CheckDigit(digits);
    // Chỉ THÊM số kiểm tra còn thiếu — không thay đổi số người dùng đã nhập.
    return { isValid: true, value: digits + check, autoFixed: true, computedCheckDigit: check };
  }
  if (digits.length === rule.long) {
    const expected = calculateGS1CheckDigit(digits.slice(0, short));
    const actual = parseInt(digits[short], 10);
    if (expected !== actual) {
      const suggestedValue = digits.slice(0, short) + expected;
      // Không tự "sửa": một số kiểm tra sai thường nghĩa là gõ nhầm ở chỗ khác,
      // và mã sửa ra là một GTIN khác hẳn. Trả lỗi kèm gợi ý để người dùng tự quyết.
      return fail(
        'CHECK_DIGIT_MISMATCH',
        { actual, expected, suggested: suggestedValue },
        lang,
        { value: digits, expectedCheckDigit: expected, actualCheckDigit: actual, suggestedValue }
      );
    }
    return { isValid: true, value: digits };
  }
  return fail('GTIN_LENGTH', { name: rule.name, short, long: rule.long }, lang, { value: trimmed });
}

/**
 * Kiểm tra giá trị mã vạch trước khi đưa cho JsBarcode.
 * Kết quả hợp lệ có thể kèm `format`, `text`, `ean128` (GS1-128) để render.
 * Không bao giờ tự thay số kiểm tra sai bằng một số khác.
 */
export function validateAndFixBarcode(symbology, input, lang = 'vi') {
  const trimmed = String(input ?? '').trim();

  if (!trimmed) {
    return fail('EMPTY', {}, lang, { value: trimmed });
  }

  if (GTIN_RULES[symbology]) return validateGtin(symbology, trimmed, lang);

  switch (symbology) {
    case 'GS1_128': {
      const parsed = parseGs1ElementString(trimmed);
      if (!parsed.ok) return fail(parsed.errorCode, parsed.params, lang, { value: trimmed });
      return {
        isValid: true,
        value: parsed.data,
        text: parsed.humanReadable,
        format: 'CODE128',
        ean128: true,
        elements: parsed.elements,
      };
    }

    case 'CODE39': {
      const validChars = /^[0-9A-Z. $/+%-]+$/i;
      if (!validChars.test(trimmed)) return fail('CODE39_CHARS', {}, lang, { value: trimmed });
      return { isValid: true, value: trimmed.toUpperCase() };
    }

    case 'pharmacode': {
      if (!/^\d+$/.test(trimmed)) return fail('PHARMA_RANGE', {}, lang, { value: trimmed });
      const num = parseInt(trimmed, 10);
      if (num < 3 || num > 131070) return fail('PHARMA_RANGE', {}, lang, { value: trimmed });
      return { isValid: true, value: num.toString() };
    }

    case 'codabar': {
      const validCodabar = /^[A-D][0-9$:/.+-]+[A-D]$/i;
      if (!validCodabar.test(trimmed)) return fail('CODABAR_FORMAT', {}, lang, { value: trimmed });
      return { isValid: true, value: trimmed.toUpperCase() };
    }

    case 'MSI': {
      if (!/^\d+$/.test(trimmed)) return fail('MSI_DIGITS', {}, lang, { value: trimmed });
      return { isValid: true, value: trimmed };
    }

    case 'CODE128':
    default: {
      // JsBarcode CODE128 chỉ nhận ASCII 0–127; chữ có dấu sẽ làm nó ném lỗi.
      // eslint-disable-next-line no-control-regex
      if (!/^[\x00-\x7F]+$/.test(trimmed)) return fail('CODE128_CHARS', {}, lang, { value: trimmed });
      return { isValid: true, value: trimmed };
    }
  }
}

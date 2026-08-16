/**
 * Calculates GS1 standard Modulo 10 Check Digit
 * Used for EAN-13, EAN-8, UPC-A, ITF-14
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

export function validateAndFixBarcode(symbology, input) {
  const trimmed = String(input || '').trim();

  if (!trimmed) {
    return { isValid: false, value: trimmed, error: 'Vui lòng nhập giá trị mã vạch' };
  }

  switch (symbology) {
    case 'EAN13': {
      const digits = trimmed.replace(/\D/g, '');
      if (digits.length === 12) {
        const check = calculateGS1CheckDigit(digits);
        return { isValid: true, value: digits + check, autoFixed: true };
      } else if (digits.length === 13) {
        const expected = calculateGS1CheckDigit(digits.slice(0, 12));
        const actual = parseInt(digits[12], 10);
        if (expected !== actual) {
          return {
            isValid: true,
            value: digits.slice(0, 12) + expected,
            autoFixed: true,
            error: `Số kiểm tra cũ (${actual}) không đúng, đã tự động sửa thành (${expected})`,
          };
        }
        return { isValid: true, value: digits };
      }
      return {
        isValid: false,
        value: trimmed,
        error: 'EAN-13 yêu cầu chính xác 12 hoặc 13 chữ số',
      };
    }

    case 'EAN8': {
      const digits = trimmed.replace(/\D/g, '');
      if (digits.length === 7) {
        const check = calculateGS1CheckDigit(digits);
        return { isValid: true, value: digits + check, autoFixed: true };
      } else if (digits.length === 8) {
        const expected = calculateGS1CheckDigit(digits.slice(0, 7));
        const actual = parseInt(digits[7], 10);
        if (expected !== actual) {
          return {
            isValid: true,
            value: digits.slice(0, 7) + expected,
            autoFixed: true,
            error: `Số kiểm tra cũ (${actual}) không đúng, đã sửa thành (${expected})`,
          };
        }
        return { isValid: true, value: digits };
      }
      return {
        isValid: false,
        value: trimmed,
        error: 'EAN-8 yêu cầu chính xác 7 hoặc 8 chữ số',
      };
    }

    case 'UPC': {
      const digits = trimmed.replace(/\D/g, '');
      if (digits.length === 11) {
        const check = calculateGS1CheckDigit(digits);
        return { isValid: true, value: digits + check, autoFixed: true };
      } else if (digits.length === 12) {
        const expected = calculateGS1CheckDigit(digits.slice(0, 11));
        const actual = parseInt(digits[11], 10);
        if (expected !== actual) {
          return {
            isValid: true,
            value: digits.slice(0, 11) + expected,
            autoFixed: true,
            error: `Số kiểm tra UPC cũ (${actual}) sai, đã sửa thành (${expected})`,
          };
        }
        return { isValid: true, value: digits };
      }
      return {
        isValid: false,
        value: trimmed,
        error: 'UPC-A yêu cầu chính xác 11 hoặc 12 chữ số',
      };
    }

    case 'ITF14': {
      const digits = trimmed.replace(/\D/g, '');
      if (digits.length === 13) {
        const check = calculateGS1CheckDigit(digits);
        return { isValid: true, value: digits + check, autoFixed: true };
      } else if (digits.length === 14) {
        const expected = calculateGS1CheckDigit(digits.slice(0, 13));
        const actual = parseInt(digits[13], 10);
        if (expected !== actual) {
          return {
            isValid: true,
            value: digits.slice(0, 13) + expected,
            autoFixed: true,
            error: `Số kiểm tra ITF-14 sai, đã sửa thành (${expected})`,
          };
        }
        return { isValid: true, value: digits };
      }
      return {
        isValid: false,
        value: trimmed,
        error: 'ITF-14 (thùng carton vận chuyển) yêu cầu 13 hoặc 14 chữ số',
      };
    }

    case 'CODE39': {
      const validChars = /^[0-9A-Z. $/+%-]+$/i;
      if (!validChars.test(trimmed)) {
        return {
          isValid: false,
          value: trimmed,
          error: 'CODE39 chỉ chấp nhận chữ hoa, số và các ký tự: - . $ / + % và khoảng trắng',
        };
      }
      return { isValid: true, value: trimmed.toUpperCase() };
    }

    case 'pharmacode': {
      const num = parseInt(trimmed, 10);
      if (isNaN(num) || num < 3 || num > 131070) {
        return {
          isValid: false,
          value: trimmed,
          error: 'Pharmacode chỉ nhận số nguyên từ 3 đến 131070',
        };
      }
      return { isValid: true, value: num.toString() };
    }

    case 'codabar': {
      const validCodabar = /^[A-D][0-9$:/.+-]+[A-D]$/i;
      if (!validCodabar.test(trimmed)) {
        return {
          isValid: false,
          value: trimmed,
          error: 'Codabar phải bắt đầu và kết thúc bằng ký tự A, B, C hoặc D (Ví dụ: A123456B)',
        };
      }
      return { isValid: true, value: trimmed.toUpperCase() };
    }

    case 'MSI': {
      const digitsOnly = /^\d+$/;
      if (!digitsOnly.test(trimmed)) {
        return {
          isValid: false,
          value: trimmed,
          error: 'MSI Plessey chỉ chấp nhận các chữ số (0-9)',
        };
      }
      return { isValid: true, value: trimmed };
    }

    case 'CODE128':
    default: {
      return { isValid: true, value: trimmed };
    }
  }
}

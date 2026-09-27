/**
 * Các trường của hóa đơn XML theo định dạng chuẩn (Quyết định 1450/QĐ-TCT, dùng
 * cho TT78 và TT91) mà phần đọc tiền cần biết để không cộng sai:
 *
 *  - TTChung > DVTTe: đơn vị tiền tệ; TTChung > TGia: tỷ giá. Mọi cột tiền của
 *    hóa đơn ngoại tệ (TgTCThue, TgTThue, TgTTTBSo…) ghi bằng nguyên tệ.
 *  - TTChung > TTHDLQuan: thông tin hóa đơn liên quan. TCHDon = 1 là hóa đơn
 *    thay thế, 2 là hóa đơn điều chỉnh; KHMSHDCLQuan/KHHDCLQuan/SHDCLQuan/
 *    NLHDCLQuan là mẫu số, ký hiệu, số và ngày của hóa đơn bị thay thế/điều chỉnh.
 *
 * Các hàm nhận `getText(selectors)` thay vì một DOM để dùng được cả trong trình
 * duyệt lẫn trong test Node.
 */

const VND_CODES = new Set(['VND', 'VNĐ', 'VNDONG', 'DONG', 'ĐỒNG']);

/** Số trong XML theo kiểu xsd:decimal ("1234.5"), chấp nhận thêm dạng có dấu nhóm. */
export function parseXmlDecimal(value) {
  const text = String(value ?? '').trim();
  if (!text) return null;
  if (/^-?\d+(\.\d+)?$/.test(text)) return Number(text);
  const compact = text.replace(/[\s,]/g, '');
  if (/^-?\d+(\.\d+)?$/.test(compact)) return Number(compact);
  return null;
}

/**
 * @returns {{ currency: string, exchangeRate: number|null, isForeign: boolean }}
 */
export function readInvoiceCurrency(getText) {
  const raw = String(getText(['DVTTe', 'MaTienTe', 'CurrencyCode', 'Currency']) || '').trim();
  const currency = raw ? raw.toUpperCase() : 'VND';
  const rate = parseXmlDecimal(getText(['TGia', 'TyGia', 'ExchangeRate']));
  const isForeign = !VND_CODES.has(currency.replace(/\s+/g, ''));
  return {
    currency,
    exchangeRate: rate !== null && rate > 0 ? rate : null,
    isForeign,
  };
}

/**
 * Quy đổi các cột tiền của hóa đơn ngoại tệ sang đồng theo tỷ giá ghi trên hóa
 * đơn. Không có tỷ giá thì giữ nguyên số nguyên tệ và báo cần quy đổi tay.
 *
 * @param {Record<string, number>} amounts các cột tiền cần quy đổi
 * @param {{ currency: string, exchangeRate: number|null, isForeign: boolean }} currencyInfo
 * @returns {{ amounts: Record<string, number>, original: Record<string, number>|null, warnings: string[], converted: boolean }}
 */
export function convertForeignAmounts(amounts, currencyInfo) {
  if (!currencyInfo?.isForeign) {
    return { amounts: { ...amounts }, original: null, warnings: [], converted: false };
  }

  const { currency, exchangeRate } = currencyInfo;
  if (!exchangeRate) {
    return {
      amounts: { ...amounts },
      original: { ...amounts },
      converted: false,
      warnings: [
        `Hóa đơn lập bằng ngoại tệ ${currency} nhưng không có tỷ giá (TGia); số tiền đang là nguyên tệ, cần quy đổi sang VND trước khi dùng.`,
      ],
    };
  }

  const converted = Object.fromEntries(
    Object.entries(amounts).map(([key, value]) => [key, Math.round((Number(value) || 0) * exchangeRate)]),
  );
  return {
    amounts: converted,
    original: { ...amounts },
    converted: true,
    warnings: [
      `Hóa đơn lập bằng ngoại tệ ${currency}, tỷ giá ${exchangeRate.toLocaleString('vi-VN')}: số tiền đã quy đổi sang VND, cần đối chiếu với chứng từ gốc.`,
    ],
  };
}

/**
 * Thông tin hóa đơn liên quan (thay thế / điều chỉnh), hoặc null.
 *
 * @returns {null | { kind: 'replacement'|'adjustment', invoiceNo: string, symbol: string, formNo: string, date: string }}
 */
export function readInvoiceRelation(getText) {
  const nature = String(getText(['TTHDLQuan TCHDon', 'TTHDLQuan > TCHDon', 'TCHDon']) || '').trim();
  const invoiceNo = String(getText(['TTHDLQuan SHDCLQuan', 'SHDCLQuan']) || '').trim();
  let kind = null;
  if (nature === '1') kind = 'replacement';
  else if (nature === '2') kind = 'adjustment';
  if (!kind) return null;

  const formNo = String(getText(['TTHDLQuan KHMSHDCLQuan', 'KHMSHDCLQuan']) || '').trim();
  const series = String(getText(['TTHDLQuan KHHDCLQuan', 'KHHDCLQuan']) || '').trim();
  let date = String(getText(['TTHDLQuan NLHDCLQuan', 'NLHDCLQuan']) || '').trim().slice(0, 10);
  const iso = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  if (iso) date = `${iso[3]}/${iso[2]}/${iso[1]}`;

  return {
    kind,
    invoiceNo,
    symbol: `${formNo}${series}`,
    formNo,
    date,
  };
}

/** Câu cảnh báo mô tả hóa đơn liên quan để người dùng đối chiếu. */
export function describeInvoiceRelation(relation) {
  if (!relation) return '';
  const target = [
    relation.symbol ? `ký hiệu ${relation.symbol}` : '',
    relation.invoiceNo ? `số ${relation.invoiceNo}` : '',
    relation.date ? `ngày ${relation.date}` : '',
  ].filter(Boolean).join(', ') || 'không rõ số';
  return relation.kind === 'replacement'
    ? `Đây là hóa đơn thay thế cho hóa đơn ${target}; không được tính cả hóa đơn gốc.`
    : `Đây là hóa đơn điều chỉnh cho hóa đơn ${target}; số tiền là phần chênh so với hóa đơn gốc.`;
}

/**
 * Diễn giải khoản chi cho cột "Nội dung" của Giấy đề nghị thanh toán.
 *
 * Biểu mẫu ĐNTT ghi bản chất khoản chi ("Phí đi lại", "Phòng khách sạn", "Vé
 * máy bay Hà Nội - Huế") chứ không ghi tên người bán như bảng kê hóa đơn. Hàm
 * này suy ra nhãn đó từ tên người bán và tên hàng hóa, dịch vụ đọc được trên
 * hóa đơn; không đoán được thì trả lại chính tên hàng hóa, dịch vụ.
 */

import { foldText } from './vietnamInvoice.js';

/**
 * Mã sân bay IATA → tên thành phố như biểu mẫu ĐNTT vẫn ghi. Chỉ liệt kê các
 * điểm đến thực tế có trên chứng từ; mã lạ được giữ nguyên thay vì đoán bừa.
 */
export const AIRPORT_CITIES = Object.freeze({
  HAN: 'TP Hà Nội', SGN: 'TP Hồ Chí Minh', DAD: 'TP Đà Nẵng', HUI: 'TP Huế',
  CXR: 'Nha Trang', PQC: 'Phú Quốc', VII: 'Vinh', HPH: 'Hải Phòng',
  DLI: 'Đà Lạt', VCA: 'Cần Thơ', UIH: 'Quy Nhơn', THD: 'Thanh Hóa',
  VDO: 'Vân Đồn', BMV: 'Buôn Ma Thuột', PXU: 'Pleiku', TBB: 'Tuy Hòa',
  VCL: 'Chu Lai', CAH: 'Cà Mau', DIN: 'Điện Biên', VKG: 'Rạch Giá',
  VTE: 'Viêng Chăn', LPQ: 'Luang Prabang', PNH: 'Phnom Penh', REP: 'Siem Riep',
  BKK: 'Bangkok', DMK: 'Bangkok', SIN: 'Singapore', KUL: 'Kuala Lumpur',
  HKG: 'Hồng Kông', TPE: 'Đài Bắc', ICN: 'Seoul', PUS: 'Busan',
  NRT: 'Tokyo', HND: 'Tokyo', KIX: 'Osaka', NGO: 'Nagoya', FUK: 'Fukuoka',
  CTS: 'Sapporo', PVG: 'Thượng Hải', PEK: 'Bắc Kinh', CAN: 'Quảng Châu',
});

/** "HAN-HUI" → "TP Hà Nội - TP Huế"; mã không có trong bảng thì giữ nguyên. */
export function describeRoute(route) {
  const legs = String(route ?? '')
    .toUpperCase()
    .split(/[-–>]+/)
    .map((leg) => leg.trim())
    .filter(Boolean);
  if (legs.length < 2) return '';
  return legs.map((leg) => AIRPORT_CITIES[leg] ?? leg).join(' - ');
}

/** Thứ tự có ý nghĩa: nhóm đứng trước thắng khi hóa đơn khớp nhiều nhóm. */
const CATEGORIES = [
  {
    key: 'flight',
    label: 'Vé máy bay',
    keywords: [
      'vietjet', 'vietnam airlines', 'bamboo airways', 'pacific airlines',
      'hang khong', 've may bay', 'air ticket', 'e-ticket', 'eticket',
      'passenger ticket',
    ],
  },
  {
    key: 'ride',
    label: 'Phí đi lại',
    keywords: [
      'taxi', 'xanh sm', 'gsm', 'di chuyen xanh', 'grab', 'be group', 'mai linh',
      'vinasun', 'van tai hanh khach', 'van chuyen hanh khach', 'di lai',
      'dich vu van tai', 'xe hop dong', 'di chuyen',
    ],
  },
  {
    key: 'hotel',
    label: 'Phòng khách sạn',
    keywords: [
      'khach san', 'hotel', 'resort', 'homestay', 'luu tru', 'phong nghi',
      'room charge', 'accommodation', 'tien phong',
    ],
  },
  {
    key: 'meal',
    label: 'Phí ăn uống tiếp khách',
    keywords: [
      'nha hang', 'an uong', 'tiep khach', 'restaurant', 'cafe', 'ca phe',
      'quan an', 'do uong', 'food', 'beverage', 'suat an',
    ],
  },
  {
    key: 'fuel',
    label: 'Chi phí xăng dầu',
    keywords: ['xang dau', 'xang', 'petrolimex', 'nhien lieu', 'fuel', 'petrol'],
  },
  {
    key: 'toll',
    label: 'Phí cầu đường, gửi xe',
    keywords: [
      'cau duong', 'duong bo', 'thu phi', 'bot', 'gui xe', 'do xe', 'trong xe',
      'parking', 've cau',
    ],
  },
  {
    key: 'train',
    label: 'Vé tàu',
    keywords: ['duong sat', 've tau', 'railway', 'tau hoa'],
  },
  {
    key: 'health',
    label: 'Chi phí khám sức khỏe',
    keywords: ['kham suc khoe', 'benh vien', 'phong kham', 'y te', 'medical', 'clinic'],
  },
  {
    key: 'shipping',
    label: 'Cước chuyển phát',
    keywords: ['chuyen phat', 'buu chinh', 'viettel post', 'giao hang', 'van chuyen hang', 'express'],
  },
  {
    key: 'telecom',
    label: 'Cước viễn thông',
    keywords: ['vien thong', 'cuoc dien thoai', 'internet', 'vinaphone', 'mobifone', 'viettel telecom'],
  },
  {
    key: 'stationery',
    label: 'Chi phí văn phòng phẩm',
    keywords: ['van phong pham', 'stationery', 'giay in', 'muc in'],
  },
];

/** Chuỗi tra cứu gộp tên người bán và tên hàng hóa, dịch vụ, đã bỏ dấu. */
function haystack(invoice) {
  return foldText([
    invoice?.sellerName,
    invoice?.seller,
    invoice?.itemName,
  ].filter(Boolean).join(' | '));
}

export function classifyExpense(invoice) {
  const text = haystack(invoice);
  if (!text) return null;
  return CATEGORIES.find((category) => category.keywords.some((word) => text.includes(word))) ?? null;
}

/**
 * Nhãn khoản chi để điền vào cột "Nội dung". Vé máy bay ghi kèm chặng bay khi
 * hóa đơn có thông tin chặng, vì biểu mẫu vẫn phân biệt từng chặng.
 */
export function describeExpense(invoice) {
  const category = classifyExpense(invoice);

  if (category?.key === 'flight') {
    const route = describeRoute(invoice?.route);
    return route ? `Vé máy bay ${route}` : category.label;
  }

  if (category) return category.label;

  const itemName = String(invoice?.itemName || '').trim();
  if (itemName) return itemName.length > 90 ? `${itemName.slice(0, 90)}...` : itemName;

  const sellerName = String(invoice?.sellerName || invoice?.seller || '').trim();
  return sellerName || 'Chi phí khác';
}

export { CATEGORIES as EXPENSE_CATEGORIES };

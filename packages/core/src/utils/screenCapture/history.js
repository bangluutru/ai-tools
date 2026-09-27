/**
 * Lịch sử nháp của công cụ Chụp màn hình.
 *
 * - Chỉ lưu ảnh ĐÃ KẾT XUẤT (vùng che đã được áp dụng), không bao giờ lưu ảnh gốc.
 * - Khoá cũ `snapcraft_history` từng chứa ảnh chưa che nên bị xoá khi mở công cụ.
 * - localStorage chỉ có ~5 MB/origin; danh sách bị cắt bớt từ mục cũ nhất
 *   cho tới khi vừa ngân sách, thay vì im lặng ghi thất bại.
 */
export const HISTORY_STORAGE_KEY = 'snapcraft_history_v2';
export const LEGACY_HISTORY_KEYS = Object.freeze(['snapcraft_history']);
export const HISTORY_MAX_ITEMS = 8;
/** Ngân sách ký tự (UTF-16) cho chuỗi JSON — chừa chỗ cho miniapp khác. */
export const HISTORY_MAX_CHARS = 2_500_000;
/** Cạnh dài tối đa của ảnh lưu nháp. */
export const HISTORY_MAX_EDGE = 1600;

export function fitHistoryToBudget(items, maxChars = HISTORY_MAX_CHARS, maxItems = HISTORY_MAX_ITEMS) {
  let list = Array.isArray(items) ? items.slice(0, maxItems) : [];
  while (list.length > 0 && JSON.stringify(list).length > maxChars) {
    list = list.slice(0, -1);
  }
  return list;
}

/** Thêm/cập nhật một mục theo `id` (mỗi phiên chỉnh sửa giữ đúng một mục). */
export function upsertHistoryItem(items, item) {
  const rest = (Array.isArray(items) ? items : []).filter((entry) => entry.id !== item.id);
  return [item, ...rest];
}

export function readHistory(storage) {
  try {
    LEGACY_HISTORY_KEYS.forEach((key) => storage?.removeItem(key));
    const raw = storage?.getItem(HISTORY_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((it) => it && typeof it.dataUrl === 'string') : [];
  } catch {
    return [];
  }
}

/** @returns {Array} danh sách thực sự đã được lưu */
export function writeHistory(storage, items) {
  let list = fitHistoryToBudget(items);
  while (true) {
    try {
      if (list.length === 0) storage?.removeItem(HISTORY_STORAGE_KEY);
      else storage?.setItem(HISTORY_STORAGE_KEY, JSON.stringify(list));
      return list;
    } catch {
      if (list.length === 0) return list;
      list = list.slice(0, -1);
    }
  }
}

/** Kích thước thu nhỏ giữ tỷ lệ để cạnh dài ≤ maxEdge. */
export function scaleToFit(width, height, maxEdge = HISTORY_MAX_EDGE) {
  const longEdge = Math.max(width, height);
  if (!longEdge || longEdge <= maxEdge) return { width, height };
  const ratio = maxEdge / longEdge;
  return { width: Math.max(1, Math.round(width * ratio)), height: Math.max(1, Math.round(height * ratio)) };
}

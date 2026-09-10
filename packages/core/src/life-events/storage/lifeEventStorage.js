/**
 * @file packages/core/src/life-events/storage/lifeEventStorage.js
 * @description
 * Quản lý lưu trữ trạng thái tiến độ Checklist cho các sự kiện đời sống trên trình duyệt (Browser-First LocalStorage).
 * Đảm bảo cô lập namespace theo chuẩn `ai_tools_${lifeEventId}_checklist`, an toàn khi chạy trong SSR hoặc môi trường cấm cookies/storage.
 */

/**
 * Sinh storage key chuẩn theo namespace hệ sinh thái Toolio
 * @param {string} lifeEventId Mã định danh sự kiện (ví dụ: 'leaving-job', 'birth-wizard', 'moving-wizard')
 * @returns {string}
 */
export function getLifeEventStorageKey(lifeEventId) {
  const normalizedId = String(lifeEventId || 'default').trim().toLowerCase();
  return `ai_tools_${normalizedId}_checklist`;
}

/**
 * Helper an toàn để lấy đối tượng localStorage trong trình duyệt
 * @param {Storage} [customStorage]
 * @returns {Storage|null}
 */
function getSafeStorage(customStorage) {
  if (customStorage && typeof customStorage.getItem === 'function') {
    return customStorage;
  }
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      return window.localStorage;
    }
  } catch {
    // Trình duyệt bật bảo mật chặn storage (Private browsing/Security policy)
  }
  return null;
}

/**
 * Tải danh sách mã đầu việc đã hoàn thành từ bộ nhớ trình duyệt
 * @param {string} lifeEventId Mã định danh sự kiện
 * @param {Storage} [customStorage] Bộ nhớ tùy biến (dùng cho test)
 * @returns {string[]} Mảng các taskId đã hoàn thành
 */
export function loadCompletedTasks(lifeEventId, customStorage = null) {
  const storage = getSafeStorage(customStorage);
  if (!storage) return [];

  const key = getLifeEventStorageKey(lifeEventId);
  try {
    const raw = storage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed.filter((id) => typeof id === 'string' && id.trim().length > 0);
    }
  } catch {
    // Dữ liệu JSON bị hỏng, trả về mảng rỗng an toàn
  }
  return [];
}

/**
 * Lưu danh sách mã đầu việc đã hoàn thành vào bộ nhớ trình duyệt
 * @param {string} lifeEventId Mã định danh sự kiện
 * @param {string[]|Set<string>} completedIds Danh sách các taskId
 * @param {Storage} [customStorage]
 * @returns {boolean} Kết quả lưu thành công hay không
 */
export function saveCompletedTasks(lifeEventId, completedIds, customStorage = null) {
  const storage = getSafeStorage(customStorage);
  if (!storage) return false;

  const key = getLifeEventStorageKey(lifeEventId);
  try {
    const list = Array.from(completedIds || []).filter(
      (id) => typeof id === 'string' && id.trim().length > 0
    );
    storage.setItem(key, JSON.stringify(list));
    return true;
  } catch {
    return false;
  }
}

/**
 * Bật/tắt trạng thái hoàn thành của một đầu việc và lưu ngay vào storage
 * @param {string} lifeEventId Mã sự kiện
 * @param {string} taskId Mã đầu việc
 * @param {Storage} [customStorage]
 * @returns {string[]} Danh sách các taskId sau khi cập nhật
 */
export function toggleCompletedTask(lifeEventId, taskId, customStorage = null) {
  if (!taskId || typeof taskId !== 'string') {
    return loadCompletedTasks(lifeEventId, customStorage);
  }

  const currentList = loadCompletedTasks(lifeEventId, customStorage);
  const currentSet = new Set(currentList);

  if (currentSet.has(taskId)) {
    currentSet.delete(taskId);
  } else {
    currentSet.add(taskId);
  }

  const updatedList = Array.from(currentSet);
  saveCompletedTasks(lifeEventId, updatedList, customStorage);
  return updatedList;
}

/**
 * Xóa sạch trạng thái hoàn thành của sự kiện đời sống khỏi storage
 * @param {string} lifeEventId
 * @param {Storage} [customStorage]
 * @returns {boolean}
 */
export function clearCompletedTasks(lifeEventId, customStorage = null) {
  const storage = getSafeStorage(customStorage);
  if (!storage) return false;

  const key = getLifeEventStorageKey(lifeEventId);
  try {
    storage.removeItem(key);
    return true;
  } catch {
    return false;
  }
}

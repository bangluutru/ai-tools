/**
 * @file packages/core/src/japan/housing/engines/addressChangeEngine.js
 * @description
 * Engine tạo và quản lý Checklist đổi địa chỉ đa kênh (Japan Address Change Checklist Engine):
 * - Lọc danh mục thủ tục theo lối sống của người dùng (Bằng lái, Ô tô, Xe đạp, Internet, Thẻ...)
 * - Nhóm thủ tục theo mốc thời gian (Timing Bands) và theo nhóm dịch vụ (Categories)
 * - Tính toán tiến độ hoàn thành, cảnh báo các thủ tục bắt buộc có mặt (立会い) và rủi ro
 */

import {
  ADDRESS_CHANGE_CATEGORIES,
  TIMING_BANDS,
  ADDRESS_CHANGE_ITEMS_MASTER,
  ADDRESS_CHANGE_SOURCES,
} from '../rules/addressChangeRules.js';

/**
 * Thêm số ngày vào ngày cho trước
 * @param {Date} d
 * @param {number} days
 * @returns {Date}
 */
function addDays(d, days) {
  const res = new Date(d);
  res.setDate(res.getDate() + days);
  return res;
}

/**
 * Định dạng YYYY-MM-DD
 * @param {Date} d
 * @returns {string}
 */
function formatDate(d) {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Tính toán hạn chót dự kiến theo mốc thời gian
 * @param {Date} moveDateObj
 * @param {string} timingBandId
 * @returns {string}
 */
function computeTargetDate(moveDateObj, timingBandId) {
  switch (timingBandId) {
    case '1_month_prior':
      return formatDate(addDays(moveDateObj, -14));
    case '1_week_prior':
      return formatDate(addDays(moveDateObj, -3));
    case 'day_of_move':
      return formatDate(moveDateObj);
    case 'within_14_days':
      return formatDate(addDays(moveDateObj, 14));
    case 'post_move':
      return formatDate(addDays(moveDateObj, 30));
    default:
      return formatDate(moveDateObj);
  }
}

/**
 * Sinh danh sách công việc đổi địa chỉ cá nhân hóa
 * @param {Object} profile
 * @param {Object} checkedMap
 * @returns {Object}
 */
export function generateAddressChangeChecklist(profile = {}, checkedMap = {}) {
  const hasDriversLicense = Boolean(profile.hasDriversLicense !== false);
  const hasMyNumberCard = Boolean(profile.hasMyNumberCard !== false);
  const hasVehicle = Boolean(profile.hasVehicle);
  const hasBicycle = Boolean(profile.hasBicycle !== false);
  const hasFiberInternet = Boolean(profile.hasFiberInternet !== false);

  // Parse move date
  let moveDateObj = new Date();
  if (profile.moveDate) {
    const parsed = new Date(profile.moveDate);
    if (!isNaN(parsed.getTime())) {
      moveDateObj = parsed;
    }
  }
  moveDateObj.setHours(0, 0, 0, 0);

  // Filter applicable items
  const applicableItems = ADDRESS_CHANGE_ITEMS_MASTER.filter((item) => {
    if (item.condition === 'has_drivers_license' && !hasDriversLicense) return false;
    if (item.condition === 'has_my_number_card' && !hasMyNumberCard) return false;
    if (item.condition === 'has_vehicle' && !hasVehicle) return false;
    if (item.condition === 'has_bicycle' && !hasBicycle) return false;
    if (item.condition === 'has_fiber_internet' && !hasFiberInternet) return false;
    return true;
  });

  // Enrich items with state & metadata
  const items = applicableItems.map((item) => {
    const isCompleted = Boolean(checkedMap[item.id]);
    const category = ADDRESS_CHANGE_CATEGORIES[item.categoryId.toUpperCase()] || {
      id: item.categoryId,
      nameJa: item.categoryId,
      nameVi: item.categoryId,
      nameEn: item.categoryId,
    };
    const timingBand = Object.values(TIMING_BANDS).find((tb) => tb.id === item.timingBandId) || {
      id: item.timingBandId,
      labelJa: item.timingBandId,
      labelVi: item.timingBandId,
      labelEn: item.timingBandId,
      order: 99,
    };

    const targetDate = computeTargetDate(moveDateObj, item.timingBandId);

    return {
      ...item,
      isCompleted,
      category,
      timingBand,
      targetDate,
    };
  });

  // Stats
  const totalCount = items.length;
  const completedCount = items.filter((i) => i.isCompleted).length;
  const pendingCount = totalCount - completedCount;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
  const criticalPendingCount = items.filter((i) => !i.isCompleted && i.isCritical).length;

  // Group by Timing
  const timingOrderMap = Object.values(TIMING_BANDS).sort((a, b) => a.order - b.order);
  const byTiming = timingOrderMap
    .map((tb) => {
      const groupItems = items.filter((i) => i.timingBandId === tb.id);
      return {
        timingBand: tb,
        items: groupItems,
        total: groupItems.length,
        completed: groupItems.filter((i) => i.isCompleted).length,
      };
    })
    .filter((group) => group.items.length > 0);

  // Group by Category
  const byCategory = Object.values(ADDRESS_CHANGE_CATEGORIES)
    .map((cat) => {
      const groupItems = items.filter((i) => i.categoryId === cat.id);
      return {
        category: cat,
        items: groupItems,
        total: groupItems.length,
        completed: groupItems.filter((i) => i.isCompleted).length,
      };
    })
    .filter((group) => group.items.length > 0);

  return {
    items,
    stats: {
      totalCount,
      completedCount,
      pendingCount,
      progressPercent,
      criticalPendingCount,
    },
    byTiming,
    byCategory,
    moveDate: formatDate(moveDateObj),
    sources: ADDRESS_CHANGE_SOURCES,
  };
}

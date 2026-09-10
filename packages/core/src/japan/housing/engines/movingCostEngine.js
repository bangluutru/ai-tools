/**
 * @file packages/core/src/japan/housing/engines/movingCostEngine.js
 * @description
 * Động cơ ước tính chi phí chuyển nhà tại Nhật Bản (Japan Moving Cost Simulator Engine).
 * Tính toán minh bạch: Cước cơ bản, Hệ số cự ly, Hệ số mùa vụ, Giảm giá khung giờ, Phí dịch vụ cộng thêm,
 * Khoảng giá dự kiến (Tối thiểu - Trung bình - Tối đa), và Bảng biểu phí bồi thường hủy hợp đồng MLIT.
 */

import {
  HOUSEHOLD_TYPES,
  DISTANCE_BANDS,
  SEASONALITY,
  TIME_SLOTS,
  ADDON_SERVICES,
  CANCELLATION_FEE_SCHEDULE,
  COST_SAVING_TIPS,
  MOVING_COST_SOURCES,
} from '../rules/movingCostRules.js';

/**
 * Tự động phân giải mùa vụ dựa trên tháng chuyển nhà nếu người dùng chọn tháng
 * @param {number|string} month
 * @returns {typeof SEASONALITY[keyof typeof SEASONALITY]}
 */
export function resolveSeasonalityFromMonth(month) {
  const m = parseInt(month, 10);
  if (m === 3) return SEASONALITY.PEAK_HIGH;
  if (m === 4) return SEASONALITY.PEAK_LATE;
  if (m === 2) return SEASONALITY.PEAK_EARLY;
  return SEASONALITY.REGULAR;
}

/**
 * Tính toán chi phí chuyển nhà chi tiết
 * @param {Object} params
 * @param {string} [params.householdType='single_standard']
 * @param {string} [params.distanceBand='intra_city']
 * @param {string} [params.season] 'regular' | 'peak_early' | 'peak_high' | 'peak_late'
 * @param {number} [params.moveMonth] 1-12
 * @param {string} [params.timeSlot='free_time'] 'morning' | 'afternoon' | 'free_time'
 * @param {Object} [params.addons={}]
 * @param {number} [params.addons.airConditionerCount=0]
 * @param {boolean} [params.addons.hasPacking=false]
 * @param {boolean} [params.addons.hasUnpacking=false]
 * @param {boolean} [params.addons.hasPiano=false]
 * @param {boolean} [params.addons.hasBulkyWaste=false]
 * @returns {Object} Kết quả chi tiết báo giá và khuyến nghị
 */
export function calculateMovingCost(params = {}) {
  const safeParams = params && typeof params === 'object' ? params : {};

  // 1. Phân giải Quy mô hộ gia đình
  const householdKey = String(safeParams.householdType || 'single_standard').toUpperCase();
  const household = HOUSEHOLD_TYPES[householdKey] || HOUSEHOLD_TYPES.SINGLE_STANDARD;

  // 2. Phân giải Cự ly
  const distanceKey = String(safeParams.distanceBand || 'intra_city').toUpperCase();
  const distance = DISTANCE_BANDS[distanceKey] || DISTANCE_BANDS.INTRA_CITY;

  // 3. Phân giải Mùa vụ
  let season = SEASONALITY.REGULAR;
  if (safeParams.moveMonth) {
    season = resolveSeasonalityFromMonth(safeParams.moveMonth);
  } else if (safeParams.season) {
    const sKey = String(safeParams.season).toUpperCase();
    season = SEASONALITY[sKey] || SEASONALITY.REGULAR;
  }

  // 4. Phân giải Khung giờ
  const timeKey = String(safeParams.timeSlot || 'free_time').toUpperCase();
  const timeSlot = TIME_SLOTS[timeKey] || TIME_SLOTS.FREE_TIME;

  // 5. Tính toán cước cơ bản (Base Freight Rate)
  const isPeak = season.id !== 'regular';
  const rawBasePrice = isPeak ? household.basePricePeak : household.basePriceRegular;

  // Điều chỉnh theo cự ly và thời gian
  const distanceAdjustedPrice = Math.round(rawBasePrice * distance.distanceMultiplier) + distance.surchargeYen;
  const timedBaseFreight = Math.round(distanceAdjustedPrice * timeSlot.multiplier);

  // 6. Tính toán dịch vụ cộng thêm (Addons)
  const addonsInput = safeParams.addons || {};
  const airConditionerCount = Math.max(0, parseInt(addonsInput.airConditionerCount, 10) || 0);
  const airConditionerCost = airConditionerCount * ADDON_SERVICES.AIR_CONDITIONER_INSTALL.unitPrice;

  const packingCost = addonsInput.hasPacking ? ADDON_SERVICES.PACKING_SERVICE.unitPrice : 0;
  const unpackingCost = addonsInput.hasUnpacking ? ADDON_SERVICES.UNPACKING_SERVICE.unitPrice : 0;
  const pianoCost = addonsInput.hasPiano ? ADDON_SERVICES.PIANO_HEAVY_TRANSPORT.unitPrice : 0;
  const bulkyWasteCost = addonsInput.hasBulkyWaste ? ADDON_SERVICES.BULKY_WASTE_DISPOSAL.unitPrice : 0;

  const totalAddonsCost = airConditionerCost + packingCost + unpackingCost + pianoCost + bulkyWasteCost;

  // 7. Tổng chi phí tiêu chuẩn
  const estimatedAverageTotal = timedBaseFreight + totalAddonsCost;

  // Khoảng giá dao động (Tối thiểu khi đàm phán tốt ~85%, Tối đa khi sát ngày/cuối tuần ~125%)
  const minEstimate = Math.round((timedBaseFreight * 0.85) + totalAddonsCost);
  const maxEstimate = Math.round((timedBaseFreight * 1.25) + totalAddonsCost);

  // 8. Bảng phí hủy theo quy định Bộ Giao thông MLIT dựa trên cước cơ bản
  const cancellationFees = CANCELLATION_FEE_SCHEDULE.map((item) => ({
    ...item,
    calculatedFeeYen: Math.round(timedBaseFreight * item.feeRate),
  }));

  // 9. Danh mục phân rã các khoản chi tiết (Cost Breakdown)
  const breakdownItems = [
    {
      id: 'base_freight',
      labelJa: `基本運賃（${household.nameJa}・${timeSlot.nameJa}）`,
      labelVi: `Cước vận chuyển cơ bản (${household.nameVi} - ${timeSlot.nameVi})`,
      labelEn: `Base Freight (${household.nameEn} - ${timeSlot.nameEn})`,
      amountYen: timedBaseFreight,
    },
  ];

  if (distance.surchargeYen > 0 || distance.distanceMultiplier > 1.0) {
    breakdownItems.push({
      id: 'distance_factor',
      labelJa: `移動距離区分（${distance.nameJa}）`,
      labelVi: `Khoảng cách vận chuyển (${distance.nameVi})`,
      labelEn: `Distance Band (${distance.nameEn})`,
      multiplier: distance.distanceMultiplier,
      amountYen: distance.surchargeYen,
    });
  }

  if (season.multiplier > 1.0) {
    breakdownItems.push({
      id: 'seasonality_factor',
      labelJa: `繁忙期割増（${season.nameJa}）`,
      labelVi: `Phụ phí mùa vụ cao điểm (${season.nameVi})`,
      labelEn: `Peak Season Surcharge (${season.nameEn})`,
      multiplier: season.multiplier,
      amountYen: Math.round(timedBaseFreight - (timedBaseFreight / season.multiplier)),
    });
  }

  if (airConditionerCount > 0) {
    breakdownItems.push({
      id: 'air_conditioner',
      labelJa: `エアコン脱着工事（${airConditionerCount}台）`,
      labelVi: `Tháo & lắp điều hòa (${airConditionerCount} máy)`,
      labelEn: `Air Conditioner Removal & Install (${airConditionerCount} units)`,
      amountYen: airConditionerCost,
    });
  }

  if (packingCost > 0) {
    breakdownItems.push({
      id: 'packing_service',
      labelJa: '荷造り代行（小物梱包）',
      labelVi: 'Dịch vụ đóng gói đồ đạc hộ',
      labelEn: 'Packing Assistance',
      amountYen: packingCost,
    });
  }

  if (unpackingCost > 0) {
    breakdownItems.push({
      id: 'unpacking_service',
      labelJa: '開梱・荷解き代行',
      labelVi: 'Dịch vụ mở thùng & sắp xếp',
      labelEn: 'Unpacking Assistance',
      amountYen: unpackingCost,
    });
  }

  if (pianoCost > 0) {
    breakdownItems.push({
      id: 'piano_transport',
      labelJa: 'ピアノ・重量物運搬',
      labelVi: 'Vận chuyển đàn piano / đồ nặng',
      labelEn: 'Piano / Heavy Items',
      amountYen: pianoCost,
    });
  }

  if (bulkyWasteCost > 0) {
    breakdownItems.push({
      id: 'bulky_waste',
      labelJa: '不用品・粗大ゴミ処分代行',
      labelVi: 'Vứt đồ cũ cồng kềnh hộ',
      labelEn: 'Bulky Waste Disposal',
      amountYen: bulkyWasteCost,
    });
  }

  return {
    household,
    distance,
    season,
    timeSlot,
    estimates: {
      minEstimate,
      averageEstimate: estimatedAverageTotal,
      maxEstimate,
    },
    freightOnly: timedBaseFreight,
    totalAddonsCost,
    breakdownItems,
    cancellationFees,
    tips: COST_SAVING_TIPS,
    regulatorySources: MOVING_COST_SOURCES,
    summaryJa: `概算見積もり相場は 約 ${estimatedAverageTotal.toLocaleString()}円 （${minEstimate.toLocaleString()}円 〜 ${maxEstimate.toLocaleString()}円）です。推奨トラック: ${household.truckSizeJa}。`,
    summaryVi: `Chi phí ước tính khoảng ${estimatedAverageTotal.toLocaleString()}円 (từ ${minEstimate.toLocaleString()}円 đến ${maxEstimate.toLocaleString()}円). Xe khuyến nghị: ${household.truckSizeVi}.`,
    summaryEn: `Estimated moving cost is approx. ${estimatedAverageTotal.toLocaleString()} JPY (${minEstimate.toLocaleString()} - ${maxEstimate.toLocaleString()} JPY). Recommended truck: ${household.truckSizeEn}.`,
  };
}

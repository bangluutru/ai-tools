/**
 * @file packages/core/tests/regulatory-japan-housing-golden.test.js
 * @description Golden tests cho Tên miền Nhà ở & Chuyển nhà Nhật Bản (Japan Housing & Moving Domain).
 */

import assert from 'node:assert/strict';
import test from 'node:test';

import {
  // Moving Cost
  calculateMovingCost,
  resolveSeasonalityFromMonth,
  HOUSEHOLD_TYPES,
  DISTANCE_BANDS,
  SEASONALITY,
  TIME_SLOTS,
  ADDON_SERVICES,
} from '../src/japan/housing/index.js';

test('Milestone 4: 引越し費用シミュレーター (Moving Cost Simulator Golden Tests)', async (t) => {
  // Case 1: Single standard, intra-city, regular season, flexible time slot
  await t.test('M4-01: Độc thân đồ vừa (1K/1DK), cùng quận, mùa thường, giờ tự do: hưởng chiết khấu 20% khung giờ', () => {
    const result = calculateMovingCost({
      householdType: 'single_standard',
      distanceBand: 'intra_city',
      season: 'regular',
      timeSlot: 'free_time',
      addons: {},
    });

    // Cước cơ bản = 38,000 * 1.0 * 0.8 = 30,400 JPY
    assert.equal(result.freightOnly, 30400);
    assert.equal(result.totalAddonsCost, 0);
    assert.equal(result.estimates.averageEstimate, 30400);
    assert.equal(result.household.truckSizeJa, '2tショートトラック');
  });

  // Case 2: Seasonality auto-resolution from month
  await t.test('M4-02: Tự động phân giải mùa cao điểm (Tháng 3: peak_high 1.65x, Tháng 5: regular 1.0x)', () => {
    assert.equal(resolveSeasonalityFromMonth(3).id, 'peak_high');
    assert.equal(resolveSeasonalityFromMonth(4).id, 'peak_late');
    assert.equal(resolveSeasonalityFromMonth(2).id, 'peak_early');
    assert.equal(resolveSeasonalityFromMonth(5).id, 'regular');

    const marchResult = calculateMovingCost({
      householdType: 'single_standard',
      moveMonth: 3,
      timeSlot: 'morning',
    });

    assert.equal(marchResult.season.id, 'peak_high');
    assert.ok(marchResult.estimates.averageEstimate > 50000);
  });

  // Case 3: Distance band surcharge (Medium distance Tokyo-Osaka 200-500km)
  await t.test('M4-03: Vận chuyển trung cự (Tokyo - Osaka 200-500km): áp dụng hệ số cự ly 1.8 và phụ phí 45,000円', () => {
    const result = calculateMovingCost({
      householdType: 'single_standard',
      distanceBand: 'medium_distance',
      season: 'regular',
      timeSlot: 'morning',
    });

    // rawBasePrice = 38,000. distanceAdjusted = Math.round(38,000 * 1.8) + 45,000 = 68,400 + 45,000 = 113,400
    // timed = Math.round(113,400 * 1.05) = 119,070 JPY
    assert.equal(result.distance.distanceMultiplier, 1.8);
    assert.equal(result.distance.surchargeYen, 45000);
    assert.equal(result.freightOnly, 119070);
  });

  // Case 4: Addons calculation (2 máy lạnh + đóng gói)
  await t.test('M4-04: Tháo lắp 2 điều hòa (32,000円) + Dịch vụ đóng gói (22,000円): phụ phí chính xác 54,000円', () => {
    const result = calculateMovingCost({
      householdType: 'couple_standard',
      distanceBand: 'intra_city',
      season: 'regular',
      timeSlot: 'free_time',
      addons: {
        airConditionerCount: 2,
        hasPacking: true,
      },
    });

    assert.equal(result.totalAddonsCost, 54000);
    assert.equal(result.estimates.averageEstimate, result.freightOnly + 54000);
  });

  // Case 5: MLIT Cancellation Fee Schedule
  await t.test('M4-05: Biểu phí phạt hủy hợp đồng MLIT: Trước 3 ngày = 0円, Trước 2 ngày = 20%, Hôm trước = 30%, Trong ngày = 50%', () => {
    const result = calculateMovingCost({
      householdType: 'single_standard',
      distanceBand: 'intra_city',
      season: 'regular',
      timeSlot: 'free_time',
    });

    const fees = result.cancellationFees;
    assert.equal(fees.length, 4);

    // 3+ days prior: 0%
    assert.equal(fees[0].feeRate, 0);
    assert.equal(fees[0].calculatedFeeYen, 0);

    // 2 days prior: 20% of 30,400 = 6,080 JPY
    assert.equal(fees[1].feeRate, 0.2);
    assert.equal(fees[1].calculatedFeeYen, 6080);

    // 1 day prior: 30% of 30,400 = 9,120 JPY
    assert.equal(fees[2].feeRate, 0.3);
    assert.equal(fees[2].calculatedFeeYen, 9120);

    // Day of move: 50% of 30,400 = 15,200 JPY
    assert.equal(fees[3].feeRate, 0.5);
    assert.equal(fees[3].calculatedFeeYen, 15200);
  });

  // Case 6: Fallback and safe handling
  await t.test('M4-06: Xử lý an toàn khi tham số rỗng hoặc không hợp lệ: tự động rơi về mặc định', () => {
    const result = calculateMovingCost(null);
    assert.ok(result);
    assert.equal(result.household.id, 'single_standard');
    assert.equal(result.distance.id, 'intra_city');
    assert.ok(result.estimates.averageEstimate > 0);
  });
});

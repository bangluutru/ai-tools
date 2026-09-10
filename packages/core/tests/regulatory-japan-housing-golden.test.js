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

  // Moving Admin
  evaluateMovingAdminProcedures,
  STATUTORY_DEADLINES,

  // Address Change
  generateAddressChangeChecklist,
  ADDRESS_CHANGE_CATEGORIES,
  TIMING_BANDS,

  // Moving Wizard
  generateMovingWizardPlan,
  movingWizardRuntime,
  movingWizardDefinition,
  MOVING_STAGES,
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

test('Milestone 5: 引越し行政手続きナビ (Moving Admin Procedures Golden Tests)', async (t) => {
  // Case 1: Different municipality with My Number Card (One-Stop Eligible)
  await t.test('M5-01: Chuyển khác quận có thẻ My Number: đủ điều kiện Một Cửa MyNaPortal, Tenshutsu online, Tennyu bắt buộc trực tiếp', () => {
    const result = evaluateMovingAdminProcedures({
      movingType: 'different_municipality',
      hasMyNumberCard: true,
      moveDate: '2026-10-01',
    });

    assert.equal(result.onestop.eligible, true);
    assert.equal(result.onestop.canSubmitTenshutsuOnline, true);
    assert.equal(result.onestop.requiresPhysicalTennyu, true);
    assert.equal(result.deadlines.tenshutsuStart, '2026-09-17');
    assert.equal(result.deadlines.finalDeadline, '2026-10-15');

    const tenshutsuStep = result.steps.find((s) => s.id === 'step_tenshutsu');
    assert.ok(tenshutsuStep);
    assert.equal(tenshutsuStep.isOnline, true);

    const tennyuStep = result.steps.find((s) => s.id === 'step_tennyu');
    assert.ok(tennyuStep);
    assert.equal(tennyuStep.isOnline, false);
  });

  // Case 2: Different municipality WITHOUT My Number Card
  await t.test('M5-02: Chuyển khác quận KHÔNG có thẻ My Number: không dùng được Một Cửa, bắt buộc ra quầy cũ nhận Tenshutsu Shomeisho', () => {
    const result = evaluateMovingAdminProcedures({
      movingType: 'different_municipality',
      hasMyNumberCard: false,
      moveDate: '2026-10-01',
    });

    assert.equal(result.onestop.eligible, false);
    assert.equal(result.onestop.canSubmitTenshutsuOnline, false);

    const tenshutsuDoc = result.requiredDocuments.find((d) => d.id === 'tenshutsu_cert');
    assert.ok(tenshutsuDoc);
    assert.equal(tenshutsuDoc.mandatory, true);
  });

  // Case 3: Statutory 14-day deadline & Overdue warning
  await t.test('M5-03: Cảnh báo quá hạn 14 ngày luật định: phạt tiền đến 50.000円 theo Điều 52 Luật Sổ bộ Cư trú', () => {
    // Move date in the past (> 20 days ago)
    const result = evaluateMovingAdminProcedures({
      movingType: 'different_municipality',
      hasMyNumberCard: true,
      moveDate: '2026-01-01',
    });

    assert.equal(result.deadlines.isOverdue, true);
    assert.ok(result.deadlines.daysRemaining < 0);

    const dangerWarning = result.warnings.find((w) => w.level === 'danger');
    assert.ok(dangerWarning);
    assert.ok(dangerWarning.contentJa.includes('5万円'));
  });

  // Case 4: Household with Children (15-day rule for Child Allowance)
  await t.test('M5-04: Hộ có trẻ em: kích hoạt quy tắc đặc quyền 15 ngày nộp hồ sơ Trợ cấp Trẻ em (15日特例)', () => {
    const result = evaluateMovingAdminProcedures({
      movingType: 'different_municipality',
      hasChildren: true,
      moveDate: '2026-10-01',
    });

    const childStep = result.steps.find((s) => s.id === 'step_child_allowance');
    assert.ok(childStep);
    assert.equal(childStep.deadlineDate, '2026-10-16'); // 15 days from Oct 1

    const boshiDoc = result.requiredDocuments.find((d) => d.id === 'boshi_techo');
    assert.ok(boshiDoc);
  });

  // Case 5: Foreign Resident (Zairyu Card Endorsement)
  await t.test('M5-05: Người nước ngoài cư trú: bắt buộc in địa chỉ mới vào mặt sau Thẻ Ngoại Kiều trong 14 ngày', () => {
    const result = evaluateMovingAdminProcedures({
      movingType: 'different_municipality',
      isForeignResident: true,
      moveDate: '2026-10-01',
    });

    const zairyuStep = result.steps.find((s) => s.id === 'step_zairyu_endorsement');
    assert.ok(zairyuStep);

    const zairyuDoc = result.requiredDocuments.find((d) => d.id === 'zairyu_card');
    assert.ok(zairyuDoc);
  });

  // Case 6: Same municipality (Tenkyo)
  await t.test('M5-06: Chuyển trong cùng quận/thành phố: chỉ làm thủ tục Tenkyo trong 14 ngày, không phát sinh Tenshutsu', () => {
    const result = evaluateMovingAdminProcedures({
      movingType: 'same_municipality',
      moveDate: '2026-10-01',
    });

    assert.equal(result.isDifferentMunicipality, false);
    const tenkyoStep = result.steps.find((s) => s.id === 'step_tenkyo');
    assert.ok(tenkyoStep);
    assert.equal(result.steps.some((s) => s.id === 'step_tenshutsu'), false);
  });
});

test('Milestone 6: 住所変更チェックリスト (Address Change Checklist Golden Tests)', async (t) => {
  // Case 1: Full profile checklist generation
  await t.test('M6-01: Sinh checklist đầy đủ: bao gồm Bưu điện (e-Tenkyo), Điện, Ga, Nước, Internet, Bằng lái, Ngân hàng, Xe cộ', () => {
    const checklist = generateAddressChangeChecklist({
      hasDriversLicense: true,
      hasMyNumberCard: true,
      hasVehicle: true,
      hasBicycle: true,
      hasFiberInternet: true,
      moveDate: '2026-10-01',
    });

    assert.ok(checklist.items.length >= 10);
    assert.equal(checklist.stats.totalCount, checklist.items.length);
    assert.equal(checklist.stats.completedCount, 0);
    assert.equal(checklist.stats.progressPercent, 0);

    // Japan post
    const eTenkyo = checklist.items.find((i) => i.id === 'japan_post_e_tenkyo');
    assert.ok(eTenkyo);
    assert.equal(eTenkyo.isCritical, true);

    // Gas valve opening
    const gas = checklist.items.find((i) => i.id === 'gas_valve_opening');
    assert.ok(gas);
    assert.equal(gas.requiresPresence, true); // Bắt buộc có mặt
    assert.equal(gas.isCritical, true);
  });

  // Case 2: Vehicle condition filtering
  await t.test('M6-02: Lọc điều kiện: Người không có ô tô (hasVehicle: false) sẽ không xuất hiện thủ tục Đăng kiểm xe', () => {
    const checklist = generateAddressChangeChecklist({
      hasVehicle: false,
    });

    assert.equal(checklist.items.some((i) => i.id === 'vehicle_inspection_cert_change'), false);
  });

  // Case 3: Progress and completion tracking
  await t.test('M6-03: Theo dõi tiến độ: đánh dấu hoàn thành tính chính xác progressPercent và criticalPendingCount', () => {
    const checked = {
      japan_post_e_tenkyo: true,
      electricity_change: true,
    };

    const checklist = generateAddressChangeChecklist(
      {
        hasVehicle: false,
        hasBicycle: false,
      },
      checked
    );

    assert.equal(checklist.stats.completedCount, 2);
    assert.ok(checklist.stats.progressPercent > 0);

    const checkedPost = checklist.items.find((i) => i.id === 'japan_post_e_tenkyo');
    assert.equal(checkedPost.isCompleted, true);
  });

  // Case 4: Grouping by Timing Bands and Categories
  await t.test('M6-04: Phân nhóm trực quan: hiển thị đúng theo mốc thời gian (byTiming) và theo nhóm dịch vụ (byCategory)', () => {
    const checklist = generateAddressChangeChecklist({
      moveDate: '2026-10-01',
    });

    assert.ok(checklist.byTiming.length >= 3);
    assert.ok(checklist.byCategory.length >= 4);

    const lifelineGroup = checklist.byCategory.find((g) => g.category.id === 'lifeline');
    assert.ok(lifelineGroup);
    assert.ok(lifelineGroup.items.some((i) => i.id === 'gas_valve_opening'));
  });
});

test('Milestone 7: 引越し手続きガイド＆オーケストレーター (Moving Wizard & Life Event Foundation Golden Tests)', async (t) => {
  // Case 1: Cross-municipality family move with children and My Number
  await t.test('M7-01: Chuyển nhà khác quận/huyện, có con nhỏ, có My Number: đầy đủ 転出届 online, 転入届 14 ngày, và đặc lệ 15 ngày Trợ cấp Trẻ em', () => {
    const moveDate = '2026-10-15';
    const plan = generateMovingWizardPlan({
      moveDate,
      movingType: 'different_municipality',
      hasMyNumberCard: true,
      hasChildren: true,
      hasVehicle: true,
      hasFixedInternet: true,
      isForeignResident: true,
    });

    assert.equal(plan.profile.isSameMunicipality, false);
    assert.equal(plan.milestones.moveDate, '2026-10-15');
    assert.equal(plan.milestones.tennyuDeadlineDate, '2026-10-29'); // 14 ngày sau
    assert.equal(plan.milestones.childAllowanceDeadlineDate, '2026-10-30'); // 15 ngày sau

    // Critical Warnings
    const tennyuWarn = plan.warnings.find((w) => w.id === 'warning_tennyu_14days');
    assert.ok(tennyuWarn);
    assert.equal(tennyuWarn.severity, 'critical');

    const childWarn = plan.warnings.find((w) => w.id === 'warning_child_allowance_15days');
    assert.ok(childWarn);
    assert.equal(childWarn.severity, 'high');

    // Tasks
    const tenshutsu = plan.tasks.find((t) => t.id === 'task_tenshutsu_todoke');
    assert.ok(tenshutsu);
    assert.equal(tenshutsu.isApplicable, true);
    assert.ok(tenshutsu.customNoteJa.includes('オンラインで転出届を完結'));

    const childAllowanceTask = plan.tasks.find((t) => t.id === 'task_child_allowance_15day');
    assert.ok(childAllowanceTask);
    assert.equal(childAllowanceTask.isApplicable, true);
    assert.equal(childAllowanceTask.deadlineDate, '2026-10-30');

    const zairyuTask = plan.tasks.find((t) => t.id === 'task_zairyu_card_endorsement');
    assert.ok(zairyuTask);
    assert.equal(zairyuTask.isApplicable, true);
  });

  // Case 2: Intra-municipality move (same municipality)
  await t.test('M7-02: Chuyển nhà cùng quận: 転出届 không áp dụng, 転入 chuyển thành 転居届, trợ cấp trẻ em tự động cập nhật', () => {
    const plan = generateMovingWizardPlan({
      moveDate: '2026-11-01',
      movingType: 'same_municipality',
      hasMyNumberCard: false,
      hasChildren: true,
      hasVehicle: false,
    });

    assert.equal(plan.profile.isSameMunicipality, true);

    const tenshutsu = plan.tasks.find((t) => t.id === 'task_tenshutsu_todoke');
    assert.ok(tenshutsu);
    assert.equal(tenshutsu.isApplicable, false);

    const tenkyo = plan.tasks.find((t) => t.id === 'task_tennyu_todoke');
    assert.ok(tenkyo);
    assert.ok(tenkyo.titleJa.includes('転居届'));

    // Child allowance in same municipality does not need new certification claim
    const childAllowanceTask = plan.tasks.find((t) => t.id === 'task_child_allowance_15day');
    assert.ok(childAllowanceTask);
    assert.ok(childAllowanceTask.customNoteJa.includes('受給資格の新規認定請求は不要'));
  });

  // Case 3: Life Event Runtime capability resolution and deep linking
  await t.test('M7-03: Life Event Runtime phân giải chính xác Semantic Capabilities sang Tool IDs và Hash Routes', () => {
    const plan = generateMovingWizardPlan({
      moveDate: '2026-12-01',
      hasVehicle: true,
      hasChildren: true,
    });

    // Verify task capabilities
    const costTask = plan.tasks.find((t) => t.id === 'task_moving_cost_estimate');
    assert.equal(costTask.relatedCapabilityId, 'housing.moving.cost.calculate');
    assert.equal(costTask.toolId, 'moving-cost-jp');
    assert.equal(costTask.hashRoute, '#/tools/moving-cost-jp');

    const adminTask = plan.tasks.find((t) => t.id === 'task_tennyu_todoke');
    assert.equal(adminTask.relatedCapabilityId, 'housing.moving.admin.check');
    assert.equal(adminTask.toolId, 'moving-admin-checker-jp');
    assert.equal(adminTask.hashRoute, '#/tools/moving-admin-checker-jp');

    const childTask = plan.tasks.find((t) => t.id === 'task_child_allowance_15day');
    assert.equal(childTask.relatedCapabilityId, 'family.childAllowance.calculate');
    assert.equal(childTask.toolId, 'child-allowance-jp');
    assert.equal(childTask.hashRoute, '#/tools/child-allowance-jp');

    // Verify relatedTools list
    assert.equal(plan.relatedTools.length, 4);
    assert.ok(plan.relatedTools.some((rt) => rt.toolId === 'moving-cost-jp'));
    assert.ok(plan.relatedTools.some((rt) => rt.toolId === 'moving-admin-checker-jp'));
    assert.ok(plan.relatedTools.some((rt) => rt.toolId === 'address-change-checklist-jp'));
    assert.ok(plan.relatedTools.some((rt) => rt.toolId === 'child-allowance-jp'));
  });

  // Case 4: Timeline structure and chronological order
  await t.test('M7-04: Trục thời gian (Timeline) sắp xếp tuần tự từ 1 tháng trước tới sau khi chuyển', () => {
    const plan = generateMovingWizardPlan({
      moveDate: '2026-10-01',
    });

    assert.ok(plan.timeline.length >= 5);
    const stages = plan.timeline.map((item) => item.stageId);
    assert.ok(stages.includes('stage_1_month_prior'));
    assert.ok(stages.includes('stage_1_week_prior'));
    assert.ok(stages.includes('stage_day_of_move'));
    assert.ok(stages.includes('stage_within_14_days'));
  });

  // Case 5: Life Event Runtime storage interface
  await t.test('M7-05: Runtime cung cấp giao diện lưu trữ đồng nhất (storage interface) cho checklist state', () => {
    assert.equal(typeof movingWizardRuntime.storage.loadCompleted, 'function');
    assert.equal(typeof movingWizardRuntime.storage.saveCompleted, 'function');
    assert.equal(typeof movingWizardRuntime.storage.toggleCompleted, 'function');
    assert.equal(typeof movingWizardRuntime.storage.clear, 'function');
    assert.equal(movingWizardRuntime.getId(), 'moving');
    assert.equal(movingWizardRuntime.getDefinition().domain, 'housing');
  });
});



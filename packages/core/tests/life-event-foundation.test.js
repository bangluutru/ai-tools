/**
 * @file packages/core/tests/life-event-foundation.test.js
 * @description Unit tests cho Nền tảng Sự Kiện Đời Sống (Life Event Foundation).
 */

import assert from 'node:assert/strict';
import test from 'node:test';

import {
  // Types & Enums
  TIMELINE_STAGE_TYPES,
  CHECKLIST_REQUIREMENTS,

  // Deadline Engine
  addCalendarDays,
  subtractCalendarDays,
  calculateDeadlineDate,
  formatDeadlineLabel,

  // Capability Registry
  resolveCapability,
  buildCapabilityDeepLink,
  registerCapability,
  resetCapabilityRegistry,
  getAllCapabilities,

  // Checklist Engine
  calculateChecklistStats,
  filterChecklistItems,

  // Storage
  getLifeEventStorageKey,
  loadCompletedTasks,
  saveCompletedTasks,
  toggleCompletedTask,
  clearCompletedTasks,

  // Runtime
  createLifeEventRuntime,
} from '../src/life-events/index.js';

test('Life Event Foundation - Types & Constants are frozen and well-defined', () => {
  assert.equal(TIMELINE_STAGE_TYPES.PREPARATION, 'preparation');
  assert.equal(TIMELINE_STAGE_TYPES.DEADLINE_CRITICAL, 'deadline_critical');
  assert.equal(CHECKLIST_REQUIREMENTS.REQUIRED, 'required');
  assert.equal(CHECKLIST_REQUIREMENTS.RECOMMENDED, 'recommended');
  assert.equal(CHECKLIST_REQUIREMENTS.CONDITIONAL, 'conditional');
});

test('DeadlineEngine - Calendar day calculations handle leap years, month boundaries and offsets', () => {
  // Month transition
  assert.equal(addCalendarDays('2026-03-25', 14), '2026-04-08');
  assert.equal(subtractCalendarDays('2026-04-08', 14), '2026-03-25');

  // Leap year 2028 vs non-leap 2026
  assert.equal(addCalendarDays('2026-02-28', 1), '2026-03-01');
  assert.equal(addCalendarDays('2028-02-28', 1), '2028-02-29');

  // Year boundary
  assert.equal(addCalendarDays('2026-12-25', 10), '2027-01-04');
  assert.equal(subtractCalendarDays('2027-01-04', 10), '2026-12-25');

  // Invalid date string handling
  assert.equal(addCalendarDays('', 5), '');
  assert.equal(addCalendarDays('not-a-date', 5), '');
});

test('DeadlineEngine - calculateDeadlineDate resolves dynamic anchor dates correctly', () => {
  const context = {
    resignationDate: '2026-04-30',
    birthDate: '2026-05-15',
    moveDate: '2026-06-01',
  };

  // Rule 1: 14 days after resignation
  const rule1 = {
    anchorKey: 'resignationDate',
    offsetDays: 14,
    direction: 'after',
  };
  assert.equal(calculateDeadlineDate(rule1, context), '2026-05-14');

  // Rule 2: 14 days before moving
  const rule2 = {
    anchorKey: 'moveDate',
    offsetDays: 14,
    direction: 'before',
  };
  assert.equal(calculateDeadlineDate(rule2, context), '2026-05-18');

  // Missing anchor date in context
  const ruleMissing = {
    anchorKey: 'marriageDate',
    offsetDays: 7,
    direction: 'after',
  };
  assert.equal(calculateDeadlineDate(ruleMissing, context), null);
});

test('DeadlineEngine - formatDeadlineLabel creates trilingual readable deadlines', () => {
  const calculated = '2026-05-14';

  const ja = formatDeadlineLabel({ calculatedDate: calculated, fallbackTextJa: '退職後14日以内', lang: 'ja' });
  assert.ok(ja.includes('2026年5月14日まで'));
  assert.ok(ja.includes('退職後14日以内'));

  const vi = formatDeadlineLabel({ calculatedDate: calculated, fallbackTextVi: 'Trong vòng 14 ngày', lang: 'vi' });
  assert.ok(vi.includes('2026-05-14'));
  assert.ok(vi.includes('Trong vòng 14 ngày'));

  const en = formatDeadlineLabel({ calculatedDate: calculated, fallbackTextEn: 'Within 14 days', lang: 'en' });
  assert.ok(en.includes('By 2026-05-14'));
  assert.ok(en.includes('Within 14 days'));

  // Without calculated date
  const jaFallback = formatDeadlineLabel({ fallbackTextJa: '速やかに', lang: 'ja' });
  assert.equal(jaFallback, '速やかに');
});

test('CapabilityRegistry - resolves known capabilities and gracefully handles missing ones', () => {
  // Known capability
  const resEmployment = resolveCapability('employment.unemployment.benefit');
  assert.equal(resEmployment.isAvailable, true);
  assert.equal(resEmployment.toolId, 'unemployment-benefit-jp');
  assert.equal(resEmployment.hashRoute, '#/tools/unemployment-benefit-jp');

  // Housing capabilities
  const resMoving = resolveCapability('housing.moving.admin.check');
  assert.equal(resMoving.isAvailable, true);
  assert.equal(resMoving.toolId, 'moving-admin-checker-jp');
  assert.equal(resMoving.hashRoute, '#/tools/moving-admin-checker-jp');

  // Missing capability (Must never throw)
  const resUnknown = resolveCapability('unreal.future.capability.xyz');
  assert.equal(resUnknown.isAvailable, false);
  assert.equal(resUnknown.toolId, null);
  assert.equal(resUnknown.hashRoute, null);

  // Deep link builder with query payload
  const deepLink = buildCapabilityDeepLink('insurance.health.dependent', { income: 1200000 });
  assert.equal(deepLink, '#/tools/dependent-insurance-jp?income=1200000');

  // Deep link for unavailable capability returns null
  assert.equal(buildCapabilityDeepLink('missing.cap'), null);
});

test('ChecklistEngine - calculateChecklistStats calculates stats for nested and flat items', () => {
  // 1. Nested stages format
  const nestedStages = [
    {
      id: 'stage_1',
      order: 1,
      tasks: [
        { id: 'task_1' },
        { id: 'task_2' },
      ],
    },
    {
      id: 'stage_2',
      order: 2,
      tasks: [
        { id: 'task_3' },
      ],
    },
  ];

  const stats1 = calculateChecklistStats(['task_1', 'task_3'], nestedStages);
  assert.equal(stats1.totalTasks, 3);
  assert.equal(stats1.totalCompleted, 2);
  assert.equal(stats1.overallPercent, 67);
  assert.equal(stats1.isAllCompleted, false);
  assert.equal(stats1.stageStats.length, 2);
  assert.equal(stats1.stageStats[0].completed, 1);
  assert.equal(stats1.stageStats[1].isFullyCompleted, true);

  // 2. Flat items format
  const flatStages = [
    { id: 'before_move', order: 1 },
    { id: 'after_move', order: 2 },
  ];
  const flatItems = [
    { id: 'item_a', stageId: 'before_move' },
    { id: 'item_b', stageId: 'before_move' },
    { id: 'item_c', stageId: 'after_move' },
    { id: 'item_d', stageId: 'after_move' },
  ];

  const stats2 = calculateChecklistStats(['item_a', 'item_b', 'item_c', 'item_d'], flatStages, flatItems);
  assert.equal(stats2.totalTasks, 4);
  assert.equal(stats2.totalCompleted, 4);
  assert.equal(stats2.overallPercent, 100);
  assert.equal(stats2.isAllCompleted, true);
  assert.equal(stats2.stageStats[0].isFullyCompleted, true);
  assert.equal(stats2.stageStats[1].isFullyCompleted, true);
});

test('ChecklistEngine - filterChecklistItems filters by stage, requirement and urgency', () => {
  const items = [
    { id: '1', stageId: 'st1', requirement: 'required', isUrgent: true },
    { id: '2', stageId: 'st1', requirement: 'recommended', isUrgent: false },
    { id: '3', stageId: 'st2', requirement: 'required', isUrgent: false },
  ];

  const st1Only = filterChecklistItems(items, { stageId: 'st1' });
  assert.equal(st1Only.length, 2);

  const urgentOnly = filterChecklistItems(items, { isUrgent: true });
  assert.equal(urgentOnly.length, 1);
  assert.equal(urgentOnly[0].id, '1');

  const completedFilter = filterChecklistItems(items, {
    completedIds: ['1'],
    completionFilter: 'uncompleted',
  });
  assert.equal(completedFilter.length, 2);
  assert.equal(completedFilter.some((i) => i.id === '1'), false);
});

test('LifeEventStorage - safely loads, saves and toggles task IDs with mock storage', () => {
  const memoryStore = {};
  const mockStorage = {
    getItem(k) { return memoryStore[k] || null; },
    setItem(k, v) { memoryStore[k] = String(v); },
    removeItem(k) { delete memoryStore[k]; },
  };

  const eventId = 'test-life-event';
  const key = getLifeEventStorageKey(eventId);
  assert.equal(key, 'ai_tools_test-life-event_checklist');

  // Initial load is empty array
  assert.deepEqual(loadCompletedTasks(eventId, mockStorage), []);

  // Save tasks
  saveCompletedTasks(eventId, ['t1', 't2'], mockStorage);
  assert.deepEqual(loadCompletedTasks(eventId, mockStorage), ['t1', 't2']);

  // Toggle existing task (removes t1)
  const toggled1 = toggleCompletedTask(eventId, 't1', mockStorage);
  assert.deepEqual(toggled1, ['t2']);

  // Toggle new task (adds t3)
  const toggled2 = toggleCompletedTask(eventId, 't3', mockStorage);
  assert.deepEqual(toggled2, ['t2', 't3']);

  // Clear
  clearCompletedTasks(eventId, mockStorage);
  assert.deepEqual(loadCompletedTasks(eventId, mockStorage), []);
});

test('createLifeEventRuntime - validates definition and executes complete lifecycle', () => {
  // Invalid definitions throw
  assert.throws(() => createLifeEventRuntime(null), /valid object/);
  assert.throws(() => createLifeEventRuntime({}), /id/);
  assert.throws(() => createLifeEventRuntime({ id: 'demo' }), /at least one stage/);
  assert.throws(() => createLifeEventRuntime({ id: 'demo', stages: [{ id: 's1' }] }), /evaluateChecklist/);

  // Valid definition
  const demoDefinition = {
    id: 'demo-moving',
    stages: [
      { id: 'stage_after', nameJa: '引越し後', nameVi: 'Sau chuyển nhà', order: 2 },
      { id: 'stage_before', nameJa: '引越し前', nameVi: 'Trước chuyển nhà', order: 1 },
    ],
    evaluateChecklist(context) {
      return [
        {
          id: 'task_moving_out',
          stageId: 'stage_before',
          titleJa: '転出届',
          titleVi: 'Nộp giấy chuyển đi',
          deadlineRule: {
            anchorKey: 'moveDate',
            offsetDays: 14,
            direction: 'before',
          },
          relatedCapabilityId: 'housing.moving.admin.check',
        },
        {
          id: 'task_post_forward',
          stageId: 'stage_before',
          titleJa: '郵便物転送届',
          titleVi: 'Chuyển tiếp thư từ bưu điện',
          relatedCapabilityId: 'housing.address.change.check',
        },
      ];
    },
  };

  const runtime = createLifeEventRuntime(demoDefinition);
  assert.equal(runtime.getId(), 'demo-moving');

  // Stages are sorted by order
  const stages = runtime.evaluateTimeline();
  assert.equal(stages.length, 2);
  assert.equal(stages[0].id, 'stage_before');
  assert.equal(stages[1].id, 'stage_after');

  // Checklist items are enriched with calculated deadlines and capabilities
  const items = runtime.evaluateChecklist({ moveDate: '2026-07-01' });
  assert.equal(items.length, 2);

  const movingOutTask = items.find((i) => i.id === 'task_moving_out');
  assert.ok(movingOutTask);
  assert.equal(movingOutTask.calculatedDeadlineDate, '2026-06-17'); // 14 days before 2026-07-01
  assert.equal(movingOutTask.toolId, 'moving-admin-checker-jp');
  assert.equal(movingOutTask.deepLink, '#/tools/moving-admin-checker-jp');

  const postTask = items.find((i) => i.id === 'task_post_forward');
  assert.ok(postTask);
  assert.equal(postTask.toolId, 'address-change-checklist-jp');

  // Stats calculation via runtime
  const stats = runtime.getChecklistStats(['task_moving_out'], { moveDate: '2026-07-01' });
  assert.equal(stats.totalTasks, 2);
  assert.equal(stats.totalCompleted, 1);
  assert.equal(stats.overallPercent, 50);
});

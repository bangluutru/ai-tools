/**
 * @file packages/core/tests/immigration-departure-wizard.test.js
 * @description
 * Kiểm thử đơn vị toàn diện cho M8: Leaving Japan Procedure Guide (日本を離れる手続きガイド - 5th Life Event).
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  DEPARTURE_STAGES,
  DEPARTURE_TASKS_CATALOG,
  DEPARTURE_SOURCES,
  addDays,
  calculateDaysRemaining,
  evaluateDepartureChecklist,
  generateDeparturePlan,
  departureDefinition,
  departureRuntime
} from '../src/japan/immigration/index.js';

test('DEPARTURE_STAGES defines 3 sequential departure stages', () => {
  assert.equal(DEPARTURE_STAGES.length, 3);
  const ids = DEPARTURE_STAGES.map((s) => s.id);
  assert.deepEqual(ids, ['stage_pre_departure', 'stage_airport_departure', 'stage_post_departure']);

  for (const stage of DEPARTURE_STAGES) {
    assert.ok(stage.titleJa && stage.titleVi && stage.titleEn);
    assert.ok(stage.order > 0);
    assert.ok(stage.icon);
  }
});

test('DEPARTURE_TASKS_CATALOG defines required tasks with proper metadata and sources', () => {
  assert.ok(DEPARTURE_TASKS_CATALOG.length >= 8);

  for (const task of DEPARTURE_TASKS_CATALOG) {
    assert.ok(task.id, 'Task must have an id');
    assert.ok(task.stageId, `${task.id} must have a stageId`);
    assert.ok(['required', 'recommended', 'conditional'].includes(task.requirement));
    assert.ok(task.titleJa && task.titleVi && task.titleEn);
    assert.ok(task.descJa && task.descVi && task.descEn);
    assert.ok(task.authorityJa && task.authorityVi && task.authorityEn);
    assert.ok(task.sourceId, `${task.id} must have a sourceId`);
    assert.ok(task.metadata, `${task.id} must have metadata`);
  }
});

test('evaluateDepartureChecklist branches correctly for short temporary departure (<= 1 year)', () => {
  const context = {
    departureDate: '2026-10-01',
    departureType: 'temporary',
    tripDurationMonths: 6,
  };

  const tasks = evaluateDepartureChecklist(context);
  const taskIds = tasks.map((t) => t.id);

  assert.ok(taskIds.includes('task_minashi_reentry'), 'Must include Minashi re-entry for <= 1 year');
  assert.ok(!taskIds.includes('task_regular_reentry'), 'Must NOT include regular re-entry for <= 1 year');
  assert.ok(!taskIds.includes('task_municipal_moving_out'), 'Must NOT include permanent moving-out');
  assert.ok(!taskIds.includes('task_lump_sum_pension'), 'Must NOT include pension withdrawal');
});

test('evaluateDepartureChecklist branches correctly for long temporary departure (> 1 year)', () => {
  const context = {
    departureDate: '2026-10-01',
    departureType: 'temporary',
    tripDurationMonths: 18,
  };

  const tasks = evaluateDepartureChecklist(context);
  const taskIds = tasks.map((t) => t.id);

  assert.ok(taskIds.includes('task_regular_reentry'), 'Must include formal re-entry permit for > 1 year');
  assert.ok(!taskIds.includes('task_minashi_reentry'), 'Must NOT include Minashi re-entry for > 1 year');
});

test('evaluateDepartureChecklist branches correctly for permanent departure with pension & tax refund', () => {
  const context = {
    departureDate: '2026-10-01',
    departureType: 'permanent',
    hasPensionContributions: true,
    pensionContributionMonths: 72,
    hasKoseiNenkin: true,
  };

  const tasks = evaluateDepartureChecklist(context);
  const taskIds = tasks.map((t) => t.id);

  assert.ok(taskIds.includes('task_municipal_moving_out'));
  assert.ok(taskIds.includes('task_mynumber_card_return'));
  assert.ok(taskIds.includes('task_tax_administrator'));
  assert.ok(taskIds.includes('task_resident_tax_settlement'));
  assert.ok(taskIds.includes('task_airport_card_surrender'));
  assert.ok(taskIds.includes('task_lump_sum_pension'));
  assert.ok(taskIds.includes('task_pension_tax_refund'));

  // Neither temporary task should be included
  assert.ok(!taskIds.includes('task_minashi_reentry'));
  assert.ok(!taskIds.includes('task_regular_reentry'));

  // Check 60-month cap flag
  const pensionTask = tasks.find((t) => t.id === 'task_lump_sum_pension');
  assert.equal(pensionTask.pensionMonths, 72);
  assert.equal(pensionTask.cappedMonths, 60);
  assert.equal(pensionTask.isCappedAt60, true);
  assert.equal(pensionTask.calculatedDeadlineDate, '2028-09-30'); // 2026-10-01 + 730 days
});

test('evaluateDepartureChecklist excludes pension tasks if contribution < 6 months', () => {
  const context = {
    departureDate: '2026-10-01',
    departureType: 'permanent',
    hasPensionContributions: true,
    pensionContributionMonths: 4,
    hasKoseiNenkin: true,
  };

  const tasks = evaluateDepartureChecklist(context);
  const taskIds = tasks.map((t) => t.id);

  assert.ok(!taskIds.includes('task_lump_sum_pension'), 'Must exclude pension if under 6 months');
  assert.ok(!taskIds.includes('task_pension_tax_refund'));
});

test('generateDeparturePlan calculates progress and emits relevant warnings', () => {
  const plan = generateDeparturePlan({
    departureDate: '2026-10-01',
    departureType: 'permanent',
    hasPensionContributions: true,
    pensionContributionMonths: 72,
    hasKoseiNenkin: true,
  }, {
    completedTaskIds: ['task_municipal_moving_out', 'task_mynumber_card_return']
  });

  assert.ok(plan.stages.length > 0);
  assert.equal(plan.summary.completedTasks, 2);
  assert.ok(plan.summary.progressPercent > 0);

  // Check 60-month cap warning
  const capWarn = plan.warnings.find((w) => w.id === 'info_pension_60months_cap');
  assert.ok(capWarn, 'Must alert user about 60-month pension cap');

  // Check Tax Administrator warning
  const taxAdminWarn = plan.warnings.find((w) => w.id === 'info_tax_admin_for_refund');
  assert.ok(taxAdminWarn, 'Must alert user about tax administrator requirement for 20.42% refund');
});

test('generateDeparturePlan flags overdue pension claim when departing > 2 years ago', () => {
  const pastDepartureDate = new Date(Date.now() - 800 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const plan = generateDeparturePlan({
    departureDate: pastDepartureDate,
    departureType: 'permanent',
    hasPensionContributions: true,
    pensionContributionMonths: 36,
  });

  const overdueWarn = plan.warnings.find((w) => w.id === 'warn_pension_overdue');
  assert.ok(overdueWarn, 'Must alert overdue when > 2 years have passed');
  assert.equal(overdueWarn.severity, 'danger');
});

test('departureDefinition conforms to LifeEventDefinition contract and integrates with departureRuntime', () => {
  assert.equal(departureDefinition.id, 'leaving-japan');
  assert.equal(departureDefinition.country, 'JP');
  assert.equal(departureDefinition.domain, 'immigration');
  assert.ok(departureDefinition.title.ja && departureDefinition.title.vi && departureDefinition.title.en);
  assert.equal(departureDefinition.stages.length, 3);
  assert.deepEqual(departureDefinition.sources, DEPARTURE_SOURCES);

  assert.ok(departureRuntime, 'departureRuntime must be instantiated');
  assert.equal(typeof departureRuntime.getDefinition, 'function');
  assert.equal(departureRuntime.getDefinition().id, 'leaving-japan');

  const checklist = departureRuntime.evaluateChecklist({
    departureDate: '2026-10-01',
    departureType: 'permanent'
  });
  assert.ok(Array.isArray(checklist));
  assert.ok(checklist.length >= 6);
});

test('departure rules and tasks contain zero pseudo-legal promises or absolute approval claims', () => {
  const FORBIDDEN_PATTERNS = [
    /guaranteed approval/i,
    /visa approved/i,
    /đậu visa 100%/i,
    /chắc chắn đậu/i,
    /đảm bảo 100%/i,
    /tỷ lệ đỗ 100%/i,
    /tuyệt đối được cấp/i
  ];

  const serialized = JSON.stringify(DEPARTURE_TASKS_CATALOG) + JSON.stringify(departureDefinition);
  for (const pat of FORBIDDEN_PATTERNS) {
    assert.equal(pat.test(serialized), false, `Forbidden certainty pattern detected: ${pat}`);
  }
});

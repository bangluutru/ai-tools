/**
 * @file packages/core/tests/immigration-arrival-wizard.test.js
 * @description
 * Kiểm thử đơn vị toàn diện cho M7: Arriving in Japan Setup Guide (来日後セットアップガイド - 4th Life Event).
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  ARRIVAL_STAGES,
  ARRIVAL_TASKS_CATALOG,
  ARRIVAL_SOURCES,
  addDays,
  calculateDaysRemaining,
  evaluateArrivalChecklist,
  generateArrivalPlan,
  arrivalDefinition,
  arrivalRuntime
} from '../src/japan/immigration/index.js';

test('ARRIVAL_STAGES defines 4 sequential onboarding stages', () => {
  assert.equal(ARRIVAL_STAGES.length, 4);
  const ids = ARRIVAL_STAGES.map((s) => s.id);
  assert.deepEqual(ids, ['stage_airport', 'stage_municipal', 'stage_essentials', 'stage_onboarding']);
  
  for (const stage of ARRIVAL_STAGES) {
    assert.ok(stage.titleJa && stage.titleVi && stage.titleEn);
    assert.ok(stage.order > 0);
    assert.ok(stage.icon);
  }
});

test('ARRIVAL_TASKS_CATALOG defines required tasks with proper metadata and sources', () => {
  assert.ok(ARRIVAL_TASKS_CATALOG.length >= 10);

  for (const task of ARRIVAL_TASKS_CATALOG) {
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

test('addDays and calculateDaysRemaining compute dates accurately', () => {
  assert.equal(addDays('2026-10-01', 14), '2026-10-15');
  assert.equal(addDays('2026-02-28', 1), '2026-03-01');
  assert.equal(addDays('', 5), '');

  const daysRem = calculateDaysRemaining('2026-10-15', '2026-10-10');
  assert.equal(daysRem, 5);

  const daysPast = calculateDaysRemaining('2026-10-05', '2026-10-10');
  assert.equal(daysPast, -5);
});

test('evaluateArrivalChecklist adapts tasks for company employee with Shakai Hoken', () => {
  const context = {
    entryDate: '2026-10-01',
    statusCategory: 'work',
    hasCompanyShakaiHoken: true,
    needsPartTimeWork: false,
    hasDependents: false
  };

  const tasks = evaluateArrivalChecklist(context);
  const taskIds = tasks.map((t) => t.id);

  assert.ok(taskIds.includes('task_residence_card'));
  assert.ok(taskIds.includes('task_resident_registration'));
  assert.ok(taskIds.includes('task_bank_account'));
  assert.ok(taskIds.includes('task_employer_mynumber'));
  assert.ok(taskIds.includes('task_fuyou_declaration'));
  assert.ok(taskIds.includes('task_commutation_allowance'));

  // Company covers health insurance and pension, so national ones are omitted
  assert.ok(!taskIds.includes('task_kokumin_kenpo'));
  assert.ok(!taskIds.includes('task_kokumin_nenkin'));
  // Does not need part-time permit
  assert.ok(!taskIds.includes('task_part_time_permit'));

  const registrationTask = tasks.find((t) => t.id === 'task_resident_registration');
  assert.equal(registrationTask.calculatedDeadlineDate, '2026-10-15');
});

test('evaluateArrivalChecklist adapts tasks for student needing part-time work and national insurance', () => {
  const context = {
    entryDate: '2026-10-01',
    statusCategory: 'student',
    hasCompanyShakaiHoken: false,
    needsPartTimeWork: true,
    hasDependents: false
  };

  const tasks = evaluateArrivalChecklist(context);
  const taskIds = tasks.map((t) => t.id);

  assert.ok(taskIds.includes('task_part_time_permit'));
  assert.ok(taskIds.includes('task_kokumin_kenpo'));
  assert.ok(taskIds.includes('task_kokumin_nenkin'));
  // Not an employee, so salary fuyou deduction declaration is omitted
  assert.ok(!taskIds.includes('task_fuyou_declaration'));
});

test('generateArrivalPlan calculates stage progress and flags overdue 14-day registration', () => {
  // Entry was 20 days ago -> overdue warning
  const pastEntryDate = new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const plan = generateArrivalPlan({
    entryDate: pastEntryDate,
    statusCategory: 'work',
    hasCompanyShakaiHoken: true,
  }, {
    completedTaskIds: ['task_residence_card']
  });

  assert.equal(plan.stages.length, 4);
  assert.ok(plan.summary.totalTasks > 0);
  assert.equal(plan.summary.completedTasks, 1);
  assert.ok(plan.summary.progressPercent > 0);

  const overdueWarn = plan.warnings.find((w) => w.id === 'warn_overdue_14days');
  assert.ok(overdueWarn, 'Must flag overdue warning when 14-day limit has expired');
  assert.equal(overdueWarn.severity, 'danger');
});

test('generateArrivalPlan flags urgent warning when 14-day limit is within 3 days', () => {
  // Entry was 12 days ago -> 2 days remaining -> urgent warning
  const recentEntryDate = new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const plan = generateArrivalPlan({
    entryDate: recentEntryDate,
    statusCategory: 'work',
    hasCompanyShakaiHoken: true,
  });

  const urgentWarn = plan.warnings.find((w) => w.id === 'warn_urgent_14days');
  assert.ok(urgentWarn, 'Must flag urgent warning when 14-day limit is near');
  assert.equal(urgentWarn.severity, 'warning');
});

test('arrivalDefinition conforms to LifeEventDefinition contract and integrates with arrivalRuntime', () => {
  assert.equal(arrivalDefinition.id, 'arriving-in-japan');
  assert.equal(arrivalDefinition.country, 'JP');
  assert.equal(arrivalDefinition.domain, 'immigration');
  assert.ok(arrivalDefinition.title.ja && arrivalDefinition.title.vi && arrivalDefinition.title.en);
  assert.equal(arrivalDefinition.stages.length, 4);
  assert.deepEqual(arrivalDefinition.sources, ARRIVAL_SOURCES);

  assert.ok(arrivalRuntime, 'arrivalRuntime must be instantiated');
  assert.equal(typeof arrivalRuntime.getDefinition, 'function');
  assert.equal(arrivalRuntime.getDefinition().id, 'arriving-in-japan');

  // Test runtime checklist evaluation
  const checklist = arrivalRuntime.evaluateChecklist({
    entryDate: '2026-10-01',
    statusCategory: 'work'
  });
  assert.ok(Array.isArray(checklist));
  assert.ok(checklist.length >= 8);
});

test('arrival rules and tasks contain zero pseudo-legal promises or absolute approval claims', () => {
  const FORBIDDEN_PATTERNS = [
    /guaranteed approval/i,
    /visa approved/i,
    /đậu visa 100%/i,
    /chắc chắn đậu/i,
    /đảm bảo 100%/i,
    /tỷ lệ đỗ 100%/i,
    /tuyệt đối được cấp/i
  ];

  const serialized = JSON.stringify(ARRIVAL_TASKS_CATALOG) + JSON.stringify(arrivalDefinition);
  for (const pat of FORBIDDEN_PATTERNS) {
    assert.equal(pat.test(serialized), false, `Forbidden certainty pattern detected: ${pat}`);
  }
});

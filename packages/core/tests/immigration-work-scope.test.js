/**
 * @file packages/core/tests/immigration-work-scope.test.js
 * @description
 * Unit tests và Legal Golden Tests cho M1: 在留資格・就労範囲チェッカー (Work Scope Checker).
 * Kiểm tra phân tầng đánh giá, quy định 資格外活動許可 (28h, cấm 風俗営業), Biểu 1 vs Biểu 2,
 * và kiểm tra tiêu cực (Negative Certainty Tests) chống khẳng định chắc chắn 100% giả tạo.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  getStatusDefinition,
  getAllStatuses,
  getStatusesByCategory,
  getStatusLabel,
  isValidStatusId,
} from '../src/japan/immigration/status/statusCatalog.js';

import {
  evaluateWorkScope,
  ACTIVITY_CATEGORIES,
  WORK_SCOPE_RULE_METADATA,
} from '../src/japan/immigration/index.js';

import { hasSource, getSource } from '../src/regulatory/sourceRegistry.js';

// Danh sách các từ ngữ cấm xuất hiện trong bất kỳ kết quả đánh giá nào
const FORBIDDEN_POSITIVE_CERTAINTY_PATTERNS = [
  /guaranteed/i,
  /definitely approved/i,
  /100%/i,
  /\b9\d%/i,
  /visa will be granted/i,
  /permanent residence approved/i,
  /確実/i,
  /100%許可/i,
  /絶対に許可/i,
  /chắc chắn đậu/i,
  /bảo đảm visa/i,
];

function assertNoForbiddenCertainty(result) {
  const serialized = JSON.stringify(result);
  for (const pattern of FORBIDDEN_POSITIVE_CERTAINTY_PATTERNS) {
    assert.equal(
      pattern.test(serialized),
      false,
      `Output must not contain forbidden certainty pattern: ${pattern}. Found in output: ${serialized}`
    );
  }
}

test('M1 Status Catalog & Definitions Integrity', async (t) => {
  await t.test('All official Table 1 and Table 2 statuses exist and are valid', () => {
    const all = getAllStatuses();
    assert.ok(all.length >= 20, 'Should register at least 20 official statuses');

    // Table 1 work statuses
    assert.ok(isValidStatusId('engineer-humanities-international'));
    assert.ok(isValidStatusId('business-manager'));
    assert.ok(isValidStatusId('highly-skilled-professional-1'));
    assert.ok(isValidStatusId('skilled-labor'));
    assert.ok(isValidStatusId('specified-skilled-worker-1'));

    // Table 1 non-work statuses
    assert.ok(isValidStatusId('student'));
    assert.ok(isValidStatusId('dependent'));
    assert.ok(isValidStatusId('temporary-visitor'));

    // Table 1 designated
    assert.ok(isValidStatusId('designated-activities'));

    // Table 2 status-based
    assert.ok(isValidStatusId('permanent-resident'));
    assert.ok(isValidStatusId('spouse-of-japanese'));
    assert.ok(isValidStatusId('spouse-of-permanent-resident'));
    assert.ok(isValidStatusId('long-term-resident'));
  });

  await t.test('All statuses have valid sourceId in OfficialSourceRegistry', () => {
    const all = getAllStatuses();
    for (const s of all) {
      assert.ok(s.sourceId, `Status "${s.id}" missing sourceId`);
      assert.ok(hasSource(s.sourceId), `Status "${s.id}" sourceId "${s.sourceId}" not in OfficialSourceRegistry`);
      const src = getSource(s.sourceId);
      assert.ok(src.status === 'official-current' || src.status === 'official-primary');
    }
  });

  await t.test('Rule metadata contract adheres to Regulatory Foundation', () => {
    assert.equal(WORK_SCOPE_RULE_METADATA.id, 'jp-immigration-work-scope-art19');
    assert.equal(WORK_SCOPE_RULE_METADATA.ruleNature, 'prerequisite');
    assert.equal(WORK_SCOPE_RULE_METADATA.status, 'verified');
  });
});

test('M1 Work Scope: Table 1 Work Statuses (技人国 & 経営・管理 & 技能)', async (t) => {
  await t.test('技人国 + IT engineering is generally-within-scope', () => {
    const res = evaluateWorkScope({
      residenceStatus: 'engineer-humanities-international',
      activityCategory: 'engineering_it',
      employmentType: 'full-time',
    });

    assert.equal(res.evaluationTier, 'generally-within-scope');
    assert.equal(res.badgeType, 'success');
    assert.ok(res.summaryJa.includes('概ね適合'));
    assert.ok(res.detailsVi.length > 0);
    assertNoForbiddenCertainty(res);
  });

  await t.test('技人国 + International trade / translation is generally-within-scope', () => {
    const res = evaluateWorkScope({
      residenceStatus: 'engineer-humanities-international',
      activityCategory: 'humanities_business',
      employmentType: 'full-time',
    });

    assert.equal(res.evaluationTier, 'generally-within-scope');
    assert.equal(res.badgeType, 'success');
    assertNoForbiddenCertainty(res);
  });

  await t.test('技人国 + clearly unrelated manual labor is potentially-outside-scope', () => {
    const res = evaluateWorkScope({
      residenceStatus: 'engineer-humanities-international',
      activityCategory: 'manual_labor',
      employmentType: 'full-time',
    });

    assert.equal(res.evaluationTier, 'potentially-outside-scope');
    assert.equal(res.badgeType, 'error');
    assert.ok(res.warnings.some((w) => w.id === 'gijinkoku_manual_work_mismatch'));
    assertNoForbiddenCertainty(res);
  });

  await t.test('技人国 + adult entertainment is strictly potentially-outside-scope', () => {
    const res = evaluateWorkScope({
      residenceStatus: 'engineer-humanities-international',
      activityCategory: 'adult_entertainment',
    });

    assert.equal(res.evaluationTier, 'potentially-outside-scope');
    assert.equal(res.badgeType, 'error');
    assert.ok(res.warnings.some((w) => w.id === 'work_visa_adult_prohibited'));
    assertNoForbiddenCertainty(res);
  });

  await t.test('技人国 + managing business indicates need for status change', () => {
    const res = evaluateWorkScope({
      residenceStatus: 'engineer-humanities-international',
      activityCategory: 'business_management',
    });

    assert.equal(res.evaluationTier, 'potentially-outside-scope');
    assert.equal(res.badgeType, 'warning');
    assert.ok(res.summaryJa.includes('経営・管理'));
    assertNoForbiddenCertainty(res);
  });

  await t.test('経営・管理 + business management is generally-within-scope', () => {
    const res = evaluateWorkScope({
      residenceStatus: 'business-manager',
      activityCategory: 'business_management',
    });

    assert.equal(res.evaluationTier, 'generally-within-scope');
    assert.equal(res.badgeType, 'success');
    assertNoForbiddenCertainty(res);
  });

  await t.test('技能 + specialized foreign cuisine is generally-within-scope', () => {
    const res = evaluateWorkScope({
      residenceStatus: 'skilled-labor',
      activityCategory: 'specialized_cuisine',
    });

    assert.equal(res.evaluationTier, 'generally-within-scope');
    assert.equal(res.badgeType, 'success');
    assertNoForbiddenCertainty(res);
  });
});

test('M1 Work Scope: Student & Dependent (資格外活動許可 & 28-hour rule & Adult Ban)', async (t) => {
  await t.test('Student WITHOUT extra-activity permission requires permission', () => {
    const res = evaluateWorkScope({
      residenceStatus: 'student',
      activityCategory: 'part_time_general',
      hasExtraActivityPermission: false,
      weeklyHours: 15,
    });

    assert.equal(res.evaluationTier, 'requires-extra-permission');
    assert.equal(res.badgeType, 'warning');
    assert.ok(res.warnings.some((w) => w.id === 'unauthorized_work_risk_no_permission'));
    assertNoForbiddenCertainty(res);
  });

  await t.test('Student WITH permission within 28 hours is generally-within-scope', () => {
    const res = evaluateWorkScope({
      residenceStatus: 'student',
      activityCategory: 'part_time_general',
      hasExtraActivityPermission: true,
      weeklyHours: 20,
    });

    assert.equal(res.evaluationTier, 'generally-within-scope');
    assert.equal(res.badgeType, 'success');
    assertNoForbiddenCertainty(res);
  });

  await t.test('Student WITH permission exceeding 28 hours during school term is potentially-outside-scope', () => {
    const res = evaluateWorkScope({
      residenceStatus: 'student',
      activityCategory: 'part_time_general',
      hasExtraActivityPermission: true,
      weeklyHours: 35,
      isSchoolVacation: false,
    });

    assert.equal(res.evaluationTier, 'potentially-outside-scope');
    assert.equal(res.badgeType, 'error');
    assert.ok(res.warnings.some((w) => w.id === 'hours_over_28_breach'));
    assertNoForbiddenCertainty(res);
  });

  await t.test('Student WITH permission up to 40 hours during vacation is generally-within-scope', () => {
    const res = evaluateWorkScope({
      residenceStatus: 'student',
      activityCategory: 'part_time_general',
      hasExtraActivityPermission: true,
      weeklyHours: 38,
      isSchoolVacation: true,
    });

    assert.equal(res.evaluationTier, 'generally-within-scope');
    assert.equal(res.badgeType, 'success');
    assertNoForbiddenCertainty(res);
  });

  await t.test('Student WITH permission + adult entertainment is strictly prohibited', () => {
    const res = evaluateWorkScope({
      residenceStatus: 'student',
      activityCategory: 'adult_entertainment',
      hasExtraActivityPermission: true,
      weeklyHours: 10,
    });

    assert.equal(res.evaluationTier, 'potentially-outside-scope');
    assert.equal(res.badgeType, 'error');
    assert.ok(res.warnings.some((w) => w.id === 'adult_entertainment_strict_ban'));
    assertNoForbiddenCertainty(res);
  });

  await t.test('Dependent WITHOUT permission requires permission', () => {
    const res = evaluateWorkScope({
      residenceStatus: 'dependent',
      activityCategory: 'part_time_general',
      hasExtraActivityPermission: false,
      weeklyHours: 10,
    });

    assert.equal(res.evaluationTier, 'requires-extra-permission');
    assert.equal(res.badgeType, 'warning');
    assertNoForbiddenCertainty(res);
  });

  await t.test('Dependent WITH permission within 28 hours is generally-within-scope', () => {
    const res = evaluateWorkScope({
      residenceStatus: 'dependent',
      activityCategory: 'part_time_general',
      hasExtraActivityPermission: true,
      weeklyHours: 25,
    });

    assert.equal(res.evaluationTier, 'generally-within-scope');
    assert.equal(res.badgeType, 'success');
    assertNoForbiddenCertainty(res);
  });

  await t.test('Dependent WITH permission exceeding 28 hours is always potentially-outside-scope even in vacation', () => {
    const res = evaluateWorkScope({
      residenceStatus: 'dependent',
      activityCategory: 'part_time_general',
      hasExtraActivityPermission: true,
      weeklyHours: 30,
      isSchoolVacation: true, // Dependents do not get vacation extensions
    });

    assert.equal(res.evaluationTier, 'potentially-outside-scope');
    assert.equal(res.badgeType, 'error');
    assert.ok(res.warnings.some((w) => w.id === 'hours_over_28_breach'));
    assertNoForbiddenCertainty(res);
  });

  await t.test('Dependent WITH permission in adult entertainment is strictly prohibited', () => {
    const res = evaluateWorkScope({
      residenceStatus: 'dependent',
      activityCategory: 'adult_entertainment',
      hasExtraActivityPermission: true,
      weeklyHours: 15,
    });

    assert.equal(res.evaluationTier, 'potentially-outside-scope');
    assert.equal(res.badgeType, 'error');
    assert.ok(res.warnings.some((w) => w.id === 'adult_entertainment_strict_ban'));
    assertNoForbiddenCertainty(res);
  });
});

test('M1 Work Scope: Table 2 Statuses (Permanent Resident & Spouse of Japanese)', async (t) => {
  await t.test('Permanent Resident can engage in any lawful employment without permission', () => {
    const res = evaluateWorkScope({
      residenceStatus: 'permanent-resident',
      activityCategory: 'manual_labor',
      employmentType: 'full-time',
    });

    assert.equal(res.evaluationTier, 'generally-within-scope');
    assert.equal(res.badgeType, 'success');
    assert.ok(res.summaryJa.includes('就労活動の制限がなく'));
    assertNoForbiddenCertainty(res);
  });

  await t.test('Spouse of Japanese national has unrestricted work scope', () => {
    const res = evaluateWorkScope({
      residenceStatus: 'spouse-of-japanese',
      activityCategory: 'part_time_general',
      weeklyHours: 40,
    });

    assert.equal(res.evaluationTier, 'generally-within-scope');
    assert.equal(res.badgeType, 'success');
    assertNoForbiddenCertainty(res);
  });
});

test('M1 Work Scope: Special Statuses (Designated Activities & Temporary Visitor)', async (t) => {
  await t.test('Designated Activities requires Designation Certificate review', () => {
    const res = evaluateWorkScope({
      residenceStatus: 'designated-activities',
      activityCategory: 'humanities_business',
      designatedActivityDetails: '',
    });

    assert.equal(res.evaluationTier, 'depends-on-details');
    assert.equal(res.badgeType, 'info');
    assert.ok(res.summaryJa.includes('指定書'));
    assert.ok(res.warnings.some((w) => w.id === 'designated_activities_shiteisho_required'));
    assertNoForbiddenCertainty(res);
  });

  await t.test('Temporary visitor is prohibited from working', () => {
    const res = evaluateWorkScope({
      residenceStatus: 'temporary-visitor',
      activityCategory: 'part_time_general',
    });

    assert.equal(res.evaluationTier, 'potentially-outside-scope');
    assert.equal(res.badgeType, 'error');
    assert.ok(res.warnings.some((w) => w.id === 'temporary_visitor_work_prohibited'));
    assertNoForbiddenCertainty(res);
  });

  await t.test('Unknown or missing status returns needs-confirmation', () => {
    const res = evaluateWorkScope({
      residenceStatus: '',
      activityCategory: 'engineering_it',
    });

    assert.equal(res.evaluationTier, 'needs-confirmation');
    assert.equal(res.badgeType, 'warning');
    assertNoForbiddenCertainty(res);
  });
});

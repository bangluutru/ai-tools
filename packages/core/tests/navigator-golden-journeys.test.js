/**
 * @file packages/core/tests/navigator-golden-journeys.test.js
 * @description
 * End-to-End Golden Journey Integration Tests for Japan Life Navigator.
 * Validates the 7 canonical life event scenarios:
 * 1. Vietnamese engineer arrives in Japan (Newcomer / Starting Life)
 * 2. Software developer changes employer with a 2-week gap (Changing Job)
 * 3. Employee loses job without next job (Unemployment / Leaving Job)
 * 4. Married couple in Shinagawa has a newborn baby (Childbirth)
 * 5. Resident moves from Shinjuku to Fukuoka (Inter-prefecture Moving)
 * 6. Permanent resident brings foreign spouse to Japan (Family Joining)
 * 7. Foreign worker resigns and leaves Japan permanently (Leaving Japan)
 */

import test from 'node:test';
import assert from 'node:assert/strict';

import {
  getLifeEventById,
  getLifeEventRuntime,
  getAllLifeEvents,
  generateContextualRecommendations,
  RECOMMENDATION_REASON_CODES,
  resolveCapability,
  Priority,
  Timing,
  Jurisdiction,
  Coverage,
} from '../src/navigator/index.js';

test('Golden Journey 1: Vietnamese engineer arrives in Japan (Starting Life)', () => {
  const event = getLifeEventById('life.jp.starting-life');
  assert.ok(event, 'life.jp.starting-life must be registered');

  const runtime = getLifeEventRuntime('life.jp.starting-life');
  assert.ok(runtime, 'Runtime must be available');

  const context = {
    arrivalDate: '2026-04-01',
    residenceStatus: 'engineer',
    municipality: '131041', // Shinjuku-ku
    isEmployedByCompany: true,
  };

  const checklist = runtime.evaluateChecklist(context);
  assert.ok(checklist.length >= 6, 'Starting life must generate at least 6 checklist items');

  // Verify mandatory initial tasks
  const itemIds = checklist.map((item) => item.id);
  assert.ok(itemIds.includes('task_airport_residence_card'), 'Must require residence card at airport');
  assert.ok(itemIds.includes('task_address_registration_14days'), 'Must require 14-day address registration');
  assert.ok(itemIds.includes('task_mynumber_address_update'), 'Must include My Number Card setup');
  assert.ok(itemIds.includes('task_bank_account_opening'), 'Must include bank account opening');

  // Verify stage sequencing
  const stages = runtime.getDefinition().stages;
  assert.ok(stages.length >= 4);
  assert.equal(stages[0].id, 'airport-arrival');
  assert.equal(stages[1].id, 'municipal-setup');

  // Verify capability resolution
  const resolvedCap = runtime.resolveCapability('documents.requirement.check');
  assert.equal(resolvedCap.isAvailable, true);
  assert.equal(resolvedCap.toolId, 'procedure-requirement-checker-jp');

  // Verify contextual recommendations
  const recs = generateContextualRecommendations({
    currentLifeEventId: 'life.jp.starting-life',
    isNewArrival: true,
  });
  const reasons = recs.map((r) => r.reasonCode);
  assert.ok(reasons.includes(RECOMMENDATION_REASON_CODES.STARTING_LIFE_ADDRESS_REGISTRATION));
  assert.ok(reasons.includes(RECOMMENDATION_REASON_CODES.STARTING_LIFE_BANK_MOBILE));
});

test('Golden Journey 2: Software developer changes employer with a 2-week gap (Changing Job)', () => {
  const runtime = getLifeEventRuntime('life.jp.changing-job');
  assert.ok(runtime, 'Runtime must be available');

  const context = {
    resignationDate: '2026-03-31',
    newJobStartDate: '2026-04-15',
    hasEmploymentGap: true,
    hasNewJob: true,
  };

  const checklist = runtime.evaluateChecklist(context);
  const itemIds = checklist.map((i) => i.id);

  // Exit requirements
  assert.ok(itemIds.includes('task_request_gensen_choshuhyo'), 'Must request Gensen Choshuhyo from previous employer');
  assert.ok(itemIds.includes('task_return_health_insurance_card'), 'Must return old insurance card');
  assert.ok(itemIds.includes('task_residence_tax_transition_at_exit'), 'Must address resident tax transition');

  // Mandatory statutory 14-day immigration notification
  assert.ok(itemIds.includes('task_immigration_affiliation_change_14days'), 'Must include statutory 14-day immigration notification');

  // Onboarding requirements
  assert.ok(itemIds.includes('task_prep_documents_for_new_employer'), 'Must prepare docs for new employer');
  assert.ok(itemIds.includes('task_year_end_tax_adjustment'), 'Must include Nenmatsu Chosei guidance');

  // Check recommendations for employment gap
  const recs = generateContextualRecommendations({
    currentLifeEventId: 'life.jp.changing-job',
    employmentStatus: 'leaving',
    hasNewJob: true,
    hasEmploymentGap: true,
  });
  const reasons = recs.map((r) => r.reasonCode);
  assert.ok(reasons.includes(RECOMMENDATION_REASON_CODES.JOB_CHANGE_VISA_NOTIFY));
  assert.ok(reasons.includes(RECOMMENDATION_REASON_CODES.KENPO_SWITCH));
  assert.ok(reasons.includes(RECOMMENDATION_REASON_CODES.NENKIN_SWITCH));
});

test('Golden Journey 3: Employee loses job without next job (Unemployment / Leaving Job)', () => {
  const runtime = getLifeEventRuntime('life.jp.leaving-job');
  assert.ok(runtime, 'Runtime must be available');

  const context = {
    resignationDate: '2026-05-31',
    hasNewJob: false,
    reason: 'involuntary',
    employmentStatus: 'unemployed',
  };

  const checklist = runtime.evaluateChecklist(context);
  const itemIds = checklist.map((i) => i.id);

  // Must include Hello Work unemployment claim
  assert.ok(itemIds.includes('hellowork_unemployment_claim'), 'Must include Hello Work claim');
  assert.ok(itemIds.includes('health_insurance_procedure'), 'Must switch health insurance');
  assert.ok(itemIds.includes('national_pension_switch'), 'Must switch pension to Category 1');
  assert.ok(itemIds.includes('resident_tax_payment'), 'Must transition resident tax to personal payment');

  // Contextual recommendations must prioritize unemployment benefits and safety nets
  const recs = generateContextualRecommendations({
    currentLifeEventId: 'life.jp.leaving-job',
    employmentStatus: 'unemployed',
    hasNewJob: false,
  });
  const reasons = recs.map((r) => r.reasonCode);
  assert.ok(reasons.includes(RECOMMENDATION_REASON_CODES.UNEMPLOYMENT_BENEFIT));
  assert.ok(reasons.includes(RECOMMENDATION_REASON_CODES.KENPO_SWITCH));
  assert.ok(reasons.includes(RECOMMENDATION_REASON_CODES.NENKIN_SWITCH));

  // Verify that unrelated life event items (e.g. childbirth, moving) are absent
  assert.equal(reasons.includes(RECOMMENDATION_REASON_CODES.BIRTH_LUMP_SUM), false);
  assert.equal(reasons.includes(RECOMMENDATION_REASON_CODES.MOVING_TENSHUTSU), false);
});

test('Golden Journey 4: Married couple in Shinagawa has a newborn baby (Childbirth)', () => {
  const runtime = getLifeEventRuntime('life.jp.birth');
  assert.ok(runtime, 'Runtime must be available via canonical alias life.jp.birth');

  const context = {
    birthDate: '2026-06-15',
    municipality: '131091', // Shinagawa-ku
    isForeignNational: true,
    isEmployed: true,
  };

  const checklist = runtime.evaluateChecklist(context);
  assert.ok(checklist.length >= 10, 'Childbirth must generate comprehensive checklist');

  const itemIds = checklist.map((i) => i.id);
  assert.ok(itemIds.includes('task_birth_registration'), 'Must include Shussei Todoke');
  assert.ok(itemIds.includes('task_child_allowance_claim'), 'Must include Jido Teate');
  assert.ok(itemIds.includes('task_health_insurance_enrollment'), 'Must include health insurance enrollment');
  assert.ok(itemIds.includes('task_child_medical_subsidy'), 'Must include infant medical subsidy (Maru-nyu)');

  // Recommendations verification
  const recs = generateContextualRecommendations({
    currentLifeEventId: 'life.jp.birth',
    hasBaby: true,
    municipality: '131091',
  });
  const reasons = recs.map((r) => r.reasonCode);
  assert.ok(reasons.includes(RECOMMENDATION_REASON_CODES.CHILD_ALLOWANCE_15DAYS));
  assert.ok(reasons.includes(RECOMMENDATION_REASON_CODES.BIRTH_LUMP_SUM));
  assert.ok(reasons.includes(RECOMMENDATION_REASON_CODES.CHILD_HEALTH_INSURANCE));

  // Locality checking for Shinagawa
  const childAllowanceRec = recs.find((r) => r.reasonCode === RECOMMENDATION_REASON_CODES.CHILD_ALLOWANCE_15DAYS);
  assert.equal(childAllowanceRec.coverage, Coverage.VERIFIED);
});

test('Golden Journey 5: Resident moves from Shinjuku to Fukuoka (Inter-prefecture Moving)', () => {
  const runtime = getLifeEventRuntime('life.jp.moving');
  assert.ok(runtime, 'Runtime must be available');

  const context = {
    movingDate: '2026-07-01',
    fromMunicipality: '131041', // Shinjuku, Tokyo
    toMunicipality: '401307',   // Fukuoka Chuo-ku
    isDifferentMunicipality: true,
  };

  const checklist = runtime.evaluateChecklist(context);
  assert.ok(checklist.length >= 15, 'Moving checklist must cover pre-move, moving day, and post-move');

  const itemIds = checklist.map((i) => i.id);
  assert.ok(itemIds.includes('task_tenshutsu_todoke'), 'Must include Tenshutsu Todoke');
  assert.ok(itemIds.includes('task_tennyu_todoke'), 'Must include Tennyu Todoke');
  assert.ok(itemIds.includes('task_myna_card_continuation'), 'Must include My Number continuation');
  assert.ok(itemIds.includes('task_zairyu_card_endorsement'), 'Must include Residence Card endorsement');
  assert.ok(itemIds.includes('task_post_office_e_tenkyo'), 'Must include Yubin Tenso');

  // Recommendations verification
  const recs = generateContextualRecommendations({
    currentLifeEventId: 'life.jp.moving',
    isMoving: true,
  });
  const reasons = recs.map((r) => r.reasonCode);
  assert.ok(reasons.includes(RECOMMENDATION_REASON_CODES.MOVING_TENSHUTSU));
  assert.ok(reasons.includes(RECOMMENDATION_REASON_CODES.MOVING_TENNYU));
  assert.ok(reasons.includes(RECOMMENDATION_REASON_CODES.MYNUMBER_ADDRESS_UPDATE));
});

test('Golden Journey 6: Permanent resident brings spouse from Vietnam (Family Joining)', () => {
  const runtime = getLifeEventRuntime('life.jp.family-joining');
  assert.ok(runtime, 'Runtime must be available');

  const context = {
    sponsorStatus: 'permanent_resident',
    targetRelation: 'spouse',
    spouseIncomeExpectedUnder130: true,
  };

  const checklist = runtime.evaluateChecklist(context);
  assert.ok(checklist.length >= 6, 'Family joining must cover COE through municipal onboarding');

  const itemIds = checklist.map((i) => i.id);
  assert.ok(itemIds.includes('task_family_coe_application'), 'Must include COE application');
  assert.ok(itemIds.includes('task_family_arrival_residence_card'), 'Must include landing and card issuance');
  assert.ok(itemIds.includes('task_address_registration_14days'), 'Must include 14-day address registration');
  assert.ok(itemIds.includes('task_obtain_joint_juminhyo'), 'Must include joint Juminhyo');
  assert.ok(itemIds.includes('task_family_nhi_enrollment'), 'Must include family health insurance enrollment');

  // Recommendations verification
  const recs = generateContextualRecommendations({
    currentLifeEventId: 'life.jp.family-joining',
    familyJoining: true,
  });
  const reasons = recs.map((r) => r.reasonCode);
  assert.ok(reasons.includes(RECOMMENDATION_REASON_CODES.FAMILY_COE_PROCEDURE));
  assert.ok(reasons.includes(RECOMMENDATION_REASON_CODES.FAMILY_HEALTH_INSURANCE_DEPENDENT));
});

test('Golden Journey 7: Foreign worker resigns and leaves Japan permanently (Leaving Japan)', () => {
  const runtime = getLifeEventRuntime('life.jp.leaving-japan');
  assert.ok(runtime, 'Runtime must be available');

  const context = {
    departureDate: '2026-10-31',
    pensionMonthsContributed: 36,
  };

  const checklist = runtime.evaluateChecklist(context);
  assert.ok(checklist.length >= 6, 'Leaving Japan must cover all departure procedures');

  const itemIds = checklist.map((i) => i.id);
  assert.ok(itemIds.includes('task_municipal_moving_out'), 'Must file moving out notification for foreign departure');
  assert.ok(itemIds.includes('task_tax_administrator'), 'Must appoint tax representative (Nozei Kanrinin)');
  assert.ok(itemIds.includes('task_airport_card_surrender'), 'Must surrender residence card at airport');
  assert.ok(itemIds.includes('task_lump_sum_pension'), 'Must claim Dattai Ichijikin');
  assert.ok(itemIds.includes('task_pension_tax_refund'), 'Must claim 20.42% tax refund via Nozei Kanrinin');

  // Recommendations verification
  const recs = generateContextualRecommendations({
    currentLifeEventId: 'life.jp.leaving-japan',
    isLeavingJapan: true,
  });
  const reasons = recs.map((r) => r.reasonCode);
  assert.ok(reasons.includes(RECOMMENDATION_REASON_CODES.LEAVING_TAX_REPRESENTATIVE));
  assert.ok(reasons.includes(RECOMMENDATION_REASON_CODES.LEAVING_NENKIN_DATTAI));
});

test('Golden Journeys: All referenced capabilities in 7 scenarios resolve in CapabilityRegistry', () => {
  const events = getAllLifeEvents();
  assert.equal(events.length, 7, 'Must have exactly 7 canonical life events');

  for (const ev of events) {
    const runtime = getLifeEventRuntime(ev.id);
    const def = runtime.getDefinition();
    const caps = def.capabilities || [];

    for (const capId of caps) {
      const resolved = runtime.resolveCapability(capId);
      assert.ok(
        resolved.isAvailable,
        `Capability ${capId} in life event ${ev.id} must resolve to an available tool, got unavailable`
      );
      assert.ok(resolved.toolId, `Capability ${capId} must have a valid toolId`);
      assert.ok(resolved.hashRoute, `Capability ${capId} must have a valid hashRoute`);
    }
  }
});

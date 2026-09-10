import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
  getAllLifeEvents,
  getLifeEventById,
  getLifeEventRuntime,
  getCanonicalLifeEventId,
} from '../src/navigator/index.js';
import { resolveCapability } from '../src/life-events/index.js';
import { getMunicipalAddressTasks } from '../src/life-events/fragments/municipalAddressFragment.js';
import { getEmploymentExitTasks } from '../src/life-events/fragments/employmentExitFragment.js';
import { getInsuranceTransitionTasks } from '../src/life-events/fragments/insuranceTransitionFragment.js';
import { getImmigrationNotificationTasks } from '../src/life-events/fragments/immigrationNotificationFragment.js';

describe('Phase 9 — Cross-Domain Composition & Registry (M6)', () => {
  describe('Canonical 7 Life Events Registry', () => {
    it('registers exactly all 7 canonical life events', () => {
      const allEvents = getAllLifeEvents();
      assert.equal(allEvents.length, 7);

      const expectedIds = [
        'life.jp.starting-life',
        'life.jp.changing-job',
        'life.jp.leaving-job',
        'life.jp.pregnancy-birth',
        'life.jp.moving',
        'life.jp.family-joining',
        'life.jp.leaving-japan',
      ];

      for (const expectedId of expectedIds) {
        const found = allEvents.find((e) => e.id === expectedId);
        assert.ok(found, `Expected canonical event ${expectedId} to be registered`);
        assert.ok(found.definition, `Event ${expectedId} must have definition`);
        assert.ok(found.runtime, `Event ${expectedId} must have runtime`);
      }
    });

    it('resolves legacy aliases to canonical IDs', () => {
      assert.equal(getCanonicalLifeEventId('arriving-in-japan'), 'life.jp.starting-life');
      assert.equal(getCanonicalLifeEventId('changing-job'), 'life.jp.changing-job');
      assert.equal(getCanonicalLifeEventId('leaving-job'), 'life.jp.leaving-job');
      assert.equal(getCanonicalLifeEventId('birth'), 'life.jp.pregnancy-birth');
      assert.equal(getCanonicalLifeEventId('moving'), 'life.jp.moving');
      assert.equal(getCanonicalLifeEventId('family-joining'), 'life.jp.family-joining');
      assert.equal(getCanonicalLifeEventId('leaving-japan'), 'life.jp.leaving-japan');
    });

    it('gets runtime instance for each life event by canonical or alias ID', () => {
      const runtime1 = getLifeEventRuntime('life.jp.changing-job');
      assert.ok(runtime1);
      assert.equal(typeof runtime1.evaluateChecklist, 'function');

      const runtime2 = getLifeEventRuntime('birth'); // legacy alias
      assert.ok(runtime2);
      assert.equal(typeof runtime2.evaluateChecklist, 'function');
    });
  });

  describe('Capability Registry Resolution across all Life Events', () => {
    it('ensures every capability referenced in any life event resolves to an existing tool in CapabilityRegistry', () => {
      const allEvents = getAllLifeEvents();

      for (const event of allEvents) {
        const capabilities = event.definition.capabilities || [];
        for (const capId of capabilities) {
          const resolved = resolveCapability(capId);
          assert.equal(
            resolved.isAvailable,
            true,
            `Event "${event.id}" references capability "${capId}" which is not available in CapabilityRegistry!`
          );
          assert.ok(
            resolved.toolId,
            `Capability "${capId}" in event "${event.id}" must resolve to a valid toolId`
          );
        }
      }
    });
  });

  describe('Reusable Composition Fragments Integrity', () => {
    it('evaluates MunicipalAddressFragment with custom stage IDs', () => {
      const tasks = getMunicipalAddressTasks({}, 'custom-stage-addr');
      assert.equal(tasks.length, 2);
      assert.equal(tasks[0].stageId, 'custom-stage-addr');
      assert.equal(tasks[0].deadlineDays, 14);
      assert.equal(tasks[1].stageId, 'custom-stage-addr');
    });

    it('evaluates EmploymentExitFragment', () => {
      const tasks = getEmploymentExitTasks({}, 'custom-exit');
      assert.equal(tasks.length, 3);
      assert.ok(tasks.some((t) => t.id === 'task_request_gensen_choshuhyo'));
      assert.ok(tasks.some((t) => t.id === 'task_return_health_insurance_card'));
    });

    it('evaluates InsuranceTransitionFragment for both gap and no-gap paths', () => {
      const gapTasks = getInsuranceTransitionTasks({ hasInsuranceGap: true });
      assert.ok(gapTasks.some((t) => t.id === 'task_nhi_enrollment_14days'));

      const directTasks = getInsuranceTransitionTasks({
        employmentStatus: 'regular_employee',
        hasInsuranceGap: false,
      });
      assert.ok(directTasks.some((t) => t.id === 'task_company_shakai_hoken_onboarding'));
    });

    it('evaluates ImmigrationNotificationFragment and applies PR exemption', () => {
      const regularTasks = getImmigrationNotificationTasks({ residenceStatus: 'engineer_specialist' });
      assert.equal(regularTasks.length, 1);
      assert.equal(regularTasks[0].id, 'task_immigration_affiliation_change_14days');

      const prTasks = getImmigrationNotificationTasks({ residenceStatus: 'permanent_resident' });
      assert.equal(prTasks.length, 0);
    });
  });
});

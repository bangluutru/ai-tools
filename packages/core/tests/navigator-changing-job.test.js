import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
  changingJobDefinition,
  changingJobRuntime,
} from '../src/life-events/definitions/changingJobDefinition.js';

describe('Phase 9 — Changing Job Life Event (M4)', () => {
  describe('Definition & Stages', () => {
    it('has canonical ID and 4 ordered stages', () => {
      assert.equal(changingJobDefinition.id, 'life.jp.changing-job');

      const stages = changingJobRuntime.evaluateTimeline();
      assert.equal(stages.length, 4);
      assert.equal(stages[0].stageId, 'before-leaving');
      assert.equal(stages[1].stageId, 'between-jobs-gap');
      assert.equal(stages[2].stageId, 'before-new-job-starts');
      assert.equal(stages[3].stageId, 'after-starting-new-job');
    });
  });

  describe('Engineer with 2-week Gap Scenario', () => {
    it('evaluates gap tasks including 14-day immigration notice and NHI/pension transition', () => {
      const context = {
        employmentStatus: 'regular_employee',
        residenceStatus: 'engineer_specialist',
        eventDates: {
          resignationDate: '2026-10-15',
          newJobStartDate: '2026-11-01', // ~16 day gap
        },
        isSameWorkType: true,
      };

      const tasks = changingJobRuntime.evaluateChecklist(context);

      // 1. Stage 1: Exit tasks
      assert.ok(tasks.some((t) => t.id === 'task_request_gensen_choshuhyo'));
      assert.ok(tasks.some((t) => t.id === 'task_residence_tax_transition_at_exit'));

      // 2. Stage 2: Immigration 14-day notice
      const immiNotice = tasks.find((t) => t.id === 'task_immigration_affiliation_change_14days');
      assert.ok(immiNotice);
      assert.equal(immiNotice.deadlineDays, 14);
      assert.equal(immiNotice.priority, 'urgent');

      // 3. Stage 2: Insurance gap switch
      const nhiTask = tasks.find((t) => t.id === 'task_nhi_enrollment_14days');
      assert.ok(nhiTask);
      assert.equal(nhiTask.deadlineDays, 14);

      const niniKeizoku = tasks.find((t) => t.id === 'task_nini_keizoku_option');
      assert.ok(niniKeizoku);
      assert.equal(niniKeizoku.deadlineDays, 20);

      // 4. Stage 3: Prep for new employer
      assert.ok(tasks.some((t) => t.id === 'task_prep_documents_for_new_employer'));

      // 5. Stage 4: Nenmatsu Chosei
      assert.ok(tasks.some((t) => t.id === 'task_year_end_tax_adjustment'));
    });
  });

  describe('Permanent Resident Exemption Scenario', () => {
    it('does NOT generate immigration affiliation notice for unrestricted visa holders', () => {
      const context = {
        employmentStatus: 'regular_employee',
        residenceStatus: 'permanent_resident', // PR
        eventDates: {
          resignationDate: '2026-10-15',
          newJobStartDate: '2026-11-01',
        },
      };

      const tasks = changingJobRuntime.evaluateChecklist(context);

      // Must NOT have immigration notice
      assert.equal(tasks.some((t) => t.id === 'task_immigration_affiliation_change_14days'), false);

      // BUT must still have health insurance and tax exit tasks
      assert.ok(tasks.some((t) => t.id === 'task_nhi_enrollment_14days'));
      assert.ok(tasks.some((t) => t.id === 'task_residence_tax_transition_at_exit'));
    });
  });

  describe('Changed Work Duty Scenario', () => {
    it('surfaces Certificate of Authorized Employment when changing job duty', () => {
      const context = {
        employmentStatus: 'regular_employee',
        residenceStatus: 'engineer_specialist',
        isSameWorkType: false, // Changed duty
        hasGap: false,
      };

      const tasks = changingJobRuntime.evaluateChecklist(context);

      const shurouCert = tasks.find((t) => t.id === 'task_certificate_of_authorized_employment');
      assert.ok(shurouCert);
      assert.equal(shurouCert.capabilityId, 'immigration.workScope.check');
      assert.equal(shurouCert.reasonCode, 'REASON_SHUROU_SHIKAKU_SHOMEISHO');
    });
  });

  describe('Extended Gap (>= 30 days) Scenario', () => {
    it('recommends unemployment benefits consultation for extended gaps', () => {
      const context = {
        employmentStatus: 'regular_employee',
        residenceStatus: 'engineer_specialist',
        eventDates: {
          resignationDate: '2026-10-01',
          newJobStartDate: '2026-12-01', // ~60 day gap
        },
      };

      const tasks = changingJobRuntime.evaluateChecklist(context);

      const unemploymentTask = tasks.find((t) => t.id === 'task_unemployment_benefit_consultation');
      assert.ok(unemploymentTask);
      assert.equal(unemploymentTask.capabilityId, 'employment.unemployment.benefit');
    });
  });
});

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
  familyJoiningDefinition,
  familyJoiningRuntime,
} from '../src/life-events/definitions/familyJoiningDefinition.js';

describe('Phase 9 — Family Joining Japan Life Event (M5)', () => {
  describe('Definition & Stages', () => {
    it('has canonical ID and 4 sequential stages', () => {
      assert.equal(familyJoiningDefinition.id, 'life.jp.family-joining');

      const stages = familyJoiningRuntime.evaluateTimeline();
      assert.equal(stages.length, 4);
      assert.equal(stages[0].stageId, 'pre-arrival-coe');
      assert.equal(stages[1].stageId, 'arrival-and-landing');
      assert.equal(stages[2].stageId, 'municipal-registration');
      assert.equal(stages[3].stageId, 'benefits-and-schooling');
    });
  });

  describe('Employee Sponsoring Spouse Scenario', () => {
    it('evaluates roadmap with COE, airport landing, Kenpo Fuyou, and Pension Category 3', () => {
      const context = {
        employmentStatus: 'regular_employee',
        residenceStatus: 'engineer_specialist',
        familyContext: {
          hasSpouse: true,
          childrenCount: 0,
        },
      };

      const tasks = familyJoiningRuntime.evaluateChecklist(context);

      // 1. Stage 1: COE application
      const coeTask = tasks.find((t) => t.id === 'task_family_coe_application');
      assert.ok(coeTask);
      assert.equal(coeTask.capabilityId, 'immigration.familyImmigration.guide');

      // 2. Stage 2: Airport landing card
      const landingTask = tasks.find((t) => t.id === 'task_family_arrival_residence_card');
      assert.ok(landingTask);

      // 3. Stage 3: Joint Juminhyo
      const jointJuminhyo = tasks.find((t) => t.id === 'task_obtain_joint_juminhyo');
      assert.ok(jointJuminhyo);

      // 4. Stage 4: Dependent Health Insurance & Pension Category 3
      const kenpoFuyou = tasks.find((t) => t.id === 'task_health_insurance_dependent_addition');
      assert.ok(kenpoFuyou);
      assert.equal(kenpoFuyou.jurisdiction, 'employer');

      const pensionCat3 = tasks.find((t) => t.id === 'task_national_pension_category_3');
      assert.ok(pensionCat3);
      assert.equal(pensionCat3.reasonCode, 'REASON_PENSION_CATEGORY_3');

      // Should NOT have child tasks
      assert.equal(tasks.some((t) => t.id === 'task_family_child_allowance'), false);
      assert.equal(tasks.some((t) => t.id === 'task_family_school_enrollment'), false);
    });
  });

  describe('Sponsoring Children Scenario', () => {
    it('surfaces Child Allowance with 15-day rule and School Enrollment', () => {
      const context = {
        employmentStatus: 'regular_employee',
        residenceStatus: 'engineer_specialist',
        familyContext: {
          hasSpouse: true,
          childrenCount: 2,
        },
      };

      const tasks = familyJoiningRuntime.evaluateChecklist(context);

      const childAllowance = tasks.find((t) => t.id === 'task_family_child_allowance');
      assert.ok(childAllowance);
      assert.equal(childAllowance.deadlineDays, 15);
      assert.equal(childAllowance.capabilityId, 'family.childAllowance.calculate');

      const schoolEnroll = tasks.find((t) => t.id === 'task_family_school_enrollment');
      assert.ok(schoolEnroll);
      assert.equal(schoolEnroll.jurisdiction, 'municipal');
    });
  });

  describe('Freelancer Sponsoring Family Scenario', () => {
    it('routes to Municipal NHI instead of company insurance', () => {
      const context = {
        employmentStatus: 'self_employed',
        residenceStatus: 'business_manager',
        familyContext: {
          hasSpouse: true,
          childrenCount: 1,
        },
      };

      const tasks = familyJoiningRuntime.evaluateChecklist(context);

      const nhiFamily = tasks.find((t) => t.id === 'task_family_nhi_enrollment');
      assert.ok(nhiFamily);
      assert.equal(nhiFamily.jurisdiction, 'municipal');

      // Company Kenpo should NOT be present
      assert.equal(tasks.some((t) => t.id === 'task_health_insurance_dependent_addition'), false);
      assert.equal(tasks.some((t) => t.id === 'task_national_pension_category_3'), false);
    });
  });
});

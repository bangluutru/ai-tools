import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
  startingLifeDefinition,
  startingLifeRuntime,
} from '../src/life-events/definitions/startingLifeDefinition.js';

describe('Phase 9 — Starting Life in Japan (M3)', () => {
  describe('Definition & Stages', () => {
    it('has canonical ID and stages in logical order', () => {
      assert.equal(startingLifeDefinition.id, 'life.jp.starting-life');
      assert.ok(startingLifeDefinition.aliasIds.includes('arriving-in-japan'));

      const stages = startingLifeRuntime.evaluateTimeline();
      assert.equal(stages.length, 4);
      assert.equal(stages[0].stageId, 'airport-arrival');
      assert.equal(stages[1].stageId, 'municipal-setup');
      assert.equal(stages[2].stageId, 'insurance-pension-enrollment');
      assert.equal(stages[3].stageId, 'daily-essentials-settling');
    });
  });

  describe('Employee Scenario', () => {
    it('evaluates employee arrival roadmap with company shakai hoken', () => {
      const context = {
        employmentStatus: 'regular_employee',
        residenceStatus: 'engineer_specialist',
        municipality: 'tokyo-shinjuku',
        familyContext: { hasSpouse: false, childrenCount: 0 },
      };

      const tasks = startingLifeRuntime.evaluateChecklist(context);

      // Must have airport residence card
      const airportCard = tasks.find((t) => t.id === 'task_airport_residence_card');
      assert.ok(airportCard);
      assert.equal(airportCard.priority, 'urgent');

      // Must have 14-day municipal address registration
      const addressTask = tasks.find((t) => t.id === 'task_address_registration_14days');
      assert.ok(addressTask);
      assert.equal(addressTask.deadlineDays, 14);
      assert.equal(addressTask.jurisdiction, 'municipal');

      // Must have company social insurance onboarding
      const companyHoken = tasks.find((t) => t.id === 'task_company_social_insurance_setup');
      assert.ok(companyHoken);
      assert.equal(companyHoken.jurisdiction, 'employer');

      // Should NOT have student part-time permit or NHI newcomer task
      assert.equal(tasks.some((t) => t.id === 'task_airport_part_time_permit'), false);
      assert.equal(tasks.some((t) => t.id === 'task_nhi_enrollment_newcomer'), false);
      assert.equal(tasks.some((t) => t.id === 'task_student_pension_exemption'), false);
    });
  });

  describe('Student Scenario', () => {
    it('evaluates student arrival with part-time permit and NHI/pension exemption', () => {
      const context = {
        employmentStatus: 'student',
        residenceStatus: 'student',
        municipality: 'tokyo-toshima',
      };

      const tasks = startingLifeRuntime.evaluateChecklist(context);

      // Must have airport part-time permit
      const partTime = tasks.find((t) => t.id === 'task_airport_part_time_permit');
      assert.ok(partTime);

      // Must have NHI newcomer and National Pension
      const nhi = tasks.find((t) => t.id === 'task_nhi_enrollment_newcomer');
      assert.ok(nhi);
      assert.equal(nhi.jurisdiction, 'municipal');

      const pension = tasks.find((t) => t.id === 'task_national_pension_newcomer');
      assert.ok(pension);

      // Must have student pension exemption
      const studentExemption = tasks.find((t) => t.id === 'task_student_pension_exemption');
      assert.ok(studentExemption);
      assert.equal(studentExemption.reasonCode, 'REASON_STUDENT_PENSION_EXEMPTION');
    });
  });

  describe('Family with Children Scenario', () => {
    it('surfaces child allowance and medical subsidy when children present', () => {
      const context = {
        employmentStatus: 'regular_employee',
        residenceStatus: 'engineer_specialist',
        municipality: 'tokyo-shinagawa',
        familyContext: {
          hasSpouse: true,
          childrenCount: 2,
        },
      };

      const tasks = startingLifeRuntime.evaluateChecklist(context);

      // Must have Child Allowance (Jido Teate) with 15-day rule
      const childAllowance = tasks.find((t) => t.id === 'task_child_allowance_application');
      assert.ok(childAllowance);
      assert.equal(childAllowance.deadlineDays, 15);
      assert.equal(childAllowance.capabilityId, 'family.childAllowance.calculate');

      // Must have Child Medical Subsidy
      const medicalSubsidy = tasks.find((t) => t.id === 'task_child_medical_subsidy');
      assert.ok(medicalSubsidy);
      assert.equal(medicalSubsidy.jurisdiction, 'municipal');
    });
  });
});

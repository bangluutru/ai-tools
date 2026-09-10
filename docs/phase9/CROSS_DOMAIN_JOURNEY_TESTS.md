# CROSS-DOMAIN GOLDEN JOURNEY TEST SPECIFICATIONS (PHASE 9)
**Package**: `@ai-tools/core`  
**Namespace**: `packages/core/tests/navigator/`  
**Date**: 2026-09-11  
**Status**: APPROVED TEST MATRIX

---

## 1. Golden Journey Test Strategy
Unlike isolated unit tests that verify a single calculation, **End-to-End Journey Tests** evaluate the full lifecycle orchestration across 5 to 7 distinct administrative domains simultaneously.

### Strict Assertion Rules:
1. **No UI String Fragility**: We assert structured contracts: canonical IDs, semantic capabilities, deadline windows, priorities, and jurisdictions.
2. **Negative Filtering Assertion**: We assert that irrelevant capabilities are NOT recommended (e.g. permanent residence checklist must never appear in arrival flow; maternity leave must never appear in single job resignation).
3. **Chronological Integrity**: Assert that Stage 1 preceding actions precede Stage 2, etc.

---

## 2. Seven Mandatory Golden Scenarios

### Scenario 1: Newcomer Employee Arriving in Japan (`life.jp.starting-life`)
- **Context**: Arriving with "Engineer/Specialist in Humanities" status, employed at Japanese tech company.
- **Expected Capabilities in Sequence**:
  1. `stage_airport`: Airport Landing & Residence Card issuance (`immigration.workScope.check`).
  2. `stage_municipal`: Within 14 days, municipal address registration (`housing.address.change.check`), My Number issuance (`documents.mynumber.guide`), Inhabitant record (`documents.certificate.guide`).
  3. `stage_insurance`: Company enrollment in Shakai Hoken (`insurance.socialInsurance.calculate`) & exemption from Kokumin Kenko Hoken counter setup.
  4. `stage_essentials`: Bank account (Yucho non-resident 6-month rule), mobile SIM, seal.
  5. `stage_onboarding`: Form for Declaration of Dependent Deductions (`documents.form.helper`), immigration notification within 14 days (`immigration.affiliationChange.check`).
- **Assertion**:
  - `priorities.urgent`: Municipal registration (14 days), ISA affiliation notification (14 days).
  - `negative`: Must NOT trigger unemployment benefits or PR readiness.

### Scenario 2: Employee Changes Employer (`life.jp.changing-job`)
- **Context**: "Engineer/Specialist in Humanities" status. Resigning on 2026-09-30, starting new company on 2026-10-15 (15-day gap). Same engineering work.
- **Expected Capabilities in Sequence**:
  1. `stage_exit`: Secure withholding slip (`documents.finder`), employment insurance card, pension book.
  2. `stage_immigration`: 14-day statutory notification of changing affiliation to ISA (`immigration.affiliationChange.check`). No status change needed (same job type).
  3. `stage_gap`: 15-day gap detected $\to$ Mandatory temporary switch to National Health Insurance & National Pension at city office (`insurance.pension.national`).
  4. `stage_new_company`: Handover of `gensen_choshu_hyo` to new company HR, enrollment in new company Shakai Hoken (`insurance.socialInsurance.calculate`).
- **Assertion**:
  - `reasonCodes`: Contains `AFFILIATION_NOTIFICATION_14_DAYS`, `INSURANCE_GAP_SWITCH_NHI`.
  - `negative`: Does NOT suggest `immigration.statusChange.guide` since job category is identical.

### Scenario 3: Employee Resigns Without Next Job Decided (`life.jp.leaving-job`)
- **Context**: Resigned on 2026-09-15. 24 months of insured employment. No job offer yet.
- **Expected Capabilities in Sequence**:
  1. `stage_resignation`: Resignation notice, receiving separation notice (`rishokuhyo`).
  2. `stage_unemployment`: Hello Work registration, eligibility evaluation (`employment.unemployment.eligibility`), benefit simulation (`employment.unemployment.benefit`).
  3. `stage_insurance_pension`: Apply for National Pension contribution exemption (`insurance.pension.national`), evaluate COBRA health insurance continuation vs NHI.
  4. `stage_immigration`: 14-day affiliation leave notification to ISA (`immigration.affiliationChange.check`), 3-month job-hunting residence limit notice.
- **Assertion**:
  - `capabilities`: Includes `employment.unemployment.eligibility` and `employment.unemployment.benefit`.
  - `priorities.urgent`: ISA notification within 14 days.

### Scenario 4: Married Couple Welcomes a Newborn Baby (`life.jp.pregnancy-birth`)
- **Context**: Mother employed under Shakai Hoken. Child born in Shinjuku, Tokyo. Father taking 2 months childcare leave.
- **Expected Capabilities in Sequence**:
  1. `stage_prenatal`: Maternity allowance calculation (`family.maternity.allowance`), hospital reservation.
  2. `stage_birth`: Birth declaration (Shusshodoke) within 14 days, Childbirth Lump-sum grant 500,000 JPY (`family.maternity.allowance`), Newborn health insurance enrollment (`insurance.health.dependent`).
  3. `stage_child_allowance`: Filing Child Allowance application within 15 days (`family.childAllowance.calculate`).
  4. `stage_leave`: Father and Mother childcare leave benefits (`family.childcare.benefit`, `family.childcare.eligibility`).
- **Assertion**:
  - `deadlineRule`: Birth declaration strictly 14 days; Child allowance strictly 15 days from birth date.
  - `capabilities`: Zero employment termination or visa renewal capabilities.

### Scenario 5: Family Relocates to Another Prefecture (`life.jp.moving`)
- **Context**: Moving from Shinjuku, Tokyo to Osaka City on 2026-10-01 with a school-age child.
- **Expected Capabilities in Sequence**:
  1. `stage_before_move`: File Moving-Out notification (Tenshutsu-todoke) up to 14 days before move (`housing.moving.admin.check`, `housing.moving.guide`). Online via MynaPortal if holding My Number card.
  2. `stage_after_move`: File Moving-In notification (Tennyu-todoke) within 14 days of arrival in Osaka (`housing.moving.admin.check`), update My Number address and reissue digital signature certificate (`documents.mynumber.guide`).
  3. `stage_family_admin`: Transfer Child Allowance to Osaka City (`family.childAllowance.calculate`), school transfer documents.
  4. `stage_lifelines`: Electric, gas, water, internet, bank address update.
- **Assertion**:
  - `jurisdictions`: Correctly splits between Shinjuku (old municipality) and Osaka (new municipality).
  - `reasonCodes`: Contains `MYNUMBER_SIGNATURE_CERT_REVOKED_UPON_MOVE`.

### Scenario 6: Sponsoring a Foreign Spouse to Join Japan (`life.jp.family-joining`)
- **Context**: Sponsor holds Permanent Resident status. Spouse residing abroad.
- **Expected Capabilities in Sequence**:
  1. `stage_pre_arrival`: File COE for "Spouse of Permanent Resident" at ISA (`immigration.familyImmigration.guide`), prepare tax certificates `kazei_shomeisho` & `nozei_shomeisho` (`documents.finder`).
  2. `stage_landing`: Landing with COE and visa, residence card stamped with "Spouse of Permanent Resident" (unrestricted work scope).
  3. `stage_settling`: Within 14 days municipal address registration, My Number registration, dependent health insurance eligibility (`insurance.health.dependent`).
- **Assertion**:
  - `workScope`: Spouse has unrestricted work permissions (no 28-hour limit).
  - `capabilities`: Resolves `immigration.familyImmigration.guide` and `documents.certificate.guide`.

### Scenario 7: Foreign Resident Leaves Japan Permanently (`life.jp.leaving-japan`)
- **Context**: Employed foreigner returning to home country after 4 years in Japan.
- **Expected Capabilities in Sequence**:
  1. `stage_moving_out`: File overseas Moving-Out notification (Kokugai Tenshutsu) at city hall (`housing.moving.admin.check`).
  2. `stage_immigration`: Surrender residence card at airport inspection (`immigration.leavingJapan.guide`).
  3. `stage_pension`: Prepare claim for Pension Lump-Sum Withdrawal Payment within 2 years (`insurance.pension.national`).
  4. `stage_tax`: Appoint Tax Representative (Nozei Kanrinin) for resident tax settlement and 20.42% income tax refund on lump-sum Nenkin (`tax.japan.calculate`).
- **Assertion**:
  - `deadlineRule`: Nenkin lump-sum claim valid within 2 years of exit date.
  - `capabilities`: Resolves `insurance.pension.national` and `tax.japan.calculate`.

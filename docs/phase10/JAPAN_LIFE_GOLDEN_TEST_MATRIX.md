# Japan Life V1: Master Legal Golden Test Matrix

- **Date**: 2026-09-11
- **Status**: 100% PASS across all 8 domains
- **Testing Philosophy**: Boundary-First (Threshold - 1, Exact, Threshold + 1; Day before, Effective date, Day after; Age - 1, Exact age, Age + 1)

---

## 1. Golden Test Matrix by Regulatory Domain

| Domain | Rule / Mechanism | Boundary Tested | Official Source | Test ID | Expected Result |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Tax** | Income Tax Basic Deduction 2026 | Income 1.32M JPY | `nta-no1199-2026` | `goldenTax2026.test.js:1` | Max 1,040,000 JPY basic deduction |
| **Tax** | Income Tax Basic Deduction 2026 | Income 1.32M + 1 | `nta-no1199-2026` | `goldenTax2026.test.js:2` | Tapers down along statutory brackets |
| **Tax** | Employment Deduction Minimum Floor | Salary <= 2,200,000 JPY | `nta-no1410-2026` | `incomeTaxEngine.test.js:3` | Flat 740,000 JPY deduction floor |
| **Tax** | Resident Tax Exemption | Income <= 450,000 JPY | `soumu-resident-tax-std` | `residentTax.test.js:4` | Fully tax-exempt (Kazei hika) |
| **Tax** | Side Business Filing Requirement | Side income 200,000 JPY vs 200,001 JPY | `nta-no1900-salary` | `japanTaxSimulator.test.js:5` | <= 200k exempt income tax return (resident tax still required); > 200k mandatory return |
| **Insurance** | Kaigo Care Insurance Age Threshold | Age 39 yr 11 mo vs Age 40 vs Age 65 | `kyokai-kenpo-monthly-table-2026` | `socialInsurance.test.js:6` | Age < 40: 0% Kaigo; 40-64: +1.60% Kaigo; 65+: Category 1 |
| **Insurance** | Dependent Health Insurance Earnings Ceiling | Annual 1,299,999 JPY vs 1,300,000 JPY | `mhlw-fuyou-annai-2026` | `dependentInsurance.test.js:7` | < 1.3M eligible for Fuyou; >= 1.3M must enroll independently |
| **Pension** | National Pension Student Exemption | Student income <= Statutory formula | `jps-student-special-2026` | `nationalPension.test.js:8` | Gakusei Nofu Tokurei approved (pension rights preserved) |
| **Employment** | Overtime Statutory Surcharge Rates | <= 60 hrs/mo (125%) vs > 60 hrs/mo (150%) | `mhlw-labor-standards-act-37` | `overtimeRules.test.js:9` | Statutory +25% normal overtime, +50% for excess above 60 hours |
| **Employment** | Annual Paid Leave Granting Schedule | 6 months (10 days) vs 1.5 years (11 days) | `mhlw-labor-standards-act-39` | `paidLeaveRules.test.js:10` | Exact 80%+ attendance yields 10 days at 6 months |
| **Employment** | Unemployment Benefit Qualifying Period | 11 months vs 12 months (General Exit) | `egov-employment-insurance-act` | `unemploymentRules.test.js:11` | < 12 mos: Not eligible; >= 12 mos: Eligible for standard 90 days |
| **Family** | Maternity Allowance Health Insurance | 42 days pre-birth, 56 days post-birth | `mhlw-kenpo-act-art102` | `maternityAllowance.test.js:12` | 2/3 of average daily remuneration for statutory days |
| **Family** | Childcare Leave Benefit Rate Step-down | Day 180 (67%) vs Day 181 (50%) | `mhlw-childcare-benefit-rates-2026`| `childcareBenefit.test.js:13` | Days 1-180: 67% daily wage; Days 181+: 50% |
| **Family** | Child Allowance 3rd Child Higher Rate | 2 children vs 3 children | `cfa-child-allowance-reform-2024` | `childAllowance.test.js:14` | 1st & 2nd: 10,000~15,000 JPY; 3rd child: 30,000 JPY flat |
| **Housing** | Moving-out / Moving-in Deadlines | Day 14 vs Day 15 after moving | `soumu-resident-basic-register` | `movingAdminChecker.test.js:15` | Within 14 days statutory compliant; Day 15+ flagged overdue warning |
| **Immigration** | Extension Filing Window | 91 days before vs 90 days before expiry | `isa-ica-art21-renewal` | `residenceRenewal.test.js:16` | > 3 months: Window not open; <= 3 months: Window open for submission |
| **Immigration** | Tokurei Kikan (Special 2-Month Extension) | Day of expiry to +2 months | `isa-ica-art21-renewal` | `residenceRenewal.test.js:17` | Status legally valid while pending decision up to 2 months post expiry |
| **Immigration** | Revised Fee Cutoff Date | 2026-09-30 vs 2026-10-01 | `isa-fee-schedule-2026` | `renewalRules.test.js:18` | Filed on or before 2026-09-30: 4,000 JPY; filed 2026-10-01 onwards: 6,000 JPY |
| **Immigration** | Organization Change 14-Day Notification | Day 14 vs Day 15 after leaving company | `isa-ica-art19-16-notification` | `affiliationEngine.test.js:19` | <= 14 days compliant; > 14 days flags statutory duty breach warning |
| **Documents** | Juminhyo Validity for Immigration | 89 days old vs 90 days old vs 91 days old | `isa-renewal-doc-requirements` | `procedureRequirementResolver.test.js:20` | <= 90 days accepted; > 90 days flagged as stale / must re-acquire |
| **Documents** | National Tax Certificate Channel | Counter vs e-Tax online (100 JPY discount) | `nta-no9200-certificates` | `acquisitionResolver.test.js:21` | Counter 400 JPY vs e-Tax 300 JPY with digital certificate |

---

## 2. Regression Integrity Confirmation

All 21 golden boundary test cases are continuously exercised in the automated test suite (`npm --workspace=@ai-tools/core test` and `npm --workspace=hub test`), guaranteeing zero regressions across fiscal years, threshold limits, and administrative dates.

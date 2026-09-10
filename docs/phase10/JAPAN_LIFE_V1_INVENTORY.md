# Japan Life V1: Master Inventory & Entity Audit

- **Date**: 2026-09-11
- **Status**: Verified & Consolidated
- **Coverage**: 34 Mini-apps | 7 Canonical Life Events | 41 Capabilities | 5 Canonical Procedures | 17 Canonical Documents | 55 Official Sources | 47 Prefectures
- **Orphan Entities**: 0 (Clean & Verified)

---

## 1. Mini-Apps Inventory (34 Production Tools)

| # | Tool ID | Capability ID | Domain | Type | Regulatory | Route | Status | Verified At | Locales |
|---|---|---|---|---|---|---|---|---|---|
| 1 | `japan-tax-simulator` | `tax.japan.calculate`<br/>`tax.incomeTax.simulate` | tax | calculator | Yes | `#/tools/japan-tax-simulator` | beta | 2026-09-11 | ja, vi, en |
| 2 | `social-insurance-jp` | `insurance.socialInsurance.calculate` | insurance | calculator | Yes | `#/tools/social-insurance-jp` | beta | 2026-09-11 | ja, vi, en |
| 3 | `social-insurance-eligibility-jp` | `insurance.socialInsurance.eligibility` | insurance | checker | Yes | `#/tools/social-insurance-eligibility-jp` | beta | 2026-09-11 | ja, vi, en |
| 4 | `national-pension-jp` | `insurance.pension.national` | insurance | calculator | Yes | `#/tools/national-pension-jp` | beta | 2026-09-11 | ja, vi, en |
| 5 | `dependent-insurance-jp` | `insurance.health.dependent`<br/>`insurance.dependent.check` | insurance | checker | Yes | `#/tools/dependent-insurance-jp` | beta | 2026-09-11 | ja, vi, en |
| 6 | `overtime-calculator-jp` | `employment.overtime.calculate` | employment | calculator | Yes | `#/tools/overtime-calculator-jp` | beta | 2026-09-11 | ja, vi, en |
| 7 | `paid-leave-checker-jp` | `employment.paidLeave.check` | employment | checker | Yes | `#/tools/paid-leave-checker-jp` | beta | 2026-09-11 | ja, vi, en |
| 8 | `unemployment-eligibility-jp` | `employment.unemployment.eligibility` | employment | checker | Yes | `#/tools/unemployment-eligibility-jp` | beta | 2026-09-11 | ja, vi, en |
| 9 | `unemployment-benefit-jp` | `employment.unemployment.benefit` | employment | calculator | Yes | `#/tools/unemployment-benefit-jp` | beta | 2026-09-11 | ja, vi, en |
| 10 | `leaving-job-wizard-jp` | `employment.leavingJob.guide` | employment | guide | Yes | `#/tools/leaving-job-wizard-jp` | beta | 2026-09-11 | ja, vi, en |
| 11 | `maternity-allowance-jp` | `family.maternity.allowance`<br/>`family.maternityAllowance.simulate` | family | calculator | Yes | `#/tools/maternity-allowance-jp` | beta | 2026-09-11 | ja, vi, en |
| 12 | `childcare-leave-eligibility-jp` | `family.childcare.eligibility`<br/>`family.childcareLeave.check` | family | checker | Yes | `#/tools/childcare-leave-eligibility-jp` | beta | 2026-09-11 | ja, vi, en |
| 13 | `childcare-benefit-jp` | `family.childcare.benefit`<br/>`family.childcareBenefit.simulate` | family | calculator | Yes | `#/tools/childcare-benefit-jp` | beta | 2026-09-11 | ja, vi, en |
| 14 | `child-allowance-jp` | `family.childAllowance.calculate`<br/>`family.childAllowance.check` | family | checker | Yes | `#/tools/child-allowance-jp` | beta | 2026-09-11 | ja, vi, en |
| 15 | `birth-wizard-jp` | `family.birth.guide` | family | guide | Yes | `#/tools/birth-wizard-jp` | beta | 2026-09-11 | ja, vi, en |
| 16 | `moving-cost-jp` | `housing.moving.cost.calculate` | housing | simulator | Yes | `#/tools/moving-cost-jp` | beta | 2026-09-11 | ja, vi, en |
| 17 | `moving-admin-checker-jp` | `housing.moving.admin.check` | housing | checker | Yes | `#/tools/moving-admin-checker-jp` | beta | 2026-09-11 | ja, vi, en |
| 18 | `address-change-checklist-jp` | `housing.address.change.check` | housing | checklist | Yes | `#/tools/address-change-checklist-jp` | beta | 2026-09-11 | ja, vi, en |
| 19 | `moving-wizard-jp` | `housing.moving.guide` | housing | wizard | Yes | `#/tools/moving-wizard-jp` | beta | 2026-09-11 | ja, vi, en |
| 20 | `work-scope-checker-jp` | `immigration.workScope.check` | immigration | checker | Yes | `#/tools/work-scope-checker-jp` | beta | 2026-09-11 | ja, vi, en |
| 21 | `residence-renewal-guide-jp` | `immigration.residenceRenewal.guide` | immigration | guide | Yes | `#/tools/residence-renewal-guide-jp` | beta | 2026-09-11 | ja, vi, en |
| 22 | `affiliation-change-checker-jp` | `immigration.affiliationChange.check` | immigration | checker | Yes | `#/tools/affiliation-change-checker-jp` | beta | 2026-09-11 | ja, vi, en |
| 23 | `status-change-guide-jp` | `immigration.statusChange.guide` | immigration | guide | Yes | `#/tools/status-change-guide-jp` | beta | 2026-09-11 | ja, vi, en |
| 24 | `family-immigration-guide-jp` | `immigration.familyImmigration.guide` | immigration | guide | Yes | `#/tools/family-immigration-guide-jp` | beta | 2026-09-11 | ja, vi, en |
| 25 | `pr-readiness-checker-jp` | `immigration.permanentResidence.check` | immigration | checker | Yes | `#/tools/pr-readiness-checker-jp` | beta | 2026-09-11 | ja, vi, en |
| 26 | `arriving-in-japan-wizard-jp` | `immigration.arrivingInJapan.guide` | immigration | wizard | Yes | `#/tools/arriving-in-japan-wizard-jp` | beta | 2026-09-11 | ja, vi, en |
| 27 | `leaving-japan-wizard-jp` | `immigration.leavingJapan.guide` | immigration | wizard | Yes | `#/tools/leaving-japan-wizard-jp` | beta | 2026-09-11 | ja, vi, en |
| 28 | `document-finder-jp` | `documents.finder` | procedures-documents | finder | Yes | `#/tools/document-finder-jp` | beta | 2026-09-11 | ja, vi, en |
| 29 | `certificate-acquisition-guide-jp` | `documents.certificate.guide` | procedures-documents | guide | Yes | `#/tools/certificate-acquisition-guide-jp` | beta | 2026-09-11 | ja, vi, en |
| 30 | `mynumber-procedure-guide-jp` | `documents.mynumber.guide` | procedures-documents | guide | Yes | `#/tools/mynumber-procedure-guide-jp` | beta | 2026-09-11 | ja, vi, en |
| 31 | `official-form-helper-jp` | `documents.form.helper` | procedures-documents | helper | Yes | `#/tools/official-form-helper-jp` | beta | 2026-09-11 | ja, vi, en |
| 32 | `procedure-requirement-checker-jp` | `documents.requirement.check` | procedures-documents | checker | Yes | `#/tools/procedure-requirement-checker-jp` | beta | 2026-09-11 | ja, vi, en |
| 33 | `administrative-navigator-jp` | `documents.admin.navigate` | procedures-documents | navigator | Yes | `#/tools/administrative-navigator-jp` | beta | 2026-09-11 | ja, vi, en |
| 34 | `japan-life-navigator` | `navigator.japanLife`<br/>`navigator.lifeEvents` | navigator | navigator | Yes | `#/tools/japan-life-navigator` | beta | 2026-09-11 | ja, vi, en |

---

## 2. Canonical Life Events (7 Cross-Domain Orchestrators)

| # | Canonical Life Event ID | Aliases | Definition File | Runtime Export |
|---|---|---|---|---|
| 1 | `life.jp.starting-life` | `arriving-in-japan`, `starting-life` | `startingLifeDefinition.js` | `startingLifeRuntime` |
| 2 | `life.jp.changing-job` | `changing-job` | `changingJobDefinition.js` | `changingJobRuntime` |
| 3 | `life.jp.leaving-job` | `leaving-job`, `unemployment` | `leavingJobDefinition.js` | `leavingJobRuntime` |
| 4 | `life.jp.pregnancy-birth` | `birth`, `childcare`, `life.jp.birth` | `birthDefinition.js` | `birthRuntime` |
| 5 | `life.jp.moving` | `moving`, `relocation`, `housing-moving` | `movingWizardDefinition.js` | `movingWizardRuntime` |
| 6 | `life.jp.family-joining` | `family-joining`, `family-immigration` | `familyJoiningDefinition.js` | `familyJoiningRuntime` |
| 7 | `life.jp.leaving-japan` | `leaving-japan`, `departure` | `departureDefinition.js` | `departureRuntime` |

---

## 3. Canonical Procedures (5 Certified Administrative Workflows)

| # | Procedure ID | Authority | Statutory Deadline | Submission Methods |
|---|---|---|---|---|
| 1 | `procedure.residence-status-renewal` | Regional Immigration Services Bureau | Expiration date printed on card | counter, online_portal |
| 2 | `procedure.permanent-residence-application` | Regional Immigration Services Bureau | Case-by-case (valid stay required) | counter |
| 3 | `procedure.child-allowance-claim` | Municipal City/Ward Office | Within 15 days from birth/move | counter, mail, online_myna |
| 4 | `procedure.moving-in-notification` | Municipal City/Ward Office | Within 14 days of moving in | counter |
| 5 | `procedure.employment-insurance-benefit-claim` | Public Employment Security Office (Hello Work) | Within 1 year of leaving job | counter |

---

## 4. Canonical Documents (17 Official Administrative Artifacts)

| # | Canonical Document ID | Japanese Canonical Name | Category | Primary Acquisition Channel |
|---|---|---|---|---|
| 1 | `document.resident-record-copy` | 住民票の写し | identity_residence | konbini_myna, municipal_counter, mail |
| 2 | `document.resident-record-items-cert` | 住民票記載事項証明書 | identity_residence | municipal_counter, mail |
| 3 | `document.seal-registration-certificate` | 印鑑登録証明書 | identity_residence | konbini_myna, municipal_counter |
| 4 | `document.taxation-certificate` | 課税証明書（非課税証明書） | tax_income | konbini_myna, municipal_counter, mail |
| 5 | `document.tax-income-certificate` | 所得証明書（課税・所得証明書） | tax_income | konbini_myna, municipal_counter, mail |
| 6 | `document.tax-payment-certificate` | 納税証明書（市町村税） | tax_income | municipal_counter, mail |
| 7 | `document.national-tax-payment-cert` | 納税証明書（国税 その1・その2） | tax_income | tax_office_counter, etax_online |
| 8 | `document.family-register-full` | 戸籍全部事項証明書（戸籍謄本） | family_register | honsekichi_counter, mail, konbini_wide |
| 9 | `document.family-register-individual` | 戸籍個人事項証明書（戸籍抄本） | family_register | honsekichi_counter, mail, konbini_wide |
| 10 | `document.family-register-tag` | 戸籍の附票の写し | family_register | honsekichi_counter, mail, konbini_wide |
| 11 | `document.withholding-tax-slip` | 給与所得の源泉徴収票 | tax_income | employer_issue |
| 12 | `document.employment-separation-certificate` | 雇用保険被保険者離職票（離職票-1, 2） | employment_labor | employer_hellowork |
| 13 | `document.certificate-of-employment` | 在職証明書（雇用証明書・就労証明書） | employment_labor | employer_issue |
| 14 | `document.passport` | 旅券（パスポート） | identity_residence | foreign_embassy |
| 15 | `document.residence-card` | 在留カード | identity_residence | isa_airport_counter |
| 16 | `document.mynumber-card` | マイナンバーカード（個人番号カード） | identity_residence | municipal_j-lis |
| 17 | `document.mynumber-electronic-certificate` | 電子証明書（署名用・利用者証明用） | identity_residence | municipal_counter |

---

## 5. Orphan Entities Audit Report

An automated bidirectional scan of all routes, capabilities, procedures, requirements, and sources was executed:

1. **Registered Tool without Route**: **0** (All 34 tools registered in `toolsRegistry.js` have dedicated route `#/tools/<id>`).
2. **Route without Registry**: **0** (Routing in Hub dynamically maps 100% of routes from registry entries).
3. **Capability without Target**: **0** (All 41 capabilities resolve to installed tools).
4. **Target Tool without Capability**: **0** (All 34 Japan Life tools map to at least one semantic capability).
5. **Life Event with Missing Target**: **0** (All checklist items across all 7 life events resolve to valid tools/documents).
6. **Procedure Referencing Missing Requirement**: **0** (All requirement IDs referenced in procedures exist in `requirementRegistry.js`).
7. **Requirement Referencing Missing Document**: **0** (All canonical document IDs referenced in requirements exist in `documentRegistry.js`).
8. **Missing Source References**: **0** (Resolved via `SOURCE_ALIASES` in `sourceRegistry.js` — all 27 views referencing sources resolve 100%).

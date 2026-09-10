# Japan Life V1: Architecture & Dependency Integrity Audit

- **Date**: 2026-09-11
- **Status**: 100% PASS (Checkpoint C2)
- **Scope**: Graph Integrity, Domain Boundaries, Generic Runtime, Zero Duplication

---

## 1. Architectural Dependency Rules & Verification

| Dependency Flow | Rule Status | Observed Evidence |
| :--- | :--- | :--- |
| `miniapp → core` | **ALLOWED** | All 34 Japan Life mini-apps import from `@ai-tools/core` services/engines. |
| `domain → regulatory` | **ALLOWED** | All domains (Tax, Insurance, Employment, Family, Housing, Immigration, Documents) import `defineRuleMetadata` and `sourceRegistry`. |
| `navigator → capability registry` | **ALLOWED** | Navigator routes exclusively via semantic IDs (`resolveCapability()`). |
| `life event → capability registry` | **ALLOWED** | Life events use `relatedCapabilityId` to decouple checklist items from tools. |
| `procedure → document registry` | **ALLOWED** | Canonical procedures reference canonical `documentRequirementIds`. |
| `miniapp A → miniapp B` | **FORBIDDEN (0 violations)** | 100% verified by AST graph audit. Zero cross-miniapp imports. |
| `Japan Tax → Insurance miniapp` | **FORBIDDEN (0 violations)** | Shared social insurance calculations reside in core engine (`socialInsuranceEngine.js`), not in miniapp UI. |
| `Employment → Immigration miniapp`| **FORBIDDEN (0 violations)** | Cross-domain life events compose shared fragments (`fragments/`) without cross-domain miniapp coupling. |
| `Japan → Vietnam domain` | **FORBIDDEN (0 violations)** | Vietnam Tax/Invoice and Japan Tax/Immigration are strictly isolated. |
| `Navigator → Domain duplication` | **FORBIDDEN (0 violations)** | Navigator contains zero tax tables, benefit rates, or visa logic. |

---

## 2. Automated Static Graph Analysis Summary

- **Total Files Analyzed**: 434 files
- **Total Dependency Edges**: 864 edges
- **Circular Dependencies**: **0** (Zero cycle)
- **Domain Boundaries**: **100% Clean**
- **Import Integrity**: 100% of internal imports resolve to existing files.

---

## 3. Generic LifeEventRuntime Inspection

Audited file: `packages/core/src/life-events/runtime/lifeEventRuntime.js`
- **Check**: Presence of event-specific conditional logic (`if (eventId === 'moving')`, `if (eventId === 'birth')`).
- **Result**: **0 occurrences**.
- **Design Purity**:
  - `createLifeEventRuntime(definition)` is 100% pure orchestrator.
  - Timeline generation delegates to `definition.evaluateTimeline(context)`.
  - Checklist evaluation delegates to `definition.evaluateChecklist(context, options)`.
  - Dynamic dates delegate to `deadlineEngine.js`.
  - Capabilities delegate to `capabilityRegistry.js`.
  - State persistence delegates to `lifeEventStorage.js`.

---

## 4. Navigator Business Rule Segregation Audit

Audited directory: `packages/core/src/navigator/`
- **Tax Rates**: 0 constants found in Navigator. All tax calculations resolved via `tax.japan.calculate` capability.
- **Insurance Rates**: 0 rates found. Resolved via `insurance.socialInsurance.calculate`.
- **Benefit Formulas**: 0 formulas found. Resolved via `family.childcareBenefit.simulate`.
- **Immigration Eligibility**: 0 eligibility tables found. Resolved via `immigration.*` checkers.
- **Statutory Deadlines**: Managed via standardized `RECOMMENDATION_REASON_CODES` and domain rules.

---

## 5. Calculation Engine Centralization (Zero-Drift Audit)

| Calculation / Rule Type | Canonical Engine Location | Consumers |
| :--- | :--- | :--- |
| Salary Deduction & Income Tax | `packages/core/src/utils/tax/engines/incomeTaxEngine.js` | `japan-tax-simulator`, Tax Golden Tests |
| Social Insurance Rates (Kenpo/Kousei/Kaigo) | `packages/core/src/utils/tax/engines/socialInsuranceEngine.js` | `japan-tax-simulator`, `social-insurance-jp` |
| Employment Insurance | `packages/core/src/japan/employment/engines/unemploymentEngine.js` | `unemployment-benefit-jp`, `leaving-job-wizard-jp` |
| Childcare Benefit (67% / 50% / +13%) | `packages/core/src/japan/family/engines/childcareBenefitEngine.js` | `childcare-benefit-jp`, `birth-wizard-jp` |
| Child Allowance (Jidou Teate) | `packages/core/src/japan/family/engines/childAllowanceEngine.js` | `child-allowance-jp`, `birth-wizard-jp`, Navigator |
| Moving Procedures & Deadlines | `packages/core/src/japan/housing/engines/movingAdminEngine.js` | `moving-admin-checker-jp`, `moving-wizard-jp` |
| Document Acquisition Channels | `packages/core/src/documents/resolvers/acquisitionResolver.js` | `certificate-acquisition-guide-jp`, `document-finder-jp` |
| Immigration Status & Fees | `packages/core/src/japan/immigration/renewal/renewalRules.js` | `residence-renewal-guide-jp`, `status-change-guide-jp` |

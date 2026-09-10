# PHASE 5: PRE-IMPLEMENTATION REVIEW
## Domain: Japan Life → Family & Child / 家族・子育て
## Orchestration: Pregnancy → Birth → Childcare Life Event / 妊娠・出産・育児

**Date:** 2026-09-10  
**Repository:** Toolio (`@ai-tools/hub` & `@ai-tools/core`)  
**Status:** READY  
**Author:** Antigravity Architect & Regulatory Agent  

---

## 1. Executive Summary

Phase 5 introduces the first comprehensive Life Event Orchestration workflow in Toolio: **Pregnancy → Birth → Childcare (妊娠・出産・育児)** alongside four specialized statutory calculation and eligibility mini-apps in the `Japan Life → Family & Child (家族・子育て)` sub-domain.

This review rigorously audits the existing foundation created in Phases 1–4, specifically evaluating:
1. The **Regulatory Foundation** (`OfficialSourceRegistry`, `Jurisdiction`, `EffectivePeriodResolver`, `StandardRemunerationGrades`).
2. The **Orchestration Architecture** established in Phase 4 by `leaving-job-wizard-jp` (退職手続きガイド).
3. The **Locality & Municipality Capability** required to cleanly separate national statutory frameworks from municipal variations (subsidies, health centers, birth gifts).

**Conclusion:** **READY**. The foundation is architecturally sound and cleanly decoupled. An enhancement to generic jurisdiction resolution (hierarchical codes + locality support status) will be seamlessly integrated without introducing any domain-specific architectural debt.

---

## 2. Review of Existing Foundation (Phases 1–4)

| Component / Standard | Existing Implementation Status | Phase 5 Readiness & Reuse Strategy |
| :--- | :--- | :--- |
| **MINIAPP_INTEGRATION_STANDARDS** | Strict compliance: zero external CSS/UI libs, StandardToolLayout 1240px, CSS variables, dark/light contrast $\ge 4.5:1$, mobile viewport safety. | All 5 Phase 5 mini-apps will adhere strictly to MAIS, registering in `tools.js`, `toolIcons.js`, `App.jsx`, and `i18n.js`. |
| **MINIAPP_DEV_GUIDE** | Architectural decoupling: UI in `@ai-tools/hub`, core logic/engines/rules in `@ai-tools/core`. | All family rules, engines, and tests reside in `packages/core/src/japan/family/`. Hub mini-apps remain purely presentational wrappers. |
| **OfficialSourceRegistry** | Centralized legal citations (e-Gov, MHLW, NTA, JPS, Hello Work). | Add official primary sources: こども家庭庁 (Children & Families Agency), 全国健康保険協会 (Kyokai Kenpo Maternity Guidelines), MHLW Childcare Leave/Benefit division, e-Gov Child Welfare Act & Health Insurance Act. |
| **EffectivePeriodResolver** | Temporal validation: `isDateInPeriod()`, `filterRulesByDate()`, `getActiveRule()`. | Critical for Childcare benefits (April 1, 2025 reforms for short-time work and post-birth support) and Child Allowance (October 1, 2024 income ceiling removal). |
| **Standard Remuneration (`標準報酬月額`)** | Implemented in Phase 3 (`packages/core/src/japan/insurance/rules/standardRemunerationGrades.js`). | **Zero Duplication**: Phase 5 Maternity Allowance will directly import and reuse `HEALTH_INSURANCE_REWARD_GRADES` from insurance domain rules via `@ai-tools/core` export. |
| **Orchestrator Pattern** | Implemented in Phase 4 (`leaving-job-wizard-jp`). | Provides proven roadmap: Timeline $\rightarrow$ Deadlines $\rightarrow$ Interactive Checklist with `localStorage` $\rightarrow$ Capability Navigation $\rightarrow$ Regulatory Citations. |

---

## 3. Detailed Orchestration Analysis (Phase 4 vs Phase 5)

We evaluated the 8 critical orchestration questions based on the implementation of `leaving-job-wizard-jp`:

### Q1: Wizard có tách orchestration khỏi calculation engines không?
- **Observed:** **YES**. `leavingJobEngine.js` only calculates statutory deadlines (e.g. Civil Code Art. 627 notice date), health insurance recommendations, resident tax collection schemes, and checklist tasks. It does **NOT** duplicate employment insurance benefit calculation or tax simulation; it links out to respective tools.
- **Phase 5 Strategy:** `birthWizardEngine.js` will strictly coordinate lifecycle stages, document requirements, deadlines, and checklists. All complex calculations will be delegated to `maternityAllowanceEngine.js`, `childcareBenefitEngine.js`, and `childAllowanceEngine.js`.

### Q2: Deep links có metadata/capability-driven không?
- **Observed:** In Phase 4, deep links included rich metadata (`titleJa/Vi/En`, `badgeJa/Vi/En`, `toolId`), but `toolId` was referenced directly.
- **Phase 5 Improvement:** Introduce a formal `CapabilityRegistry` abstraction in core/orchestration:
  ```javascript
  // Abstract capability resolution
  const capabilityMap = {
    'family.maternityAllowance.simulate': 'maternity-allowance-jp',
    'family.childcareLeave.check': 'childcare-leave-eligibility-jp',
    'family.childcareBenefit.simulate': 'childcare-benefit-jp',
    'family.childAllowance.check': 'child-allowance-jp',
    'insurance.dependent.check': 'dependent-insurance-jp',
    'tax.incomeTax.simulate': 'japan-tax-simulator',
  };
  ```
  If a capability maps to an installed tool, the orchestrator generates an internal route (`#/tools/{toolId}`); if not yet installed, it renders a graceful fallback or official portal external link.

### Q3: Wizard có import mini-app khác trực tiếp không?
- **Observed:** **NO**. `LeavingJobWizardView.jsx` contains **zero** imports of other mini-app components or foreign domain engines. It only uses native anchor links `#/tools/{toolId}`.
- **Phase 5 Rule:** Strictly maintained. No cross-app component imports. Validated via `npm run graph:audit`.

### Q4: Context có thể truyền an toàn qua URL/local state không?
- **Observed:** Phase 4 used standalone URL routes.
- **Phase 5 Improvement:** Support safe, browser-first context transfer:
  1. Transfer via URL search params (e.g. `#/tools/maternity-allowance-jp?dueDate=2026-11-15&salary=300000`) or transient `sessionStorage` key (`toolio_family_context_transfer`).
  2. The target mini-app inspects the parameters, validates them strictly with schemas, and pre-fills input fields.
  3. **Zero server-side transmission**: All state stays 100% inside client browser memory.

### Q5: Missing tool có graceful fallback không?
- **Observed:** In Phase 4, missing tools would route to Hub tool-not-found screen.
- **Phase 5 Improvement:** The capability resolver checks whether the target capability is active in the local build. If a feature is pending or external (e.g., local municipality portal), the card renders an informative badge (`Official Portal / 外部公式窓口`) with an external link icon, preventing dead ends.

### Q6: Có pattern reusable cho Birth Life Event không?
- **Observed:** **YES**. The 5-section layout from Leaving Job Wizard:
  1. Parameters & Conditions (`StandardToolLayout`)
  2. Statutory Deadlines & Critical Alerts (`ShieldCheck`)
  3. Interactive ToDo Checklist with Progress & `localStorage` persistence (`CheckSquare`)
  4. Timeline Visualizer (`Calendar`)
  5. Actionable Capabilities & Dedicated Tools Matrix (`Compass`)
  6. Primary Legal Sources (`RegulatorySourceView`)
  This pattern translates directly into the 6-stage Pregnancy $\rightarrow$ Birth $\rightarrow$ Childcare life-event workflow.

### Q7: User context có bị duplicated giữa Tax/Insurance/Employment không?
- **Observed:** Currently, each tool requires the user to re-enter basic attributes (monthly salary, dates). This preserves complete privacy and tool independence, but introduces minor friction.
- **Phase 5 Balance:** Implement a lightweight, optional `FamilyContext` model:
  - Mini-apps **MUST** remain 100% functional when opened directly without context (zero required dependencies).
  - When invoked from the Birth Wizard, available fields (e.g. expected birth date, employment status, municipality) are passed as optional initial pre-fills.

### Q8: Regulatory sources có support national + municipality rules không?
- **Observed:** Current `sourceRegistry.js` focuses on national agencies. `jurisdiction.js` supports basic `{ country, prefecture, municipality }` properties, but lacks hierarchical resolution and locality support flags.
- **Phase 5 Action:** Upgrade `jurisdiction.js` generically as detailed below.

---

## 4. Municipality & Locality Strategy Review

### The Problem
Unlike employment insurance or national income tax (which are strictly uniform nationwide), Family & Childcare in Japan involves heavy local-government variation:
- Maternity checkup subsidy vouchers (妊婦健康診査受診票) vary in value by municipality.
- Maternal & Child Health Handbook (母子健康手帳) is issued at municipal health centers (保健センター・区役所).
- Child medical expense subsidies (子ども医療費助成) are funded and parameterized entirely by prefectures/municipalities (e.g. free until age 15 or 18, with or without parental income caps).
- Childbirth celebration grants (出産祝い金) are municipal discretionary benefits.

### Architectural Solution: Generic Locality Support
We must **NOT** create a bespoke `JapanBirthMunicipalityResolver`. Instead, we enhance the existing generic `jurisdiction.js` to create a reusable `JurisdictionResolver`:

1. **Standardized Hierarchical Codes**:
   - `JP`: National level.
   - `JP-40`: Fukuoka Prefecture (ISO 3166-2:JP).
   - `JP-40-40130`: Fukuoka City (JIS X 0402 5-digit municipal code).
   - Compatible with future Vietnam hierarchy: `VN` $\rightarrow$ `VN-SG` (Ho Chi Minh City) $\rightarrow$ `VN-SG-Q1` (District 1).

2. **Locality Capability Support Status**:
   - `SUPPORTED`: Municipal rules, contact windows, and verified local subsidies are fully modeled (e.g. `JP-40-40130` Fukuoka City).
   - `PARTIALLY_SUPPORTED`: National framework modeled, local portal link verified, but local subsidy amounts require local confirmation.
   - `UNSUPPORTED`: General national rules apply; UI explicitly informs user: *"Local municipal benefits are not yet verified for this municipality. Please consult your local municipal office or portal."* with safe official portal guidance.

3. **Fallback Chain**:
   $$\text{Municipality } (JP\text{-}40\text{-}40130) \longrightarrow \text{Prefecture } (JP\text{-}40) \longrightarrow \text{National } (JP)$$

---

## 5. Architectural Non-Negotiables for Phase 5

1. **Strict Separation of Maternity Allowance vs Childbirth Lump-Sum Grant**:
   - `出産手当金` (Maternity Allowance): Health Insurance Act Art. 102. Daily income-replacement benefit during maternity leave ($2/3$ standard remuneration).
   - `出産育児一時金` (Lump-Sum Childbirth Grant): Health Insurance Act Art. 101. Lump-sum grant (500,000 JPY) subsidizing childbirth delivery costs.
   - **UI and engine must never conflate these two schemes.**

2. **Accurate Childcare Leave 4-Scheme Architecture**:
   - Model the distinct legal foundations:
     - 育児休業給付金 (Childcare Leave Benefit)
     - 出生時育児休業給付金 (Post-birth Childcare Leave / 産後パパ育休 Benefit)
     - 出生後休業支援給付金 (Post-birth Leave Support Benefit - 13% bonus)
     - 育児時短就業給付金 (Childcare Short-Time Work Benefit - 2025-04 reform)
   - Distinguish statutory leave rights (Labor Standards Act / Childcare Leave Act) from insurance benefits (Employment Insurance Act).

3. **Reiwa 6 (Oct 2024) Child Allowance Reform**:
   - Elimination of income limits.
   - Coverage extended through high school age (until March 31 after turning 18).
   - ¥30,000 for 3rd child onwards, with official sibling counting including older dependents up to age 22.

---

## 6. Pre-Implementation Review Conclusion

```
============================================================
PRE-IMPLEMENTATION REVIEW RESULT: READY
============================================================
[X] Existing Foundation Audited
[X] 8 Orchestration Questions Answered
[X] Generic Locality Strategy Defined
[X] Zero Architecture Debt Identified
[X] Reusable Primitives Identified (Standard Remuneration, Layouts)
============================================================
```

We now proceed to Part B: Generating `docs/phase5/PHASE_05_IMPLEMENTATION_PLAN.md` and `docs/phase5/JAPAN_FAMILY_LOCALITY_STRATEGY.md`.

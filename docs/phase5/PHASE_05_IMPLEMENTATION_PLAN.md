# PHASE 5 IMPLEMENTATION PLAN: JAPAN FAMILY & CHILD
## Domain: Japan Life → Family & Child (`家族・子育て`)
## Life Event: Pregnancy → Birth → Childcare (`妊娠・出産・育児`)

**Target Version:** Toolio v1.5.0  
**Status:** READY FOR GATE REVIEW  
**Date:** 2026-09-10  
**Prerequisites:** Phase 1 (PASS), Phase 2 (PASS), Phase 3 (PASS), Phase 4 (PASS)  

---

## 1. Scope & Objectives

Phase 5 builds the **Family & Child** domain group and Toolio's first end-to-end **Life Event Orchestrator**, delivering 5 coordinated mini-apps and 1 shared capability:

```
Japan Life
└── Family & Child (家族・子育て)
    │
    ├── M1. 出産手当金シミュレーター (maternity-allowance-jp)
    │       Maternity Allowance Simulator (Health Insurance Act Art. 102)
    │
    ├── M2. 育児休業・給付チェッカー (childcare-leave-eligibility-jp)
    │       Childcare Leave & Benefit Checker (4 Statutory Schemes)
    │
    ├── M3. 育児休業給付シミュレーター (childcare-benefit-jp)
    │       Childcare Leave Benefit Simulator (Timeline & Formulae)
    │
    ├── M4. 児童手当チェッカー (child-allowance-jp)
    │       Child Allowance Checker (Reiwa 6 / Oct 2024 Reformed Framework)
    │
    └── M5. 妊娠・出産・育児ガイド (birth-wizard-jp)
            Life Event Orchestrator (6-Stage Timeline & Actionable Checklist)

    [Shared Capability]: 出産育児一時金 (Childbirth Lump-Sum Grant: 500,000 JPY)
            Integrated into core family engines & Birth Wizard (Health Insurance Act Art. 101)
```

---

## 2. Out of Scope

To prevent scope creep and maintain strict regulatory accuracy, the following areas are strictly **excluded** from Phase 5:
- Full nursery/daycare facility search and points calculator (保活コンシェルジュ / 保育所選考点数).
- Exhaustive database of all 1,700+ municipal benefit ordinances (handled via Locality Status).
- School admission and education funding calculators.
- Single-parent (ひとり親) comprehensive welfare suite (児童扶養手当 etc. — slated for dedicated phase).
- Fertility treatment (不妊治療) insurance and subsidies.
- Medical diagnosis, pregnancy symptom assessment, or child health advice.
- Foreign national dependent visa (家族滞在) application paperwork.
- Marriage, divorce, inheritance civil procedures.
- Vietnam Life family domain (slated for post-Japan phases).
- Universal Life Navigator cross-country abstraction.

---

## 3. Architecture & Dependency Principles

### 3.1 Domain Decoupling
```
packages/core/src/japan/family/
├── maternityAllowance/      # Rules & Engine for Maternity Allowance
├── childcareLeave/          # Rules & Eligibility Engine for 4 leave schemes
├── childcareBenefits/       # Rules & Benefit Calculation Engine (rates, wage daily base, caps)
├── childAllowance/          # Rules & Engine for Child Allowance (Oct 2024 rules)
├── birth/                   # Orchestrator Engine, Timelines, Action Checklist, Lump-Sum Grant
├── locality/                # Municipal Registry, Locality Status Resolver, Subsidies
├── rules/                   # Shared family regulatory definitions
├── engines/                 # Re-exported domain engines
└── index.js                 # Public API for @ai-tools/core
```

### 3.2 Strict Dependency Matrix
- **Allowed:**
  - `Japan Family` $\longrightarrow$ `Regulatory Core` (`sourceRegistry.js`, `jurisdiction.js`, `effectivePeriod.js`).
  - `Japan Family` $\longrightarrow$ `Insurance Primitive` (`standardRemunerationGrades.js` — for exact standard monthly remuneration lookup without duplicating grade tables).
  - `Birth Wizard (Hub)` $\longrightarrow$ `CapabilityRegistry` $\longrightarrow$ Native hash routes (`#/tools/{toolId}`) or external portals.
- **Strictly Prohibited:**
  - `family` engine $\longrightarrow$ `tax` engine / mini-app.
  - `family` engine $\longrightarrow$ `employment` mini-app.
  - Direct component-level imports between mini-apps (`graph:audit` verified).
  - Global mutable state dependencies (every mini-app must boot and calculate 100% independently).

### 3.3 Abstract Capability Registry & Safe Context Transfer
```javascript
// packages/core/src/orchestration/capabilityRegistry.js
export const CAPABILITY_REGISTRY = Object.freeze({
  'family.maternityAllowance.simulate': {
    toolId: 'maternity-allowance-jp',
    titleJa: '出産手当金シミュレーター',
    titleVi: 'Mô phỏng Trợ cấp Thai sản (BHYT)',
    titleEn: 'Maternity Allowance Simulator',
    badgeJa: '健康保険',
    badgeVi: 'BHYT',
    badgeEn: 'Health Insurance'
  },
  'family.childcareLeave.check': {
    toolId: 'childcare-leave-eligibility-jp',
    titleJa: '育児休業・給付チェッカー',
    titleVi: 'Kiểm tra Điều kiện Nghỉ & Trợ cấp Chăm con',
    titleEn: 'Childcare Leave & Benefit Checker',
    badgeJa: '雇用保険',
    badgeVi: 'BHTN',
    badgeEn: 'Employment'
  },
  'family.childcareBenefit.simulate': {
    toolId: 'childcare-benefit-jp',
    titleJa: '育児休業給付シミュレーター',
    titleVi: 'Mô phỏng Số tiền Trợ cấp Nghỉ chăm con',
    titleEn: 'Childcare Leave Benefit Simulator',
    badgeJa: '雇用保険',
    badgeVi: 'BHTN',
    badgeEn: 'Benefit'
  },
  'family.childAllowance.check': {
    toolId: 'child-allowance-jp',
    titleJa: '児童手当チェッカー',
    titleVi: 'Kiểm tra & Tính Trợ cấp Trẻ em (Jidou Teate)',
    titleEn: 'Child Allowance Checker',
    badgeJa: 'こども家庭庁',
    badgeVi: 'Trợ cấp',
    badgeEn: 'Allowance'
  },
  'insurance.dependent.check': {
    toolId: 'dependent-insurance-jp',
    titleJa: '被扶養者判定チェッカー',
    titleVi: 'Kiểm tra Điều kiện BHYT Phụ thuộc',
    titleEn: 'Dependent Insurance',
    badgeJa: '社会保険',
    badgeVi: 'Bảo hiểm',
    badgeEn: 'Social Ins'
  }
});
```

Context passing uses URL query parameters with strict validation schemas. Example:
`#/tools/maternity-allowance-jp?expectedBirthDate=2026-11-20&standardSalary=300000`

---

## 4. Detailed Milestone Specifications

### Milestone 1: 出産手当金シミュレーター (Maternity Allowance)
- **Legal Grounding:** Health Insurance Act (健康保険法) Art. 102; Kyokai Kenpo guidelines.
- **Coverage Period:**
  - Single pregnancy: 42 days before expected birth date (98 days for multiple pregnancy) + actual delivery day + 56 days post-delivery.
  - Birth delay: If actual birth occurs after expected birth date, all delay days are covered.
  - Premature birth: If actual birth occurs before expected birth date, period begins on actual delivery date minus days taken pre-birth.
- **Benefit Calculation Formula:**
  $$\text{Daily Benefit} = \left(\frac{\text{Average Standard Monthly Remuneration of Prior 12 Months}}{30}\right) \times \frac{2}{3}$$
  - Standard remuneration lookup: Reuses `HEALTH_INSURANCE_REWARD_GRADES` from insurance domain.
  - Less than 12 months rule (協会けんぽ): Lesser of:
    1. Average standard monthly remuneration for continuous enrolled months in current insurer.
    2. Insurer average standard monthly remuneration (currently 300,000 JPY for Kyokai Kenpo).
  - Salary offset: If partial wages are paid during maternity leave, benefit pays difference $(\max(0, \text{Daily Benefit} - \text{Daily Wage Paid}))$.
  - Continued benefit after qualification loss (資格喪失後の継続給付 - Art. 104): Insured for $\ge 1$ year continuously before leaving, and met benefit conditions on the day before separation.
- **Outputs:** Eligible days, daily benefit amount, total benefit amount, wage offset breakdown, calculation basis explanation, official sources.

---

### Milestone 2: 育児休業・給付チェッカー (Childcare Leave & Benefit Checker)
- **Legal Grounding:** Childcare and Caregiver Leave Act (育児・介護休業法); Employment Insurance Act (雇用保険法) Arts. 61-7 to 61-10; MHLW Guidelines.
- **Architecture Distinction:** Strictly separates **statutory right to take leave** from **employment insurance monetary benefit eligibility**.
- **4 Statutory Schemes Evaluated:**
  1. **育児休業給付金 (Standard Childcare Leave Benefit)**:
     - Generally up to child turning 1 year (extendable to 1.5 or 2 years in specific statutory cases like daycare rejection).
     - Insured requirement: Enrolled in Employment Insurance for $\ge 12$ months with $\ge 11$ days worked per month in the 2 years prior to leave.
  2. **出生時育児休業給付金 (Post-birth Childcare Leave / 産後パパ育休 Benefit)**:
     - Up to 28 days (4 weeks) within 8 weeks of child's birth. Can be split into 2 periods.
  3. **出生後休業支援給付金 (Post-birth Leave Support Benefit)**:
     - Requires insured to take $\ge 14$ days leave in qualifying period and spouse also takes $\ge 14$ days leave, OR spouse meets statutory exceptions (single parent, spouse not working, etc.).
  4. **育児時短就業給付金 (Childcare Short-Time Work Benefit - Effective 2025-04)**:
     - For employees with children under 2 returning to work on shortened hours.
- **Progressive Flow:** Dynamic branching questions (never dumping 25 questions at once).
- **Outputs:** Per-benefit status: `likely_eligible`, `likely_not_eligible`, `needs_confirmation`, `not_applicable`. Clear disclaimer: *Assessment aid based on user input, not official administrative approval.*

---

### Milestone 3: 育児休業給付シミュレーター (Childcare Benefit Simulator)
- **Legal Grounding:** Employment Insurance Act; MHLW Wage Daily Basis Caps & Benefit Tables (including 2025-04 and 2026-08 boundaries).
- **Calculation Formulae:**
  - **Wage Daily Basis (休業開始時賃金日額)**:
    $$\text{Wage Daily Basis} = \frac{\text{Total Wages of Prior 6 Months}}{180}$$
    Subject to MHLW minimum (~¥2,849) and maximum (~¥16,210 as adjusted annually).
  - **Standard Childcare Leave Benefit**:
    - First 180 days (combined with birth-time leave): $\text{Daily Basis} \times \text{Days} \times 67\%$
    - Day 181 onward: $\text{Daily Basis} \times \text{Days} \times 50\%$
  - **Post-birth Papa Ikukyu**:
    - $\text{Daily Basis} \times \text{Days (max 28)} \times 67\%$
  - **Post-birth Leave Support Benefit (出生後休業支援給付金)**:
    - $\text{Daily Basis} \times \text{Days (max 28)} \times 13\%$
    - Combined total replacement during this period: $67\% + 13\% = 80\%$ of wage daily basis (communicated officially as ~100% take-home pay equivalent, but calculated on strict 80% wage base).
  - **Childcare Short-Time Work Benefit (育児時短就業給付金 - from 2025-04)**:
    - $10\%$ of wage subject to statutory caps and wage-drop thresholds.
- **Outputs:** Visualized timeline, monthly benefit breakdown, aggregate support sum, wage deduction/offset handling, official sources.

---

### Milestone 4: 児童手当チェッカー (Child Allowance Checker)
- **Legal Grounding:** Child Allowance Act (児童手当法); Children & Families Agency (こども家庭庁) revised framework effective October 1, 2024 (Reiwa 6).
- **Key Reformed Rules (Oct 2024)**:
  - **Zero Income Limits (所得制限の撤廃)**: Full benefits paid regardless of parental income.
  - **Age Extension**: Covered through the first March 31st after turning 18 (高校生年代まで).
  - **Benefit Schedule**:
    - Age $0$ to under $3$: **¥15,000 / month**
    - Age $3$ to high-school age ($18$): **¥10,000 / month** (1st and 2nd child)
    - 3rd child onwards: **¥30,000 / month** (from birth through high-school age)
  - **3rd Child Counting Rule (多子カウントルール)**:
    - Older dependent/supported children up to the first March 31st after turning **22** (e.g. college students dependent on parent) are counted in determining child order!
    - Example: Eldest child is 20 (college dependent), second child is 16, third child is 10.
      - Eldest (20): Counted as 1st child (benefit: ¥0).
      - Second (16): Counted as 2nd child (benefit: ¥10,000).
      - Third (10): Counted as 3rd child (benefit: **¥30,000**)!
- **Municipal Differentiation:** Clean separation of national Child Allowance from local medical subsidies and municipal gift funds.

---

### Milestone 5: 妊娠・出産・育児ガイド (Life Event Orchestrator)
- **Role:** Comprehensive life-event roadmapper and procedural coordinator.
- **6-Stage Lifecycle Timeline:**
  1. **妊娠判明 (Pregnancy Discovery)**: Pregnancy test verification, medical consultation, employer notification guidance.
  2. **妊娠届・母子健康手帳 (Notification & Handbook)**: Municipal health center window, prenatal checkup vouchers (妊婦健診受診票), ¥50,000 pregnancy support grant.
  3. **産前休業 (Prenatal Preparation)**: Maternity leave planning (産前休業), deep link to Maternity Allowance Simulator, social insurance premium exemption (産前産後休業保険料免除).
  4. **出産直後 (Birth & Immediate Procedures)**:
     - Birth registration (出生届 — within 14 days to municipality).
     - Health Insurance enrollment (健康保険加入).
     - Childbirth Lump-Sum Grant (出産育児一時金 — 500,000 JPY direct payment or reimbursement).
     - Child Allowance application (児童手当 — within 15 days of birth).
     - Local child medical card (子ども医療費受給者証).
  5. **育児休業 (Childcare Leave)**:
     - Post-birth Papa Ikukyu (産後パパ育休) & Childcare leave applications.
     - Social insurance premium exemption during childcare leave.
     - Deep links to Childcare Eligibility Checker and Childcare Benefit Simulator.
  6. **復職・保活 (Return to Work)**:
     - Short-time work (育児時短勤務) request.
     - Childcare short-time work benefit (育児時短就業給付金).
     - Standard remuneration revised grade application upon return (育児休業等終了時報酬月額変更届).
- **Interactive Features:**
  - Interactive ToDo checklist with `localStorage` persistence (`toolio_birth_wizard_checklist`).
  - Filter by stage, priority, and jurisdiction (`[国]` vs `[自治体]`).
  - Municipality selection with dynamic Locality Support Card.

---

## 5. Golden Test Matrix

```
Total Golden Tests: 45+ Deterministic Test Cases across 5 Milestones

M1 (Maternity Allowance - 9 cases):
- Birth on exact due date (42 + 56 = 98 days)
- Premature birth (e.g. 10 days early)
- Delayed birth (e.g. 5 days overdue -> 42 + 5 + 56 = 103 days)
- Multiple pregnancy (98 days pre-birth)
- 12+ months standard remuneration history
- <12 months history with Kyokai Kenpo ceiling rule (300,000 JPY cap)
- Zero salary paid during leave (full benefit)
- Partial salary paid lower than benefit (difference paid)
- Full salary paid higher than benefit (benefit = 0 JPY)
- Continued benefit after qualification loss (Art. 104)

M2 (Childcare Leave & Benefit Eligibility - 10 cases):
- Insured mother standard qualification (Leave: YES, Benefit: YES)
- Insured father Post-birth Papa Ikukyu (Leave: YES, Benefit: YES)
- Uninsured / Freelancer parent (Leave: NO/NA, Benefit: NO)
- Fixed-term contract worker meeting renewal expectation (Leave: YES)
- Short employment insurance tenure (<12 months in 2 years) (Leave: YES, Benefit: NO)
- Post-birth support bonus: Both parents taking 14+ days leave (Bonus: YES)
- Post-birth support bonus: Only one parent taking leave, no exception (Bonus: NO)
- Post-birth support bonus: Spouse exception (single parent / non-working) (Bonus: YES)
- Childcare short-time work eligibility (under age 2, returning to work)
- Leave extension past age 1 (daycare waitlist proof)

M3 (Childcare Benefit Calculation - 10 cases):
- Standard 6-month wage calculation (Wage Daily Basis)
- Wage Daily Basis cap boundary (upper limit)
- Wage Daily Basis floor boundary (minimum limit)
- 67% rate for first 180 days
- 50% rate after 180 days
- Post-birth Papa Ikukyu 28 days at 67%
- Post-birth support bonus +13% combined with 67% (80% wage daily basis)
- Short-time work benefit at 10% wage drop
- Partial wage paid during leave with offset ceiling
- Temporal effective period boundary (pre vs post April 1, 2025)

M4 (Child Allowance - 8 cases):
- 1 child under 3 (¥15,000)
- 1 child age 5 (¥10,000)
- 2 children (ages 2 and 4 -> ¥15,000 + ¥10,000 = ¥25,000)
- 3 children under high school age (¥15,000 + ¥10,000 + ¥30,000 = ¥55,000)
- 3rd child counting with older sibling age 20 (dependent college student)
- High school age boundary (turning 18 before vs after March 31)
- Age-out boundary (turning 22 before vs after March 31 for sibling counting)
- High earner family (verifying zero income deduction under 2024 reform)

M5 (Birth Wizard Orchestrator - 8 cases):
- Pregnant employee lifecycle plan
- Self-employed pregnant woman lifecycle plan (NHI, no maternity allowance)
- Employee father planning Papa Ikukyu
- Both parents employees planning staggered leaves
- Newborn born case (stage jumping to 出産直後)
- Multiple pregnancy workflow (extended pre-birth leave)
- Supported municipality (Fukuoka City: verified vouchers & subsidies rendered)
- Unsupported municipality (graceful fallback disclaimer rendered)
```

---

## 6. Checkpoint & Rollback Strategy

| Checkpoint | Tag Name | Criteria to Pass |
| :--- | :--- | :--- |
| **C0** | `pre-phase5` | Baseline clean repo before any Phase 5 modifications. *(DONE)* |
| **C1** | `phase5-review-and-plan-pass` | Pre-review and detailed implementation plan reviewed and approved. |
| **C2** | `phase5-maternity-allowance-pass` | M1 implemented, Golden tests 1–9 PASS, build PASS, audit PASS, browser verified. |
| **C3** | `phase5-childcare-eligibility-pass`| M2 implemented, Golden tests PASS, build PASS, audit PASS, browser verified. |
| **C4** | `phase5-childcare-benefit-pass` | M3 implemented, Golden tests PASS, build PASS, audit PASS, browser verified. |
| **C5** | `phase5-child-allowance-pass` | M4 implemented, Golden tests PASS, build PASS, audit PASS, browser verified. |
| **C6** | `phase5-birth-wizard-pass` | M5 Orchestrator implemented, E2E workflow PASS, build PASS, browser verified. |
| **C7** | `phase5-final-pass` | Full integration, rule audit, final report, regression smoke test 100% PASS. |

---

## 7. Plan Self-Review & Verification

- **Completeness:** Covers all 5 mini-apps, shared lump-sum grant, generic locality strategy, and orchestration.
- **Regulatory Integrity:** Strictly cites e-Gov, MHLW, Children & Families Agency, and Kyokai Kenpo.
- **Architectural Soundness:** Zero cross-app coupling, generic jurisdiction resolver, and reuse of standard remuneration grades.
- **Status:** **PLAN: READY**. Awaiting Plan Gate approval.

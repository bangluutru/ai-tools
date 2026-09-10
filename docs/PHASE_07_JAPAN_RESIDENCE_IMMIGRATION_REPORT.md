# PHASE 7 EXECUTIVE REPORT: JAPAN RESIDENCE & IMMIGRATION DOMAIN & LIFE EVENTS

**Toolio Quality Engineering & Regulatory Architecture**  
**Execution Period**: September 2026  
**Status**: 100% PASS (All Gates 1–4 Validated)  
**Git Checkpoints**: `pre-phase7` (C0) $\to$ `phase7-final-pass` (C10)  

---

## 1. Executive Summary

Phase 7 successfully designed, engineered, and shipped the entire **Japan Life → Residence & Immigration / 在留・入管** domain in Toolio Hub. This phase delivered 6 high-precision standalone immigration miniapps and 2 comprehensive Life Events built on the presentation-independent `LifeEventRuntime`.

All components strictly comply with Japanese immigration statutory laws, Immigration Services Agency of Japan (出入国在留管理庁 - ISA) administrative guidelines, and the constitutional McLean Supreme Court doctrine.

### Key Achievements:
1. **6 High-Precision Immigration Miniapps Delivered**:
   - `work-scope-checker-jp` (在留資格・就労範囲チェッカー)
   - `residence-renewal-guide-jp` (在留期間更新ガイド)
   - `affiliation-change-checker-jp` (転職・所属機関変更チェッカー)
   - `status-change-guide-jp` (在留資格変更ガイド)
   - `family-immigration-guide-jp` (家族滞在・家族呼寄せガイド)
   - `pr-readiness-checker-jp` (永住申請準備度チェッカー)
2. **2 Full Life Events Built on `LifeEventRuntime`**:
   - `arriving-in-japan-wizard-jp` (来日後セットアップガイド - 4th Life Event)
   - `leaving-japan-wizard-jp` (日本を離れる手続きガイド - 5th Life Event)
3. **Strict Regulatory Compliance & Zero Pseudo-Legal Certainty**:
   - Enforced the McLean Supreme Court doctrine (最大判昭53.10.4): immigration permissions (renewal, status change, PR) are broad administrative discretionary acts of the Minister of Justice (法務大臣の広範な裁量). All calculators evaluate factual readiness, timelines, and statutory prerequisites without issuing illegal guarantees or pseudo-scientific "approval percentages".
   - Anchored revenue stamp fees with temporal awareness (reflecting the scheduled October 1, 2026 fee revision: 4,000 $\to$ 6,000 JPY for renewal/change, 8,000 $\to$ 10,000 JPY for PR).
   - Zero cross-domain direct imports: inter-domain workflows connect semantically via `capabilityRegistry`.
4. **Toolio Hub Scale**:
   - Total active miniapps expanded to **45** (with **37 verified production-grade apps**).
   - Test suite expanded to **540 unit tests** (465 core + 75 hub), running in $< 2$ seconds.
   - 100% browser verification pass across Desktop, Tablet, and Mobile viewports.

---

## 2. Architecture & Domain Specifications

### 2.1 File Tree Structure (`packages/core/src/japan/immigration/`)
```
packages/core/src/japan/immigration/
├── context/
│   └── residenceContext.js             # Canonical context schema & validators
├── status/
│   ├── statusDefinitions.js           # 29 Japanese residence statuses metadata
│   └── statusCatalog.js               # Status catalog with activity scopes & legal bases
├── workScope/
│   ├── workScopeRules.js              # Table 1 vs Table 2, part-time 28h rules (Art. 19)
│   └── workScopeEngine.js             # Permitted/prohibited work evaluation engine
├── renewal/
│   ├── renewalRules.js                # 3-month window, Tokurei 2-month extension (Art. 20)
│   └── renewalEngine.js               # Timeline calculator, required document checklist
├── affiliation/
│   ├── affiliationRules.js            # 14-day notification (Art. 19-16), Certificate of Eligibility
│   └── affiliationEngine.js           # Notification classification & guidance engine
├── statusChange/
│   ├── statusChangeRules.js           # Student->Work, Work->Work, HSP Point System (70/80 pts)
│   └── statusChangeEngine.js          # Eligibility transition matrix & document checklist
├── family/
│   ├── familyRules.js                 # Dependent (家族滞在), COE vs Change, 28h part-time limit
│   └── familyEngine.js                # Sponsor capacity checker, relationship validator
├── permanentResidence/
│   ├── prRules.js                     # 10yr general, 5yr spouse, 1/3yr HSP, Nenkin/Tax compliance
│   └── prEngine.js                    # PR readiness scoring & regulatory gap analysis
├── arrival/
│   ├── arrivalRules.js                # 4 onboarding stages, 14-day municipal deadline (Art. 19-7)
│   ├── arrivalEngine.js               # Dynamic date math & staged onboarding checklist
│   └── arrivalDefinition.js           # 4th Life Event definition & arrivalRuntime
├── departure/
│   ├── departureRules.js              # 3 stages, Minashi Re-entry (Art. 26-2) vs Formal (Art. 26)
│   ├── departureEngine.js             # Temporary vs Permanent departure engine, Nenkin 60mo cap
│   └── departureDefinition.js         # 5th Life Event definition & departureRuntime
└── index.js                           # Unified domain re-export point
```

### 2.2 Core Architectural Principles
- **Zero Cross-Domain Direct Imports**: Immigration tools never directly import modules from `tax`, `insurance`, `employment`, `family`, or `housing`. Instead, deep links and capability integrations resolve via the Life Event Foundation (`capabilityRegistry`).
- **Standardized Regulatory Metadata**: Every single rule and task attaches a strictly-verified `RuleMetadata` object via `defineRuleMetadata` linking to official sources registered in `sourceRegistry.js` (`JAPAN_JURISDICTION`).
- **MAIS Compliance**: All views wrap inside `StandardToolLayout` with `maxWidth="max-w-[1240px]"`, consume the single source of truth `props.lang`, provide full keyboard navigation, and satisfy WCAG 2.1 AA contrast requirements ($\ge 4.5:1$).
- **Local Privacy**: No passport numbers, immigration case numbers, or full names are collected or transmitted. All calculations execute 100% client-side in the browser.

---

## 3. Milestone Execution & Verification Record

| Milestone | Deliverable | Git Tag / Commit | Core Tests | Hub Tests | Audit Status | Real Browser (Gate 4) |
|---|---|---|---|---|---|---|
| **M0** | Pre-phase Baseline Verification | `pre-phase7` | 378 / 378 PASS | 75 / 75 PASS | 43 / 43 PASS | 100% PASS |
| **M1** | Work Scope Checker | `phase7-work-scope-pass` (`a74bdeb`) | 393 / 393 PASS | 75 / 75 PASS | 44 / 44 PASS | Verified |
| **M2** | Residence Renewal Guide | `phase7-renewal-guide-pass` (`63e7c3d`) | 404 / 404 PASS | 75 / 75 PASS | 45 / 45 PASS | Verified |
| **M3** | Affiliation Change Checker | `phase7-affiliation-change-pass` (`e3f55d5`) | 415 / 415 PASS | 75 / 75 PASS | 46 / 46 PASS | Verified |
| **M4** | Status Change Guide | `phase7-status-change-pass` (`6fb971a`) | 427 / 427 PASS | 75 / 75 PASS | 47 / 47 PASS | Verified |
| **M5** | Family Immigration Guide | `phase7-family-immigration-pass` (`7dd4709`) | 439 / 439 PASS | 75 / 75 PASS | 48 / 48 PASS | Verified |
| **M6** | PR Readiness Checker | `phase7-permanent-residence-pass` (`00d081e`) | 448 / 448 PASS | 75 / 75 PASS | 49 / 49 PASS | 100% PASS (2214ms) |
| **M7** | Arriving in Japan Setup Wizard | `phase7-arrival-lifeevent-pass` (`8af3ce6`) | 455 / 455 PASS | 75 / 75 PASS | 50 / 50 PASS | 100% PASS (2073ms) |
| **M8** | Leaving Japan Procedure Wizard | `phase7-leaving-japan-pass` (`4be4c55`) | 465 / 465 PASS | 75 / 75 PASS | 51 / 51 PASS | 100% PASS (2172ms) |
| **C10**| Final Phase 7 Gate & Report | `phase7-final-pass` | 465 / 465 PASS | 75 / 75 PASS | 51 / 51 PASS | 100% PASS (All 45 Apps)|

---

## 4. Detailed Deliverables Specification

### M1: Work Scope Checker (`work-scope-checker-jp`)
- **Primary Function**: Diagnoses allowed, restricted, and prohibited employment activities for 29 Japanese visa statuses under Immigration Control Act Articles 19 & Annexed Tables 1 & 2.
- **Key Capabilities**:
  - Distinguishes Table 1 (activity-based: Engineer, Specialist in Humanities, etc.) vs Table 2 (status-based: Spouse, Permanent Resident, etc., with zero work restrictions).
  - Explicitly handles Article 19 paragraph 2 Permission to Engage in Activity other than that Permitted (資格外活動許可): strictly caps student/dependent part-time work to 28 hours/week during semesters (up to 40 hours/week during official academic vacations).
  - Flags complete prohibition of adult entertainment business employment (風俗営業等の禁止 - Adult Entertainment Business Act).

### M2: Residence Renewal Guide (`residence-renewal-guide-jp`)
- **Primary Function**: Calculates renewal application window and generates official document checklists under Immigration Control Act Article 21.
- **Key Capabilities**:
  - Application window calculation: opens exactly 3 months prior to expiration.
  - Statutory 2-Month Grace Period (特例期間 - Tokurei Kikan): provides legal protection up to 2 months past expiry if renewal is submitted before the expiration date.
  - Document checklist categorized by employer size (Category 1 to Category 4).
  - Revenue stamp fee calculation: 4,000 JPY (current) / 6,000 JPY (effective 2026-10-01).

### M3: Affiliation Change Checker (`affiliation-change-checker-jp`)
- **Primary Function**: Guides foreigners changing jobs or schools regarding mandatory 14-day reporting under Immigration Control Act Article 19-16.
- **Key Capabilities**:
  - Differentiates contract termination, new contract signing, and simultaneous change.
  - Highlights the 14-day statutory notification deadline via ISA electronic notification system (出入国在留管理庁 電子届出システム).
  - Details Certificate of Authorized Employment (就労資格証明書 - Shuro Shikaku Shomeisho) under Article 19-2 to ensure safety when renewing with a new employer.

### M4: Status Change Guide (`status-change-guide-jp`)
- **Primary Function**: Evaluates eligibility and requirements when transitioning between residence statuses under Immigration Control Act Article 20.
- **Key Capabilities**:
  - Transition matrix covering Student $\to$ Engineer/Specialist in Humanities, General Work $\to$ Highly Skilled Professional (HSP 1), Work $\to$ Spouse of Japanese National, and Business Manager.
  - Interactive Highly Skilled Professional (高度専門職 - HSP) point calculator evaluating education, professional career, annual income, age, and bonus points (JLPT N1/N2, designated university graduates) against 70 pt and 80 pt fast-track thresholds.

### M5: Family Immigration Guide (`family-immigration-guide-jp`)
- **Primary Function**: Guides sponsorship of spouses and children under the Dependent (家族滞在 - Kazoku Taizai) status.
- **Key Capabilities**:
  - Evaluates sponsor's financial support capacity based on annual income and household size.
  - Distinguishes between Certificate of Eligibility (在留資格認定証明書 - COE) for family residing abroad vs Change of Status for family already in Japan.
  - Details required relationship proofs (marriage certificates, birth certificates with Japanese translations) and clarifies that parents are not eligible for Dependent status.

### M6: Permanent Residence Readiness Checker (`pr-readiness-checker-jp`)
- **Primary Function**: Performs a multi-dimensional readiness audit for Permanent Residence applications under Immigration Control Act Article 22.
- **Key Capabilities**:
  - Evaluates residential history requirements: 10 years continuous residence (with $\ge 5$ years on work status), 3 years for Spouses of Japanese Nationals / PRs, or 1/3 years under the HSP Point system (80 pts $\to$ 1 yr, 70 pts $\to$ 3 yrs).
  - Rigorous compliance auditing: zero unpaid/delayed pension (Nenkin) and social health insurance contributions over the statutory lookback window (2 years for work/spouse, 1 year for 80-pt HSP).
  - Evaluates income thresholds: minimum 3M JPY base + 700k-800k JPY per dependent over 5 consecutive years.
  - Checks current visa duration: requires holding the longest currently granted duration ($\ge 3$ years).
  - Strict compliance with McLean doctrine: highlights administrative discretion without false approval claims.

### M7: Arriving in Japan Setup Guide (`arriving-in-japan-wizard-jp` - 4th Life Event)
- **Primary Function**: Comprehensive onboarding roadmap for newcomers arriving in Japan.
- **Key Capabilities**:
  - 4 sequential onboarding stages: Airport Landing, Municipal Registration (14 days), Life Essentials, and Employer/School Onboarding.
  - 10 statutory tasks with dynamic deadline calculations: flags approaching and overdue warnings for the mandatory 14-day resident registration (転入届) under Article 19-7 and Basic Resident Registration Act Article 22.
  - Filters tasks dynamically by visa category (work, student, dependent) and insurance type (Shakai Hoken vs Kokumin Kenpo/Nenkin).
  - Full localStorage checklist persistence under `ai_tools_arriving-in-japan-wizard-jp_progress`.

### M8: Leaving Japan Procedure Guide (`leaving-japan-wizard-jp` - 5th Life Event)
- **Primary Function**: Comprehensive roadmap for temporary departure or permanent exit from Japan.
- **Key Capabilities**:
  - 3 sequential stages: Pre-Departure Municipal & Tax, Airport Exit Inspection, and Post-Departure Pension Withdrawal & Tax Refund.
  - Branch 1: Temporary Departure (一時出国):
    - $\le 1$ year: Special Re-entry Permit (みなし再入国許可 - Art. 26-2) handled at airport ED card check without fee or advance ISA visit.
    - $> 1$ year: Formal Re-entry Permit (再入国許可 - Art. 26) requiring advance ISA application (single: 3,000 JPY, multiple: 6,000 JPY).
  - Branch 2: Permanent Departure (完全出国 / 本帰国):
    - Overseas moving-out notice (海外転出届) $\sim 14$ days prior.
    - Invalidation of My Number Card.
    - Appointment of Tax Administrator (納税管理人 - Income Tax Act Art. 117).
    - Resident tax settlement.
    - Airport residence card invalidation punch (穴あけ返納).
    - Lump-Sum Pension Withdrawal (脱退一時金) capped at 60 months (5 years) with strict 2-year application deadline.
    - 20.42% income tax refund claim via Tax Administrator.
  - Full localStorage checklist persistence under `ai_tools_leaving-japan-wizard-jp_progress`.

---

## 5. Statutory Sources & Primary Legal Grounding

| Source ID | Statutory Name & Provisions | Subject Matter |
|---|---|---|
| `isa-ica-annexed-table-1` | 出入国管理及び難民認定法 別表第一 | Work statuses & permissible activities |
| `isa-ica-annexed-table-2` | 出入国管理及び難民認定法 別表第二 | Status-based residence (Spouse, PR, Long-Term) |
| `isa-ica-art19-parttime` | 出入国管理及び難民認定法 第19条第2項 | Permission to Engage in Activity other than Permitted |
| `isa-renewal-art21` | 出入国管理及び難民認定法 第21条 | Extension of Period of Stay & Tokurei Kikan |
| `isa-affiliation-art19-16` | 出入国管理及び難民認定法 第19条の16 | Notification of Organization of Affiliation |
| `isa-change-art20` | 出入国管理及び難民認定法 第20条 | Change of Status of Residence |
| `isa-hsp-point-system` | 法務省告示 / 出入国在留管理庁 高度専門職省令 | Highly Skilled Professional Point Evaluation Table |
| `isa-pr-guidelines` | 出入国在留管理庁 永住許可に関するガイドライン | Permanent Residence Guidelines (10yr, 5yr, HSP) |
| `isa-reentry-art26` | 出入国管理及び難民認定法 第26条 & 第26条の2 | Re-entry Permit & Special Minashi Re-entry |
| `soumu-resident-basic-book-act`| 住民基本台帳法 第22条〜第25条 & 第52条 | Moving-in, moving-out, address notifications |
| `jps-lump-sum-withdrawal` | 国民年金法附則第9条の3の2 / 厚生年金保険法附則第29条 | 60-Month Lump-Sum Pension Withdrawal & 2yr deadline|
| `nta-tax-administrator` | 所得税法 第117条 / 地方税法 | Tax Administrator Appointment & Representation |
| `nta-income-tax-act` | 所得税法 第212条 & 第213条 | 20.42% Withholding Income Tax on Pension Refund |

---

## 6. Verification Metrics & Production Readiness

- **Total Tools in Hub**: 51 tools (45 active, 6 paused in development).
- **Verified Production Tools**: 37 verified production-grade tools.
- **Packages Core Tests**: **465 / 465 PASS** (`npm --prefix packages/core test`).
- **Hub Unit Tests**: **75 / 75 PASS** (`npm --prefix hub test`).
- **Static Governance Audit**: **51 / 51 PASS (0 Failures)** (`npm run audit:miniapps`).
- **Production Build**: **0 errors**, completed in 12.80s (`npm --prefix hub run build`).
- **Real-Browser Verification (Gate 4)**: **100% PASS** on all Phase 7 miniapps and life events. Zero horizontal overflow on iPhone (390px) and Android (412px), zero runtime errors, full WCAG 2.1 AA contrast compliance, and full keyboard navigation.

Phase 7 is officially certified as complete and production-ready.

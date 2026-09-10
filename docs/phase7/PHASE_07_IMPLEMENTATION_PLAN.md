# PHASE 7 IMPLEMENTATION PLAN: JAPAN RESIDENCE & IMMIGRATION / 在留・入管

**Domain**: Japan Life → Residence & Immigration / 在留・入管  
**Status**: Ready for Plan Gate Approval  
**Architecture Standard**: Zero Cross-Domain Direct Imports, Regulatory Foundation Integration, Life Event Runtime Orchestration, Discretion Safety Protocol  

---

## 1. Domain Directory Architecture (`packages/core/src/japan/immigration/`)

The core immigration domain is located at `packages/core/src/japan/immigration/` with modular separation:

```
packages/core/src/japan/immigration/
├── context/
│   └── residenceContext.js         # Canonical Residence Context & Status Types
├── status/
│   ├── statusDefinitions.js        # Official Table 1 & Table 2 Status Definitions
│   └── statusCatalog.js            # Trilingual labels, categories, and lookup functions
├── workScope/
│   ├── workScopeRules.js           # Statutory activity bounds & 資格外活動許可 rules
│   └── workScopeEngine.js          # M1 Engine: Work Scope Evaluator
├── renewal/
│   ├── renewalRules.js             # Window, photo age (2026-06-14), fee boundary (2026-10-01)
│   ├── renewalDocuments.js         # Status-specific structured document checklists
│   └── renewalEngine.js            # M2 Engine: Residence Renewal Guide
├── affiliation/
│   ├── affiliationRules.js         # ICA Art. 19-16 14-day reporting rules
│   └── affiliationEngine.js        # M3 Engine: Affiliation Change Checker
├── statusChange/
│   ├── statusChangeRules.js        # Transition pathways (Student->Work, Dependent->Work, etc.)
│   └── statusChangeEngine.js       # M4 Engine: Status Change Guide
├── family/
│   ├── familyImmigrationRules.js   # 家族滞在 vs spouse statuses, sponsor qualifications
│   └── familyImmigrationEngine.js  # M5 Engine: Family Immigration Guide
├── permanentResidence/
│   ├── prReadinessRules.js         # Current guidelines (duration, period, tax/pension compliance)
│   └── prReadinessEngine.js        # M6 Engine: PR Readiness Evaluator (No fake percentages)
├── lifeEvents/
│   ├── arrivalLifeEventDefinition.js # M7: Arriving in Japan LifeEventDefinition
│   └── leavingLifeEventDefinition.js # M8: Leaving Japan LifeEventDefinition
├── documents/
│   ├── documentModel.js            # Common document types & registry
│   └── commonDocuments.js          # Shared identity, civil, tax, and pension documents
├── index.js                        # Unified domain export
└── tests/                          # Domain unit & golden tests
```

---

## 2. Canonical Residence Context & Canonical Status IDs

### 2.1 Canonical Status IDs (Programmatic Tokens)
Logic never operates on localized display labels. Canonical status IDs:
- **Work Statuses (Table 1)**:
  - `engineer-humanities-international` (技術・人文知識・国際業務)
  - `business-manager` (経営・管理)
  - `highly-skilled-professional-1` / `highly-skilled-professional-2` (高度専門職)
  - `skilled-labor` (技能)
  - `intra-company-transferee` (企業内転勤)
  - `specified-skilled-worker-1` / `specified-skilled-worker-2` (特定技能1号・2号)
  - `technical-intern-training` (技能実習)
  - `nursing-care` (介護), `professor` (教授), `legal-accounting` (法律・会計業務), etc.
- **Non-Working Statuses (Table 1)**:
  - `student` (留学)
  - `dependent` (家族滞在)
  - `cultural-activities` (文化活動)
  - `temporary-visitor` (短期滞在)
  - `trainee` (研修)
- **Special Activities**:
  - `designated-activities` (特定活動 - Requires Designation Certificate details)
- **Status-Based Statuses (Table 2 - No Work Restrictions)**:
  - `permanent-resident` (永住者)
  - `spouse-of-japanese` (日本人の配偶者等)
  - `spouse-of-permanent-resident` (永住者の配偶者等)
  - `long-term-resident` (定住者)

### 2.2 Canonical Residence Context
```javascript
/**
 * @typedef {Object} ResidenceContext
 * @property {string} residenceStatus - Canonical status ID
 * @property {string} [periodOfStayEndDate] - Expiration date (YYYY-MM-DD)
 * @property {string} [currentActivity] - Current occupation/study description
 * @property {string} [employerOrInstitution] - Organization name
 * @property {string} [employmentType] - 'full-time' | 'contract' | 'part-time' | 'self-employed'
 * @property {boolean} [hasExtraActivityPermission] - 資格外活動許可 status
 * @property {string} [familyRelationship] - 'spouse' | 'child' | 'parent' | 'sibling' | 'other'
 * @property {string} [applicationDate] - Submission date for fee/rule resolution (YYYY-MM-DD)
 * @property {number} [yearsInJapan] - Cumulative residence duration
 */
```

---

## 3. Milestones & Checkpoint Tagging Plan

| Milestone | Deliverable | Miniapp ID / Path | Checkpoint Tag |
|---|---|---|---|
| **C0** | Pre-Phase 7 Baseline Verification | Baseline clean state | `pre-phase7` |
| **C1** | Architecture Review & Foundation Prep | Foundation enhancements, regulatory metadata, PR audit | `phase7-review-and-plan-pass` |
| **M1 / C2** | Work Scope Checker | `work-scope-checker-jp` | `phase7-work-scope-pass` |
| **M2 / C3** | Residence Renewal Guide | `residence-renewal-guide-jp` | `phase7-renewal-guide-pass` |
| **M3 / C4** | Affiliation Change Checker | `affiliation-change-checker-jp` | `phase7-affiliation-change-pass` |
| **M4 / C5** | Status Change Guide | `status-change-guide-jp` | `phase7-status-change-pass` |
| **M5 / C6** | Family Immigration Guide | `family-immigration-guide-jp` | `phase7-family-immigration-pass` |
| **M6 / C7** | PR Readiness Checker | `pr-readiness-checker-jp` | `phase7-permanent-residence-pass` |
| **M7 / C8** | Arriving in Japan Life Event | `arriving-in-japan-wizard-jp` | `phase7-arrival-lifeevent-pass` |
| **M8 / C9** | Leaving Japan Life Event | `leaving-japan-wizard-jp` | `phase7-leaving-japan-pass` |
| **C10** | Final Regression & Integration Audit | Full suite verification & reports | `phase7-final-pass` |

---

## 4. Detailed Specification of Deliverables

### M1: 在留資格・就労範囲チェッカー (`work-scope-checker-jp`)
- **Purpose**: Clarify permissible employment scope under current residence status without pseudo-legal guarantees.
- **Engine**: `workScopeEngine.js` matching user status, planned activity, industry, and extra-activity permission.
- **Rules**: Table 1 activity bounds; Table 2 unconditional freedom; 留学/家族滞在 28-hour rule with adult entertainment (風俗営業) ban; 特定活動 shiteisho requirement.
- **Output Taxonomy**: `Generally within scope` | `Potentially outside current status` | `Requires 資格外活動許可` | `Depends on designated activities details` | `Needs immigration confirmation`.

### M2: 在留期間更新ガイド (`residence-renewal-guide-jp`)
- **Purpose**: Procedural guide and readiness assessment for period of stay extension.
- **Statutory Rules**:
  - Renewal window (~3 months prior to expiration) & 特例期間 (up to 2 months past expiration pending decision).
  - Photo exemption: for residence cards issued $\ge$ 2026-06-14, infants under 1 year are exempt (formerly under 16 years).
  - Fee revision: governed strictly by `applicationDate`. Applications on/before 2026-09-30 = 4,000 JPY; on/after 2026-10-01 = 6,000 JPY (paper rate), even if permit issued post Oct 1.
- **Structured Documents**: Category 1-4 employer document branching; tax certificates (住民税の課税・納税証明書); withholding slip (源泉徴収票).
- **Online Application**: Guidance for 在留申請オンラインシステム.

### M3: 転職・所属機関変更チェッカー (`affiliation-change-checker-jp`)
- **Purpose**: Connect Employment and Immigration domains without direct package imports.
- **Rules**: ICA Art. 19-16 statutory 14-day deadline for submitting 所属機関等に関する届出 upon resignation, transfer, or joining a new organization.
- **Crucial Distinction**:
  - Same activity scope: Notification only + optional 就労資格証明書 (Certificate of Authorized Employment).
  - New activity outside status: Status change permission required BEFORE commencing work.
- **Action Pathways**: Online electronic notification deep-link, postal mail guide, counter submission.

### M4: 在留資格変更ガイド (`status-change-guide-jp`)
- **Purpose**: Guide foreign residents transitioning to a new life/career activity.
- **Transition Pathways**:
  - Student (留学) $\to$ Work (技人国 / 特定技能)
  - Dependent (家族滞在) $\to$ Work (技人国)
  - Work $\to$ Spouse of Japanese / Spouse of PR (身分系への変更)
  - Work $\to$ Business Manager (経営・管理 - caveats on capital/employees)
- **Output**: Candidate status families, eligibility prerequisites, required documents, fee schedule.

### M5: 家族滞在・家族呼寄せガイド (`family-immigration-guide-jp`)
- **Purpose**: Guide bringing family to Japan or adjusting status for family members.
- **Statutory Boundaries**:
  - `家族滞在` strictly applies ONLY to legally married spouse and unmarried dependent children.
  - Parents and siblings are strictly excluded (guidance on other specialized routes if applicable).
  - Sponsor status qualification (技人国, 経営・管理 vs non-qualifying 特定技能1号, 技能実習).
- **Procedure Branches**:
  - Family outside Japan: COE (在留資格認定証明書交付申請).
  - Family already in Japan: Status Change (在留資格変更許可申請).

### M6: 永住申請準備度チェッカー (`pr-readiness-checker-jp`)
- **Purpose**: Multi-dimensional permanent residence readiness evaluator.
- **Strict Discretion Policy**: Zero percentage approval claims, zero "you will be granted PR".
- **Evaluation Dimensions**:
  1. Residence Duration: 10+ yrs (5+ yrs work) standard; 3+ yrs marriage & 1+ yr residence for Spouse route; HSP 80 pts (1 yr) / 70 pts (3 yrs).
  2. Period of Stay: Must currently hold the maximum period granted (3 or 5 years; 1 year is disqualified).
  3. Tax Compliance: Flawless, on-time payment record for required review period.
  4. Pension & Health Insurance: Zero late payments in past 2-3 years.
  5. Livelihood & Financial Stability: Sustainable independent income.
- **Current vs Proposed Rules**: Current ISA guidelines are evaluated as active; 2026 public consultation proposals are labeled as regulatory monitoring items and NEVER treated as active law.

### M7: 来日後セットアップガイド (`arriving-in-japan-wizard-jp`)
- **Architecture**: 4th Life Event built on `createLifeEventRuntime`.
- **Stages**:
  1. Airport Landing: Residence card receipt, comprehensive work permission application at port of entry.
  2. Within 14 Days: Resident Registration (転入届) at municipal office, My Number, National Health Insurance / Pension enrollment (if not company-enrolled).
  3. First Month: Mobile SIM, bank account (6-month foreign exchange limitation awareness), housing seal registration.
  4. Employment/School Start: Corporate social insurance cards, tax withholding forms.
- **Capability Orchestration**: Deep links to Housing (`housing.moving.admin.check`), Insurance (`insurance.socialInsurance.eligibility`), and Tax (`tax.japan.calculate`).

### M8: 日本を離れる手続きガイド (`leaving-japan-wizard-jp`)
- **Architecture**: 5th Life Event built on `createLifeEventRuntime`.
- **Departure Intent Branching**:
  - Temporary Departure: みなし再入国許可 (Special Re-entry within 1 year) vs regular 再入国許可 ($> 1$ year).
  - Permanent Departure: Move-out notification (転出届), resident tax settlement & tax agent (納税管理人), residence card hole-punching at airport departure counter.
- **Pension Lump-Sum Withdrawal**: Detailed guidance on 脱退一時金 (claimable within 2 years of departure for 6+ months contribution).

---

## 5. Verification & Quality Gates

1. **Unit & Engine Tests**:
   - `packages/core/tests/immigration-work-scope.test.js`
   - `packages/core/tests/immigration-renewal.test.js`
   - `packages/core/tests/immigration-affiliation.test.js`
   - `packages/core/tests/immigration-status-change.test.js`
   - `packages/core/tests/immigration-family.test.js`
   - `packages/core/tests/immigration-pr-readiness.test.js`
   - `packages/core/tests/immigration-life-events.test.js`
2. **Legal Golden Tests**:
   - `packages/core/tests/regulatory-japan-immigration-golden.test.js`
   - Verification of 2026-09-30 vs 2026-10-01 fee boundary based on `applicationDate`.
   - Verification of 2026-06-14 photo exemption rule (<1 year old).
   - Verification of draft vs active guideline separation.
3. **Discretion Safety & Negative Certainty Tests**:
   - Automated regex scan asserting zero presence of forbidden positive-certainty claims.
4. **Static Governance Audit**:
   - `npm run audit:miniapps` (All 43+ miniapps must pass Gates 1, 2, 3 with 0 failures).
5. **Real-Browser Headless Verification**:
   - Verification of all 8 tools on Desktop (1440px), Tablet (768px), and Mobile (390px / 412px).
   - Light and Dark mode rendering.
   - Hash URL direct routing and back/forward navigation.

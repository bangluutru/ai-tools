# PHASE 9 — JAPAN LIFE NAVIGATOR + CROSS-DOMAIN LIFE EVENTS IMPLEMENTATION PLAN

## Overview & Objectives
Phase 9 transitions Toolio from domain-specific vertical depth into a cross-domain product orchestration platform. The focus is twofold:
1. **Japan Life Navigator**: A deterministic orchestration layer that converts structured user intent and minimal context into prioritized, jurisdiction-aware, and regulatory-fresh recommendations without hallucinating legal conclusions or duplicating business engine rules.
2. **Cross-Domain Life Events**: Complete lifecycle support for multi-domain transitions in Japan (Starting Life, Changing Job, Family Joining) composed seamlessly with existing life events (Leaving Job, Pregnancy/Birth, Moving, Leaving Japan) via reusable fragments and the Capability Registry.

---

## Architecture & System Gates

### Gate 1: No Business Rules Duplicated in Navigator
Navigator and Life Event orchestrators must NEVER compute tax formulas, unemployment amounts, visa point totals, or document acquisition fees. All business logic stays with the domain engines (Tax, Insurance, Employment, Family, Housing, Residence, Documents).

### Gate 2: No Direct Mini-app Imports
Navigator and Life Events interact exclusively with the `CapabilityRegistry` and `LifeEventRuntime`. No imports of `JapanTaxSimulator.jsx`, `UnemploymentEligibilityJp.jsx`, etc. in Navigator files.

### Gate 3: Unidirectional Dependency Graph & No Circularity
```
Navigator (Layer 4)
  ↓
LifeEventRuntime & CapabilityRegistry (Layer 3)
  ↓
Domain Regulatory & Procedural Engines (Layer 2)
  ↓
Core Infrastructure & Storage (Layer 1)
```
Domains never know Navigator exists. Circular dependencies will fail `npm run graph:audit`.

### Gate 4: Context Minimization & Privacy
- Zero upfront collection of sensitive PII (My Number digits, passport numbers, bank accounts, medical histories).
- Context handoff to mini-apps strictly uses capability-declared `acceptedContextFields` allowlists and ephemeral `sessionStorage` tokens (`ai_tools_handoff_<token>`). No query string exposure of personal financial or status data.

---

## Detailed Milestones (M1 — M10)

### Milestone M1: Navigator Foundation
- **Target Package**: `packages/core/src/navigator/`
- **Deliverables**:
  - `context/navigatorContext.js`: Factory, validator, and sanitizer for minimal `NavigatorContext` (`country`, `lifeSituation`, `municipality`, `employmentStatus`, `residenceStatus`, `insuranceType`, `familyContext`, `eventDates`).
  - `recommendations/recommendationContract.js`: Typed recommendation builder with `confidenceType` (`deterministic`, `likely`, `conditional`, `administrative-review`, `local-data-unverified`), `priority` (`urgent`, `required`, `recommended`, `optional`, `informational`), and `timing` (`now`, `before-event`, `on-event`, `after-event`, `later`).
  - `capabilityGraph/capabilityResolver.js`: Resolves semantic capability IDs (`employment.unemployment.eligibility`) to Tool IDs (`unemployment-eligibility-jp`) and checks capability availability and context compatibility.
  - `ranking/recommendationRanker.js`: Deterministic ordering based on deadline urgency, procedural precedence, and regulatory status.
  - `tests/`: Foundation tests for context sanitization, contract validation, and ranking.
- **Checkpoint**: `C2` — `phase9-navigator-foundation-pass`

### Milestone M2: Intent & Situation Routing
- **Target Package**: `packages/core/src/navigator/intent/`
- **Deliverables**:
  - `intentTaxonomy.js`: Canonical intent registry (`intent.jp.life.start`, `intent.jp.job.change`, `intent.jp.job.leave`, `intent.jp.residence.renew`, `intent.jp.family.invite`, `intent.jp.move`, `intent.jp.birth`, `intent.jp.document.obtain`, `intent.jp.life.leave`).
  - `intentResolver.js`: Multilingual tokenizer and alias matcher (VI, JA, EN, Romaji e.g., `eijuu`, `chuyen viec`, `vinh tru`, `tenshoku`).
  - `intentDisambiguator.js`: Single-question decision tree for ambiguous user prompts (e.g. visa change intent branching to job change, marriage, or graduation).
  - Purely deterministic; no runtime LLM dependency.
- **Checkpoint**: `C3` — `phase9-intent-routing-pass`

### Milestone M3: Starting Life in Japan
- **Target Package**: `packages/core/src/lifeEvents/definitions/`
- **Deliverables**:
  - `startingLifeDefinition.js` (`life.jp.starting-life`): Unifies and supersedes the standalone arrival flow.
  - 4 Sequential Stages:
    1. `airport-arrival`: Landing inspection, Residence Card issuance, initial customs.
    2. `municipal-setup`: 14-day address registration (Juminhyo), My Number issuance notice, Seal registration (Hanko) if needed.
    3. `insurance-pension-enrollment`: Company Shakai Hoken vs. Municipal NHI/Kokumin Nenkin, student pension exemption check.
    4. `daily-essentials-settling`: Bank account opening, SIM/mobile setup, utility contract setup, municipal tax awareness.
  - Context branching for: Company Employee, Student, Dependent/Family, Family with Children.
- **Checkpoint**: `C4` — `phase9-starting-life-pass`

### Milestone M4: Changing Job Life Event
- **Target Package**: `packages/core/src/lifeEvents/definitions/`
- **Deliverables**:
  - `changingJobDefinition.js` (`life.jp.changing-job`): Dedicated orchestration for transitioning between Japanese employers.
  - 4 Sequential Stages:
    1. `before-leaving`: Withholding slip (Gensen Choshuhyo) request, Employment Insurance card request, exit notification to municipal tax office.
    2. `between-jobs-gap`: Conditional evaluation based on gap length. If gap exists: 14-day Immigration affiliation notification, switch from Kenpo to Kokumin Kenko Hoken (or voluntary continuation Nin'i Keizoku), switch to Kokumin Nenkin, unemployment consultation if gap is extended.
    3. `before-new-job-starts`: Certificate of Authorized Employment (Shurou Shikaku Shomeisho) if duty changes, document prep for new employer.
    4. `after-starting-new-job`: Shakai Hoken re-enrollment, Pension book submission, end-of-year tax adjustment (Nenmatsu Chosei) integration.
  - Special handling: Unrestricted residence statuses (Spouse, PR) bypass immigration employer notifications.
- **Checkpoint**: `C5` — `phase9-changing-job-pass`

### Milestone M5: Family Joining Japan
- **Target Package**: `packages/core/src/lifeEvents/definitions/`
- **Deliverables**:
  - `familyJoiningDefinition.js` (`life.jp.family-joining`): Cross-domain orchestrator for bringing spouse/children to Japan.
  - 4 Stages:
    1. `pre-arrival-coe`: Sponsor status check, Certificate of Eligibility application via Phase 7 Family Immigration guide.
    2. `arrival-and-landing`: Visa conversion at port of entry, Residence Card issuance.
    3. `municipal-registration`: Joint address registration, dependent My Number, child medical expense subsidy (Iryouhi Josei) application.
    4. `benefits-and-schooling`: Shakai Hoken dependent addition (Fuyou), Child Allowance (Jido Teate) application, municipal school enrollment.
- **Checkpoint**: `C6` — `phase9-family-joining-pass`

### Milestone M6: Cross-Domain Life Event Composition
- **Target Package**: `packages/core/src/lifeEvents/fragments/`
- **Deliverables**:
  - `fragments/employmentExitFragment.js`: Reusable exit steps (documents, exit tax, insurance return).
  - `fragments/municipalAddressFragment.js`: Reusable 14-day in/out moving and registration steps.
  - `fragments/insuranceTransitionFragment.js`: Reusable health insurance and pension bridge steps.
  - `fragments/immigrationNotificationFragment.js`: Reusable 14-day statutory notification steps.
  - Architecture test: Verification of zero circular dependencies and 100% decoupling between domain engines and Navigator.
- **Checkpoint**: `C7` — `phase9-cross-domain-composition-pass`

### Milestone M7: Japan Life Dashboard / Journey View
- **Target Package**: `hub/src/components/navigator/` & `hub/src/tools/`
- **Deliverables**:
  - `JapanLifeNavigatorView.jsx`: Interactive journey timeline view displaying stages, active items, required vs recommended actions, deadline alerts, and reason codes.
  - `JapanLifeNavigatorTool.jsx`: Hub-registered tool entry point.
  - Local persistence via `localStorage` (key: `toolio_japan_life_journey_v1`).
  - Privacy safeguards: Zero storage of sensitive IDs or plain financial values; full "Reset Journey" and "Clear Context" buttons.
  - Regulatory Freshness Badge: Detects stale journey snapshots and offers "Re-evaluate with latest rules" banner.
- **Checkpoint**: `C8` — `phase9-journey-view-pass`

### Milestone M8: Unified Search & Smart Recommendations
- **Target Package**: `packages/core/src/navigator/search/`
- **Deliverables**:
  - `unifiedSearchIndex.js`: Cross-cutting index aggregating Tools, Capabilities, Life Events, Procedures, and Documents.
  - `searchEngine.js`: Deterministic ranker prioritizing exact intent match, life-event relevance, and multilingual aliases.
  - `recommendationEngine.js`: Context-driven suggestions with structured reason codes (e.g. `REASON_JOB_CHANGE_VISA_NOTIFY`).
- **Checkpoint**: `C9` — `phase9-search-recommendation-pass`

### Milestone M9: End-to-End Golden Journey Tests
- **Target Package**: `packages/core/tests/navigator/`
- **Deliverables**:
  - `goldenJourneys.test.js` validating all 7 canonical scenarios:
    1. Scenario 1: Vietnamese engineer arrives in Japan (Employee path).
    2. Scenario 2: Software developer changes employer with a 2-week gap.
    3. Scenario 3: Employee loses job without next job (Unemployment path).
    4. Scenario 4: Married couple in Shinagawa has a newborn baby.
    5. Scenario 5: Resident moves from Shinjuku to Fukuoka.
    6. Scenario 6: Permanent resident brings spouse from Vietnam.
    7. Scenario 7: Foreign worker resigns and leaves Japan permanently.
  - Assertions on: Stage ordering, required capabilities, deadline classes, jurisdiction routing, and absence of irrelevant warnings.
- **Checkpoint**: `C10` — `phase9-end-to-end-journeys-pass`

### Milestone M10: Full Hub Integration, Browser Verification & Reporting
- **Deliverables**:
  - Register `japan-life-navigator` in Hub tool registry and Japan Life hub category navigation.
  - Run full test suite (`@ai-tools/core` + `hub`).
  - Run static audit and dependency graph audit.
  - Production build verification (`npm run build`).
  - Real Chrome browser verification across desktop, tablet, and mobile; light and dark mode; journey persistence; and context handoff.
  - Final Report `docs/PHASE_09_JAPAN_LIFE_NAVIGATOR_REPORT.md`.
- **Checkpoint**: `C11` — `phase9-final-pass`

---

## Checkpoint Registry
| Checkpoint | Tag / Name | Scope |
|---|---|---|
| C0 | `pre-phase9` | Pre-audit baseline (Tagged) |
| C1 | `phase9-audit-plan-pass` | Audit & Plan complete and approved |
| C2 | `phase9-navigator-foundation-pass` | Navigator core engine, context, contracts |
| C3 | `phase9-intent-routing-pass` | Multilingual intent resolver & disambiguator |
| C4 | `phase9-starting-life-pass` | Starting Life in Japan cross-domain event |
| C5 | `phase9-changing-job-pass` | Changing Job cross-domain event |
| C6 | `phase9-family-joining-pass` | Family Joining Japan cross-domain event |
| C7 | `phase9-cross-domain-composition-pass` | Reusable fragments & zero-circularity graph |
| C8 | `phase9-journey-view-pass` | Journey UI, local persistence, reset, freshness |
| C9 | `phase9-search-recommendation-pass` | Unified search across 5 entity types |
| C10 | `phase9-end-to-end-journeys-pass` | 7 Golden Journey integration tests |
| C11 | `phase9-final-pass` | Full regression, browser verify, build, report |

---

## Verification Plan

### Automated Tests
- Unit tests: `npm --workspace=@ai-tools/core test` (all existing + new navigator tests).
- Hub tests: `npm --workspace=hub test`.
- Dependency circularity audit: `npm run graph:audit`.
- Miniapp static audit: `node scripts/audit-miniapps.mjs`.

### Browser Verification
- Launch local dev server (`http://localhost:5173`).
- Use browser subagent to test:
  1. Landing view & Entry cards ("What do you need help with?").
  2. Free-text search in Vietnamese, Japanese, and English.
  3. Interactive journey progress: Starting Life and Changing Job.
  4. LocalStorage persistence on reload and clean journey reset.
  5. Responsive layout across desktop (1280x800) and mobile (375x812).
  6. Smoke test of Common Tools (PDF / Image tool) to ensure zero regression.

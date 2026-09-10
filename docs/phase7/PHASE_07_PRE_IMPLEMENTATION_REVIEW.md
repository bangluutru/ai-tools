# PHASE 7 PRE-IMPLEMENTATION ARCHITECTURE & FOUNDATION REVIEW

**Domain**: Japan Life → Residence & Immigration / 在留・入管  
**Evaluation Date**: September 2026  
**Status**: `READY_WITH_SMALL_FIXES`  
**Reviewer**: Toolio Quality Engineering & Regulatory Architecture Team  

---

## 1. Executive Summary & Review Verdict

A rigorous codebase inspection was conducted across Toolio's foundational systems prior to starting Phase 7:
1. **Life Event Foundation (`packages/core/src/life-events/`)**: Inspected `lifeEventRuntime.js`, `deadlineEngine.js`, `capabilityRegistry.js`, `checklistEngine.js`, and `lifeEventStorage.js`.
2. **Regulatory Foundation (`packages/core/src/regulatory/`)**: Inspected `effectivePeriod.js`, `ruleMetadata.js`, `sourceRegistry.js`, `jurisdiction.js`, and `verification.js`.
3. **Existing Domain Engines & Conventions**: Inspected `japan/employment/`, `japan/family/`, `japan/housing/`, `japan/insurance/`, and `utils/tax/`.
4. **Hub & Router Architecture**: Inspected miniapp registry, router paths, UI layouts (`StandardToolLayout`), and theme persistence.

### Verdict: `READY_WITH_SMALL_FIXES`
- **Zero Redesign Required**: The `createLifeEventRuntime` engine created in Phase 6 fully supports Arriving in Japan (M7) and Leaving Japan (M8).
- **Minor Generic Extensions Needed**:
  - `effectiveBy` parameter in `effectivePeriod.js` to anchor temporal rules on `applicationDate` (critical for the 2026-10-01 fee revision boundary), `issuanceDate`, or `eventDate`.
  - `ruleNature` metadata in `ruleMetadata.js` (`deterministic` | `prerequisite` | `guidance` | `administrative-discretion`).
  - `sourceStatus` expansion in `sourceRegistry.js` (`official-current` | `official-proposed` | `official-historical` | `deprecated`) to guarantee draft/proposed rules are never executed as active law.
  - Capability registration in `capabilityRegistry.js` for 8 new immigration capabilities.

---

## 2. Foundation Inspection & Verification Matrix

| Foundation Subsystem | Current State | Phase 7 Requirement | Compatibility Finding | Action Required |
|---|---|---|---|---|
| **LifeEventRuntime** (`createLifeEventRuntime`) | Pure JS factory, evaluated via `evaluateTimeline` and `evaluateChecklist` | Support M7 (Arriving) and M8 (Leaving) with conditional branches and stages | 100% Compatible. Handles dynamic dates, tasks, and state persistence | None (Runtime code remains untouched) |
| **DeadlineEngine** | Dynamic anchor-based date math (`moveDate`, `childBirthDate`, etc.) | Anchor on `arrivalDate`, `expiryDate`, `changeDate`, `plannedDepartureDate` | 100% Compatible. Any string date key can serve as an anchor | None |
| **CapabilityRegistry** | Maps semantic IDs to Tool IDs & deep links | Map 8 new immigration capabilities | Needs 8 new mappings in `DEFAULT_CAPABILITY_MAP` | Small addition to default map |
| **EffectivePeriod Resolver** | Supports `calendar-year`, `tax-year`, `fiscal-year`, `effective-date-range` against `context.date` | Support anchoring on `applicationDate` (e.g. 2026-10-01 fee revision applies to application submission date, not permit date) | Needs generic `effectiveBy` anchor support | Small generic enhancement to `isRuleApplicable` |
| **RuleMetadata Contract** | Requires `id`, `jurisdiction`, `sourceId`, `effectiveFrom`, `version`, `status` | Distinguish deterministic rules from administrative discretion and prerequisites | Needs `ruleNature` field (`deterministic`, `prerequisite`, `guidance`, `administrative-discretion`) | Add optional `ruleNature` to `defineRuleMetadata` |
| **OfficialSourceRegistry** | Tracks `official-primary`, `official-secondary`, `deprecated` | Distinguish active law from proposed/draft guidelines (e.g. 2026 PR public consultation) | Needs `official-current`, `official-proposed`, `official-historical` | Extend status union & validate |
| **Cross-Domain Separation** | 0 direct imports between domains | Immigration must link to Employment, Tax, Insurance, Moving without direct imports | 100% Compatible via Capability Registry & Hash URLs | Maintain strict zero-import rule |

---

## 3. Analysis of LifeEventRuntime for M7 & M8

Phase 7 introduces two comprehensive Life Events:
- **M7: 来日後セットアップガイド (`arriving-in-japan-wizard-jp`)**
- **M8: 日本を離れる手続きガイド (`leaving-japan-wizard-jp`)**

### Verification of Core Criteria:
1. **Multi-domain capabilities**: M7 connects to Resident Registration (Housing), Health Insurance & Pension (Insurance), and Employer Tax Withholding (Tax). M8 connects to Moving-out (Housing), Resignation (Employment), Lump-sum Pension Withdrawal (Insurance), and Tax Agent (Tax).
   - *Result*: Solved completely via `relatedCapabilityId` resolving through `capabilityRegistry`.
2. **Conditional branches**:
   - M7 branches: Salaried employee vs. student vs. dependent vs. business manager; arriving alone vs. with family.
   - M8 branches: Temporary departure (re-entry permission) vs. permanent departure (card surrender & municipal move-out); pension enrollment $>6$ months vs. $<6$ months.
   - *Result*: Solved cleanly in `evaluateChecklist(context, options)`.
3. **Deadlines**:
   - Move-in notice within 14 days of securing address (Basic Resident Registration Act Art. 22).
   - Contracting organization notification within 14 days (ICA Art. 19-16).
   - Lump-sum pension withdrawal within 2 years of leaving Japan.
   - *Result*: Handled via `deadlineRule: { anchorKey, offsetDays }`.
4. **Unsupported capability fallback**:
   - If a capability has no active miniapp (e.g. future foreign tax credit calculator), `resolveCapability` returns `isAvailable: false`, and the UI displays a clear guidance task without broken links.
5. **Administrative discretion representation**:
   - Discretionary items will carry explicit status badges (`"administrative-discretion"`) and warning text rather than boolean checkboxes.

**Conclusion**: LifeEventRuntime requires ZERO structural changes. It is 100% ready to host M7 and M8.

---

## 4. Required Small Generic Fixes

### Fix 1: Generic Temporal Anchoring (`effectiveBy`)
In `packages/core/src/regulatory/effectivePeriod.js`:
```javascript
export function isRuleApplicable(rule, context = {}) {
  if (!rule) return false;
  const { applicablePeriod, effectiveFrom, effectiveTo, effectiveBy } = rule;
  
  // Resolve target date according to effectiveBy anchor
  const targetDate = (effectiveBy && context[effectiveBy])
    ? context[effectiveBy]
    : (context.date || context.applicationDate || context.eventDate);
  
  if (targetDate) {
    if (effectiveFrom && targetDate < effectiveFrom) return false;
    if (effectiveTo && targetDate > effectiveTo) return false;
  }
  // ... rest of period checks ...
}
```

### Fix 2: Rule Nature Metadata
In `packages/core/src/regulatory/ruleMetadata.js`:
```javascript
export const ALLOWED_RULE_NATURES = Object.freeze([
  'deterministic',             // Strict math / deadlines / fee schedules
  'prerequisite',              // Statutory eligibility conditions
  'guidance',                  // Best-practice procedural recommendations
  'administrative-discretion', // Subject to discretionary evaluation by ISA
]);
```

### Fix 3: Source Status Expansion
In `packages/core/src/regulatory/sourceRegistry.js`:
```javascript
export const ALLOWED_SOURCE_STATUSES = Object.freeze([
  'official-current',    // Active statutory law / current ministerial ordinance
  'official-proposed',   // Draft guideline / public comment (NEVER treated as active)
  'official-historical', // Superseded law preserved for historical lookups
  'official-primary',    // Legacy compatibility alias for official-current
  'official-secondary',  // Explanatory guidance
  'deprecated',          // Withdrawn or obsolete
]);
```

### Fix 4: Register 8 New Capabilities
In `packages/core/src/life-events/capability/capabilityRegistry.js`:
- `immigration.workScope.check`: `work-scope-checker-jp`
- `immigration.residenceRenewal.guide`: `residence-renewal-guide-jp`
- `immigration.affiliationChange.check`: `affiliation-change-checker-jp`
- `immigration.statusChange.guide`: `status-change-guide-jp`
- `immigration.familyImmigration.guide`: `family-immigration-guide-jp`
- `immigration.permanentResidence.check`: `pr-readiness-checker-jp`
- `immigration.arrivingInJapan.guide`: `arriving-in-japan-wizard-jp`
- `immigration.leavingJapan.guide`: `leaving-japan-wizard-jp`

---

## 5. Review Conclusion

The architecture of Toolio is verified and ready for Phase 7 execution under the verdict:
`READY_WITH_SMALL_FIXES`

All proposed fixes are minimal, generic, strictly backward-compatible, and enhance the entire system's regulatory rigor.

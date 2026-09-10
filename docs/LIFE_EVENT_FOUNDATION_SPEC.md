# SPECIFICATION: TOOLIO LIFE EVENT FOUNDATION

**Package**: `@ai-tools/core`  
**Namespace**: `packages/core/src/life-events/`  
**Version**: 1.0.0  
**Compliance**: Presentation-Independent, Zero React Imports, WCAG 2.1 AA  

---

## 1. Purpose & Motivation

In life transitions (resignation, childbirth, relocation), users face complex statutory deadlines, multi-department paperwork, and financial decisions across disparate domains.
Prior to Phase 6, life event wizards (`leaving-job-wizard-jp` and `birth-wizard-jp`) duplicated date math, local storage patterns, progress calculation, and deep-linking mechanisms.

The **Life Event Foundation** provides a lightweight, pure JavaScript engine that:
1. Standardizes stage hierarchies, contextual checklist generation, and statutory deadline calculations.
2. Decouples domain logic from UI rendering (0 React dependencies in core).
3. Resolves semantic capabilities to tool IDs without cross-domain direct imports.
4. Manages persistent browser storage under standardized namespaces with safety fallbacks.

---

## 2. Core Architecture Overview

```
                          ┌────────────────────────┐
                          │  LifeEventDefinition   │
                          └───────────┬────────────┘
                                      │
                         createLifeEventRuntime(def)
                                      │
                         ┌────────────▼────────────┐
                         │    LifeEventRuntime     │
                         └──────┬──────┬─────┬─────┘
                                │      │     │
                 ┌──────────────┘      │     └──────────────┐
                 ▼                     ▼                    ▼
        evaluateTimeline()    evaluateChecklist()    storage API
                 │                     │                    │
                 │              ┌──────┴──────┐             │
                 │              ▼             ▼             │
                 │       deadlineEngine  capabilityReg      │
                 ▼                     ▼                    ▼
           Stage Milestones    Enriched Action Items   localStorage
```

---

## 3. Subsystem Breakdown

### 3.1 Data Types (`types/lifeEventTypes.js`)
Defines the canonical JSDoc interface:
- `LifeEventDefinition`:
  - `id`: unique event ID (`'leaving-job'`, `'birth'`, `'moving'`).
  - `country`: ISO-3166 code (`'JP'`).
  - `domain`: category name (`'employment'`, `'family'`, `'housing'`).
  - `title`: trilingual display name `{ ja, vi, en }`.
  - `stages`: array of `TimelineStage` objects `{ id, stageId, nameJa, nameVi, nameEn, order }`.
  - `sources`: array of statutory citation keys.
  - `capabilities`: array of semantic capability IDs.
  - `evaluateChecklist(context, options)`: pure function returning raw checklist items.
- `ChecklistItem`:
  - `id`: unique task ID.
  - `stageId`: corresponding stage ID.
  - `titleJa`, `titleVi`, `titleEn`: trilingual titles.
  - `descriptionJa`, `descriptionVi`, `descriptionEn`: trilingual explanations.
  - `category`: task classification (`'admin'`, `'lifeline'`, `'finance'`, `'packing'`, `'family'`).
  - `priority`: `'urgent'` | `'important'` | `'recommended'`.
  - `deadlineRule`: `{ anchorKey, offsetDays, direction }`.
  - `relatedCapabilityId`: semantic capability string.
  - `deepLink`: `{ toolId, labelJa, labelVi, labelEn, badgeJa, badgeVi, badgeEn }`.
  - `isApplicable`: boolean conditional flag.
  - `requiredDocuments`: array of `{ nameJa, nameVi, nameEn }`.

### 3.2 Timeline & Deadline Engine (`timeline/deadlineEngine.js`)
Calculates dynamic calendar dates relative to anchor events (e.g. `resignationDate`, `birthDate`, `moveDate`):
- `calculateDeadlineDate(rule, context)`:
  - Adds or subtracts `offsetDays` from `context[rule.anchorKey]`.
  - Handles leap years, month overflows, and invalid dates gracefully.
- `formatDeadlineLabel({ rule, calculatedDate, lang })`:
  - Returns human-friendly trilingual string:
    - JA: `2026-10-15（引越し後14日以内）`
    - VI: `2026-10-15 (Trong vòng 14 ngày sau ngày chuyển)`
    - EN: `2026-10-15 (Within 14 days post-move)`

### 3.3 Semantic Capability Registry (`capability/capabilityRegistry.js`)
Eliminates cross-domain coupling by routing through semantic capability identifiers:
- `registerCapability(capabilityId, toolId)`
- `resolveCapability(capabilityId)`: returns `{ capabilityId, toolId, hashRoute, isAvailable }`.
- `buildCapabilityDeepLink(capabilityId, payload)`: generates `#tools/${toolId}?param=value`.
- Default Mappings:
  - `'housing.moving.cost.calculate'` $\to$ `moving-cost-jp`
  - `'housing.moving.admin.check'` $\to$ `moving-admin-checker-jp`
  - `'housing.address.change.check'` $\to$ `address-change-checklist-jp`
  - `'housing.moving.guide'` $\to$ `moving-wizard-jp`
  - `'family.childAllowance.calculate'` $\to$ `child-allowance-jp`
  - `'tax.japan.calculate'` $\to$ `japan-tax-simulator`

### 3.4 Checklist Engine (`checklist/checklistEngine.js`)
Stateless evaluation and statistical tracking:
- `filterChecklistItems(items, options)`: filters by `stageId`, `category`, `priority`, `isApplicable`, and `isCompleted`.
- `calculateChecklistStats(completedIds, stages, items)`: computes total, applicable, completed, percentage, and urgent remaining counts.

### 3.5 Storage Subsystem (`storage/lifeEventStorage.js`)
Isolates browser persistence:
- Storage Key Pattern: `toolio_life_event_${eventId}_completed`
- Safe operations:
  - `loadCompletedTasks(eventId, customStorage)`: parses JSON array or returns `[]`.
  - `saveCompletedTasks(eventId, taskIds, customStorage)`: persists deduplicated string IDs.
  - `toggleCompletedTask(eventId, taskId, customStorage)`: adds or removes task atomically.
  - `clearCompletedTasks(eventId, customStorage)`: resets storage.

### 3.6 Runtime Engine Factory (`runtime/lifeEventRuntime.js`)
Instantiates the complete engine instance via `createLifeEventRuntime(definition)`:
```javascript
import { createLifeEventRuntime } from '@ai-tools/core/life-events';
import { movingWizardDefinition } from './movingWizardDefinition.js';

export const movingWizardRuntime = createLifeEventRuntime(movingWizardDefinition);

// Usage:
const tasks = movingWizardRuntime.evaluateChecklist(context);
const stats = movingWizardRuntime.getChecklistStats(completedIds, context);
const deepLink = movingWizardRuntime.buildDeepLink('housing.moving.cost.calculate');
```

---

## 4. Migration & Adoption History

The Life Event Foundation was validated in production across three life-event domains:
1. **Employment**: `packages/core/src/japan/employment/rules/leavingJobDefinition.js` (`leaving-job-wizard-jp`).
2. **Family**: `packages/core/src/japan/family/rules/birthDefinition.js` (`birth-wizard-jp`).
3. **Housing**: `packages/core/src/japan/housing/rules/movingWizardDefinition.js` (`moving-wizard-jp`).

All three wizards share identical runtime contracts, zero cross-domain circular references, and 100% automated browser verification.

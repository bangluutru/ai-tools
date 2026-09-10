# JAPAN LIFE NAVIGATOR ARCHITECTURE SPECIFICATION (PHASE 9)
**Package**: `@ai-tools/core`  
**Namespace**: `packages/core/src/navigator/`  
**Date**: 2026-09-11  
**Status**: APPROVED ARCHITECTURE

---

## 1. Core Philosophy: Deterministic Navigator, NOT a Chatbot

A fundamental mistake in administrative and legal assistance tools is building an ungrounded conversational chatbot where a Large Language Model invents procedural answers.

In Toolio, the **Japan Life Navigator** is strictly:
```
User Query / Entry Selection
           ↓
    Intent Resolver (Multilingual NLP / Regex / Keyword Matching)
           ↓
    Life Situation Classification
           ↓
    Context Minimization (Asks ONLY what changes the legal outcome)
           ↓
    Deterministic Rules Engine (Statutory logic from Domain Owners)
           ↓
    Relevant Capabilities (Resolved via Semantic Capability Registry)
           ↓
    Prioritized Action Plan (Urgency, statutory deadlines, required documents)
           ↓
    Interactive Mini-apps / Official Procedures / Citations
```

### Strict Boundary on AI
If AI / LLM is integrated now or in the future:
- **AI Allowed Scope**: Free-text query parsing, language normalization, typo tolerance, human-friendly summary generation.
- **AI Forbidden Scope**: Must NEVER determine legal deadlines, calculate benefit sums, decide visa eligibility, or fabricate required document lists. All legal determinations MUST originate from deterministic regulatory code.

---

## 2. Directory Structure

```
packages/core/src/navigator/
├── intent/
│   ├── intentTaxonomy.js       # Canonical intent definitions and metadata
│   └── intentResolver.js       # Multilingual matcher, alias resolution, disambiguation
├── situations/
│   ├── situationRegistry.js    # Life situation catalogs and decision trees
│   └── situationMatcher.js     # Situation resolution from intent and context
├── capabilityGraph/
│   ├── capabilityMetadata.js   # Rich metadata for all 33 capabilities
│   └── capabilityGraph.js      # Cross-domain relationship traversal
├── context/
│   ├── navigatorContext.js     # Ephemeral context container and minimization rules
│   └── contextHandoff.js       # Safe URL/storage transfer with strict allowlists
├── recommendations/
│   ├── recommendationEngine.js # Rules evaluating next best actions
│   └── recommendationTypes.js  # Recommendation schemas, confidence types, priorities
├── ranking/
│   └── rankingEngine.js        # Deterministic scoring (urgency, freshness, relevance)
├── lifeEvents/
│   ├── startingLifeDefinition.js # Cross-domain Starting Life orchestration
│   ├── changingJobDefinition.js  # Cross-domain Changing Job orchestration
│   ├── familyJoiningDefinition.js# Cross-domain Family Joining orchestration
│   └── fragments/              # Reusable fragments (employment-exit, municipal-address)
├── tests/                      # Dedicated navigator test suite
└── index.js                    # Public API exports
```

---

## 3. Minimal NavigatorContext

To safeguard user privacy and prevent creepy data collection, Navigator enforces **Context Minimization**:
- We never ask questions whose answers would not alter the recommendation.
- We never collect: My Number digits, passport numbers, bank accounts, medical history, or exact monetary salaries upfront.

```typescript
interface NavigatorContext {
  country: 'JP';
  lifeSituation?: string;          // e.g. 'changing-job', 'newcomer', 'moving'
  municipalityCode?: string;       // 5-digit JIS code or name e.g. '13104' (Shinjuku)
  residenceStatus?: string;        // e.g. 'engineer_specialist', 'permanent_resident'
  employmentStatus?: string;       // e.g. 'employed', 'resigned', 'freelance', 'student'
  hasNewJobDecided?: boolean;      // For changing job flow
  hasChildren?: boolean;           // For child allowance / birth branching
  eventDates?: {
    arrivalDate?: string;          // ISO 'YYYY-MM-DD'
    resignationDate?: string;
    newJobStartDate?: string;
    moveDate?: string;
    birthDate?: string;
  };
}
```

---

## 4. Recommendation Contract

Every recommendation emitted by the Navigator conforms to a strict, typed contract:

```typescript
type ConfidenceType =
  | 'deterministic'             // Directly governed by statutory law
  | 'likely'                    // High probability under standard practice
  | 'conditional'               // Depends on pending user situation
  | 'administrative-review'     // Final discretion rests with government inspector
  | 'local-data-unverified';    // National rule known, municipality specific fee unverified

type ActionPriority =
  | 'urgent'                    // Imminent statutory deadline (< 14 days or penalties)
  | 'required'                  // Mandatory filing without immediate penalty
  | 'recommended'               // Financial savings or benefits available
  | 'optional'                  // Good practice
  | 'informational';            // Guidance only

type ActionTiming =
  | 'now'                       // Immediate action required
  | 'before-event'              // Advance preparation
  | 'on-event'                  // Day of event
  | 'after-event'               // Post-event deadline window
  | 'later';                    // Long term follow up

interface Recommendation {
  id: string;                   // Unique action ID
  titleI18n: { ja: string; vi: string; en: string };
  descriptionI18n: { ja: string; vi: string; en: string };
  capabilityId?: string;        // Semantic capability ID for deep linking
  procedureId?: string;         // Canonical Phase 8 procedure ID
  lifeEventId?: string;         // Canonical life event ID
  priority: ActionPriority;
  timing: ActionTiming;
  deadlineRule?: {
    anchorKey: string;
    offsetDays: number;
    direction: 'before' | 'after';
  };
  reasonCode: string;           // Machine-readable explanation e.g. 'IMMIGRATION_14DAY_AFFILIATION_NOTICE'
  jurisdiction: 'national' | 'municipality' | 'prefecture' | 'private-service';
  statutorySourceIds: string[]; // Legal citations e.g. ['immigration-control-act-19-16']
  confidenceType: ConfidenceType;
  requiredDocumentIds?: string[];// Phase 8 canonical document IDs
}
```

---

## 5. Architectural Quality Gates

1. **Gate 1 — Zero Business Rule Duplication**:
   Navigator never encodes tax brackets, pension formulas, visa points, or document fees. It queries domain engines or resolves capabilities.
2. **Gate 2 — No Direct Mini-App Imports**:
   Navigator never imports `JapanTaxSimulatorTool.jsx` or `ResidenceRenewalGuideView.jsx`. Routing is strictly mediated by the `CapabilityRegistry`.
3. **Gate 3 — No Event-Specific Hacks in Generic Runtime**:
   Generic runtime operates purely on declarative definitions and stage metadata. Zero `if (eventId === 'changing-job')` inside core runners.
4. **Gate 4 — Unidirectional Graph Dependencies**:
   `Navigator` $\to$ `CapabilityRegistry` $\to$ `MiniApps`. Domain engines never know that Navigator exists.

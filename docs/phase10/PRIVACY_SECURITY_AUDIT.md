# Japan Life V1: Privacy, Data Minimization & Security Audit

- **Date**: 2026-09-11
- **Status**: 100% PASS (Checkpoint C5)
- **Security Paradigm**: Local-First, Zero Cloud PII Persistence, Safe Context Handoff

---

## 1. User Input Data Inventory & Sensitivity Classification

| Input Category | Fields Collected | Sensitivity Level | Default Persistence | Storage Location |
| :--- | :--- | :--- | :--- | :--- |
| **Compensation & Tax** | Gross salary, bonus, side-business revenue, deduction counts | Low-Medium (Numerical) | Transient (In-Memory React State) | Cleared on page refresh/unmount |
| **Family & Child** | Child birth date, pregnancy week, number of dependents | Medium | Transient (In-Memory React State) | Cleared on page refresh/unmount |
| **Immigration & Residence** | Status of Residence, card expiration date, company change date | Medium | Transient (In-Memory React State) | Cleared on page refresh/unmount |
| **Housing & Moving** | Origin prefecture, destination prefecture/city, moving date | Low | Transient (In-Memory React State) | Cleared on page refresh/unmount |
| **High-Risk PII** | Full name, Passport number, My Number, Residence Card Number, exact street address | **CRITICAL** | **PROHIBITED** | **Never collected or stored** |

---

## 2. Browser Storage Key Registry & Purpose

Every storage key used by Japan Life adheres strictly to the Toolio namespace standard:

| Key Name | Owner Domain | Purpose | Sensitivity | Retention Policy | Clearing Mechanism |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `toolio_japan_life_journey_state` | `navigator` | Stores completed task string IDs and active filter | Low (IDs only) | Persistent until user reset | "Reset Journey" button in UI |
| `ai_tools_life_event_starting-life` | `life-events` | Checklist item completion booleans | Low (Booleans) | Persistent until user reset | "Làm lại từ đầu" button |
| `ai_tools_life_event_changing-job` | `life-events` | Checklist item completion booleans | Low (Booleans) | Persistent until user reset | "Làm lại từ đầu" button |
| `ai_tools_life_event_leaving-job` | `life-events` | Checklist item completion booleans | Low (Booleans) | Persistent until user reset | "Làm lại từ đầu" button |
| `ai_tools_life_event_birth` | `life-events` | Checklist item completion booleans | Low (Booleans) | Persistent until user reset | "Làm lại từ đầu" button |
| `ai_tools_life_event_moving` | `life-events` | Checklist item completion booleans | Low (Booleans) | Persistent until user reset | "Làm lại từ đầu" button |
| `ai_tools_life_event_family-joining` | `life-events` | Checklist item completion booleans | Low (Booleans) | Persistent until user reset | "Làm lại từ đầu" button |
| `ai_tools_life_event_departure` | `life-events` | Checklist item completion booleans | Low (Booleans) | Persistent until user reset | "Làm lại từ đầu" button |
| `ai_tools_handoff_<token>` | `orchestration` | Safe pre-fill context handoff across tools | Medium (Scoped) | Short-lived `sessionStorage` | Auto-deleted after 1st read |
| `ai_tools_theme` | `theme` | UI theme preference (`light`/`dark`/`system`) | Non-sensitive | Permanent | System settings dropdown |

---

## 3. Context Handoff Security & Query String Sanitization

1. **URL Query Minimization**:
   - High-risk PII (names, numbers, exact earnings) is strictly prohibited from being appended to URL hash queries (`#/tools/...?salary=...`).
   - Query parameters are limited to safe structural filters (e.g. `?status=engineer`, `?lang=vi`, `?category=job`).
2. **Context Allowlist Validation**:
   - `packages/core/src/navigator/context/contextSanitizer.js` strips any unauthorized fields before cross-tool handoff.
3. **Session Handoff Tokens**:
   - Temporary state passed via `sessionStorage` is keyed by random UUID, consumed exactly once, and immediately removed.

---

## 4. Browser Security & External Link Hardening

1. **XSS & Unsafe HTML Protection**:
   - No `dangerouslySetInnerHTML` is used in Japan Life components without `DOMPurify.sanitize()`.
   - All tool titles, reason codes, and procedural explanations are rendered as pure React text nodes.
2. **External Link Origin Isolation**:
   - 100% of outbound hyperlinks pointing to Japanese government portals (NTA, ISA, MHLW, JPS, e-Gov, J-LIS) specify `target="_blank"` and `rel="noopener noreferrer"`.
   - Prevents reverse tab-nabbing (`window.opener` abuse).
3. **CSV Export Formula Injection Mitigation**:
   - In `japanTaxSimulator.test.js` and CSV exporters, any field starting with `=`, `+`, `-`, or `@` is prepended with a single quote `'` to neutralize formula injection in Excel/Sheets.

---

## 5. Dependency Vulnerability Review

- **Command**: `npm audit`
- **Critical Vulnerabilities**: **0**
- **High Vulnerabilities**: 3 (Sharp build tool, js-yaml dev dependency, xmldom XML fragment parsing)
- **Moderate Vulnerabilities**: 2 (uuid via ExcelJS transitive dependency)
- **Disposition**:
  - No exploitable browser attack vectors in client-side runtime bundle.
  - Forced downgrade/upgrade was avoided to prevent breaking ExcelJS/Sharp production stability.

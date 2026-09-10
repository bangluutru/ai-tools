# JAPAN LIFE CONTEXT TRANSFER & PRIVACY POLICY (PHASE 9)
**Package**: `@ai-tools/core`  
**Namespace**: `packages/core/src/navigator/context/`  
**Date**: 2026-09-11  
**Status**: APPROVED SECURITY STANDARD

---

## 1. Principles of Safe Context Handoff

When a user transitions from the Japan Life Navigator or a Life Event Wizard into a specialized mini-app (e.g., from *Changing Job* to *Affiliation Change Checker*):
1. **Zero Data Leakage via URL**: Never serialize sensitive fields (My Number digits, passport numbers, detailed salary figures, medical history) into URL search params or hash routes.
2. **Capability-Declared Allowlist**: Mini-apps explicitly declare `acceptedContextFields`. The Navigator strictly filters the payload to include ONLY fields that the target capability explicitly requested.
3. **Ephemeral In-Memory / Session Transfer**: Context handoffs use an ephemeral browser session store with short-lived UUID tokens (`ai_tools_handoff_<id>`) that expire upon consumption or 15 minutes of inactivity.
4. **Transparent User Control**: The user can reset their journey context at any time via a single-click "Xóa bộ nhớ tạm / Reset Journey" action.

---

## 2. Capability Context Allowlists

| Capability ID | Target Mini-App | Allowed Context Fields | Forbidden Fields (Must Never Transfer) |
|---|---|---|---|
| `immigration.affiliationChange.check` | `affiliation-change-checker-jp` | `residenceStatus`, `resignationDate`, `newJobStartDate` | Full employer name, salary, My Number |
| `immigration.residenceRenewal.guide` | `residence-renewal-guide-jp` | `residenceStatus`, `visaExpirationDate` | Passport number, tax amounts |
| `family.childAllowance.calculate` | `child-allowance-jp` | `childBirthDate`, `childrenCount`, `municipalityCode` | Parent's exact salary, child's full name |
| `housing.moving.admin.check` | `moving-admin-checker-jp` | `oldMunicipalityCode`, `newMunicipalityCode`, `moveDate` | Exact street address, apartment unit number |
| `employment.unemployment.benefit` | `unemployment-benefit-jp` | `resignationDate`, `insuredMonths`, `resignationReason` | Bank account, company tax code |
| `documents.certificate.guide` | `certificate-acquisition-guide-jp` | `municipalityCode`, `hasMyNumberCard` | My Number 12-digit number, PIN code |

---

## 3. Handoff Protocol Flow

```
Navigator Context (InMemory)
       │
       ▼ [Filter through Capability Allowlist]
Clean Minimal Payload
       │
       ▼ [Store in sessionStorage: ai_tools_handoff_<token>]
Generate Short-lived Token (UUID)
       │
       ▼ [Redirect to Hash Route]
#/target-miniapp?handoffToken=<token>
       │
       ▼ [Target tool consumes & deletes token from sessionStorage]
Initial Form State Pre-populated
```

- If `handoffToken` is missing or invalid: The target tool falls back seamlessly to default empty state with zero errors.
- If user refreshes the page: The target tool retains its local component state without re-querying the spent token.

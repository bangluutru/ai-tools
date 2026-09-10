# PHASE 8 DETAILED IMPLEMENTATION PLAN
**Domain**: Japan Life → Administrative Procedures & Documents / 行政手続・証明書  
**Status**: APPROVED & READY FOR EXECUTION  
**Version**: 1.0.0  
**Target Milestone**: Phase 8 Complete  

---

## 1. Executive Context & Vision

Phase 8 completes a critical missing pillar in Toolio: **a unified, decoupled, authoritative shared procedure and document layer**.

Foreign residents and Japanese citizens frequently face administrative confusion:
- *Tôi cần giấy gì?* (Which documents do I need?)
- *Giấy này lấy ở đâu?* (Where do I obtain this document?)
- *Có lấy online được không?* (Can I get it online?)
- *Có lấy ở コンビニ được không?* (Can I get it at a convenience store?)
- *Cần giấy bản gốc hay bản sao?* (Is original or copy required?)
- *Giấy phải còn hiệu lực bao lâu?* (How fresh must the document be?)
- *Cơ quan nào cấp?* (Which authority issues it?)
- *Thủ tục nào cần giấy này?* (Which procedures require this document?)

Instead of scattering disconnected how-to guides across different pages, Phase 8 creates **single-source-of-truth registries and resolvers** that power 6 dedicated mini-apps while establishing cross-domain links with Immigration, Tax, Family, Employment, and Moving life events.

---

## 2. Core Architectural Pillars

### 2.1. Strict Separation of Three Entities
1. **`DocumentDefinition`**: The canonical identity of an official document (e.g. `document.resident-record-copy`, `document.taxation-certificate`). Has no intrinsic "3-month validity".
2. **`DocumentRequirement`**: Contextual requirement imposed by a specific procedure on a document (e.g. maxAgeMonths = 3, original_only, previous_fiscal_year).
3. **`ProcedureDefinition`**: Canonical administrative procedure (e.g. `procedure.residence-status-renewal`, `procedure.child-allowance-claim`) owning eligibility, deadlines, and requirements.

### 2.2. Locality & Channel Realities
- Multiple acquisition channels modeled: Counter, Convenience Store (コンビニ), Online (マイナポータル), Mail (郵送), Employer, Tax Office.
- J-LIS convenience store availability is municipality-dependent.
- Locality strategy: Tier 1 (Verified), Tier 2 (Partially-supported), Tier 3 (Unverified fallback).
- **Rule**: Never say "service unavailable" merely because locality is unverified. Show national standard with disclaimer.

### 2.3. Boundaries & Anti-Goals
- **NO** automatic government submission.
- **NO** JPKI digital signing or PIN automation.
- **NO** scraping or storing My Number credentials or user PINs.
- **NO** generic OCR guessing of random PDFs.
- **NO** business logic duplication from other domains (e.g., immigration eligibility stays in immigration domain).

---

## 3. Milestone Breakdown (M1 — M8)

### Milestone 1: Document & Procedure Foundation (M1)
**Goal**: Establish the core shared architecture in `packages/core/src/documents/`.
- **Files to Create**:
  - `packages/core/src/documents/registry/documentRegistry.js`: Canonical definitions of all 16+ core Japanese documents.
  - `packages/core/src/documents/registry/procedureRegistry.js`: Canonical procedures across Immigration, Municipal/Family, Moving, Tax, and Employment.
  - `packages/core/src/documents/requirements/requirementRegistry.js`: Contextual DocumentRequirement bindings.
  - `packages/core/src/documents/acquisition/acquisitionChannels.js`: Channel schemas, standard operating windows, prerequisites.
  - `packages/core/src/documents/acquisition/localityRegistry.js`: Municipalities database (Tokyo 23 wards, Osaka, Nagoya, etc.) with verified kiosk support.
  - `packages/core/src/documents/resolvers/documentResolver.js`: Query documents by ID, alias, category, issuer.
  - `packages/core/src/documents/resolvers/procedureRequirementResolver.js`: Resolve all requirements for a procedure with conditions and freshness.
  - `packages/core/src/documents/resolvers/acquisitionResolver.js`: Resolve where and how to get a document based on municipality and user context.
  - `packages/core/src/documents/index.js`: Clean public barrel export.
- **Verification**: `packages/core/tests/documents-foundation.test.js`.
- **Checkpoint**: `phase8-document-foundation-pass` (C2).

---

### Milestone 2: Document Finder (`document-finder-jp`) (M2)
**Goal**: "Tôi cần giấy gì?" — Search by administrative procedure or user intent to get the exact, grouped checklist of required documents.
- **Features**:
  - Catalog-driven intent & procedure selector (Immigration renewal, Permanent residence, Child allowance, Moving, Resignation, etc.).
  - Deterministic requirement resolution (Grouped into: 必須 Mandatory, 条件付き Conditional, 該当する場合のみ If Applicable).
  - Detailed breakdown per document: Freshness rule (e.g. 3 months), original vs copy, issuing authority, channel icons (Counter / Konbini / Online).
  - Deep links to Life Event wizards and Official Form Helper.
- **Files**:
  - `packages/core/src/documents/finders/documentFinderEngine.js`
  - `hub/src/pages/DocumentFinderJp.jsx`
  - Integration in `hub/src/config/tools.js`, `hub/src/config/toolIcons.js`, `hub/src/App.jsx`.
- **Checkpoint**: `phase8-document-finder-pass` (C3).

---

### Milestone 3: Certificate Acquisition Guide (`certificate-acquisition-guide-jp`) (M3)
**Goal**: "Giấy này lấy ở đâu?" — Inverse flow of M2. For any specific certificate, show exactly where, how, and what prerequisites are required.
- **Features**:
  - Contextual resolution: Current address vs Registered domicile (本籍地) vs January 1 tax address.
  - Channels breakdown:
    - Counter (窓口): Location, required ID, seal, application form.
    - Convenience store (コンビニ交付): Kiosk steps, PIN type (4-digit User Auth), fee discounts, operating hours (06:30–23:00).
    - Online / MynaPortal: Requirements (Signature certificate, smartphone reader or PC reader).
    - Mail request (郵送請求): Envelope, fixed postal money order (定額小為替), return postage stamps.
  - Municipality selector with verified overrides and graceful fallback for unverified towns.
  - Clear explanations for difficult certificates: `住民票の写し`, `戸籍全部事項証明書`, `課税証明書` vs `納税証明書`, `印鑑登録証明書`, `源泉徴収票`.
- **Files**:
  - `packages/core/src/documents/acquisition/certificateGuideEngine.js`
  - `hub/src/pages/CertificateAcquisitionGuideJp.jsx`
- **Checkpoint**: `phase8-certificate-guide-pass` (C4).

---

### Milestone 4: My Number Procedure Guide (`mynumber-procedure-guide-jp`) (M4)
**Goal**: Comprehensive guide to My Number Card lifecycle, electronic certificates, and PIN management.
- **Features**:
  - Distinguishes Card Expiry (every 10 years / 5 years for minors or visa term) vs Electronic Certificate Expiry (every 5 years).
  - Differentiates `署名用電子証明書` (6-16 alphanumeric PIN, auto-invalidated on moving/name change) vs `利用者証明用電子証明書` (4-digit PIN).
  - Step-by-step guidance for key use cases:
    1. Card application (newcomers)
    2. Card renewal upon visa extension (Crucial for foreigners: card must be extended BEFORE visa expires!)
    3. Certificate renewal (municipal counter)
    4. PIN reset / lockout recovery (Counter or kiosk/smartphone service)
    5. Lost/stolen card: Urgent 24/7 call center number & suspension procedure
    6. Moving / Address update on chip & card surface (within 14 days)
    7. Smartphone My Number (iPhone / Android capabilities and limitations).
- **Files**:
  - `packages/core/src/documents/mynumber/mynumberGuideEngine.js`
  - `hub/src/pages/MyNumberProcedureGuideJp.jsx`
- **Checkpoint**: `phase8-mynumber-guide-pass` (C5).

---

### Milestone 5: Official Form Helper (`official-form-helper-jp`) (M5)
**Goal**: Interactive field explanation and client-side draft preparation for verified government forms.
- **Features**:
  - Form catalog: ISA Extension of Stay (`form.isa.extension-of-stay`), Municipal Child Allowance (`form.muni.child-allowance-claim`), Moving Address Change (`form.muni.change-of-address`), Residence Record Request (`form.muni.resident-record-request`).
  - Section & field breakdown: Japanese label, plain language explanation in VI/EN/JA, format requirements, examples.
  - Interactive client-side draft preview: User can test typing their details to see how they map to the form fields.
  - Privacy safeguards: Client-side in-memory only, no remote transmission, clear reset button.
  - Direct download links to official Ministry/Agency PDF files.
- **Files**:
  - `packages/core/src/documents/forms/officialFormsRegistry.js`
  - `packages/core/src/documents/forms/formHelperEngine.js`
  - `hub/src/pages/OfficialFormHelperJp.jsx`
- **Checkpoint**: `phase8-form-helper-pass` (C6).

---

### Milestone 6: Procedure Requirement Checker (`procedure-requirement-checker-jp`) (M6)
**Goal**: "Tôi đã chuẩn bị đủ chưa?" — Self-assessment checklist measuring readiness across 3 dimensions.
- **Features**:
  - Three readiness dimensions:
    1. **Procedure Prerequisites**: Timing (e.g., within 3 months before visa expiry, within 14 days of moving), eligibility gate.
    2. **Documents Readiness**: Interactive checklist of required documents with freshness validation (issue date within maxAgeMonths), original/copy verification, conditional item toggles.
    3. **Submission Readiness**: Submission method selection, fee preparation (revenue stamps / cash / cashless), office hours or online portal link.
  - Readiness Score & Actionable Gap Summary.
  - Domain handoff links (e.g. to Residence Renewal Guide or Moving Wizard).
- **Files**:
  - `packages/core/src/documents/checkers/procedureCheckerEngine.js`
  - `hub/src/pages/ProcedureRequirementCheckerJp.jsx`
- **Checkpoint**: `phase8-procedure-checker-pass` (C7).

---

### Milestone 7: Administrative Navigator (`administrative-navigator-jp`) (M7)
**Goal**: Intelligent search, alias matching, and navigation hub for administrative documents and procedures.
- **Features**:
  - Multilingual fuzzy & alias search index (Japanese kanji/kana, Vietnamese transliteration/terms, English).
  - Intent classification & disambiguation cards:
    - e.g. Query "thuế" $\to$ Prompts: "Chứng nhận mức thuế đã nộp (納税証明書)" vs "Chứng nhận thu nhập/tính thuế (課税証明書)" vs "Phiếu khấu trừ từ công ty (源泉徴収票)".
  - Quick action paths: "Cần lấy giấy tờ", "Cần làm thủ tục", "Vấn đề về thẻ My Number", "Điền mẫu đơn".
  - Deep links to all Phase 8 tools and related domains.
- **Files**:
  - `packages/core/src/documents/search/adminSearchEngine.js`
  - `hub/src/pages/AdministrativeNavigatorJp.jsx`
- **Checkpoint**: `phase8-admin-navigator-pass` (C8).

---

### Milestone 8: Integration, Life Event Wire-up, Regression & Final Report (M8)
**Goal**: Complete ecosystem integration, capability registrations, full test suite pass, production build, browser verification, and final report.
- **Features**:
  - Register all 6 new tools in `hub/src/config/tools.js` under the `procedures-documents` category / Japan Life group.
  - Update `hub/src/config/toolIcons.js` with modern lucide-react icons.
  - Wire capabilities in `packages/core/src/life-events/` so existing Life Events (Moving, Leaving Job, Birth, Arrival) reference Document capabilities via Capability Registry.
  - Update Hub search index and navigation.
  - Run full test suite: Core tests, Hub tests, `audit:miniapps`, production bundle build (`npm run build`).
  - Browser verification across Desktop, Mobile, Dark/Light modes.
  - Compile `docs/PHASE_08_JAPAN_ADMIN_DOCUMENTS_REPORT.md`.
- **Checkpoint**: `phase8-final-pass` (C9).

---

## 4. Checkpoint Strategy

| Checkpoint Tag | Milestone | Trigger Criteria |
| :--- | :--- | :--- |
| `pre-phase8` | C0 Baseline | Clean git main branch prior to Phase 8 changes |
| `phase8-audit-plan-pass` | C1 Audit & Plan Gate | Audit doc, foundation spec, locality strategy, form policy, plan approved |
| `phase8-document-foundation-pass` | C2 Foundation (M1) | Core registry, resolvers, unit tests passing |
| `phase8-document-finder-pass` | C3 Finder (M2) | `document-finder-jp` component, engine, tests passing |
| `phase8-certificate-guide-pass` | C4 Certificate Guide (M3) | `certificate-acquisition-guide-jp` component, engine, tests passing |
| `phase8-mynumber-guide-pass` | C5 My Number Guide (M4) | `mynumber-procedure-guide-jp` component, engine, tests passing |
| `phase8-form-helper-pass` | C6 Form Helper (M5) | `official-form-helper-jp` component, engine, tests passing |
| `phase8-procedure-checker-pass` | C7 Checker (M6) | `procedure-requirement-checker-jp` component, engine, tests passing |
| `phase8-admin-navigator-pass` | C8 Navigator (M7) | `administrative-navigator-jp` component, engine, tests passing |
| `phase8-final-pass` | C9 Final Delivery (M8) | All tests, build, browser, regression passing; comprehensive report created |

---

## 5. Verification & Testing Strategy

1. **Unit Tests**:
   - `packages/core/tests/documents-foundation.test.js`: Validates canonical document resolution, alias lookups, procedure requirement binding, freshness calculation, channel resolution, municipality overrides, unverified locality fallback.
   - `packages/core/tests/documents-search.test.js`: Validates multilingual search (JA, VI, EN), disambiguation logic.
2. **Negative Tests**:
   - Verify that `住民票` definition does NOT contain hardcoded `maxAgeMonths: 3`.
   - Verify that `戸籍謄本` resolution properly identifies registered domicile requirement.
   - Verify that unverified municipalities return fallback guidance, never false "unavailable".
   - Verify that Gensen Choshuhyo issuer is `employer`, never `tax_office`.
3. **Regression Tests**:
   - Run existing core test suites (Tax, Insurance, Employment, Family, Moving, Immigration). Zero regressions tolerated.
   - Run `npm run test:hub`.
   - Run `npm run audit:miniapps`.
   - Run `npm run build` for production bundle correctness.
4. **Browser Tests**:
   - Direct route navigation to all 6 new tools.
   - Light and dark theme toggle visual verification.
   - Mobile and desktop viewport responsiveness.

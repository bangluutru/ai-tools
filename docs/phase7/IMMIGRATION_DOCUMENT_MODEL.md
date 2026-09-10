# IMMIGRATION DOCUMENT CHECKLIST DATA MODEL SPECIFICATION

**Domain**: Japan Life → Residence & Immigration / 在留・入管  
**Purpose**: Define the structured document contract for immigration procedures (M2 Renewal, M4 Status Change, M5 Family, M6 PR, M7 Arrival, M8 Leaving), laying a standardized foundation for future document automation in Phase 8.

---

## 1. Document Schema Contract (`ImmigrationDocumentItem`)

Documents must not be represented as primitive string arrays. Every document requirement is a structured, verifiable data item conforming to the following JSDoc schema:

```javascript
/**
 * @typedef {'original' | 'copy' | 'original-and-copy' | 'certified-copy'} DocumentOriginality
 * @typedef {'within-3-months' | 'within-6-months' | 'valid-at-application' | 'none'} DocumentValidityRule
 * @typedef {'online-pdf' | 'counter-paper' | 'postal-request' | 'convenience-store-my-number'} IssuanceChannel
 *
 * @typedef {Object} ImmigrationDocumentItem
 * @property {string} id - Unique document identifier (e.g., 'doc-application-form-renewal-gijinkoku')
 * @property {string} titleJa - Official Japanese document name
 * @property {string} titleVi - Vietnamese description / translation
 * @property {string} titleEn - English description / translation
 * @property {string} [descriptionJa] - Detailed submission notes in Japanese
 * @property {string} [descriptionVi] - Detailed submission notes in Vietnamese
 * @property {string} [descriptionEn] - Detailed submission notes in English
 * @property {string} issuingAuthority - Authority or entity issuing the document (e.g. '出入国在留管理庁', '市区町村役場', '勤務先企業', '国税局・税務署')
 * @property {DocumentOriginality} originalOrCopy - Original or photocopy requirement
 * @property {DocumentValidityRule} validityRule - Statutory freshness requirement (e.g. certificates must be issued within 3 months)
 * @property {IssuanceChannel[]} [issuanceChannels] - How the user can acquire the document
 * @property {string} [officialFormUrl] - Direct URL to official ISA/MOJ downloadable PDF/Excel form
 * @property {string} [sourceId] - Reference in OfficialSourceRegistry
 * @property {Object} [effectivePeriod] - Temporal applicability { type, from, to }
 * @property {(context: Object) => boolean} [requiredWhen] - Predicate determining whether this document is mandatory given context
 * @property {boolean} [isOptionalOrConditional] - Whether document is optional/conditional supporting evidence
 */
```

---

## 2. Canonical Document Categories in Japan Immigration

| Category ID | Category Name (JA / VI / EN) | Typical Issuing Authority | Common Examples |
|---|---|---|---|
| `application-forms` | 申請書様式 / Đơn đăng ký theo mẫu / Application Forms | 出入国在留管理庁 (ISA) | 在留期間更新許可申請書, 在留資格変更許可申請書, 永住許可申請書 |
| `identity-travel` | 身分証明・渡航文書 / Hộ chiếu & Thẻ / Identity & Travel | 本人・政府 / User & State | パスポート (Passport), 在留カード (Residence Card) |
| `civil-status` | 身分関係立証書類 / Giấy tờ hộ tịch, thân nhân / Civil Status | 市区町村役場 / Đại sứ quán | 住民票（世帯全員）, 戸籍謄本, 婚姻証明書, 出生証明書 |
| `tax-income` | 納税・所得立証資料 / Chứng nhận thuế & thu nhập / Tax & Income | 市区町村役場 / 税務署 | 住民税の課税・非課税証明書, 納税証明書, 源泉徴収票, 確定申告書控 |
| `pension-insurance`| 年金・公的医療保険 / Lương hưu & BHYT / Pension & Insurance | 日本年金機構 / 健康保険組合 | ねんきん定期便, 国民年金保険料領収証書, 健康保険証（写し） |
| `employer-sponsor` | 所属機関・身元保証 / Giấy tờ cơ quan & bảo lãnh / Employer & Sponsor | 勤務先企業 / 身元保証人 | 在職証明書, 法人登記簿謄本, 決算文書（写し）, 身元保証書 |
| `rationale-personal`| 理由書・誓約書 / Đơn giải trình & Cam kết / Personal Statements | 本人・代理人 / Applicant | 理由書 (Statement of Reason), 了解書 (Understanding Confirmation) |

---

## 3. Standard Photo Specifications (Effective 2026-06-14)

```javascript
export const IMMIGRATION_PHOTO_SPECIFICATION = Object.freeze({
  widthMm: 30,
  heightMm: 40,
  maxAgeMonths: 3,
  background: 'plain-light-colorless',
  aspectRatio: '3:4',
  rules: {
    under1YearOld: {
      exempt: true,
      effectiveFrom: '2026-06-14',
      notes: 'For residence cards issued on or after June 14, 2026, infants under 1 year are exempt from submitting a photo.'
    },
    age1AndAbove: {
      exempt: false,
      notes: 'Applicants aged 1 year and older must submit one compliant photograph.'
    }
  }
});
```

---

## 4. Phase 7 Scope Boundaries
- **IN SCOPE**:
  - Dynamically determining required document checklists based on residence status, employer category (Category 1 to 4 under ISA classification), and personal circumstances.
  - Specifying issuing authority, freshness rules (e.g. within 3 months for certificates), and original vs copy.
  - Deep-linking official ISA download links for application forms.
- **OUT OF SCOPE (Deferred to Phase 8)**:
  - Form autofill or automatic PDF generation of official government forms.
  - Electronic submission via JPKI/Mynaportal API.

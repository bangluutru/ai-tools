# OFFICIAL FORM VERSIONING & PRIVACY POLICY
**Domain**: Japan Life → Administrative Procedures & Documents / 行政手続・証明書  
**Status**: APPROVED  
**Version**: 1.0.0 (Phase 8)  

---

## 1. Objectives & Boundaries

The **Official Form Helper (公的フォームヘルパー)** solves a ubiquitous pain point for foreign residents in Japan:
*Official government application forms (PDFs) are often complex, filled with bureaucratic Japanese terms, and confusing regarding which boxes must be checked and what format is required.*

### What Form Helper DOES:
- Identifies officially registered and verified government forms.
- Provides field-by-field guidance (Japanese label, plain language explanation in VI/EN/JA, format requirements, examples).
- Previews sample values or user-entered draft values in a clear, interactive visual guide.
- Highlights conditional fields (e.g. "Only fill if you have dependents in Japan").

### What Form Helper STRICTLY DOES NOT DO:
- **No generic OCR of arbitrary PDFs**: Does not attempt to guess field meanings from unknown scanned documents. Only verified, cataloged schemas are supported.
- **No digital signing or JPKI automation**: Does not sign documents on behalf of the user.
- **No automatic government submission**: The user retains complete agency to print, review, sign, and submit the official form themselves.
- **No server-side persistence of sensitive data**: All draft inputs stay in client-side memory or transient session storage.

---

## 2. Form Schema Definition

```typescript
export interface OfficialFormField {
  id: string; // e.g., 'applicant_full_name'
  labelJa: string; // e.g., '氏名（ローマ字及び漢字）'
  meaningI18n: {
    ja: string;
    vi: string;
    en: string;
  };
  inputType: 'text' | 'date' | 'select' | 'radio' | 'checkbox' | 'number';
  format?: string; // e.g., 'YYYY-MM-DD', 'Alphabet Uppercase as on Passport'
  example?: string; // e.g., 'NGUYEN VAN A'
  requiredWhen: 'always' | 'conditional';
  conditionSummaryI18n?: {
    ja: string;
    vi: string;
    en: string;
  };
  isSensitive: boolean; // Flag to indicate personal/sensitive data (e.g. My Number, Income)
  options?: { value: string; labelJa: string; labelI18n?: { vi: string; en: string } }[];
}

export interface OfficialFormDefinition {
  id: string; // e.g., 'form.isa.extension-of-stay'
  procedureId: string; // Reference to ProcedureDefinition
  authority: {
    type: string;
    nameJa: string;
  };
  formNameJa: string; // e.g., '在留期間更新許可申請書'
  formNameI18n: {
    ja: string;
    vi: string;
    en: string;
  };
  version: string; // Semantic or official revision date, e.g. '2024.04-rev'
  effectivePeriod: {
    validFrom: string; // ISO Date '2024-04-01'
    validTo?: string;   // ISO Date or undefined for indefinite
  };
  officialPdfDownloadUrl: string; // Direct link to official Ministry / Agency PDF
  lastVerifiedAt: string; // ISO Date
  officialSourceId: string; // Registered in OfficialSourceRegistry
  sections: {
    sectionId: string;
    titleJa: string;
    titleI18n: { ja: string; vi: string; en: string };
    fields: OfficialFormField[];
  }[];
}
```

---

## 3. Form Versioning Policy

1. **Government Form Changes**:
   - Ministries (Immigration Services Agency, Ministry of Health, Labour and Welfare, Digital Agency) periodically revise administrative forms (e.g. due to statutory amendments or digitization updates).
2. **Version Tracking**:
   - Every registered form must declare `version`, `effectivePeriod.validFrom`, and `lastVerifiedAt`.
   - If a form version expires (`validTo` is past current date), the UI displays a clear notice:
     > *"Mẫu đơn này có thể đã được cập nhật bởi cơ quan chức năng. Vui lòng kiểm tra liên kết chính thức để tải bản mới nhất."*
     > *"This form may have been updated by the authorities. Please check the official link for the latest revision."*
3. **Immutability of Form Identifiers**:
   - Canonical form IDs (`form.isa.extension-of-stay`) remain stable; historical versions are maintained via version tags if required.

---

## 4. Privacy & Data Handling Rules

1. **Browser-First / Zero Backend Storage**:
   - When a user inputs their draft values into the form helper, the data is processed **strictly in-browser**.
   - No form draft payload is transmitted to any analytics service, remote database, or third-party API.
2. **Clear Memory on Exit**:
   - Users are provided with an explicit "Xóa bản nháp / Reset Form" button.
   - Closing the browser tab or navigating away automatically purges in-memory draft inputs.
3. **Sensitive Field Masking**:
   - Fields flagged with `isSensitive: true` (e.g., residence card number, date of birth) have obfuscation toggles in the draft preview UI.

---

## 5. Initial Registered Forms in Phase 8

1. **`form.isa.extension-of-stay` (在留期間更新許可申請書)**:
   - Authority: Immigration Services Agency (出入国在留管理局)
   - Procedures: General employment visa extension (Engineer/Specialist in Humanities/International Services).
   - Key Sections: Applicant information, Organization/employer information, Status history.
2. **`form.muni.child-allowance-claim` (児童手当認定請求書)**:
   - Authority: Municipal Office (市区町村)
   - Procedures: Child Allowance claim following birth or relocation.
   - Key Sections: Claimant information, Child/dependent list, Bank account details.
3. **`form.muni.change-of-address` (住民異動届 / 転入・転出・転居届)**:
   - Authority: Municipal Office (市区町村)
   - Procedures: Moving in (転入), Moving out (転出), Changing address within municipality (転居).
   - Key Sections: New address, Former address, Household members, Head of household.
4. **`form.muni.resident-record-request` (住民票の写し等交付請求書)**:
   - Authority: Municipal Office (市区町村)
   - Procedures: In-person or mail counter request for Jūminhyō.
   - Key Sections: Requester identity, Person whose record is requested, Relationship, Mandatory inclusion toggles (続柄, 在留資格等).

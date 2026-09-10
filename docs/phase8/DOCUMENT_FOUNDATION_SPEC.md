# DOCUMENT & PROCEDURE FOUNDATION SPECIFICATION
**Domain**: Japan Life → Administrative Procedures & Documents / 行政手続・証明書  
**Status**: DRAFT → APPROVED FOR IMPLEMENTATION  
**Version**: 1.0.0 (Phase 8)  
**Author**: Toolio Architecture Team  

---

## 1. Executive Summary & Core Principle

In Japanese administrative life, foreigners and residents frequently ask:
- *Tôi cần giấy gì?* (What documents do I need?)
- *Giấy này lấy ở đâu?* (Where do I obtain this document?)
- *Có lấy online được không?* (Can I get it online?)
- *Có lấy ở コンビニ (convenience store) được không?* (Can I get it at a convenience store?)
- *Cần giấy bản gốc hay bản sao?* (Is original or copy required?)
- *Giấy phải còn hiệu lực bao lâu?* (How fresh must the document be?)
- *Cơ quan nào cấp?* (Which authority issues it?)
- *Thủ tục nào cần giấy này?* (Which procedures require this document?)

To answer these questions deterministically and without confusing generalizations, Toolio Phase 8 establishes a **strict 3-entity decoupled architecture**:
1. **`DocumentDefinition`**: Canonical identity of an official document. Independent of procedures and independent of specific validity periods.
2. **`DocumentRequirement`**: Contextual requirement imposed by a specific administrative procedure onto a Document (e.g., must be issued within 3 months, original required, for specific tax fiscal year).
3. **`ProcedureDefinition`**: Administrative procedure itself (e.g., Residence Renewal, Child Allowance, Moving Out Notice), owning eligibility, trigger, deadline, submission methods, and the list of DocumentRequirements.

```
┌─────────────────────────────────────────────────────────────┐
│                    ProcedureDefinition                      │
│ (e.g., procedure.residence-status-renewal)                 │
│ - id, domain, authority, jurisdiction, deadlines, channels  │
└──────────────────────────────┬──────────────────────────────┘
                               │ requires (1..n)
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                    DocumentRequirement                      │
│ (e.g., req.residence-renewal.taxation-cert)                │
│ - required: true | conditional                              │
│ - maxAgeMonths: 3 (Freshness belongs HERE, NOT on document) │
│ - originalOrCopy: 'original'                                │
│ - specificFiscalYear: 'previous_year'                       │
│ - notes & exclusions                                        │
└──────────────────────────────┬──────────────────────────────┘
                               │ targets (1)
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                    DocumentDefinition                       │
│ (e.g., document.taxation-certificate)                       │
│ - canonicalNameJa: 課税証明書                                │
│ - issuerType: 'municipal_office' (Taxing Municipality)      │
│ - sensitivity: 'sensitive_identifying'                      │
│ - acquisitionCapabilities: [counter, konbini, online, mail] │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. Core Entity Schemas

### 2.1. DocumentDefinition
Canonical representation of an official record, certificate, or credential.

```typescript
export interface DocumentDefinition {
  /** Canonical ID in kebab-case, prefixed with document. */
  id: string; // e.g., 'document.resident-record-copy'
  
  /** Official Japanese title */
  canonicalNameJa: string; // e.g., '住民票の写し'
  
  /** Multilingual human-readable names */
  nameI18n: {
    ja: string;
    vi: string;
    en: string;
  };
  
  /** Common search aliases and historical terms */
  aliases: string[]; // e.g., ['住民票', 'じゅうみんひょう', 'resident certificate', 'giay cu tru']
  
  /** Document category */
  category: 
    | 'identity_residence'      // 住民票, マイナンバーカード, 在留カード, 旅券
    | 'family_register'          // 戸籍全部事項証明書, 戸籍抄本, 附票
    | 'tax_income'               // 課税証明書, 納税証明書, 源泉徴収票
    | 'employment_labor'         // 在職証明書, 離職票, 雇用保険被保険者証
    | 'civil_registration'       // 印鑑登録証明書, 受理証明書
    | 'social_insurance_pension' // 年金定期便, 保険証/資格確認書
    | 'other';

  /** Issuing authority type */
  issuerType: 
    | 'municipal_current_residence' // 市区町村（現住所）
    | 'municipal_registered_domicile' // 市区町村（本籍地）
    | 'municipal_tax_residence'      // 市区町村（1月1日時点の住所地）
    | 'national_tax_office'          // 税務署 (National Tax Agency)
    | 'immigration_agency'           // 出入国在留管理局 (ISA)
    | 'public_employment_office'     // ハローワーク (Hello Work)
    | 'pension_service'              // 日本年金機構 (Japan Pension Service)
    | 'employer'                     // 勤務先 / 雇用主
    | 'foreign_embassy_consulate'    // 在日外国大使館・領事館
    | 'legal_affairs_bureau';        // 法務局

  /** Sensitivity tier */
  sensitivity: 
    | 'public_metadata'      // Non-sensitive information
    | 'personal'             // Basic personal details
    | 'sensitive_identifying'// Tax income, detailed addresses, family relations
    | 'highly_sensitive';    // My Number itself, PINs, biological data

  /** Primary statutory basis */
  statutoryBasis?: {
    lawJa: string; // e.g. '住民基本台帳法 第12条'
    lawEn?: string;
  };

  /** Default acquisition capabilities across channels */
  acquisitionChannels: AcquisitionChannelSupport[];

  /** Official source reference ID in OfficialSourceRegistry */
  officialSourceId: string;
}
```

### 2.2. DocumentRequirement
Contextual conditions binding a document to a procedure.

```typescript
export interface DocumentRequirement {
  /** Unique ID for the requirement */
  id: string; // e.g. 'req.immigration-renewal.taxation-cert'

  /** Procedure that imposes this requirement */
  procedureId: string; // e.g. 'procedure.residence-status-renewal'

  /** Target canonical document ID */
  documentId: string; // e.g. 'document.taxation-certificate'

  /** Requirement necessity */
  necessity: 'mandatory' | 'conditional' | 'optional' | 'if_applicable';

  /** Plain text / i18n condition explaining when it is needed */
  conditionSummaryI18n?: {
    ja: string;
    vi: string;
    en: string;
  };

  /** Maximum age in months from issuance date. NULL if procedure has no expiry rule. */
  maxAgeMonths: number | null; // e.g. 3 for ISA applications, null for historical diplomas

  /** Original or copy allowed */
  originalOrCopy: 'original_only' | 'copy_acceptable' | 'original_and_copy' | 'electronic_submission';

  /** Number of copies required */
  copiesCount: number;

  /** Mandatory included fields */
  requiredFieldsJa?: string[]; // e.g. ['世帯主・続柄記載', '本籍・筆頭者省略', 'マイナンバー記載なし']

  /** Prohibited fields */
  prohibitedFieldsJa?: string[]; // e.g. ['マイナンバーの記載がないもの（厳禁）']

  /** Tax fiscal year specification (for tax documents) */
  fiscalYearRule?: 
    | 'latest_completed_year' 
    | 'past_3_years' 
    | 'past_5_years' 
    | 'current_residence_period'
    | 'none';

  /** Official note or caution */
  cautionNoteI18n?: {
    ja: string;
    vi: string;
    en: string;
  };
}
```

### 2.3. ProcedureDefinition
Canonical representation of an administrative procedure.

```typescript
export interface ProcedureDefinition {
  /** Unique ID in kebab-case, prefixed with procedure. */
  id: string; // e.g. 'procedure.child-allowance-claim'

  /** Country code */
  country: 'JP';

  /** Domain ownership */
  domain: 'immigration' | 'tax' | 'family' | 'moving' | 'employment' | 'general_admin';

  /** Canonical Japanese title */
  titleJa: string; // e.g. '児童手当の受給資格及び児童手当の額についての認定請求'

  /** Multilingual titles */
  titleI18n: {
    ja: string;
    vi: string;
    en: string;
  };

  /** Responsible official authority */
  authority: {
    type: string; // 'municipal_office' | 'immigration_bureau' | 'tax_office'
    nameJa: string; // '市区町村役場 子ども家庭課'
  };

  /** Trigger event */
  triggerEventJa: string; // '子どもが生まれたとき、他の市区町村から転入したとき'

  /** Statutory deadline */
  deadlineDescriptionJa: string; // '事由発生日の翌日から15日以内'

  /** List of document requirements */
  documentRequirementIds: string[];

  /** Permitted submission methods */
  submissionMethods: ('counter' | 'mail' | 'myna_portal' | 'online_portal')[];

  /** Official agency action URL */
  officialActionUrl?: string;

  /** Statutory fee notes (free or fixed) */
  feeType: 'free' | 'statutory_fixed' | 'revenue_stamp' | 'municipality_dependent';
  feeAmountJpy?: number; // e.g., 4000 (ISA renewal stamp)
}
```

---

## 3. Acquisition Channel Model

A single document can be acquired through multiple channels depending on the user's setup and municipality participation:

```typescript
export interface AcquisitionChannelSupport {
  channel: 
    | 'municipal_counter'      // 市区町村窓口
    | 'convenience_store'       // コンビニ交付 (Multi-copy kiosk)
    | 'myna_portal_online'      // マイナポータル / ぴったりサービス
    | 'mail_request'            // 郵送請求
    | 'tax_office_counter'      // 税務署窓口
    | 'e_tax_online'            // e-Tax (National Tax)
    | 'employer_request'        // 勤務先の人事・総務
    | 'hello_work_counter';     // ハローワーク窓口

  /** Is this channel supported in national standard? */
  isNationalStandard: boolean;

  /** Prerequisites for using this channel */
  prerequisites: {
    requiresMyNumberCard: boolean;
    requiresSignatureCert?: boolean; // 署名用電子証明書 (6-16 alphanum PIN)
    requiresUserAuthCert?: boolean;  // 利用者証明用電子証明書 (4-digit PIN)
    requiresRegisteredDomicileApp?: boolean; // 本籍地利用登録 (for Koseki at konbini when living elsewhere)
    requiresPaperApplicationForm?: boolean;
    requiresReturnEnvelopeAndStamps?: boolean;
    requiresPhotoId?: boolean;
  };

  /** Standard operating window */
  standardOperatingHoursJa: string; // e.g., '06:30〜23:00（市区町村システム休止日を除く）'

  /** Fee rule description */
  feeGuidanceJa: string; // e.g., '窓口300円 / コンビニ200円〜300円（自治体により割引あり）'

  /** Official warning or caveat */
  limitationsJa?: string[];
}
```

---

## 4. Locality Override & Tiered Handling

To respect municipality-level autonomy while preventing hallucinations:
1. **Tier 1 (Verified Municipalities)**: Explicit verified overrides for konbini support, fees, and counter hours.
2. **Tier 2 (Partially-Supported Prefectural Capitals / Major Cities)**: National default baseline applied with disclaimer.
3. **Tier 3 (Unverified Localities)**:
   - **MANDATORY UX**: Never say "Service unavailable".
   - State: *"Toolio has not yet verified this municipality's local availability. Displaying national default standards. Please verify with your local municipal desk."*

---

## 5. Security & Sensitivity Guardrails

1. **Zero Persistence of Highly Sensitive Data**:
   - Toolio MUST NEVER persist My Number (12 digits), PINs (4 digits or 6-16 characters), or scanned certificate images.
2. **Client-Side Form Drafts**:
   - Official Form Helper stores form draft state strictly in transient in-memory React state or encrypted browser session storage.
3. **No Automatic Government Submission**:
   - Toolio is an informational and preparation guide. No JPKI signing, automated form submission, or impersonation of administrative portals.

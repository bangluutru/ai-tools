# JAPAN RESIDENCE & IMMIGRATION STATUTORY RULE AUDIT

**Domain**: Japan Life → Residence & Immigration / 在留・入管  
**Statutory Basis**: 
- 出入国管理及び難民認定法 (Cabinet Order No. 319 of 1951, as amended — Immigration Control and Refugee Recognition Act / 入管法)
- 出入国管理及び難民認定法施行規則 (Ministry of Justice Ordinance No. 54 of 1981, as amended)
- 出入国管理及び難民認定法関係手数料令 (Cabinet Order No. 275 of 1981, as amended)
- 永住許可に関するガイドライン (Immigration Services Agency Guideline)
- 住民基本台帳法 (Act No. 81 of 1967)

**Official Authorities**:
- 出入国在留管理庁 (Immigration Services Agency of Japan — ISA)
- 法務省 (Ministry of Justice — MOJ)
- e-Gov法令検索 (Digital Agency / Ministry of Internal Affairs)
- 外国人在留支援センター (Foreign Residents Support Center — FRESC)

---

## 1. Official Primary Sources Registry

Every rule, fee, deadline, and checklist item in Phase 7 traces strictly to an official government source:

| Source ID | Authority | Title | Official Reference / URL | Type & Status |
|---|---|---|---|---|
| `isa-ica-annexed-table-1` | 出入国在留管理庁 / e-Gov | 出入国管理及び難民認定法 別表第一（活動資格） | e-Gov法令検索 昭和26年政令第319号 | Law / `official-current` |
| `isa-ica-annexed-table-2` | 出入国在留管理庁 / e-Gov | 出入国管理及び難民認定法 別表第二（身分資格） | e-Gov法令検索 昭和26年政令第319号 | Law / `official-current` |
| `isa-ica-art19-work-scope` | 出入国在留管理庁 / e-Gov | 入管法第19条（在留資格に応じた活動及び資格外活動許可） | e-Gov法令検索 昭和26年政令第319号第19条 | Law / `official-current` |
| `isa-extra-activity-perm` | 出入国在留管理庁 | 資格外活動の許可（包括許可・個別許可）の基準 | ISA 資格外活動許可手続案内 | Guidance / `official-current` |
| `isa-ica-art21-renewal` | 出入国在留管理庁 / e-Gov | 入管法第21条（在留期間の更新）及び特例期間 | e-Gov法令検索 昭和26年政令第319号第21条 | Law / `official-current` |
| `isa-photo-req-2026` | 出入国在留管理庁 | 提出写真の規格及び要件（令和8年6月14日以降：1歳未満免除） | ISA 申請用写真規格案内 | Regulation / `official-current` |
| `isa-fee-schedule-2026` | 法務省 / 出入国在留管理庁 | 入管関係手数料の改定（令和8年10月1日施行：申請日基準） | 令和8年政令改正 入管関係手数料令 | Cabinet Order / `official-current` |
| `isa-ica-art19-16-notification` | 出入国在留管理庁 / e-Gov | 入管法第19条の16（所属機関等に関する届出：14日以内） | e-Gov法令検索 昭和26年政令第319号第19条の16 | Law / `official-current` |
| `isa-electronic-notification` | 出入国在留管理庁 | 出入国在留管理庁電子届出システム（所属機関届出） | ISA 電子届出システム案内 | Guidance / `official-current` |
| `isa-ica-art20-change` | 出入国在留管理庁 / e-Gov | 入管法第20条（在留資格の変更） | e-Gov法令検索 昭和26年政令第319号第20条 | Law / `official-current` |
| `isa-family-stay-table` | 出入国在留管理庁 | 「家族滞在」の在留資格に係る基準及び立証資料 | ISA 在留資格「家族滞在」案内 | Guidance / `official-current` |
| `isa-pr-guidelines-current` | 出入国在留管理庁 | 永住許可に関するガイドライン（令和元年改正・現行適用版） | ISA 永住許可ガイドライン | Guidance / `official-current` |
| `isa-pr-proposal-2026-draft` | 出入国在留管理庁 | 永住許可制度等の見直しに関する意見公募案（検討案・非現行） | e-Gov パブリックコメント | Draft / `official-proposed` |
| `isa-online-system` | 出入国在留管理庁 | 在留申請オンラインシステムの利用案内 | ISA オンライン申請ポータル | Guidance / `official-current` |
| `isa-reentry-art26` | 出入国在留管理庁 / e-Gov | 入管法第26条（再入国許可）及び第26条の2（みなし再入国許可） | e-Gov法令検索 昭和26年政令第319号第26条 | Law / `official-current` |
| `jps-lump-sum-withdrawal` | 日本年金機構 | 脱退一時金の請求手続き（出国後2年以内） | 日本年金機構 外国人向け年金制度 | Guidance / `official-current` |

---

## 2. Comprehensive Rule Classification (Taxonomy)

Every immigration rule is strictly categorized under one of four normative tiers:
- **Tier A: Deterministic Rules**: Strict statutory facts, deadlines, fee amounts governed by application date, filing validity rules. The system can definitively evaluate and conclude.
- **Tier B: Eligibility Prerequisites**: Objective threshold tests (e.g. valid family relationship, continuous residence duration, qualifying status holding). Evaluated as `appears satisfied` / `not satisfied` / `unknown`.
- **Tier C: Administrative Assessment (Discretionary)**: Rules requiring state evaluation of "reasonable grounds" (相当の理由), "conformity with national interest" (日本国の利益に合する), financial stability, conduct. The system **CANNOT** issue definitive approvals or percentages.
- **Tier D: Legal Exceptions & Special Routes**: Exceptional pathways (Spouse route for PR, 15-day graduation grace, special permission). Surfaced with conditional caveats.

---

### Matrix of Rules across Phase 7 Scope:

| ID | Domain / Module | Rule Concept | Statutory Citation | Rule Tier | Engine Behavior & Allowed Vocabulary |
|---|---|---|---|---|---|
| **R-M1-01** | M1 Work Scope | Permissible activities for Table 1 Work Statuses | ICA Art. 19(1), Table 1(1)(2) | **Tier B** (Prerequisite) | Evaluates whether planned activity matches statutory status duties (`Generally within scope` / `Potentially outside current status`). |
| **R-M1-02** | M1 Work Scope | Table 2 Statuses Work Freedom | ICA Art. 19, Table 2 | **Tier A** (Deterministic) | Permanent Resident, Spouse of Japanese, Spouse of PR, Long-Term Resident have no statutory employment restrictions. |
| **R-M1-03** | M1 Work Scope | 資格外活動許可 (Student/Dependent) | ICA Art. 19(2), Ordinance Art. 19 | **Tier A** (Deterministic) | Without permission: work illegal. With permission: max 28 hrs/week during term. Adult entertainment (風俗営業) strictly prohibited. |
| **R-M1-04** | M1 Work Scope | 特定活動 (Designated Activities) | ICA Table 1(5) | **Tier B** (Prerequisite) | Scope depends on individual Designation Certificate (指定書). System cannot determine from status name alone. |
| **R-M2-01** | M2 Renewal | Renewal Window & Special Grace Period | ICA Art. 21(2)(4) | **Tier A** (Deterministic) | Applications open ~3 months prior. Filing prior to expiry grants 特例期間 (up to 2 months past expiration pending decision). |
| **R-M2-02** | M2 Renewal | Reasonable Grounds for Renewal (相当の理由) | ICA Art. 21(3) | **Tier C** (Discretionary) | Supreme Court McLean standard: subject to ISA discretion. Returns `Prerequisites appear satisfied` / `Needs case-specific review`. Zero % approval. |
| **R-M2-03** | M2 Renewal | Photo Exemption Age Rule (Effective 2026-06-14) | ISA Ordinance Revision 2026 | **Tier A** (Deterministic) | For residence cards issued $\ge$ 2026-06-14: exempt under age 1 (previously under age 16). 1+ requires photo. |
| **R-M2-04** | M2 Renewal | Fee Revision Boundary (Effective 2026-10-01) | Fee Order Revision 2026 | **Tier A** (Deterministic) | **Governed by `applicationDate`**: $\le$ 2026-09-30 = 4,000 JPY; $\ge$ 2026-10-01 = 6,000 JPY (paper rate). |
| **R-M3-01** | M3 Affiliation | 14-Day Reporting Deadline | ICA Art. 19-16 | **Tier A** (Deterministic) | Must notify ISA within 14 days of job resignation, transfer, contract end, or employer change. Max 200k JPY fine for failure. |
| **R-M3-02** | M3 Affiliation | Job Change vs Status Change Distinction | ICA Art. 19, Art. 20 | **Tier B** (Prerequisite) | Same work scope: notification only + optional 就労資格証明書. Different work scope: Status Change permission required BEFORE work. |
| **R-M4-01** | M4 Status Change | Change Permission Requirement | ICA Art. 20(1)(2) | **Tier C** (Discretionary) | Changing to new activity requires ISA permission prior to engaging in new duties. Evaluation based on education/experience/relevance. |
| **R-M4-02** | M4 Status Change | Student $\to$ Work Transition Prerequisites | ISA Guidelines | **Tier B** (Prerequisite) | Requires university/vocational degree, employer contract, wage equality with Japanese nationals, relevance to curriculum. |
| **R-M5-01** | M5 Family | Eligible Dependent Relationships | ICA Table 1(4) | **Tier A** (Deterministic) | **Only** legally married spouse and dependent children qualify. Parents, siblings, cousins are strictly NOT covered under 家族滞在. |
| **R-M5-02** | M5 Family | Qualifying Sponsor Statuses | ICA Table 1(4) | **Tier B** (Prerequisite) | Qualifying: 技人国, 経営・管理, 教授, 高度専門職, 技能, 特定技能2号. Non-qualifying: 特定技能1号, 技能実習, 短期滞在. |
| **R-M6-01** | M6 PR Readiness | Statutory Tripartite Standard | ICA Art. 22(2) | **Tier C** (Discretionary) | Good conduct, independent livelihood, national interest. Discretionary assessment by ISA. Returns Readiness Profile, zero approval claims. |
| **R-M6-02** | M6 PR Readiness | Continuous Residence Duration | ISA PR Guidelines | **Tier B** (Prerequisite) | Standard: 10+ yrs in Japan with 5+ yrs work status. Spouse of JP/PR: 3+ yrs married & 1+ yr in Japan. HSP 80+ pts: 1 yr; 70+ pts: 3 yrs. |
| **R-M6-03** | M6 PR Readiness | Current Status Period Condition | ISA PR Guidelines | **Tier B** (Prerequisite) | Must currently hold the maximum period granted for current status (3-year or 5-year period accepted; 1-year period disqualified). |
| **R-M6-04** | M6 PR Readiness | Public Obligations Compliance | ISA PR Guidelines | **Tier B** (Prerequisite) | Strict check of Tax, Pension, Health Insurance payments on time for past 5 years (past 3 years for spouse route). Single late payment is critical risk. |
| **R-M6-05** | M6 PR Readiness | 2026 Proposed PR Revision Status | ISA Draft Consultation 2026 | **Tier D** (Proposed Draft) | Registered as `official-proposed`. Must NOT be applied as active rule. Flagged as regulatory monitoring item only. |
| **R-M7-01** | M7 Arrival | 14-Day Address Registration | Basic Resident Reg. Act Art. 22 | **Tier A** (Deterministic) | Must register address at local municipality within 14 days of moving in. Address inscribed on card back. |
| **R-M7-02** | M7 Arrival | Social Insurance & Pension Enrollment | Health Ins. Act / Pension Act | **Tier A** (Deterministic) | Enrolled via employer if eligible; otherwise must enroll in National Health Insurance & National Pension at city hall. |
| **R-M8-01** | M8 Leaving | Special Re-entry vs Permanent Move-out | ICA Art. 26, Art. 26-2 | **Tier A** (Deterministic) | Returning within 1 yr: みなし再入国許可 (ED card tickbox, card preserved). Permanent: 転出届, card punched at airport, tax agent. |
| **R-M8-02** | M8 Leaving | Lump-Sum Pension Withdrawal (脱退一時金) | National Pension Act Art. 120 | **Tier A** (Deterministic) | Claimable within 2 years of departure if non-Japanese national had 6+ months of pension contributions and no pension entitlement. |

---

## 3. Discretion Safety Rules & Anti-Hallucination Guardrails

1. **Strict Vocabulary Enforcement**:
   - FORBIDDEN: `Approved`, `Eligible for visa`, `Guaranteed`, `95% chance`, `Your visa will be renewed`, `Permanent residence approved`.
   - MANDATORY: `Appears consistent with basic criteria`, `Potential issue detected`, `Requires case-specific assessment`, `Final determination by immigration authority`.
2. **Negative Tests Requirement**:
   - Unit tests must explicitly assert that discretionary results do not contain forbidden positive-certainty phrases.
3. **Temporal Application Rule**:
   - Fee calculations and document rules must resolve against `context.applicationDate` (or `issuanceDate`) rather than execution calendar year.

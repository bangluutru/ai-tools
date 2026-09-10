# Japan Life V1: Regulatory Freshness & Source Integrity Audit

- **Date**: 2026-09-11
- **Status**: Verified & Hardened (Checkpoint C3)
- **Total Official Sources Registered**: 55 (53 JP, 2 VN)
- **Active Primary Sources**: 54
- **Proposed Sources**: 1 (`isa-pr-proposal-2026-draft` — isolated, zero active rule dependency)
- **Stale / Deprecated Sources**: 0

---

## 1. Regulatory Source Freshness Taxonomy

| Classification | Definition | Count | Verified Rule Impact |
| :--- | :--- | :--- | :--- |
| **CURRENT** | Official statutes, Cabinet orders, ministerial tables verified for active production use. | **54** | Powers 100% of deterministic calculators, checkers, and wizards. |
| **PROPOSED** | Legislative bills or public comment drafts not yet enacted as current law. | **1** | Retained strictly for exploratory / simulation purposes; forbidden from active legal gates. |
| **NEEDS_REVERIFY** | Rates or rules scheduled for periodic reverification (e.g., annual August/October MHLW revisions). | **0** | All 2026 revisions up to date. |
| **HISTORICAL** | Historical brackets kept for retroactive tax/leave claims. | **0** | Dual effective period tables handle historical ranges within active rules. |
| **DEPRECATED** | Obsolete regulations replaced by subsequent reforms. | **0** | Pre-reform tables encapsulated in temporal engines. |

---

## 2. Critical 2026 Temporal Boundaries Audit

| Regulatory Domain | Exact Statutory Boundary | Pre-Boundary Behavior | Post-Boundary Behavior | Source Basis |
| :--- | :--- | :--- | :--- | :--- |
| **National Income Tax Reform** | `2026-12-01` (Applies to FY2026 Nenmatsu Chousei) | Basic deduction 480k JPY (salary deduction min 550k) | Basic deduction up to 1,040,000 JPY; Employment deduction min 740,000 JPY | `nta-no1410-2026`, `nta-no1199-2026` |
| **Social Insurance & Care Insurance** | `2026-04-01` (FY2026 Fiscal Year) | FY2025 standard remuneration brackets | FY2026 standard remuneration + 40-64 Kaigo care insurance rate (1.60%) | `kyokai-kenpo-monthly-table-2026`, `jps-welfare-pension-table-2026` |
| **Employment Insurance Rate** | `2026-04-01` (FY2026 Fiscal Year) | General business employee contribution rate | Worker share 6/1,000 (0.6%), employer share 9.5/1,000 | `mhlw-employment-insurance-rate-2026` |
| **Unemployment Benefit Ceiling** | `2026-08-01` (Annual MHLW Revision) | Standard 2025-08-01 ~ 2026-07-31 daily benefit caps | Updated daily wage ceilings & floor (2,869 JPY) | `mhlw-basic-allowance-rates-2026` |
| **Immigration Administrative Fees** | `2026-10-01` (Application Date) | Extension / Status Change fee: 4,000 JPY | Extension / Status Change fee: 6,000 JPY | `isa-fee-schedule-2026` |
| **Residence Card Photo Age Exemption** | `2026-06-14` (Enactment Date) | Photo exempt under 16 years old | Photo exempt strictly under 1 year old (1+ mandatory 40x30mm) | `isa-photo-req-2026` |
| **Child Allowance (Jidou Teate)** | `2024-10-01` (Reiwa 6 Reform) | Income ceilings apply; stops at junior high | Income ceiling eliminated; covers through high school age (con thứ 3: 30,000 JPY) | `cfa-child-allowance-reform-2024` |

---

## 3. Unknown Future Rule & Out-of-Bounds Behavior

1. **Tax Calculations Beyond Verified Year**:
   - The engine accepts tax years 2024 through 2027.
   - For years outside this range, the system outputs an explicit unverified notice: `unsupported_tax_year` rather than silently assuming rates remain unchanged forever.
2. **Immigration Application Dates**:
   - Dates up to 2026-09-30 resolve fee as 4,000 JPY.
   - Dates from 2026-10-01 resolve fee as 6,000 JPY based on statutory Ordinance Amendment.
   - Far future dates (> 2030) include disclaimer that fee schedules are subject to ministerial revision.
3. **Proposed Draft Safeguard**:
   - The draft source `isa-pr-proposal-2026-draft` is verified to have zero dependents among active rules. It is impossible for any active tool to claim PR cancellation rules as enacted law.

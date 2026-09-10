# JAPAN FAMILY & CHILD LOCALITY STRATEGY
## Strategy & Architecture for Municipal Variations in Family Welfare
**Domain:** Japan Life → Family & Child (`家族・子育て`)  
**Date:** 2026-09-10  
**Status:** Approved Architectural Standard  

---

## 1. Problem Statement & Background

In Japan's administrative and social welfare framework, family and child support policies operate at two distinct jurisdictional levels:

1. **National Statutory Systems (国レベルの法定制度)**:
   - *Uniform nationwide rules and funding*:
     - **出産手当金 (Maternity Allowance)**: Health Insurance Act Art. 102 ($2/3$ of standard monthly remuneration).
     - **出産育児一時金 (Childbirth Lump-Sum Grant)**: Health Insurance Act Art. 101 (Uniform 500,000 JPY as of April 2023).
     - **育児休業給付金 / 産後パパ育休 (Childcare Leave Benefits)**: Employment Insurance Act (67% / 50% / +13% wage base).
     - **児童手当 (Child Allowance)**: Child Allowance Act administered by the Children & Families Agency (Reiwa 6 revised amounts: ¥15,000 / ¥10,000 / ¥30,000).

2. **Municipal Welfare & Healthcare Systems (市区町村レベルの独自施策)**:
   - *Locally determined and administered by 1,700+ municipalities*:
     - **妊婦健康診査受診票 (Prenatal Checkup Subsidies)**: Vouchers covering 14 standard checkups, but subsidy amounts and covered tests vary widely by municipality (from ~¥80,000 to ¥140,000+ total).
     - **母子健康手帳 (Maternal and Child Health Handbook)**: Delivery window, health center location, and accompanying consultation services differ by city/ward.
     - **子ども医療費助成 (Child Medical Expense Subsidies)**: Completely localized. Subsidizes co-pays (free vs small copay of ¥500/visit) up to ages 15 or 18, with or without parental income restrictions.
     - **出産・子育て応援交付金 (Childbirth & Childcare Support Grant)**: ¥50,000 upon pregnancy notification + ¥50,000 upon birth notification (administered via municipal coupons or cash transfer).
     - **自治体独自の出産祝金 (Municipal Childbirth Celebration Gifts)**: Discretionary local grants (e.g., ¥10,000 to ¥100,000+ per child in certain rural or proactive municipalities).

Attempting to scrape or hardcode all 1,700+ municipalities into Toolio from Day 1 would introduce catastrophic maintenance overhead and high risk of outdated regulatory data. Therefore, a structured **Locality Support Architecture** is mandatory.

---

## 2. Generic Locality & Jurisdiction Architecture

To ensure extensibility for future domains (e.g. Vietnam Life, municipal tax variations, local health insurance), we model jurisdiction as a generic hierarchical tree rather than a Japan-specific silo.

### 2.1 Hierarchical Jurisdiction Identifier
Standardized syntax: `{COUNTRY}[-{SUBDIVISION}[-{MUNICIPALITY}]]`
- **JP** (National Japan)
- **JP-40** (Fukuoka Prefecture — ISO 3166-2:JP)
- **JP-40-40130** (Fukuoka City — JIS X 0402 5-digit municipal code)
- **JP-13-13101** (Chiyoda-ku, Tokyo)
- *(Future Vietnam Example: `VN` $\rightarrow$ `VN-SG` $\rightarrow$ `VN-SG-Q1`)*

### 2.2 Locality Capability Status Enum
Every municipality is evaluated against a 3-tier capability status:

```typescript
export const LOCALITY_SUPPORT_STATUS = Object.freeze({
  SUPPORTED: 'supported',
  PARTIALLY_SUPPORTED: 'partially-supported',
  UNSUPPORTED: 'unsupported'
});
```

| Status | Definition | User Experience & Rendering Rule |
| :--- | :--- | :--- |
| **`SUPPORTED`** | Verified municipal regulations, exact local medical subsidy age limits/copays, local health center windows, and verified official web links. | Displays local badge (`市区町村対応済`), displays exact municipal benefits and application windows alongside national items. |
| **`PARTIALLY_SUPPORTED`** | Municipality identity recognized, official local portal URL verified, but specific subsidy amounts require user confirmation at local office. | Displays verified municipality contact portal link with guidance note: *"National amounts calculated; please verify municipal medical subsidies on the official city portal."* |
| **`UNSUPPORTED`** | Municipality not yet verified in Toolio registry. | Displays national statutory procedures only. Prominently displays: *"Local municipal benefits are not yet verified for this municipality in Toolio. Please check with your local municipal office (市役所・区役所・町村役場)."* |

### 2.3 Strict Safety Rule: No Fabricated Proxy Data
**Under no circumstances will Toolio extrapolate Tokyo or Fukuoka municipal rules to unverified municipalities.** If a user resides in an unsupported municipality, local medical subsidies or gift amounts must **never** be rendered as 0 JPY or estimated without an explicit disclaimer.

---

## 3. Phased Rollout Plan for Municipal Data

To scale verified municipal data responsibly, Toolio adopts a 3-tier rollout schedule:

### Phase A: Pilot & Major Designated Cities (政令指定都市) — Phase 5 Baseline
Focus on reference implementations with robust digital administrative portals:
1. **Fukuoka City (福岡県福岡市 / `JP-40-40130`)**:
   - Prenatal Checkup Vouchers: 14 tickets (up to ~¥106,000 verified standard).
   - Maternal Handbook: 7 Ward Public Health & Welfare Centers (区保健福祉センター).
   - Child Medical Subsidy: Covered through junior high school / high school with modest copay (¥500/hospitalization/outpatient depending on grade).
   - Official Portal: `https://www.city.fukuoka.lg.jp/`
2. **Chiyoda-ku, Tokyo (東京都千代田区 / `JP-13-13101`)**:
   - Birth & Childcare grant + high-tier local child medical coverage up to age 18 with 0 JPY copay.
   - Official Portal: `https://www.city.chiyoda.lg.jp/`

### Phase B: Prefectural Capitals & High-Density Metros (Post-Phase 5)
- Osaka City (`JP-27-27100`), Yokohama City (`JP-14-14100`), Nagoya City (`JP-23-23100`), Sapporo City (`JP-01-01100`), Kobe City (`JP-28-28100`).

### Phase C: Nationwide Expansion via Structured Registry (Long-Term)
- Automated verification pipelines against digital agency open data (`catalog.data.go.jp`) and municipal welfare ordinances.

---

## 4. Integration with Core Engines & Orchestrator

1. **`packages/core/src/regulatory/jurisdiction.js`**:
   - Provide `resolveJurisdiction(identifier)`
   - Provide `getLocalityStatus(jurisdictionId)`
   - Provide `getJurisdictionChain(jurisdictionId)` returning `[municipality, prefecture, national]`

2. **`packages/core/src/japan/family/locality/`**:
   - `municipalRegistry.js`: Seeded with verified Phase A cities and fallback resolver.
   - `localSubsidiesResolver.js`: Resolves local medical subsidies and health center links based on resolved jurisdiction.

3. **Birth Wizard UI (`BirthWizardView.jsx`)**:
   - Municipality selector with search/autocomplete.
   - Dynamic Locality Status Card:
     - Shows verified status badge.
     - Direct link to the official municipal pregnancy/birth guide.
     - Clear checklist items tagged either `[国]` (National) or `[自治体]` (Municipal).

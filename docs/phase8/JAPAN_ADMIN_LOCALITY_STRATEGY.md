# JAPAN ADMINISTRATIVE LOCALITY STRATEGY
**Domain**: Japan Life → Administrative Procedures & Documents / 行政手続・証明書  
**Status**: APPROVED  
**Version**: 1.0.0 (Phase 8)  

---

## 1. Context & Locality Realities in Japan

Japan has 1,718 municipalities (市区町村 - wards, cities, towns, villages) across 47 prefectures.
While the **statutory framework** (Basic Resident Registration Act, Family Register Act, Local Tax Act) is national, administrative execution varies substantially by municipality:
1. **Convenience Store Issuance (コンビニ交付 / J-LIS)**:
   - Over 1,200+ municipalities participate in the J-LIS network, but certificate coverage is NOT uniform.
   - For example: City A supports Resident Records and Seal Certificates at konbini, but does NOT issue Tax Certificates via kiosk. City B issues all documents.
2. **Fees**:
   - The Local Autonomy Act allows municipalities to set certificate fees via local ordinance. Standard counter fees are often 300 JPY, but some municipalities set 200 JPY, 350 JPY, or 400 JPY.
   - Convenience store discounts (e.g. 100 JPY off counter price) are adopted by many, but not all, municipalities.
3. **Koseki Jurisdiction**:
   - Family registers are legally tied to Registered Domicile (本籍地), NOT the current residence municipality (住所地).
   - Under the March 1, 2024 Broad-Issuance system (広域交付), physical counters nationwide can issue Koseki copies with photo ID, but konbini issuance still requires domicile municipality participation.

**Core Architectural Rule**: Toolio must **NEVER** generalize:
- *"All certificates can be acquired at convenience stores"*
- *"Every municipality charges 300 JPY"*
- *"If you have a My Number Card, all online services work"*

---

## 2. Three-Tier Locality Support Model

```
┌─────────────────────────────────────────────────────────────────┐
│ Tier 1: Verified Supported Municipalities                      │
│ - Detailed verified database of konbini support per document    │
│ - Specific fees, counter hours, special notes                   │
│ - Examples: Shinjuku, Shibuya, Minato, Osaka, Nagoya, Fukuoka   │
├─────────────────────────────────────────────────────────────────┤
│ Tier 2: Partially-Supported (Prefectural Capitals / Major)      │
│ - Verified general participation in J-LIS                       │
│ - Default service window (06:30–23:00) with caution advisory     │
├─────────────────────────────────────────────────────────────────┤
│ Tier 3: Unverified / Unsupported Localities                     │
│ - National statutory standard displayed                         │
│ - Explicit advisory: "Toolio has not yet verified this locality"│
│ - Guidance on how to check with local municipal desk             │
└─────────────────────────────────────────────────────────────────┘
```

### 2.1. Tier 1: Verified Supported Municipalities
For verified municipalities in the Phase 8 registry, the resolver provides structured exact attributes:
- Specific konbini availability per document type:
  - `residentRecord`: supported
  - `sealRegistration`: supported
  - `taxCertificate`: supported (e.g., current year only)
  - `familyRegister`: supported (requires registered domicile within municipality)
- Specific fee schedule: counter fee vs convenience store fee.
- Operating hour restrictions (e.g., some towns shut kiosk services at 20:00 or weekends).

### 2.2. Tier 2: Partially-Supported
- General konbini service availability known.
- Standard default window: `06:30〜23:00` (daily, excluding system maintenance days).
- Standard fee guidance: `窓口300円 / コンビニ200円〜300円（自治体により異なる）`.

### 2.3. Tier 3: Unverified Fallback (CRITICAL UX RULE)
When a user queries an unverified municipality (or any town not in the verified dataset):
- **NEVER SAY**: *"Dịch vụ không khả dụng tại nơi này"* (Service unavailable).
- **MANDATORY UX**:
  > *"Hệ thống Toolio chưa lưu trữ dữ liệu xác thực riêng cho địa phương này. Dưới đây là quy định chung toàn quốc. Quý khách vui lòng kiểm tra trực tiếp tại cổng thông tin hoặc quầy hành chính của địa phương."*
  > *"Toolio has not yet verified this municipality's local availability. Displaying national standard rules. Please verify with your local municipal desk."*

---

## 3. Registered Domicile vs Current Address Rules

Administrative guidance for family registers (戸籍全部事項証明書 / 附票):

1. **In-Person at Municipal Counters (March 1, 2024 Nationwide Broad-Issuance)**:
   - **Eligible**: The individual, their spouse, children, or direct ascendants/descendants.
   - **Location**: ANY municipal office counter across Japan (not just the domicile city).
   - **Prerequisite**: Presentation of government-issued photo ID (My Number Card, Driver's License, Residence Card).
   - **Limitation**: Attorney/proxy applications cannot use broad-issuance; must apply to domicile city.

2. **At Convenience Store Kiosks**:
   - **Case A: Domicile and Residence in the SAME municipality**:
     - Insert My Number Card $\to$ Select Family Register $\to$ Enter PIN (4 digits) $\to$ Print.
   - **Case B: Domicile and Residence in DIFFERENT municipalities**:
     - User MUST complete **"Koseki Kiosk Advance Registration" (本籍地利用登録)** once at the kiosk or via MynaPortal.
     - Registration takes 2–5 business days for the domicile municipality to approve.
     - Once approved, user can print Koseki copies at any convenience store nationwide.

---

## 4. Tax Certificate Year & Jurisdiction Matrix

To avoid the #1 mistake foreigners make ("I went to City Hall today and they refused my tax certificate"):

```
Scenario: User moved from Osaka City to Shinjuku City (Tokyo) on April 1, 2026.
Application in June 2026 for Immigration Residence Extension.

Requirement: "Latest Inhabitant Tax Certificate (令和7年度 / 2025 income)"

Who issues it?
- Address on January 1, 2026 was: OSAKA CITY.
- Issuing Municipality: OSAKA CITY (NOT Shinjuku City!).

How to acquire:
- Shinjuku City Hall CANNOT issue this certificate.
- Method 1: Mail request (郵送請求) to Osaka City Ward Office.
- Method 2: Osaka City online certificate service (if Osaka supports digital issuance to moved-out residents).
- Method 3: Konbini kiosk: NOT available for previous municipality once residence registration moves out!
```

Toolio's Certificate Acquisition Guide directly resolves this based on the user's moving date and the relevant tax year.

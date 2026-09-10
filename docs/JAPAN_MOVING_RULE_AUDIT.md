# JAPAN MOVING & HOUSING STATUTORY RULE AUDIT

**Target Domain**: Japan Housing & Moving (`housing`)  
**Applicable Tools**: `moving-cost-jp`, `moving-admin-checker-jp`, `address-change-checklist-jp`, `moving-wizard-jp`  
**Audit Standard**: Zero-Inference Legal Grounding  
**Regulatory Level**: Statutory Laws, Cabinet Orders & Ministry Guidelines (Japan)  

---

## 1. Statutory References & Legal Foundations

### 1.1 Ministry of Land, Infrastructure, Transport and Tourism (MLIT)
- **Standard Moving Contract (標準引越運送約款第21条)**:
  - Governs freight quotes, cancellation policies, and carrier liability.
  - Cancellation Fee Schedule (解約手数料・延期手数料):
    - 3 or more days prior to moving date: **0 JPY (Free cancellation)**.
    - 2 days prior to moving date: **Up to 20% of freight charge**.
    - 1 day prior (the day before): **Up to 30% of freight charge**.
    - Day of move: **Up to 50% of freight charge**.
  - Requirement: Carrier must have checked with shipper between 2 days prior and 3 days prior whether any changes occurred.

### 1.2 Basic Resident Registration Act (住民基本台帳法)
- **Article 22 (転入届 — Move-in Notice)**:
  - Mandatory filing within **14 days** of taking up residence in a new municipality.
  - Requires paper Move-out Certificate (転出証明書) or electronic record via My Number Card.
- **Article 23 (転居届 — Intra-City Move Notice)**:
  - Mandatory filing within **14 days** of changing address within the same municipality.
- **Article 24 (転出届 — Move-out Notice)**:
  - Notice must be submitted in advance (generally within 14 days prior to move date) to the former municipal office.
- **Article 24-2 (転出届の特例 — Special Exception via My Number Card)**:
  - Allows electronic notification (Tokurei Tennyu), eliminating paper certificate issuance.
- **Article 52 (過料罰則 — Fines for Non-compliance)**:
  - Any person who fails to submit a notification under Articles 22–24 without justifiable cause is liable to a non-criminal administrative fine (**過料**) of up to **50,000 JPY**.

### 1.3 Digital Agency (デジタル庁)
- **MyNaPortal Relocation One-Stop Service (引越しワンストップサービス)**:
  - Launched nationwide in February 2023.
  - Enables residents possessing an active My Number Card with a valid electronic signature certificate (6–16 character password) to complete the move-out notice (転出届) online 24/7 without visiting the former city hall.
  - Move-in notice (転入届) appointment can be pre-booked online, though physical presence at the new municipality counter is still legally required for facial verification and card chip address update.

### 1.4 Immigration Control and Refugee Recognition Act (出入国管理法)
- **Article 19-9 (住居地の届出 — Notification of Residence for Foreign Nationals)**:
  - Mid- to long-term foreign residents must report their new place of residence to the municipal mayor within **14 days** of moving in.
  - The municipal mayor endorses the new address on the reverse side of the Residence Card (在留カード).
  - Failure to report within **90 days** without justifiable reason is grounds for revocation of status of residence (Article 22-4, Paragraph 1, Item 6).

### 1.5 Child Allowance Act (児童手当法)
- **Article 7 & Article 8 (15日特例 — 15-Day Transition Rule)**:
  - General Rule: Benefits start from the month following the application month.
  - 15-Day Exception Rule: If moving occurs near the end of a month, submitting the application within **15 days** of the day following the move date allows benefits to continue retroactively from the move-in month.
  - Failure to meet this 15-day window permanently forfeits that entire month's allowance (10,000 to 30,000 JPY).

### 1.6 Postal Act (郵便法)
- **Article 29 (郵便物の転送 — Forwarding of Postal Items)**:
  - Japan Post provides free mail forwarding (e転居 / 転居届) to the new address for **1 year** from the registered date.
  - Lead time requirement: Processing takes **3 to 7 business days** to take effect.
  - Identification verification is required under anti-fraud regulations.

### 1.7 Road Traffic Act & Road Transport Vehicle Act
- **Road Traffic Act Article 94 (道路交通法第94条 運転免許証記載事項変更届)**:
  - Driver license holders must notify the Prefectural Public Safety Commission (Police Station or License Center) **promptly (速やかに)** upon changing residence.
- **Road Transport Vehicle Act Article 12 (道路運送車両法第12条 変更登録)**:
  - Vehicle owners must apply for registration change of the Vehicle Inspection Certificate (車検証) within **15 days** of the change.
  - Cross-jurisdictional moves require changing license plates.

---

## 2. Implementation Audit Matrix

| Rule / Statutory Clause | Tool Implementation | Test Assertion / Verification |
|---|---|---|
| **MLIT Art. 21 Cancellation Fees** | `movingCostEngine.js` | `M4-05: MLIT Cancellation Fee Schedule` in `regulatory-japan-housing-golden.test.js` |
| **Basic Resident Registration Arts. 22-25** | `movingAdminEngine.js`, `movingWizardEngine.js` | `M5-01: Cross-municipality move` and `M7-01: Cross-municipality move` |
| **Basic Resident Registration Art. 52 (50k Fine)** | `movingAdminEngine.js`, `MovingAdminCheckerView.jsx` | Warning banner with Art. 52 citation & 50,000 JPY penalty displayed |
| **MyNaPortal One-Stop Criteria** | `movingAdminEngine.js` | `M5-02: MyNaPortal One-Stop eligibility` |
| **Immigration Control Act Art. 19-9** | `movingAdminEngine.js`, `movingWizardEngine.js` | `M5-03: Zairyu card 14-day & 90-day alert` |
| **Child Allowance Art. 8 (15-Day Rule)** | `movingWizardEngine.js`, `child-allowance-jp` | `M7-01: Child allowance 15-day rule preserves 1 month benefit` |
| **Postal Act Art. 29 (e-Tenkyo)** | `addressChangeEngine.js`, `AddressChangeChecklistView.jsx` | `M6-01: Japan Post 1-year free forwarding & 3-7 day lead time` |
| **Gas Valve Mandatory Presence** | `addressChangeEngine.js`, `AddressChangeChecklistView.jsx` | `requiresPresence: true` flag and critical highlight banner |

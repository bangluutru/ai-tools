# JAPAN ADMINISTRATIVE DOCUMENT REGISTRY AUDIT & CATALOG
**Domain**: Japan Life → Administrative Procedures & Documents / 行政手続・証明書  
**Status**: AUDITED & VERIFIED  
**Version**: 1.0.0 (Phase 8)  

---

## 1. Registry Catalog Summary

This document establishes the canonical registry of official Japanese administrative certificates, identity credentials, and tax/labor records used across municipal, tax, immigration, family, and employment domains.

---

## 2. Canonical Document Definitions

### 2.1. Identity & Residence Certificates (住民記録・身元確認)

#### 1. `document.resident-record-copy` (住民票の写し)
- **Canonical Name (JA)**: 住民票の写し (Jūminhyō no utsushi)
- **Multilingual Names**:
  - VI: Bản sao phiếu cư trú
  - EN: Certificate of Residence (Copy of Resident Record)
- **Aliases**: 住民票, じゅうみんひょう, resident certificate, certificate of residence, phieu cu tru, giay cu tru
- **Issuing Authority**: Municipal Office of current residence (現住所地の市区町村)
- **Issuer Category**: `municipal_current_residence`
- **Statutory Basis**: 住民基本台帳法 第12条 (Basic Resident Registration Act, Art. 12)
- **Sensitivity Tier**: `personal` (contains name, DOB, sex, address, household relations)
- **Available Channels**:
  - `municipal_counter`: Standard issuance (~300 JPY)
  - `convenience_store`: Multi-copy kiosk with My Number Card (User Auth PIN 4-digits) (often discounted: 200–250 JPY in participating municipalities)
  - `myna_portal_online`: Pittari Service or municipal smart desk (digital copy or mail delivery)
  - `mail_request`: Application form + postal money order (定額小為替) + self-addressed stamped envelope + ID copy
- **Critical Caveat**: Does NOT have inherent 3-month expiry. Procedure requirement specifies freshness (`maxAgeMonths: 3`). Can be issued for individual (世帯一部) or entire household (世帯全員). Must explicitly specify whether to include relationships (続柄) or nationality/residence status (国籍・在留資格等). My Number must NOT be printed unless explicitly demanded by law.

#### 2. `document.resident-record-items-cert` (住民票記載事項証明書)
- **Canonical Name (JA)**: 住民票記載事項証明書
- **Aliases**: 記載事項証明, 住民票記載証明, certificate of items stated in resident record, giay chung nhan muc ghi phieu cu tru
- **Issuing Authority**: Municipal Office of current residence
- **Statutory Basis**: 住民基本台帳法 第12条の2
- **Purpose**: A certificate verifying only specific items (e.g. name, address, DOB) usually on a company-provided format, avoiding unnecessary exposure of household/family details.

#### 3. `document.residence-card` (在留カード)
- **Canonical Name (JA)**: 在留カード (Zairyū Kādo)
- **Aliases**: 外国人登録証(historical), 在留カード, residence card, the cu tru
- **Issuing Authority**: Immigration Services Agency of Japan (出入国在留管理局)
- **Statutory Basis**: 出入国管理及び難民認定法 第19条の3 (Immigration Control Act, Art. 19-3)
- **Sensitivity Tier**: `sensitive_identifying`
- **Channels**: In-person at airport of entry or Regional Immigration Bureau counters.

#### 4. `document.passport` (旅券 / パスポート)
- **Canonical Name (JA)**: 旅券（パスポート）
- **Aliases**: パスポート, passport, ho chieu
- **Issuing Authority**: Ministry of Foreign Affairs (for Japanese nationals) / Respective national embassies/consulates (for foreign residents).

#### 5. `document.mynumber-card` (マイナンバーカード)
- **Canonical Name (JA)**: 個人番号カード（マイナンバーカード）
- **Aliases**: マイナカード, 個人番号カード, My Number Card, the my number
- **Issuing Authority**: Municipal Office / J-LIS (地方公共団体情報システム機構)
- **Statutory Basis**: 行政手続における特定の個人を識別するための番号の利用等に関する法律 第16条の2
- **Sensitivity Tier**: `highly_sensitive`
- **Electronic Certificates**:
  - `署名用電子証明書` (Signature Electronic Certificate - 6-16 alphanum PIN): Used for e-Tax and official signing. Becomes invalid on change of address/name.
  - `利用者証明用電子証明書` (User Authentication Electronic Certificate - 4 digit PIN): Used for MynaPortal login and convenience store kiosks. Valid for 5 years from issuance.

---

### 2.2. Civil Registration & Seal Certificates (印鑑・戸籍)

#### 6. `document.seal-registration-certificate` (印鑑登録証明書)
- **Canonical Name (JA)**: 印鑑登録証明書 (Inkan tōroku shōmeisho)
- **Aliases**: 印鑑証明, 印鑑登録証明, 印鑑, seal certificate, giay chung nhan con dau
- **Issuing Authority**: Municipal Office of current residence (現住所地の市区町村)
- **Statutory Basis**: 各市区町村の印鑑登録及び証明に関する条例 (Municipal Seal Ordinances)
- **Sensitivity Tier**: `sensitive_identifying`
- **Prerequisites**: Registered personal registered seal (実印) and registered seal card (印鑑登録証).
- **Available Channels**:
  - `municipal_counter`: Requires Seal Card (印鑑登録証) OR My Number Card (in municipalities supporting cardless counter).
  - `convenience_store`: Supported with My Number Card (User Auth PIN). Does NOT require physical seal card at kiosk.

#### 7. `document.family-register-full` (戸籍全部事項証明書 / 戸籍謄本)
- **Canonical Name (JA)**: 戸籍全部事項証明書（戸籍謄本）
- **Aliases**: 戸籍謄本, こせきとうほん, 戸籍全部事項証明, family register full, ho tich toan bo
- **Issuing Authority**: Municipality of **Registered Domicile (本籍地の市区町村)**
- **Issuer Category**: `municipal_registered_domicile`
- **Statutory Basis**: 戸籍法 第10条 (Family Register Act, Art. 10)
- **Nationwide Broad Issuance (広域交付制度)**: Effective March 1, 2024, individuals can obtain this certificate at ANY municipal counter nationwide by presenting government-issued photo ID (My Number card or driver's license), eliminating the need to mail the domicile municipality.
- **Convenience Store Issuance**: Available IF the registered domicile municipality supports kiosk issuance. If current address differs from registered domicile, user must apply for "Koseki Kiosk Advance Registration" (本籍地利用登録) via kiosk or MynaPortal.

#### 8. `document.family-register-individual` (戸籍個人事項証明書 / 戸籍抄本)
- **Canonical Name (JA)**: 戸籍個人事項証明書（戸籍抄本）
- **Aliases**: 戸籍抄本, こせきしょうほん, 戸籍個人事項証明, family register individual, ho tich ca nhan
- **Issuing Authority**: Municipality of Registered Domicile.

#### 9. `document.family-register-tag` (戸籍の附票の写し)
- **Canonical Name (JA)**: 戸籍の附票の写し
- **Aliases**: 戸籍の附票, 附票, koseki no fuhyo, ho tich phu bieu
- **Purpose**: Certifies the history of all residential addresses from the registration of the domicile to present. Used for vehicle registration, real estate inheritance, and proving address continuity.

---

### 2.3. Municipal & National Tax Certificates (税務証明書)

#### 10. `document.taxation-certificate` (住民税課税証明書)
- **Canonical Name (JA)**: 住民税課税証明書（非課税証明書）
- **Aliases**: 課税証明書, かぜいしょうめい, 非課税証明書, taxation certificate, chung nhan dong thue, chung nhan chiu thue
- **Issuing Authority**: Municipality where resident on **January 1 of that fiscal year (その年の1月1日時点の住所地市区町村)**
- **Issuer Category**: `municipal_tax_residence`
- **Statutory Basis**: 地方税法 第20条の10 (Local Tax Act, Art. 20-10)
- **Sensitivity Tier**: `sensitive_identifying` (contains previous year's total income, deduction breakdown, and calculated inhabitant tax).
- **Channels**:
  - `municipal_counter`: Counter of the Jan 1 municipality.
  - `convenience_store`: Available ONLY if current municipality is the same as Jan 1 municipality and supports tax cert kiosks (some cities support current year only).
  - `mail_request`: Mandatory if user has moved to another city after Jan 1.

#### 11. `document.tax-income-certificate` (所得証明書)
- **Canonical Name (JA)**: 所得証明書
- **Aliases**: 所得証明, しょとくしょうめい, 収入証明, income certificate, chung nhan thu nhap
- **Issuing Authority**: Municipality where resident on January 1.
- **Note**: In many municipalities (e.g. Tokyo 23 wards), `課税証明書` and `所得証明書` are combined into a single unified certificate titled `課税・非課税・所得証明書`.

#### 12. `document.tax-payment-certificate` (住民税納税証明書)
- **Canonical Name (JA)**: 住民税納税証明書
- **Aliases**: 納税証明書(住民税), のうぜいしょうめい, municipal tax payment certificate, chung nhan nop thue dia phuong
- **Issuing Authority**: Municipality where resident on January 1.
- **Purpose**: Certifies that the levied municipal tax has actually been paid, including payment dates, paid amount, and any overdue balance. Crucial for Immigration Permanent Residence and Naturalization.

#### 13. `document.national-tax-payment-cert` (国税納税証明書 その1〜その3)
- **Canonical Name (JA)**: 国税納税証明書（その1・その2・その3等）
- **Aliases**: 国税納税証明, 税務署の納税証明, National Tax Payment Certificate, chung nhan nop thue quoc gia
- **Issuing Authority**: National Tax Office (**税務署 / Tax Office** under NTA), NOT the municipal office!
- **Issuer Category**: `national_tax_office`
- **Statutory Basis**: 国税通則法 第123条 (National Tax General Rule Act, Art. 123)
- **Channels**: Tax office counter or online via e-Tax.

---

### 2.4. Employment & Labor Documents (雇用・労働関連)

#### 14. `document.withholding-tax-slip` (給与所得の源泉徴収票)
- **Canonical Name (JA)**: 給与所得の源泉徴収票 (Kyūyo shotoku no gensen chōshūhyō)
- **Aliases**: 源泉徴収票, げんせん, gensen choshuhyo, withholding tax slip, phieu khau tru thue tai nguon
- **Issuing Authority**: **Employer / Company (勤務先 / 雇用主)**, NOT the government or tax office!
- **Issuer Category**: `employer`
- **Statutory Basis**: 所得税法 第226条 (Income Tax Act, Art. 226 - Statutory duty of employer to issue upon year-end adjustment or upon employee departure).
- **Channels**: Issued by company HR/payroll (paper or digital PDF).

#### 15. `document.employment-separation-certificate` (雇用保険被保険者離職票-1, 2)
- **Canonical Name (JA)**: 雇用保険被保険者離職票（離職票-1、離職票-2）
- **Aliases**: 離職票, りしょくひょう, rishokuhyo, certificate of job separation, phieu nghi viec
- **Issuing Authority**: Public Employment Security Office (**ハローワーク / Hello Work**) via Employer.
- **Statutory Basis**: 雇用保険法施行規則 第17条 (Employment Insurance Act Enforcement Regulations, Art. 17).
- **Channels**: Prepared by employer, certified by Hello Work, delivered to employee.

#### 16. `document.certificate-of-employment` (在職証明書 / 就労証明書)
- **Canonical Name (JA)**: 在職証明書 / 就労証明書
- **Aliases**: 在職証明, 勤務証明書, 就労証明, certificate of employment, giay chung nhan dang lam viec
- **Issuing Authority**: **Employer (勤務先)**.
- **Channels**: Issued on company letterhead or designated municipal daycare format.

---

## 3. Disambiguation Guide (Quick Reference)

| User Expression | Ambiguous Options | Discriminator Question |
| :--- | :--- | :--- |
| **"Thuế" / "Giấy thuế"** | 課税証明書 vs 納税証明書 vs 源泉徴収票 | Is it certifying your income amount (課税/所得), that you paid without debt (納税), or from your employer (源泉徴収)? |
| **"Nộp thuế" (Tax Payment)** | 住民税納税証明 (City Hall) vs 国税納税証明 (Tax Office) | Are you certifying local inhabitant tax or national income tax? |
| **"Hộ tịch" (Koseki)** | 戸籍謄本 (All members) vs 戸籍抄本 (Individual) vs 附票 (Address history) | Does the authority require the full family record or just your individual excerpt? |
| **"Nơi lấy giấy thuế"** | Current City Hall vs Jan 1 City Hall | Did you move across city borders after January 1 of this year? |

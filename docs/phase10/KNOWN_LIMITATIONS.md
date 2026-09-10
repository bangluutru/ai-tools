# Japan Life V1: Known Limitations & Boundary Scope

- **Date**: 2026-09-11
- **Status**: Formally Documented
- **Guiding Principle**: Radical Transparency — No False Completeness

---

## 1. Locality & Municipal Coverage Limitations

1. **National Baseline vs. Municipal Specifics**:
   - Toolio includes deep, verified municipal data for 8 major metropolitan jurisdictions (Tokyo Special Wards: Chiyoda, Minato, Shinjuku, Setagaya, Shibuya; Yokohama; Nagoya; Osaka; Fukuoka).
   - For Japan's remaining ~1,700 cities, towns, and villages, Toolio utilizes the **National Standard Baseline** (300 JPY certificate fees, standard statutory timelines).
   - Local municipal child healthcare subsidies or special birth gifts outside verified cities are explicitly marked as *"Cần kiểm tra quy chế cụ thể tại ủy ban địa phương"*.
2. **National Health Insurance (NHI / Kokumin Kenko Hoken) Rates**:
   - NHI premiums are calculated using standard municipal models (Income levy ~7-9%, Per-capita levy ~40,000-50,000 JPY, Asset levy in some rural areas). Because each municipality sets custom annual millage rates, Toolio presents NHI results as an **approximation estimate** rather than a cent-exact municipal tax notice.

---

## 2. Health Insurance Societies (Kenpō Kumiai) Limitations

1. **Kyōkai Kenpō Standard Focus**:
   - Statutory health insurance calculations in `social-insurance-jp` and `japan-tax-simulator` model the Japan Health Insurance Association (**Kyōkai Kenpō**) standard across all 47 prefectures.
   - Large corporate Health Insurance Societies (**Kenpō Kumiai**) may offer lower contribution rates (e.g. 7-9%) or additional voluntary benefits (Fuka Kyūfu - 付加給付). Users enrolled in corporate unions are advised in the provenance panel that their corporate rate may differ slightly from the Kyōkai Kenpō baseline.

---

## 3. Administrative Discretion in Immigration Determinations

1. **Legal Discretion of the Minister of Justice**:
   - Under Immigration Control and Refugee Recognition Act (Articles 20, 21, and 22), approvals for Change of Status, Extension of Stay, and Permanent Residence are subject to the sovereign administrative discretion of the Minister of Justice.
   - Toolio checks statutory documentary compliance and objective criteria (continuous residence, tax clearance, employment scope).
   - Toolio **never predicts approval probabilities or guarantees outcomes**. Results are classified as *Basic Criteria Satisfied*, *Potential Issue*, or *Requires Authority Confirmation*.

---

## 4. Temporal Scope & Historical Periods

1. **Supported Tax Years**:
   - The engine models tax calculations for years 2024 through 2027, with primary focus on the **2026 Tax Reform** (Reiwa 8).
   - Inquiries regarding historical years before 2024 are directed to manual tax office consultations.
2. **Future Unenacted Proposals**:
   - Legislative proposals undergoing public comment (e.g. `isa-pr-proposal-2026-draft` regarding potential PR tax compliance revocation) are strictly separated from current statutory rules and are not factored into current eligibility assessments.

---

## 5. Administrative Forms & Special Edge Cases

1. **Unregistered Exotic Visas**:
   - The 34 core residence statuses covering 99%+ of foreign workers and residents in Japan (Engineer/Specialist in Humanities, Business Manager, Highly Skilled Professional, Specified Skilled Worker i, Dependent, Permanent Resident, Spouse of Japanese National, Long-Term Resident, Student) are fully modeled.
   - Diplomatic, Official, Journalist, and highly esoteric statutory sub-statuses are not included in V1.

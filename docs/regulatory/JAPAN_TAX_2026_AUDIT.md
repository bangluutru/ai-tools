# Japan Tax 2026 Audit Report (令和8年分税制・社会保険監査)

**Audit Date**: 2026-09-10  
**Domain**: `japan-life / tax`  
**Tool**: `japan-tax-simulator`  
**Auditor**: Antigravity Regulatory Assurance Core  
**Standard**: Single Source of Truth — Japanese Tier-1 Primary Statutory Sources  

---

## 1. Scope

Đợt kiểm toán toàn diện này rà soát toàn bộ các hằng số, biểu thuế, thuật toán và công thức tính toán liên quan đến thuế thu nhập cá nhân, thuế cư trú, thuế doanh nghiệp, thuế tiêu thụ và nghĩa vụ bảo hiểm xã hội tại Nhật Bản cho năm tính thuế 2026 (令和8年分) và năm tài chính 2026 (令和8年度), bao gồm:
1. 給与所得 (Employment Income & Deduction - 給与所得控除)
2. 基礎控除 (Basic Personal Deduction)
3. 所得税・復興特別所得税 (National Income Tax & Reconstruction Tax)
4. 住民税 (Resident / Inhabitant Tax - 47 Prefectures)
5. 社会保険 (Social Insurance Obligations):
   - 国民年金 (National Pension)
   - 協会けんぽ 健康保険 (Kyokai Kenpo Health Insurance - 47 Prefectures)
   - 介護保険 (Nursing Care Insurance for ages 40–64)
   - 雇用保険 (Employment Insurance - MHLW)
   - 子ども・子育て支援金 (Child & Family Support Contribution)
   - 国民健康保険 (National Health Insurance - Municipality approximation disclosure)
6. 個人事業税 & 消費税 (Individual Enterprise Tax & Consumption Tax)

---

## 2. Official Sources (Tier-1 Primary Statutory Sources)

Toàn bộ các điều chỉnh và đối chiếu được tham chiếu trực tiếp qua `OfficialSourceRegistry`:

| Source ID | Cơ quan ban hành | Tên văn bản / Biểu mẫu chính thức | Loại nguồn | Trạng thái |
|---|---|---|---|---|
| `nta-no1410-2026` | 国税庁 (National Tax Agency) | No.1410 給与所得控除（令和8年分・令和9年分） | `official-table` | `official-primary` |
| `nta-no1199-2026` | 国税庁 (National Tax Agency) | No.1199 基礎控除（令和8年分以降・税制改正） | `official-table` | `official-primary` |
| `nta-no2260-income-tax` | 国税庁 (National Tax Agency) | No.2260 所得税の税率（速算表） | `official-table` | `official-primary` |
| `jps-national-pension-2026` | 日本年金機構 (Japan Pension Service) | 国民年金保険料（令和8年度 17,920円/月） | `official-guidance` | `official-primary` |
| `mhlw-employment-rate-2026` | 厚生労働省 (MHLW) | 令和8年度 雇用保険料率（一般事業 労働者負担 5/1000） | `regulation` | `official-primary` |
| `kyokai-kenpo-rates-2026` | 全国健康保険協会 (協会けんぽ) | 令和8年度 都道府県別健康保険料率・介護保険料率（1.62%） | `official-table` | `official-primary` |
| `cfa-child-support-2026` | こども家庭庁 / 厚生労働省 | 子ども・子育て支援金制度（令和8年4月施行 0.23%） | `law` | `official-primary` |
| `soumu-resident-tax-std` | 総務省 (MIC) | 個人住民税の税率・均等割・森林環境税（国税） | `regulation` | `official-primary` |

---

## 3. Existing Rules Audited

| Khu vực luật | Tệp nguồn | Trạng thái trước kiểm toán |
|---|---|---|
| 給与所得控除 2026 | `packages/core/src/utils/tax/rules/2026/index.js` | Sai biểu bậc: Dùng mức sàn 650k cũ thay vì 740k cho <= 2.2M |
| 基礎控除 2026 | `packages/core/src/utils/tax/rules/2026/index.js` | Thiếu biểu suy giảm từng bước NTA No.1199 (1.04M -> 880k -> 680k -> 630k -> 580k) |
| 国民年金 2026 | `packages/core/src/utils/tax/engines/socialInsuranceEngine.js` | Dữ liệu cũ: 17,510 JPY/tháng (năm 2025) thay vì 17,920 JPY/tháng (令和8年度) |
| 雇用保険 2026 | `packages/core/src/utils/tax/engines/socialInsuranceEngine.js` | Cố định 0.6% xuyên suốt; chưa cập nhật 0.5% (5/1000) cho 令和8年度 |
| 協会けんぽ Fukuoka | `packages/core/src/utils/tax/rules/locations/prefectureDefaults.js` | Fukuoka ghi 10.25% (cũ) thay vì 10.11% (令和8年度) |
| 子ども・子育て支援金 | Chưa có | Chưa tách riêng khoản đóng góp 0.23% (chia đôi 0.115%) từ tháng 4/2026 |
| 介護保険 (40–64 tuổi) | `packages/core/src/utils/tax/rules/locations/prefectureDefaults.js` | 1.60% (cũ) thay vì 1.62% cho 令和8年度 |
| 国民健康保険 (NHI) | `packages/core/src/utils/tax/engines/socialInsuranceEngine.js` | Chưa gắn nhãn 概算 (ước tính) và thiếu khuyến cáo phụ thuộc 市区町村 |
| Source Traceability | Rải rác khắp code | Dùng `sourceUrl` dạng chuỗi thô, không liên kết `sourceRegistry` |

---

## 4. Confirmed Correct

1. **Biểu thuế lũy tiến 7 bậc 所得税 (国税庁 No.2260)**:
   - 5% (< 1.95M), 10% (1.95M–3.3M), 20% (3.3M–6.95M), 23% (6.95M–9M), 33% (9M–18M), 40% (18M–40M), 45% (> 40M) — Giữ nguyên, hoàn toàn chính xác.
2. **Thuế tái thiết 復興特別所得税**:
   - 2.1% trên số thuế thu nhập tính ra — Giữ nguyên, chính xác đến 2037.
3. **Thuế cư trú tiêu chuẩn 住民税 (総務省)**:
   - Thuế suất thu nhập (所得割) 10% (Tỉnh 4% + Xã/Phường 6%), 均等割 5,000 JPY, 森林環境税 1,000 JPY — Giữ nguyên, chính xác.
   - Các đặc thù môi trường địa phương (như 神奈川県 +0.025% bảo vệ nguồn nước, 宮城 발전세, etc.) — Giữ nguyên.
4. **Khấu trừ 青色申告特別控除**:
   - 650,000 JPY (e-Tax), 550,000 JPY (giấy), 100,000 JPY (đơn giản) — Giữ nguyên, chính xác.
5. **Đặc lệ 20% Hóa đơn Invoice (インボイス2割特例)**:
   - Áp dụng trong kỳ chuyển tiếp cho hộ kinh doanh cá thể — Giữ nguyên, chính xác.

---

## 5. Confirmed Incorrect & Stale

1. **給与所得控除 2026**:
   - *Sai*: Biểu cũ tính theo mốc 1.625M / 1.8M / 3.6M với mức tối thiểu 650,000 JPY.
   - *Căn cứ chính thức*: 国税庁 No.1410 quy định rõ cho 令和8・9年分: Thu nhập <= 2,200,000 JPY được khấu trừ tối thiểu 740,000 JPY; các mốc 2.2M, 3.6M, 6.6M, 8.5M.
2. **基礎控除 2026**:
   - *Sai*: Dùng mức tạm thời 950,000 JPY của năm 2025 cho năm 2026.
   - *Căn cứ chính thức*: 国税庁 No.1199 cho 令和8年分 trở đi: Thu nhập <= 1.32M được khấu trừ 1,040,000 JPY; từ 1.32M đến 3.36M là 880,000 JPY; 3.36M đến 4.89M là 680,000 JPY; 4.89M đến 6.55M là 630,000 JPY; 6.55M đến 23.5M là 580,000 JPY, rồi giảm dần về 0.
3. **国民年金**:
   - *Sai*: 17,510 JPY/tháng (dữ liệu 令和7年度).
   - *Căn cứ chính thức*: 日本年金機構 công bố 令和8年度 (01/04/2026 – 31/03/2027) là 17,920 JPY/tháng (215,040 JPY/năm).
4. **雇用保険**:
   - *Sai*: 0.6% phần nhân viên.
   - *Căn cứ chính thức*: 厚生労働省 công bố mức đóng bảo hiểm thất nghiệp năm tài chính 令和8年度 cho ngành thông thường (一般の事業) phần người lao động chịu là 5/1000 (0.5%).
5. **協会けんぽ Fukuoka & Care & Child Support**:
   - *Sai*: Fukuoka ghi 10.25% thay vì 10.11%.
   - *Sai*: Gộp chung hoặc thiếuの子ども・子育て支援金 (0.23% toàn quốc từ 01/04/2026).
   - *Sai*: 介護保険料率 1.60% thay vì 1.62%.

---

## 6. Audit Trail: Corrections Applied

### Correction 1: 給与所得控除 2026 (NTA No.1410)
- **Tệp sửa đổi**: `packages/core/src/utils/tax/rules/2026/index.js`
- **Giá trị cũ**: `minGuarantee: 650000`, biểu bậc cũ 1.625M, 1.8M.
- **Giá trị mới**:
  - `salary <= 2,200,000`: `740,000 JPY`
  - `2,200,001 – 3,600,000`: `Math.floor(salary * 0.3 + 80,000)`
  - `3,600,001 – 6,600,000`: `Math.floor(salary * 0.2 + 440,000)`
  - `6,600,001 – 8,500,000`: `Math.floor(salary * 0.1 + 1,100,000)`
  - `> 8,500,000`: `1,950,000 JPY` (Trần tối đa)
- **Căn cứ**: `sourceId: 'nta-no1410-2026'`, 国税庁 No.1410 (令和8年分・令和9年分).
- **Kiểm thử**: 8 boundary test cases xác minh 100% khớp luật.

### Correction 2: 基礎控除 2026 (NTA No.1199)
- **Tệp sửa đổi**: `packages/core/src/utils/tax/rules/2026/index.js`
- **Giá trị cũ**: Khấu trừ cứng 950,000 JPY.
- **Giá trị mới**:
  - `totalIncome <= 1,320,000`: `1,040,000 JPY`
  - `1,320,001 – 3,360,000`: `880,000 JPY`
  - `3,360,001 – 4,890,000`: `680,000 JPY`
  - `4,890,001 – 6,550,000`: `630,000 JPY`
  - `6,550,001 – 23,500,000`: `580,000 JPY`
  - `23,500,001 – 24,000,000`: `480,000 JPY`
  - `24,000,001 – 24,500,000`: `320,000 JPY`
  - `24,500,001 – 25,000,000`: `160,000 JPY`
  - `> 25,000,000`: `0 JPY`
- **Căn cứ**: `sourceId: 'nta-no1199-2026'`, 国税庁 No.1199.
- **Kiểm thử**: 18 test cases kiểm thử từng mức bậc thang inclusive/exclusive.

### Correction 3: 国民年金 令和8年度
- **Tệp sửa đổi**: `packages/core/src/utils/tax/rules/2026/index.js`, `packages/core/src/utils/tax/engines/socialInsuranceEngine.js`
- **Giá trị cũ**: `17,510 JPY/tháng`
- **Giá trị mới**: `17,920 JPY/tháng` (năm: `215,040 JPY`)
- **Kỳ áp dụng**: `fiscal-year`, 2026-04-01 → 2027-03-31
- **Căn cứ**: `sourceId: 'jps-national-pension-2026'`, 日本年金機構.

### Correction 4: 雇用保険 令和8年度
- **Tệp sửa đổi**: `packages/core/src/utils/tax/rules/2026/index.js`, `packages/core/src/utils/tax/engines/socialInsuranceEngine.js`
- **Giá trị cũ**: Cố định `0.006` (0.6%)
- **Giá trị mới**: `employeeRate: 0.005` (0.5%), `employerRate: 0.0085` (0.85%), hỗ trợ cấu trúc ngành (`general`, `agriculture_forestry_sake`, `construction`).
- **Căn cứ**: `sourceId: 'mhlw-employment-rate-2026'`, 厚生労働省.

### Correction 5: 協会けんぽ Fukuoka, Child Support & Care Insurance
- **Tệp sửa đổi**: `packages/core/src/utils/tax/rules/locations/prefectureDefaults.js`, `packages/core/src/utils/tax/engines/socialInsuranceEngine.js`
- **Chi tiết**:
  - Fukuoka Kenpo Rate: `0.1011` (10.11%, chia đôi 5.055%).
  - Tách riêng `childSupportContribution`: `0.0023` (0.23%, chia đôi 0.115% từ 2026-04-01).
  - Tách riêng `careInsurance`: `0.0162` (1.62%, chia đôi 0.81% cho người 40–64 tuổi).
  - Trả về riêng biệt: `healthInsurance`, `childSupportContribution`, `careInsurance`, `welfarePension`, `employmentInsurance`.

---

## 7. Approximation & Limitation Disclosures

1. **Bảo hiểm y tế quốc dân (国民健康保険 - NHI)**:
   - Thực tế tính theo từng quận/huyện (市区町村), phụ thuộc độ tuổi, thu nhập tính thuế năm trước, và thành phần số người trong hộ gia đình.
   - Simulator áp dụng công thức 概算 (ước tính) tiêu chuẩn: 所得割 (~7.8% - 9.5%) + 均等割 (~45k - 58k) với mức trần 1,040,000 JPY.
   - Đã gắn cờ bắt buộc: `isEstimated: true`, `estimatedLabel: 'Estimated National Health Insurance / 国民健康保険（概算）'`, và hiển thị disclosure:
     `実際の保険料は市区町村によって異なります。`
2. **Thuế cư trú năm đầu**:
   - Thuế cư trú tính trên thu nhập năm trước. Người mới sang Nhật năm đầu tiên không phải đóng thuế cư trú. Simulator đã chú thích rõ điều này trong phần giải thích.

---

## 8. Effective-Date vs Applicable-Year Analysis

Theo thông báo chính thức của Quốc hội và Bộ Tài chính Nhật Bản liên quan đến 令和8年度税制改正:
- Luật có hiệu lực thi hành (Effective Date) từ ngày **01/12/2026**.
- Tuy nhiên, về mặt áp dụng thuế (Applicable Tax Year), các mức khấu trừ mới (給与所得控除 740k và 基礎控除 1.04M) được áp dụng cho **toàn bộ năm tính thuế 2026 (令和8年分所得税)** khi quyết toán cuối năm (年末調整 vào tháng 12/2026 hoặc 確定申告 vào tháng 2–3/2027).
- Về khấu trừ lương hàng tháng (源泉徴収): NTA quy định các tháng 1 đến 11/2026 vẫn khấu trừ theo bảng biểu cũ, và sẽ tính bù trừ dồn vào kỳ quyết toán cuối năm tháng 12/2026.
- **Giải pháp thiết kế của Toolio**: Sử dụng mô hình `EffectivePeriod` với `type: 'tax-year', taxYear: 2026` cho các công thức tính thuế cả năm của Simulator, đồng thời lưu `effectiveFrom: '2026-12-01'` trong metadata để phản ánh đúng thực tế pháp lý.

---

## 9. Golden Tests Added

Tệp: `packages/core/tests/regulatory-japan-tax-golden.test.js` (6 test suites, 32+ assertions):
1. `GOLDEN: NTA No.1410 Employment Income Deduction 2026 boundary conditions` (2.2M, 2.2M+1, 3.6M, 3.6M+1, 6.6M, 6.6M+1, 8.5M, 8.5M+1) -> PASS
2. `GOLDEN: NTA No.1199 Basic Deduction 2026 step-down boundary conditions` (1.32M, 3.36M, 4.89M, 6.55M, 23.5M, 24M, 24.5M, 25M) -> PASS
3. `GOLDEN: National Pension 2026 official rate 17,920 JPY/month and FY2026 period` -> PASS
4. `GOLDEN: Employment Insurance 2026 employee rate 0.5% (5/1000)` -> PASS
5. `GOLDEN: Kyokai Kenpo Fukuoka 10.11%, Child Support 0.23%, and Care Insurance 40-64 age boundary` (Age 39 vs 40 vs 64 vs 65) -> PASS
6. `GOLDEN: EffectivePeriod distinguishes calendar-year, tax-year and fiscal-year` -> PASS

---

## 10. Remaining Unknowns & Recommendation for Phase 3

- **Remaining Unknowns**:
  - Tỷ lệ chính thức của từng 市区町村 riêng lẻ cho 国民健康保険 năm 2026 (hiện tại toàn quốc có hơn 1,700 quận huyện, sẽ cần dataset chuyên biệt nếu muốn tính chính xác từng xã).
- **Recommendation for Phase 3**:
  - Không mở rộng municipality engine khi chưa có nhu cầu người dùng thực tế; duy trì nhãn 概算 minh bạch.
  - Khi triển khai Insurance Domain (Phase 3+), tái sử dụng các primitive `socialInsuranceEngine` đã được bóc tách độc lập và chính xác từ Phase 2.

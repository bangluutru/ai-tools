# Phase 02 — Regulatory Foundation & Japan Tax 2026 Audit Report

**Date**: 2026-09-10  
**Status**: **PHASE 2: PASS**  
**Working Workspace**: `ai-tools` monorepo  
**Baseline Git Tag**: `pre-regulatory-foundation-phase2-20260910` (Commit: `0ec1f65`)  
**Pipeline Status**: 100% PASS across Unit Tests, Golden Legal Tests, Build, Static Lint, Regulatory Gate V1, and Real-Browser Verification.

---

## 1. Baseline Checkpoint

Trước khi thực hiện bất kỳ thay đổi mã nguồn nào cho Phase 2, toàn bộ baseline của Phase 1 đã được kiểm chứng và đóng dấu checkpoint theo quy ước Git an toàn:

- **Baseline Commit**: `0ec1f65` (*"docs(phase1): add final domain group foundation acceptance report"*)
- **Baseline Git Tag**: `pre-regulatory-foundation-phase2-20260910`
- **Backup Branch**: `backup/pre-regulatory-foundation-phase2-20260910`
- **Baseline Verification Run**:
  - `npm test`: 74/74 passed (100%)
  - `npm run build:hub`: 11.04s, 0 errors
  - `npm run audit:miniapps`: 25/25 passed
  - `npm run graph:audit`: 0 circular dependencies, 0 cross-domain violations
  - Real Browser Smoke Tests: Hub, Japan Tax, PDF Toolkit, Image Convert, Tax Calculator all PASSED.

---

## 2. Files Added

| Tệp mới | Mục đích |
|---|---|
| `packages/core/src/regulatory/sourceRegistry.js` | Cơ sở dữ liệu nguồn pháp quy chính thức dùng chung (Official Source Registry, Tier-1 Primary) cho JP, VN |
| `packages/core/src/regulatory/ruleMetadata.js` | Hợp đồng định nghĩa quy chuẩn số và ràng buộc nguồn gốc (`RuleMetadataContract`) |
| `packages/core/src/regulatory/effectivePeriod.js` | Mô hình phân biệt rõ nét giữa `calendar-year`, `tax-year`, `fiscal-year` và `effective-date-range` |
| `packages/core/src/regulatory/jurisdiction.js` | Phân vùng tài phán quốc gia (`JP`, `VN`) và kiểm tra tính hợp lệ của đơn vị hành chính cấp tỉnh |
| `packages/core/src/regulatory/verification.js` | Bộ lọc quét placeholder, hằng số giả mạo (dummy/placeholder detection) và giám sát thời hạn kiểm chứng (staleness) |
| `packages/core/src/regulatory/index.js` | Cổng xuất khẩu tập trung cho tầng Regulatory Foundation |
| `packages/core/src/components/tax/RegulatorySourceSection.jsx` | Thành phần UI hiển thị căn cứ pháp lý, nguồn chính thức, kỳ áp dụng, và ghi chú ước tính 概算 |
| `packages/core/tests/regulatory-foundation.test.js` | Bộ kiểm thử đơn vị cho các nguyên thủy Regulatory Foundation (5 test suites) |
| `packages/core/tests/regulatory-japan-tax-golden.test.js` | Bộ kiểm thử vàng pháp lý (Golden Legal Tests) cho Thuế & BHXH Nhật Bản 2026 (6 test suites) |
| `docs/regulatory/JAPAN_TAX_2026_AUDIT.md` | Báo cáo kiểm toán chuyên sâu toàn bộ quy tắc thuế và bảo hiểm xã hội Nhật Bản 2026 |
| `docs/PHASE_02_REGULATORY_FOUNDATION_REPORT.md` | Báo cáo tổng kết nghiệm thu toàn diện Phase 2 |

---

## 3. Files Modified

| Tệp sửa đổi | Nội dung thay đổi |
|---|---|
| `packages/core/package.json` | Khai báo xuất khẩu chính thức `./regulatory/*` |
| `packages/core/src/index.js` | Tái xuất khẩu (re-export) các nguyên thủy Regulatory Foundation dùng chung |
| `packages/core/src/utils/tax/rules/2026/index.js` | Cập nhật chính xác biểu 給与所得控除 (NTA No.1410), 基礎控除 (NTA No.1199), Quốc dân hưu trí 17,920 JPY, Bảo hiểm thất nghiệp 0.5%, gỡ bỏ URL thô sang `sourceId` |
| `packages/core/src/utils/tax/engines/socialInsuranceEngine.js` | Tách riêng `healthInsurance`, `childSupportContribution` (0.23%), `careInsurance` (1.62%), gán nhãn `isEstimated` cho NHI, tương thích 100% năm 2025 |
| `packages/core/src/utils/tax/rules/locations/prefectureDefaults.js` | Cập nhật tỷ lệ 協会けんぽ Fukuoka về 10.11% (令和8年度) |
| `packages/core/src/components/JapanTaxSimulatorView.jsx` | Nhúng `RegulatorySourceSection` minh bạch căn cứ pháp lý mà không làm xáo trộn giao diện chính |
| `scripts/audit-miniapp.mjs` | Mở rộng hệ thống kiểm duyệt tĩnh với **Gate R (Regulatory Gate V1)** |

---

## 4. Regulatory Architecture

Kiến trúc Regulatory Foundation được thiết kế tối giản, tập trung vào tính sử dụng thực tế và tính xác thực cao:

```
packages/core/src/regulatory/
├── sourceRegistry.js     -> Quản lý nguồn chính thức (Tier-1 Primary: e-Gov, NTA, MHLW, JPS, Kenpo...)
├── ruleMetadata.js       -> Hợp đồng metadata: id, jurisdiction, sourceId, effectiveFrom, applicablePeriod, version, lastVerifiedAt
├── effectivePeriod.js    -> Phân tách rõ tax-year (2026年分) vs fiscal-year (令和8年度) vs effective-date-range (01/12/2026)
├── jurisdiction.js       -> Phân vùng tài phán JP/VN và kiểm tra mã tỉnh thành
├── verification.js       -> Bộ phát hiện hằng số dummy/placeholder và cảnh báo quy tắc quá hạn kiểm chứng
└── index.js              -> Single entrypoint
```

---

## 5. Japan Tax Audit Summary

Kiểm toán có hệ thống đã phát hiện và đính chính các lỗi dữ liệu quá hạn trong bộ quy tắc 2026:
1. **給与所得控除 (Employment Income Deduction)**:
   - Sửa mức sàn từ 650,000 JPY lên 740,000 JPY (thu nhập <= 2.2M JPY).
   - Chuẩn hóa các bậc 2.2M, 3.6M, 6.6M, 8.5M theo đúng 国税庁 No.1410 (令和8・9年分).
2. **基礎控除 (Basic Personal Deduction)**:
   - Sửa mức giảm trừ từ 950,000 JPY (tạm thời 2025) thành biểu bậc thang 1,040,000 JPY (<= 1.32M) giảm dần về 0 JPY theo đúng 国税庁 No.1199 (令和8年分以降).
3. **国民年金 (National Pension)**:
   - Sửa mức thu phí từ 17,510 JPY lên 17,920 JPY/tháng (215,040 JPY/năm) áp dụng cho năm tài chính 令和8年度 (2026-04-01 đến 2027-03-31).
4. **雇用保険 (Employment Insurance)**:
   - Cập nhật tỷ lệ phần nhân viên chịu từ 0.6% thành 0.5% (5/1000) theo quyết định của 厚生労働省 cho 令和8年度.
5. **協会けんぽ & Care & Child Support**:
   - Cập nhật Fukuoka Kenpo về 10.11%.
   - Bổ sung tách biệt `childSupportContribution` (子ども・子育て支援金 0.23%, chia đôi 0.115% từ 01/04/2026).
   - Tách biệt `careInsurance` (1.62%, chia đôi 0.81% cho độ tuổi 40–64).

---

## 6. Before / After Comparison (5 Representative Scenarios)

| Kịch bản kiểm thử | 2025 (Trước sửa đổi) | 2026 (Sau kiểm toán & sửa) | Chênh lệch thực nhận | Nguyên nhân cốt lõi |
|---|---|---|---|---|
| **1. Nhân viên lương thấp (2.2M JPY, Tokyo, 30t)** | Take-home: 1,765,834 JPY<br>Thuế: 109,886 JPY<br>BHXH: 324,280 JPY | Take-home: 1,785,924 JPY<br>Thuế: 89,466 JPY<br>BHXH: 324,610 JPY | **+20,090 JPY** | Khấu trừ lương tối thiểu tăng từ 650k lên 740k; Khấu trừ cơ bản tăng từ 950k lên 1.04M. |
| **2. Nhân viên lương trung bình (4.5M JPY, Tokyo, 30t)** | Take-home: 3,517,814 JPY<br>Thuế: 318,886 JPY<br>BHXH: 663,300 JPY | Take-home: 3,540,929 JPY<br>Thuế: 295,096 JPY<br>BHXH: 663,975 JPY | **+23,115 JPY** | Khấu trừ lương tăng theo bậc mới; Bảo hiểm thất nghiệp giảm từ 0.6% xuống 0.5%, bù trừ cho 0.115% hỗ trợ con cái. |
| **3. Nhân viên lương cao (10M JPY, Tokyo, 30t)** | Take-home: 7,237,231 JPY<br>Thuế: 1,490,069 JPY<br>BHXH: 1,272,700 JPY | Take-home: 7,256,759 JPY<br>Thuế: 1,469,041 JPY<br>BHXH: 1,274,200 JPY | **+19,528 JPY** | Trần khấu trừ lương chạm mốc 1.95M; Khấu trừ cơ bản bước sang mốc 580k. |
| **4. So sánh tuổi (4M JPY, Fukuoka): 39 tuổi vs 45 tuổi** | **39 tuổi**: Take-home 3,141,530 JPY<br>**45 tuổi**: Take-home 3,114,364 JPY | **39 tuổi**: Take-home 3,161,350 JPY<br>**45 tuổi**: Take-home 3,133,884 JPY | **+19,820 JPY** (39t)<br>**+19,520 JPY** (45t) | Người từ 40–64 tuổi chịu thêm bảo hiểm chăm sóc (介護保険 1.62% / 2 = 32,400 JPY). Fukuoka chuẩn hóa về 10.11%. |
| **5. Cá nhân kinh doanh tự do (Doanh thu 5M, Chi phí 1.5M)** | Take-home: 4,053,665 JPY<br>Thuế: 451,755 JPY<br>BHXH: 494,580 JPY | Take-home: 4,070,176 JPY<br>Thuế: 430,324 JPY<br>BHXH: 499,500 JPY | **+16,511 JPY** | Quốc dân hưu trí tăng từ 17,510 lên 17,920 JPY/tháng (+4,920 JPY/năm); Khấu trừ cơ bản 2026 tăng giúp giảm thuế thu nhập. |

---

## 7. Approximation & Limitation Disclosures

- **Bảo hiểm y tế quốc dân (NHI)**: Giữ nguyên mô hình ước tính nhưng gán nhãn minh bạch:
  - `isEstimated: true`
  - `estimatedLabel: 'Estimated National Health Insurance / 国民健康保険（概算）'`
  - `disclosureNote: '実際の保険料は市区町村によって異なります。'`
- **Thành phần nguồn chính thức**: Tích hợp `RegulatorySourceSection` có thể thu gọn/mở rộng ngay trên giao diện `JapanTaxSimulatorView` để người dùng tra cứu trực tiếp đường link tới 国税庁, 厚労省, 日本年金機構, 協会けんぽ.

---

## 8. Golden Legal Tests Results

Chạy thông qua `node --test packages/core/tests/regulatory-japan-tax-golden.test.js`:
```
✔ GOLDEN: NTA No.1410 Employment Income Deduction 2026 boundary conditions (8 boundaries)
✔ GOLDEN: NTA No.1199 Basic Deduction 2026 step-down boundary conditions (18 boundaries)
✔ GOLDEN: National Pension 2026 official rate 17,920 JPY/month and FY2026 period
✔ GOLDEN: Employment Insurance 2026 employee rate 0.5% (5/1000)
✔ GOLDEN: Kyokai Kenpo Fukuoka 10.11%, Child Support 0.23%, and Care Insurance 40-64 age boundary
✔ GOLDEN: EffectivePeriod distinguishes calendar-year, tax-year and fiscal-year
All 6 Golden Test Suites PASSED (0 failures, 100% deterministic).
```

---

## 9. Regulatory Gate V1 Results

Tích hợp vào `scripts/audit-miniapp.mjs`:
- Kiểm tra quốc gia `country` hợp lệ trong `['JP', 'VN']`.
- Kiểm tra `domain` định danh.
- Kiểm tra sự hiện diện của các nguồn trong `OfficialSourceRegistry`.
- Kiểm tra quy chuẩn không chứa hằng số giả lập/placeholder (`TODO rate`, `dummy rate`, `sample rate`, etc.).
- Kiểm tra tệp kiểm thử vàng pháp lý (`tests/regulatory-japan-tax-golden.test.js`).
- **Kết quả**: `japan-tax-simulator` đạt chuẩn 5 cổng tuyệt đối: `G0: PASS`, `G1: PASS`, `G2: PASS`, `G3: PASS`, `GR: PASS` (`ALL PASS`).

---

## 10. Full Verification Suite Summary

1. **Unit Tests Toàn Bộ Repo**:
   - `hub/tests/`: 74/74 tests PASSED
   - `packages/core/tests/`: 229/229 tests PASSED
2. **Production Build**:
   - `npm run build:hub`: Hoàn thành trong 11.52s, 0 lỗi, bundle phân tách tối ưu.
3. **Audit Miniapps & Regulatory Gate V1**:
   - `npm run audit:miniapps`: 25/25 miniapps PASS, 0 fail.
4. **Kiến Trúc Đồ Thị Phụ Thuộc (Dependency Graph)**:
   - `npm run graph:audit`: 0 circular dependencies, 0 cross-domain violations.
5. **Kiểm Thử Trình Duyệt Thật (Real-Browser Smoke & Gate 4)**:
   - `npm run test:browser:tool -- japan-tax-simulator`: 100% PASS (Initial + Dynamic WCAG AA 0 violations, responsive iOS/Android zero overflow, theme switching Dark/Light).

---

## 11. Rollback Information

Trường hợp khẩn cấp cần đưa hệ sinh thái về trạng thái trước Phase 2:
```bash
git checkout main
git reset --hard pre-regulatory-foundation-phase2-20260910
npm run audit:miniapps
npm run build:hub
```
Checkpoint được lưu an toàn tại tag: `pre-regulatory-foundation-phase2-20260910` và nhánh `backup/pre-regulatory-foundation-phase2-20260910`.

---

## 12. Remaining Technical Debt & Proposed Phase 3

- **Kế thừa cho Phase 3 (Insurance & Pension Domain)**:
  - Tầng `socialInsuranceEngine.js` hiện tại đã bóc tách rõ ràng các đầu ra `healthInsurance`, `childSupportContribution`, `careInsurance`, `welfarePension`, `employmentInsurance`. Trong Phase 3, có thể tái xuất khẩu mượt mà sang `packages/core/src/utils/insurance/` mà không gây breaking change cho `japan-tax-simulator`.
  - Tầng Regulatory Foundation sẵn sàng hỗ trợ việc mở rộng sang các công cụ pháp lý mới (bảo hiểm y tế, trợ cấp, thuế Việt Nam).

---

## KẾT LUẬN

```
PHASE 2: PASS
```
Toàn bộ các mục tiêu đặt ra cho Phase 2 đã hoàn thành trọn vẹn, không phá vỡ tính tương thích ngược của năm 2025, bảo tồn tuyệt đối 100% các công cụ hiện hữu và vượt qua toàn bộ các cổng kiểm định chất lượng khắt khe nhất của Toolio.

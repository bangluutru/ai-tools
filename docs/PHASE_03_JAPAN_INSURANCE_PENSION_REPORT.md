# Báo Cáo Nghiệm Thu Toàn Diện Phase 3: Japan Life → Insurance & Pension (保険・年金)

> **Mã tài liệu**: `docs/PHASE_03_JAPAN_INSURANCE_PENSION_REPORT.md`  
> **Thời điểm hoàn thành**: 2026-09-10  
> **Tác giả**: Toolio Architecture & Regulatory Engineering Team  
> **Kết luận nghiệm thu**: **PHASE 3 — PASS**

---

## 1. Executive Summary

Phase 3 đã mở rộng thành công nền tảng **Regulatory Foundation** (được kiểm chứng tại Phase 2) để kiến tạo toàn diện tên miền chuyên sâu đầu tiên:  
**Japan Life (`japan-life`) → Insurance & Pension (`insurance`)**.

Quá trình triển khai tuân thủ tuyệt đối quy tắc **Milestone Gating** nghiêm ngặt:
$$\text{Implement} \longrightarrow \text{Test} \longrightarrow \text{Verify} \longrightarrow \text{Checkpoint} \longrightarrow \text{Next Milestone}$$

### Các thành tựu cốt lõi:
1. **04 Mini-apps hoàn toàn mới** được xuất bản đạt chuẩn **100% Client-Side**, **Zero LLM**, **Zero Dummy Rate**:
   - `social-insurance-jp` (社会保険料シミュレーター): Tính toán 5 phân hệ BHXH doanh nghiệp (BHYT Kyokai Kenpo 47 tỉnh, Quỹ hỗ trợ nuôi con 2026, Chăm sóc người cao tuổi, Hưu trí Kosei Nenkin & Thất nghiệp) theo chuẩn thù lao tháng.
   - `social-insurance-eligibility-jp` (社会保険加入判定): Chẩn đoán điều kiện bắt buộc tham gia BHXH cho người làm thêm, Part-time theo chuẩn mở rộng tháng 10/2026.
   - `national-pension-jp` (国民年金ガイド＆保険料シミュレーター): Tra cứu biểu phí hưu trí quốc dân FY2026 (17,920円/tháng), mức giảm trừ nộp trước (前納), quyền lợi lương hưu theo các chế độ miễn giảm và quy tắc truy nộp 10 năm.
   - `dependent-insurance-jp` (社会保険の扶養判定): Chẩn đoán điều kiện làm người phụ thuộc BHYT (0円 đóng bảo hiểm) theo quan hệ thân nhân 3 đời, trần thu nhập tương lai 130 vạn/180 vạn và quan hệ chu cấp kinh tế. Tách biệt hoàn toàn với thuế.
2. **Tuân thủ ranh giới miền tuyệt đối (Zero Cross-Domain Imports)**: Tên miền `insurance` không import bất kỳ tệp tin nào từ `tax`. Phép liên kết sang thuế được thực hiện hoàn toàn thông qua deep-link / hash navigation (`#/tools/japan-tax-simulator`).
3. **Nghiên cứu kiến trúc Quốc dân Bảo hiểm Y tế (NHI)**: Hoàn thành tài liệu phân tích chuyên sâu tại `docs/phase3/JAPAN_NHI_ARCHITECTURE_RESEARCH.md`, kiên quyết từ chối xây dựng máy tính giả định trên tỷ lệ bình quân toàn quốc.
4. **Hạ tầng kiểm thử toàn diện**: Bổ sung 25 Regulatory Golden Tests bao quát các ngưỡng biên pháp định (Boundary tests, Age 39/40/64/65/75, Brackets 1–50, Chiết khấu trước hạn, Miễn nộp, Quan hệ thân nhân).

---

## 2. Pre-Implementation Review & Các Quyết Định Kiến Trúc

Tại Gate 0, tài liệu `docs/phase3/PHASE_03_PRE_IMPLEMENTATION_REVIEW.md` đã rà soát và trả lời đầy đủ 8 câu hỏi kiểm soát:
1. **Khả năng tái sử dụng của Regulatory Source Registry**: Đạt 100%. Mở rộng đăng ký các nguồn chính thống từ MHLW, Nenkin, Kyokai Kenpo.
2. **Khả năng hỗ trợ phạm vi ngày/năm tài chính (Fiscal Year Ranges)**: Hỗ trợ linh hoạt thông qua hàm `resolveApplicableRule(rules, { applicableDate, year })`.
3. **Resolve bằng Applicable Date**: Giải quyết chính xác các mốc biên 2026-03-31 vs 2026-04-01 (thay đổi tỷ lệ BHYT, Bảo hiểm thất nghiệp và áp dụng Quỹ hỗ trợ nuôi con).
4. **Tách biệt Social Insurance khỏi Tax**: Đảm bảo các logic bảo hiểm cũ của Tax không bị phụ thuộc chéo; `insurance` domain xây mới độc lập trên `packages/core/src/japan/insurance/`.
5. **Cross-domain Dependency Isolation**: Phân tích bằng `npm run graph:audit` xác nhận 0 vi phạm cross-domain.
6. **Shared Design Components**: Tái sử dụng `StandardToolLayout`, `RegulatorySourceView`, `Badge`, `Alert`, `MetricCard` từ `@ai-tools/core`.
7. **Khả năng áp dụng Regulatory Gate**: Áp dụng chặt chẽ cho toàn bộ 4 miniapp mới (Gate 1, 2, 3, 4 + Regulatory Gate).
8. **Technical Debt**: Đã chuẩn hóa token màu WCAG AA contrast (tránh `text-emerald-600` / `text-rose-600` trên nền sáng, dùng `text-emerald-800 dark:text-emerald-300` / `text-rose-700 dark:text-rose-300`).

---

## 3. Danh Sách Tệp Tin Bổ Sung & Chỉnh Sửa

### 3.1. Engine & Rules mới (`packages/core/src/japan/insurance/`):
- `rules/standardRemunerationGrades.js`: 50 cấp tiêu chuẩn thù lao tháng BHYT (58k - 1.39M) & 32 cấp Hưu trí Kosei Nenkin (88k - 650k) theo bảng chính thức Nenkin / Kenpo.
- `rules/kyoukaikenpoRates2026.js`: Tỷ lệ BHYT 47 tỉnh thành FY2026 (Tokyo: 9.98%, Osaka: 10.34%, Fukuoka: 10.27%, Saga: 10.51%...), Quỹ nuôi con (0.23%), Phí chăm sóc 40-64 tuổi (1.60%).
- `rules/employmentInsuranceRates.js`: Biểu phí Bảo hiểm thất nghiệp MHLW FY2026 (Chung: 5/1000 người LĐ, 8.5/1000 người SDLĐ; Nông lâm thủy sản/chế biến rượu; Xây dựng).
- `rules/pensionRates.js`: Tỷ lệ 厚生年金 cố định 18.3% (Người LĐ: 9.15%, Doanh nghiệp: 9.15%).
- `rules/eligibilityRules.js`: Ngưỡng tuần 20 giờ, tháng 8.8 vạn, quy mô doanh nghiệp 51+ người, thời hạn hợp đồng, đối tượng học sinh sinh viên.
- `rules/nationalPensionRates.js`: Biểu phí Quốc dân hưu trí FY2026 (17,920円/tháng) & FY2025 (17,510円/tháng), bảng chiết khấu nộp trước 6 tháng/1 năm/2 năm qua tài khoản/thẻ/tiền mặt, tỷ lệ phản ánh lương hưu của 7 nhóm miễn giảm, phí nộp thêm 付加保険料 (+400円/tháng $\rightarrow$ +200円/năm vào lương hưu trọn đời).
- `rules/dependentInsuranceRules.js`: Phân nhóm quan hệ thân nhân 3 đời (1st/2nd degree không yêu cầu sống chung vs 3rd degree / thông gia yêu cầu sống chung), trần tuổi 75 chuyển sang Y tế tuổi già, miễn trừ điều kiện cư trú trong nước (du học, đi cùng người thân, tình nguyện viên quốc tế).
- `engines/socialInsuranceEngine.js`: Engine mô phỏng chi phí BHXH phân tách rõ góc nhìn Người lao động vs Doanh nghiệp.
- `engines/socialInsuranceEligibilityEngine.js`: Engine chẩn đoán điều kiện tham gia BHXH bắt buộc trả về 4 trạng thái (`mandatory`, `not_mandatory`, `case_dependent`, `insufficient_info`).
- `engines/nationalPensionEngine.js`: Engine tính toán chiết khấu nộp trước, số tiền tích lũy và tỷ lệ hưởng lương hưu quốc dân.
- `engines/dependentInsuranceEngine.js`: Engine chẩn đoán tư cách người phụ thuộc BHYT với trần 1.3M / 1.8M JPY, gói cứu trợ thu nhập làm thêm tạm thời (一時的な収入変動), và tỷ lệ phụ thuộc tài chính.
- `index.js`: Điểm xuất khẩu đồng nhất cho toàn bộ miền bảo hiểm Nhật Bản.

### 3.2. Thành phần giao diện & Hub Tool Wrappers:
- `packages/core/src/components/insurance/SocialInsuranceSimulatorView.jsx`
- `packages/core/src/components/insurance/SocialInsuranceEligibilityView.jsx`
- `packages/core/src/components/insurance/NationalPensionView.jsx`
- `packages/core/src/components/insurance/DependentInsuranceView.jsx`
- `hub/src/tools/social-insurance-jp/SocialInsuranceSimulatorTool.jsx`
- `hub/src/tools/social-insurance-eligibility-jp/SocialInsuranceEligibilityTool.jsx`
- `hub/src/tools/national-pension-jp/NationalPensionTool.jsx`
- `hub/src/tools/dependent-insurance-jp/DependentInsuranceTool.jsx`
- `hub/src/config/toolsRegistry.js`: Khai báo 4 công cụ thuộc `group: 'japan-life'`, `domain: 'insurance'`, `regulatory: true`, `readiness: 'beta'`, `verified: true`.
- `hub/src/config/toolIcons.js`: Bổ sung các icon Lucide tương ứng (`ShieldCheck`, `UserCheck`, `PiggyBank`, `HeartHandshake`).
- `hub/src/App.jsx`: Lazy-load và định tuyến thành phần trong `toolComponentMap`.

### 3.3. Kiểm thử & Quản trị:
- `packages/core/tests/regulatory-japan-insurance-golden.test.js`: 25 Golden Tests bao quát toàn bộ 4 miniapp.
- `hub/tests/miniapp-governance.test.js`: Cập nhật danh sách 15 verified miniapps.
- `hub/tests/tool-filter.test.js`: Kiểm tra bộ lọc `japan-life` (5 công cụ), tổng số 23 công cụ hoạt động và kiểm thử tìm kiếm đa ngôn ngữ (JA, EN, VI).
- `hub/tests/tools-registry.test.js`: Xác minh tính nhất quán của `japanLifeTools`.

---

## 4. Bảng Kiểm Tra Nguồn Quy Chuẩn Chính Thống (Official Regulatory Sources)

Tất cả dữ liệu được neo chặt chẽ vào **OfficialSourceRegistry** (`packages/core/src/regulatory/sourceRegistry.js`):

| Source ID | Cơ quan ban hành (Authority) | Tên quy định chính thức | Hiệu lực áp dụng | Trạng thái xác minh |
| :--- | :--- | :--- | :--- | :--- |
| `nenkin-standard-remuneration-2026` | 日本年金機構 | 令和8年度 厚生年金保険料額表（標準報酬月額等級表） | 2026-04-01 $\rightarrow$ 2027-03-31 | PASS (2026-09-10) |
| `kyoukaikenpo-rates-2026` | 全国健康保険協会 | 令和8年度 都道府県別健康保険・介護保険料率表 | 2026-04-01 $\rightarrow$ 2027-03-31 | PASS (2026-09-10) |
| `mhlw-employment-insurance-2026` | 厚生労働省 | 令和8年度 雇用保険料率のご案内 | 2026-04-01 $\rightarrow$ 2027-03-31 | PASS (2026-09-10) |
| `mhlw-shakai-hoken-tekiyou-2026` | 厚生労働省・日本年金機構 | 社会保険適用拡大特設サイト・短時間労働者の適用要件 | 2026-04-01 $\rightarrow$ | PASS (2026-09-10) |
| `nenkin-national-pension-2026` | 日本年金機構 | 令和8年度 国民年金保険料額・前納割引額一覧表 | 2026-04-01 $\rightarrow$ 2027-03-31 | PASS (2026-09-10) |
| `kyoukaikenpo-dependent-2026` | 全国健康保険協会・日本年金機構 | 被扶養者認定要件（収入基準・国内居住要件・生計維持要件） | 2026-04-01 $\rightarrow$ | PASS (2026-09-10) |

---

## 5. Kết Quả Kiểm Thử & Nghiệm Thu Theo Từng Milestone

```
Phase 3 Roadmap:
[C0] Pre-Review ──► [C1] Simulator ──► [C2] Eligibility ──► [C3] National Pension ──► [C4] Dependent ──► [C5] Final Pass
```

| Milestone | Tên Mini-app / Hạng mục | Unit & Golden Tests | Static Audit (Gates 1-3) | Production Build | Browser Gate 4 | Checkpoint Tag |
| :--- | :--- | :---: | :---: | :---: | :---: | :--- |
| **M0** | Pre-Implementation Review | 71/71 PASS | ALL PASS | 10.8s PASS | ALL PASS | `pre-japan-insurance-phase3-20260910` |
| **M1** | 社会保険料シミュレーター (`social-insurance-jp`) | 12/12 Golden PASS | ALL PASS | 11.2s PASS | 100% PASS | `phase3-social-insurance-simulator-pass` |
| **M2** | 社会保険加入判定 (`social-insurance-eligibility-jp`) | 15/15 Golden PASS | ALL PASS | 11.4s PASS | 100% PASS | `phase3-social-insurance-eligibility-pass` |
| **M3** | 国民年金ガイド (`national-pension-jp`) | 18/18 Golden PASS | ALL PASS | 11.5s PASS | 100% PASS | `phase3-national-pension-pass` |
| **M4** | 社会保険の扶養判定 (`dependent-insurance-jp`) | 25/25 Golden PASS | ALL PASS | 11.6s PASS | 100% PASS | `phase3-dependent-insurance-pass` |
| **Final** | Toàn bộ Suite & Nghiên cứu NHI | **329/329 PASS** | **ALL PASS** | **11.64s PASS** | **100% PASS** | `phase3-japan-insurance-final-pass` |

### Thống kê kiểm thử cuối cùng:
- **Core Tests**: 254 / 254 tests PASS.
- **Hub & Governance Tests**: 75 / 75 tests PASS.
- **Tổng số Unit / Regression Tests**: **329 / 329 tests PASS (100%)**.
- **Mini-app Audit**: 29 / 29 miniapps đạt chuẩn tĩnh. Toàn bộ 4 miniapp mới đạt `ALL PASS` (Gate 1, Gate 2, Gate 3, Gate 4, Regulatory Gate).
- **Graph Audit**: 0 vi phạm biên giới miền, 0 vòng phụ thuộc (circular dependencies), 100% tệp tin tham chiếu hợp lệ.
- **Browser Automation (Puppeteer)**: 100% PASS trên Desktop (1440x900), Mobile iOS (390x844), Mobile Android (360x800), axe-core WCAG 2.1 AA 0 lỗi, Zero horizontal overflow.

---

## 6. Rà Soát Phụ Thuộc Chéo Tên Miền (Cross-Domain Dependency Review)

Kiểm tra nghiêm ngặt sự cô lập giữa `tax` và `insurance`:
- Không có bất kỳ phát biểu `import ... from '../tax/...'` nào trong mã nguồn `packages/core/src/japan/insurance/`.
- Không có bất kỳ phát biểu `import ... from '../insurance/...'` nào trong mã nguồn `packages/core/src/utils/tax/`.
- Tại giao diện `DependentInsuranceView.jsx`, người dùng được cung cấp liên kết tham khảo điều hướng:
  > *「Đây là công cụ kiểm tra người phụ thuộc theo Luật Bảo hiểm Xã hội (健康保険・厚生年金). Nếu bạn muốn kiểm tra người phụ thuộc theo Luật Thuế Thu nhập (税法上の扶養), vui lòng mở Mô Phỏng Thuế Nhật Bản.」*  
  Liên kết này trỏ về hash router `#/tools/japan-tax-simulator`, hoàn toàn không tạo liên kết mã nguồn (source coupling).

---

## 7. Kết Quả Nghiên Cứu Bảo Hiểm Y Tế Quốc Dân (NHI Research Outcome)

Tài liệu [JAPAN_NHI_ARCHITECTURE_RESEARCH.md](file:///Users/tranhaibang/.gemini/antigravity-ide/scratch/ai-tools/docs/phase3/JAPAN_NHI_ARCHITECTURE_RESEARCH.md) đã phân tích:
1. Tính chất phân mảnh cao của phí NHI qua 1,718 xã/phường/thị trấn (市区町村).
2. Công thức kết hợp 3 phân hệ (Y tế, Hỗ trợ tuổi già, Chăm sóc) và 4 phương thức thu (所得割, 均等割, 平等割, 資産割).
3. Cơ chế trách nhiệm nộp của Chủ hộ (世帯主納付義務) và các mức trần luật định (Tổng trần 1,060,000円/năm).
4. Khuyến nghị chiến lược: Không xây dựng calculator ước lượng trung bình. Thay vào đó, trong Phase 4 sẽ kết hợp giữa **Interactive Rule-based Guide** (cho phép người dùng nhập thông số từ Giấy báo thuế) và **Dataset chọn lọc cho các đô thị lớn** (23 đặc khu Tokyo, Osaka, Nagoya, Fukuoka) khi có pipeline kiểm duyệt nguồn tin cậy.

---

## 8. Các Giới Hạn Đã Được Khai Báo Rõ Ràng (Known Limitations)

Mọi công cụ đều hiển thị rõ disclaimer pháp lý và giới hạn kỹ thuật:
1. **Phạm vi bảo hiểm y tế**: Mini-app 1 hiện hỗ trợ biểu phí tiêu chuẩn của **Hiệp hội Bảo hiểm Y tế Toàn quốc (協会けんぽ)**; chưa hỗ trợ biểu phí riêng của từng Công đoàn Bảo hiểm Y tế đặc thù (健康保険組合 / 単一健保).
2. **Khấu trừ thực tế**: Số tiền trừ trên bảng lương thực tế có thể có sự sai lệch nhỏ do thời điểm xác định thù lao định kỳ (定時決定 - 算定基礎届), thay đổi bất thường (随時改定 - 月変届), hoặc phương thức làm tròn số tiền lẻ của từng phần mềm chấm công doanh nghiệp.
3. **Phí chăm sóc người cao tuổi từ 65 tuổi**: Mini-app giải thích rõ người từ 65 tuổi trở lên (介護保険第1号被保険者) sẽ đóng bảo hiểm chăm sóc trực tiếp cho chính quyền địa phương cư trú (trừ lương hưu hoặc nộp qua giấy báo thuế), không còn trừ qua lương doanh nghiệp như giai đoạn 40–64 tuổi.

---

## 9. Danh Sách Rollback Checkpoints Đã Lưu

Trong suốt quá trình triển khai, 5 Git Checkpoint Tags đã được thiết lập để đảm bảo khả năng hoàn tác nhanh chóng khi có sự cố:
- `pre-japan-insurance-phase3-20260910`: Trạng thái baseline xanh trước khi viết mã nguồn bảo hiểm.
- `phase3-social-insurance-simulator-pass`: Checkpoint sau khi hoàn thành Mini-app 1.
- `phase3-social-insurance-eligibility-pass`: Checkpoint sau khi hoàn thành Mini-app 2.
- `phase3-national-pension-pass`: Checkpoint sau khi hoàn thành Mini-app 3.
- `phase3-dependent-insurance-pass`: Checkpoint sau khi hoàn thành Mini-app 4.
- `phase3-japan-insurance-final-pass`: Checkpoint cuối cùng hoàn tất toàn bộ Phase 3.

---

## 10. Khuyến Nghị Cho Phase 4 (Recommendations for Phase 4)

1. **Chuẩn bị hạ tầng Dữ liệu Đô thị (Municipal Data Pipeline)** cho Bảo hiểm Y tế Quốc dân (NHI) bắt đầu từ Tokyo 23 Ku.
2. **Nghiên cứu mở rộng tên miền Lao động & Trợ cấp (Japan Life → Employment & Labor)**:
   - Trợ cấp thất nghiệp & Thủ tục thôi việc (失業保険・離職票ナビゲーター).
   - Hướng dẫn chế độ thai sản và nghỉ nuôi con (産休・育休手当金シミュレーター).
3. **Giữ vững nguyên tắc cốt lõi của Toolio**: Browser-first, Không gửi dữ liệu cá nhân lên server, 100% minh bạch nguồn luật.

---
*Tài liệu này xác nhận hoàn tất nghiệm thu toàn bộ Phase 3 của dự án Toolio.*

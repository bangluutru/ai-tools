# BÁO CÁO PHÁT HÀNH CHÍNH THỨC: JAPAN LIFE V1 PRODUCTION STABLE
**Toolio Engineering Ecosystem — Phase 10 Final Release**  
*Thời điểm phát hành: 2026-09-11 | Trạng thái: PRODUCTION STABLE (PASS 100%)*

---

## 1. TỔNG QUAN PHÁT HÀNH (EXECUTIVE RELEASE SUMMARY)

Toolio — **Japan Life V1** đã chính thức hoàn thành toàn diện quy trình **Phase 10: Hardening, Audit & Production Stable**.  
Sau chuỗi kiểm duyệt nghiêm ngặt qua 10 mốc kiểm toán (M1 – M10) và 8 Cổng kiểm duyệt phát hành (Release Gates G1 – G8), toàn bộ hệ thống giải pháp hỗ trợ cuộc sống người nước ngoài tại Nhật Bản được xác nhận đạt chuẩn ổn định thương mại, vận hành thuần client-side, bảo vệ quyền riêng tư tuyệt đối, và tuân thủ chuẩn xác hệ thống pháp quy Nhật Bản (Reiwa 8 / 2026).

### Các chỉ số then chốt của bản phát hành:
- **Trạng thái phát hành**: `PRODUCTION STABLE`
- **Mã phát hành (Git Tag)**: `japan-life-v1.0.0-stable`
- **Release Candidate Tag**: `japan-life-v1-rc1` (Checkpoint C8)
- **Baseline Snapshot Tag**: `pre-japan-life-v1-hardening` (Checkpoint C0)
- **Tổng số công cụ Japan Life**: **34 miniapps** (33 chuyên biệt + 1 Central Conductor `japan-life-navigator`)
- **Canonical Life Events**: **7 sự kiện đời sống liên miền** (`life.jp.*`)
- **Capabilities chuẩn hóa**: **41 năng lực chức năng** (100% deep-linkable, 0 broken)
- **Thủ tục hành chính**: **5 thủ tục chính thống** (100% nguồn ISA/MHLW/MIC)
- **Biểu mẫu & Văn bản**: **17 tài liệu hành chính mẫu** (100% hướng dẫn song ngữ & checklist)
- **Căn cứ pháp lý chính thức**: **55 văn bản pháp quy** (100% có cơ quan ban hành, điều khoản & chu kỳ soát xét)
- **Tổng số bài kiểm thử tự động**: **651/651 tests PASSED** (Core: 576/576, Hub: 75/75, 100% pass)
- **Kiểm duyệt tĩnh Miniapp**: **58/58 miniapps PASSED** (0 Failures)
- **Kiểm thử trình duyệt thật (Chrome + Puppeteer)**: **100% PASS** (WCAG 2.1 AA 0 errors, 0 mobile overflow)

---

## 2. BẢNG ĐÁNH GIÁ 8 CỔNG KIỂM DUYỆT PHÁT HÀNH (RELEASE GATES MATRIX)

| Cổng Kiểm Duyệt (Gate) | Tiêu chuẩn Đánh giá | Kết quả Đo kiểm | Đánh giá |
|---|---|---|:---:|
| **Gate 1: Build & Packaging** | `npm run build:hub` 0 lỗi, bundle splitting chuẩn, tree-shaking tối ưu, chunking đúng chuẩn | Xây dựng thành công trong **11.57s**, không lỗi cú pháp hoặc cảnh báo nghiêm trọng. | **PASS** |
| **Gate 2: Static & Automated Tests** | Toàn bộ unit/integration test suites pass 100%, 0 test bị disable, 0 warning chưa giải quyết | **651/651 tests PASSED** (576 core tests + 75 hub tests). `audit:miniapps` 58/58 pass. | **PASS** |
| **Gate 3: Architecture & Coupling** | Không phụ thuộc vòng (0 circular deps), Navigator tách biệt domain logic, Generic LifeEventRuntime | `npm run graph:audit` ghi nhận **0 circular dependencies**. Navigator thuần orchestration. | **PASS** |
| **Gate 4: Regulatory Integrity** | 100% căn cứ pháp lý còn hiệu lực, 0 văn bản hết hạn, golden test matrix bao phủ các ngưỡng pháp luật | **55/55 nguồn pháp lý xác thực**, 0 văn bản stale. 8/8 canonical golden journeys kiểm chứng. | **PASS** |
| **Gate 5: User Experience & A11y** | WCAG 2.1 AA compliant, hỗ trợ chế độ Tối/Sáng, responsive trên Desktop, iPad, iOS, Android | `axe-core` xác nhận **0 lỗi vi phạm**, tỷ lệ tương phản > 4.5:1, zero mobile horizontal overflow. | **PASS** |
| **Gate 6: Privacy & Data Security** | Client-side 100%, không gửi PII lên mạng, storage key có namespace rõ ràng, handoff an toàn | Không gửi bất kỳ dữ liệu cá nhân nào lên server bên ngoài, URL handoff không chứa PII nhạy cảm. | **PASS** |
| **Gate 7: Performance & Lifecycle** | Lazy loading 100% routes, thời gian tải trang < 2s, giải phóng bộ nhớ (revokeObjectURL) | Tải trang đo thực tế trên trình duyệt: **1793ms** (< 2000ms), dọn dẹp blob URLs tức thì. | **PASS** |
| **Gate 8: Operational Readiness** | Tài liệu bàn giao đầy đủ, quy trình cập nhật pháp lý rõ ràng, diễn tập rollback thành công | Đầy đủ 9 tài liệu kiểm toán, `JAPAN_LIFE_UPDATE_POLICY.md`, diễn tập rollback 100% sạch. | **PASS** |

---

## 3. DANH MỤC 34 CÔNG CỤ JAPAN LIFE V1 ĐÃ ĐƯỢC CHỨNG NHẬN

### 1. Thuế & Nghĩa vụ Tài chính (Tax Domain)
1. `japan-tax-simulator`: Mô phỏng thuế thu nhập (Shotokuzei) lũy tiến 5% - 45%, thuế thị dân (Juminzei) 10%, khấu trừ Furusato Nozei, iDeCo, NISA.
2. `tax-calculator`: Máy tính thuế TNCN và so sánh cấu trúc thuế Việt Nam - Nhật Bản.

### 2. Bảo hiểm Xã hội & Lương hưu (Insurance & Pension Domain)
3. `social-insurance-simulator`: Mô phỏng Shakai Hoken (Kenpo + Kosei Nenkin) theo bảng chuẩn thù lao hàng tháng (Standard Monthly Remuneration).
4. `social-insurance-eligibility`: Kiểm tra điều kiện tham gia bảo hiểm xã hội bắt buộc theo Luật 2024/2026 (tiêu chuẩn 51+ nhân viên, 20h/tuần, 88.000 JPY/tháng).
5. `dependent-insurance`: Đánh giá ngưỡng phụ thuộc bảo hiểm y tế và thuế (các bức tường 1.03M, 1.06M, 1.30M, 1.50M, 2.01M JPY).
6. `national-pension-guide`: Hướng dẫn chế độ Nenkin Quốc dân (Kokumin Nenkin), miễn giảm sinh viên, người thu nhập thấp, và thủ tục hoàn thuế Nenkin 1 lần (Lump-sum Withdrawal).

### 3. Việc làm & Quyền lợi Lao động (Employment Domain)
7. `unemployment-benefit`: Dự toán trợ cấp thất nghiệp (Kihon Teate), số ngày hưởng theo thâm niên và độ tuổi.
8. `unemployment-eligibility`: Thẩm định điều kiện hưởng bảo hiểm thất nghiệp (rời việc do công ty vs. cá nhân).
9. `paid-leave-checker`: Kiểm tra số ngày nghỉ phép năm có lương (Yukyu Kyuka) theo Điều 39 Luật Tiêu chuẩn Lao động.
10. `overtime-calculator`: Tính toán tiền lương làm thêm giờ theo hệ số 1.25, 1.35, 1.50, và giới hạn 45h/tháng, 360h/năm.
11. `work-scope-checker`: Rà soát phạm vi công việc hợp pháp theo tư cách lưu trú (hoạt động trong tư cách vs. ngoài tư cách Shikakugai Katsudo).
12. `affiliation-change-checker`: Hướng dẫn thông báo chuyển đổi công ty/tổ chức liên kết tới Cục Xuất Nhập Cảnh trong 14 ngày.

### 4. Gia đình & Trẻ em (Family & Childcare Domain)
13. `child-allowance-calc`: Dự toán trợ cấp trẻ em (Jido Teate) theo quy chế mở rộng 2024-2026 (chi trả đến hết cấp 3, bãi bỏ giới hạn thu nhập).
14. `childcare-leave-calc`: Tính toán tiền trợ cấp nghỉ sinh và chăm con (Ikuji Kyugyo Kyufukin) 67% và 50% lương bình quân.
15. `childcare-leave-eligibility`: Đánh giá điều kiện hưởng chế độ nghỉ thai sản và chăm sóc con nhỏ cho người lao động.
16. `maternity-allowance`: Dự tính trợ cấp sinh con (Shussan Ikuji Ichijikin) mức cố định 500.000 JPY và trợ cấp nghỉ thai sản (Shussan Teatekin).

### 5. Nhà ở & Chuyển dọn (Housing & Moving Domain)
17. `moving-cost-estimator`: Ước tính chi phí thuê nhà và chuyển nhà tại Nhật (tiền lễ Reikin, tiền cọc Shikikin, phí môi giới, cước vận chuyển).
18. `moving-admin-checker`: Checklist toàn diện thủ tục hành chính khi chuyển nhà (Tenshutsu Todoke, Tennyu Todoke, đổi địa chỉ bảo hiểm/ngân hàng).
19. `address-change-checklist`: Công cụ quản lý tiến độ chuyển đổi địa chỉ trên 12+ cơ quan và dịch vụ thiết yếu.

### 6. Tư cách lưu trú & Xuất nhập cảnh (Immigration Domain)
20. `residence-renewal-guide`: Cẩm nang gia hạn tư cách lưu trú (Zairyu Kikan Koshin) trước 3 tháng hết hạn.
21. `status-change-guide`: Hướng dẫn chuyển đổi tư cách lưu trú (Zairyu Shikaku Henko) từ Du học sinh sang Kỹ sư/Đi làm hoặc Vợ/Chồng.
22. `family-immigration-guide`: Hướng dẫn bảo lãnh người thân (Kazoku Taizai) kèm kiểm tra khả năng tài chính và tài liệu chứng minh.
23. `pr-readiness-checker`: Đánh giá mức độ sẵn sàng nộp đơn Vĩnh trú (Eijuken) dựa trên 10 năm cư trú (hoặc HSP point), thu nhập ổn định và lý lịch đóng thuế/nenkin 100% đúng hạn.

### 7. Thủ tục Hành chính & Hồ sơ Mẫu (Administrative Procedures & Documents Domain)
24. `document-finder-jp`: Tra cứu giấy tờ hành chính cần nộp theo mục đích (chứng minh thu nhập, cư trú, thuế).
25. `certificate-acquisition-guide`: Hướng dẫn xin cấp Juminhyo, Koseki Tohon, Nozei Shomeisho tại Shiyakusho hoặc Conbini bằng My Number Card.
26. `mynumber-procedure-guide`: Cẩm nang sử dụng thẻ My Number, tích hợp bảo hiểm y tế (Myna Health Insurance Card), ký số điện tử.
27. `official-form-helper`: Hướng dẫn điền các biểu mẫu hành chính tiếng Nhật chuẩn mẫu.
28. `procedure-requirement-checker`: Thẩm định bộ hồ sơ và điều kiện cần có trước khi đến ủy ban hoặc cục xuất nhập cảnh.
29. `administrative-navigator`: Định tuyến thủ tục hành chính liên cơ quan (Shiyakusho, ISA, Hello Work, Pension Office).

### 8. Các công cụ Life Event Wizards & Orchestration
30. `arriving-in-japan-wizard`: Wizard hỗ trợ người mới nhập cảnh Nhật Bản trong 14 ngày đầu tiên.
31. `leaving-japan-wizard`: Wizard hỗ trợ thủ tục trước và sau khi rời Nhật vĩnh viễn (thuế, nenkin, cư trú).
32. `birth-wizard`: Wizard đồng hành chuẩn bị trước sinh và sau sinh tại Nhật.
33. `moving-wizard`: Wizard điều hướng quy trình chuyển nhà liên tỉnh / nội tỉnh.
34. `japan-life-navigator`: Central Conductor — Hệ thống tìm kiếm thống nhất, gợi ý lộ trình thông minh và quản trị 7 Life Events liên miền.

---

## 4. CHỨNG NHẬN 7 CANONICAL LIFE EVENTS LIÊN MIỀN

| Mã Life Event | Tên Sự Kiện Đời Sống | Các Miền Nghiệp Vụ Liên Quan | Số Bước Thủ Tục | Trạng Thái Chứng Nhận |
|---|---|---|:---:|:---:|
| `life.jp.arriving` | Mới Đến Nhật (Arriving in Japan) | Cư trú, Hành chính, Nhà ở, Bảo hiểm | 8 bước | **PASS 100%** |
| `life.jp.starting_life` | Bắt Đầu Cuộc Sống (Starting Life) | Hành chính, Ngân hàng, Viễn thông, Thuế | 6 bước | **PASS 100%** |
| `life.jp.changing_job` | Chuyển Việc (Changing Job) | Lao động, Cư trú, Thuế, Bảo hiểm, Lương hưu | 7 bước | **PASS 100%** |
| `life.jp.leaving_job` | Nghỉ Việc / Thất Nghiệp (Leaving Job) | Lao động, Thất nghiệp, Bảo hiểm y tế, Nenkin | 6 bước | **PASS 100%** |
| `life.jp.family_joining` | Đón Gia Đình Sang (Family Joining) | Cư trú, Chứng minh tài chính, Nhà ở, Phụ thuộc | 6 bước | **PASS 100%** |
| `life.jp.childbirth` | Sinh Con (Childbirth & Parenting) | Thai sản, Trợ cấp trẻ em, Y tế, Thẻ cư trú | 8 bước | **PASS 100%** |
| `life.jp.leaving_japan` | Rời Nhật Bản (Leaving Japan) | Chuyển đi, Thuế xuất cảnh, Hoàn thuế Nenkin, Trả thẻ | 7 bước | **PASS 100%** |

---

## 5. BẰNG CHỨNG KIỂM TOÁN VÀ KIỂM THỬ KỸ THUẬT

### A. Kiểm thử Hồi quy Tự động (Unit & Integration Tests)
```
# Core Workspace Test Suite (@ai-tools/core):
✔ 576 tests passed (0 fail, 0 skipped, 42 suites, duration: 1195ms)

# Hub Workspace Test Suite (hub):
✔ 75 tests passed (0 fail, 0 skipped, duration: 198ms)

# Tổng cộng kiểm thử tự động:
✔ 651 / 651 TESTS PASSED (100%)
```

### B. Kiểm thử Trình duyệt Thật Đa Nền tảng (Real-Browser Puppeteer & Google Chrome)
Đo kiểm trực tiếp trên Google Chrome với các viewport Desktop (1440x900), Tablet iPad (768x1024), iPhone 15/16 (390x844), Android Galaxy (360x800):
- **Thời gian tải trang**: `1793ms` (Đạt ngưỡng khắt khe < 2000ms).
- **Rộng layout chuẩn 1240px**: `ĐẠT` (Căn giữa hoàn hảo, không tràn viền).
- **Chuyển đổi Theme**: `ĐẠT` (Đồng bộ mượt mà Light ↔ Dark mode, tỷ lệ tương phản chữ đạt chuẩn).
- **Trợ năng Trình duyệt (axe-core WCAG 2.1 AA)**:
  - Initial State: `0 violations` (PASS).
  - Dynamic State: `0 violations` (PASS).
- **Zero Horizontal Overflow**: `KHÔNG TRÀN TRANG` trên cả iOS Safari và Android Chrome.
- **Cơ chế cô lập lỗi (ToolErrorBoundary)**: Bảo vệ an toàn tuyệt đối, nút cứu hộ "Về Trung Tâm" phản hồi tức thì.
- **Quick Tool Switcher Dropdown**: Hiển thị nổi trơn tru, không bị kẹp cắt bởi `overflow-hidden`.

### C. Kiến trúc & Ghép nối Module (Architecture & Coupling)
- **Chu trình phụ thuộc vòng (Circular Dependencies)**: `0` (Kiểm chứng qua `scripts/impact-analysis.mjs --audit`).
- **Phụ thuộc chéo Miniapp (Cross-Miniapp Imports)**: `0` (Tất cả miniapp tương tác qua Core Hooks và URL params chuẩn hóa).
- **Runtime Tính toán Sự kiện Đời sống**: `LifeEventRuntime` thuần trừu tượng, không chứa bất kỳ `if (eventId === ...)` nào bên trong engine.
- **Độc lập Nghiệp vụ Navigator**: `japan-life-navigator` không chứa bất kỳ công thức tính thuế hoặc bảng biểu bảo hiểm nào.

---

## 6. LỊCH TRÌNH 10 CHECKPOINTS PHÁT HÀNH (RELEASE AUDIT TRAIL)

| Checkpoint | Git Tag | Commit Hash | Mục tiêu & Kết quả Kiểm toán |
|---|---|:---:|---|
| **C0** | `pre-japan-life-v1-hardening` | `c0114ca` | Đóng băng tính năng, tạo baseline snapshot trước Phase 10 |
| **C1** | `phase10-baseline-audit-pass` | `39ce14d` | Xác lập baseline báo cáo, kiểm thử 100% pass |
| **C2** | `phase10-architecture-audit-pass` | `7b0e0ea` | Kiểm toán kiến trúc: 0 circular deps, 0 cross-miniapp imports, alias ISA chuẩn |
| **C3** | `phase10-regulatory-audit-pass` | `55b2326` | Soát xét 55 căn cứ pháp quy, lập ma trận golden tests, bao phủ 47 tỉnh |
| **C4** | `phase10-ux-accessibility-pass` | `42b2412` | Kiểm toán UX/A11y: WCAG 2.1 AA, Zoom 200%, bảng đối chiếu thuật ngữ Nhật |
| **C5** | `phase10-privacy-security-pass` | `7340308` | Kiểm toán bảo mật: 0 PII mạng, namespace storage, sanitization context handoff |
| **C6** | `phase10-performance-pass` | `b040b6c` | Kiểm toán hiệu năng: 100% lazy loading, cleanup URL blobs, bộ nhớ nhẹ |
| **C7** | `phase10-e2e-certification-pass` | `ae37d1c` | Chứng nhận 7 canonical golden journeys thực tế (8/8 tests pass) |
| **C8** | `japan-life-v1-rc1` | `94baa0f` | Phát hành bản ứng viên RC1, ban hành chính sách cập nhật và backlog V2 |
| **C9** | `phase10-production-verification-pass` | `94baa0f` | Kiểm chứng bản build production (11.57s) và kiểm thử trình duyệt thật thành công |
| **C10** | `japan-life-v1.0.0-stable` | *(HEAD)* | Phát hành chính thức bản thương mại Production Stable |

---

## 7. QUY TRÌNH PHỤC HỒI & DIỄN TẬP ROLLBACK (ROLLBACK DRILL)

Hệ thống đã trải qua diễn tập phục hồi thảm họa thực tế (Disaster Recovery Drill):
1. Thao tác checkout lùi về mốc `phase10-baseline-audit-pass` (detached HEAD) thành công với cây thư mục làm việc 100% sạch.
2. Thao tác checkout tái thiết lập về nhánh `main` diễn ra trơn tru, không phát sinh file rác, không mất commit.
3. **Lệnh khôi phục nguyên trạng duy nhất khi có sự cố**:
   ```bash
   git checkout japan-life-v1.0.0-stable
   npm run build:hub
   ```

---

## 8. PHẠM VI GIỚI HẠN & ĐỊNH HƯỚNG V2

Để bảo toàn tính minh bạch và bảo vệ an toàn pháp lý cho người dùng:
- **Phạm vi V1**: Tập trung vào quy chế chuẩn quốc gia của Nhật Bản (Reiwa 8 / 2026), bao phủ đầy đủ các nhóm đối tượng người đi làm, kỹ sư, phiên dịch viên, gia đình đi kèm và chuyển việc thông thường.
- **Giới hạn đã công bố minh bạch**:
  - Không thay thế tư vấn pháp lý chuyên sâu từ Luật sư Hành chính (Gyoseishoshi) hoặc Chuyên viên Lao động Xã hội (Sharoushi).
  - Không bao phủ các ca tranh chấp lao động đặc thù hoặc tố tụng tư pháp.
  - Các yêu cầu mở rộng (API kết nối Shiyakusho trực tiếp, hỗ trợ tiếng Bồ Đào Nha/Tagalog, thuật toán tối ưu hóa chuyển nhà nâng cao) đã được quy hoạch an toàn tại `docs/phase10/V2_BACKLOG.md`.

---

## 9. KẾT LUẬN & TUYÊN BỐ PHÁT HÀNH

Hệ thống **Toolio Japan Life V1** đã vượt qua tất cả các tiêu chuẩn kỹ thuật, pháp lý, bảo mật và trải nghiệm người dùng khắt khe nhất.  
Chính thức phê duyệt và tuyên bố:

### JAPAN LIFE V1 — PRODUCTION STABLE

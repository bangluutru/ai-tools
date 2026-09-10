# Kế Hoạch Triển Khai Chi Tiết Phase 6: Life Event Foundation + Japan Housing & Moving

> **Mã tài liệu**: `docs/phase6/PHASE_06_IMPLEMENTATION_PLAN.md`  
> **Thời điểm lập**: 2026-09-11  
> **Mục tiêu song song**:
> 1. **Mục tiêu A**: Trích xuất Nền tảng Sự Kiện Đời Sống tối giản (**Life Event Foundation**) từ 2 wizard thực chứng: `leaving-job-wizard-jp` và `birth-wizard-jp`.
> 2. **Mục tiêu B**: Xây dựng toàn diện tên miền chuyên sâu thứ 5 **Japan Life → Housing & Moving (`housing` / 住まい・引越し)** với 04 mini-app mới (trong đó có `moving-wizard-jp` vận hành trên chính Life Event Foundation).

---

## 1. Nguyên Tắc & Kỷ Luật Kỹ Thuật Bắt Buộc

1. **Không tưởng tượng kiến trúc (Zero Invented Abstractions)**: Chỉ trừu tượng hóa những khái niệm mà cả 2 wizard hiện tại đã chứng minh hoặc `moving-wizard-jp` chắc chắn cần theo cùng mẫu.
2. **Không tạo các hệ thống quá khổ**:
   - CẤM tạo generic workflow programming language.
   - CẤM tạo visual workflow designer.
   - CẤM tạo rule DSL / BPM engine / state-machine framework cồng kềnh.
3. **Tuân thủ ranh giới miền (Zero Cross-Domain Direct Imports)**:
   - Tên miền `housing` không import trực tiếp bất kỳ tệp tin nào từ `tax`, `insurance`, `employment` hay `family`.
   - Mọi tương tác điều phối liên miền được thực hiện qua **Capability Registry** và URL Hash deep links (`#/tools/{toolId}`).
4. **Cổng nghiệm thu Foundation (Foundation Acceptance Gate)**:
   - Cả 2 wizard `leaving-job-wizard-jp` và `birth-wizard-jp` phải được chuyển đổi sang Life Event Foundation và kiểm định đạt chuẩn 100% không hồi quy TRƯỚC KHI bắt đầu phát triển tên miền Housing & Moving.
5. **Kỷ luật Checkpoint nghiêm ngặt**:
   - Không chuyển milestone nếu milestone hiện tại chưa PASS kiểm thử tự động, static audit và headless browser matrix.

---

## 2. Lộ Trình Triển Khai 9 Milestone (M0 — M8)

```
M0: Life Event Audit (PASS)
        ↓
M1: Life Event Foundation Core (Runtime, Types, Timeline, Checklist, Capability)
        ↓
M2: Migrate Leaving Job Wizard → Parity Verification (Tag C3)
        ↓
M3: Migrate Birth Wizard → Parity Verification (Tag C4)
        ↓
[FOUNDATION ACCEPTANCE GATE: Both wizards PASS on new runtime, 0 regression]
        ↓
M4: Moving Cost Calculator (引越し費用シミュレーター - Tag C5)
        ↓
M5: Moving Administration Checker (引越し行政手続チェッカー - Tag C6)
        ↓
M6: Address Change Checklist (住所変更チェックリスト - Tag C7)
        ↓
M7: Moving Life Event Wizard (引越し手続きガイド - Tag C8)
        ↓
M8: Full Regression, System Audit & Phase 6 Final Report (Tag C9)
```

---

## 3. Chi Tiết Từng Milestone

### Milestone 0: Life Event Audit & Thẩm Định Kiến Trúc (M0)
- **Công việc**:
  - So sánh chi tiết 15 khái niệm kiến trúc giữa `leaving-job-wizard-jp` và `birth-wizard-jp`.
  - Phân định rõ những phần duplicated cần trích xuất và những phần domain-specific cần giữ lại.
  - Phân tích rủi ro migration và backward compatibility.
  - Xuất bản tài liệu `docs/phase6/PHASE_06_LIFE_EVENT_AUDIT.md`.
- **Đánh giá**: **READY_WITH_SMALL_FIXES**
- **Checkpoint Tag**: `phase6-audit-plan-pass` (C1).

---

### Milestone 1: Xây Dựng Life Event Foundation Tối Giản (M1)
- **Vị trí**: `packages/core/src/life-events/`
- **Cấu trúc tệp tin**:
  - `types/lifeEventTypes.js`: Khai báo JSDoc Types cho `LifeEventDefinition`, `LifeEventContext`, `TimelineStage`, `ChecklistItem`, `DeadlineRule`, `CapabilityReference`.
  - `timeline/deadlineEngine.js`: Động cơ tính ngày luật định (anchor key + offsetDays + direction before/after + calendar/business).
  - `capability/capabilityRegistry.js`: Ánh xạ semantic capability (ví dụ: `housing.moving.admin.check`) sang `toolId` và sinh deep link an toàn. Xử lý trường hợp capability chưa tồn tại (missing capability) mà không gây crash.
  - `checklist/checklistEngine.js`: Động cơ lọc và tạo danh mục công việc dựa trên ngữ cảnh phân nhánh; tính toán thống kê tiến độ %, số lượng task hoàn thành, trạng thái hoàn thành từng chặng.
  - `storage/lifeEventStorage.js`: Trình quản lý lưu trữ trình duyệt `localStorage` có namespace chuẩn `ai_tools_{lifeEventId}_checklist`, đảm bảo an toàn và độc lập tuyệt đối.
  - `runtime/lifeEventRuntime.js`: Bộ điều phối trung tâm liên kết Definition, Context, DeadlineEngine và ChecklistEngine.
  - `index.js`: Điểm xuất khẩu duy nhất của module.
- **Kiểm thử tự động**:
  - `packages/core/tests/life-event-foundation.test.js`: Kiểm thử phân nhánh ngữ cảnh, thứ tự giai đoạn, tính toán hạn chót động, phân giải capability, capability không tồn tại, context không hợp lệ, cách ly lưu trữ.
- **Checkpoint Tag**: `phase6-life-event-foundation-pass` (C2).

---

### Milestone 2: Di Chuyển Thôi Việc (Leaving Job Wizard) Sang Foundation (M2)
- **Yêu cầu cốt lõi**: Không viết lại giao diện React (`LeavingJobWizardView.jsx`). Chỉ chuyển đổi logic điều phối bên dưới sang dùng `LifeEventDefinition` và `LifeEventRuntime`.
- **Công việc**:
  - Tạo `packages/core/src/japan/employment/rules/leavingJobDefinition.js` tuân thủ chuẩn `LifeEventDefinition`.
  - Cập nhật `leavingJobEngine.js` sử dụng runtime dùng chung bên dưới, đồng thời giữ nguyên 100% chữ ký hàm xuất khẩu cũ (`generateLeavingJobPlan`, `classifyResidentTaxCollection`, `evaluateHealthInsuranceAdvice`, `calculateChecklistStats`) để không làm gãy vỡ code gọi hiện có.
- **Kiểm thử & Kiểm định**:
  - Chạy toàn bộ Golden Tests trong `regulatory-japan-employment-golden.test.js` để bảo đảm kết quả tính toán và danh mục công việc trùng khớp 100%.
  - Kiểm thử trình duyệt thật qua `verify-miniapp-browser.mjs --tool=leaving-job-wizard-jp` (0 lỗi console, WCAG AA PASS, Zero overflow).
- **Checkpoint Tag**: `phase6-leaving-job-migration-pass` (C3).

---

### Milestone 3: Di Chuyển Mang Thai & Nuôi Con (Birth Wizard) Sang Foundation (M3)
- **Yêu cầu cốt lõi**: Giữ nguyên `calculateChildbirthLumpSumGrant` và giao diện `BirthWizardView.jsx`. Chuyển đổi bản đồ 6 giai đoạn sang `LifeEventDefinition`.
- **Công việc**:
  - Tạo `packages/core/src/japan/family/rules/birthDefinition.js` tuân thủ chuẩn `LifeEventDefinition`.
  - Cập nhật `birthWizardEngine.js` sử dụng runtime dùng chung, kế thừa khả năng tính toán hạn chót động từ `deadlineEngine` khi người dùng nhập ngày sinh dự kiến/thực tế.
- **Kiểm thử & Kiểm định**:
  - Chạy toàn bộ Golden Tests trong `regulatory-japan-family-golden.test.js`.
  - Kiểm thử trình duyệt thật qua `verify-miniapp-browser.mjs --tool=birth-wizard-jp`.
- **Cổng Nghiệm Thu Foundation (Foundation Acceptance Gate)**:
  - Cả 2 wizard `leaving-job-wizard-jp` và `birth-wizard-jp` cùng chạy trên một runtime duy nhất.
  - Không có bất kỳ lệnh rẽ nhánh cứng `if (eventId === 'leaving-job')` trong generic runtime.
  - Toàn bộ test suite của `@ai-tools/core` (344+ tests) và `hub` (75 tests) đạt PASS 100%.
- **Checkpoint Tag**: `phase6-birth-migration-pass` (C4).

---

### Milestone 4: Mini-App `moving-cost-jp` — 引越し費用シミュレーター (M4)
- **Bản chất**: Utility Calculator (Công cụ ước tính chi phí thực tế, không phải quy chuẩn luật định cố định).
- **Các nhóm chi phí cốt lõi**:
  1. *Chi phí công ty chuyển nhà (Moving Company Quote)*: Quãng đường, quy mô gia đình, mùa cao điểm (tháng 3-4) vs mùa thấp điểm.
  2. *Chi phí ban đầu nhà mới (New Home Upfront Costs)*: Tiền cọc (敷金), Tiền lễ (礼金), Phí môi giới (仲介手数料), Phí bảo lãnh (保証料), Bảo hiểm hỏa hoạn (火災保険), Phí đổi khóa (鍵交換代), Tiền thuê nhà trả trước / gối đầu (前家賃・日割り家賃).
  3. *Chi phí trả nhà cũ (Old Home Exit Costs)*: Khôi phục hiện trạng (原状回復), Phí dọn dẹp vệ sinh (クリーニング費用).
  4. *Chi phí dịch vụ & sinh hoạt (Utility & Service Setup)*: Phí lắp đặt internet, điều hòa, đồ gia dụng mới.
- **Tính năng**: Phân loại chi phí một lần (one-time), có thể hoàn lại (refundable - tiền cọc), và định kỳ (recurring); so sánh kịch bản (Tiết kiệm vs Báo giá thực tế vs Dự phòng an toàn).
- **Mã nguồn**:
  - Rules: `packages/core/src/japan/housing/rules/movingCostRules.js`
  - Engine: `packages/core/src/japan/housing/engines/movingCostEngine.js`
  - Component: `packages/core/src/components/housing/MovingCostView.jsx`
  - Tool Wrapper: `hub/src/tools/moving-cost-jp/MovingCostTool.jsx`
- **Kiểm định**: Golden tests, headless browser test (Desktop, iOS Safari, Android Chrome).
- **Checkpoint Tag**: `phase6-moving-cost-pass` (C5).

---

### Milestone 5: Mini-App `moving-admin-checker-jp` — 引越し行政手続チェッカー (M5)
- **Bản chất**: Regulatory & Procedure Checker (Kiểm tra thủ tục hành chính chuyển cư theo pháp luật Nhật Bản).
- **Căn cứ pháp lý & Nguồn cấp 1**:
  - 住民基本台帳法 (Luật Đăng ký Cư dân cơ bản):
    - Điều 22: Giấy báo chuyển đến (転入届 - trong vòng 14 ngày sau khi chuyển đến).
    - Điều 23: Giấy báo chuyển đi (転出届 - từ khoảng 14 ngày trước ngày chuyển).
    - Điều 24: Giấy báo đổi chỗ ở trong cùng quận/thị xã (転居届 - trong vòng 14 ngày).
  - Dịch vụ Chuyển nhà Trực tuyến của Cục Kỹ thuật số (デジタル庁 引越しワンストップサービス via マイナポータル):
    - Cho phép nộp 転出届 online và đặt lịch hẹn đến ủy ban nơi chuyển đến (来庁予定連絡).
    - **Lưu ý nghiệp vụ bắt buộc**: KHÔNG ĐƯỢC diễn giải rằng có thể hoàn thành toàn bộ 転入届 online. Người chuyển đến vẫn bắt buộc phải xuất trình thẻ My Number tại Ủy ban nơi đến.
  - Thủ tục đi kèm: BHYT Quốc dân (国保), Lương hưu Quốc dân (国民年金), Trợ cấp trẻ em (児童手当), Thẻ cư trú người nước ngoài (在留カード), Bằng lái xe (運転免許証).
- **Mã nguồn**:
  - Rules: `packages/core/src/japan/housing/rules/movingAdminRules.js`
  - Engine: `packages/core/src/japan/housing/engines/movingAdminEngine.js`
  - Component: `packages/core/src/components/housing/MovingAdminCheckerView.jsx`
  - Tool Wrapper: `hub/src/tools/moving-admin-checker-jp/MovingAdminCheckerTool.jsx`
- **Kiểm định**: Golden tests 9 kịch bản (cùng thành phố, khác thành phố, khác tỉnh, có/không thẻ My Number, có con, người nước ngoài...), headless browser test.
- **Checkpoint Tag**: `phase6-moving-admin-pass` (C6).

---

### Milestone 6: Mini-App `address-change-checklist-jp` — 住所変更チェックリスト (M6)
- **Bản chất**: Operational Checklist (Danh mục đổi địa chỉ tiện ích & dịch vụ đời sống phi hành chính).
- **Các nhóm dịch vụ**:
  1. *Bưu điện (Japan Post - 郵便局)*: Dịch vụ chuyển tiếp thư tín miễn phí trong nước 1 năm (e転居 / 転送サービス). Không chuyển tiếp ra nước ngoài.
  2. *Cơ sở hạ tầng sinh hoạt (Life Infrastructure)*: Điện (電気), Gas (ガス - cần hẹn người đến mở van gas), Nước (水道), Internet cáp quang.
  3. *Tài chính & Viễn thông (Finance & Telecom)*: Ngân hàng, Thẻ tín dụng, Nhà mạng di động.
  4. *Mua sắm & Đăng ký (E-commerce & Subscriptions)*: Amazon, Rakuten, đồ giao định kỳ.
  5. *Phương tiện đi lại (Vehicles)*: Đăng ký xe, bảo hiểm xe.
- **Tính năng**: Cho phép người dùng thêm đầu việc riêng, lọc theo nhóm, ẩn nhóm không liên quan, lưu trữ trạng thái cục bộ, xuất file in ấn/PDF/CSV.
- **Mã nguồn**:
  - Rules: `packages/core/src/japan/housing/rules/addressChangeRules.js`
  - Engine: `packages/core/src/japan/housing/engines/addressChangeEngine.js`
  - Component: `packages/core/src/components/housing/AddressChangeChecklistView.jsx`
  - Tool Wrapper: `hub/src/tools/address-change-checklist-jp/AddressChangeChecklistTool.jsx`
- **Kiểm định**: Unit tests, browser test.
- **Checkpoint Tag**: `phase6-address-checklist-pass` (C7).

---

### Milestone 7: Mini-App `moving-wizard-jp` — 引越し手続きガイド & Orchestrator (M7)
- **Bản chất**: Life Event Wizard thứ 3, được xây dựng 100% trên nền tảng `LifeEventFoundation`.
- **Khung thời gian 6 giai đoạn chuẩn mực**:
  1. *Giai đoạn 1: Chuẩn bị kế hoạch (1-2 tháng trước)*: Tìm nhà, lập dự toán chi phí, báo trả nhà cũ.
  2. *Giai đoạn 2: Trước ngày chuyển 2-4 tuần*: Đặt công ty chuyển nhà, nộp đơn chuyển tiếp bưu điện, liên hệ cắt/mở điện nước gas.
  3. *Giai đoạn 3: Trước ngày chuyển 1-2 tuần*: Nộp 転出届 (trực tiếp hoặc qua MyNaPortal), xin giấy chứng nhận trường học cho con.
  4. *Giai đoạn 4: Ngày chuyển nhà*: Đóng gói dọn dẹp, chứng kiến mở van gas, trả phòng cũ nhận lại cọc.
  5. *Giai đoạn 5: Trong vòng 14 ngày sau khi chuyển*: Nộp 転入届 / 転居届, đổi địa chỉ thẻ My Number, làm lại thẻ BHYT, nộp đơn Trợ cấp trẻ em nơi mới.
  6. *Giai đoạn 6: Ổn định sau khi chuyển (Sau 14 ngày)*: Đổi địa chỉ ngân hàng, bằng lái, thẻ cư trú, trường học.
- **Khả năng điều phối liên miền (Cross-Domain Orchestration)**:
  - Deep-link an toàn tới: `housing.moving.cost.calculate`, `housing.moving.admin.check`, `housing.address.change.check`, `insurance.health.dependent`, `family.childAllowance.calculate`, `tax.japan.calculate`.
- **Mã nguồn**:
  - Definition: `packages/core/src/japan/housing/rules/movingDefinition.js`
  - Engine: `packages/core/src/japan/housing/engines/movingWizardEngine.js`
  - Component: `packages/core/src/components/housing/MovingWizardView.jsx`
  - Tool Wrapper: `hub/src/tools/moving-wizard-jp/MovingWizardTool.jsx`
- **Kiểm chứng tính khái quát của Runtime**:
  - Chứng minh `Leaving Job`, `Birth`, và `Moving` chạy đồng nhất trên cùng một Runtime engine mà không cần bất kỳ mã phân nhánh rác nào.
- **Checkpoint Tag**: `phase6-moving-wizard-pass` (C8).

---

### Milestone 8: Nghiệm Thu Toàn Diện & Đóng Gói Báo Cáo Phase 6 (M8)
- **Đồng bộ Hub**:
  - Đăng ký tên miền `housing` (`Japan Life → Housing & Moving / 住まい・引越し`) tại `toolsRegistry.js`.
  - Cập nhật bộ lọc từ khóa tìm kiếm (引越し, 転出, 転入, 転居, 住所変更, moving, change address, chuyển nhà, đổi địa chỉ).
- **Kiểm thử hồi quy toàn diện**:
  - Chạy toàn bộ Core tests: Đảm bảo không suy giảm chất lượng các phase trước.
  - Chạy toàn bộ Hub tests: 100% passing.
  - Chạy Static Miniapp Audit (`audit:miniapps`): Toàn bộ các miniapp đạt chuẩn.
  - Production Bundle Build (`build:hub`): Thành công với 0 lỗi biên dịch.
- **Bộ tài liệu chuyển giao**:
  - `docs/PHASE_06_LIFE_EVENT_HOUSING_MOVING_REPORT.md`
  - `docs/phase6/LIFE_EVENT_FOUNDATION_SPEC.md`
  - `docs/phase6/JAPAN_MOVING_RULE_AUDIT.md`
  - `docs/phase6/JAPAN_MOVING_LOCALITY_STRATEGY.md`
- **Checkpoint Tag**: `phase6-final-pass` (C9).

---

## 4. Bảng Kế Hoạch Checkpoint Tags

| Checkpoint | Tag Git | Mô tả | Điều kiện tiên quyết |
| :---: | :---: | :--- | :--- |
| **C0** | `pre-phase6-lifeevent-moving` | Baseline trước khi bắt đầu Phase 6 | ĐÃ TẠO VÀ VERIFY BASELINE PASS |
| **C1** | `phase6-audit-plan-pass` | Phê duyệt Audit và Kế hoạch chi tiết | Hoàn thành M0, user review |
| **C2** | `phase6-life-event-foundation-pass` | Nền tảng Life Event Foundation hoàn tất | Unit tests foundation pass 100% |
| **C3** | `phase6-leaving-job-migration-pass` | Di chuyển Leaving Job Wizard thành công | Parity tests & Browser pass 100% |
| **C4** | `phase6-birth-migration-pass` | Di chuyển Birth Wizard thành công | Parity tests & Browser pass 100% |
| **C5** | `phase6-moving-cost-pass` | Mini-app `moving-cost-jp` hoàn tất | Golden tests & Browser pass 100% |
| **C6** | `phase6-moving-admin-pass` | Mini-app `moving-admin-checker-jp` hoàn tất | Golden tests & Browser pass 100% |
| **C7** | `phase6-address-checklist-pass` | Mini-app `address-change-checklist-jp` hoàn tất | Tests & Browser pass 100% |
| **C8** | `phase6-moving-wizard-pass` | Mini-app `moving-wizard-jp` hoàn tất | Orchestrator & Browser pass 100% |
| **C9** | `phase6-final-pass` | Nghiệm thu toàn diện toàn bộ Phase 6 | Full Regression & Reports hoàn tất |

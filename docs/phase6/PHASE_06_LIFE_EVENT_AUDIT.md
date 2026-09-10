# Thẩm Định Nền Tảng Sự Kiện Đời Sống (Life Event Foundation Audit)

> **Mã tài liệu**: `docs/phase6/PHASE_06_LIFE_EVENT_AUDIT.md`  
> **Thời điểm thẩm định**: 2026-09-11  
> **Phạm vi**: So sánh thực chứng hai Life Event Wizard hiện có (`leaving-job-wizard-jp` và `birth-wizard-jp`), nhận diện các mẫu dùng chung đã được chứng minh và thiết kế đặc tả nền tảng tối giản (**Minimal Life Event Foundation**).  
> **Kết luận sơ bộ**: **READY_WITH_SMALL_FIXES**

---

## 1. So Sánh Thực Chứng Hai Life Event Hiện Có

Dưới đây là bảng đối chiếu thực tế từng khái niệm kiến trúc giữa **Thôi việc (Leaving Job)** và **Sinh con / Nuôi con (Birth & Childcare)**:

| Khái niệm (Concept) | Leaving Job Wizard (`leaving-job-wizard-jp`) | Birth Wizard (`birth-wizard-jp`) | Thật sự dùng chung? (Truly shared?) | Phân tích chi tiết |
| :--- | :--- | :--- | :---: | :--- |
| **Context collection** | Thu thập ngày nghỉ việc, loại hình thôi việc, định hướng BHYT, thu nhập kỳ vọng, tình trạng việc mới. | Thu thập số lượng bé, cơ sở có Quỹ bồi thường, viện phí thực tế, hình thức thanh toán, mã địa phương. | **Có (Cấu trúc chung)** | Cả 2 đều nhận một input object (Context), nhưng schema thuộc tính là *hoàn toàn đặc thù từng miền*. |
| **Branching questions** | Phân nhánh theo loại thôi việc (Công ty vs Cá nhân), tháng nghỉ việc (1-5 vs 6-12). | Phân nhánh theo cơ sở y tế (có Quỹ 500k vs không Quỹ 488k), địa phương thụ hưởng. | **Có (Nguyên lý)** | Sử dụng các hàm đánh giá logic thuần túy (deterministic decision functions) nhận context và trả về nhánh quyết định. |
| **Decision rules** | `classifyResidentTaxCollection`, `evaluateHealthInsuranceAdvice`. | `calculateChildbirthLumpSumGrant`, `getMunicipalFamilyData`. | **Một phần** | Cần tách biệt rõ: *Quy tắc quyết định lộ trình* (thuộc Foundation) vs *Động cơ tính toán chế độ tiền bạc* (thuộc Domain Engine). |
| **Timeline / Stages** | 3 giai đoạn: Trước khi nghỉ, Ngày làm việc cuối, Sau khi nghỉ. | 6 giai đoạn: Thai kỳ sớm, Thai kỳ muộn, Ngày sinh, 14 ngày sau sinh, Nghỉ thai sản/chăm con, Trở lại làm việc. | **CÓ (100% Cốt lõi)** | Cả 2 đều có cấu trúc danh sách tuần tự các giai đoạn (Stages) mang thứ tự `order`, định danh `stageId`, tên đa ngữ và danh sách công việc (`tasks`/`items`). |
| **Checklist generation** | Sinh động danh sách từ mảng phẳng `LEAVING_ACTION_ITEMS` có gán `stage`. | Sinh danh mục lồng nhau trong từng phần tử của `ROADMAP_STAGES`. | **CÓ (Cần chuẩn hóa)** | Cần thống nhất hợp đồng dữ liệu: Danh sách `ChecklistItem` có thuộc tính `stageId`, hỗ trợ lọc theo giai đoạn hoặc duyệt phẳng. |
| **Checklist item schema** | Thuộc tính: `id`, `stage`, `titleJa/Vi/En`, `deadlineDescriptionJa/Vi/En`, `statutoryDeadlineDays`, `calculatedDeadlineDate`, `authorityJa/Vi/En`, `locationJa/Vi/En`, `requiredDocumentsJa/Vi/En`, `toolId`, `actionType`, `externalUrl`, `isUrgent`, `notesJa/Vi/En`. | Thuộc tính: `id`, `titleJa/Vi/En`, `deadlineJa/Vi/En`, `locationJa/Vi/En`, `toolLinkId`, `benefitInfoJa/Vi/En`, `localNotesJa/Vi/En`. | **CÓ (Chuẩn hóa)** | Hai schema có độ tương đồng ~80%. Foundation sẽ chuẩn hóa một hợp đồng tối giản: `id`, `stageId`, `title`, `requirement`, `deadlineRule`, `authority`, `jurisdiction`, `sourceIds`, `relatedCapabilityId`, `externalAction`, `documents`, `warnings`, `localNotes`. |
| **Deadline handling** | Tính ngày động bằng `statutoryDeadlineDays` cộng/trừ ngày neo (`resignationDate`) qua `addDays`/`subtractDays`. | Chuỗi tĩnh văn bản luật định (ví dụ: "Trong vòng 14 ngày kể từ ngày sinh") chưa tính ngày dương lịch động. | **CÓ (Cần nâng cấp)** | Cần một **Structured Deadline Model**: cho phép định nghĩa ngày neo (`anchorKey`), số ngày lệch (`offsetDays`), chiều hướng (`before`/`after`) và loại ngày (`calendar`/`business`), đồng thời có fallback dạng mô tả tĩnh. |
| **Jurisdiction** | Chủ yếu cấp Quốc gia (Luật Tiêu chuẩn lao động, Dân luật, Luật BHYT, Thuế địa phương). | Quốc gia (BHYT, Luật Chăm con, Trợ cấp trẻ em) + Địa phương cụ thể (Fukuoka City, Tokyo Chiyoda-ku). | **CÓ (Kế thừa Phase 5)** | Phân tầng thẩm quyền rõ ràng: `national`, `prefecture`, `municipality`, và bổ sung `private-service` cho các tiện ích (điện, nước, bưu điện, ngân hàng). |
| **Official sources** | 4 nguồn cấp 1 (`mhlw-resignation-procedures-guide`, v.v.). | 4 nguồn cấp 1 (`mhlw-childbirth-lump-sum-grant`, v.v.). | **CÓ (100%)** | Đều liên kết chặt chẽ với `packages/core/src/regulatory/sourceRegistry.js` và trình bày minh bạch qua `RegulatorySourceView`. |
| **Related capability** | `toolId`: `'unemployment-benefit-jp'`, `'dependent-insurance-jp'`, `'japan-tax-simulator'`. | `toolLinkId`: `'maternity-allowance-jp'`, `'childcare-benefit-jp'`, `'child-allowance-jp'`. | **CÓ (100%)** | Hiện tại cả hai wizard đều trỏ trực tiếp đến `toolId` của miniapp. Cần chuyển sang **Capability-based Resolution**: `relatedCapabilityId` (ví dụ: `insurance.health.dependent`) được ánh xạ tới Tool ID qua Capability Registry. |
| **Deep links** | Điều hướng bằng URL Hash: `#/tools/{toolId}`. | Điều hướng bằng URL Hash: `#/tools/{toolId}`. | **CÓ (100%)** | Đã tuân thủ nguyên tắc cách ly miền Zero Cross-Domain Direct Imports. |
| **Optional context transfer** | Chưa truyền payload ngữ cảnh qua URL hash (chỉ mở công cụ rỗng). | Chưa truyền payload ngữ cảnh qua URL hash. | **Cần thiết kế** | Foundation sẽ hỗ trợ cơ chế truyền context an toàn qua Query/Hash params (ví dụ: `#/tools/{toolId}?prefill={...}`) nhưng hoàn toàn tùy chọn (optional) và target tool tự kiểm tra hợp lệ. |
| **Completion state** | Lưu mã task đã hoàn thành vào `localStorage` key `'ai_tools_leaving_job_checklist'`. | Lưu mã task đã hoàn thành vào `localStorage` key `'ai_tools_birth-wizard_checklist'`. | **CÓ (100%)** | Mô hình lưu trữ danh sách hoàn thành trên client-side là giống hệt nhau. Cần thống nhất helper quản lý state theo chuẩn `ai_tools_{lifeEventId}_checklist`. |
| **Unsupported case** | Xử lý các trường hợp ngoại lệ như người lao động làm việc ngắn hạn không đủ điều kiện. | Xử lý trường hợp người dùng chọn địa phương chưa có dữ liệu kiểm chứng (fallback về chính sách quốc gia). | **CÓ** | Khi một địa phương hoặc nghiệp vụ chưa được hỗ trợ đầy đủ, Runtime phải hiển thị thông báo hướng dẫn chính thức mà không làm gãy vỡ toàn bộ Wizard. |
| **Warning / Callouts** | Cảnh báo khấu trừ thuế cư trú một cục, cảnh báo hạn chót 20 ngày nghiêm ngặt của BHYT tự nguyện. | Banner phân biệt 3 tầng quyền lợi tiền mặt (50 vạn vs 2/3 lương vs 67%/50%), cảnh báo viện phí vượt trợ cấp. | **CÓ** | Hỗ trợ cấu trúc mảng cảnh báo `warnings: [{ type: 'caution'|'warning'|'info', messageJa, messageVi, messageEn }]`. |
| **External official link** | Liên kết e-Gov, Hello Work, Kyokai Kenpo. | Liên kết Cổng thông tin nuôi con thành phố Fukuoka, CFA, MHLW. | **CÓ (100%)** | Hỗ trợ `externalAction: { url, labelJa, labelVi, labelEn }` kèm biểu tượng `ExternalLink` và `aria-label` trợ năng đạt chuẩn WCAG AA. |

---

## 2. Phân Tích Trích Xuất Kiến Trúc

### 2.1. Những phần trùng lặp (Duplicated - Phải trích xuất vào Foundation)
1. **Quản lý trạng thái hoàn thành Checklist (Checklist Progress & State Management)**:
   - Logic tính toán số lượng task hoàn thành, tổng số task, tỷ lệ phần trăm chung và phần trăm theo từng giai đoạn (`calculateChecklistStats`) bị lặp lại ở cả 2 wizard.
   - Logic đồng bộ đọc/ghi `localStorage` bị lặp lại với cùng cơ chế toggle Set.
2. **Khái niệm Giai đoạn Lộ trình (Timeline Stages)**:
   - Cấu trúc `stageId`, `order`, tên đa ngữ và bộ đếm task được định nghĩa ad-hoc ở từng engine.
3. **Mô hình tính toán Hạn chót động (Deadline Engine)**:
   - Hàm `addDays`, `subtractDays` và cách xử lý ngày neo (Event Date) được viết thủ công trong `leavingJobEngine.js`, trong khi `birthWizardEngine.js` phải dùng chuỗi văn bản tĩnh vì chưa có engine dùng chung.
4. **Cơ chế phân giải Capability (Capability Resolution)**:
   - Cả 2 wizard đều tự hardcode `toolId` hoặc `toolLinkId` trong danh mục task.

### 2.2. Những phần khác biệt có chủ đích (Intentionally Different - Giữ nguyên ở Domain)
1. **Các công cụ tính toán chế độ chuyên sâu (Domain Calculation Engines)**:
   - `calculateChildbirthLumpSumGrant` (tính 50 vạn BHYT, bù trừ viện phí) thuộc tên miền `family`.
   - `classifyResidentTaxCollection` (phân loại thuế cư trú tháng 1-5 vs 6-12) thuộc tên miền `employment`.
   - `evaluateHealthInsuranceAdvice` (cây quyết định BHYT 3 ngả) thuộc tên miền `employment`.
2. **Biểu mẫu thu thập dữ liệu đầu vào (Domain Input Forms)**:
   - Form nhập ngày nghỉ việc, hình thức thôi việc khác hoàn toàn form nhập số con, viện phí và địa phương.
3. **Dữ liệu đăng ký địa phương chuyên ngành (Specialized Municipal Registries)**:
   - `municipalRegistry.js` của Phase 5 chứa dữ liệu phiếu khám thai, trợ cấp sinh con... chỉ thuộc về tên miền Family.

---

## 3. Rủi Ro Di Chuyển (Migration Risks) & Rủi Ro Tương Thích Ngược (Backward-Compatibility)

1. **Rủi ro hồi quy giao diện (UI Regression Risk)**:
   - *Nguy cơ*: Thay đổi cấu trúc dữ liệu checklist có thể làm hỏng giao diện của `LeavingJobWizardView.jsx` và `BirthWizardView.jsx`.
   - *Giải pháp*: Giữ nguyên 100% component UI hiện tại trong giai đoạn đầu (M2, M3); chỉ thay đổi lớp Engine/Adapter bên dưới. Chỉ sau khi cả 3 wizard (bao gồm cả Moving) cùng hoạt động ổn định mới xem xét trích xuất Shared UI component.
2. **Rủi ro mất dữ liệu đã lưu trong trình duyệt (LocalStorage Cache Invalidation)**:
   - *Nguy cơ*: Thay đổi mã định danh `taskId` làm mất trạng thái checklist mà người dùng đã đánh dấu trước đó.
   - *Giải pháp*: Giữ nguyên 100% định danh task hiện tại (`task_pregnancy_notification`, `task_resignation_notice`, v.v.).
3. **Rủi ro rò rỉ ranh giới miền (Cross-Domain Leakage)**:
   - *Nguy cơ*: Đưa code phụ thuộc vào `family` hoặc `employment` vào trong thư mục dùng chung `packages/core/src/life-events/`.
   - *Giải pháp*: Nền tảng Life Event Foundation chỉ xử lý dữ liệu trừu tượng (Schema, Stages, Deadlines, Checklist, Capabilities). Mọi dữ liệu cụ thể được truyền vào dưới dạng `LifeEventDefinition`.

---

## 4. Đặc Tả Giao Diện Lập Trình Tối Giản (Minimal Foundation API Specification)

Vị trí đề xuất: `packages/core/src/life-events/`

```
packages/core/src/life-events/
├── runtime/
│   └── lifeEventRuntime.js      # Bộ điều phối cốt lõi: nhận Definition + Context -> Timeline & Checklist
├── types/
│   └── lifeEventTypes.js        # Hợp đồng dữ liệu & JSDoc types
├── timeline/
│   └── deadlineEngine.js        # Động cơ tính ngày luật định (anchor + offsetDays + calendar/business)
├── capability/
│   └── capabilityRegistry.js    # Bảng ánh xạ semantic capability -> toolId & Deep-link resolver
├── checklist/
│   └── checklistEngine.js       # Tính toán tiến độ, thống kê %, trạng thái hoàn thành
├── storage/
│   └── lifeEventStorage.js      # Trình quản lý localStorage an toàn, namespaced
└── index.js                     # Điểm xuất khẩu duy nhất
```

### Các hàm cốt lõi của Runtime:
1. `createLifeEventRuntime(definition)`: Khởi tạo runtime cho một sự kiện đời sống.
2. `runtime.evaluateTimeline(context)`: Trả về danh sách các Stage đã được sắp xếp kèm hạn chót đã tính toán.
3. `runtime.evaluateChecklist(context, options)`: Trả về danh sách các ChecklistItem phù hợp với ngữ cảnh phân nhánh.
4. `runtime.resolveCapability(capabilityId)`: Trả về URL Hash deep-link an toàn hoặc `null` nếu capability chưa tồn tại.
5. `calculateLifeEventStats(completedItemIds, items)`: Thống kê số lượng, tiến độ %, trạng thái hoàn thành.

---

## 5. Kết Luận Kiểm Định (Audit Verdict)

### **Kết luận: READY_WITH_SMALL_FIXES**

- **Lý do**:
  - Hai wizard hiện tại cung cấp đủ bằng chứng thực nghiệm rõ ràng về các mẫu dùng chung (Timeline, Checklist, Deadline, Capability Link, Local Storage).
  - Không phát hiện bất kỳ mâu thuẫn kiến trúc cốt lõi nào.
  - Cần một số điều chỉnh nhỏ (Small Fixes):
    1. Bổ sung `capabilityRegistry.js` để tránh việc các wizard trỏ cứng trực tiếp vào `toolId`.
    2. Bổ sung `deadlineEngine.js` để nâng cấp `BirthWizard` từ hạn chót dạng chữ tĩnh sang hạn chót tính theo ngày sinh thực tế.
    3. Thiết kế contract `ChecklistItem` có khả năng tương thích ngược hoàn toàn với dữ liệu của cả hai wizard hiện có.

**Hệ thống sẵn sàng tiến hành lập Kế Hoạch Triển Khai Chi Tiết Phase 6 (PHASE_06_IMPLEMENTATION_PLAN.md).**

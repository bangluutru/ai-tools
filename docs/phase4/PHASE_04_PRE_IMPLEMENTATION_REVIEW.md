# Đánh Giá Dự Bị Triển Khai Phase 4: Japan Life → Work & Employment (仕事・雇用)

> **Mã tài liệu**: `docs/phase4/PHASE_04_PRE_IMPLEMENTATION_REVIEW.md`  
> **Thời điểm lập**: 2026-09-10  
> **Tác giả**: Toolio Architecture & Regulatory Engineering Team  
> **Kết luận Review Gate**: **READY** (Không có rào cản kiến trúc hoặc technical debt ngăn cản Phase 4)

---

## 1. Bối Cảnh & Mục Tiêu

Tiếp nối thành công của:
- **Phase 1**: Domain Group Foundation (`common`, `japan-life`, `vietnam-life`)
- **Phase 2**: Regulatory Foundation + Japan Tax Audit
- **Phase 3**: Japan Life → Insurance & Pension (4 miniapps, 100% PASS, Tag `phase3-japan-insurance-final-pass`)

Phase 4 khởi động xây dựng tên miền chuyên sâu thứ 3 trong nhóm `japan-life`:  
**Work & Employment (仕事・雇用)** với 05 mini-apps:
1. `overtime-calculator-jp` (残業代シミュレーター - Overtime Pay)
2. `paid-leave-checker-jp` (有給休暇チェッカー - Annual Paid Leave Entitlement)
3. `unemployment-eligibility-jp` (失業給付受給資格チェッカー - Unemployment Eligibility)
4. `unemployment-benefit-jp` (失業給付シミュレーター - Unemployment Allowance Amount & Duration)
5. `leaving-job-wizard-jp` (退職手続きガイド - Leaving Job Step-by-Step Wizard & Orchestrator)

---

## 2. Kết Quả Rà Soát 8 Câu Hỏi Kiểm Soát (The 8 Review Questions)

### Câu hỏi 1: Tên miền Insurance/Pension có thực sự độc lập với Tax?
- **Kiểm chứng thực tế**:
  - `packages/core/src/japan/insurance/` có **0 import** từ `packages/core/src/utils/tax/`.
  - Công cụ `dependent-insurance-jp` có liên kết sang Tax nhưng thực hiện 100% bằng hash router `#/tools/japan-tax-simulator`, không import code.
  - Lệnh `npm run graph:audit` xác nhận đồ thị phụ thuộc giữa các miền hoàn toàn độc lập (0 cross-domain imports).
- **Kết luận**: ĐỘC LẬP HOÀN TOÀN.

### Câu hỏi 2: Có shared employment-related data nào đã tồn tại trong codebase không?
- **Kiểm chứng thực tế**:
  - `packages/core/src/japan/insurance/rules/employmentInsuranceRates.js`: Chứa biểu phí đóng BHTN FY2026 (Người lao động: 5/1000, Doanh nghiệp: 8.5/1000).
  - `packages/core/src/japan/insurance/rules/eligibilityRules.js`: Chứa ngưỡng tham gia BHXH (tuần $\ge 20$h, tháng $\ge 8.8$ vạn JPY, DN $\ge 51$ người).
- **Đánh giá**:
  - Biểu phí BHTN trong Insurance phục vụ việc *khấu trừ phí bảo hiểm từ lương* (社会保険料控除).
  - Trợ cấp thất nghiệp trong Phase 4 (失業等給付・基本手当) phục vụ việc *chi trả trợ cấp khi mất việc*, dựa trên `賃金日額` (Mức lương bình quân ngày) và `所定給付日数` (Số ngày chi trả luật định).
- **Kết luận**: Hai bài toán có mô hình toán và dữ liệu khác nhau. Giữ biểu phí đóng ở `insurance/rules`, xây dựng logic trợ cấp độc lập trong `employment/rules`.

### Câu hỏi 3: Biểu phí và quy tắc 雇用保険 nằm ở đúng domain hay cần chia sẻ?
- **Kết luận**:
  - Biểu phí trích nộp (Premium Rate): Nằm tại `japan/insurance/rules/employmentInsuranceRates.js` (phục vụ tính lương/thuế/bảo hiểm hàng tháng).
  - Tiêu chuẩn hưởng trợ cấp thất nghiệp (Unemployment Benefits): Nằm tại `japan/employment/unemployment/` (phục vụ người lao động khi rời doanh nghiệp).
  - Không gộp hai module làm một để tránh phình to blast radius khi luật bảo hiểm sửa đổi.

### Câu hỏi 4: Regulatory Foundation có hỗ trợ nhiều kỳ hiệu lực trong cùng một năm (Multiple Effective Periods in One Year)?
- **Kiểm chứng thực tế**:
  - `packages/core/src/regulatory/effectivePeriod.js` đã được thiết kế sẵn với loại `effective-date-range` và hàm `isRuleApplicable(rule, { date })` so sánh trực tiếp chuỗi `YYYY-MM-DD`.
  - Điều này cực kỳ quan trọng cho Trợ cấp thất nghiệp Nhật Bản:
    - **MHLW điều chỉnh mức Trần/Sàn của Mức lương ngày (賃金日額) và Mức trợ cấp ngày (基本手当日額) vào ngày 01 tháng 08 hàng năm (8月1日改定)**.
    - Trong năm 2026, sẽ có 2 kỳ: kỳ trước 2026-08-01 và kỳ từ 2026-08-01 trở đi.
- **Kết luận**: NỀN TẢNG ĐÃ SẴN SÀNG, hỗ trợ đầy đủ việc resolve theo ngày nghỉ việc (`separationDate` / `applicableDate`).

### Câu hỏi 5: Source registry đã hỗ trợ tốt các nguồn MHLW / e-Gov / Cục Lao động chưa?
- **Kiểm chứng thực tế**:
  - `sourceRegistry.js` đã hỗ trợ phân loại `law`, `regulation`, `official-guidance`, `official-table`, `official-faq`, cùng thuộc tính `authority` và `url`.
  - Phase 4 sẽ bổ sung các nguồn chính thức cấp 1 (Tier-1 Primary):
    - `egov-labor-standards-act` (労働基準法)
    - `mhlw-overtime-premium-rates` (割増賃金率・月60時間超)
    - `mhlw-paid-leave-guidelines` (年次有給休暇・年5日取得義務)
    - `egov-employment-insurance-act` (雇用保険法)
    - `mhlw-unemployment-benefit-table-2026` (令和8年8月1日改定 基本手当日額算定表)
    - `mhlw-unemployment-eligibility-reasons` (特定受給資格者・特定理由離職者の範囲)
- **Kết luận**: ĐÃ SẴN SÀNG để đăng ký mới.

### Câu hỏi 6: Eligibility engine hiện tại có tái sử dụng được cho lao động không?
- **Kiểm chứng thực tế**:
  - Kiến trúc `EligibilityEngine` của Phase 3 (phân loại 4 trạng thái: `likely_eligible`, `likely_not_eligible`, `case_dependent`, `insufficient_info`, kèm checklist điều kiện chi tiết và cảnh báo thẩm quyền hành chính của cơ quan chức năng) là một thiết kế mẫu mực.
  - Phase 4 sẽ kế thừa pattern này cho:
    - `paidLeaveEligibilityEngine.js` (Kiểm tra điều kiện hưởng ngày phép năm)
    - `unemploymentEligibilityEngine.js` (Kiểm tra điều kiện hưởng trợ cấp thất nghiệp).
- **Kết luận**: TÁI SỬ DỤNG DESIGN PATTERN (không duplicate code).

### Câu hỏi 7: Shared UI components có đủ cho Leaving Job workflow sau này không?
- **Kiểm chứng thực tế**:
  - Core components (`StandardToolLayout`, `ResponsiveFormRow`, `Select`, `Input`, `Badge`, `Alert`, `Card`, `MetricCard`) đáp ứng đầy đủ cho các công cụ 1, 2, 3, 4.
  - Đối với Mini-app 5 (Leaving Job Wizard): Cần một component hiển thị tiến trình (Step Progress) và danh sách việc cần làm theo dòng thời gian (Interactive Checklist / Timeline: Trước nghỉ việc $\rightarrow$ Ngay khi nghỉ $\rightarrow$ Sau khi nghỉ).
- **Kết luận**: Tạo component chuyên dụng `LeavingJobChecklistTimeline` trong component của miniapp 5 hoặc promote lên core nếu đủ tính tổng quát.

### Câu hỏi 8: Registry / deep-link architecture có thể thực hiện orchestration mà không bị cross-import?
- **Kiểm chứng thực tế**:
  - `toolsRegistry.js` lưu trữ metadata định danh của tất cả công cụ.
  - Mini-app 5 sẽ là **Workflow Orchestrator** đầu tiên: từ câu trả lời của người dùng, tạo checklist cá nhân hóa và sinh thẻ điều hướng thông minh (Capability Deep Links) trỏ đến:
    - `#tools/unemployment-eligibility-jp`
    - `#tools/unemployment-benefit-jp`
    - `#tools/national-pension-jp`
    - `#tools/japan-tax-simulator`
  - Hoàn toàn KHÔNG import component hoặc engine của các công cụ mục tiêu.
- **Kết luận**: ĐẠT YÊU CẦU 100%.

---

## 3. Quyết Định Của Review Gate

- **Trạng thái**: **READY**
- **Không có technical debt chặn đường**.
- **Kế hoạch thực hiện**: Tiến hành lập chi tiết `docs/phase4/PHASE_04_IMPLEMENTATION_PLAN.md` và chờ phê duyệt (Approval Gate) trước khi bắt đầu viết mã nguồn cho Milestone 1.

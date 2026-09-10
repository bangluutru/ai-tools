# Phase 03 — Pre-Implementation Architectural Review

**Date**: 2026-09-10  
**Status**: **READY_WITH_SMALL_FIXES**  
**Review Target**: Japan Life → Insurance & Pension Domain (`japan-life / insurance`)  
**Auditor**: Antigravity Quality & Architecture Core  

---

## 1. Mục Đích & Bối Cảnh

Sau khi Phase 1 (Domain Group Foundation) và Phase 2 (Regulatory Foundation + Japan Tax 2026 Audit) đạt 100% PASS, Phase 3 mở rộng hệ sinh thái Toolio sang miền nghiệp vụ pháp lý mới đầu tiên: **Bảo hiểm xã hội & Hưu trí Nhật Bản (Insurance & Pension / 保険・年金)**.

Để tuân thủ tuyệt đối quy tắc *"Không xây trên giả định, kiểm duyệt trước khi viết mã"*, tài liệu này trả lời chi tiết 8 câu hỏi cốt lõi của Review Gate theo yêu cầu của dự án.

---

## 2. Trả Lời 8 Câu Hỏi Review Bắt Buộc

### Câu hỏi 1: Regulatory Source Registry có thực sự reusable ngoài Tax không?
- **Đánh giá**: **HOÀN TOÀN TÁI SỬ DỤNG ĐƯỢC 100%**.
- **Hiện trạng**: `packages/core/src/regulatory/sourceRegistry.js` được thiết kế theo schema chuẩn hóa độc lập với loại thuế:
  ```ts
  {
    id: string,
    country: 'JP' | 'VN',
    authority: string,
    title: string,
    url: string,
    sourceType: 'law' | 'regulation' | 'official-guidance' | 'official-table' | 'official-faq',
    language: 'ja' | 'vi' | 'en',
    lastVerifiedAt: string,
    status: 'official-primary' | 'official-secondary' | 'deprecated',
    notes?: string
  }
  ```
- **Hành động**: Đã có sẵn các nguồn của `日本年金機構` (JPS), `厚生労働省` (MHLW), `全国健康保険協会` (Kyokai Kenpo), `こども家庭庁` (CFA). Cần đăng ký thêm các bảng quy chuẩn bậc lương chuẩn (標準報酬月額), điều kiện tham gia (適用拡大) và điều kiện phụ thuộc (被扶養者認定).

### Câu hỏi 2: Rule Metadata có support fiscal-year / date ranges không?
- **Đánh giá**: **CÓ, HỖ TRỢ HOÀN TOÀN**.
- **Hiện trạng**: `packages/core/src/regulatory/ruleMetadata.js` và `effectivePeriod.js` hỗ trợ đầy đủ 4 loại kỳ áp dụng:
  - `fiscal-year`: Dùng trực tiếp cho năm tài chính Nhật Bản (01/04 → 31/03 năm kế tiếp), ví dụ `令和8年度`.
  - `tax-year`: Dùng cho năm tính thuế (01/01 → 31/12).
  - `calendar-year`: Năm dương lịch.
  - `effective-date-range`: Khoảng ngày hiệu lực tuyệt đối `[effectiveFrom, effectiveTo]`.

### Câu hỏi 3: Có thể resolve rule bằng applicable date thay vì chỉ year không?
- **Đánh giá**: **CÓ, ĐÃ ĐƯỢC THIẾT KẾ VÀ KIỂM THỬ XANH TẠI PHASE 2**.
- **Hiện trạng**: Phương thức `EffectivePeriod.isApplicableAtDate(rule, dateStr)` cho phép truyền chính xác ngày (ví dụ `2026-03-31` sẽ thuộc `FY2025`, trong khi `2026-04-01` sẽ thuộc `FY2026`).

### Câu hỏi 4: Japan Tax đang có social-insurance code nào cần reuse/migrate?
- **Đánh giá**: 
  - `packages/core/src/utils/tax/engines/socialInsuranceEngine.js` hiện đang tính bảo hiểm cho nhân viên và freelance ở mức độ ước tính (dùng lương gộp nhân với tỷ lệ).
  - Đối với Insurance Domain chuyên sâu, hệ thống bảo hiểm Nhật bắt buộc phải tính theo **Hạng mức lương chuẩn (標準報酬月額等級)** và **Mức thưởng chuẩn (標準賞与額)**.
- **Hành động**: 
  - Xây dựng domain độc lập `packages/core/src/japan/insurance/` với engine tính toán theo bảng bậc chính thức của JPS và Kyokai Kenpo.
  - `packages/core/src/utils/tax/engines/socialInsuranceEngine.js` sẽ giữ nguyên giao diện tương thích ngược, bên dưới có thể ủy nhiệm (delegate) hoặc dùng chung bảng biểu với Insurance domain.

### Câu hỏi 5: Có cross-domain dependency nào sẽ phát sinh nếu Insurance dùng Tax code không?
- **Đánh giá**: **CẤM TUYỆT ĐỐI IMPORT TỪ INSURANCE SANG TAX**.
- **Quy tắc**:
  - Không bao giờ cho phép `hub/src/tools/social-insurance-jp/` import từ `packages/core/src/utils/tax/`.
  - Cấu trúc phụ thuộc đúng chuẩn MAIS:
    ```
    Japan Tax Miniapp               Japan Insurance Miniapps
           \                                   /
            \                                 /
             ▼                               ▼
       @ai-tools/core (shared regulatory / theme / insurance engine)
    ```

### Câu hỏi 6: Shared design components hiện có đủ cho calculator/checker mới không?
- **Đánh giá**: **CƠ BẢN ĐÃ ĐỦ, CẦN BỔ SUNG 1 PATTERN CHECKER CHUYÊN DỤNG**.
- **Hiện có**: `StandardToolLayout`, `SectionCard`, `ToolHeader`, `ToolContainer`, `RegulatorySourceSection`.
- **Hành động**: Tạo thêm component tái sử dụng `EligibilityResultCard.jsx` trong `@ai-tools/core` để hiển thị nhất quán kết luận kiểm tra điều kiện (Likely mandatory / Likely not mandatory / Case-dependent / Insufficient info) cùng danh sách tiêu chí đạt/chưa đạt.

### Câu hỏi 7: Regulatory Gate Phase 2 có áp dụng được cho Insurance không?
- **Đánh giá**: **ÁP DỤNG ĐƯỢC, NHƯNG CẦN SỬA NHẸ CƠ CHẾ QUÉT ĐƯỜNG DẪN**.
- **Hiện trạng**: Trong `scripts/audit-miniapp.mjs`, hàm `auditGateRegulatory` đang kiểm tra file cứng `taxRules2026Path`.
- **Hành động**: Nâng cấp để `auditGateRegulatory` kiểm tra file quy chuẩn linh hoạt theo `tool.domain`:
  - Nếu `tool.domain === 'tax'`: kiểm tra `tax/rules/2026/index.js`.
  - Nếu `tool.domain === 'insurance'`: kiểm tra `japan/insurance/rules/index.js`.

### Câu hỏi 8: Có technical debt nào phải sửa trước khi tạo mini-app mới không?
- **Đánh giá**: Cần thực hiện **2 Small Fixes** an toàn:
  1. Đăng ký bổ sung 5 nguồn pháp quy Tier-1 cho Insurance vào `sourceRegistry.js`.
  2. Nâng cấp bộ lọc của `auditGateRegulatory` trong `scripts/audit-miniapp.mjs` để hỗ trợ đa domain (`tax` và `insurance`).

---

## 3. Quyết Định Của Review Gate

**KẾT LUẬN: `READY_WITH_SMALL_FIXES`**

Sau khi hoàn thành 2 sửa đổi nền tảng trên và xác minh lại toàn bộ baseline Phase 2 vẫn 100% xanh, checkpoint `pre-japan-insurance-phase3-20260910` sẽ được tạo và bắt đầu triển khai Milestone 2.

# Japan Life V1: UX, Accessibility & I18N Master Audit

- **Date**: 2026-09-11
- **Status**: 100% PASS (Checkpoint C4)
- **Supported Locales**: Japanese (`ja`), Vietnamese (`vi`), English (`en`)
- **WCAG Standard**: WCAG 2.1 AA Compliance

---

## 1. Shared UX Patterns & Consistency

| Tool Category | Standard Architecture | Verified Consistency |
| :--- | :--- | :--- |
| **Deterministic Calculators** (Tax, Overtime, Pension, Benefits) | 1. Input Form (progressive / structured)<br/>2. Result Summary (Net / Breakdown)<br/>3. Provenance & Calculation Basis (Why)<br/>4. Expandable Detailed Tables<br/>5. Official Statutory Sources | Verified across all 11 calculators. Unified card structures, badges, and export actions. |
| **Eligibility Checkers** (Social Ins, Childcare, Work Scope, PR) | 1. Questions / Criteria Checklist<br/>2. Discretionary Assessment Badge<br/>3. Detailed Reason Codes<br/>4. Actionable Next Steps / Advice<br/>5. Legal Basis & Sources | Verified across all 10 checkers. Zero false certainty (no "100% eligible" or "guaranteed"). |
| **Life Event Wizards & Guides** (Starting Life, Changing Job, etc.) | 1. Context & Profile Inputs<br/>2. Multi-stage Timeline View<br/>3. Interactive Checklist with Persistence<br/>4. Semantic Capability Quick Links<br/>5. Primary Regulatory Sources | Verified across all 7 canonical life events. Consistent progress bar, status badges, and reset dialog. |

---

## 2. Legal Terminology Consistency (JA / VI / EN)

| Japanese Canonical Term | Vietnamese Standard Term | English Standard Term | Common Anti-pattern Avoided |
| :--- | :--- | :--- | :--- |
| **在留資格** (Zairyū Shikaku) | Tư cách lưu trú | Status of Residence | Never casually confused with entry "visa" (thị thực). |
| **被扶養者** (Hifuyōsha) | Người phụ thuộc BHYT | Health Insurance Dependent | Distinct from tax dependent (控除対象扶養親族). |
| **給与所得控除** (Kyūyo Shotoku Kōjo) | Khấu trừ tiền lương | Employment Income Deduction | Not confused with Basic Deduction (基礎控除). |
| **課税所得** (Kazei Shotoku) | Thu nhập tính thuế | Taxable Income | Distinguished from gross revenue/salary (額面給与). |
| **標準報酬月額** (Hyōjun Hōshū Getsugaku) | Mức lương tiêu chuẩn bình quân | Standard Monthly Remuneration | Explicitly explained as the tiered bracket basis for Shakai Hoken. |
| **育児休業** (Ikuji Kyūgyō) | Nghỉ chăm con (Luật Lao động) | Childcare Leave | Distinguished from post-birth dad leave (産後パパ育休). |
| **住民票の写し** (Jūminhyō no Utsushi) | Bản sao Phiếu cư trú | Resident Record Copy | Canonical mapping for all municipal identity checks. |

---

## 3. Result States & Discretionary Taxonomy

All checkers, wizards, and calculators employ unified, conservative result taxonomies:

| Standard State | Visual Token | Semantics | Example Guidance |
| :--- | :--- | :--- | :--- |
| **Criteria Satisfied** | `bg-primary/10 text-primary border-primary/30` | Basic documentary/statutory criteria appear met based on user inputs. | "Các điều kiện cơ bản dường như thỏa mãn. Quyết định cấp phép thuộc thẩm quyền Bộ Tư pháp." |
| **Potential Issue** | `bg-amber-500/10 text-amber-500 border-amber-500/30` | Risk or gap identified (e.g. tax arrears, insufficient stay duration). | "Phát hiện điểm cần lưu ý: Khoảng cách giữa 2 công ty vượt quá 14 ngày mà chưa báo Cục XNC." |
| **Requires Authority** | `bg-blue-500/10 text-blue-500 border-blue-500/30` | Administrative discretion case (e.g., humanitarian grounds, PR conduct test). | "Cần xác nhận trực tiếp với cơ quan có thẩm quyền về từng trường hợp cụ thể." |
| **Unsupported / Unverified** | `bg-surface-variant text-on-surface-variant` | Out-of-bounds period or unverified municipality. | "Thời điểm này chưa có biểu phí cập nhật chính thức. Áp dụng chuẩn quốc gia ước tính." |
| **Input Error** | `bg-error/10 text-error border-error/30` | Validation failure (negative salary, impossible date). | "Vui lòng nhập ngày nộp đơn hợp lệ." |

---

## 4. Accessibility (WCAG 2.1 AA Compliance)

- **Keyboard Navigation**:
  - Full tab stop order across forms, dropdowns, cards, dialogs, and external links.
  - Visible focus rings with high-contrast outlines (`focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2`).
- **Color Contrast (Light & Dark Themes)**:
  - Contrast ratios verified > 4.5:1 for normal text and > 3:1 for large/bold text across both Light and Dark modes.
  - Card stage badges upgraded to `bg-surface-container-high text-on-surface border border-outline/30` to prevent low contrast against light backgrounds.
- **Multimodal State Indicators**:
  - Every alert, warning, success, and error condition pairs icons (Lucide React), clear text descriptions, and semantic role attributes (`role="alert"`, `aria-live="polite"`). Never relies on color alone.
- **Text Scaling & 200% Zoom**:
  - CSS layout relies on flexbox, grid, and fluid typography tokens (`rem`/`em`/`dvh`) without clipping or horizontal text collision at 200% browser zoom.

---

## 5. Responsive Design Across 4 Device Form Factors

| Form Factor | Viewport Dimensions | Layout Verification |
| :--- | :--- | :--- |
| **Mobile Narrow** | 320px x 640px | Single-column stacking, collapsible drawers, touch targets >= 44x44px. Zero horizontal scroll overflow. |
| **Mobile Standard** | 375px x 812px | Optimized keypad entry, sticky bottom bar for calculation summaries. |
| **Tablet** | 768px x 1024px | 2-column balanced form + live sticky summary card. |
| **Desktop / Large** | 1280px ~ 1920px | Standard max-w-[1240px] container, multi-column breakdown tables with full accessibility. |

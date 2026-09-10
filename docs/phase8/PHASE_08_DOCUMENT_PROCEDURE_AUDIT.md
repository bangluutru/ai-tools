# BÁO CÁO KIỂM TOÁN TỔNG THỂ LOGIC GIẤY TỜ & THỦ TỤC HÀNH CHÍNH (PHASE 8 AUDIT)
**Toolio Engineering Architecture — Japan Life → Administrative Procedures & Documents**  
**Tài liệu:** `docs/phase8/PHASE_08_DOCUMENT_PROCEDURE_AUDIT.md`  
**Thời gian kiểm toán:** Tháng 09/2026  
**Trạng thái thẩm định:** READY  

---

## 1. Mục Đích & Phạm Vi Kiểm Toán

Trong quá trình triển khai các Phase từ 1 đến 7 (Tax, Insurance, Employment, Family, Housing, Immigration), nhiều miniapp đã đề cập đến các văn bản hành chính công của Nhật Bản như *Phiếu cư trú (住民票)*, *Chứng nhận thuế (課税・納税証明書)*, *Trích lục hộ tịch (戸籍謄本)*, *Phiếu khấu trừ thuế (源泉徴収票)*, *Thẻ ngoại kiều (在留カード)*, *Thẻ My Number*, v.v.

Tuy nhiên, các định nghĩa này hiện đang nằm rải rác dưới dạng:
- Các chuỗi ký tự cứng trong UI (Hardcoded strings).
- Mô tả yêu cầu trong các checklist của từng miniapp riêng rẽ.
- Thiếu lớp định danh thực thể dùng chung (Canonical Document Identity).
- Nhầm lẫn giữa **Bản thân giấy tờ (Document)** và **Yêu cầu giấy tờ của thủ tục (Document Requirement)** (ví dụ: gán cứng "住民票 có thời hạn 3 tháng" vào chính giấy tờ, thay vì hiểu rằng thời hạn 3 tháng là do thủ tục yêu cầu).

Mục tiêu của Phase 8 là xây dựng một **Shared Procedure & Document Layer** giúp người dùng giải đáp chính xác:
1. *Tôi cần giấy gì cho thủ tục này?*
2. *Giấy này lấy ở đâu?*
3. *Có lấy online được không?*
4. *Có lấy ở Conbini (コンビニ) được không?*
5. *Cần bản gốc hay bản sao?*
6. *Giấy cần thời hạn cấp bao lâu?*
7. *Cơ quan nào cấp?*
8. *Những thủ tục nào khác cần giấy này?*

---

## 2. Bảng Đối Soát Trùng Lặp & Phân Bố Hiện Tại Giữa Các Domain

| Chứng từ / Giấy tờ | Các Domain Hiện Đang Sử Dụng | Hiện Trạng Trong Mã Nguồn | Vấn Đề Kiến Trúc & Rủi Ro |
|---|---|---|---|
| **住民票の写し**<br>(Phiếu cư trú Juminhyo) | • **Insurance** (`DependentInsurance`)<br>• **Immigration** (`Renewal`, `Family`, `PR`, `Arrival`, `Departure`)<br>• **Employment** (`UnemploymentEligibility`)<br>• **Housing** (`AddressChange`, `MovingWizard`)<br>• **Family** (`BirthWizard`) | Xuất hiện 25+ lần dưới các chuỗi string: `"世帯全員の記載のある住民票の写し（マイナンバー省略、3か月以内発行）"`, `"新住所が記載された住民票"`, `"個人番号記載の住民票"` | • Trùng lặp chuỗi i18n.<br>• Nhầm lẫn giữa yêu cầu hiển thị My Number (thủ tục thuế cần, nhưng nhập cảnh cấm hiển thị).<br>• Người dùng không biết lấy ở đâu (Tòa thị chính vs Konbini). |
| **課税証明書**<br>(Chứng nhận đánh thuế cư trú) | • **Housing** (`MovingAdminRules`)<br>• **Immigration** (`Family`, `StatusChange`, `PR`) | Xuất hiện rải rác: `"住民税課税証明書"`, `"所得課税証明書"`, `"直近N年間の課税証明書"` | • Hay bị gộp chung với `納税証明書` thành một chuỗi `"課税・納税証明書"`.<br>• Người dùng không biết phải xin tại Tòa thị chính nơi cư trú vào ngày **01 tháng 01** của năm tính thuế, chứ không phải nơi ở hiện tại. |
| **納税証明書**<br>(Chứng nhận nộp thuế cư trú) | • **Immigration** (`Renewal`, `Family`, `StatusChange`, `PR`) | Thường đi đôi với 課税証明書 để chứng minh hoàn thành nghĩa vụ công dân | • Thiếu phân biệt giữa **Thuế cư trú địa phương (住民税の納税証明書)** do Tòa thị chính cấp và **Thuế thu nhập quốc gia (その1, その2, その3 của 国税納税証明書)** do Cơ quan thuế (税務署) cấp. |
| **所得証明書**<br>(Chứng nhận thu nhập) | • **Housing** (`MovingAdmin`)<br>• **Immigration** (`Family`, `PR`) | Tên gọi dân dã của 課税証明書 (có ghi chi tiết thu nhập) | • Dễ gây nhầm lẫn là một văn bản độc lập khác; thực tế nhiều địa phương cấp chung mẫu `所得・課税証明書`. |
| **戸籍全部事項証明書 / 戸籍謄本**<br>(Trích lục hộ tịch cả hộ) | • **Immigration** (`StatusChange`, `Renewal`, `Family`, `PR`)<br>• **Employment** (`UnemploymentEligibility`)<br>• **Family** (`BirthWizard`) | Chuỗi text: `"配偶者（日本人）の戸籍謄本（全部事項証明書、3か月以内発行）"` | • Người dùng thường đến nhầm Tòa thị chính nơi đang sống thay vì nơi đăng ký Hộ tịch (**本籍地**).<br>• Chưa cập nhật chế độ cấp toàn quốc (広域交付制度) có hiệu lực từ 01/03/2024. |
| **印鑑登録証明書**<br>(Chứng nhận con dấu đã đăng ký) | • **Immigration** (`Arrival`)<br>• **Housing** (Hợp đồng thuê nhà, mua xe) | Nêu trong phần hướng dẫn sau khi đến Nhật | • Người dùng không biết điều kiện tiên quyết: phải làm thủ tục đăng ký con dấu (実印登録) trước thì mới xin được chứng nhận. |
| **給与所得の源泉徴収票**<br>(Phiếu khấu trừ thuế thu nhập) | • **Employment** (`LeavingJob`)<br>• **Immigration** (`Renewal`, `StatusChange`)<br>• **Tax** (`JapanTaxSimulator`, `TaxCalculator`) | Được yêu cầu nộp trong thủ tục gia hạn visa và thủ tục chuyển việc | • Nhiều người nước ngoài nhầm tưởng giấy này do Cục Thuế cấp, trong khi luật định (Điều 226 Luật Thuế thu nhập) do **Doanh nghiệp / Người sử dụng lao động** cấp. |
| **離職票 (1 & 2)**<br>(Phiếu báo thôi việc BHTN) | • **Employment** (`LeavingJob`, `UnemploymentEligibility`) | Quy định trong Luật Bảo hiểm việc làm Điều 7 | • Do Hello Work phát hành thông qua người sử dụng lao động gửi cho người lao động. |
| **在職証明書**<br>(Giấy xác nhận công tác) | • **Immigration** (`Renewal`, `Family`, `PR`) | Được yêu cầu làm bằng chứng người bảo lãnh có việc làm ổn định | • Do Doanh nghiệp hiện tại cấp. |
| **在留カード / パスポート**<br>(Thẻ cư trú & Hộ chiếu) | • Toàn bộ các domain Nhật Bản | Giấy tờ tùy thân cốt lõi | • Xuất trình bản gốc để đối chiếu khi làm thủ tục hành chính. |

---

## 3. Phân Loại Ranh Giới Kiến Trúc Theo 6 Nhóm

1. **Reusable Document Identity (Định danh thực thể chứng từ dùng chung)**:
   - Bản chất của văn bản: tên chuẩn mực tiếng Nhật, tên tiếng Việt, tên tiếng Anh, bí danh thông dụng (aliases), phân nhóm (dân sự, thuế, hộ tịch, lao động, tùy thân), cơ quan có thẩm quyền phát hành (municipality, tax-office, employer, hello-work, embassy).
2. **Procedure-Specific Requirement (Yêu cầu riêng biệt theo thủ tục)**:
   - Gắn với từng thủ tục cụ thể: Ví dụ thủ tục gia hạn visa yêu cầu Juminhyo *không có My Number* và *cấp trong 3 tháng*, trong khi thủ tục đăng ký việc làm Hello Work yêu cầu Juminhyo *có ghi My Number*.
3. **Authority-Specific Variant (Biến thể theo cơ quan thẩm quyền)**:
   - Phân biệt thẩm quyền phát hành: Tòa thị chính (市区町村役場), Cơ quan thuế quốc gia (税務署), Cơ quan bảo hiểm / hưu trí (年金事務所 / 年金機構), Cơ quan việc làm (ハローワーク), Người sử dụng lao động (勤務先).
4. **Municipality-Specific Rule (Quy tắc địa phương / Municipality)**:
   - Khả năng cấp tại Konbini: Đa số cấp Juminhyo và Inkan, nhưng một số địa phương chưa liên kết cấp Koseki tại Konbini.
   - Biểu phí: Lấy tại quầy 300 JPY, lấy tại Konbini với thẻ My Number thường được giảm còn 200 JPY (tùy địa phương).
5. **Pure UI Duplication (Trùng lặp hiển thị)**:
   - Các đoạn văn bản giải thích "lấy giấy này ở đâu" bị gõ đi gõ lại trong nhiều component khác nhau.
6. **Intentional Difference (Sự khác biệt có chủ đích theo luật)**:
   - Giấy tờ chứng minh thu nhập: Thuế cư trú tính theo năm tài chính (01/01 đến 31/12 của năm trước), do đó vào các tháng 1 đến tháng 5 hàng năm, giấy chứng nhận thuế chỉ cấp được cho năm trước nữa (năm mới nhất chưa chốt sổ thuế cư trú cho đến tháng 6).

---

## 4. Giải Đáp 8 Câu Hỏi Kiến Trúc Cốt Lõi (Architecture Review)

### Câu hỏi 1: Một document có canonical ID toàn Toolio không?
**Trả lời:** **CÓ**.
Mọi chứng từ văn bản được định danh bởi một Canonical ID duy nhất, độc lập với ngôn ngữ hiển thị:
- `document.resident-record-copy` (住民票の写し)
- `document.taxation-certificate` (住民税課税証明書)
- `document.tax-payment-certificate` (住民税納税証明書)
- `document.income-certificate` (所得証明書)
- `document.family-register-full` (戸籍全部事項証明書 / 戸籍謄本)
- `document.seal-registration-certificate` (印鑑登録証明書)
- `document.withholding-slip` (給与所得の源泉徴収票)
- `document.employment-certificate` (在職証明書)
- `document.separation-notice` (雇用保険被保険者離職票)
- `document.passport` (パスポート)
- `document.residence-card` (在留カード)
- `document.my-number-card` (マイナンバーカード)

### Câu hỏi 2: Document Requirement có tách khỏi bản thân Document không?
**Trả lời:** **BẮT BUỘC TÁCH RỜI HOÀN TOÀN**.
- `DocumentDefinition`: Đại diện cho bản chất loại giấy tờ (Ai cấp? Cách lấy? Kênh cấp? Độ nhạy cảm?).
- `DocumentRequirement`: Đại diện cho mối quan hệ giữa Thủ tục và Giấy tờ:
  ```typescript
  interface DocumentRequirement {
    procedureId: string;
    documentId: string;
    requirementType: 'mandatory' | 'conditional' | 'optional';
    originalOrCopy: 'original' | 'copy' | 'presentation';
    maxAgeMonths?: number; // Ví dụ: 3 tháng gần nhất
    includeFields?: string[]; // Ví dụ: ['all-household-members']
    excludeFields?: string[]; // Ví dụ: ['my-number']
    taxYearRule?: 'latest-year' | 'previous-year' | 'specific-years';
    conditionDescription?: { ja: string; vi: string; en: string };
    sourceId: string;
  }
  ```

### Câu hỏi 3: Issuing authority có structured metadata không?
**Trả lời:** **CÓ**.
Model thẩm quyền cấp phát qua enum chuẩn:
- `municipality-resident`: Tòa thị chính nơi cư trú hiện tại.
- `municipality-tax`: Tòa thị chính nơi người dùng cư trú vào ngày 01/01 của năm tính thuế.
- `municipality-domicile`: Tòa thị chính nơi đăng ký Hộ tịch (本籍地).
- `tax-office`: Cơ quan thuế quốc gia (所轄税務署).
- `employer`: Người sử dụng lao động / Công ty.
- `public-employment-office`: Trung tâm giới thiệu việc làm (ハローワーク).
- `pension-office`: Cơ quan Hưu trí Nhật Bản (日本年金機構 / 年金事務所).
- `foreign-authority`: Cơ quan đại diện ngoại giao / Đại sứ quán / Chính phủ nước ngoài.

### Câu hỏi 4: Validity requirement thuộc document hay procedure?
**Trả lời:** **Thuộc `DocumentRequirement` (Procedure-specific)**.
Bản thân tờ giấy Juminhyo hay Koseki không có ngày "hết hạn tự nhiên". Chỉ khi một thủ tục cụ thể (ví dụ: Gia hạn visa tại ISA yêu cầu giấy tờ cấp trong vòng 3 tháng; hay Đăng ký kết hôn yêu cầu Koseki cấp trong vòng 3 tháng) thì yêu cầu về độ mới (freshness) mới phát sinh.

### Câu hỏi 5: Municipality có thể override availability/fee/method không?
**Trả lời:** **CÓ**.
Triển khai cơ chế phân tầng:
1. **National Baseline Policy**: Tiêu chuẩn quốc gia quy định trong luật và hướng dẫn của Digital Agency / J-LIS.
2. **Municipality Local Overrides**: Khả năng cung cấp tại Konbini, mức lệ phí chênh lệch (ví dụ: 300円 tại quầy vs 200円 tại Konbini), giờ phục vụ địa phương.
3. **Graceful Fallback cho Unverified Municipalities**: Nếu người dùng chọn địa phương chưa được nạp dữ liệu xác minh chi tiết, hệ thống hiển thị thông báo rõ ràng: *"Toolio chưa xác minh chi tiết biểu phí địa phương này. Dưới đây là thông tin tiêu chuẩn quốc gia kèm hướng dẫn tra cứu tại Tòa thị chính của bạn."*

### Câu hỏi 6: Online / convenience-store / in-person methods được model thế nào?
**Trả lời:** **Model thông qua `AcquisitionChannel`**:
```typescript
interface AcquisitionChannel {
  channelType: 'convenience-store' | 'municipal-counter' | 'online' | 'mail' | 'employer';
  isAvailable: boolean;
  prerequisites: string[]; // e.g. ['my-number-card', 'user-cert-pin-4digit']
  operatingHoursText?: { ja: string; vi: string; en: string };
  feeAmountJpy?: number;
  officialServiceUrl?: string;
  notes?: { ja: string; vi: string; en: string };
}
```

### Câu hỏi 7: Life Event checklist có thể reference Procedure/Document capability không?
**Trả lời:** **CÓ**.
Thông qua `capabilityRegistry.js`. Ví dụ:
- `moving-wizard-jp` liên kết đến `'document.residentRecord.acquire'` để mở hướng dẫn lấy Juminhyo mới.
- `leaving-job-wizard-jp` liên kết đến `'document.withholdingSlip.guide'` để mở hướng dẫn nhận Gensen Choshuhyo từ công ty cũ.
- Hoàn toàn không import trực tiếp mã nguồn giữa các domain.

### Câu hỏi 8: Có nguy cơ Immigration $\to$ Document domain coupling trực tiếp không?
**Trả lời:** **HOÀN TOÀN KHÔNG**.
Lớp `documents/` và `procedures/` đóng vai trò là Shared Infrastructure Layer trong `@ai-tools/core`. Các domain chuyên môn chỉ đăng ký dữ liệu requirement vào registry hoặc truy vấn qua resolver function, không hề phụ thuộc lẫn nhau.

---

## 5. Kết Luận Đợt Rà Soát (Review Result)

- **Kết luận:** **`READY`**
- Toàn bộ cơ sở hạ tầng hiện tại (Regulatory Foundation, RuleMetadata, LifeEvent Foundation, Capability Registry, Design System) hoàn toàn sẵn sàng tiếp nhận Phase 8 mà không gặp bất kỳ điểm nghẽn kiến trúc (blocking issues) nào.

---
*Báo cáo được lập tự động và xác thực bởi Toolio Quality Engineering.*

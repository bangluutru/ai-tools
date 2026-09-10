# Kế Hoạch Triển Khai Chi Tiết Phase 4: Japan Life → Work & Employment (仕事・雇用)

> **Mã tài liệu**: `docs/phase4/PHASE_04_IMPLEMENTATION_PLAN.md`  
> **Thời điểm lập**: 2026-09-10  
> **Tác giả**: Toolio Architecture & Regulatory Engineering Team  
> **Trạng thái**: PENDING APPROVAL (Chờ phê duyệt trước khi viết mã nguồn)  
> **Tuân thủ**: Không code tùy hứng, từng milestone độc lập và có checkpoint kiểm thử.

---

## 1. Mục Tiêu & Phạm Vi Tổng Thể (Scope)

Phase 4 xây dựng tên miền chuyên sâu thứ 3 trong nhóm sản phẩm `japan-life`:  
**Work & Employment (仕事・雇用)** nhằm giải quyết các quyền lợi thiết thân nhất của người lao động tại Nhật Bản: tiền làm thêm giờ (tăng ca), ngày nghỉ phép có lương, điều kiện & số tiền trợ cấp thất nghiệp, và quy trình thủ tục trọn gói khi nghỉ việc.

Hệ thống bao gồm **05 mini-app độc lập** phát triển theo đúng thứ tự tuần tự:
1. **`overtime-calculator-jp`** (残業代シミュレーター - Overtime Pay Calculator)
2. **`paid-leave-checker-jp`** (有給休暇チェッカー - Annual Paid Leave Entitlement Checker)
3. **`unemployment-eligibility-jp`** (失業給付受給資格チェッカー - Unemployment Benefit Eligibility Checker)
4. **`unemployment-benefit-jp`** (失業給付シミュレーター - Unemployment Benefit Amount & Schedule Simulator)
5. **`leaving-job-wizard-jp`** (退職手続きガイド - Leaving Job Step-by-Step Wizard & Orchestrator)

---

## 2. Nghiên Cứu Pháp Quy Chính Thống (Legal Research Scope)

Mọi tỷ lệ, ngưỡng số và công thức trong Phase 4 đều bắt nguồn từ nguồn luật gốc (Primary Authorities), tuyệt đối không dùng nguồn blog/SEO:

### 2.1. Tiền Làm Thêm Giờ & Phụ Trợ (割増賃金 - 労働基準法 第37条)
- **Căn cứ**: Luật Tiêu chuẩn Lao động Nhật Bản (労働基準法) Điều 37 và Pháp lệnh thi hành.
- **Biểu tỷ lệ phụ trội luật định**:
  - **Làm thêm giờ trong hạn mức pháp định (法定時間外労働 $\le 60$h/tháng)**: Tăng tối thiểu **$+25\%$** (Tỷ lệ 1.25).
  - **Làm thêm giờ vượt 60h/tháng (月60時間超の時間外労働)**: Tăng tối thiểu **$+50\%$** (Tỷ lệ 1.50) — *Lưu ý: Từ 01/04/2023, quy định này đã áp dụng bắt buộc cho cả doanh nghiệp vừa và nhỏ (中小企業).*
  - **Làm việc vào ban đêm (深夜労働 - 22:00 đến 05:00 sáng)**: Tăng tối thiểu **$+25\%$** (Tỷ lệ 1.25).
  - **Làm việc vào ngày nghỉ theo luật định (法定休日労働)**: Tăng tối thiểu **$+35\%$** (Tỷ lệ 1.35).
  - **Tổ hợp làm thêm giờ + Ban đêm (時間外 ＋ 深夜)**: Tối thiểu **$+50\%$** ($1.25 + 0.25 = 1.50$).
  - **Tổ hợp làm thêm giờ > 60h + Ban đêm (60h超 ＋ 深夜)**: Tối thiểu **$+75\%$** ($1.50 + 0.25 = 1.75$).
  - **Tổ hợp Ngày nghỉ luật định + Ban đêm (法定休日 ＋ 深夜)**: Tối thiểu **$+60\%$** ($1.35 + 0.25 = 1.60$).
- **Xác định mức lương giờ cơ bản làm căn cứ tính phụ trội (割増賃金の算定基礎となる賃金)**:
  - Người hưởng lương tháng: $\text{Lương giờ} = \frac{\text{Lương tháng cơ sở}}{\text{Số giờ làm việc quy định bình quân 1 tháng trong năm (1年間における1か月平均所定労働時間)}}$.
  - **7 khoản phụ cấp luật định bị LOẠI TRỪ (除外賃金)**:
    1. Tiền phụ cấp gia đình (家族手当)
    2. Tiền trợ cấp đi lại (通勤手当)
    3. Tiền phụ cấp sống xa gia đình (別居手当)
    4. Tiền trợ cấp giáo dục con cái (子女教育手当)
    5. Tiền trợ cấp nhà ở (住宅手当 - chỉ trừ khi tính theo chi phí thực tế)
    6. Tiền trả tạm thời bất thường (臨時に支払われた賃金 - tiền cưới hỏi, hiếu hỉ)
    7. Tiền thưởng trả định kỳ trên 1 tháng (1か月を超える期間ごとに支払われる賃金 - 賞与/Bonus).
  - Tất cả các phụ cấp khác (phụ cấp chức vụ 役職手当, phụ cấp chuyên cần 皆勤手当, phụ cấp tay nghề 資格手当...) đều **phải tính vào cơ sở lương giờ**.

---

### 2.2. Quyền Nghỉ Phép Năm (年次有給休暇 - 労働基準法 第39条)
- **Điều kiện phát sinh quyền nghỉ phép**:
  1. Đã làm việc liên tục từ **6 tháng** trở lên (雇入れの日から6か月間継続勤務).
  2. Tỷ lệ đi làm đạt từ **80%** trở lên trong thời gian quy định (全労働日の8割以上出勤).
- **Biểu ngày phép lao động thông thường (週5日 / 週30h trở lên)**:
  - 6 tháng: 10 ngày
  - 1 năm 6 tháng: 11 ngày
  - 2 năm 6 tháng: 12 ngày
  - 3 năm 6 tháng: 14 ngày
  - 4 năm 6 tháng: 16 ngày
  - 5 năm 6 tháng: 18 ngày
  - Từ 6 năm 6 tháng trở đi: **20 ngày/năm** (mức tối đa).
- **Biểu ngày phép tỷ lệ cho lao động Part-time/Baito (比例付与 - 週4日以下かつ週30h未満)**:
  - Phân loại theo số ngày làm việc trong tuần (週1日, 週2日, 週3日, 週4日) hoặc tổng số ngày làm việc trong năm (48-72 ngày, 73-120 ngày, 121-168 ngày, 169-216 ngày).
- **Nghĩa vụ của người sử dụng lao động (年5日の年次有給休暇取得義務)**:
  - Đối với lao động được cấp từ **10 ngày phép/năm trở lên**, doanh nghiệp có nghĩa vụ pháp lý phải cho nhân viên nghỉ **tối thiểu 5 ngày/năm** (vi phạm phạt tới 300,000円/nhân viên).
- **Thời hiệu (時効)**: Ngày phép có thời hiệu 2 năm kể từ ngày phát sinh quyền (có thể chuyển sang năm tiếp theo 1 lần).

---

### 2.3. Điều Kiện & Chế Độ Trợ Cấp Thất Nghiệp (雇用保険法)
- **Điều kiện chung để hưởng Trợ cấp cơ bản (基本手当)**:
  1. Có khả năng và ý chí làm việc (労働の意思及び能力).
  2. Đang tích cực tìm kiếm việc làm nhưng chưa tìm được (求職の申込み).
  3. Thời gian tham gia bảo hiểm thất nghiệp (被保険者期間):
     - **Thôi việc thông thường (自己都合退職)**: Có ít nhất **12 tháng** tham gia trong vòng 2 năm trước khi nghỉ việc (mỗi tháng tính phải có từ 11 ngày làm việc hoặc 80 giờ làm việc trở lên).
     - **Thôi việc do lý do doanh nghiệp hoặc bất khả kháng (特定受給資格者・特定理由離職者)**: Chỉ cần có ít nhất **6 tháng** tham gia trong vòng 1 năm trước khi nghỉ việc.
- **Thời gian chờ & Giới hạn chi trả**:
  - **Thời gian chờ bắt buộc (待期期間)**: 7 ngày kể từ khi nộp hồ sơ tại Hello Work (áp dụng cho mọi trường hợp).
  - **Giới hạn chi trả (給付制限期間)**:
    - Bị sa thải do lỗi cá nhân nghiêm trọng: 1 ~ 3 tháng.
    - Tự thôi việc vì lý do cá nhân (自己都合): Áp dụng quy tắc hiện hành (1 ~ 2 tháng).
    - **Chính sách miễn giới hạn mới**: Trường hợp tự thôi việc để tham gia khóa đào tạo nghề nghiệp được công nhận (教育訓練等) theo hướng dẫn mới của MHLW.
- **Mức lương ngày tính trợ cấp (賃金日額)**:
  - Tính từ tổng tiền lương thực tế trong 6 tháng trước ngày nghỉ (không bao gồm tiền thưởng 賞与) chia cho 180 ngày.
- **Mức trợ cấp ngày (基本手当日額) & Mốc hiệu lực 01/08/2026**:
  - MHLW ban hành bảng công thức tỷ lệ chi trả (50% ~ 80%, thu nhập càng thấp tỷ lệ càng cao) với mức sàn và mức trần theo 4 nhóm tuổi:
    1. Dưới 30 tuổi
    2. 30 đến 44 tuổi
    3. 45 đến 59 tuổi
    4. 60 đến 64 tuổi
  - Mức này được điều chỉnh định kỳ vào **ngày 01 tháng 08 hàng năm**. Engine phải hỗ trợ cơ chế giải quyết theo ngày nghỉ việc (`separationDate`).
- **Số ngày chi trả quy định (所定給付日数)**:
  - Biểu bảng 90 đến 360 ngày căn cứ vào: Lý do thôi việc, Độ tuổi tại thời điểm nghỉ, và Thâm niên tham gia BHTN.

---

### 2.4. Trình Tự Thủ Tục Khi Nghỉ Việc (Leaving Job Lifecycle)
1. **Giai đoạn chuẩn bị (Trước khi nghỉ)**:
   - Yêu cầu doanh nghiệp phát hành: Giấy báo thôi việc (離職票 - 離職票-1 & 離職票-2), Giấy chứng nhận thu nhập và thuế khấu trừ (源泉徴収票), Sổ tay hưu trí (年金手帳 / 基礎年金番号通知書).
   - Kiểm tra và sử dụng hết số ngày phép năm còn tồn (有給休暇の消化).
   - Trả lại thẻ bảo hiểm y tế doanh nghiệp (健康保険被保険者証) vào ngày cuối cùng làm việc.
2. **Giai đoạn nộp hồ sơ (Ngay sau khi nghỉ)**:
   - **Bảo hiểm y tế**: Quyết định 1 trong 3 hướng:
     a) Tiếp tục tự nguyện tham gia BHYT công ty cũ (任意継続 - phải nộp đơn trong 20 ngày, tự đóng 100% cả phần công ty).
     b) Tham gia BHYT Quốc dân (国民健康保険 - khai báo tại Shiyakusho trong vòng 14 ngày).
     c) Làm người phụ thuộc BHYT theo người thân (健康保険の被扶養者 - nếu thỏa mãn trần 130 vạn).
   - **Bảo hiểm Hưu trí**: Chuyển đổi từ 厚生年金 (Số 2) sang Quốc dân Hưu trí 国民年金第1号 (hoặc Số 3 nếu là người phụ thuộc) tại Shiyakusho trong vòng 14 ngày.
   - **Thất nghiệp**: Đến Hello Work quản lý khu vực cư trú để làm thủ tục `求職の申込み` ngay sau khi nhận được Giấy báo thôi việc (離職票).
3. **Giai đoạn xử lý thuế & quyết toán**:
   - Thuế cư trú (住民税): Lựa chọn khấu trừ một lần từ lương tháng cuối (一括徴収) hoặc chuyển sang tự đóng theo giấy báo (普通徴収).
   - Thuế thu nhập: Nộp giấy 源泉徴収票 cho công ty mới (nếu đi làm ngay) hoặc tự làm quyết toán thuế (確定申告) vào tháng 2-3 năm sau (nếu chưa có việc mới).

---

## 3. Kiến Trúc Tên Miền Mới (Domain Architecture)

Cấu trúc thư mục mã nguồn độc lập đặt tại `packages/core/src/japan/employment/`:

```
packages/core/src/japan/employment/
│
├── constants/
│   └── laborConstants.js          # Các hằng số luật lao động, loại trừ phụ cấp, ngày lễ
│
├── rules/
│   ├── overtimeRates.js           # Biểu tỷ lệ phụ trội 25%, 35%, 50%, 60%, 75%
│   ├── paidLeaveTables.js         # Bảng cấp ngày phép thông thường & tỷ lệ part-time
│   ├── unemploymentEligibilityRules.js # Tiêu chí lý do thôi việc, điều kiện 6/12 tháng
│   ├── unemploymentBenefitRates.js # Bảng trần sàn 賃金日額 & 基本手当日額 (Kỳ trước & sau 2026-08-01)
│   └── leavingJobProcedures.js    # Cây quyết định và danh mục thủ tục theo ngữ cảnh
│
├── engines/
│   ├── overtimeEngine.js          # Engine tính tiền làm thêm giờ
│   ├── paidLeaveEngine.js         # Engine xác định số ngày phép được cấp & nghĩa vụ 5 ngày
│   ├── unemploymentEligibilityEngine.js # Engine chẩn đoán tư cách hưởng trợ cấp
│   ├── unemploymentBenefitEngine.js    # Engine tính số tiền, số ngày và lịch trình dự kiến
│   └── leavingJobWizardEngine.js       # Engine tổng hợp checklist cá nhân hóa
│
└── index.js                       # Điểm xuất khẩu đồng nhất cho domain employment
```

### Ranh Giới Miền & Nguyên Tắc Không Khóa Chéo:
- Domain `employment` kế thừa trực tiếp từ `packages/core/src/regulatory/` (`OfficialSourceRegistry`, `EffectivePeriod`).
- **TUYỆT ĐỐI KHÔNG import** từ `packages/core/src/utils/tax/` hoặc `packages/core/src/japan/insurance/`.
- Leaving Job Wizard là bộ điều phối mức UI (UI Orchestrator), chỉ trỏ link thông qua URL hash:
  - `#/tools/unemployment-eligibility-jp`
  - `#/tools/unemployment-benefit-jp`
  - `#/tools/national-pension-jp`
  - `#/tools/japan-tax-simulator`

---

## 4. Danh Sách 05 Mini-apps & Thiết Kế Chi Tiết

| # | Mini-app ID | Tên hiển thị (JA / VI / EN) | Loại hình | Input chính | Output cốt lõi |
| :- | :--- | :--- | :--- | :--- | :--- |
| **M1** | `overtime-calculator-jp` | 残業代シミュレーター<br>Tính Tiền Làm Thêm Giờ<br>Overtime Pay Calculator | Calculator | Lương tháng/giờ, Giờ quy định/tháng, Phụ cấp loại trừ, Giờ làm thêm thường, Giờ >60h, Giờ đêm, Giờ ngày nghỉ | Tiền lương giờ cơ sở, Phân bổ từng loại phụ trội, Tổng tiền làm thêm giờ ước tính |
| **M2** | `paid-leave-checker-jp` | 有給休暇チェッカー<br>Kiểm Tra Ngày Nghỉ Phép Năm<br>Paid Leave Entitlement Checker | Checker | Ngày bắt đầu làm việc, Số ngày làm việc/tuần, Số giờ/tuần, Tỷ lệ đi làm $\ge 80\%$ | Số ngày phép được cấp theo luật, Ngày phát sinh đợt phép tiếp theo, Nghĩa vụ bắt buộc nghỉ 5 ngày của DN |
| **M3** | `unemployment-eligibility-jp` | 失業給付受給資格チェッカー<br>Kiểm Tra Đủ Điều Kiện BHTN<br>Unemployment Eligibility Checker | Checker | Lý do thôi việc (Tự nguyện/Công ty/Đặc biệt), Thời gian tham gia BHTN, Khả năng & ý muốn tìm việc | Đánh giá tư cách hưởng, Thời gian chờ (7 ngày), Thời gian giới hạn chi trả, Lưu ý thẩm quyền Hello Work |
| **M4** | `unemployment-benefit-jp` | 失業給付シミュレーター<br>Tính Mức Hưởng BHTN<br>Unemployment Benefit Simulator | Simulator | Ngày nghỉ việc, Tuổi, Lý do nghỉ việc, Thâm niên BHTN, Thu nhập bình quân 6 tháng | Lương ngày cơ sở (賃金日額), Mức trợ cấp ngày (基本手当日額), Số ngày hưởng (所定給付日数), Tổng số tiền nhận tối đa, Lịch trình thanh toán ước tính |
| **M5** | `leaving-job-wizard-jp` | 退職手続きガイド<br>Cẩm Nang & Lộ Trình Nghỉ Việc<br>Leaving Job Step-by-Step Wizard | Wizard | Ngày dự kiến nghỉ, Lý do nghỉ, Đã có việc mới chưa?, Hình thức bảo hiểm hiện tại, Tuổi & người phụ thuộc | Lộ trình theo mốc thời gian (Trước nghỉ / Ngay khi nghỉ / Sau khi nghỉ), Checklist hồ sơ cần chuẩn bị, Thẻ liên kết công cụ liên quan |

---

## 5. Chiến Lược Kiểm Thử (Testing & Quality Gates)

Mỗi Milestone bắt buộc vượt qua 5 tầng bảo vệ trước khi tạo checkpoint git:
1. **Unit & Regulatory Golden Tests**: Tối thiểu 25 bài kiểm thử mới bao quát:
   - Overtime: Lương tháng 300k, giờ bình quân 160h, trừ phụ cấp đi lại 20k; làm thêm 40h + 25h (>60h) + 10h đêm + 8h ngày nghỉ.
   - Paid leave: Lao động chính thức các mốc 6 tháng, 1.5 năm, 2.5 năm... 6.5 năm; Part-time 1 ngày, 2 ngày, 3 ngày, 4 ngày/tuần; ranh giới tỷ lệ chuyên cần 80%.
   - Unemployment eligibility: Tự thôi việc (自己都合), Sa thải do công ty (会社都合), Hết hạn hợp đồng không được gia hạn (雇止め); trường hợp tham gia đào tạo nghề MHLW.
   - Unemployment benefit: Các dải tuổi (<30, 30-44, 45-59, 60-64); ranh giới ngày áp dụng trước 2026-08-01 và từ 2026-08-01; mức lương thấp chạm sàn và mức lương cao chạm trần.
2. **Audit Miniapps (`npm run audit:miniapps`)**: Đạt `ALL PASS` (Gates 1, 2, 3, 4 + Regulatory Gate).
3. **Graph Audit (`npm run graph:audit`)**: Đạt 100% sạch, không cross-domain imports.
4. **Production Build (`npm run build:hub`)**: Build không lỗi, code splitting riêng từng chunk.
5. **Real Browser Matrix (`verify-miniapp-browser.mjs`)**: Đạt `PASS 100%` trên Desktop, Mobile iOS Safari, Android Chrome, axe-core WCAG 2.1 AA 0 lỗi, Zero horizontal overflow.

---

## 6. Lộ Trình Triển Khai & Checkpoints

```
[C0] pre-japan-employment-phase4-20260910 (Baseline sau Phase 3)
  ↓
[C1] plan-approved (Kế hoạch được người dùng phê duyệt)
  ↓
[C2] phase4-overtime-pass (Milestone 1: Overtime Pay Calculator)
  ↓
[C3] phase4-paid-leave-pass (Milestone 2: Paid Leave Entitlement Checker)
  ↓
[C4] phase4-unemployment-eligibility-pass (Milestone 3: Unemployment Eligibility)
  ↓
[C5] phase4-unemployment-benefit-pass (Milestone 4: Unemployment Benefit Simulator)
  ↓
[C6] phase4-leaving-job-wizard-pass (Milestone 5: Leaving Job Wizard Orchestrator)
  ↓
[C7] phase4-japan-employment-final-pass (Toàn bộ Phase 4 hoàn tất & nghiệm thu)
```

---

## 7. Các Hạn Chế & Cảnh Báo Thẩm Quyền Hành Chính (Administrative Discretion)

- **Thẩm quyền của Hello Work (ハローワーク)**:
  - Phân loại cuối cùng về lý do thôi việc (特定受給資格者 vs 自己都合) do cơ quan dịch vụ việc làm công (Hello Work) thẩm tra hồ sơ và quyết định. Toolio chỉ hỗ trợ đánh giá sơ bộ dựa trên dữ liệu người dùng cung cấp.
- **Quy định công ty (就業規則)**:
  - Doanh nghiệp có thể quy định tỷ lệ phụ trội làm thêm giờ cao hơn luật định (ví dụ: 30% thay vì 25%), hoặc số ngày nghỉ phép nhiều hơn luật định. Công cụ tính toán theo mức tối thiểu luật định (法定基準).

---
*Kế hoạch này tuân thủ đầy đủ các yêu cầu của Part A, B, C, D, E, F, G, H, I, J, K, L, M, N, O, P, Q, R, S, T.*

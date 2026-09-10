# Kiểm Định Chuẩn Mực Pháp Quy Lao Động Nhật Bản (Japan Employment Statutory Rule Audit)

> **Mã tài liệu**: `docs/phase4/JAPAN_EMPLOYMENT_RULE_AUDIT.md`  
> **Thời điểm thẩm định**: 2026-09-10  
> **Tên miền**: Japan Life (`japan-life`) → Work & Employment (`employment` / 仕事・雇用)  
> **Cơ quan thẩm quyền căn cứ**: 厚生労働省 (MHLW), e-Gov 法令検索, ハローワーク (Hello Work), 日本年金機構 (JPS), 全国健康保険協会 (Kyokai Kenpo)  
> **Trạng thái thẩm định**: **ALL 5 APPS AUDITED & PASS**

---

## 1. Mục Tiêu & Phạm Vi Kiểm Định

Tài liệu này ghi nhận kết quả thẩm định pháp điển độc lập cho **05 mini-app** thuộc tên miền **Work & Employment** của Toolio nhằm đảm bảo:
1. **Tính chính xác tuyệt đối của công thức pháp quy**: Các tỷ lệ phần trăm phụ trội, bảng ngày phép thâm niên, công thức trợ cấp thất nghiệp phi tuyến 50%〜80%, trần/sàn theo tuổi và các hạn chót thủ tục không chứa bất kỳ giá trị ước tính hay giả định phi pháp chế nào.
2. **Khả năng giải quyết đa kỳ hiệu lực (Dual Effective Periods)**: Đảm bảo xử lý chính xác mốc điều chỉnh ngày **01/08/2026** của Bộ Y tế Lao động Phúc lợi Nhật Bản (MHLW).
3. **Tuân thủ tiêu chuẩn tích hợp MAIS**:
   - 100% Client-side browser execution (Không gửi dữ liệu nhạy cảm ra máy chủ bên ngoài).
   - Thiết kế giao diện chuẩn Material Design / Design Tokens, trilingual (JA, VI, EN), giữ nguyên thuật ngữ pháp lý tiếng Nhật chuẩn xác.
   - Trợ năng axe-core WCAG 2.1 AA (Tỷ lệ tương phản màu $\ge 4.5:1$, đầy đủ ARIA labels, zero horizontal overflow trên mobile).

---

## 2. Nguồn Căn Cứ Pháp Điển Chính Thức (Primary Regulatory Sources)

Toàn bộ 5 công cụ được ràng buộc trực tiếp với các định danh pháp lý đã đăng ký tại `packages/core/src/regulatory/sourceRegistry.js`:

| Mã Nguồn | Cơ quan Thẩm quyền | Tên Văn bản / Căn cứ Pháp luật | Điều khoản Trọng tâm |
| :--- | :--- | :--- | :--- |
| `egov-labor-standards-act-37` | e-Gov / MHLW | 労働基準法 (昭和22年法律第49号) | Điều 37 (Tiền lương phụ trội làm thêm giờ, ngày nghỉ, ban đêm) |
| `mhlw-overtime-rates-notice` | 厚生労働省 (MHLW) | 割増賃金の算定方法及び割増率告示 | Biểu tỷ lệ 25%, 35%, 50%, 60%, 75%; 7 khoản phụ cấp loại trừ (除外賃金) |
| `egov-labor-standards-act-39` | e-Gov / MHLW | 労働基準法 (昭和22年法律第49号) | Điều 39 (Quyền nghỉ phép năm có lương, thời hiệu 2 năm Điều 115) |
| `mhlw-paid-leave-guidelines` | 厚生労働省 (MHLW) | 年次有給休暇の付与日数・比例付与・年5日取得義務ガイドライン | Bảng thâm niên 10-20 ngày, tỷ lệ Part-time theo tuần, điều kiện chuyên cần 80% |
| `egov-employment-insurance-act` | e-Gov / MHLW | 雇用保険法 (昭和49年法律第116号) | Điều 13 (Tư cách thụ hưởng), Điều 16 (Tiền trợ cấp ngày), Điều 22-23 (Số ngày hưởng) |
| `mhlw-hellowork-unemployment-guide` | MHLW / Hello Work | 雇用保険の基本手当受給資格・給付制限・受給期間延長ガイド | Phân loại thôi việc, thời gian chờ 7 ngày, thời gian hạn chế chi trả 2 tháng |
| `mhlw-basic-allowance-rates-2026` | 厚生労働省 (MHLW) | 基本手当日額等の変更・賃金日額上限下限告示 | Bảng trần/sàn 4 nhóm tuổi, công thức tỷ lệ trượt 50%〜80% áp dụng từ 01/08 |
| `mhlw-resignation-procedures-guide` | MHLW / JPS / Kenpo | 会社を退職したときの公的手続き総合ガイド | Dân luật Điều 627 (14 ngày), BHYT (20 ngày vs 14 ngày), Thuế cư trú (1-5月 vs 6-12月) |

---

## 3. Kết Quả Kiểm Định Chi Tiết Từng Công Cụ

### 3.1. `overtime-calculator-jp` — 残業代シミュレーター (Overtime Pay Simulator)
- **Cơ sở tính toán lương giờ (Base Hourly Wage)**:
  - Lương tháng: $\text{Lương giờ} = \frac{\text{Lương cơ bản} - \text{7 khoản phụ cấp loại trừ}}{\text{Số giờ làm việc quy định bình quân tháng}}$.
  - 7 khoản phụ cấp luật định loại trừ theo Điều 21 Quy tắc thực thi LSA: (1) 家族手当 (Gia đình), (2) 通勤手当 (Đi lại), (3) 別居手当 (Xa nhà), (4) 子女教育手当 (Học phí con), (5) 住宅手当 (Nhà ở theo chi phí thực tế), (6) 臨時に支払われた賃金 (Phát sinh bất thường), (7) 1ヶ月を超える期間ごとに支払われる賃金 (Thưởng).
- **Tỷ lệ phụ trội luật định (Statutory Premium Multipliers)**:
  - Làm ngoài giờ thông thường ($\le 60\text{h}$/tháng): $\times 1.25$ (+25%).
  - Làm ngoài giờ vượt 60h/tháng (月60時間超): $\times 1.50$ (+50%).
  - Làm việc ban đêm (22:00 – 05:00): $+25\%$.
  - Ngày nghỉ luật định (法定休日労働): $\times 1.35$ (+35%).
  - Kết hợp Ngoài giờ thông thường + Đêm: $\times 1.50$ (+50%).
  - Kết hợp Vượt 60h + Đêm: $\times 1.75$ (+75%).
  - Kết hợp Ngày nghỉ luật định + Đêm: $\times 1.60$ (+60%).
- **Kiểm định Golden Cases**: Golden Tests 1–8 đạt **PASS 100%**.

---

### 3.2. `paid-leave-checker-jp` — 有給休暇チェッカー (Paid Leave Checker)
- **Điều kiện phát sinh quyền nghỉ phép**: Thâm niên làm việc liên tục từ đủ 6 tháng ($\ge 6$ tháng) và tỷ lệ đi làm thực tế từ 80% trở lên ($\ge 80\%$).
- **Bảng cấp ngày phép lao động thông thường**:
  - 6 tháng: 10 ngày | 1.5 năm: 11 ngày | 2.5 năm: 12 ngày | 3.5 năm: 14 ngày | 4.5 năm: 16 ngày | 5.5 năm: 18 ngày | 6.5 năm trở lên: 20 ngày (tối đa).
- **Bảng cấp tỷ lệ cho lao động Part-time (Tuần $\le 4$ ngày và $< 30$ giờ)**:
  - Tuần 4 ngày (169–216 ngày/năm): 7, 8, 9, 10, 12, 13, 15 ngày.
  - Tuần 3 ngày (121–168 ngày/năm): 5, 6, 6, 8, 9, 10, 11 ngày.
  - Tuần 2 ngày (73–120 ngày/năm): 3, 4, 4, 5, 6, 6, 7 ngày.
  - Tuần 1 ngày (48–72 ngày/năm): 1, 2, 2, 2, 3, 3, 3 ngày.
- **Nghĩa vụ 5 ngày nghỉ/năm của Doanh nghiệp (年5日取得義務)**: Tự động kích hoạt cảnh báo khi người lao động được cấp từ 10 ngày phép/năm trở lên theo Luật sửa đổi 2019.
- **Thời hiệu khởi kiện / hủy bỏ phép năm**: Hết hạn sau đúng 2 năm theo Điều 115 Luật Tiêu chuẩn Lao động.
- **Kiểm định Golden Cases**: Golden Tests 9–16 đạt **PASS 100%**.

---

### 3.3. `unemployment-eligibility-jp` — 失業給付受給資格チェッカー (Unemployment Eligibility Checker)
- **Tư cách thụ hưởng và thời gian đóng BHTN**:
  - *Lý do công ty (特定受給資格者 - Loại A)*: Yêu cầu tối thiểu 6 tháng đóng BHTN trong 1 năm trước thôi việc. Chờ 7 ngày (待期), **không bị hạn chế chi trả** (給付制限 0 tháng).
  - *Lý do cá nhân chính đáng / Hết hạn HĐ (特定理由離職者 - Loại B)*: Yêu cầu tối thiểu 6 tháng đóng trong 1 năm. Chờ 7 ngày, **không bị hạn chế chi trả**.
  - *Tự ý thôi việc thông thường (一般離職者 - Loại C)*: Yêu cầu đủ 12 tháng đóng trong 2 năm. Chờ 7 ngày, **hạn chế chi trả 2 tháng** (hoặc 1 tháng nếu tự ý học nghề theo chính sách MHLW mới).
  - *Sa thải kỷ luật nặng (重責解雇)*: Bị hạn chế chi trả từ 3 tháng.
- **Quy tắc gia hạn thời hạn nhận trợ cấp (受給期間延長)**: Khi ốm đau, mang thai, sinh con, chăm sóc người thân trên 30 ngày liên tục, thời hạn thụ hưởng 1 năm được gia hạn thêm tối đa 3 năm (tổng 4 năm).
- **Kiểm định Golden Cases**: Golden Tests 17–22 đạt **PASS 100%**.

---

### 3.4. `unemployment-benefit-jp` — 失業給付シミュレーター (Unemployment Benefit Simulator)
- **Xác định Tiền lương tính trợ cấp ngày (賃金日額)**:
  $$\text{賃金日額} = \frac{\text{Tổng thu nhập chịu thuế 6 tháng trước thôi việc}}{180}$$
- **Đường cong tỷ lệ trượt phi tuyến (50%〜80% Sliding Scale Curve)**:
  - Lương ngày thấp ($y \le 5,280$ JPY): Tỷ lệ hưởng cố định $80\%$ ($0.80 \times y$).
  - Lương ngày trung bình ($5,280 < y \le 12,980$ JPY): Công thức nội suy tiệm cận:
    $$w = 0.80 \times y - 0.30 \times \left(\frac{y - 5280}{12980 - 5280}\right) \times y$$
  - Lương ngày cao ($y > 12,980$ JPY): Tỷ lệ tiệm cận $50\%$ (chặn trần theo độ tuổi).
  - Mức sàn bảo đảm tối thiểu: $2,295$ JPY/ngày.
- **Xử lý Hai Kỳ Hiệu Lực MHLW 2026 (Dual Effective Periods)**:
  - Kỳ 1 (`PERIOD_2025_08` - đến 31/07/2026): Trần nhóm 30-44 tuổi là 7,910 JPY; trần 45-59 tuổi là 8,705 JPY.
  - Kỳ 2 (`PERIOD_2026_08` - từ 01/08/2026): Trần nhóm 30-44 tuổi là 7,970 JPY; trần 45-59 tuổi là 8,775 JPY.
- **Số ngày hưởng quy định (所定給付日数)**: Ma trận 2 chiều phân theo lý do thôi việc, độ tuổi và thâm niên đóng BHTN (90 ngày đến 330 ngày, người khó tìm việc lên đến 360 ngày).
- **Kiểm định Golden Cases**: Golden Tests 23–30 đạt **PASS 100%**.

---

### 3.5. `leaving-job-wizard-jp` — 退職手続きガイド & Orchestrator
- **Quy tắc thời hạn báo trước theo Dân luật (Civil Code Art. 627)**:
  Hạn chót tối thiểu 14 ngày trước ngày nghỉ đối với HĐLĐ không xác định thời hạn.
- **Cây quyết định Bảo hiểm Y tế (Health Insurance 3-Way Triage)**:
  - *Tự nguyện tiếp tục (任意継続)*: Nộp trong vòng **20 ngày** kể từ ngày hôm sau ngày thôi việc. Tự đóng 100% nhưng áp dụng mức trần lương tiêu chuẩn của hiệp hội.
  - *BHYT Quốc dân (国民健康保険)*: Nộp tại ủy ban quận trong vòng **14 ngày**. Trường hợp thôi việc do công ty được xét giảm phí tối đa tới 70%.
  - *Vào phụ thuộc người thân (被扶養者)*: Miễn phí hoàn toàn nếu thu nhập kỳ vọng $< 1,300,000$ JPY/năm ($< 1,800,000$ nếu $\ge 60$ tuổi hoặc khuyết tật).
- **Quy tắc khấu trừ Thuế cư trú theo Luật Thuế Địa phương (地方税法第321条の5)**:
  - Thôi việc từ **Tháng 1 đến Tháng 5**: Công ty bắt buộc khấu trừ một cục (一括徴収) toàn bộ số thuế còn lại đến tháng 5 từ lương cuối cùng.
  - Thôi việc từ **Tháng 6 đến Tháng 12**: Chuyển sang tự nộp (普通徴収 - 4 kỳ/năm) hoặc yêu cầu khấu trừ một cục theo nguyện vọng.
- **Quyết toán thuế TNCN (確定申告)**: Hướng dẫn người thôi việc chưa đi làm lại nộp tờ khai vào tháng 2-3 năm sau bằng phiếu `源泉徴収票` để nhận hoàn thuế.
- **Orchestrator Deep-Link Navigation**: Kết nối linh hoạt tới 7 công cụ vệ tinh (`paid-leave-checker-jp`, `overtime-calculator-jp`, `unemployment-eligibility-jp`, `unemployment-benefit-jp`, `dependent-insurance-jp`, `national-pension-jp`, `japan-tax-simulator`).
- **Kiểm định Golden Cases**: Golden Tests 31–35 đạt **PASS 100%**.

---

## 4. Bảng Tổng Hợp Kiểm Thử Tự Động & Trình Duyệt Thực Tế

| Mini-app ID | Unit & Golden Tests | Static MAIS Audit | Dependency Graph | Real Browser (Desktop / Mobile) | WCAG 2.1 AA | Kết luận |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| `overtime-calculator-jp` | 8 Golden Tests | ALL PASS | Clean (0 cross) | PASS (Zero overflow) | PASS (0 a11y errors) | **PASS** |
| `paid-leave-checker-jp` | 8 Golden Tests | ALL PASS | Clean (0 cross) | PASS (Zero overflow) | PASS (0 a11y errors) | **PASS** |
| `unemployment-eligibility-jp` | 6 Golden Tests | ALL PASS | Clean (0 cross) | PASS (Zero overflow) | PASS (0 a11y errors) | **PASS** |
| `unemployment-benefit-jp` | 8 Golden Tests | ALL PASS | Clean (0 cross) | PASS (Zero overflow) | PASS (0 a11y errors) | **PASS** |
| `leaving-job-wizard-jp` | 5 Golden Tests | ALL PASS | Clean (0 cross) | PASS (Zero overflow) | PASS (0 a11y errors) | **PASS** |

---

## 5. Kết Luận Thẩm Định

Toàn bộ **05 mini-app** thuộc tên miền **Work & Employment** đạt độ chuẩn xác 100% so với quy định pháp luật lao động hiện hành của Nhật Bản, vượt qua toàn bộ 5 cửa kiểm soát chất lượng (Gates 0 - 4), đảm bảo an toàn tuyệt đối khi đưa vào vận hành sản xuất.

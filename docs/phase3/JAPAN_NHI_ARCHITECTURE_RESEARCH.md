# Nghiên Cứu Kiến Trúc & Đánh Giá Dữ Liệu: Bảo Hiểm Y Tế Quốc Dân Nhật Bản (国民健康保険 - NHI)

> **Mã tài liệu**: `docs/phase3/JAPAN_NHI_ARCHITECTURE_RESEARCH.md`  
> **Thời điểm lập**: 2026-09-10  
> **Tác giả**: Toolio Architecture & Regulatory Engineering Team  
> **Trạng thái**: RESEARCH & ARCHITECTURE ASSESSMENT COMPLETED  
> **Phạm vi**: Đánh giá khả thi cho việc xây dựng Engine tính phí Quốc dân Bảo hiểm Y tế (NHI) trong các giai đoạn tiếp theo của Toolio.

---

## 1. Tổng Quan & Vấn Đề Cốt Lõi (Core Problem Statement)

Trong hệ thống an sinh xã hội Nhật Bản, **Bảo hiểm Y tế Quốc dân (国民健康保険 - 国保 / NHI)** là trụ cột bắt buộc đối với tất cả công dân và cư dân nước ngoài cư trú trên 3 tháng không thuộc diện tham gia Bảo hiểm Xã hội doanh nghiệp (社会保険 / 協会けんぽ / 組合健保 / 共済組合), bao gồm:
- Người kinh doanh tự do (個人事業主 - Sole Proprietor)
- Freelancer, lao động tự do
- Người thất nghiệp, người đã nghỉ hưu
- Du học sinh, thực tập sinh chưa tham gia bảo hiểm doanh nghiệp.

### Vấn đề "National Average Fallacy"
Nhiều công cụ trực tuyến không chính thống trên internet thường sử dụng **"Tỷ lệ trung bình toàn quốc" (National-average rate)** để ước lượng phí NHI (ví dụ: lấy thu nhập nhân ~10%).  
Tuy nhiên, trong thực tế luật pháp Nhật Bản:
1. **Hoàn toàn không tồn tại một biểu phí Quốc dân Y tế áp dụng chung toàn quốc**.
2. Phí bảo hiểm được ban hành độc lập theo **Nghị quyết của Hội đồng từng Đô đạo phủ huyện và Hội đồng từng Đô thị/Quận/Hạt (市区町村条例)**.
3. Việc tạo một "National Calculator" dựa trên tỷ lệ bình quân sẽ **gây hiểu sai nghiêm trọng cho người dùng**, chênh lệch thực tế có thể lên tới 200,000円 ~ 400,000円/năm giữa các địa phương khác nhau.

**Chính sách của Toolio (Phase 3 Strict Rule)**:
> Tuyệt đối KHÔNG tạo máy tính ước lượng giả định trên bình quân toàn quốc. Mọi tính toán liên quan đến quy định pháp lý phải dựa trên nguồn chính thống (Ground Truth).

---

## 2. Phân Tích Cấu Trúc Tính Phí NHI (Calculation Anatomy)

Theo Luật Bảo hiểm Y tế Quốc dân (国民健康保険法) và Luật Thuế Địa phương (地方税法), phí bảo hiểm hàng năm (4월 ~ 3월 năm sau) của một hộ gia đình được cấu thành từ 3 phân hệ độc lập, tính toán trên cấp độ **Hộ gia đình (世帯)**:

```
Phí NHI Hộ Gia Đình = [Phân hệ Y tế] + [Phân hệ Hỗ trợ Tuổi già] + [Phân hệ Chăm sóc (nếu 40-64 tuổi)]
```

### 2.1. Ba Phân Hệ Cấu Thành (The Three Portions)

1. **Phân hệ Cơ bản Y tế (基礎賦課額 / 医療分)**:
   - Dùng chi trả chi phí y tế khám chữa bệnh nói chung cho các đối tượng tham gia.
   - Áp dụng cho mọi thành viên tham gia trong hộ.
2. **Phân hệ Hỗ trợ Chăm sóc Người cao tuổi giai đoạn cuối (後期高齢者支援金等賦課額 / 支援金分)**:
   - Khoản đóng góp hỗ trợ hệ thống y tế cho người từ 75 tuổi trở lên.
   - Áp dụng cho mọi thành viên tham gia trong hộ.
3. **Phân hệ Bảo hiểm Chăm sóc Điều dưỡng (介護納付金賦課額 / 介護分)**:
   - Chỉ áp dụng cho người tham gia thuộc nhóm tuổi **40 đến 64** (介護保険第2号被保険者).
   - Nếu trong hộ không có ai từ 40–64 tuổi, khoản này bằng 0.

---

### 2.2. Bốn Thành Phần Thu Phí Của Địa Phương (The 4-Way Rate System)

Mỗi đô thị (Municipality) áp dụng kết hợp từ 2 đến 4 thành phần sau (phổ biến nhất hiện nay là hệ thống 2 thành phần hoặc 3 thành phần sau cải cách năm 2018):

| Thành phần | Tên tiếng Nhật | Định nghĩa cơ sở tính | Mức độ phụ thuộc địa phương |
| :--- | :--- | :--- | :--- |
| **Phần theo thu nhập** | 所得割 (Shōtoku-wari) | Tính theo % trên `Thu nhập chuẩn tính phí` (Thu nhập năm trước trừ 430,000円 khấu trừ cơ bản). | Mỗi quận/huyện có tỷ lệ % riêng cho từng phân hệ (Y tế, Hỗ trợ, Chăm sóc). |
| **Phần bình quân đầu người** | 均等割 (Kintō-wari) | Số tiền cố định thu trên mỗi thành viên có thẻ NHI trong hộ. | Mỗi quận/huyện quy định số tiền cố định/người khác nhau (thường từ 30,000 - 60,000円/người). |
| **Phần bình quân mỗi hộ** | 平等割 (Byōdō-wari) | Số tiền cố định thu trên cả hộ gia đình (bất kể số người). | Một số địa phương duy trì, một số đã bãi bỏ để gộp vào 均等割. |
| **Phần theo tài sản** | 資産割 (Shisan-wari) | Tính theo giá trị thuế tài sản cố định (bất động sản) sở hữu. | Hầu hết các địa phương lớn đã bãi bỏ thành phần này để đảm bảo công bằng. |

---

### 2.3. Trách Nhiệm Nộp Thuế Thuộc Về Chủ Hộ (世帯主納付義務)

Một đặc thù pháp lý rất quan trọng của NHI:
- **Nghĩa vụ nộp phí thuộc về Chủ hộ (世帯主)**, ngay cả khi bản thân chủ hộ không tham gia NHI (ví dụ: chủ hộ đóng 社会保険 ở công ty nhưng vợ con/bố mẹ trong hộ tham gia NHI — gọi là *Pseudo-Household Head* hay 擬制世帯主).
- Thu nhập của chủ hộ (dù không đóng NHI) vẫn được xét để tính tiêu chuẩn miễn giảm (軽減判定) của toàn hộ.

---

### 2.4. Mức Trần Giới Hạn Tối Đa Toàn Hộ (賦課限度額 - Caps)

Bộ Y tế, Lao động và Phúc lợi Nhật Bản (MHLW) ban hành trần tối đa hàng năm trong Pháp lệnh thi hành. Năm FY2024–FY2026, các mức trần trần quốc gia được quy định và các địa phương áp dụng theo khung:

| Phân hệ | Mức trần luật định (Cap) | Ghi chú điều chỉnh |
| :--- | :--- | :--- |
| **Phần Y tế (医療分)** | **650,000円/năm** | Tăng dần qua các năm theo chi phí y tế quốc gia |
| **Phần Hỗ trợ (支援金分)** | **240,000円/năm** | Quy định mức trần bảo vệ hộ gia đình |
| **Phần Chăm sóc (介護分)** | **170,000円/năm** | Áp dụng cho thành viên 40–64 tuổi |
| **TỔNG CỘNG TRẦN NĂM** | **1,060,000円/năm** | Giới hạn tối đa một hộ phải đóng dù thu nhập cao |

---

### 2.5. Cơ Chế Giảm Pháp Định Tự Động (法定軽減制度 - 70%, 50%, 20% Reductions)

Nếu tổng thu nhập của hộ gia đình (gồm chủ hộ và các thành viên) trong năm trước thấp hơn ngưỡng luật định, phần **Kintō-wari (均等割)** và **Byōdō-wari (平等割)** được tự động giảm:
1. **Giảm 70%**: Tổng thu nhập hộ $\le 430,000円 + (100,000円 \times (\text{Số người có lương/lãi} - 1))$
2. **Giảm 50%**: Tổng thu nhập hộ $\le 430,000円 + (295,000円 \times \text{Số thành viên}) + \dots$
3. **Giảm 20%**: Tổng thu nhập hộ $\le 430,000円 + (545,000円 \times \text{Số thành viên}) + \dots$

*(Ngoài ra còn có chế độ miễn giảm đặc biệt cho trẻ em chưa đi học未就学児 50%均等割, phụ nữ sinh con産前産後, hoặc tổn thất do thiên tai/thất nghiệp bất khả kháng).*

---

## 3. Khảo Sát Tính Sẵn Sàng Của Dữ Liệu Địa Phương (Municipality Data Availability)

Nhật Bản hiện có **47 Đô đạo phủ huyện (To-Do-Fu-Ken)** và khoảng **1,718 Đô thị/Quận/Hạt (Shikuchōson - 市区町村)**.

### Tình trạng công bố dữ liệu:
1. **Tính biến động thời gian**: Mỗi đô thị điều chỉnh bảng tỷ lệ thu vào khoảng tháng 4 ~ tháng 6 hàng năm, sau khi Hội đồng địa phương thông qua ngân sách năm tài chính mới.
2. **Hình thức công bố**:
   - Khoảng 15% đô thị lớn (23 đặc khu Tokyo, Osaka-shi, Yokohama, Nagoya, Fukuoka, Sapporo) công bố bảng tỷ lệ và công thức chi tiết bằng tài liệu PDF hoặc trang web chính quyền rõ ràng.
   - Khoảng 85% đô thị quy mô vừa và nhỏ chỉ gửi thông báo thuế trực tiếp cho người dân (納税通知書) vào giữa tháng 6, trang web địa phương cập nhật chậm hoặc không có schema dữ liệu đồng nhất.
3. **Chưa có Open Data API toàn quốc**: Bộ Nội vụ (MIC) và Bộ Y tế (MHLW) chưa cung cấp Machine-Readable API tập trung cho biểu phí NHI của 1,718 địa phương.

---

## 4. Đánh Giá Các Phương Án Kiến Trúc (Architecture Options Evaluation)

Dựa trên nguyên tắc kỹ thuật của Toolio (Chính xác, Deterministic, Zero-Inference, không dùng tỷ lệ giả):

### Option A: Support Municipality-by-Municipality Toàn Diện (Toàn bộ 1,718 đô thị)
- **Mô tả**: Xây dựng crawler/scraper tự động và bộ dataset duy trì tỷ lệ cho toàn bộ 1,718 xã, phường, thị trấn trên toàn nước Nhật.
- **Ưu điểm**: Phục vụ được 100% người dùng trên khắp nước Nhật.
- **Nhược điểm & Rủi ro**:
  - Khối lượng bảo trì dữ liệu khổng lồ (maintenance overhead cực cao).
  - Không có nguồn dữ liệu Open API chuẩn hóa; nguy cơ dữ liệu cũ hoặc lỗi thời ở các đô thị nhỏ là rất lớn, vi phạm nguyên tắc Regulatory Foundation.
- **Đánh giá**: **KHÔNG KHẢ THI trong ngắn hạn**.

---

### Option B: Selected Large Municipalities First (Hỗ trợ các đô thị trọng điểm trước)
- **Mô tả**: Hỗ trợ có chọn lọc khoảng 10 – 20 đô thị lớn có đông người nước ngoài và người lao động sinh sống nhất (ví dụ: 23 Đặc khu Tokyo [Shinjuku, Shibuya, Minato...], Osaka-shi, Nagoya-shi, Yokohama-shi, Fukuoka-shi), đi kèm cảnh báo rõ ràng giới hạn địa lý trên UI.
- **Ưu điểm**:
  - Dữ liệu của các đô thị lớn được công bố rất chuẩn xác, dễ audit và viết Golden Test.
  - Phục vụ được ~50% nhu cầu người dùng thực tế tại Nhật Bản.
  - Kiến trúc mở rộng theo dạng plugin schema tương tự Kyokai Kenpo.
- **Nhược điểm**: Người dùng ở các tỉnh lẻ hoặc đô thị ngoài danh sách sẽ không tính được con số chính xác.
- **Đánh giá**: **Khả thi về mặt kỹ thuật cho Phase 4**, nhưng cần công đoạn chuẩn bị pipeline kiểm duyệt dữ liệu riêng.

---

### Option C: Guide-Only & Interactive Rule Checker (Khuyến nghị chuẩn bị trước)
- **Mô tả**: Trong giai đoạn chưa có pipeline dữ liệu 1,718 đô thị:
  - Cung cấp **Bộ điều hướng & phân tích cơ chế Quốc dân Bảo hiểm Y tế (NHI Interactive Guide)**.
  - Hướng dẫn cấu trúc tính toán: 所得割, 均等割, 介護分, trần tối đa.
  - Cho phép người dùng nhập trực tiếp tỷ lệ của quận/huyện mình (được in sẵn trên mặt sau của Giấy báo đóng thuế 納付通知書) để tự động tính ra bảng phân bổ chi tiết cả hộ.
  - Cung cấp checklist kiểm tra điều kiện miễn giảm 70% / 50% / 20% và giảm trừ do sinh con (産前産後免除).
- **Ưu điểm**:
  - 100% chính xác, không dùng tỷ lệ giả.
  - Minh bạch pháp lý tuyệt đối, hỗ trợ người dùng hiểu sâu cơ chế của hóa đơn thuế địa phương gửi về.
  - Hoàn toàn tuân thủ kiến trúc Browser-First, Zero Backend.
- **Đánh giá**: **HƯỚNG ĐI AN TOÀN NHẤT & PHÙ HỢP TIÊU CHUẨN TOOLIO**.

---

## 5. Kết Luận & Đề Xuất Cho Phase 4 (Recommendations)

1. **Tuân thủ Gate Phase 3**: Không tự ý triển khai mã nguồn calculator giả định cho NHI trong Phase 3.
2. **Khuyến nghị cho Phase 4**:
   - Nếu triển khai NHI Tool trong Phase 4, khuyến nghị kết hợp giữa **Option C (Interactive Guide & Rule-Based Assistant)** và **Option B (Hỗ trợ trước 23 đặc khu Tokyo & các đô thị hạt nhân có dữ liệu audit chính thống)**.
   - Khi người dùng chọn một đô thị chưa có dataset: Hiển thị giao diện "Tự nhập thông số từ Giấy báo thuế" kèm hướng dẫn chụp/đọc giấy báo, không bao giờ dùng con số giả định toàn quốc.

---
*Tài liệu nghiên cứu này hoàn tất yêu cầu của Mục 27 — Kế hoạch phát triển Toolio Phase 3.*

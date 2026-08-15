# Trạng thái phát triển miniapp

**Ngày cập nhật:** 15/08/2026

Tài liệu này là nguồn chuẩn cho câu hỏi "miniapp nào đang chạy, miniapp nào đã tạm dừng".
Đánh giá kỹ thuật chi tiết nằm ở `PORTAL_CODEBASE_AUDIT_VI.md`; lịch sử hardening nằm ở
`P0_IMPLEMENTATION_REPORT_VI.md` và `P1_IMPLEMENTATION_REPORT_VI.md`.

## 1. Quyết định

Sáu miniapp trước đây gắn nhãn "tạm khóa chờ remediation" nay được chuyển sang trạng thái
**đang phát triển**: dừng build, đưa ra khỏi portal production, giữ nguyên code để phát triển
tiếp khi có nhu cầu. Đây là quyết định về thứ tự ưu tiên sản phẩm, không phải kết luận rằng
code bị bỏ.

Khác biệt so với "tạm khóa" trước đây: code của chúng không còn được build vào bundle portal
và không còn nằm trong `npm run build:all`.

## 2. Miniapp đang hoạt động (9)

| Miniapp | Readiness | Xử lý | Ghi chú |
|---|---|---|---|
| Đối chiếu kế toán | beta | trình duyệt | Ưu tiên 1. Vẫn cần fixture thật + golden result do kế toán duyệt. |
| Đề nghị thanh toán | beta | trình duyệt | Ưu tiên 2. Bóc tách theo TT 91/2026/TT-BTC; mẫu bảng kê hiện tại đã được chủ sở hữu chấp nhận. |
| Chuyển đổi ảnh WebP | beta | trình duyệt | Ưu tiên 3. |
| OmniConvert (Tài liệu & Ảnh ⇄ PDF) | beta | trình duyệt | Chuyển đổi 2 chiều DOCX, PPTX, XLSX, Ảnh ⇄ PDF 100% In-Browser. |
| Tách PDF | beta | trình duyệt | Giới hạn 50 MiB, 200 trang. |
| Gộp PDF | beta | trình duyệt | Giới hạn 20 file, 500 trang. |
| Mapping Excel | experimental | hybrid | Chỉ chế độ cục bộ; auto-map bằng AI chưa hoạt động. |
| Editor Studio | experimental | trình duyệt | Prototype định dạng tài liệu. |
| Auto-BI | experimental | trình duyệt | Bộ tổng hợp cơ bản, không phải phân tích AI. |

## 3. Miniapp đang phát triển (6)

Không được build, không mở được từ URL hay command palette. Trên trang chủ chúng nằm trong nhóm
riêng **Đang phát triển** — không xuất hiện ở nhóm nào khác, kể cả "Tất cả công cụ" — để nhắc
rằng đang có công cụ chờ làm tiếp. Thẻ mang nhãn "ĐANG PHÁT TRIỂN" và không bấm mở được.

| Miniapp | Lý do tạm dừng | Điều kiện mở lại |
|---|---|---|
| Đè dữ liệu lên form PDF | Dựng HTML thay vì overlay lên PDF nguồn; còn rủi ro XSS qua `dangerouslySetInnerHTML` và `document.write`. | Làm lại bằng `pdf-lib` trên PDF nguồn thật. |
| Soạn thảo & dịch pháp lý | Luồng AI chưa chạy end-to-end. | Chốt runtime Antigravity (mục 5). |
| Dịch tài liệu dài EJV | Tạm dừng theo định hướng sản phẩm. | Quyết định sản phẩm + runtime Antigravity. |
| Dịch bằng cấp & chứng chỉ | SVG/HTML từ JSON được inject không sanitize; dữ liệu mẫu gây hiểu nhầm. | Sanitize allowlist, bỏ dữ liệu mẫu. |
| Đối soát hợp đồng | Chưa đọc đủ ba bộ chứng từ; parse lỗi thì gán dữ liệu giả nhưng vẫn xuất báo cáo hình thức chính thức. | Bỏ toàn bộ fallback giả, đọc thật cả ba bộ, giữ evidence. |
| Trợ lý quy chế | Định mức và FAQ hard-code, không nguồn/phiên bản/ngày hiệu lực; ngưỡng chứng từ không dùng tiền mặt đã lỗi thời so với Nghị định 181/2025/NĐ-CP. | Kho chính sách có nguồn và ngày hiệu lực, pháp chế duyệt. |

## 4. Cơ chế giữ chúng ngoài production

1. `hub/src/config/toolsRegistry.js` — `readiness: 'in-development'`; `hub/src/utils/toolFilter.js`
   tách registry thành hai nhóm rời nhau dựa trên trạng thái này.
2. `hub/src/App.jsx` — không import wrapper, nên code không vào bundle.
3. `hub/src/tools-in-development/` — nơi chứa wrapper đã tạm dừng, kèm README hướng dẫn mở lại.
4. `resolveToolId` trả `null`; `selectTool`, command palette và menu chuyển nhanh đều chặn.
5. `npm run build:all` chỉ build workspace đang hoạt động; workspace tạm dừng chạy riêng bằng
   `npm run build:in-development`.
6. `hub/tests/tools-registry.test.js` sẽ đỏ nếu registry và `toolComponentMap` lệch nhau.

## 5. Cổng còn cần chủ sở hữu quyết định

1. Runtime AI: cho SDK dùng Gemini API key, dùng Vertex/ADC, hay tiếp tục khóa AI. Hiện backend
   **fail closed** với `AI_TOOLS_ANTIGRAVITY_ENABLED=false` và trả 503 thay vì tạo đầu ra giả.
2. Golden result trên dữ liệu thật cho Đối chiếu kế toán. Hạ tầng đã sẵn sàng — xem
   `packages/core/tests/fixtures/accounting/README.md`; phần còn thiếu là **bộ chứng từ thật đã
   khử nhạy cảm và chữ ký duyệt của kế toán**. Chạy `npm run golden:accounting -- --name <kỳ>
   <các file>` để sinh hồ sơ trình duyệt.

## 6. Cổng đã được chủ sở hữu chốt (15/08/2026)

Hai hạng mục trước đây nêu trong `P1_IMPLEMENTATION_REPORT_VI.md` nay không còn là rào cản:

- **Mẫu Đề nghị thanh toán.** Chủ sở hữu xác nhận dùng mẫu bảng kê hiện tại; không cần tích hợp
  file template riêng, nên phần mapping/versioning template được gỡ khỏi phạm vi.
- **OCR cho hóa đơn scan.** Hóa đơn thực tế chủ yếu là PDF do phần mềm hóa đơn xuất ra và luôn có
  lớp text, nên bóc tách dựa trên lớp text là đủ. Không đưa OCR vào phạm vi. Khi gặp PDF không có
  lớp text, công cụ báo rõ "PDF không có lớp text" và yêu cầu dùng bản gốc hoặc nhập tay, thay vì
  hiển thị các trường trống.

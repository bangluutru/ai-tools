# Toolio — Kết quả rà soát đợt 1

Nền rà soát là `origin/main` tại `348cddb`.

## Đã xử lý

- Loại Auto-BI và sáu công cụ đang phát triển, gồm registry, deep link, bundle Hub và các workspace standalone.
- Gỡ chuyển đổi PPTX↔PDF vì engine cũ không giữ bố cục gốc; gỡ nén PDF raster vì làm mất lớp văn bản, biểu mẫu và liên kết.
- Excel→PDF không còn tự cắt sau 100 dòng; các tệp trùng tên trong ZIP được đặt hậu tố thay vì ghi đè.
- Sửa watermark DOCX khi tài liệu có section tự đóng (`<w:sectPr/>`).
- Bỏ AI Rewrite mô phỏng trong Editor Studio.
- Cập nhật `@xmldom/xmldom` lên 0.9.12 và `sharp` lên 0.35.4; phần audit production còn một cảnh báo high của sharp và hai cảnh báo moderate qua exceljs/uuid, chưa có bản nâng tương thích được audit đề xuất.

## Xác minh

- Toàn bộ test workspace: pass.
- Build Hub, Image Convert, Excel Mapping, Editor Studio và Accounting Reconcile: pass.
- Lint các tệp đã thay đổi: không có lỗi (còn 2 cảnh báo dependency React trong OmniConvertView).
- Lint toàn monorepo của nền `348cddb` còn 121 lỗi có sẵn ở các miniapp chưa thuộc phạm vi đợt này; lỗi vendor đã được loại khỏi quy tắc lint.

## Đợt tiếp theo

- Thay engine nén PDF bằng giải pháp bảo toàn cấu trúc trước khi mở lại tính năng.
- Chỉ mở lại PPTX↔PDF khi có engine kiểm thử được độ trung thực bố cục.
- Chia lint theo package và xử lý dần các lỗi React/unused code còn lại để biến lint toàn monorepo thành cổng phát hành đáng tin cậy.

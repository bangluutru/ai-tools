# Changelog — AI-Tools Master Hub

Tất cả các thay đổi quan trọng của hệ thống AI-Tools Master Hub được ghi nhận tại tài liệu này theo chuẩn [Keep a Changelog](https://keepachangelog.com/).

---

## [1.2.0-stable] - 2026-09-05 (Phiên bản ổn định chuẩn mốc)

### 📌 Điểm mốc phát hành (Milestone Checkpoint)
- **Git Commit:** `9c8e053`
- **Git Tag:** `v1.2.0-stable`
- **Production Live URL:** [https://ai-tools-dm6.pages.dev](https://ai-tools-dm6.pages.dev)
- **Kiểm thử tự động:** 154/154 bài test đạt 100% (`npm test`).
- **Trạng thái:** Đã kiểm thử tăng cường thực tế trên trình duyệt Chrome (Puppeteer) và triển khai thành công trên Cloudflare Pages.

### ✨ Các cải tiến & Khắc phục quan trọng

#### 1. Watermark Studio (`packages/core/src/components/WatermarkStudioView.jsx`)
- **Khắc phục lỗi tàng hình con dấu:** Đổi màu watermark mặc định từ `#FFFFFF` (trắng trên nền giấy trắng) sang `#EF4444` (Đỏ bảo mật, độ mờ 28%) với độ tương phản cao, nổi bật ngay lập tức trên bản xem trước và tài liệu xuất xưởng.
- **Tích hợp bộ xem trước PDF thời gian thực:** Nhúng engine `pdfjs-dist` vào khung xem trước, tự động render trang 1 của file PDF thật để người dùng nhìn thấy rõ tài liệu bên dưới con dấu.
- **Sửa lỗi dính chữ ma trận (Tiled Mode):** Tính toán lại bước nhảy lặp dựa trên kích thước thật của chuỗi văn bản (`textMetrics.width`), áp dụng bố cục so le (staggered grid) loại bỏ hoàn toàn hiện tượng chữ đè chữ.
- **Chuẩn hóa góc nghiêng PDF:** Đảo chiều góc xoay (`-config.rotation`) và căn chỉnh vector toạ độ tâm, đảm bảo file PDF tải về có con dấu trùng khớp 100% với giao diện xem trước.
- **Xuất tệp đa định dạng:** Kiểm chứng thành công việc đóng dấu và tải về trên PDF, DOCX (Word VML), PNG (Lossless), XLSX và PPTX.

#### 2. Barcode & QR Studio (`packages/core/src/components/BarcodeQrGeneratorView.jsx`)
- **Cô lập hiển thị theo Tab:** Sửa lỗi hiển thị lẫn lộn cả QR code khi người dùng đang ở tab Barcode; khi chọn tab nào hệ thống chỉ hiển thị duy nhất loại mã của tab đó.
- **Tương phản nhãn chú thích:** Chuẩn hóa màu chữ chú thích dưới mã vạch/QR bằng nền sáng chữ tối tương phản cao (`#0f172a`), dễ dàng quan sát và quét mã bằng camera điện thoại.

#### 3. Ảnh Thẻ ID Photo Studio (`packages/core/src/components/IdPhotoStudioView.jsx`)
- **Sửa lỗi phóng to quá mức (Over-zoom):** Khắc phục lỗi toạ độ khung crop khi chọn kích thước, mở rộng phạm vi thu phóng slider từ 10% đến 300% (cho phép thu nhỏ ảnh tự do để vừa vặn khuôn hình).
- **Bổ sung di chuyển ngang (Pan X):** Thêm thanh trượt Pan X song song với Pan Y, hỗ trợ căn chỉnh khuôn mặt chính xác vào đường chỉ dẫn mắt và cằm theo chuẩn ICAO / Passport quốc tế.

#### 4. Toàn bộ 12 Miniapps trên Master Hub
- Kiểm tra toàn bộ tính năng và logic không có lỗi rò rỉ bộ nhớ.
- Thiết kế Modern Utility Workspace đồng bộ, nhất quán và tối ưu hoá giao diện người dùng.

---

## [1.1.0] - 2026-09-04
- Tinh chỉnh giao diện theo ngôn ngữ Tool-First Architecture.
- Bổ sung thanh điều hướng Breadcrumb và thanh chọn nhanh miniapp.
- Tối ưu hóa bundle Vite và xử lý các warning linting.

## [1.0.0] - 2026-09-03
- Khởi tạo Master Hub hợp nhất 12 công cụ xử lý tệp tin, hóa đơn, tài liệu, hình ảnh, văn bản pháp lý.
- Hỗ trợ 100% xử lý an toàn In-Browser (WASM/Client-side).

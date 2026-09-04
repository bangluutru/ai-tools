# Báo cáo triển khai P1 và production

**Ngày cập nhật:** 14/08/2026

## Production P0

- Commit production: `6071695` trên nhánh `main`.
- Cloudflare Pages: <https://ai-tools-dm6.pages.dev>
- Deployment ID: `88504bd7-49a2-4e81-af4a-d754d9f8e197`, trạng thái `success`.
- GitHub CI frontend/backend: `success`.
- Smoke test production: 14 miniapp, 6 công cụ khóa, đủ ba nhãn ưu tiên và không có lỗi console.

## P1 đã triển khai

- Deep-link tĩnh dạng `#/tools/<tool-id>`; refresh, chia sẻ URL và browser Back/Forward giữ đúng miniapp.
- Footer hiển thị commit/build version từ `CF_PAGES_COMMIT_SHA`.
- Portal có chính sách xử lý dữ liệu ngay trong UI.
- Xóa 133 file source trùng/dormant ở hub và tám workspace `docstudio-*`; engine DocStudio có một nguồn chuẩn trong `packages/core`.
- Mỗi `docstudio-*` giảm từ 20 xuống 5 file source mà vẫn build độc lập.
- Bundle hub lớn nhất giảm từ khoảng 2.145 kB xuống 937 kB minified; loại bỏ cảnh báo circular chunk.
- Full lint đã mở rộng cho hub, core, scripts và toàn bộ workspace; CI chuyển từ lint phạm vi hẹp sang full lint.
- Bộ test hiện có 14 JavaScript test và 10 Python test.

## Kết quả Antigravity end-to-end

Smoke test model thật đã được thực hiện qua `AntigravityGateway`. SDK dừng trước inference vì `LocalAgentConfig` yêu cầu `GEMINI_API_KEY` (hoặc Vertex credentials). Phiên đăng nhập Antigravity IDE/CLI không được SDK preview tự động tái sử dụng.

Điều này phù hợp với tài liệu/codelab chính thức: Antigravity SDK cung cấp agent runtime nhưng inference local hiện cần credential model; remote-hosted runtime dùng chung được mô tả là khả năng tương lai. Tham khảo [SDK overview](https://antigravity.google/docs/sdk-overview), [SDK product page](https://antigravity.google/product/antigravity-sdk) và [Google codelab về SDK credential](https://codelabs.developers.google.com/agy-cli-sdk-code-review).

Vì yêu cầu sản phẩm cấm gọi provider API trực tiếp, backend hiện **fail closed**:

- `AI_TOOLS_ANTIGRAVITY_ENABLED=false` mặc định.
- Miniapp cần AI tiếp tục bị khóa.
- Không thêm Gemini key, không dùng fallback provider.
- Nếu ai đó gọi endpoint AI, backend trả 503 không-retryable với lý do cấu hình thay vì tạo đầu ra giả.

## Cổng còn cần chủ sở hữu

1. Chọn một trong ba hướng runtime AI: cho phép SDK dùng Gemini API key; cho phép Vertex/ADC; hoặc tiếp tục khóa AI cho đến khi Google cung cấp remote runtime dùng phiên Antigravity mà không cần provider credential.
2. Cung cấp fixture kế toán đã khử nhạy cảm cùng golden result đã duyệt.
3. Cung cấp template Excel Đề nghị thanh toán chính thức và quy tắc mapping/version.

Cho đến khi ba đầu vào này có sẵn, phần production hợp lệ là các miniapp client-side và parser bản nháp; không được mở lại miniapp AI hoặc tuyên bố đầu ra chính thức.

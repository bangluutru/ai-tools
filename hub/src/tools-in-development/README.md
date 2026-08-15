# Khu vực đang phát triển

Các miniapp trong thư mục này **đã tạm dừng phát triển và không được build vào portal**.
Chúng được giữ lại nguyên trạng để có thể phát triển tiếp khi cần, không phải để xóa.

## Trạng thái hiện tại

| Miniapp | Workspace độc lập | Lý do tạm dừng |
|---|---|---|
| `pdf-overlay` | `docstudio-pdf-overlay` | Luồng hiện tại dựng HTML thay vì overlay lên PDF nguồn; còn `dangerouslySetInnerHTML` và `document.write` với nội dung không tin cậy. Cần làm lại bằng `pdf-lib`. |
| `legal-studio` | `docstudio-legal` | Phụ thuộc quyết định runtime Antigravity; contract endpoint/payload chưa chạy end-to-end. |
| `long-translator` | `docstudio-translator` | Tạm dừng theo định hướng sản phẩm. |
| `certificate-studio` | `docstudio-certificate` | SVG/HTML từ JSON được inject không sanitize; còn dữ liệu mẫu khiến app trông như đã phân tích tài liệu. |
| `contract-auditor` | `contract-auditor` | Chưa đọc đủ ba bộ chứng từ; khi parse lỗi còn gán nhà cung cấp/MST/số tiền giả trong khi vẫn xuất báo cáo có hình thức chính thức. |
| `policy-assistant` | `policy-assistant` | Bảng định mức và FAQ hard-code, không có nguồn/phiên bản/ngày hiệu lực. Ngưỡng chứng từ không dùng tiền mặt trong FAQ đã lỗi thời so với Nghị định 181/2025/NĐ-CP. |

Chi tiết đánh giá đầy đủ nằm ở `PORTAL_CODEBASE_AUDIT_VI.md` mục 4.

## Điều gì đang giữ chúng ngoài production

1. `hub/src/config/toolsRegistry.js` gắn `readiness: 'in-development'`. Trạng thái này quyết định
   miniapp chỉ nằm trong nhóm "Đang phát triển", không thuộc nhóm nào khác kể cả "Tất cả công cụ".
2. `hub/src/App.jsx` không import wrapper của chúng, nên code không lọt vào bundle.
3. `resolveToolId` trả `null` cho deep-link tới chúng; `selectTool`, command palette và menu chuyển nhanh đều chặn.
4. `npm run build:all` chỉ build workspace đang hoạt động. Workspace tạm dừng chạy riêng bằng `npm run build:in-development`.

Portal vẫn liệt kê chúng trong nhóm "Đang phát triển" trên trang chủ và trong Cài đặt miniapp, để
nhắc rằng đang có công cụ chờ làm tiếp thay vì im lặng giấu đi.

## Cách phát triển tiếp một miniapp

```bash
npm run dev:overlay        # hoặc dev:legal, dev:translator, dev:certificate
npm run build:in-development
```

Khi công cụ đã đủ điều kiện mở lại:

1. Bỏ `readiness: 'in-development'` trong `toolsRegistry.js`, đặt lại `readiness` phù hợp (`experimental` hoặc `beta`) và xóa `unavailableReason`. Miniapp sẽ tự động rời nhóm "Đang phát triển" và về đúng nhóm theo `category`.
2. Chuyển thư mục wrapper từ `hub/src/tools-in-development/<id>/` về `hub/src/tools/<id>/`.
3. Thêm `lazy(...)` và một entry trong `toolComponentMap` ở `hub/src/App.jsx`.
4. Đưa workspace tương ứng từ `build:in-development` sang `build:all` trong `package.json` gốc.
5. Cập nhật danh sách kỳ vọng trong `hub/tests/tools-registry.test.js` — test sẽ đỏ cho đến khi bốn bước trên hoàn tất.

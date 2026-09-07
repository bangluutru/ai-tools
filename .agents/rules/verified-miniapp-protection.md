# Verified Miniapp Protection Rule

## 1. Mục Đích & Phạm Vi
Quy chuẩn này nhằm bảo đảm nguyên tắc **độc lập và cách ly tuyệt đối (Miniapp Isolation)** trong monorepo `ai-tools`.
Khi phát triển, sửa lỗi hoặc refactor một miniapp hay tính năng bất kỳ, các miniapp đã đạt trạng thái **`verified: true`** (đã chạy ổn định và được kiểm duyệt) phải được bảo vệ toàn vẹn, không bị ảnh hưởng phụ.

---

## 2. Danh Sách 11 Miniapp Đã Được Gán Nhãn Verified

| Miniapp ID | Tên Miniapp | Đường dẫn Source Code Chính | Trạng thái |
|---|---|---|---|
| `image-convert` | Nén & Đổi Đuôi Ảnh | `hub/src/tools/image-convert/`, `packages/core/src/utils/image/` | Verified Beta |
| `screen-capture` | Chụp & Chú Thích Màn Hình | `packages/core/src/components/ScreenCaptureView.jsx` | Verified Beta |
| `barcode-qr` | Tạo Mã QR & Barcode | `packages/core/src/components/BarcodeQrStudioView.jsx` | Verified Beta |
| `pdf-toolkit` | Tiện Ích PDF Đa Năng | `hub/src/tools/pdf-toolkit/` | Verified Beta |
| `omniconvert` | Chuyển Đổi Tài Liệu Đa Năng | `packages/core/src/components/OmniConvertView.jsx` | Verified Beta |
| `invoice-studio` | Quản Lý Hóa Đơn & Đề Nghị Thanh Toán | `hub/src/tools/invoice-studio/`, `packages/core/src/utils/invoice/` | Verified Beta |
| `accounting-reconcile` | Đối Chiếu Doanh Thu & Thuế | `packages/core/src/components/AccountingReconcileView.jsx`, `packages/core/src/utils/accounting/` | Verified Beta |
| `tax-calculator` | Tính Thuế TNCN & Tiền Lương 2026 | `packages/core/src/components/TaxCalculatorView.jsx`, `packages/core/src/utils/tax/` | Verified Beta |
| `watermark-studio` | Đóng Dấu Tài Liệu | `packages/core/src/components/WatermarkStudioView.jsx` | Verified Beta |
| `id-photo-studio` | Tạo Ảnh Thẻ & Hộ Chiếu | `packages/core/src/components/IdPhotoStudioView.jsx` | Verified Beta |
| `business-card-studio` | Tạo Danh Thiếp Chuẩn In | `packages/core/src/components/BusinessCardStudioView.jsx`, `packages/core/src/utils/business-card/` | Verified Beta |

*(Lưu ý: 3 miniapp `excel-mapping`, `editor-studio`, `auto-bi` đang ở trạng thái Experimental nên chưa được gán Verified).*

---

## 3. Quy Tắc Bắt Buộc Đối Với AI Agent / AI Coder

### Quy tắc 1: Không Chạm Vào Verified Miniapp Trừ Khi Được Yêu Cầu Đích Danh
- **NGHIÊM CẤM** tự ý sửa đổi code, layout, logic, hoặc dependencies của 11 miniapp trên khi user đang yêu cầu làm task khác.
- Chỉ can thiệp vào code của Verified Miniapp khi User **nêu rõ tên hoặc ID** của miniapp đó trong yêu cầu hiện tại.

### Quy tắc 2: Cấm Cross-Domain Imports
- Không import trực tiếp file logic hoặc view của một miniapp vào miniapp khác.
- Ví dụ: `invoice-studio` KHÔNG ĐƯỢC import từ `packages/core/src/utils/accounting/`.
- Nếu có tiện ích chung thuần túy (ví dụ xử lý chuỗi số, file I/O), hàm đó PHẢI nằm tại thư mục gốc chung: `packages/core/src/utils/numbers.js`, `packages/core/src/utils/documentFiles.js`.

### Quy tắc 3: Bảo Toàn Tương Thích Ngược Tuyệt Đối Khi Sửa Shared Utilities
- Khi buộc phải sửa đổi một shared utility trong `packages/core/src/utils/`, phải đảm bảo:
  1. Signature, input/output contract của hàm cũ không thay đổi.
  2. Toàn bộ 200+ unit test của toàn monorepo (`npm test`) và audit kiểm duyệt (`npm run audit:miniapps`) phải PASS 100% trước khi kết thúc task.

### Quy tắc 4: Mức Độ Leo Thang L3 (Escalation Level L3)
- Nếu việc thực hiện một yêu cầu mới đòi hỏi phải sửa đổi cấu trúc hoặc logic của bất kỳ Verified Miniapp nào, AI Agent phải **DỪNG LẠI**, giải thích lý do cho User, và chỉ tiếp tục sau khi User phê duyệt rõ ràng.

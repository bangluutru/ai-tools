# Báo cáo triển khai audit/hardening P0

**Ngày cập nhật:** 14/08/2026  
**Phạm vi:** portal, nền tảng dùng chung, backend Antigravity và ba miniapp ưu tiên: Đối chiếu kế toán, Đề nghị thanh toán, Chuyển đổi ảnh.

## 1. Kết luận

Đợt triển khai đầu tiên đã biến kết quả audit thành các guardrail có thể kiểm thử: portal công bố đúng nơi xử lý dữ liệu, khóa các miniapp chưa đủ năng lực, chuẩn hóa biên gọi model qua Antigravity, giới hạn upload, loại bỏ dữ liệu tài chính suy đoán và dựng CI.

Ba miniapp ưu tiên hiện phù hợp để tiếp tục UAT nội bộ với dữ liệu đã khử nhạy cảm. Chúng **chưa nên được coi là production-ready** cho đến khi có bộ fixture thực tế, mẫu Đề nghị thanh toán chính thức, xác thực người dùng, chính sách lưu/xóa file và một lần kiểm thử Antigravity end-to-end trong môi trường đích.

## 2. Hạng mục đã triển khai

### 2.1 Quản trị miniapp trong portal

- Registry có trạng thái `beta`, `experimental`, `disabled`, phương thức xử lý dữ liệu, mục đích đầu ra, thứ tự ưu tiên và lý do khóa.
- Sáu miniapp chưa đủ contract bị khóa: PDF Overlay, Legal Studio, Long Translator, Certificate Studio, Contract Auditor và Policy Assistant.
- Portal không còn tuyên bố toàn hệ thống là 100% client-side. Mỗi miniapp hiển thị rõ xử lý trong trình duyệt hay có thể tải lên backend.
- Đầu ra tài chính/pháp lý có cảnh báo chỉ mang tính tham khảo và cần người có thẩm quyền kiểm tra.
- Command palette và bộ chuyển miniapp không cho mở công cụ bị khóa.

### 2.2 Biên AI qua Antigravity

- Backend dùng `google-antigravity==0.1.12`; mọi agent đi qua một gateway duy nhất.
- Không có fallback gọi trực tiếp Gemini/OpenAI/nhà cung cấp khác; gateway không cấp built-in tools cho model.
- Có timeout, kiểm tra structured output và lỗi 503 thống nhất khi runtime chưa sẵn sàng.
- Model có thể để runtime Antigravity lựa chọn hoặc cấu hình qua biến môi trường, không hard-code model tưởng tượng trong từng agent.
- Hook frontend đã thống nhất endpoint `/api/agents` và hỗ trợ JSON/FormData; Vite proxy `/api` sang backend.

Chưa chạy model thật trong đợt này để tránh tiêu thụ quota và vì môi trường đích chưa xác nhận phiên đăng nhập/runtime. Contract SDK đã được unit test bằng fake runtime; smoke test model thật là cổng nghiệm thu bắt buộc trước UAT AI.

### 2.3 Upload/backend

- Upload được đọc theo chunk, giới hạn số file/kích thước request/kích thước từng file, dùng tên UUID và thư mục tạm riêng theo request.
- Kiểm tra extension và magic bytes; làm sạch tên file; dọn file tạm sau xử lý.
- CORS dùng allowlist cấu hình thay vì wildcard; endpoint giả thành công được đổi thành `501 Not Implemented`.
- Backend hóa đơn legacy không còn `extractall`; ZIP được chặn theo số entry, tổng dung lượng giải nén và đường dẫn không an toàn.

### 2.4 Đối chiếu kế toán — ưu tiên 1

- Tách engine đối chiếu khỏi UI; chuẩn hóa số tiền theo định dạng locale.
- Gom bản ghi trùng, áp dụng tolerance, phân biệt matched/difference/missing/review.
- Kết quả giữ evidence: file, sheet, dòng nguồn; bản ghi BR trùng được đưa vào review thay vì tự ghép.
- Excel xuất có summary, dữ liệu 511/33311, matched, difference, missing và review; kèm phiên bản quy tắc/tolerance.
- UI và file xuất đều nêu rõ kết quả tham khảo.

Giới hạn còn lại: mapping sheet/header vẫn phụ thuộc profile hiện có. Cần fixture đại diện từ dữ liệu thật và bộ golden result do kế toán xác nhận.

### 2.5 Đề nghị thanh toán — ưu tiên 2

- Parser client không còn tự gán ngày hiện tại hoặc suy đoán thuế suất/số tiền khi chứng từ thiếu dữ liệu.
- Chỉ tính số học trực tiếp khi các thành phần nguồn đều có mặt; trường thiếu được đánh dấu để review.
- Giới hạn 50 file, 20 MiB/file; ZIP tối đa 100 entry/100 MiB giải nén và chặn path traversal.
- Không dùng số tiền/ngày làm khóa loại trùng; chỉ dùng số hóa đơn khi có.
- Đầu ra đổi thành “Bản nháp tham khảo — chưa phê duyệt”; người dùng phải xác nhận đã kiểm tra chứng từ trước khi xuất.

Giới hạn còn lại: chưa có mẫu Đề nghị thanh toán chính thức đã duyệt và chưa nối OCR/model Antigravity cho PDF scan. Vì vậy đầu ra hiện là workbook bản nháp chung, không phải biểu mẫu nghiệp vụ cuối cùng.

### 2.6 Chuyển đổi ảnh — ưu tiên 3

- Chấp nhận PNG/JPG/JPEG/WebP/GIF; GIF động chỉ lấy frame đầu và được công bố rõ.
- Giới hạn 50 file, 25 MiB/file, 100 MiB/batch, 40 megapixel/ảnh.
- Dùng object URL thay vì data URL, thu hồi URL tạm, kiểm tra canvas/context và clamp quality.
- Tên file trong ZIP được làm duy nhất khi input trùng tên; có tiến độ và hủy sau file đang xử lý.
- CLI kiểm tra quality và không còn đọc stat của output chưa tồn tại.

Giới hạn còn lại: cần benchmark trên thiết bị mục tiêu, đặc biệt ảnh sát 40 MP và batch sát 100 MiB.

### 2.7 Dependency, test và CI

- Sửa workspace không tồn tại; lockfile đồng bộ để `npm ci` tái lập được.
- Nâng `pdfjs-dist`/`sharp`, dùng bản SheetJS chính thức thay cho package npm cũ có lỗ hổng high severity.
- Khai báo dependency trực tiếp cho `packages/core`.
- CI chạy Node 22 và Python 3.12: install, lint critical, unit test, build, audit high, compile Python và pytest.

## 3. Bằng chứng kiểm thử

| Kiểm tra | Kết quả |
|---|---|
| JavaScript unit tests | 12/12 pass (core 9, hub 3) |
| Python backend tests | 9/9 pass |
| Critical lint | Pass |
| Build toàn bộ JS workspaces | Pass |
| Python `compileall` | Pass |
| `npm ci --dry-run --ignore-scripts` | Pass |
| `npm audit --omit=dev --audit-level=high` | Pass; còn 2 moderate gián tiếp qua `exceljs -> uuid` |
| Browser smoke test portal | 14 miniapp hiển thị, 6 bị khóa; ba miniapp ưu tiên mở được và công bố đúng giới hạn/disclaimer |

Build còn cảnh báo circular vendor chunks và bundle office lớn khoảng 2,1 MB minified. Đây là nợ hiệu năng P1, không phải lỗi build.

## 4. Cổng nghiệm thu trước production

1. Chọn cơ chế đăng nhập và RBAC; tối thiểu phân quyền người dùng, reviewer và admin.
2. Chốt retention/xóa file, mã hóa lưu trữ, audit log và phân loại dữ liệu được phép upload.
3. Cung cấp fixture kế toán đã khử nhạy cảm cùng golden result do kế toán duyệt.
4. Cung cấp file Excel Đề nghị thanh toán chính thức và quy tắc mapping/versioning.
5. Chạy smoke test model thật qua Antigravity trong môi trường deploy; ghi lại model/runtime version, timeout và quota.
6. UAT ba miniapp ưu tiên với dữ liệu biên; benchmark ảnh trên thiết bị mục tiêu.
7. Tách code trùng trong các `docstudio-*`, bổ sung deep link/job history và tối ưu bundle ở P1.

## 5. Đề xuất thứ tự tiếp theo

- **Sprint kế tiếp:** fixture/golden tests cho Đối chiếu kế toán; tích hợp template chính thức cho Đề nghị thanh toán; auth/RBAC và retention cơ bản.
- **Sau đó:** OCR/Antigravity cho PDF scan theo cơ chế evidence-first, benchmark ảnh, quan sát vận hành và UAT.
- **Chỉ mở lại miniapp đang khóa** khi có input/output contract, giới hạn, privacy mode, test và owner nghiệp vụ tương ứng.

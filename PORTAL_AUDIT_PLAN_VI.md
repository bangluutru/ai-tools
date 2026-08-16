# Kế hoạch audit portal miniapp

**Ngày lập:** 16/08/2026
**Phạm vi:** 12 miniapp đang hoạt động + 6 miniapp đang phát triển, `packages/core`, vỏ portal `hub`.

Mục tiêu do chủ sở hữu đặt ra: các miniapp **dùng chung tài nguyên portal** để tối ưu, nhưng
**chạy độc lập** không ảnh hưởng nhau, có **chung một ngôn ngữ thiết kế**, và hoạt động đúng ý
tưởng thiết kế ban đầu.

---

## 1. Hiện trạng đo được

| Chỉ số | Giá trị |
|---|---|
| Miniapp trong registry | 18 (12 hoạt động, 6 đang phát triển) |
| Dòng code view trong `packages/core` | ~12.500 |
| Test | 88 pass |
| Chunk lớn nhất | `OmniConvertTool` 993 kB (gzip 308 kB) |
| Vendor chunk có tên | 4 (`pdfjs`, `pdf-lib`, `exceljs`, `xlsx`) |
| Vendor chunk vô danh > 300 kB | 2 (`mammoth` 396 kB, một chunk 348 kB) |

---

## 2. Phát hiện

### 2.1 Đã sửa trong đợt này

| # | Phát hiện | Bằng chứng |
|---|---|---|
| A1 | CI đỏ 5 commit liên tiếp, không ai để ý | 15 lỗi lint; CI dừng ở bước lint nên **chưa bao giờ chạy tới bước build** |
| A2 | OmniConvert mồ côi: 5 commit công sức không mở được | Commit `2ea1a3e` xoá entry registry + dòng test + dependency |
| A3 | `packages/core` import 6 lib mà không khai báo | Chỉ chạy nhờ hoisting; khi bị xoá thì build gãy ở `jspdf` |
| A4 | Test tính duy nhất bị nới lỏng để khớp với lỗi | `omniconvert` mang `priority: 2` trùng `invoice-webapp` |

### 2.2 Người dùng thấy ngay — chưa sửa

| # | Phát hiện | Bằng chứng |
|---|---|---|
| B1 | **Nút "Giao diện Sáng" không hoạt động** | `data-theme` đổi sang `light` nhưng vỏ vẫn `rgb(2,6,23)`; `App.jsx` hard-code `bg-slate-950` |
| B2 | **Ba ngôn ngữ thiết kế trong cùng một portal** | Xem 2.3 |
| B3 | **Nhãn hiệu lạ bên trong portal** | PDF Split/Merge hiện "DOCSTUDIO", Excel Mapping hiện "DocStudio" — người dùng đang ở "AI-Tools" |
| B4 | Barcode QR lưu lịch sử nhưng không có nơi xem | `setHistory` ghi vào `localStorage`, có sẵn nhãn `emptyHistory`/`btnSaveHistory`, nhưng không panel nào đọc |

### 2.3 Bản đồ ngôn ngữ thiết kế

| Nhóm | Miniapp | Đặc điểm |
|---|---|---|
| Tối, hợp vỏ portal | pdf-compress, screen-capture, barcode-qr, omniconvert, accounting-reconcile, invoice-webapp, auto-bi, image-convert | `slate-900/950`, không nhãn hiệu riêng |
| Sáng + header đỏ | pdf-split, pdf-merge | `bg-white`, banner "DOCSTUDIO" |
| Sáng + header tím | excel-mapping, editor-studio | `bg-white`, banner "DocStudio" |

Bốn miniapp nhóm 2 và 3 dùng `bg-white` từ 5–7 lần mỗi file, nằm lọt giữa vỏ tối.

### 2.4 Tài nguyên chung chưa được dùng lại

| # | Phát hiện | Bằng chứng |
|---|---|---|
| C1 | 4 miniapp mới **không kiểm tra giới hạn hay chữ ký file** | `PdfCompressorView`, `OmniConvertView`, `ScreenCaptureView`, `BarcodeQrStudioView` đều không gọi `documentFiles.js` |
| C2 | `documentFiles.js` thiếu preset cho ảnh / PDF nén / chuyển đổi | Chỉ có `EXCEL_FILE_LIMITS`, `PDF_SPLIT_LIMITS`, `PDF_MERGE_LIMITS` |
| C3 | Chunk OmniConvert 993 kB gộp cả 4 engine | Chuyển 1 file DOCX vẫn tải cả `pptxgenjs` |
| C4 | `manualChunks` chỉ đặt tên 4 lib | `mammoth`, `docx` rơi vào chunk vô danh |
| C5 | Mỗi view tự viết logic tải file | 5 view tự gọi `createObjectURL` thay vì một helper chung |

### 2.5 Đã kiểm chứng là **không** có vấn đề

Ghi lại để khỏi mất công nghi ngờ về sau:

- **Không rò rỉ object URL** — số `createObjectURL` và `revokeObjectURL` khớp ở cả 5 view.
- **Không có listener toàn cục thiếu dọn dẹp** — view duy nhất gắn listener (`OmniConvertView`) có gỡ.
- **`canvas-confetti` đã được chia sẻ đúng** — 5 miniapp dùng chung một chunk 10,7 kB.
- **Lockfile không lệch** — build gãy ở máy local chỉ vì `node_modules` cũ.
- **Workspace `docstudio-*` không nhân bản miniapp mới** — chúng vẫn tách biệt.

---

## 3. Kế hoạch theo giai đoạn

### Giai đoạn 1 — Chặn hồi quy *(nền tảng cho mọi giai đoạn sau)*

1. Thêm test bắt buộc: mọi miniapp trong registry phải có component tương ứng **và ngược lại**
   (hiện chỉ kiểm tra một chiều, nên OmniConvert mồ côi mà test vẫn xanh).
2. Thêm test: mọi lib được `packages/core` import phải có trong `dependencies` của chính nó.
3. Yêu cầu CI xanh trước khi merge.

### Giai đoạn 2 — Thống nhất ngôn ngữ thiết kế

4. Chốt bộ token dùng chung (nền, viền, thẻ, nút, cảnh báo) trong `packages/core`.
5. Bỏ nhãn hiệu "DOCSTUDIO"/"DocStudio" khỏi 4 miniapp — portal chỉ có một thương hiệu.
6. Chuyển 4 miniapp nhóm sáng sang token dùng chung.
7. Sửa nút chuyển giao diện: hoặc làm cho sáng/tối chạy thật, hoặc bỏ nút.

### Giai đoạn 3 — Dùng chung tài nguyên, giữ độc lập

8. Mở rộng `documentFiles.js` thêm preset ảnh / PDF nén / chuyển đổi.
9. Nối 4 miniapp mới vào `validateDocumentFiles` + `verifyDocumentSignature`.
10. Gom logic tải file về một helper dùng chung.
11. Đặt tên vendor chunk cho `mammoth`, `docx`, `jspdf`, `html2canvas`.
12. Tách engine OmniConvert theo định dạng để chỉ tải thứ cần dùng.

### Giai đoạn 4 — Đúng ý tưởng thiết kế

13. Dựng panel lịch sử cho Barcode QR, hoặc bỏ hẳn phần lưu nếu không cần.
14. Rà từng miniapp trên trình duyệt với dữ liệu thật, ghi lại kết quả.

---

## 4. Tiêu chí nghiệm thu

- CI xanh; không miniapp nào trong registry thiếu component và ngược lại.
- Mở lần lượt 12 miniapp: cùng nền, cùng kiểu thẻ/nút, không nhãn hiệu lạ, không lỗi console.
- Nút chuyển giao diện làm đúng điều nó hứa, hoặc không tồn tại.
- Mọi ô tải file đều công bố giới hạn và từ chối file sai định dạng.
- Không miniapp nào tải tài nguyên của miniapp khác khi mở.

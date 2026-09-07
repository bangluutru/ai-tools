# 🛡️ STABLE CHECKPOINT & PHỤC HỒI HỆ THỐNG (DISASTER RECOVERY MANUAL)

Tài liệu này ghi nhận **phiên bản ổn định chuẩn mốc (Gold Standard Stable Checkpoint)** của dự án **AI-Tools Master Hub**.  
Trong tương lai, nếu các lần nâng cấp hoặc cập nhật tính năng gặp bất kỳ sự cố, xung đột mã nguồn hoặc lỗi giao diện, hãy sử dụng hướng dẫn dưới đây để phục hồi ứng dụng về trạng thái hoàn hảo này chỉ với 1-2 thao tác.

---

## 📌 1. Thông Tin Nhận Diện Phiên Bản (Checkpoint Metadata)

| Thuộc tính | Giá trị ghi nhận |
|---|---|
| **Mã phiên bản (Semantic Version)** | `v1.3.0-stable` |
| **Git Tag** | `v1.3.0-stable` |
| **Commit Hash mốc** | `bc0e6a4` (và các commit Verified Governance kế tiếp) |
| **Ngày xác nhận & đóng băng** | 07/09/2026 |
| **Trạng thái kiểm thử tự động** | 207 / 207 tests PASSED (100%) |
| **Trạng thái Audit tĩnh MAIS** | 20 / 20 miniapps PASSED (100%) |
| **Domain Production chính thức** | [https://ai-tools-dm6.pages.dev](https://ai-tools-dm6.pages.dev) |

---

## 🎯 2. Trạng Thái Hoạt Động Được Đảm Bảo (Verified Capabilities)

Ở phiên bản này, hệ thống bảo vệ độc lập (Miniapp Isolation) và **11 miniapp đã đạt chuẩn Verified (`verified: true`)**:

1. **Quản Lý Hóa Đơn & Tạo Đề Nghị Thanh Toán (`invoice-studio`)**:
   - Tải file XML/PDF hóa đơn điện tử chuẩn Việt Nam (Nghị định 123/Thông tư 78).
   - Tách bảng đề nghị thanh toán theo từng đơn vị mua hàng (Mã số thuế / Tên công ty mua) và nội dung công tác/khoán trọn ngày.
   - Hỗ trợ hóa đơn vé máy bay (tách phí dịch vụ và lệ phí thu hộ sân bay).
   - Xuất file Excel ĐNTT nhiều sheet theo tháng, file A4 PDF có chữ ký điện tử xác thực.
2. **Ảnh Thẻ (`id-photo-studio`)**:
   - Tải ảnh, xoay, lật, AI cắt nền tự động.
   - Căn chỉnh tỷ lệ ảnh chuẩn không bị phóng to quá mức (Zoom từ 10% đến 300%).
   - Căn chỉnh đa chiều Pan X & Pan Y vừa khít khuôn mặt vào khung hộ chiếu/thẻ visa.
   - Xuất file ảnh đơn và in ấn dàn trang (tờ 4x6 inch / A4).
3. **Mã Vạch & QR (`barcode-qr`)**:
   - Cách ly hoàn toàn khung hiển thị theo tab: chọn Barcode chỉ hiện Barcode, chọn QR chỉ hiện QR.
   - Văn bản chú thích dưới mã vạch/QR có độ tương phản cao, chữ tối nền sáng rõ nét.
   - Hỗ trợ đầy đủ các chuẩn EAN-13, CODE128, UPC, QR WiFi, vCard, v.v.
4. **Đóng Dấu Tài Liệu (`watermark-studio`)**:
   - Xem trước trực quan thời gian thực (Live Preview) con dấu màu đỏ bảo mật trên trang giấy A4.
   - Hiển thị trực tiếp trang 1 của file PDF thật trong khung xem trước nhờ tích hợp `pdfjs-dist`.
   - Thuật toán lặp ma trận so le (staggered tiling grid) chống đè chữ, loại bỏ hiện tượng dính chữ.
   - Xuất file hàng loạt với con dấu đỏ in chìm trên PDF, Word DOCX, PNG, XLSX, PPTX.
5. **Nén & Đổi Đuôi Ảnh (`image-convert`)**:
   - Xử lý nén ảnh JPG/PNG/WebP hàng loạt trên client, bảo toàn EXIF/Color Profile tùy chọn.
6. **Chụp Màn Hình (`screen-capture`)**:
   - Chụp viewport, cửa sổ trình duyệt, vẽ mũi tên/hộp thoại chú thích chuyên nghiệp.
7. **Tiện Ích PDF Đa Năng (`pdf-toolkit`)**:
   - Gộp file PDF, tách trang, xoay trang, xóa trang thừa với engine `pdf-lib` 100% client-side.
8. **Chuyển Đổi Đa Năng (`omniconvert`)**:
   - Chuyển đổi định dạng đa năng tài liệu, dữ liệu bảng tính không phụ thuộc server.
9. **Đối Chiếu Kế Toán (`accounting-reconcile`)**:
   - Đối chiếu chênh lệch doanh thu và thuế GTGT giữa sổ cái 511, 33311 và bảng kê bán ra (BR).
10. **Tính Thuế TNCN (`tax-calculator`)**:
    - Tính thuế TNCN lũy tiến 5 bậc chuẩn 2026, chuyển đổi 2 chiều Gross ↔ Net, bảo hiểm 4 vùng, trần BHXH mới 50,6tr.
11. **Tạo Danh Thiếp Chuẩn In (`business-card-studio`)**:
    - 28 mẫu danh thiếp chuẩn in 300 DPI, bù xén 3mm, dấu Tonbo, AI OCR danh thiếp cũ và tạo vCard/QR.

---

## 🔄 3. Hướng Dẫn Phục Hồi Khi Gặp Sự Cố (Rollback Procedures)

### Kịch bản A: Phục hồi mã nguồn trên máy phát triển cục bộ (Local Rollback)

Nếu trong quá trình code thêm tính năng mới bị lỗi và muốn đưa toàn bộ mã nguồn về phiên bản ổn định này:

#### Cách 1: Hoàn tác sạch sẽ về checkpoint (Khuyên dùng khi muốn xóa bỏ các thay đổi lỗi)
```bash
# 1. Lưu hoặc hủy các file tạm đang sửa dở
git reset --hard

# 2. Đưa nhánh main về đúng tag v1.2.0-stable
git checkout main
git reset --hard v1.2.0-stable

# 3. Chạy kiểm tra test để đảm bảo 100% xanh
npm test

# 4. Khởi động lại dev server
npm run dev
```

#### Cách 2: Xem lại phiên bản ổn định trên một nhánh mới (Không mất code đang làm)
```bash
git checkout -b recovery-v1.2 v1.2.0-stable
npm run dev
```

---

### Kịch bản B: Phục hồi và Deploy lại Production Cloudflare Pages (Production Rollback)

Nếu đã deploy phiên bản mới lên Cloudflare Pages nhưng bản mới bị lỗi và cần đưa website trực tuyến về ngay phiên bản ổn định này:

#### Lệnh phục hồi 1 bước từ terminal:
```bash
# 1. Checkout mã nguồn tại mốc ổn định
git checkout v1.2.0-stable

# 2. Build lại gói phân phối chuẩn
npm run --prefix hub build

# 3. Đẩy gói build lên Cloudflare Pages
npx wrangler pages deploy hub/dist --project-name=ai-tools --branch=main
```

#### Hoặc phục hồi trực tiếp từ Cloudflare Pages Dashboard (Không cần chạm vào code):
1. Truy cập [dash.cloudflare.com](https://dash.cloudflare.com/) > **Workers & Pages** > chọn dự án **ai-tools**.
2. Vào mục **Deployments**.
3. Tìm bản deployment được tạo vào ngày **05/09/2026** (Commit `9c8e053` hoặc có tag `v1.2.0-stable`).
4. Bấm vào nút `...` bên cạnh bản ghi và chọn **"Rollback to this deployment"**.
5. Trang web sẽ tức thì quay về trạng thái ổn định trong vòng 5 giây mà không cần build lại.

---

## 🔒 4. Cam Kết Toàn Vẹn Dữ Liệu
Tag `v1.2.0-stable` đã được đẩy lên GitHub remote repository tại:
👉 `https://github.com/bangluutru/ai-tools/releases/tag/v1.2.0-stable`
Người dùng hoặc các trợ lý AI về sau có thể kiểm tra trực tiếp bằng lệnh:
```bash
git describe --tags --always
# Kết quả trả về: v1.2.0-stable
```

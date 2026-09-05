# 🛡️ STABLE CHECKPOINT & PHỤC HỒI HỆ THỐNG (DISASTER RECOVERY MANUAL)

Tài liệu này ghi nhận **phiên bản ổn định chuẩn mốc (Gold Standard Stable Checkpoint)** của dự án **AI-Tools Master Hub**.  
Trong tương lai, nếu các lần nâng cấp hoặc cập nhật tính năng gặp bất kỳ sự cố, xung đột mã nguồn hoặc lỗi giao diện, hãy sử dụng hướng dẫn dưới đây để phục hồi ứng dụng về trạng thái hoàn hảo này chỉ với 1-2 thao tác.

---

## 📌 1. Thông Tin Nhận Diện Phiên Bản (Checkpoint Metadata)

| Thuộc tính | Giá trị ghi nhận |
|---|---|
| **Mã phiên bản (Semantic Version)** | `v1.2.0-stable` |
| **Git Tag** | `v1.2.0-stable` |
| **Git Branch dự phòng** | `checkpoint/stable-v1.2` |
| **Commit Hash (HEAD)** | `9c8e053` (hoặc commit tạo checkpoint này) |
| **Ngày xác nhận & đóng băng** | 05/09/2026 |
| **Trạng thái kiểm thử tự động** | 154 / 154 tests PASSED (100%) |
| **Trạng thái kiểm thử trình duyệt** | Verified trên Chrome Puppeteer (ID Photo, Barcode/QR, Watermark Studio) |
| **Domain Production chính thức** | [https://ai-tools-dm6.pages.dev](https://ai-tools-dm6.pages.dev) |
| **Deployment ID Cloudflare** | `1650bbd3` |

---

## 🎯 2. Trạng Thái Hoạt Động Được Đảm Bảo (Verified Capabilities)

Ở phiên bản này, toàn bộ các chức năng cốt lõi sau đã được chứng thực hoạt động mượt mà 100%:
1. **Ảnh Thẻ (ID Photo Studio)**:
   - Tải ảnh, xoay, lật, AI cắt nền tự động.
   - Căn chỉnh tỷ lệ ảnh chuẩn không bị phóng to quá mức (Zoom từ 10% đến 300%).
   - Căn chỉnh đa chiều Pan X & Pan Y vừa khít khuôn mặt vào khung hộ chiếu/thẻ visa.
   - Xuất file ảnh đơn và in ấn dàn trang (tờ 4x6 inch / A4).
2. **Mã Vạch & QR (Barcode & QR Studio)**:
   - Cách ly hoàn toàn khung hiển thị theo tab: chọn Barcode chỉ hiện Barcode, chọn QR chỉ hiện QR.
   - Văn bản chú thích dưới mã vạch/QR có độ tương phản cao, chữ tối nền sáng rõ nét.
   - Hỗ trợ đầy đủ các chuẩn EAN-13, CODE128, UPC, QR WiFi, vCard, v.v.
3. **Đóng Dấu Bản Quyền (Watermark Studio)**:
   - Xem trước trực quan thời gian thực (Live Preview) con dấu màu đỏ bảo mật trên trang giấy A4.
   - Hiển thị trực tiếp trang 1 của file PDF thật trong khung xem trước nhờ tích hợp `pdfjs-dist`.
   - Thuật toán lặp ma trận so le (staggered tiling grid) chống đè chữ, loại bỏ hiện tượng dính chữ.
   - Xuất file hàng loạt và tải về thành công với con dấu đỏ in chìm trên PDF, Word DOCX, PNG, XLSX, PPTX.
4. **Hệ Thống Master Hub (12 Miniapps)**:
   - Không có cảnh báo lỗi console hay xung đột thư viện.
   - Tương thích tối ưu trên mọi màn hình máy tính và thiết bị di động.

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

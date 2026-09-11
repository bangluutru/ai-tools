# Hướng Dẫn Thiết Kế Đồ Họa Vector Hub Toolio (Hub Illustration Guide)

## 1. Tiêu chuẩn & Nguyên tắc Đồ họa

Hệ thống minh họa trên Hub Toolio tuân thủ nghiêm ngặt các nguyên tắc thiết kế nhằm giữ vững tính nhất quán, tải nhanh và hài hòa với Toolio Design System:

1. **100% Vector SVG Thuần túy**:
   - Tuyệt đối không dùng ảnh raster (PNG, JPEG, WebP) hoặc asset nhị phân cho các minh họa trang chủ.
   - Định dạng code React Component chuẩn JSX đóng gói trong `hub/src/assets/illustrations/index.jsx`.
   - Dung lượng siêu nhẹ (< 3KB cho mỗi vector).
2. **Kế thừa Theme Động (CurrentColor & CSS Tokens)**:
   - Sử dụng `stroke="currentColor"` và `fill="currentColor"` kết hợp `fillOpacity` để tự động biến đổi hài hòa theo cả hai chế độ Sáng (Light Mode) và Tối (Dark Mode).
   - Tương thích hoàn toàn với bảng màu chuẩn:
     - `text-primary` (`#0284c7`) cho Tools.
     - `text-rose-500` / `text-rose-400` cho Japan Life.
     - `text-emerald-500` / `text-emerald-400` cho Vietnam Life.
3. **Trợ năng & Không gây phân tâm (Accessibility & Subtlety)**:
   - Tất cả SVG đều mang thuộc tính `aria-hidden="true"` và `focusable="false"` để không làm nhiễu công cụ đọc màn hình.
   - Sử dụng opacity tinh tế (`opacity-20` đến `opacity-35` ở trạng thái hover) để minh họa chỉ đóng vai trò điểm nhấn thẩm mỹ, không lấn át nội dung văn bản.

---

## 2. Danh mục & Biểu tượng Tên miền

### 2.1 Domain: Công cụ (`common`)
- **Toolbox (`ToolboxIllustration`)**:
  - *Tệp nguồn*: `hub/src/assets/illustrations/tools/toolbox.svg`
  - *Ý nghĩa*: Hộp đồ nghề mini đa năng biểu trưng cho sự tiện ích, thực dụng, giải quyết nhanh các tác vụ văn phòng, xử lý tệp và kế toán hàng ngày.
  - *Màu chủ đạo*: Cyan / Sky Blue (`#0284c7`).

### 2.2 Domain: Cuộc sống tại Nhật (`japan-life`)
- **Hoa Anh Đào (`SakuraIllustration`)**:
  - *Tệp nguồn*: `hub/src/assets/illustrations/japan/sakura.svg`
  - *Ý nghĩa*: Bông hoa anh đào 5 cánh kinh điển của Nhật Bản với nhụy hoa cách điệu tinh tế, đặt trên thẻ Top-Level Domain Card.
  - *Màu chủ đạo*: Sakura Rose (`#f43f5e`).
- **Cành Anh Đào (`SakuraBranchIllustration`)**:
  - *Tệp nguồn*: `hub/src/assets/illustrations/japan/sakura-branch.svg`
  - *Ý nghĩa*: Cành đào uốn lượn phong cách truyền thống Nhật Bản, sử dụng làm hình nền trang trí mờ ở góc header của Domain Catalogue.
- **Núi Phú Sĩ (`FujiIllustration`)**:
  - *Tệp nguồn*: `hub/src/assets/illustrations/japan/fuji.svg`
  - *Ý nghĩa*: Đỉnh núi Phú Sĩ tuyết phủ soi bóng mặt nước, dùng cho các khu vực trang trí mở rộng.
- **Chùa Năm Tầng (`PagodaIllustration`)**:
  - *Tệp nguồn*: `hub/src/assets/illustrations/japan/pagoda.svg`
  - *Ý nghĩa*: Kiến trúc chùa truyền thống đại diện cho tính bền vững và quy chuẩn.

### 2.3 Domain: Cuộc sống tại Việt Nam (`vietnam-life`)
- **Hoa Sen (`LotusIllustration`)**:
  - *Tệp nguồn*: `hub/src/assets/illustrations/vietnam/lotus.svg`
  - *Ý nghĩa*: Đóa hoa sen nở trên mặt nước biểu trưng cho quốc hoa và bản sắc văn hóa Việt Nam.
  - *Màu chủ đạo*: Lotus Emerald (`#10b981`).
- **Tháp Rùa Hồ Gươm (`TurtleTowerIllustration`)**:
  - *Tệp nguồn*: `hub/src/assets/illustrations/vietnam/turtle-tower.svg`
  - *Ý nghĩa*: Tháp Rùa cổ kính nằm giữa làn nước Hồ Gươm, sử dụng cho màn hình Trạng thái Chờ phát triển (Coming Soon) và header của Vietnam Life.
- **Phong cảnh Việt Nam (`VietnamLandscapeIllustration`)**:
  - *Tệp nguồn*: `hub/src/assets/illustrations/vietnam/vietnam-landscape.svg`
  - *Ý nghĩa*: Dãy núi đá vôi vịnh Hạ Long và cánh buồm lướt sóng nhẹ nhàng.

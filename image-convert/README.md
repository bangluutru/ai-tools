# WebP Master - Công Cụ Chuyển Đổi Định Dạng Ảnh Sang WebP

Một ứng dụng Web hiện đại và bộ công cụ CLI hỗ trợ chuyển đổi các định dạng ảnh phổ biến (PNG, JPEG, GIF, BMP, SVG, AVIF) sang định dạng **WebP** chuẩn hóa với hiệu suất tối ưu và bảo mật tuyệt đối.

---

## 🌟 Tính Năng Nổi Bật

1. **Web App (Giao diện người dùng)**:
   - **Kéo thả hàng loạt (Batch Drag & Drop)**: Thao tác chọn hoặc kéo thả hàng loạt ảnh cùng lúc.
   - **Bảo mật 100% Client-side**: Toàn bộ quá trình nén và chuyển đổi diễn ra trực tiếp trong trình duyệt bằng HTML5 Canvas API. Ảnh của bạn **không bao giờ được tải lên bất kỳ máy chủ bên ngoài nào**.
   - **Tùy chỉnh thông số WebP**:
     - Điều chỉnh chất lượng (Quality: 1% đến 100%).
     - Thay đổi kích thước (Max Width / Height, tự động giữ tỷ lệ Aspect Ratio).
     - Tùy chọn xử lý nền trong suốt (Giữ nguyên Alpha channel hoặc fill màu Trắng/Đen).
   - **So sánh trước & sau (Visual Compare Slider)**: Thanh trượt so sánh ảnh gốc và ảnh WebP cho phép bạn đánh giá chất lượng mắt thường trực tiếp trước khi tải về.
   - **Thống kê dung lượng**: Hiển thị chính xác dung lượng trước/sau và phần trăm dung lượng tiết kiệm được (% Saved).
   - **Tải về linh hoạt**: Tải về từng ảnh hoặc đóng gói toàn bộ danh sách thành file `.zip`.

2. **CLI Tool (Chạy từ Terminal)**:
   - Thư viện Node.js CLI giúp bạn chuyển đổi toàn bộ một thư mục ảnh số lượng lớn chỉ bằng 1 dòng lệnh terminal.

---

## 🚀 Hướng Dẫn Khởi Chạy

### 1. Cài đặt dependencies
Chạy lệnh sau tại thư mục `image-convert`:

```bash
npm install
```

### 2. Chạy Web App (Local Dev Server)

```bash
npm run dev
```

Mở trình duyệt truy cập đường dẫn: `http://localhost:3000`

### 3. Build ứng dụng sản xuất (Production Build)

```bash
npm run build
```

---

## 💻 Hướng Dẫn Sử Dụng CLI Tool

Bạn có thể chạy lệnh chuyển đổi trực tiếp trên Terminal với script CLI:

```bash
# Cú pháp tổng quát:
npm run convert -- <input_path> [output_path] [quality]

# Ví dụ 1: Chuyển đổi toàn bộ thư mục ảnh trong ./my-photos lưu vào ./output với quality 85%
npm run convert -- ./my-photos ./output 85

# Ví dụ 2: Chuyển đổi 1 file ảnh duy nhất
npm run convert -- ./banner.png ./banner.webp 80
```

---

## 🛠️ Cấu Trúc Dự Án

```
image-convert/
├── cli/
│   └── convert-cli.mjs       # Script Node.js CLI
├── src/
│   ├── components/
│   │   ├── Header.jsx        # Thanh tiêu đề & theme toggle
│   │   ├── DropZone.jsx      # Vùng kéo thả tập tin
│   │   ├── SettingsBar.jsx   # Bảng điều chỉnh quality & resize
│   │   ├── StatsOverview.jsx # Thống kê dung lượng & nút download ZIP
│   │   ├── ImageGrid.jsx     # Danh sách card hiển thị ảnh
│   │   ├── ImageCard.jsx     # Card ảnh đơn lẻ
│   │   └── CompareModal.jsx  # Modal so sánh trước/sau khi nén
│   ├── utils/
│   │   ├── converter.js      # Canvas Image -> WebP conversion logic
│   │   ├── formatters.js     # Helper format bytes & percent
│   │   └── zipExporter.js    # Tải tập tin ZIP với JSZip
│   ├── App.jsx               # React App Component chính
│   ├── main.jsx              # Entry point
│   └── index.css             # Vanilla CSS design tokens & animations
├── index.html
├── vite.config.js
├── package.json
└── README.md
```

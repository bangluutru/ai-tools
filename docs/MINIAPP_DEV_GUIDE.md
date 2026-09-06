# 📘 CẨM NANG HƯỚNG DẪN PHÁT TRIỂN & TÍCH HỢP MINIAPP (MINIAPP DEVELOPER & PORTING GUIDE)
**AI-Tools Master Hub (`ai-tools`)**  
*Tài liệu thực hành từng bước dành cho Nhà phát triển & AI Agents khi khởi tạo miniapp mới hoặc chuyển đổi codebase bên ngoài vào Hub.*

---

## 🧭 MỤC LỤC
1. [Triết Lý & Nguyên Tắc Cốt Lõi](#1-triết-lý--nguyên-tắc-cốt-lõi)
2. [Nhận Diện Ngữ Cảnh: Tạo Mới Trong Hub vs Tích Hợp Bên Ngoài](#2-nhận-diện-ngữ-cảnh-tạo-mới-trong-hub-vs-tích-hợp-bên-ngoài)
3. [Luồng 1: Quy Trình Tạo Mới Trực Tiếp Trong Hub (In-Hub Creation)](#3-luồng-1-quy-trình-tạo-mới-trực-tiếp-trong-hub-in-hub-creation)
4. [Luồng 2: Quy Trình Tích Hợp Codebase Bên Ngoài (External Codebase Porting)](#4-luồng-2-quy-trình-tích-hợp-codebase-bên-ngoài-external-codebase-porting)
5. [Bảng Đối Chiếu Quy Tắc Chuyển Đổi (External-to-Hub Adaptation Matrix)](#5-bảng-đối-chiếu-quy-tắc-chuyển-đổi-external-to-hub-adaptation-matrix)
6. [Các Bẫy Kỹ Thuật Thường Gặp & Giải Pháp Phòng Vệ](#6-các-bẫy-kỹ-thuật-thường-gặp--giải-pháp-phòng-vệ)
7. [Checklist Nghiệm Thu Đưa Vào Vận Hành](#7-checklist-nghiệm-thu-đưa-vào-vận-hành)

---

## 📌 1. TRIẾT LÝ & NGUYÊN TẮC CỐT LÕI

AI-Tools Master Hub được xây dựng theo phong cách **Modern Utility Workspace** — không gian làm việc chuyên nghiệp, riêng tư và tốc độ cao. Mọi miniapp khi tham gia vào Hub phải tuân thủ 3 nguyên tắc:

1. **Sử Dụng Chung Tài Nguyên Nhưng Hoạt Động Hoàn Toàn Độc Lập**:
   - Sử dụng chung hệ thống Design Tokens, thư viện biểu tượng `lucide-react`, thanh điều hướng, cơ chế chuyển Theme Dark/Light và gói `@ai-tools/core`.
   - Nhưng **tuyệt đối không phụ thuộc trạng thái chéo**: lỗi sập của một miniapp bất kỳ không bao giờ được phép làm ảnh hưởng tới thanh điều hướng hay miniapp khác nhờ cơ chế cô lập `ToolErrorBoundary`.
2. **Xử Lý Riêng Tư Trên Trình Duyệt (Browser-First / Client-Side Focus)**:
   - Ưu tiên xử lý 100% dữ liệu (ảnh, video, PDF, bảng tính, âm thanh) trực tiếp trên trình duyệt của người dùng qua Web APIs, Web Workers, WASM. Không tự ý đẩy file lên máy chủ bên ngoài.
3. **Bảo Tồn Logic Nghiệp Vụ, Đồng Bộ Hóa Toàn Diện UI/UX**:
   - Khi đưa một codebase từ bên ngoài vào, **không được thay đổi thuật toán và logic nghiệp vụ** vốn có của công cụ.
   - Nhưng **bắt buộc phải tinh chỉnh và chuẩn hóa giao diện** để hòa nhập vào ngôn ngữ thiết kế chung: layout 1240px, Dark/Light mode token, Zero Horizontal Overflow, và không raw emoji.

---

## 🔍 2. NHẬN DIỆN NGỮ CẢNH: TẠO MỚI TRONG HUB VS TÍCH HỢP BÊN NGOÀI

Trước khi bắt đầu, hệ thống phân định rõ ràng 2 luồng công việc:

```mermaid
graph TD
    A[Bắt đầu phát triển Miniapp] --> B{Bạn đã có sẵn Source Code chưa?}
    B -- "Chưa có (Ý tưởng mới)" --> C[LUỒNG 1: IN-HUB CREATION]
    B -- "Đã có (Thư mục / Repo ngoài)" --> D[LUỒNG 2: EXTERNAL PORTING]
    
    C --> C1[Chạy CLI sinh Boilerplate chuẩn]
    C1 --> C2[Hiện thực Logic với Design Tokens]
    C2 --> C3[Nghiệm thu 4 Cổng Gates 1-4]

    D --> D1[Chạy Scanner phân tích Gap Analysis]
    D1 --> D2[Bảo tồn Core Logic + Áp dụng Adaptation Matrix]
    D2 --> D3[Bọc Hub Adapter Wrapper 1240px]
    D3 --> D4[Nghiệm thu 4 Cổng Gates 1-4]
```

### Dấu hiệu nhận diện Codebase Bên Ngoài (External Indicators):
- Chứa file cấu hình riêng: `package.json`, `vite.config.js`, `tsconfig.json`.
- Sử dụng router trang độc lập: `react-router-dom` (`<BrowserRouter>`, `Routes`, `useNavigate`).
- Lạm dụng class sáng tĩnh: `bg-white`, `text-slate-900`, `border-gray-200`.
- Sử dụng thư viện icon ngoài hoặc raw emoji: `react-icons`, `@heroicons`, `FontAwesome`, hoặc icon emoji `🚀`, `📁`.
- Gọi API máy chủ backend riêng: `axios.post('http://...')`, `fetch('/api/...')`.
- Lưu trữ localStorage không đặt namespace: `localStorage.getItem('userData')`.

---

## 🚀 3. LUỒNG 1: QUY TRÌNH TẠO MỚI TRỰC TIẾP TRONG HUB (IN-HUB CREATION)

Dành cho nhà phát triển hoặc AI Agent xây dựng công cụ mới toanh từ đầu.

### Bước 1: Khởi tạo khung sườn tự động qua CLI
Chạy lệnh khởi tạo miniapp:
```bash
# Chế độ hỏi đáp thân thiện (Interactive Prompt):
npm run create:miniapp

# Hoặc chế độ truyền tham số trực tiếp (Dành cho AI Agent / CI):
npm run create:miniapp -- --id=audio-cutter --name="Cắt Ghép Âm Thanh" --cat=utils
```

**CLI sẽ tự động thực hiện 100% các thao tác nền tảng:**
1. Tạo thư mục wrapper: `hub/src/tools/<id>/<ToolName>Tool.jsx` (đã có Header, Breadcrumb, Privacy note, `ToolErrorBoundary`).
2. Tạo component nghiệp vụ: `packages/core/src/components/<ToolName>View.jsx` (đã có nhịp điệu 3 tầng, Dropzone dual-contract, i18n dictionary, và token CSS chuẩn).
3. Đăng ký metadata 3 ngôn ngữ vào: `hub/src/config/toolsRegistry.js`.
4. Nối dây dynamic import vào: `hub/src/App.jsx`.
5. Tạo file test mẫu tại: `hub/tests/tools/<id>.test.js`.
6. Tự động chạy rà soát Gate 1, 2, 3 để đảm bảo đạt chuẩn ngay lập tức.

### Bước 2: Hiện thực Core View Logic
Mở file `packages/core/src/components/<ToolName>View.jsx` để lập trình chức năng:
- Tham chiếu các mẫu component JSX có sẵn trong [docs/DESIGN_SYSTEM_REFERENCE.md](file:///Users/tranhaibang/.gemini/antigravity-ide/scratch/ai-tools/docs/DESIGN_SYSTEM_REFERENCE.md).
- Nhận prop `displayLang` để hiển thị nhãn tiếng Việt (`vi`), tiếng Anh (`en`), tiếng Nhật (`ja`).
- Tích hợp xử lý tệp tin với cơ chế dọn dẹp bộ nhớ: luôn gọi `URL.revokeObjectURL` khi xong việc.

### Bước 3: Rà soát & Kiểm thử chất lượng
```bash
# 1. Rà soát tĩnh (Gates 1, 2, 3):
node scripts/audit-miniapp.mjs <id>

# 2. Kiểm thử hợp đồng CI/CD:
npm test

# 3. Kiểm thử trình duyệt thực tế & Responsive đa thiết bị (Gate 4):
npm run test:browser:tool -- <id>
```

---

## 🔄 4. LUỒNG 2: QUY TRÌNH TÍCH HỢP CODEBASE BÊN NGOÀI (EXTERNAL CODEBASE PORTING)

Dành cho trường hợp bạn có sẵn một app React/Vite/Next.js độc lập và muốn đưa vào làm một miniapp trong AI-Tools Hub.

> [!IMPORTANT]
> **NGUYÊN TẮC BẤT DI BẤT DỊCH**:
> 1. **Bảo tồn nguyên vẹn 100% logic thuật toán nghiệp vụ** của codebase ngoài.
> 2. **Chỉ chuyển đổi lớp vỏ giao diện (UI/UX Layer)** để đồng bộ với Hub: dùng CSS Tokens, layout 1240px, icon `lucide-react`, và loại bỏ lỗi tràn ngang trên mobile.

### Bước 1: Chạy công cụ Phân Tích Khoảng Cách Tích Hợp (Porting Gap Analyzer)
```bash
npm run port:miniapp -- --source=/duong-dan/toi/codebase-ngoai --id=ten-cong-cu
```
Tập lệnh sẽ quét toàn bộ source code bên ngoài và xuất ra **Báo Cáo Khoảng Cách Tích Hợp (Porting Gap Analysis Report)**:
- Danh sách các file vi phạm class cấm: `bg-white`, `text-black`, `border-gray-200`.
- Danh sách nút bấm đang sử dụng raw emoji.
- Cảnh báo nếu codebase đang dùng `react-router-dom` gây xung đột URL hash.
- Cảnh báo các lệnh gọi API mạng máy chủ `fetch`/`axios`.
- Danh sách key `localStorage` chưa có namespace.

### Bước 2: Chuyển đổi mã nguồn theo Bảng Đối Chiếu Quy Tắc (Adaptation Matrix)
Dựa vào báo cáo Gap Analysis, tiến hành chuyển đổi lớp giao diện (xem chi tiết tại Mục 5):
1. **Dời Router**: Nếu app ngoài có nhiều trang con, chuyển thành **Tab nội bộ** hoặc **Step Wizard** (`useState('step1')`).
2. **Thay thế CSS Tokens**:
   - `bg-white` / `bg-slate-50` ➔ `bg-surface-container`
   - `text-slate-900` / `text-black` ➔ `text-on-surface`
   - `text-slate-500` / `text-gray-400` ➔ `text-on-surface-variant`
   - `border-slate-200` ➔ `border-border-subtle`
3. **Thay thế Icon**: Chuyển các raw emoji hoặc icon ngoài sang `lucide-react`.
4. **Namespace Storage**: Thay `localStorage.setItem('key')` bằng `localStorage.setItem('ai_tools_<id>_key')`.

### Bước 3: Đặt Component vào Kiến Trúc 2 Tầng của Hub
- Đặt component chính đã refactor UI vào: `packages/core/src/components/<ToolName>View.jsx`.
- Tạo file wrapper tương ứng: `hub/src/tools/<id>/<ToolName>Tool.jsx` bọc trong `max-w-[1240px]` và `ToolErrorBoundary`.
- Khai báo metadata trong `hub/src/config/toolsRegistry.js` và nối dây trong `hub/src/App.jsx`.

### Bước 4: Chạy nghiệm thu 4 cổng
Chạy `npm run audit:miniapps <id>` và `npm run test:browser:tool -- <id>` để xác nhận không còn lỗi rò rỉ hay tràn giao diện.

---

## 📊 5. BẢNG ĐỐI CHIẾU QUY TẮC CHUYỂN ĐỔI (EXTERNAL-TO-HUB ADAPTATION MATRIX)

| Thành Phần Kỹ Thuật | Codebase Bên Ngoài (Legacy / External) | Chuẩn Hóa Theo AI-Tools Hub (MAIS Standard) | Hướng Dẫn Kỹ Thuật Chi Tiết |
|:---|:---|:---|:---|
| **Khung Bao Ngoài (Root)** | Chiếm toàn bộ `window`, có Header/Navbar/Footer riêng | Bọc trong container chuẩn `max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8` | Xóa bỏ Header/Navbar/Footer riêng của app ngoài; sử dụng Context Header chuẩn của Hub |
| **Màu Nền & Bề Mặt** | Hardcode `bg-white`, `bg-gray-100`, `#f8fafc` | Semantic tokens: `bg-surface-container`, `bg-surface-canvas`, `bg-surface-subtle` | Đảm bảo hiển thị hoàn hảo ở cả Light và Dark Mode mà không cần viết điều kiện thủ công |
| **Màu Chữ & Viền** | Hardcode `text-black`, `text-slate-900`, `border-gray-300` | Semantic tokens: `text-on-surface`, `text-on-surface-variant`, `border-border-subtle` | Chống lỗi "tàng hình chữ" khi người dùng bật Dark Mode |
| **Cơ Chế Điều Hướng** | Dùng `react-router-dom` (`<BrowserRouter>`, `<Routes>`, `/page2`) | Single-Page công cụ: Dùng **Tab nội bộ** hoặc **Step Wizard** | Router hash của Hub là `#/tools/<id>`; app con không được can thiệp vào URL toàn trang |
| **Gọi Dịch Vụ Máy Chủ** | Gọi backend riêng: `fetch('http://localhost:5000/api')` | Xử lý **100% Client-Side** trên trình duyệt (hoặc Cloudflare Worker proxy) | Miniapp phải chạy offline được ngay tại browser; không lưu dữ liệu người dùng ra ngoài |
| **Hệ Thống Biểu Tượng** | Raw emoji (`🚀`, `⚙️`) hoặc thư viện ngoài (`react-icons`, FA) | **100% thư viện `lucide-react`** | Đồng bộ phong cách nét vẽ (stroke 2px), cấm hoàn toàn raw emoji trong các nút bấm |
| **Bộ Nhớ Trình Duyệt** | Lưu trực tiếp `localStorage.setItem('settings', ...)` | Thêm tiền tố định danh: `localStorage.setItem('ai_tools_<id>_settings', ...)` | Chống ghi đè và xung đột key với 11+ miniapp khác trong cùng domain |
| **Nạp Tệp (File Input)** | Thẻ `<input type="file">` mặc định, chỉ bấm click | **Dual-Contract Dropzone**: Kéo thả chuột + `<input type="file" className="hidden">` | Mang lại trải nghiệm hiện đại; cho phép các test runner headless nạp tệp tự động |
| **Đa Ngôn Ngữ (i18n)** | Hardcode tiếng Anh hoặc tiếng Việt trong JSX | Nhận prop `displayLang`, dùng từ điển i18n (`vi`, `en`, `ja`) | Phục vụ người dùng quốc tế, đảm bảo metadata khai báo đầy đủ 3 ngôn ngữ |
| **Độ Tương Phản & Trợ Năng (A11y)** | Dùng chữ mờ `text-gray-400`, `text-slate-400`, hoặc chữ xanh lá nhạt `#059669` trên nền trắng/pastel | Sử dụng semantic tokens an toàn: `text-on-surface-variant` (`#475569`, 5.45:1), `text-secondary` (`#065F46`, 7.70:1 / 6.24:1 trên pastel) | Đạt chuẩn WCAG 2.1 Level AA ($\ge 4.5:1$ cho chữ nhỏ), 0 lỗi axe-core |
| **Trạng Thái Tương Tác & Vùng Cuộn Phím** | Nút icon không có chữ, thanh cuộn chỉ scroll bằng chuột | Bổ sung `aria-label` cho 100% nút icon; bọc container cuộn bằng `tabIndex={0} role="region" aria-label="..."` | Cho phép người dùng khiếm thị đọc được nhãn và người dùng bàn phím duyệt được danh sách cuộn |
| **Quản Trị Sự Cố** | Khi gặp lỗi code không bắt được, trắng cả trang web | Bọc trong [ToolErrorBoundary](file:///Users/tranhaibang/.gemini/antigravity-ide/scratch/ai-tools/hub/src/components/ToolErrorBoundary.jsx) | Đảm bảo nút "Về Trung Tâm" luôn hoạt động an toàn, không sập toàn bộ Hub |

---

## ⚠️ 6. CÁC BẪY KỸ THUẬT THƯỜNG GẶP & GIẢI PHÁP PHÒNG VỆ

### 6.1. Bẫy Tràn Ngang Màn Hình Mobile (Horizontal Overflow Trap)
- **Triệu chứng**: Trang web bị rung lắc, xuất hiện thanh cuộn ngang khi xem trên iPhone (390px) hoặc Android (360px).
- **Nguyên nhân**:
  - Phần tử flex child chứa chuỗi văn bản dài mà thiếu thuộc tính `min-w-0`.
  - Bảng dữ liệu nhiều cột không được bọc trong container có class `overflow-x-auto`.
  - Sidebar hoặc phần tử con sử dụng vị trí `absolute` với `w-full` nhưng thẻ cha thiếu `relative`.
- **Giải pháp**:
  ```jsx
  /* ĐÚNG */
  <div className="flex-1 min-w-0">
    <p className="truncate">Chuỗi văn bản rất dài không bao giờ làm tràn trang</p>
  </div>
  
  <div className="overflow-x-auto w-full">
    <table>...</table>
  </div>
  ```

### 6.2. Bẫy Tự Động Phóng To Trên iOS Safari (Font-Zoom Trap)
- **Triệu chứng**: Khi người dùng chạm vào ô `<input>` hoặc `<select>` trên iPhone, màn hình Safari tự động zoom to lên 120%, làm vỡ layout làm việc.
- **Nguyên nhân**: Cỡ chữ trên thẻ input nhỏ hơn `16px` (`font-size < 16px`).
- **Giải pháp**: Mọi input bắt buộc dùng class `text-base sm:text-sm` (16px trên mobile, co về 14px trên desktop):
  ```jsx
  <input type="text" className="text-base sm:text-sm ..." />
  ```

### 6.3. Bẫy Kích Thước Vùng Bấm Quá Nhỏ (Touch Target Violation)
- **Triệu chứng**: Người dùng bấm nhầm nút hoặc bấm trượt trên điện thoại.
- **Giải pháp**: Chiều cao nút bấm chính, tab, vùng tải tệp tối thiểu phải đạt `44px` (`h-11`) hoặc `40px` (`h-10`):
  ```jsx
  <button className="h-11 sm:h-10 px-4 rounded-xl ...">Thực Hiện</button>
  ```

### 6.4. Bẫy Rò Rỉ Bộ Nhớ RAM (Memory Leak Trap)
- **Triệu chứng**: Trình duyệt ngốn hàng GB RAM khi xử lý nhiều file ảnh/PDF liên tiếp.
- **Nguyên nhân**: Gọi `URL.createObjectURL(blob)` mà quên gọi `URL.revokeObjectURL(url)`.
- **Giải pháp**: Bắt buộc giải phóng URL trong hàm dọn dẹp của `useEffect` hoặc ngay sau khi tệp tải về thành công.

### 6.5. Bẫy Tương Phản Màu Chữ Nhỏ & Nền Pastel (Pastel Contrast Trap)
- **Triệu chứng**: Chữ xanh lá nhãn trạng thái ("Client-side", "Bảo mật", "Đạt"), chữ cảnh báo amber hoặc chữ báo lỗi red nhìn mờ nhạt, khó đọc trên màn hình ngoài trời hoặc bị công cụ kiểm tra tự động axe-core báo lỗi nghiêm trọng Serious P2 (`color-contrast`).
- **Nguyên nhân**:
  - Màu chữ xanh lá phổ biến như `#059669` (Emerald 600) có tỷ lệ tương phản chỉ 3.76:1 trên nền trắng.
  - Màu `#047857` (Emerald 700) tuy đạt 5.48:1 trên nền trắng nhưng khi đặt trên badge nền pastel `bg-secondary/15` (`#D9EBE6`) thì tỷ lệ bị kéo tụt xuống **4.43:1** (< 4.5:1, rớt chuẩn WCAG AA).
  - Màu cảnh báo `#d97706` (Amber 600) trên nền sáng chỉ đạt ~3.2:1.
  - Màu báo lỗi `#dc2626` (Red 600) trên nền card xám sáng `#ebedf2` chỉ đạt 4.12:1.
  - Tương tự, dùng class màu nhạt `text-slate-400` trên nền trắng chỉ đạt 2.59:1.
- **Giải pháp chuẩn hóa**:
  - Dùng token `text-secondary` (`#065F46` - Emerald 800) trong Light mode: Tỷ lệ đạt **7.70:1** trên trắng và **6.24:1** trên nền pastel `bg-secondary/15`.
  - Dùng token `text-tertiary` (`#92400e` - Amber 800) trong Light mode: Tỷ lệ đạt **5.80:1** trên trắng và **4.90:1** trên nền pastel `bg-tertiary-container/15`.
  - Dùng token `text-error` (`#b91c1c` - Red 700) trong Light mode: Tỷ lệ đạt **5.70:1** trên trắng và **5.10:1** trên nền card xám.
  - Thay thế toàn bộ class chữ xám nhạt `text-slate-400`, `text-gray-400` bằng `text-on-surface-variant` (`#475569`, 5.45:1) hoặc `text-outline` (`#475569`, 5.67:1).
  - Với nhãn chữ trắng trên nút nhấn: `bg-primary-container` trong Light mode bắt buộc là `#0369A1` (Sky 700, 5.96:1), không dùng `#0EA5E9` (Sky 500, 2.77:1).

### 6.6. Bẫy Trợ Năng Form Controls & Dynamic State A11y
- **Triệu chứng**: Trang ban đầu pass trợ năng nhưng khi người dùng tải tệp lên hoặc chuyển sang bước tinh chỉnh (Wizard step) thì axe-core báo lỗi vi phạm `[label]` hoặc `[select-name]`.
- **Nguyên nhân**:
  - Các phần tử input điều khiển chuyên biệt như `<input type="range">`, `<input type="color">`, `<input type="text">` (HEX code) chỉ đặt cạnh chữ mô tả bằng thẻ `<span>` mà không có gắn kết ngữ nghĩa bằng `<label htmlFor="...">` hoặc thuộc tính `aria-label`.
- **Giải pháp**:
  - Bắt buộc mọi input điều khiển thông số đều phải có thuộc tính `aria-label` diễn giải rõ ràng:
    ```jsx
    <input
      type="range"
      aria-label="Độ co viền khử lem"
      min="0"
      max="3"
      step="0.2"
      value={chokePx}
      onChange={(e) => setChokePx(Number(e.target.value))}
    />
    <input
      type="color"
      aria-label="Chọn màu phông tùy chỉnh"
      value={selectedBgColor}
      onChange={(e) => setSelectedBgColor(e.target.value)}
    />
    ```

### 6.7. Bẫy Trợ Năng Ở Trạng Thái Động (Dynamic State A11y Traps)
- **Triệu chứng**: Khi vừa tải trang, kiểm tra trợ năng đạt 100% xanh. Nhưng khi người dùng thao tác kéo thả file, mở Modal kết quả hoặc xuất hiện thanh Mini-Toolbar điều khiển thì axe-core báo lỗi vi phạm nút không có nhãn hoặc danh sách cuộn không thể điều hướng bằng bàn phím.
- **Nguyên nhân**:
  - Các nút icon đóng Modal (`X`), nút thu nhỏ/phóng to (`ZoomIn`/`ZoomOut`), nút chuyển trang (`ChevronLeft`/`ChevronRight`), nút xóa tệp (`Trash2`) không chứa ký tự văn bản trực quan bên trong thẻ `<button>`.
  - Danh sách tệp đã tải hoặc bảng kết quả có `overflow-y-auto` nhưng không có `tabIndex={0}` khiến người dùng chỉ dùng bàn phím không thể focus vào để cuộn.
- **Giải pháp chuẩn hóa**:
  ```jsx
  /* 1. Nút icon bắt buộc có aria-label */
  <button
    type="button"
    aria-label="Đóng cửa sổ xuất"
    onClick={() => setIsOpen(false)}
    className="..."
  >
    <X className="w-5 h-5" />
  </button>

  /* 2. Container cuộn nội bộ bắt buộc có tabIndex={0} và role="region" */
  <div
    tabIndex={0}
    role="region"
    aria-label="Danh sách tệp tin đã nạp"
    className="max-h-[300px] overflow-y-auto focus:outline-none focus:ring-1 focus:ring-primary/40 ..."
  >
    {files.map(...)}
  </div>
  ```

### 6.8. Bẫy Tương Phản Trạng Thái Active / Selected (The Tints Contrast Trap)
- **Triệu chứng**: Khi nút hoặc tab chưa được click, chữ hiển thị rõ ràng. Nhưng khi người dùng click chọn (Active state), màu chữ bị mờ nhạt hoặc công cụ kiểm định axe-core báo lỗi `color-contrast` nghiêm trọng trong luồng tương tác sâu.
- **Nguyên nhân**:
  - Dùng kiểu hiển thị mờ đục: `bg-primary-container/20 text-primary-container` hoặc `bg-secondary/15 text-secondary`.
  - Trong Dark Mode, màu nền đen giúp chữ 20% tint nhìn tương đối sáng. Nhưng ở Light Mode, chữ `#0369a1` đặt trên nền trắng pha 20% sky chỉ đạt tỷ lệ tương phản **4.22:1** (dưới ngưỡng 4.5:1 của WCAG AA).
- **Giải pháp**:
  - Khi Active/Selected, **luôn dùng màu nền đặc với chữ tương phản cao đối nghịch**:
    ```jsx
    /* ĐÚNG */
    className={isSelected
      ? 'bg-primary text-on-primary font-bold shadow-sm'
      : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container'}
    ```

---

## ✅ 7. CHECKLIST NGHIỆM THU ĐƯA VÀO VẬN HÀNH

Trước khi commit và đưa miniapp mới vào production, hãy đảm bảo vượt qua bảng kiểm tra:

- [ ] **Khung chứa:** Miniapp nằm gọn trong `max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8`.
- [ ] **Màu sắc:** 0 class `bg-white`, 0 class `text-black`, 100% dùng CSS semantic tokens.
- [ ] **Trợ năng WCAG 2.1 AA (Initial & Dynamic):** Tỷ lệ tương phản chữ $\ge 4.5:1$ (không dùng `text-*-400` hoặc chữ xanh/vàng sáng trên nền trắng/pastel), 100% form controls có `aria-label`, kiểm thử axe-core đạt 0 violations ở cả trạng thái ban đầu và trạng thái động sau khi nạp tệp.
- [ ] **Accessible Names:** 100% các nút bấm icon không có text đi kèm phải có thuộc tính `aria-label` diễn giải rõ ràng.
- [ ] **Keyboard Scrollable Regions:** 100% các vùng cuộn nội bộ (`overflow-y-auto`/`overflow-x-auto`) có `tabIndex={0} role="region" aria-label="..."`.
- [ ] **Safe Active States:** Trạng thái Active/Selected dùng `bg-primary text-on-primary` hoặc `bg-secondary text-on-secondary`, không dùng biến thể mờ 20% tint.
- [ ] **Biểu tượng:** 0 raw emoji trong các nút bấm, 100% dùng icon từ `lucide-react`.
- [ ] **Đa ngôn ngữ:** Nhận prop `displayLang`, khai báo đủ 3 thứ tiếng trong `toolsRegistry.js`.
- [ ] **Dropzone:** Có hỗ trợ kéo thả chuột và chứa thẻ `<input type="file" className="hidden" aria-label="...">`.
- [ ] **Mobile Responsive:** Đạt tiêu chuẩn Zero Horizontal Overflow trên iPhone (390px) và Android (360px) cả khi chưa nạp và sau khi nạp tệp dữ liệu.
- [ ] **Cô lập lỗi:** Được bọc trong `ToolErrorBoundary`.
- [ ] **Rà soát tĩnh:** Lệnh `npm run audit:miniapps <id>` đạt kết quả `PASS`.
- [ ] **Kiểm thử trình duyệt & Luồng sâu:** Lệnh `node scripts/verify-miniapp-browser.mjs --tool=<id> --flow` đạt 100% PASS (bao gồm cả Initial & Dynamic axe-core scan = 0 lỗi, 0 console errors).

---

## 🧪 8. HƯỚNG DẪN THIẾT KẾ & ĐĂNG KÝ KỊCH BẢN KIỂM THỬ LUỒNG SÂU (DEEP WORKFLOW TESTING)

Để miniapp của bạn được hệ thống kiểm thử tự động Gate 4 công nhận đạt chuẩn, hãy thiết kế tương tác theo 2 mô hình sau:

### 8.1. Cơ chế Tự Động Nhận Diện (Smart Auto-Discovery Flow)
Nếu miniapp của bạn tuân thủ đúng mẫu thiết kế chuẩn từ lệnh `npm run create:miniapp`:
1. Có vùng kéo thả Dual-Contract chứa `<input type="file" className="hidden" aria-label="...">`.
2. Có nút bấm thực thi với nội dung chứa chữ "Bắt đầu", "Xử lý", "Start", "Execute", hoặc "Chuyển đổi".

$\rightarrow$ Hệ thống `verify-miniapp-browser.mjs` sẽ **tự động nạp tệp fixture synthetic tương ứng (ảnh, PDF, Excel hoặc XML)**, tự động bấm nút xử lý, chờ chuyển bước, và thực hiện quét `axe-core` trạng thái động mà bạn không cần phải cấu hình bất cứ mã script nào!

### 8.2. Đăng Ký Kịch Bản Chuyên Sâu Tùy Biến (Custom Workflow Hook)
Với các miniapp có luồng làm việc phức tạp nhiều bước (như wizard 3 bước, vẽ canvas, xuất gói ZIP), bạn có thể bổ sung kịch bản trong `scripts/verify-miniapp-browser.mjs`:

```javascript
// Thêm case vào triggerDeepWorkflow() trong scripts/verify-miniapp-browser.mjs:
case 'my-custom-tool': {
  // 1. Nạp tệp mẫu synthetic
  const uploaded = await triggerFileUpload(page, FIXTURES.photo);
  if (uploaded) {
    console.log(`    ✔ Đã nạp ảnh vào My Custom Tool...`);
    await new Promise((r) => setTimeout(r, 1000));

    // 2. Mô phỏng người dùng tương tác: click nút cấu hình
    await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Tùy chỉnh'));
      if (btn) btn.click();
    });
    await new Promise((r) => setTimeout(r, 600));

    // 3. Chụp màn hình lưu vết
    await page.screenshot({ path: path.join(artifactsDir, 'gate4_my_custom_tool_flow.png') });
    fileWorkflowPassed = 'PASSED (Custom Workflow)';
  }
  break;
}
```

### 8.3. Lệnh Tự Kiểm Thử Cục Bộ Dành Cho Lập Trình Viên
Trước khi tạo Pull Request, luôn chạy lệnh sau trên máy phát triển:
```bash
# Kiểm thử toàn diện trình duyệt thật + luồng sâu + trợ năng động:
node scripts/verify-miniapp-browser.mjs --tool=<your-tool-id> --flow
```
Kết quả hiển thị cột `Trợ năng AA` đạt `✔ Init+Dyn` và kết luận `PASS 100%` là điều kiện bắt buộc để được merge vào hệ thống.



# 🏛️ QUY CHUẨN KỸ THUẬT TÍCH HỢP MINIAPP (MINIAPP ARCHITECTURE & INTEGRATION STANDARDS - MAIS)
**AI-Tools Master Hub (`ai-tools`)**  
*Tài liệu chuẩn mực kỹ thuật (Single Source of Truth) dành cho Nhà phát triển & AI Agents khi xây dựng, kiểm duyệt và tích hợp miniapp mới vào portal.*

---

## 📌 1. TỔNG QUAN & TRIẾT LÝ TÍCH HỢP

AI-Tools Master Hub được xây dựng theo triết lý **Modern Utility Workspace** — Không gian tiện ích công cộng, tập trung tuyệt đối vào tốc độ xử lý tác vụ, bảo mật riêng tư tại trình duyệt và trải nghiệm liền mạch:

> **"Tìm công cụ → Mở tức thì → Nạp tệp → Xử lý trên trình duyệt → Tải kết quả."**

Mọi miniapp được tích hợp vào Hub phải hoạt động như **một bộ phận gắn kết hữu cơ của một sản phẩm thống nhất**, không phải là các ứng dụng rời rạc chắp vá. Đồng thời, hệ thống phải đảm bảo **nguyên tắc cô lập lỗi tuyệt đối (Fault Isolation)**: Một miniapp gặp sự cố bất ngờ **không bao giờ** được phép làm sập thanh điều hướng, shell chính, hay ảnh hưởng đến bất kỳ miniapp nào khác.

---

## 🎨 2. TIÊU CHUẨN NGÔN NGỮ THIẾT KẾ & GIAO DIỆN (UI/UX STANDARDS)

Mọi miniapp tích hợp vào Hub bắt buộc tuân thủ 100% tài liệu kiến trúc giao diện [design.md](file:///Users/tranhaibang/.gemini/antigravity-ide/scratch/ai-tools/design.md).

### 2.1. Hệ Thống Design Tokens (CSS Variables SSOT)
Tuyệt đối không sử dụng mã màu tùy tiện. Toàn bộ màu sắc, nền và viền phải ánh xạ qua CSS Tokens:

| Vai trò ngữ nghĩa | CSS Token Variable | Tailwind Utility | Giá trị Dark Mode | Giá trị Light Mode |
|:---|:---|:---|:---|:---|
| **Nền Canvas Toàn Trang** | `--surface-canvas` | `bg-surface-canvas` | `#090D16` | `#F8FAFC` |
| **Thẻ & Khung Làm Việc** | `--surface-container` | `bg-surface-container` | `#171f33` | `#FFFFFF` |
| **Khung Nâng Cao / Dropdown** | `--surface-container-high`| `bg-surface-container-high`| `#222a3d` | `#F1F5F9` |
| **Nền Nút Phụ / Chip** | `--surface-subtle` | `bg-surface-subtle` | `#1E293B` | `#E2E8F0` |
| **Đường Viền Tinh Tế (1px)** | `--border-subtle` | `border-border-subtle` | `#334155` | `#CBD5E1` |
| **Màu Nhấn Chính (Primary)** | `--primary` | `text-primary`, `bg-primary` | `#89ceff` | `#0284C7` |
| **Khối Nút Bấm Chính** | `--primary-container` | `bg-primary-container` | `#0ea5e9` | `#0284C7` |
| **Bảo Mật / Khách Hàng (Client)**| `--secondary` | `text-secondary`, `bg-secondary`| `#4edea3` | `#059669` |
| **Cảnh Báo / Tham Khảo (Kế Toán)**| `--tertiary` | `text-tertiary` | `#ffb86e` | `#D97706` |
| **Báo Lỗi / Cảnh Báo Nguy Hiểm** | `--error` | `text-error`, `bg-error-container`| `#ffb4ab` | `#DC2626` |
| **Văn Bản Chính** | `--on-surface` | `text-on-surface` | `#dae2fd` | `#0F172A` |
| **Văn Bản Phụ / Gợi Ý** | `--on-surface-variant` | `text-on-surface-variant` | `#bec8d2` | `#475569` |
| **Nhãn Mờ / Monospace Note** | `--outline` | `text-outline` | `#88929b` | `#64748B` |

> [!CAUTION]
> **ĐIỀU CẤM KỶ LUẬT SỐ 1: CẤM HARDCODE MÀU SẮC LẠ HOẶC CLASS LIGHT-MODE TĨNH**
> Nghiêm cấm sử dụng các class tĩnh như: `bg-white`, `bg-slate-50`, `bg-gray-100`, `text-black`, `text-slate-900`, `border-slate-200`.  
> *Lý do*: Sẽ gây lỗi chói mắt ở Dark Mode, hoặc làm "tàng hình chữ" khi người dùng bật Light Mode. Mọi thành phần phải dùng token ngữ nghĩa (ví dụ: `bg-surface-container text-on-surface border border-border-subtle`).

### 2.2. Khung Bố Cục & Layout Container
- **Chiều rộng chuẩn**: Mọi màn hình miniapp phải nằm trọn trong giới hạn `max-w-[1240px] mx-auto`.
- **Padding chuẩn**: Responsive `px-4 sm:px-6 lg:px-8 py-6`.
- **Component Layout bắt buộc**: Miniapp phải sử dụng layout dùng chung từ `@ai-tools/core`:
  ```jsx
  import { StandardToolLayout, ToolHeader, SectionCard } from '@ai-tools/core';
  // Hoặc dùng MiniAppLayout, MiniAppPanel
  ```

### 2.3. Nhịp Điệu Bố Cục 3 Tầng (The 3-Tier Workspace Rhythm)
Mọi miniapp bắt buộc tuân theo cấu trúc 3 tầng:
1. **Tier 1 - Context Header**: 
   - Tên công cụ chuẩn xác, mô tả cô đọng trong 1-2 dòng.
   - Luôn kèm theo thông điệp bảo mật 1 dòng chuẩn:
     > *"Xử lý trực tiếp trên trình duyệt — tệp không được tải lên máy chủ."*
   - CẤM các hero banner marketing, cấm khẩu hiệu quảng bá chiếm diện tích.
2. **Tier 2 - Input & Parameter Setup (Above the fold)**:
   - Khu vực nhận tệp (DropZone) và bảng tham số cấu hình phải hiển thị ngay khi mở công cụ, người dùng không cần phải cuộn chuột xuống mới thấy chỗ bấm.
   - Hỗ trợ kéo-thả (Drag & Drop) mượt mà với hiệu ứng viền `border-primary-container`.
3. **Tier 3 - Result & Export Stage**:
   - Khung hiển thị kết quả, đối chiếu trước/sau, thanh tiến trình xử lý và nút tải về tệp tin (hỗ trợ xuất ZIP hàng loạt qua JSZip nếu có nhiều tệp).

### 2.4. Biểu Tượng & Phông Chữ (Iconography & Typography)
- **Phông chữ**:
  - Giao diện, tiêu đề, nút bấm: `Inter, system-ui, sans-serif`.
  - Thông số kỹ thuật, mã số, kích thước byte, hash, mã chứng từ: `JetBrains Mono, monospace`.
- **Biểu tượng (Iconography)**:
  - **100% sử dụng thư viện `lucide-react`**.
  - **TUYỆT ĐỐI CẤM SỬ DỤNG RAW EMOJI LÀM ICON NÚT BẤM HOẶC TRẠNG THÁI**.  
    *Sai*: `<button>🚀 Bắt đầu nén</button>`  
    *Đúng*: `<button><Rocket size={16} /> Bắt đầu nén</button>`

### 2.5. Đa Ngôn Ngữ (i18n Readiness)
Mọi miniapp phải hỗ trợ tối thiểu 3 ngôn ngữ: **Tiếng Việt (`vi`)**, **Tiếng Anh (`en`)**, và **Tiếng Nhật (`ja`)**:
- Nhận prop `displayLang` truyền từ `ToolContainer`.
- Tiêu đề và mô tả trong `toolsRegistry.js` phải có đủ: `name_vn`, `name_en`, `name_ja`, `desc_vn`, `desc_en`, `desc_ja`.
- Nội dung hướng dẫn hoặc nhãn nút trong miniapp phải thay đổi linh hoạt theo `displayLang`.

### 2.6. Tiêu Chuẩn Hiển Thị Đa Thiết Bị & Responsive (Desktop, Tablet, Mobile iOS & Android)
Mọi miniapp bắt buộc phải vượt qua kiểm thử hiển thị trên 4 cấu hình thiết bị:

| Thiết bị mô phỏng | Độ phân giải Viewport | Mục tiêu kiểm thử | Quy chuẩn kỹ thuật |
|:---|:---|:---|:---|
| **Desktop** | `1440 x 900 px` | Khung làm việc đầy đủ | Giới hạn tối đa `max-w-[1240px] mx-auto`, hiển thị 2-3 cột song song |
| **Tablet** | `768 x 1024 px` (iPad) | Co cụm cột thích ứng | Các panel đôi co giãn hợp lý, không bị chèn ép chữ |
| **Mobile iOS** | `390 x 844 px` (iPhone) | Safari ergonomics | Chống zoom input (`font-size >= 16px`), không tràn ngang (`scrollWidth <= clientWidth`), touch target >= 44px |
| **Mobile Android** | `360 x 800 px` (Galaxy/Pixel)| Màn hình hẹp | Layout xếp chồng 1 cột (`grid-cols-1`), thanh cuộn mượt mà, nút bấm to rõ |

#### Các quy tắc Responsive bất biến:
1. **Zero Horizontal Overflow (Cấm Tuyệt Đối Tràn Ngang)**:
   - Trên mọi màn hình từ 360px trở lên, miniapp **không bao giờ** được phép làm xuất hiện thanh cuộn ngang toàn trang (`document.documentElement.scrollWidth <= document.documentElement.clientWidth`).
   - Bảng biểu nhiều cột phải được bọc trong container `overflow-x-auto` cục bộ.
2. **Kích Thước Vùng Chạm (Touch Targets >= 44px)**:
   - Các nút bấm hành động chính, tab điều hướng, ô tải tệp trên mobile phải có kích thước tối thiểu `44x44px` (cho phép `40px` với các chip tag phụ) nhằm đảm bảo trải nghiệm chạm ngón tay không bị bấm nhầm.
3. **Chống Tự Động Phóng To Trên iOS Safari**:
   - Mọi phần tử `<input>`, `<select>`, `<textarea>` bắt buộc có font-size tối thiểu `16px` trên mobile (sử dụng class Tailwind `text-base sm:text-sm`). Font nhỏ hơn 16px sẽ khiến iOS Safari tự động zoom màn hình, làm vỡ khung hiển thị.
4. **Bố Cục Tự Động Xếp Chồng (Adaptive Stacking)**:
   - Các bố cục dạng lưới 2-3 cột trên Desktop (`grid-cols-2`, `grid-cols-12`) bắt buộc phải dùng tiền tố responsive (ví dụ: `grid grid-cols-1 lg:grid-cols-12`) để tự động chuyển thành 1 cột dọc trên màn hình hẹp.

---

## 🛡️ 3. TIÊU CHUẨN ĐỘ ỔN ĐỊNH & CÁCH LY SỰ CỐ (FAULT ISOLATION & STABILITY)

Miniapp hoạt động trong môi trường chia sẻ của Portal, do đó phải tuân thủ nghiêm ngặt các ranh giới an toàn:

### 3.1. Danh Mục Tài Nguyên Dùng Chung (`@ai-tools/core`)
Để tránh phình to kích thước bundle và tái phát minh bánh xe, miniapp PHẢI ưu tiên tái sử dụng tài nguyên chuẩn từ `@ai-tools/core`:
- **UI Components**: `StandardToolLayout`, `MiniAppLayout`, `ToolHeader`, `SectionCard`, `FileUploader`, `ResultCard`, `MiniAppError`.
- **Theme System**: `useTheme`, `THEMES`, `applyTheme`.
- **Storage Service**: `useLocalStorage`, `storage` (tự động namespace an toàn).
- **File Validation**: `verifyDocumentSignature` (kiểm tra magic bytes thật của PNG, PDF, DOCX, ZIP chống đổi đuôi file giả mạo).
- **Number & Date Utilities**: `parseLocalizedNumber`, `formatCurrencyVND`.

### 3.2. Quy Tắc Cách Ly CSS & Tránh Ô Nhiễm Global
- **CẤM VIẾT CSS SELECTOR TOÀN CỤC**: Tuyệt đối không viết CSS selector tác động lên các thẻ HTML chung như `body { ... }`, `html { ... }`, `h1 { ... }`, `button { ... }`, `input { ... }`.
- Mọi CSS tùy biến phải được scoped chặt chẽ qua CSS Modules, tiền tố class riêng biệt của miniapp, hoặc 100% sử dụng Tailwind CSS utilities.

### 3.3. Quy Tắc Cách Ly Dữ Liệu Lưu Trữ (Storage Namespacing)
- **CẤM SỬ DỤNG KEY TỰ DO TRONG LOCALSTORAGE**:
  - *Sai*: `localStorage.setItem('settings', ...)` hoặc `localStorage.setItem('history', ...)`
  - *Đúng*: Sử dụng `storage.get/set('<tool-id>', ...)` từ `@ai-tools/core`, hoặc tự đặt key có tiền tố: `localStorage.setItem('ai_tools_<tool_id>_settings', ...)`
- Điều này bảo đảm không bao giờ xảy ra tình trạng miniapp A ghi đè cấu hình của miniapp B hoặc của Master Hub.

### 3.4. Quản Lý Vòng Đời & Chống Rò Rỉ Bộ Nhớ (Zero Memory Leak)
Miniapp xử lý nhiều tệp tin đa phương tiện (ảnh dung lượng lớn, tài liệu nhiều trang) nên phải quản lý bộ nhớ triệt để:
1. **Thu hồi Object URLs**:
   Mọi `const url = URL.createObjectURL(blob)` PHẢI được thu hồi bằng `URL.revokeObjectURL(url)` khi người dùng xóa ảnh, khi nạp ảnh mới hoặc trong cleanup return của `useEffect`.
2. **Dọn dẹp Event Listeners & Timers**:
   Mọi `window.addEventListener`, `setInterval`, `setTimeout` phải được `removeEventListener` và `clearInterval/clearTimeout` trong cleanup function của `useEffect`.
3. **Web Worker Termination**:
   Nếu miniapp tạo Web Worker (cho Wasm hoặc parser nặng), worker phải được gọi `worker.terminate()` khi component unmount.

### 3.5. Cơ Chế Cô Lập Sự Cố (ToolErrorBoundary Sandbox)
- Tầng miniapp được bọc trực tiếp bởi `<ToolErrorBoundary>` trong `hub/src/App.jsx`.
- **Nguyên tắc hoạt động**:
  - Khi một lỗi không lường trước (Unhandled JavaScript Exception / Crash) xảy ra bên trong miniapp, `ToolErrorBoundary` sẽ chặn đứng lỗi không cho lan truyền ra toàn bộ Portal.
  - Người dùng sẽ nhìn thấy card thông báo cách ly thân thiện:
    > *"Công cụ vừa gặp sự cố. Sự cố này đã được cách ly an toàn. Các công cụ khác trên Hub vẫn hoạt động 100% bình thường."*
  - Cung cấp sẵn nút **"Thử lại công cụ"** và **"Về Trang Chủ"**.
  - Người dùng bấm "Về Trang Chủ" sẽ trở lại danh mục khám phá bình thường mà không bị màn hình trắng (White Screen of Death).

### 3.6. Xử Lý Tác Vụ Nặng Ngoài Luồng (Non-blocking Async Processing)
- Các tác vụ nén file, xử lý AI segmentation, parse bảng tính Excel lớn, hoặc render PDF nhiều trang phải được xử lý bất đồng bộ (async slicing với `requestAnimationFrame` / `setTimeout(..., 0)`) hoặc chuyển sang Web Worker.
- Tuyệt đối không để xảy ra hiện tượng đóng băng trình duyệt (UI freeze) quá 300ms.

### 3.7. Tiêu Chuẩn Tương Tác Kéo Thả & Luồng Xử Lý Tệp (Drag & Drop & File Workflow)
Các miniapp tiếp nhận tệp tin từ người dùng phải đảm bảo hợp đồng tương tác sau:
1. **Hỗ Trợ Kép (Dual Input Contract)**:
   - Vùng DropZone kéo thả bắt buộc phải có phần tử `<input type="file" className="hidden">` tương ứng bên trong.
   - Khi người dùng click vào DropZone, phải kích hoạt mở hộp thoại chọn tệp của hệ thống.
   - Khi chạy kiểm thử tự động, test runner có thể gắn file trực tiếp vào input này để giả lập kéo thả mà không cần can thiệp OS.
2. **Hiệu Ứng Thị Giác Kéo Thả (Drag States)**:
   - `onDragOver` / `onDragEnter`: Viền chuyển sang `border-primary-container` với nền sáng nhẹ `bg-primary-container/10`.
   - `onDrop`: Reset lại viền mặc định và lập tức hiển thị chỉ báo trạng thái nạp tệp (loading spinner hoặc tiến trình).
3. **Xác Thực Chữ Ký Tệp (Magic Bytes)**:
   - Tuyệt đối không chỉ tin tưởng phần mở rộng (file extension). Bắt buộc gọi hàm `verifyDocumentSignature(file)` từ `@ai-tools/core` để phát hiện tệp giả mạo trước khi nạp vào bộ nhớ.
4. **Thu Hồi Tệp Cũ Khi Nạp Mới**:
   - Khi người dùng thả một tệp mới đè lên tệp cũ, phải tự động thu hồi Object URL và giải phóng bộ đệm của tệp cũ trước khi khởi tạo tệp mới.

---

## 🚦 4. QUY TRÌNH KIỂM DUYỆT 4 CỔNG (4-GATE VERIFICATION PIPELINE)

Trước khi một miniapp được chuyển từ trạng thái `in-development` sang `beta` và phát hành trên production, miniapp bắt buộc phải vượt qua 4 cổng kiểm duyệt:

```
[Miniapp Code] 
      ↓
[Gate 1: Contract & Architecture Audit]
      ↓ (Pass)
[Gate 2: Static Token & UI Linter]
      ↓ (Pass)
[Gate 3: Stability & Memory Leak Audit]
      ↓ (Pass)
[Gate 4: Automated Real-Browser Testing (Headless Chrome)]
      ↓ (Pass 100%)
[Phê Duyệt Tích Hợp Chính Thức]
```

### 🔴 CỔNG 1: CONTRACT & REGISTRY AUDIT (KIẾN TRÚC & ĐĂNG KÝ)
- [ ] **Khai báo Registry đầy đủ**: File `hub/src/config/toolsRegistry.js` phải có object định nghĩa hoàn chỉnh với các trường:
  - `id`: Định danh duy nhất viết thường phân tách bằng dấu gạch ngang (kebab-case).
  - `name_vn`, `name_en`, `name_ja`: Tên công cụ chuẩn mực 3 ngôn ngữ.
  - `desc_vn`, `desc_en`, `desc_ja`: Mô tả ngắn gọn súc tích 3 ngôn ngữ.
  - `category`: Thuộc một trong các danh mục chuẩn (`pdf`, `image`, `office`, `utils`, `ai`).
  - `icon`: Tên icon hợp lệ từ `lucide-react`.
  - `gradient`, `color`, `badge`, `tags`: Khai báo màu nhấn và từ khóa tìm kiếm.
  - `readiness`: Gắn trạng thái chuẩn (`experimental`, `beta`, hoặc `in-development`).
  - `processing`: `browser` (khuyến nghị 100%), `hybrid`, hoặc `backend-antigravity`.
  - `outputPurpose`: `utility` hoặc `reference`.
- [ ] **Cấu trúc thư mục khớp 1-1**:
  - Miniapp hoạt động phải có thư mục wrapper: `hub/src/tools/<id>/<Component>Tool.jsx`.
  - Miniapp tạm dừng phải nằm ở: `hub/src/tools-in-development/<id>/`.
- [ ] **Wiring trong `App.jsx`**:
  - Phải có khai báo `React.lazy(() => import('./tools/<id>/...'))`.
  - Phải đăng ký vào `toolComponentMap`.
- [ ] **Khai báo thư viện phụ thuộc (No Undeclared Dependencies)**:
  - Mọi thư viện `import` phải được khai báo trong `dependencies` của package tương ứng. Cấm dựa vào hoisting ngầm của npm.

### 🟡 CỔNG 2: STATIC TOKEN & UI LINTER (RÀ SOÁT TĨNH GIAO DIỆN)
- [ ] **Quét sạch Class Light-Mode tĩnh**:
  - Không có `bg-white`, `bg-slate-50`, `bg-gray-100`, `text-black`, `text-slate-900`.
- [ ] **Kiểm tra Iconography**:
  - Không có ký tự emoji thô (`🚀`, `💡`, `❌`, `🔥`) được render làm icon thao tác.
- [ ] **Kiểm tra Layout Container**:
  - Mã nguồn phải sử dụng `StandardToolLayout`, `MiniAppLayout`, hoặc khung giới hạn `max-w-[1240px]`.
- [ ] **Kiểm tra prop `displayLang`**:
  - Component nhận và truyền prop `displayLang`.

### 🟢 CỔNG 3: STABILITY & MEMORY AUDIT (ĐỘ ỔN ĐỊNH & BỘ NHỚ)
- [ ] **Kiểm tra thu hồi Object URL**:
  - Quét thấy `URL.createObjectURL` thì phải có `URL.revokeObjectURL` tương ứng.
- [ ] **Kiểm tra Namespace Storage**:
  - Không gọi `localStorage.setItem` với key không có tiền tố `ai_tools_<id>_`.
- [ ] **Kiểm tra Cleanup Event Listeners**:
  - `addEventListener` trên window/document phải có hàm hủy trong `useEffect`.

### 🔵 CỔNG 4: AUTOMATED REAL-BROWSER TESTING (KIỂM THỬ TRÌNH DUYỆT THẬT)
Được tự động hóa qua script: `npm run test:browser -- --tool=<tool-id>` hoặc `npm run test:browser`.
- [ ] **Render thành công**: Mở route `#/tools/<tool-id>` nạp xong trong vòng < 2.0s.
- [ ] **Zero Console Errors**: 0 lỗi `console.error`, 0 ngoại lệ `pageerror`.
- [ ] **Kiểm chứng Style Thực Tế (Computed Style)**:
  - Màu nền canvas chuẩn `--surface-canvas` (`#090D16` ở Dark Mode).
  - Thẻ làm việc có viền `--border-subtle` (`#334155`) và nền `--surface-container` (`#171f33`).
  - Chiều rộng không tràn khung (`clientWidth <= 1240px`).
- [ ] **Kiểm chứng Chuyển Theme (Dark ↔ Light)**:
  - Khi bật Light Mode: Nền chuyển sang sáng chuẩn (`#F8FAFC`), chữ tối rõ nét, độ tương phản đạt chuẩn WCAG.
  - Khi bật Dark Mode: Giao diện tối sâu đồng bộ.
- [ ] **Kiểm chứng Đổi Ngôn Ngữ (VI ↔ EN ↔ JA)**:
  - Chuyển ngôn ngữ trên Navbar lập tức cập nhật tiêu đề miniapp tương ứng mà không cần reload trang.
- [ ] **Kiểm chứng Cơ Chế Cách Ly Sự Cố (Fault Isolation)**:
  - Kích hoạt thử nghiệm lỗi mô phỏng → Card `ToolErrorBoundary` hiển thị thông báo an toàn, bấm "Về Trang Chủ" đưa người dùng về Dashboard hoàn hảo.

---

## 🛠️ 5. BỘ LỆNH VẬN HÀNH DÀNH CHO LẬP TRÌNH VIÊN

Dự án đã tích hợp sẵn các lệnh CLI để lập trình viên tự kiểm duyệt nhanh:

```bash
# 1. Rà soát tĩnh toàn bộ các miniapp theo Gate 1, 2, 3
npm run audit:miniapps

# 2. Rà soát tĩnh một miniapp cụ thể
node scripts/audit-miniapp.mjs <tool-id>

# 3. Chạy kiểm thử tự động trên trình duyệt thật (Gate 4) cho toàn bộ 12 miniapps
npm run test:browser

# 4. Chạy kiểm thử trình duyệt cho riêng một miniapp đang phát triển
npm run test:browser:tool -- id-photo-studio

# 5. Chạy toàn bộ unit test & contract tests của dự án
npm test
```

---

## 📋 6. BẢNG KIỂM TRA NHANH TRƯỚC KHI YÊU CẦU DUYỆT (PRE-PR CHECKLIST)

| Hạng mục kiểm tra | Đạt chuẩn | Ghi chú |
|---|:---:|---|
| Đã khai báo đầy đủ 3 ngôn ngữ trong `toolsRegistry.js` | [ ] | VN, EN, JA |
| Đã bọc trong `StandardToolLayout` hoặc `MiniAppLayout` | [ ] | Max 1240px |
| 100% sử dụng CSS semantic tokens (không có `bg-white`, `text-black`) | [ ] | Tương thích cả Dark/Light |
| 100% dùng `lucide-react` (không có emoji làm icon) | [ ] | Đảm bảo tính chuyên nghiệp |
| Mọi Blob URL đều có `URL.revokeObjectURL` | [ ] | Chống rò rỉ RAM |
| LocalStorage có prefix `ai_tools_<id>_` | [ ] | Không đè dữ liệu miniapp khác |
| Chạy `npm run audit:miniapps` trả về 0 lỗi | [ ] | Đạt Gate 1, 2, 3 |
| Chạy `npm run test:browser` trả về 0 lỗi console | [ ] | Đạt Gate 4 |
| Chạy `npm test` 100% xanh | [ ] | Toàn vẹn hệ thống |

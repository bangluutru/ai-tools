# 🏛️ QUY CHUẨN KỸ THUẬT TÍCH HỢP MINIAPP (MINIAPP ARCHITECTURE & INTEGRATION STANDARDS - MAIS)
**AI-Tools Master Hub (`ai-tools`)**  
*Tài liệu chuẩn mực kỹ thuật (Single Source of Truth) dành cho Nhà phát triển & AI Agents khi xây dựng, kiểm duyệt và tích hợp miniapp mới vào portal.*

---

## 📌 1. TỔNG QUAN & TRIẾT LÝ TÍCH HỢP

AI-Tools Master Hub được xây dựng theo triết lý **Modern Utility Workspace** — Không gian tiện ích công cộng, tập trung tuyệt đối vào tốc độ xử lý tác vụ, bảo mật riêng tư tại trình duyệt và trải nghiệm liền mạch:

> **"Tìm công cụ → Mở tức thì → Nạp tệp → Xử lý trên trình duyệt → Tải kết quả."**

Mọi miniapp được tích hợp vào Hub phải hoạt động như **một bộ phận gắn kết hữu cơ của một sản phẩm thống nhất**, không phải là các ứng dụng rời rạc chắp vá. Đồng thời, hệ thống phải đảm bảo **nguyên tắc cô lập lỗi tuyệt đối (Fault Isolation)**: Một miniapp gặp sự cố bất ngờ **không bao giờ** được phép làm sập thanh điều hướng, shell chính, hay ảnh hưởng đến bất kỳ miniapp nào khác.

### 📚 TÀI LIỆU HƯỚNG DẪN & THAM CHIẾU LIÊN QUAN
- **Cẩm Nang Phát Triển & Chuyển Đổi (In-Hub vs External Porting):** [docs/MINIAPP_DEV_GUIDE.md](file:///Users/tranhaibang/.gemini/antigravity-ide/scratch/ai-tools/docs/MINIAPP_DEV_GUIDE.md)
- **Bảng Tham Chiếu Thiết Kế & Kho Mẫu Component (Pattern Book):** [docs/DESIGN_SYSTEM_REFERENCE.md](file:///Users/tranhaibang/.gemini/antigravity-ide/scratch/ai-tools/docs/DESIGN_SYSTEM_REFERENCE.md)
- **Công Cụ Tự Động Hóa Sinh Mã & Quét Khoảng Cách (CLI):** `npm run create:miniapp` và `npm run port:miniapp`

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
| **Màu Nhấn Chính (Primary)** | `--primary` | `text-primary`, `bg-primary` | `#89ceff` | `#0369A1` |
| **Khối Nút Bấm Chính** | `--primary-container` | `bg-primary-container` | `#0ea5e9` | `#0369A1` |
| **Bảo Mật / Khách Hàng (Client)**| `--secondary` | `text-secondary`, `bg-secondary`| `#4edea3` | `#065F46` (Đạt >= 4.5:1 trên pastel/trắng) |
| **Cảnh Báo / Tham Khảo (Kế Toán)**| `--tertiary` | `text-tertiary` | `#ffb86e` | `#92400e` (Amber-800, đạt >= 4.5:1 trên pastel/trắng) |
| **Báo Lỗi / Cảnh Báo Nguy Hiểm** | `--error` | `text-error`, `bg-error-container`| `#ffb4ab` | `#B91C1C` (Red-700, đạt >= 4.5:1 trên xám/trắng) |
| **Văn Bản Chính** | `--on-surface` | `text-on-surface` | `#dae2fd` | `#0F172A` |
| **Văn Bản Phụ / Gợi Ý** | `--on-surface-variant` | `text-on-surface-variant` | `#bec8d2` | `#475569` |
| **Nhãn Mờ / Monospace Note** | `--outline` | `text-outline` | `#88929b` | `#475569` |

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

### 2.7. Tiêu Chuẩn Trợ Năng WCAG 2.1 Level A & AA (Accessibility & Color Contrast)
Mọi miniapp và thành phần trên Hub bắt buộc phải đáp ứng 100% tiêu chuẩn trợ năng quốc tế **WCAG 2.1 Level A và Level AA**. Việc này đảm bảo người dùng suy giảm thị lực, người lớn tuổi hoặc người làm việc trong môi trường ánh sáng mạnh đều đọc được nội dung rõ ràng, sắc nét.

#### 1. Quy chuẩn tỷ lệ tương phản màu sắc (Contrast Ratio Thresholds):
- **Văn bản thông thường / Văn bản kích thước nhỏ (< 18pt / 24px thường, hoặc < 14pt / 18.5px đậm)**:
  - Tỷ lệ tương phản tối thiểu bắt buộc: **$\ge 4.5:1$**.
  - Áp dụng cho toàn bộ: nhãn badge, văn bản thẻ, ghi chú phụ, mã số, nhãn trạng thái (10px - 14px).
- **Văn bản lớn ($\ge 18pt / 24px$ thường, hoặc $\ge 14pt / 18.5px$ đậm)**:
  - Tỷ lệ tương phản tối thiểu: **$\ge 3.0:1$**.
- **Thành phần tương tác & Đồ họa (UI Components, Form Inputs, Borders, Icons)**:
  - Tỷ lệ tương phản viền, placeholder trạng thái kích hoạt tối thiểu: **$\ge 3.0:1$** so với nền lân cận.

#### 2. Công thức đo lường chuẩn toán học (W3C Relative Luminance):
Độ sáng tương đối ($L$) tính từ giá trị sRGB chuẩn hóa ($R, G, B \in [0, 1]$):
$$C_{\text{linear}} = \begin{cases} \frac{C}{12.92} & \text{nếu } C \le 0.04045 \\ \left(\frac{C + 0.055}{1.055}\right)^{2.4} & \text{nếu } C > 0.04045 \end{cases}$$
$$L = 0.2126 \times R_{\text{linear}} + 0.7152 \times G_{\text{linear}} + 0.0722 \times B_{\text{linear}}$$
Tỷ lệ tương phản giữa màu chữ ($L_1$) và màu nền ($L_2$) (với $L_1$ sáng hơn $L_2$):
$$\text{Contrast Ratio} = \frac{L_1 + 0.05}{L_2 + 0.05}$$

#### 3. Ma Trận Phối Màu An Toàn (Safe Color Pairing Matrix):
Mọi miniapp bắt buộc tham chiếu ma trận phối màu đã được chứng minh toán học và kiểm định qua axe-core:

| Thành phần UI | Màu chữ (Token / Hex) | Nền hiển thị (Token / Hex) | Tỷ lệ tương phản đo đạc | Kết luận WCAG 2.1 AA |
|:---|:---|:---|:---:|:---:|
| **Nhãn Trạng Thái Client (Badge)** | `text-secondary` (`#065F46` - Emerald 800) | Nền trắng `#FFFFFF` | **7.70:1** | **PASS** ($\ge 4.5:1$) |
| **Nhãn Trạng Thái Pastel** | `text-secondary` (`#065F46` - Emerald 800) | Pastel `bg-secondary/15` (`#D9EBE6`) | **6.24:1** | **PASS** ($\ge 4.5:1$) |
| **Nút / Badge Primary Container** | `text-on-primary-container` (`#FFFFFF`) | `bg-primary-container` (`#0369A1` - Sky 700) | **5.96:1** | **PASS** ($\ge 4.5:1$) |
| **Văn Bản Chính (Light Mode)** | `text-on-surface` (`#0F172A` - Slate 900) | `bg-surface-canvas` (`#F8FAFC`) | **16.14:1** | **PASS** ($\ge 4.5:1$) |
| **Văn Bản Phụ / Gợi Ý (Light)** | `text-on-surface-variant` (`#475569` - Slate 600) | `bg-surface-canvas` (`#F8FAFC`) | **5.45:1** | **PASS** ($\ge 4.5:1$) |
| **Ghi Chú Kỹ Thuật (Outline Note)** | `text-outline` (`#475569` - Slate 600) | Nền trắng `#FFFFFF` | **5.67:1** | **PASS** ($\ge 4.5:1$) |
| **Badge Báo Lỗi / Cảnh Báo** | `text-error` (`#DC2626` - Red 600) | Pastel `bg-error-container` (`#FEE2E2`) | **4.68:1** | **PASS** ($\ge 4.5:1$) |
| **Badge Kế Toán / Cảnh Báo Vàng** | `text-tertiary` (`#B45309` - Amber 700) | Pastel `bg-tertiary/15` (`#FEF3C7`) | **4.72:1** | **PASS** ($\ge 4.5:1$) |

> [!CAUTION]
> **BẪY TƯƠNG PHẢN NỀN PASTEL (PASTEL CONTRAST TRAP)**:
> Mã màu `#047857` (emerald-700) đạt 5.48:1 trên nền trắng tinh `#FFFFFF`, nhưng khi đặt trên nền pastel `bg-secondary/15` (`#D9EBE6`), nền bị nâng Luminance lên dẫn đến tỷ lệ tương phản rớt xuống **4.43:1** (< 4.5:1 — VI PHẠM WCAG AA). Vì vậy, màu chữ xanh lá trong Light Mode **bắt buộc phải là `#065F46` (Emerald 800)**.

#### 4. Danh Mục Anti-Patterns Bị Cấm Tuyệt Đối (The A11y Anti-patterns):
1. **CẤM DÙNG TEXT MÀU NHẠT TRÊN NỀN SÁNG**: Nghiêm cấm dùng các class `text-slate-400`, `text-gray-400`, `text-zinc-400`, `text-neutral-400` cho bất kỳ văn bản nào trong Light Mode (tương phản chỉ ~2.5:1, vi phạm nghiêm trọng).
2. **CẤM DÙNG MÀU CHỮ THƯƠNG HIỆU QUÁ SÁNG LÀM CHỮ TRÊN NỀN TRẮNG**: Không dùng `#0ea5e9` (Sky 500, tương phản 2.77:1) hoặc `#10b981` (Emerald 500, tương phản 2.21:1) làm màu chữ trên nền trắng.
3. **CẤM THU NHỎ CỠ CHỮ DƯỚI 11PX CHO NỘI DUNG QUAN TRỌNG**: Cỡ chữ `10px` chỉ được phép dùng cho mã hash hoặc watermark không bắt buộc; toàn bộ nhãn chức năng phải từ `11px` (`text-[11px] font-semibold`) trở lên kèm màu tương phản cao.
4. **CẤM TRẠNG THÁI FOCUS VÔ HÌNH (NO OUTLINE FOCUS)**: Mọi nút bấm, thẻ tương tác và input phải có trạng thái `:focus-visible` với viền `ring-2 ring-primary ring-offset-2`.
5. **CẤM DÙNG TINTS MỜ CHO TRẠNG THÁI ACTIVE / SELECTED (THE TINTS CONTRAST TRAP)**: Tuyệt đối không dùng `bg-primary-container/20 text-primary-container` hoặc `bg-secondary/15 text-secondary` cho các nút bấm hành động hoặc tab đang được chọn trong Light Mode (độ tương phản chỉ đạt 4.22:1, vi phạm WCAG AA). Bắt buộc dùng `bg-primary text-on-primary` hoặc `bg-secondary text-on-secondary`.

#### 5. Tiêu Chuẩn Trợ Năng Động & Bàn Phím (Dynamic State Accessibility & Keyboard Navigation):
1. **Accessible Names trên Interactive Controls**: 100% nút icon không có nhãn chữ đi kèm (thu nhỏ/phóng to `ZoomIn`/`ZoomOut`, phân trang `ChevronLeft`/`ChevronRight`, bật tắt lưới/tương phản `Grid`/`Contrast`, xóa tệp `Trash2`, đóng modal `X`, tải tệp, sao chép) bắt buộc phải có thuộc tính `aria-label="..."`.
2. **Keyboard Accessible Scrollable Regions**: Mọi vùng nội dung có thanh cuộn nội bộ (`overflow-y-auto`, `overflow-x-auto` như hàng đợi tệp tin, danh sách kết quả, bảng tính dữ liệu, khối mã lệnh) bắt buộc phải có:
   - `tabIndex={0}` để người dùng duyệt bằng bàn phím (Tab) có thể focus vào container.
   - `role="region"` để trình đọc màn hình (Screen Reader) nhận diện được phân vùng.
   - `aria-label="..."` mô tả ngắn gọn nội dung của vùng cuộn (ví dụ: `aria-label="Danh sách tệp đã tải lên"`).
3. **Bảo Toàn Nhãn Ngữ Nghĩa Cho Form Controls Động**: Các thanh trượt tham số `<input type="range">`, ô chọn màu `<input type="color">`, ô nhập mã HEX xuất hiện ở các bước nâng cao bắt buộc phải có `aria-label` hoặc thẻ `<label htmlFor="...">` tương ứng.
4. **Cơ Chế Khóa Tiêu Điểm (Focus Trap) Trong Modal**: Mọi hộp thoại Modal / Drawer khi mở ra phải tự động focus vào nút đóng hoặc nút hành động đầu tiên, và ngăn focus thoát ra ngoài phần tử nền khi Modal đang kích hoạt.

### 2.8. Tiêu Chuẩn Thanh Điều Hướng Miniapp (Tool Navigation Bar Contract)
Nhằm mang lại trải nghiệm tiện ích nhất quán, người dùng khi chuyển đổi giữa bất kỳ công cụ nào trong Hub đều được phục vụ bởi một **Thanh điều hướng công cụ cấp cao duy nhất (Top Tool Navigation Bar)** được quản lý tập trung tại `hub/src/components/ToolContainer.jsx`.

#### 1. Cấu trúc thanh điều hướng chuẩn:
- **Kích thước & Trạng thái**: Chiều cao chuẩn cố định `h-16` (64px), cố định trên cùng (`sticky top-0 z-50`), hiệu ứng kính mờ `backdrop-blur-xl bg-surface-canvas/95` và viền dưới `border-b border-border-subtle`.
- **Khung chứa**: Giới hạn tối đa `max-w-[1240px] mx-auto px-3 sm:px-6 lg:px-8`.
- **Cụm bên trái (Left Cluster)**:
  1. **Brand Logo (`AI-Tools HUB`)**: Biểu tượng Sparkles, click để trở về trang chủ Hub.
  2. **Đường phân cách mảnh (Vertical Divider)**: `h-5 w-px bg-border-subtle`.
  3. **Nút Quay Về Trung Tâm (`Về Trung Tâm` / `Back to Hub` / `ハブに戻る`)**: Icon `ArrowLeft`, kích hoạt callback `onBackToHub`.
  4. **Bộ Chuyển Nhanh Công Cụ (`Quick Tool Switcher Dropdown`)**:
     - Hiển thị chấm tròn màu thương hiệu của công cụ hiện tại (`currentTool.color`), tên công cụ rút gọn và icon mũi tên `ChevronDown`.
     - Nhấp chuột mở popup danh sách các miniapp khả dụng (kèm checkmark cho công cụ hiện tại), cho phép chuyển đổi ngay lập tức mà không cần quay về dashboard.
- **Cụm bên phải (Right Cluster)**:
  1. **Bộ Chuyển Đổi Giao Diện (`ThemeToggle`)**: Hỗ trợ 3 chế độ `Light` (Sáng) / `Dark` (Tối) / `System` (Theo hệ điều hành) đồng bộ toàn trang.
  2. **Bộ Chọn Ngôn Ngữ (`Language Selector`)**: Icon `Globe`, hỗ trợ chuyển đổi tức thì 3 ngôn ngữ: Tiếng Việt (`vi`), English (`en`), 日本語 (`ja`).

#### 2. Ranh giới kiến trúc bất biến (The Shell-Miniapp Isolation Boundary):
- **CẤM TỰ TẠO THANH ĐIỀU HƯỚNG / NAVBAR TOÀN CỤC BÊN TRONG MINIAPP**: Miniapp con **tuyệt đối không được** tự tạo header riêng chứa logo portal, nút chuyển theme, nút chọn ngôn ngữ hoặc thanh tìm kiếm portal. Việc này gây xung đột trải nghiệm, lãng phí diện tích màn hình và phá vỡ cấu trúc tổng thể.
- **HỢP ĐỒNG TIẾP NHẬN NGÔN NGỮ**: Miniapp con nhận prop `displayLang` (`vi` | `en` | `ja`) truyền từ `ToolContainer`. Mọi tiêu đề, nút bấm, hướng dẫn trong miniapp phải tự động phản ứng theo giá trị prop này.
- **ĐIỂM BẮT ĐẦU CỦA WORKSPACE**: Khung làm việc của miniapp bắt đầu trực tiếp từ:
  1. **Breadcrumb**: Dòng chỉ mục điều hướng nhỏ gọn (ví dụ: `Trang chủ / Danh mục / Tên Công Cụ`).
  2. **Tier 1 Context Header**: H1 hiển thị tên công cụ chuẩn hóa, mô tả ngắn gọn và Privacy Note (`ShieldCheck`).

---

### 2.9. Quy Chuẩn Đặt Tên Miniapp & Bảng Tham Chiếu 3 Ngôn Ngữ (Naming Convention & Reference Matrix)

#### 1. Triết lý đặt tên (Action-Oriented & Zero-Marketing Fluff):
AI-Tools Master Hub là không gian làm việc chuyên nghiệp (Modern Utility Workspace). Người dùng mở công cụ để giải quyết tác vụ tức thời, không phải để xem quảng cáo. Do đó, tên gọi miniapp phải tuân theo các nguyên tắc:
- **Trực diện, hướng công năng (Action-oriented)**: Nói ngay công cụ này làm gì hoặc tạo ra cái gì.
- **Công thức chuẩn**: `[Hành động / Thể loại] + [Đối tượng / Định dạng]`
  - *Tiếng Việt*: Độ dài tối ưu **3 – 5 từ** (ví dụ: *Tạo Danh Thiếp, Nén Ảnh Đa Năng, Tạo Đề Nghị Thanh Toán*).
  - *Tiếng Anh*: Danh từ/danh ngữ súc tích **2 – 4 từ** (ví dụ: *Business Card Maker, Multi-Purpose Image Compressor, Payment Request Maker*).
  - *Tiếng Nhật*: Từ vựng tự nhiên theo chuẩn văn phòng Nhật Bản (ví dụ: *名刺作成, 画像圧縮・変換, 支払依頼書作成*).
- **DANH MỤC TỪ CẤM TIẾP THỊ (FORBIDDEN MARKETING FLUFF)**:
  - CẤM các từ phô trương: `PRO`, `Master`, `Studio PRO`, `AI Studio`, `Craft`, `Vip`, `Ultimate`.
  - CẤM các khẩu hiệu tiếp thị nối dài bằng dấu gạch ngang (ví dụ: cấm *Watermark Studio — Đóng Dấu Bản Quyền & Bảo Vệ Tài Liệu*).

#### 2. Quy tắc đồng bộ 4 điểm (The 4-Point Naming Synchronization Rule):
Khi tạo miniapp mới hoặc đổi tên, tên gọi của công cụ bắt buộc phải đồng nhất 100% tại 4 vị trí:
1. **Registry**: `hub/src/config/toolsRegistry.js` (`name_vn`, `name_en`, `name_ja`).
2. **Breadcrumb**: Phản ứng theo `displayLang` trong view của miniapp.
3. **Context Header H1**: Tiêu đề chính của miniapp phản ứng theo `displayLang`.
4. **Từ điển / Utility i18n**: Các file ngôn ngữ nội bộ (`translations.js`, `i18n/vi.js`, v.v.) phải dùng đúng tên này.

#### 3. Bảng Tham Chiếu Tên Gọi 9 Miniapp Chuẩn Mực:
Dưới đây là bảng đối chiếu chính thức của 9 miniapp hiện tại làm chuẩn mực quy chiếu cho mọi miniapp tích hợp sau này:

| Miniapp ID | Danh mục | Tên Tiếng Việt (`name_vn`) | Tên Tiếng Anh (`name_en`) | Tên Tiếng Nhật (`name_ja`) |
|:---|:---|:---|:---|:---|
| `business-card-studio` | `office` | **Tạo Danh Thiếp** | **Business Card Maker** | **名刺作成** |
| `id-photo-studio` | `image` | **Tạo Ảnh Thẻ & Hộ Chiếu** | **ID & Passport Photo** | **証明写真・パスポート写真** |
| `image-convert` | `image` | **Nén Ảnh Đa Năng** | **Multi-Purpose Image Compressor** | **画像圧縮・変換** |
| `screen-capture` | `utils` | **Chụp Màn Hình** | **Screen Capture** | **画面キャプチャ** |
| `barcode-qr` | `utils` | **Tạo Mã QR & Barcode** | **QR & Barcode Generator** | **QRコード・バーコード生成** |
| `pdf-toolkit` | `pdf` | **Công Cụ PDF Đa Năng** | **PDF Multi-Tool** | **万能PDFツール** |
| `omniconvert` | `office` | **Chuyển Đổi Đa Năng** | **Universal File Converter** | **万能ファイル変換** |
| `invoice-studio` | `office` | **Tạo Đề Nghị Thanh Toán** | **Payment Request Maker** | **支払依頼書作成** |
| `watermark-studio` | `image` | **Đóng Dấu Tài Liệu** | **Document Watermark** | **文書透かし・押印** |

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

### 3.8. Cơ Chế Bảo Vệ Miniapp Đã Ổn Định (Verified Miniapp Protection)
Để đảm bảo khi sửa chữa hoặc nâng cấp một miniapp thì không gây ảnh hưởng đến các miniapp khác, hệ thống áp dụng cơ chế bảo vệ phân tầng nghiêm ngặt:
1. **Trạng Thái Verified (`verified: true`)**:
   - Khi một miniapp đạt trạng thái `beta`, vượt qua toàn bộ các cổng kiểm duyệt và chạy ổn định trên thực tế, miniapp đó được cấp nhãn `verified: true` và ghi nhận ngày kiểm định `verifiedAt: 'YYYY-MM-DD'` trong `hub/src/config/toolsRegistry.js`.
   - Danh sách 11 miniapp đạt chuẩn Verified hiện tại: `image-convert`, `screen-capture`, `barcode-qr`, `pdf-toolkit`, `omniconvert`, `invoice-studio`, `accounting-reconcile`, `tax-calculator`, `watermark-studio`, `id-photo-studio`, `business-card-studio`.
   - Các công cụ đang ở trạng thái `experimental` (`excel-mapping`, `editor-studio`, `auto-bi`) hoặc `in-development` không được gán nhãn Verified.
2. **Nguyên Tắc Bất Xâm Phạm (Zero Modification Without Explicit Instruction)**:
   - Các trợ lý AI và lập trình viên tuyệt đối không can thiệp, sửa đổi mã nguồn của bất kỳ Verified Miniapp nào trừ khi có yêu cầu chỉ định đích danh từ Người dùng.
3. **Cấm Cross-Domain Imports**:
   - Nghiêm cấm import module trực tiếp giữa các thư mục chuyên biệt của các miniapp khác nhau (ví dụ: cấm import từ `packages/core/src/utils/accounting/` vào `invoice-studio`). Mọi tiện ích dùng chung phải được chuẩn hóa tại thư mục gốc `packages/core/src/utils/` (như `numbers.js`, `documentFiles.js`).
4. **Bảo Toàn Hợp Đồng Tiện Ích Chung (Shared Utility Contract Preservation)**:
   - Mọi thay đổi trong `packages/core/src/utils/` phải giữ nguyên signature và tính tương thích ngược 100% cho các callers hiện hữu. Bắt buộc chạy toàn bộ test suite (`npm test`) và audit (`npm run audit:miniapps`) để xác nhận không có bất kỳ miniapp nào bị ảnh hưởng.

---

## 🚦 4. QUY TRÌNH KIỂM DUYỆT 5 CỔNG (5-GATE VERIFICATION PIPELINE)

Trước khi một miniapp được chuyển từ trạng thái `in-development` sang `beta` và phát hành trên production, miniapp bắt buộc phải vượt qua 5 cổng kiểm duyệt khép kín:

```
[Miniapp Code] 
      ↓
[Gate 0: Architectural Dependency & Boundary Audit (Đồ thị phụ thuộc Native)]
      ↓ (Pass)
[Gate 1: Contract & Registry Audit (Hợp đồng & Đăng ký Hub)]
      ↓ (Pass)
[Gate 2: Static Token & UI Linter (Rà soát Design Token & A11y)]
      ↓ (Pass)
[Gate 3: Stability & Memory Leak Audit (Chống rò rỉ RAM & Namespace)]
      ↓ (Pass)
[Gate 4: Automated Real-Browser Testing (Headless Chrome & Dynamic Flow)]
      ↓ (Pass 100%)
[Phê Duyệt Tích Hợp Chính Thức]
```

### 🟣 CỔNG 0: ARCHITECTURAL DEPENDENCY & BOUNDARY AUDIT (KIẾN TRÚC PHỤ THUỘC & RANH GIỚI)
Được tự động hóa qua engine native `ai-tools-graph` (`scripts/lib/ai-tools-graph/`):
- [ ] **Bản đồ phụ thuộc 100% hợp lệ (Zero Broken Imports)**:
  - Tất cả các lệnh `import` (tĩnh và dynamic lazy-loading) và alias `@ai-tools/core/*` bắt buộc phải trỏ đến đúng file thực tế trên đĩa. Tuyệt đối không có import hỏng.
- [ ] **Cách ly ranh giới tên miền tuyệt đối (Zero Cross-Domain Imports)**:
  - Miniapp A **nghiêm cấm** import trực tiếp logic, utils hoặc views nội bộ của Miniapp B (ví dụ: cấm import từ `packages/core/src/utils/accounting/` vào `invoice-studio`).
  - Mọi tiện ích chia sẻ phải được chuẩn hóa tại thư mục gốc chung: `packages/core/src/utils/` (như `numbers.js`, `documentFiles.js`).
- [ ] **Chống chu trình phụ thuộc (Zero Circular Dependencies)**:
  - Cây import của miniapp không được phép chứa bất kỳ chu trình lặp nào (`A -> B -> C -> A`). Chu trình import sẽ phá vỡ cơ chế lazy-loading của Vite/Rollup và gây lỗi `undefined component`.
- [ ] **Đánh giá vùng ảnh hưởng lan toả (Blast Radius Assessment & Risk Tiers)**:
  - Trước khi sửa đổi file chia sẻ trong `@ai-tools/core`, bắt buộc chạy `npm run graph:impact -- <file>` để xác định cấp độ rủi ro:
    - **`R0 (Isolated)`**: File nội bộ, không có consumer bên ngoài.
    - **`R1 (Single Miniapp Local)`**: Chỉ ảnh hưởng 1 miniapp duy nhất.
    - **`R2 (Shared Core Utility)`**: Ảnh hưởng 2-4 miniapp hoặc có chứa Verified Miniapp. Bắt buộc kiểm tra tương thích ngược.
    - **`R3 (Critical Core Infrastructure)`**: Ảnh hưởng Hub Shell (`App.jsx`, `toolsRegistry.js`, `ToolContainer.jsx`) hoặc $\ge 5$ miniapp. Bắt buộc kích hoạt Escalation Protocol L3!

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
- [ ] **Chuẩn Hóa Tên Gọi Miniapp 3 Ngôn Ngữ (Naming Convention & Zero-Fluff)**:
  - Tên gọi `name_vn`, `name_en`, `name_ja` phải súc tích, hướng công năng (Action-oriented theo công thức `[Hành động/Thể loại] + [Đối tượng]`).
  - Tuyệt đối cấm các từ ngữ tiếp thị phô trương (`PRO`, `Master`, `Studio PRO`, `AI Studio`, `Craft`, `Vip`, `Ultimate`) hoặc khẩu hiệu dài dòng nối bằng dấu gạch ngang.
- [ ] **Cấu trúc thư mục khớp 1-1**:
  - Miniapp hoạt động phải có thư mục wrapper: `hub/src/tools/<id>/<Component>Tool.jsx`.
  - Miniapp tạm dừng phải nằm ở: `hub/src/tools-in-development/<id>/`.
- [ ] **Wiring trong `App.jsx`**:
  - Phải có khai báo `React.lazy(() => import('./tools/<id>/...'))`.
  - Phải đăng ký vào `toolComponentMap`.
- [ ] **Khai báo thư viện phụ thuộc (No Undeclared Dependencies)**:
  - Mọi thư viện `import` phải được khai báo trong `dependencies` của package tương ứng. Cấm dựa vào hoisting ngầm của npm.

### 🟡 CỔNG 2: STATIC TOKEN & UI LINTER (RÀ SOÁT TĨNH GIAO DIỆN)
- [ ] **Cách Ly Thanh Điều Hướng (Navbar Isolation & Contract)**:
  - Miniapp không tự dựng lại thanh Header/Navbar toàn cục riêng, không nhúng lại `ThemeToggle`, Language Selector hoặc ô tìm kiếm portal.
  - Miniapp bắt đầu từ Breadcrumb và Tier 1 Context Header, nhận và phản ứng tức thì với prop `displayLang` truyền từ `ToolContainer`.
- [ ] **Quét sạch Class Light-Mode tĩnh**:
  - Không có `bg-white`, `bg-slate-50`, `bg-gray-100`, `text-black`, `text-slate-900`.
- [ ] **Quét sạch Class Màu Chữ Tương Phản Thấp (A11y Anti-patterns)**:
  - Không có `text-slate-400`, `text-gray-400`, `text-zinc-400`, `text-neutral-400` dùng trên nền sáng (tương phản chỉ ~2.5:1, rớt chuẩn WCAG AA).
  - Bắt buộc dùng `text-on-surface-variant` (`#475569`, 5.45:1) hoặc `text-outline` (`#475569`, 5.67:1).
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

### 🔵 CỔNG 4: AUTOMATED REAL-BROWSER TESTING & DEEP FLOW VERIFICATION (KIỂM THỬ TRÌNH DUYỆT THẬT & LUỒNG SÂU)
Được tự động hóa qua script: `npm run test:browser -- --flow` hoặc `npm run test:browser:tool -- <tool-id>`.
- [ ] **Render thành công**: Mở route `#/tools/<tool-id>` nạp xong trong vòng < 2.0s.
- [ ] **Zero Console Errors**: 0 lỗi `console.error`, 0 ngoại lệ `pageerror` trong suốt toàn bộ phiên làm việc tĩnh lẫn luồng tương tác sâu.
- [ ] **Kiểm Trợ Năng Tự Động axe-core Kép (Initial & Dynamic State A11y Audit)**:
  - **Initial State Audit**: Quét WCAG 2.1 A & AA ngay khi nạp trang (Desktop & Mobile, Dark & Light Mode). Bắt buộc đạt **0 vi phạm (`violations: 0`)**.
  - **Dynamic State Audit**: Tự động thực thi luồng tương tác sâu (nạp tệp mẫu synthetic, bấm nút tính toán/phân tích, chuyển tab kết quả, mở modal tải tệp/hướng dẫn) rồi quét lại axe-core. Toàn bộ các component động (thông báo cảnh báo, bảng kết quả, slider điều chỉnh, color picker, modal, dropzone) bắt buộc đạt **0 vi phạm (`violations: 0`)**.
  - **Tiêu chuẩn Form Labels & Accessible Names**: Mọi `<input>` (bao gồm `range`, `color`, `text`, `file`), `<select>` phải có `<label htmlFor="...">` hoặc thuộc tính `aria-label` tường minh. Toàn bộ các nút icon không chứa văn bản trực quan bắt buộc có `aria-label`.
  - **Vùng cuộn bàn phím (Keyboard Scrollable Regions)**: Mọi danh sách cuộn (`overflow-y-auto`, `overflow-x-auto`) bắt buộc gắn `tabIndex={0} role="region" aria-label="..."`.
  - Tỷ lệ tương phản chữ nhỏ đo đạc thực tế $\ge 4.5:1$, chữ lớn $\ge 3.0:1$. Tuyệt đối không dùng class mờ 20% tint (`bg-*/20 text-*`) cho nút/tab active.
- [ ] **Kiểm chứng Style Thực Tế (Computed Style)**:
  - Màu nền canvas chuẩn `--surface-canvas` (`#090D16` ở Dark Mode, `#f8fafc` ở Light Mode).
  - Thẻ làm việc có viền `--border-subtle` và nền `--surface-container`.
  - Chiều rộng không tràn khung (`clientWidth <= 1240px`).
- [ ] **Kiểm chứng Chuyển Theme (Dark ↔ Light)**:
  - Khi bật Light Mode: Nền chuyển sang sáng chuẩn (`#F8FAFC`), chữ tối rõ nét, độ tương phản đạt chuẩn WCAG.
  - Khi bật Dark Mode: Giao diện tối sâu đồng bộ.
- [ ] **Kiểm chứng Đổi Ngôn Ngữ (VI ↔ EN ↔ JA)**:
  - Chuyển ngôn ngữ trên Navbar lập tức cập nhật tiêu đề miniapp tương ứng mà không cần reload trang.
- [ ] **Kiểm thử Kéo Thả & Luồng Dữ Liệu Tương Tác Sâu (Synthetic Flow Testing)**:
  - Kích hoạt DropZone với tệp fixture synthetic chuẩn (PDF, Excel XLSX, XML hóa đơn điện tử, ảnh mẫu).
  - Kiểm tra trạng thái chuyển bước (Wizard step progression), render bảng dữ liệu / canvas kết quả không sinh ngoại lệ.
  - **Zero Horizontal Overflow Sau Tương Tác**: Sau khi nạp tệp và render dữ liệu thật/bảng kết quả, kiểm tra `document.documentElement.scrollWidth <= document.documentElement.clientWidth` trên iOS Safari (390px) và Android (393px) đảm bảo không bị xô lệch layout.
- [ ] **Kiểm chứng Cơ Chế Cách Ly Sự Cố (Fault Isolation)**:
  - Kích hoạt thử nghiệm lỗi mô phỏng → Card `ToolErrorBoundary` hiển thị thông báo an toàn, bấm "Về Trung Tâm" đưa người dùng về Dashboard hoàn hảo.

---

## 🛠️ 5. BỘ LỆNH VẬN HÀNH DÀNH CHO LẬP TRÌNH VIÊN

Dự án đã tích hợp sẵn các lệnh CLI để lập trình viên tự kiểm duyệt nhanh:

```bash
# 1. RÀ SOÁT KIẾN TRÚC & ĐỒ THỊ PHỤ THUỘC (GATE 0)
npm run graph:audit                              # Rà soát toàn bộ đồ thị (chu trình, import chéo, import hỏng)
npm run graph:impact -- <path/to/file>           # Đánh giá vùng ảnh hưởng (Blast Radius) trước khi sửa file
npm run graph:diff                               # Đánh giá rủi ro của các thay đổi Git chưa commit
npm run graph:map -- --tool=<tool-id>            # Xuất bản đồ quan hệ file dạng Mermaid Markdown

# 2. RÀ SOÁT TĨNH 4 CỔNG MINIAPP (GATE 0, 1, 2, 3)
npm run audit:miniapps                           # Rà soát toàn bộ miniapp trong repo
node scripts/audit-miniapp.mjs <tool-id>         # Rà soát một miniapp cụ thể

# 3. KIỂM THỬ TRÌNH DUYỆT THẬT (GATE 4)
npm run test:browser                             # Kiểm thử render cơ bản trên trình duyệt headless
node scripts/verify-miniapp-browser.mjs --flow   # Kiểm thử luồng sâu & quét trợ năng động (Dynamic axe-core)
npm run test:browser:tool -- <tool-id>           # Kiểm thử chuyên sâu cho riêng một miniapp

# 4. KIỂM THỬ ĐƠN VỊ & HỢP ĐỒNG (UNIT & CONTRACT TESTS)
npm test                                         # Chạy toàn bộ test suites (60+ tests)
```

---

## 📋 6. BẢNG KIỂM TRA NHANH TRƯỚC KHI YÊU CẦU DUYỆT (PRE-PR CHECKLIST)

| Hạng mục kiểm tra | Đạt chuẩn | Ghi chú |
|---|:---:|---|
| **[Gate 0]** Chạy `npm run graph:audit` trả về 100% SẠCH | [ ] | 0 cross-domain, 0 circular, 0 broken imports |
| **[Gate 0]** Nếu sửa file shared, đã chạy `npm run graph:impact` xác nhận rủi ro | [ ] | R0-R3 Blast Radius analysis |
| **[Gate 1]** Đã khai báo đầy đủ 3 ngôn ngữ trong `toolsRegistry.js` | [ ] | VN, EN, JA |
| **[Gate 1]** Tên gọi miniapp chuẩn hóa 3 ngôn ngữ, không chứa từ cấm tiếp thị (`PRO`, `Master`, `Craft`...) | [ ] | Naming Convention & Zero-Fluff |
| **[Gate 1]** Không tự dựng Navbar/Header riêng, tuân thủ Navbar Contract từ `ToolContainer` | [ ] | Navbar Isolation |
| **[Gate 2]** Đã bọc trong `StandardToolLayout` hoặc `MiniAppLayout` | [ ] | Max 1240px |
| **[Gate 2]** 100% sử dụng CSS semantic tokens (không có `bg-white`, `text-black`) | [ ] | Tương thích cả Dark/Light |
| **[Gate 2]** Tỷ lệ tương phản chữ $\ge 4.5:1$ theo ma trận phối màu an toàn (không dùng `text-*-400`) | [ ] | Chuẩn WCAG 2.1 AA |
| **[Gate 2]** 100% dùng `lucide-react` (không có emoji làm icon trong nút bấm) | [ ] | Đảm bảo tính chuyên nghiệp |
| **[Gate 2]** 100% các nút icon và form slider/color controls có thuộc tính `aria-label` | [ ] | Accessible names |
| **[Gate 2]** 100% vùng cuộn nội bộ có `tabIndex={0} role="region" aria-label="..."` | [ ] | Keyboard navigation |
| **[Gate 2]** Không sử dụng class active tint mờ (`bg-*/20 text-*`) cho các nút bấm / tab được chọn | [ ] | Chống rớt tương phản Light Mode |
| **[Gate 3]** Mọi Blob URL đều có `URL.revokeObjectURL` | [ ] | Chống rò rỉ RAM |
| **[Gate 3]** LocalStorage có prefix `ai_tools_<id>_` | [ ] | Không đè dữ liệu miniapp khác |
| **[Audit]** Chạy `npm run audit:miniapps` trả về 0 lỗi (Đạt Gate 0, 1, 2, 3) | [ ] | Pass 100% 4 cổng tĩnh |
| **[Gate 4]** Chạy `node scripts/verify-miniapp-browser.mjs --tool=<id>` đạt `✔ Init+Dyn` | [ ] | 0 vi phạm axe-core |
| **[Gate 4]** Zero Horizontal Overflow trên iOS Safari (390px) và Android (393px) sau khi nạp tệp | [ ] | Không tràn ngang màn hình |
| **[Tests]** Chạy `npm test` 100% xanh (bao gồm kiểm tra toán học tương phản token) | [ ] | Toàn vẹn hệ thống |

# Kiến Trúc Thông Tin Hub Toolio (Hub Information Architecture)

## 1. Bối cảnh & Mục tiêu Tái cấu trúc

Trước đây, Hub Toolio hiển thị toàn bộ hơn 52 miniapp trên một trang catalogue phẳng duy nhất. Khi số lượng công cụ tiện ích (`common`) và các công cụ phục vụ cuộc sống tại Nhật (`japan-life`) tăng mạnh, catalogue phẳng khiến người dùng bị quá tải thông tin, phải cuộn và scan qua quá nhiều thẻ để tìm đúng tiện ích mình cần.

Đợt tái cấu trúc này phân tách Hub Toolio thành 3 **Tên miền cấp cao (Top-Level Domains)** độc lập:
1. **Công cụ / Tools / ツール** (`common`): Tập hợp 18 miniapp tiện ích hàng ngày (PDF, ảnh, WebP, mã QR, kế toán, hóa đơn).
2. **Cuộc sống tại Nhật / Japan Life / 日本生活** (`japan-life`): Tập hợp 34 miniapp chuyên sâu hỗ trợ cuộc sống, tính thuế, bảo hiểm, visa, thủ tục hành chính tại Nhật Bản.
3. **Cuộc sống tại Việt Nam / Vietnam Life / ベトナム生活** (`vietnam-life`): Bộ công cụ phục vụ đời sống, thuế và thủ tục tại Việt Nam (hiện đang trong trạng thái Chờ phát triển - Coming Soon).

---

## 2. Mô hình Kiến trúc Phân tầng

```text
TOOLIO HUB
│
├── [Global Navbar SOT]
│   ├── Toolio Brand Logo (Home link)
│   ├── Cross-Domain Global Search
│   ├── Theme Mode Toggle (Light / Dark / System)
│   ├── Language Selector (VI, EN, JA)
│   └── Miniapp Settings & Easter Eggs
│
├── [Homepage View: #/]
│   ├── Welcoming Hero (Tôn chỉ 100% Client-side Safe, Zero Latency)
│   └── 3 Top-Level Domain Cards:
│       ├── [Card 1: Công cụ (common)] → Link: #/tools
│       ├── [Card 2: Cuộc sống tại Nhật (japan-life)] → Link: #/japan-life
│       └── [Card 3: Cuộc sống tại Việt Nam (vietnam-life)] → Link: #/vietnam-life
│
├── [Domain Catalogue View: #/tools, #/japan-life, #/vietnam-life]
│   ├── Domain Header (Back to Home button, Localized Title, Tool Count, Illustration)
│   ├── Japan Life Navigator Shortcut (riêng cho japan-life)
│   ├── Content Filter Chips (Danh mục nội dung / Lĩnh vực pháp lý)
│   └── 3-Column Miniapp Grid (ToolCard với kích thước icon 48px, mô tả 3 dòng dễ đọc)
│
├── [Active Miniapp View: #/tools/:toolId]
│   └── ToolContainer (Back button hồi phục chính xác domain và filter ngữ cảnh trước đó)
│
└── [Cross-Domain Global Search View]
    └── Hiển thị kết quả tìm kiếm tức thì xuyên suốt toàn bộ 52+ miniapp kèm Domain Context Pill
```

---

## 3. Nguyên tắc 3 Ngôn ngữ (VI, EN, JA)

Tên của các Top-Level Domains, tiêu đề phụ, mô tả và chip lọc tuân thủ nghiêm ngặt nguyên tắc đa ngữ động theo ngôn ngữ hiển thị (`displayLang`):

| Domain ID | Tiếng Việt (`vi`) | English (`en`) | 日本語 (`ja`) | Accent Color |
| :--- | :--- | :--- | :--- | :--- |
| `common` | **Công cụ** | **Tools** | **ツール** | `#0284c7` (Toolio Cyan) |
| `japan-life` | **Cuộc sống tại Nhật** | **Japan Life** | **日本生活** | `#f43f5e` (Sakura Rose) |
| `vietnam-life` | **Cuộc sống tại Việt Nam** | **Vietnam Life** | **ベトナム生活** | `#10b981` (Lotus Emerald) |

---

## 4. Các Ranh giới SOT (Single Source of Truth)

1. **One Global Navbar SOT**:
   - Navbar là thanh điều hướng trên cùng duy nhất trên toàn Hub.
   - Tuyệt đối không sinh ra thanh điều hướng thứ hai hay navbar phụ. Đã loại bỏ thanh sub-bar danh mục cũ để giữ giao diện tối giản, hiện đại.
2. **One Global Search SOT**:
   - Ô tìm kiếm chỉ nằm duy nhất trên Navbar toàn cục.
   - Tìm kiếm thoát khỏi bộ lọc tên miền để quét toàn bộ 52+ công cụ cùng lúc.
   - Thẻ kết quả tìm kiếm gắn nhãn nhận diện tên miền (`showGroupContext={true}`): `Cuộc sống Nhật`, `Công cụ`, `Cuộc sống VN` theo đúng ngôn ngữ được chọn.
3. **Routing Contract Bảo toàn 100%**:
   - Địa chỉ URL của các miniapp (`#/tools/:toolId`) được giữ nguyên vẹn 100%, không làm gãy bookmark hay liên kết chia sẻ của người dùng.
   - Điều hướng cấp tên miền sử dụng hash tĩnh tương thích Cloudflare Pages: `#/tools`, `#/japan-life`, `#/vietnam-life` kèm query filter: `?category=...` hoặc `?domain=...`.
4. **Smart Context Persistence**:
   - Khi người dùng bấm mở miniapp từ một tên miền đã lọc (ví dụ `#/japan-life?domain=tax`), ngữ cảnh được ghi nhớ qua `sessionStorage`.
   - Khi bấm "Quay lại" trên ToolContainer, hệ thống khôi phục chính xác tên miền và bộ lọc đang xem thay vì đẩy người dùng ra trang chủ trắng.

---

## 5. Danh mục & Bộ lọc Tên miền

- **Công cụ (`common`)**:
  - `all`: Tất cả
  - `pdf`: PDF & Tài liệu
  - `image`: Hình ảnh & WebP
  - `office`: Kế toán & Hóa đơn
  - `utils`: Tiện ích
  - `ai`: Dịch thuật & AI
- **Cuộc sống tại Nhật (`japan-life`)**:
  - `all`: Tất cả
  - `tax`: Thuế & Tài chính
  - `insurance`: Bảo hiểm & Hưu trí
  - `employment`: Việc làm & Quyền lợi
  - `family`: Gia đình & Trẻ em
  - `housing`: Nhà ở & Chuyển nhà
  - `immigration`: Cư trú & Nhập cảnh
  - `procedures-documents`: Thủ tục & Giấy tờ
- **Cuộc sống tại Việt Nam (`vietnam-life`)**:
  - Tự động hiển thị giao diện Chờ phát triển (Coming Soon) với vector Tháp Rùa biểu tượng, và sẽ tự động chuyển thành catalogue đầy đủ ngay khi có miniapp đầu tiên được đăng ký.

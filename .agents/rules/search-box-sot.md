# Ô tìm kiếm

Mọi ô tìm kiếm và ô lọc của Toolio dùng gói chung `@chotto/search`, không viết tay. Luật này áp dụng cho navbar hub, bảng lệnh ⌘K, và ô lọc bên trong từng miniapp. Miniapp mới cũng theo luật này. Gói dùng chung cho mọi site Chotto (chottoday.com, toolio, jlpt-guru…), repo công khai `bangluutru/chotto-search`.

Lý do: trước khi có gói, mỗi ô một kiểu lỗi.
- Có ô bỏ dấu, có ô không.
- Bảng lệnh ghi "Nhấn ESC để đóng" nhưng không có handler Esc.
- Hub có hai handler ⌘K trùng nhau. Một handler còn tìm ô bằng `querySelector('header input[type="text"]')`.

## Dùng thế nào

- **Hook nối:** `packages/core/src/search/toolioSearch.js`, hàm `useToolioSearch(opts)`. Nó bọc `useSearchBox` của gói và đặt `resetKey` là pathname. Pathname đổi theo sự kiện `toolio:navigate` và `popstate`, vì Toolio không dùng react-router. File này cũng có `searchLabels(lang)` và `pickLang`.
- **Giao diện:** `packages/core/src/search/ToolioSearchBox.jsx`. Đây là `SearchBoxView` kèm nhãn vi/en/ja theo `displayLang`. File này nạp `@chotto/search/styles.css` một lần.
- **Màu:** biến `--cs-*` được map sang token Toolio ở cuối `hub/src/index.css`, chỉ ở một chỗ đó. Token đổi theo `data-theme`/`data-skin`, nên ô tự theo cả bốn theme. Ở từng miniapp chỉ đặt vị trí và độ rộng, không tô màu.
- **So khớp:** dùng `matchesQuery`/`rankItems`/`foldText` của gói, không dùng `toLowerCase().includes`. Bộ tìm chuyên biệt vẫn giữ: `consularSearch`, `adminSearchEngine`, `findDocumentsByQuery`, `resolveIntentFromText`. Truyền chúng vào qua `search`, hoặc lọc bằng `query` của hook.
  - `textFold.js` và `consularSearch.js` đã chuyển sang `foldText` của gói.
  - `normalizeSearchQuery` của navigator thì **chưa chuyển**. `foldText` đổi katakana sang hiragana, mà engine navigator so chuỗi đã chuẩn hoá với chuỗi gốc, và test `navigator-search` khẳng định `住民票・在留カード` phải giữ nguyên.

Chọn chế độ:

| Ô | Chế độ |
| --- | --- |
| Dẫn sang trang/mục khác (bảng lệnh ⌘K, gợi ý giấy tờ) | `suggest`/`filter` có `search`, `onChoose` |
| Trang tự hiện kết quả ngay bên dưới (navbar hub, lưới hoá đơn, danh sách giấy tờ) | `plain`, có `count` nếu trang đang hiện số |
| Ô nằm trong modal | `placement="inline"` |

Chú ý: ở `filter`, bảng gợi ý luôn mở khi có chữ, kể cả khi không có `search`. Khi đó bảng chỉ còn dòng "không thấy". Ô chỉ lọc lưới thì dùng `plain`.

## Test canh

`hub/tests/search-sot.test.js` báo đỏ trong các trường hợp sau:
- Có `type="search"`, `role="search"` hoặc `role="combobox"` viết tay.
- Có `<input>` chữ mà placeholder hay state mang chữ search/tìm/lọc/filter/検索.
- Hub còn handler ⌘K thứ hai.
- Tag của gói ở `hub` lệch với tag ở `packages/core`.

Gói thiếu một khả năng mà ô cần thì làm như sau:
1. Không tự viết lại ô, không sửa gói.
2. Để nguyên ô đó.
3. Thêm ô vào `ALLOWED` trong test, kèm `TODO(@chotto/search): …`.
4. Báo lại để thêm khả năng đó vào gói.

## Nâng phiên bản gói

```bash
npm install github:bangluutru/chotto-search#vX.Y.Z -w packages/core -w hub
```

Hai workspace phải cùng tag (test kiểm tra). Sau khi nâng, xem `git diff package-lock.json`:
- Gói phải nằm ở `node_modules/@chotto/search` gốc.
- Lock không được đổi thêm gói nào khác.

Khi đã có bản cũ ở gốc, npm hay cài bản mới lồng vào `hub/node_modules` và `packages/core/node_modules`. Khi đó bundle có hai bản của gói. Cách sửa gọn nhất là sửa tay entry `node_modules/@chotto/search` trong lock: đổi `version` và commit trong `resolved` sang commit của tag mới (`git ls-remote https://github.com/bangluutru/chotto-search refs/tags/vX.Y.Z`), rồi chạy `npm ci`. Đừng chạy `npm dedupe`, vì lệnh đó nâng lung tung các gói khác.

Cỡ chữ trong ô: map `--cs-font-size` nếu cần, đừng đè `font-size` của `.cs-input`. Trên máy cảm ứng, gói tự giữ chữ ≥16px để iOS không zoom khi focus. Chạy dev lại với `--force` để Vite bỏ cache bản cũ.

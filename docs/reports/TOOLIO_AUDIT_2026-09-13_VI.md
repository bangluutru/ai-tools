# Audit Toolio (ai-tools) — 13/09/2026

Bản kiểm tra: commit `8cea6aa`. Phạm vi: hub, 12 công cụ hoạt động, thư viện core, cấu hình build/lint/CI, backend và ranh giới với 6 công cụ đang phát triển/standalone/legacy.

**Kết luận: chưa đủ điều kiện xác nhận ứng dụng không có lỗi logic hoặc giao diện.** Test hiện có xanh nhưng bỏ sót lỗi mất dữ liệu khi chuyển đổi, sai thống kê, lỗi cấu trúc DOCX và giao diện mobile. Ưu tiên sửa tính đúng đắn trước cleanup. Chưa sửa source, dependency, cấu hình, chưa commit/push/deploy; đợt này chỉ thêm báo cáo và bằng chứng audit.

## 1. Phương pháp và giới hạn kết luận

- Đọc registry, entry points, các luồng nhập/xử lý/xuất, utility dùng chung, tài liệu thiết kế/audit cũ và CI.
- Chạy toàn bộ test JavaScript, lint, build active workspaces; chạy backend tests trong môi trường Python 3.12 tạm riêng vì Python hệ thống thiếu pytest.
- Mở thực tế 12 công cụ trong trình duyệt local, chờ hết lazy loading; kiểm tra trang đầu ở 390 px, 320 px và 1440 px. Kiểm tra thêm màn hình tạo tài liệu và tab PDF.
- Chạy trực tiếp hàm analytics trích từ source với fixture biên; chạy engine DOCX watermark trích từ source trên ZIP tổng hợp có `w:sectPr` tự đóng, đọc XML đầu ra.
- Kiểm tra npm audit hiện tại và đối chiếu advisory chính thức. Không chạy khai thác bảo mật.
- Chưa nghiệm thu end-to-end mọi định dạng đầu vào/đầu ra bằng Word, Excel, PowerPoint, trình đọc QR và thiết bị thật. Chưa đo Core Web Vitals hoặc heap bằng profiler; số bundle bên dưới là kích thước build, không phải thời gian tải đo trên mạng di động.
- Chưa kiểm tra production hoặc gọi AI bằng credential thật; chưa xin quyền camera/chụp màn hình. Không sử dụng tài liệu nghiệp vụ riêng tư làm fixture.
- Các mục “đọc source” là lỗi hoặc rủi ro suy ra từ đường chạy cụ thể; không mô tả như đã tái hiện trên mọi trình duyệt. Không thể dùng audit này để chứng nhận tuân thủ pháp lý hay bảo đảm mọi mẫu hóa đơn thực tế đều đúng.

## 2. Kết quả kiểm tra nền tảng

| Kiểm tra | Kết quả |
|---|---|
| JavaScript tests | 154/154 pass: core 133, hub 21 |
| Backend tests | 10/10 pass, 1 cảnh báo deprecation của dependency |
| Lint theo cấu hình repo | 0 lỗi, 2 cảnh báo hooks: PdfCompressorView và Step2Background |
| `build:all` | Pass hub + 5 standalone đang được script chỉ định |
| 12 route hoạt động | Mở được; không ghi nhận console error/warn ở lượt smoke test trạng thái ban đầu |
| npm audit, bỏ dev dependencies | 4 mục: 2 high, 2 moderate; không phải 4 lỗ hổng độc lập |
| Chứng từ kế toán thực tế | Chưa có nghiệm thu mới bởi kế toán; test tổng hợp không thay thế bước này |

Log và danh sách ứng viên cleanup nằm tại [thư mục bằng chứng](./toolio-audit-2026-09-13/).

## 3. Phát hiện ưu tiên cao — P1

### F01. OmniConvert âm thầm bỏ dữ liệu Excel sau dòng thứ 100

**Đọc source, xác định trực tiếp:** `packages/core/src/utils/omniconvert/xlsxPdfConverter.js:73` sử dụng `rows.slice(0, 100)`, rồi vẫn báo 100% và trả PDF thành công. Bảng 150 dòng dữ liệu mất 50 dòng cuối. Đây không phải giới hạn số trang được thông báo để người dùng chủ động chọn.

**Xử lý:** phân trang toàn bộ dữ liệu hoặc từ chối rõ ràng trước chuyển đổi nếu vượt giới hạn được chốt; không xuất thành công khi âm thầm cắt nội dung. Nghiệm thu bằng bảng >100 dòng, có mã đánh dấu ở dòng cuối và nhiều sheet.

### F02. Auto-BI cho kết quả sai với dữ liệu biên

**Đã chạy hàm thật trích từ source:** `packages/core/src/components/AutoBiView.jsx:71-98`.

| Đầu vào | Kết quả hiện tại | Kết quả cần có |
|---|---|---|
| Giá trị -10, -5 | max = 1 | max = -5 |
| Chuỗi số `1.234,56` | 1.23456 | 1234.56 khi chọn quy ước Việt Nam |
| Nhóm `constructor`, giá trị 10 | tổng 10 nhưng danh sách nhóm rỗng, insight có `undefined` | Nhóm hợp lệ, tổng nhóm 10 |
| 100 và `N/A` | trung bình 50, cả hai được tính hợp lệ | Báo giá trị không hợp lệ; cách tính theo chính sách đã chốt |

`groupMap = {}` xung đột khóa kế thừa; `Math.max(...values, 1)` và `Math.min(...values, 0)` ép cực trị sai; biểu thức loại ký tự không phải parser số theo locale. Với dữ liệu rất nhiều dòng, spread toàn bộ mảng vào Math.max/min còn có nguy cơ vượt giới hạn đối số.

**Xử lý:** engine thuần riêng; Map; parser locale minh bạch; không biến dữ liệu lỗi thành 0 mà không thông báo; extrema qua vòng lặp; test dữ liệu âm, 0, ô rỗng, phần trăm, dấu phân cách, tên nhóm đặc biệt.

### F03. Watermark DOCX chèn sai cấu trúc section

**Đã tái hiện ở XML đầu ra:** `packages/core/src/components/WatermarkStudioView.jsx:478-481`. Với `<w:sectPr/>`, hàm sinh `<w:sectPr/><w:headerReference .../>`: tham chiếu nằm ngoài section. Với tài liệu đã có default header, code cũng chèn thêm tham chiếu default thay vì hợp nhất với header hiện có. Chưa mở file kết quả bằng Word để kết luận biểu hiện cụ thể là mất watermark, sửa file hay mất header.

**Xử lý:** sửa OOXML bằng parser theo namespace; xử lý section tự đóng, nhiều section, first/even/default header, quan hệ/header đã có; không ghi đè header người dùng. So sánh trực quan trong Word/LibreOffice trước nghiệm thu.

### F04. Editor Studio hiển thị thao tác giả như AI thật

**Đọc source:** `packages/core/src/components/editor-studio/DocStudioApp.jsx:226-252`. “Dài hơn” thêm câu mẫu; “Ngắn gọn” cắt nửa chuỗi; “Văn phong Pro” thay vài từ. Hàm có delay giả rồi báo AI đã viết lại. Timer còn ghi lại `rawInput` cũ, có thể đè phần người dùng vừa gõ trong lúc chờ.

Dashboard lấy `MOCK_DOCS` cố định (`:123`, `:410`), có trạng thái VALIDATED nhưng chưa có cơ chế quản lý/lưu tài liệu workspace thực tế trong component này.

**Cần chốt:** bỏ/khóa nút AI giả và ghi rõ tài liệu mẫu, hay mở dự án tích hợp AI thật + lưu tài liệu. Đề xuất trước mắt khóa AI giả và giữ editor cục bộ. Không tự bật backend AI.

### F05. Nén PDF làm mất lớp văn bản và cấu trúc tài liệu

**Đọc source:** `PdfCompressorView.jsx:305-382` render mỗi trang thành JPEG rồi tạo PDF mới. Text tìm kiếm/copy, link, form và chữ ký số không được giữ như bản gốc; preset “Chất Lượng Cao” vẫn dùng cùng đường xử lý này. Công tắc không xóa metadata không thực sự sao chép metadata từ tài liệu cũ. File kết quả có thể lớn hơn nhưng tỷ lệ tiết kiệm bị chặn ở 0%.

**Cần chốt:** giữ chế độ raster có cảnh báo rõ và xác nhận ngay trước thao tác, hay cần engine giữ text/vector. Đề xuất phân biệt “Giảm dung lượng bản scan” với “Tối ưu PDF giữ nội dung”; không quảng bá cùng một cam kết.

### F06. PPTX → PDF không bảo toàn nội dung trình chiếu

**Đọc source:** `utils/omniconvert/pptxPdfConverter.js:17-90`. Chỉ đọc `<a:t>`, đưa văn bản vào template mới 960×540; bỏ ảnh, chart, bảng và bố cục; nội dung dài bị `overflow:hidden`. Sắp theo số tên file slide, không theo presentation relationships/thứ tự hiển thị trong tài liệu.

**Cần chốt:** chỉ cung cấp bản trích văn bản có nhãn giới hạn, hoặc đầu tư converter giữ bố cục. Đề xuất chưa coi đây là chuyển đổi PPTX hoàn chỉnh. Test bằng slide đổi thứ tự, slide chỉ có ảnh, bảng/chart, Unicode và text dài.

### F07. Dependencies đang có cảnh báo mức cao; CI audit có thể chặn merge

`dependency-audit.json` ghi nhận:

- `sharp` 0.35.3, dùng ở standalone image-convert CLI và bị pin bằng root override; bản vá 0.35.4. Đây không phải bằng chứng hub browser đang thực thi sharp. [Advisory của sharp](https://github.com/advisories/GHSA-rgj7-g3m4-5g8c).
- `@xmldom/xmldom` thuộc dải ảnh hưởng <=0.8.14, có bản sửa; cần cập nhật lockfile theo dependency chain và test đọc Office. [Advisory xmldom](https://github.com/advisories/GHSA-8344-3jmq-59r6).
- `uuid` moderate và mục `exceljs` kế thừa cảnh báo đó. Không dùng audit fix --force: gợi ý tự động có thể hạ ExcelJS xuống major cũ và gây hồi quy xuất file.

**Xử lý:** nâng có chọn lọc và kiểm tra đường dùng thực tế. Không suy luận mức độ khai thác production chỉ từ severity. CI có `npm audit --omit=dev --audit-level=high`, nên bước này hiện không đạt dù build/test đạt.

## 4. Lỗi logic, giao diện và tài nguyên — P2

| ID | Phát hiện và bằng chứng | Xử lý / nghiệm thu |
|---|---|---|
| F08 | Error boundary giữ `hasError` khi chuyển nhanh công cụ: `hub/src/App.jsx` không key theo tool; `ToolErrorBoundary.jsx` không reset khi prop đổi. Suy ra từ vòng đời component, chưa fault-inject trên UI. | Key boundary theo toolId hoặc reset có kiểm soát; gây lỗi A rồi chuyển B phải dùng được B. |
| F09 | Nén PDF rò object URL: cleanup `:264` giữ mảng rỗng ban đầu; nén lại thay URL không revoke cũ; tải đơn/ZIP `:495`, `:518` tạo URL không thu hồi. Không destroy PDF.js document trong finally. | Quản lý URL qua ref/helper; cleanup finally; lặp nhập/nén lại/tải/rời trang và đo heap. Không thêm files vào dependency một cách máy móc vì sẽ revoke tài nguyên còn dùng. |
| F10 | ZIP nén PDF và watermark dùng tên file làm key, không tránh trùng tên; hai file cùng tên ghi đè nhau trong ZIP. Image convert đã có giải pháp usedNames để tham khảo. | Dùng helper tên duy nhất dùng chung; số entry ZIP phải bằng số file thành công. |
| F11 | PDF compressor tính tổng byte file cũ sai: item giữ `originalSize`/`file.size`, trong khi `validateDocumentFiles` cộng `item.size`. Các lượt thêm file tiếp theo có thể vượt maxTotalBytes. Auto-BI, Watermark, ID-photo cũng thiếu đủ giới hạn đầu vào; ID-photo mới kiểm chữ ký. | Chuẩn hóa metadata hàng đợi; kiểm size/count/pixels/pages và giới hạn giải nén OOXML trước tác vụ nặng; test nhiều đợt thêm file. |
| F12 | Header ToolContainer tràn ở 320 px do flex thiếu min-width/shrink và nhãn cố định; menu `w-72 left-0` cũng cần kiểm soát theo viewport. Đã đo tràn ở 10/12 công cụ. | Header responsive và dropdown giới hạn viewport; không che overflow để giấu lỗi. |
| F13 | Editor giữ hai cột `w-1/2` ở `:527`, `:602` trên điện thoại; ảnh chụp 320 px cho thấy chữ xuống từng từ, thanh setting bị cắt. | Một cột hoặc tab Soạn/Xem trước trên mobile; toolbar wrap; kiểm với văn bản đã nhập và bản xem trước. |
| F14 | PDF tabs dưới sm chỉ còn icon, không aria-label; panel aria-labelledby trỏ `tab-*` không tồn tại. AX thực tế hiển thị ba tab không tên. | Nhãn truy cập + ID đúng + bàn phím Left/Right; vẫn nhận biết được tab trên mobile. |
| F15 | `PdfToolkitTool` mount cả ba panel ngay, dù display:none; vì vậy cả ba lazy import đều chạy. Tab chỉ đọc URL lúc khởi tạo, không đồng bộ hash khi vẫn ở cùng component. | Mount khi ghé lần đầu rồi giữ state; đồng bộ query và history; kiểm deep-link/Back/Forward khi tool chưa unmount. |
| F16 | Auto-BI đổi tên file trước parse; file mới rỗng/lỗi giữ kết quả cũ, có thể xuất báo cáo cũ dưới tên nguồn mới. Catch chỉ console. `AutoBiView.jsx:22-64`. | Chỉ commit dữ liệu+tên+schema sau parse thành công hoặc reset đồng bộ; thông báo lỗi nhìn thấy được. |
| F17 | Excel Mapping chỉ auto-map khi rules rỗng; thay nguồn/template vẫn giữ rules trỏ header cũ. `ExcelMappingView.jsx:80-85`; exporter bỏ qua cột không khớp (`utils/excel.js:386-389`). | Validate rules với schema mới; yêu cầu remap khi không tương thích; không xuất silently với cột thiếu. |
| F18 | ID-photo giới thiệu HEIC nhưng verifyDocumentSignature không hỗ trợ .heic/.heif nên bị từ chối ngay. Bước tách nền khi engine lỗi chỉ console, nút Next bật lại dù mask null nên bấm không làm gì. | Bỏ nhãn HEIC hoặc thêm decoder thật; UI lỗi + retry; khóa Next khi chưa có mask hợp lệ. |
| F19 | Search không tìm name_ja; modal thiếu Escape/focus trap; nhiều label VI cố định khi đổi EN/JA. `CommandPalette.jsx`, SettingsModal, ToolContainer; document lang vẫn vi. | Quy ước vi/en/ja thống nhất; kiểm 3 ngôn ngữ, keyboard, dialog và ngôn ngữ tài liệu. |
| F20 | Lề Editor mặc định `p-[2.5cm]` không tồn tại trong danh sách MARGINS (1.27/2/2.54cm). UI quan sát hiển thị “Hẹp” dù config 2.5 cm. | Một cấu hình chuẩn dùng chung giữa control, preview và export; đối chiếu kích thước đầu ra. |
| F21 | WiFi QR nối SSID/password trực tiếp, không escape dấu phân cách; chuỗi chứa `;` hoặc `\\` tạo payload nhập nhằng. `BarcodeQrStudioView.jsx:145`. | Escape theo định dạng WiFi QR, test giải mã vòng kín; thử bằng scanner thật trước nghiệm thu. |

## 5. Ma trận giao diện đã đo

Số dưới đây là document scrollWidth tại viewport 320 px sau khi tải xong trang đầu. 390 px và 1440 px không ghi nhận document overflow ở các trang đầu đã kiểm; điều đó không bảo đảm nội dung tải lên hoặc popup không tràn.

| Công cụ | scrollWidth @320 | Kiểm tra sâu cần bổ sung |
|---|---:|---|
| PDF Toolkit | 320 | Split/merge/recompress, file mã hóa, tab/history, ZIP trùng tên |
| Image convert | 323 | Pixel limits, resize, alpha, GIF frame đầu, download/compare |
| Screen capture | 344 | Quyền hệ điều hành, clipboard từ chối, touch annotation, undo |
| QR / Barcode | 347 | Scan payload, ký tự đặc biệt, batch CSV, format invalid |
| OmniConvert | 377 | Đầu ra từng cặp định dạng; số dòng/trang/ảnh phải đầy đủ |
| Excel Mapping | 357 | Đổi schema, công thức/style/merge/header/footer của template thật |
| Editor Studio | 377 | Đã vào màn hình soạn: bố cục không phù hợp mobile; cần QA file export |
| Invoice Studio | 377 | Bộ hóa đơn thật khử nhạy cảm, ZIP lồng nhau, xác nhận/xuất theo công ty |
| Auto-BI | 364 | Fixture locale/negative/invalid; đối chiếu file báo cáo |
| Accounting reconcile | 314 | Golden result nghiệp vụ do kế toán duyệt |
| Watermark | 377 | Header nhiều section; vị trí/layout mỗi định dạng; Word/Excel/PPT thực tế |
| ID-photo | 363 | Model tải lỗi/offline, camera, mask, crop, DPI và sheet in thực tế |

## 6. Hiệu năng và cleanup

### Hiện trạng đo được

- Hub dist khoảng 33 MiB trên đĩa; riêng WASM ONNX ~23.9 MB chưa gzip (~5.66 MB gzip). **Không phải toàn bộ 33 MiB tải ở trang chủ.**
- Đồ thị import tĩnh entry hub gồm index 254,513 B + QR vendor 48,754 B + jsPDF vendor 387,249 B = **690,516 B JS chưa nén**. HTML production preload cả QR và jsPDF. Cần xem lại manualChunks/shared dependency graph; route lazy chưa bảo đảm dependency nặng lazy.
- Vendor lớn: ExcelJS ~937 KB; PDF.js ~869 KB; XLSX ~500 KB; pdf-lib ~438 KB. Số này không cộng thành chi phí trang chủ.
- PDF Toolkit khởi tạo cả ba panel. Nén PDF giữ preview base64, tạo nhiều bản sao dữ liệu; thiếu lifecycle cleanup (F09).
- Lint đang bỏ qua mọi biến bắt đầu chữ hoa để tránh false positive JSX. Bỏ ngoại lệ trực tiếp tạo **623 cảnh báo, gồm nhiều component vẫn đang dùng**. Bộ lọc bảo thủ “identifier chỉ xuất hiện một lần” cho **145 ứng viên**, không phải 145 dead-code đã được xác nhận. Có cả React import phụ thuộc JSX transform; không xóa tự động theo con số này.

### Các nhóm cleanup và điều kiện

| Nhóm | Ứng viên cụ thể | Quyết định |
|---|---|---|
| Import không dùng | AlertTriangle trong ToolErrorBoundary; UploadCloud/PieChart/ArrowDownRight/Filter… trong AutoBiView | Kiểm bằng parser JSX-aware rồi xóa, không cần đổi chức năng |
| File utility mồ côi | `standalone/image-convert/src/utils/converter.js`, `zipExporter.js` đã được App thay bằng core; Header riêng trong hub không thấy importer | Kiểm toàn repo + entry CLI/public trước xóa; giữ formatters đang dùng |
| Code trùng còn hoạt động | Image convert hub và standalone có hai bộ component/state khác nhau | Hợp nhất view qua core nếu cần duy trì standalone; đây là refactor, không phải dead code |
| Metadata không đúng | core package main trỏ src/index.js không tồn tại, nhưng subpath exports hiện vẫn build được | Bỏ main hoặc tạo root API chỉ khi có chủ đích; không báo đây là lỗi runtime hiện tại |
| Compatibility wrapper | `components/docstudio/DocStudioApp.jsx` chỉ re-export | Có thể là hợp đồng import cũ; tìm mọi consumer trước loại bỏ |
| Mock/UI giả | MOCK_DOCS, AI rewrite giả | Cần chốt sản phẩm theo F04; tách demo rõ ràng |
| Tài liệu không cập nhật | DEVELOPMENT_STATUS ghi 8 active, registry hiện 12; báo cáo cũ có ID PDF trước khi gộp; nhãn UI vẫn AI-Tools, không Toolio | Cập nhật nguồn chuẩn sau khi chốt tên và phạm vi sản phẩm |
| Sáu công cụ đang phát triển | tools-in-development và core views tương ứng | **Không tự xóa.** Tài liệu repo nêu rõ đang tạm dừng, không phải bỏ vĩnh viễn |
| Legacy/standalone và mock XLSX | Các app riêng, fixtures mẫu | Chốt app nào còn người dùng/entry CLI trước archive; fixture test không phải junk |
| CSS | Tailwind scan cả core gồm view tạm dừng | Phân tích selector/bundle trước thu hẹp glob; tránh mất class động hoặc standalone |

Không cam kết xóa import sẽ giảm dung lượng tải đáng kể vì bundler có thể đã tree-shake chúng. Chỉ tuyên bố cải thiện hiệu năng khi so sánh build/network/memory trước–sau. Không thêm service worker/cache lớn hay Web Worker hàng loạt khi chưa có số đo cho tác vụ cần tối ưu.

## 7. Kế hoạch xử lý đề xuất

### Đợt 1 — Ngăn kết quả sai và mất dữ liệu

- F01/F02/F03/F16/F17, regression fixtures đi cùng từng lỗi.
- Chốt và xử lý F04/F05/F06: AI giả, PDF raster, PPTX mất nội dung.
- Vá dependency có chọn lọc F07, giữ định dạng xuất hiện hành.
- Tiêu chí: không còn silent truncation, báo cáo đúng nguồn và số liệu, DOCX đúng quan hệ/header; lint/test/build/audit đạt hoặc có ngoại lệ được duyệt với đường dùng chứng minh rõ.

### Đợt 2 — Giao diện và độ bền

- F08–F15, F18–F21; ưu tiên header chung rồi editor và accessible dialogs/tabs.
- Chuẩn hóa queue metadata, validation, download/URL lifecycle và unique filenames.
- Test desktop 1440, tablet 768, mobile 390 và 320; đủ trạng thái rỗng/đang chạy/thành công/lỗi; VI/EN/JA; keyboard và touch.
- Tiêu chí: không document overflow ngoài ý muốn, công cụ lỗi không chặn công cụ khác, retry/cancel rõ ràng, không tải về thiếu file.

### Đợt 3 — Cleanup có bằng chứng và tối ưu

- Lập import graph gồm hub, standalone, scripts/CLI, tests, dynamic imports; gỡ ứng viên chỉ sau khi chứng minh không reachable.
- Xóa import/file mồ côi, hợp nhất phần trùng đã được duyệt; giữ lịch sử và khả năng rollback theo commit nhỏ.
- Tối ưu manualChunks để QR/jsPDF không vào initial load nếu không cần; PDF panel chỉ mount khi dùng; model ảnh chỉ tải khi bước tương ứng cần.
- Tách engine lớn khỏi component UI: Auto-BI, Watermark, Invoice; chỉ tách phần có lợi cho test/reuse, tránh dựng abstraction dư thừa.
- Tiêu chí: bundle entry giảm so với 690,516 B baseline; không tăng tải route khác đáng kể; đo peak heap và main-thread responsiveness trên cùng fixture/máy. Đặt budget sau khi có network/profiler baseline.

### Đợt 4 — Nghiệm thu chức năng thực tế

- Ma trận mỗi công cụ × file chuẩn/file hỏng/file lớn × output format; kiểm chính file tải về, không chỉ thông báo thành công.
- PDF: số trang, text/layer nếu cam kết giữ, kích thước trang; Office: mở trong ứng dụng tương ứng, đủ dữ liệu/công thức/header/layout; ZIP: đủ mục và tên riêng; QR: scan được; ảnh thẻ: pixel/DPI/crop/sheet.
- Kế toán và hóa đơn: mẫu thật đã khử nhạy cảm + đáp án do người phụ trách nghiệp vụ duyệt. Không tự thay mẫu, thuế suất hay quy tắc nghiệp vụ dựa vào cleanup.
- CI bổ sung smoke/E2E cho luồng chính và engine tests hiện còn trống; tránh test chỉ khớp literal source.
- Sau nghiệm thu và cho phép riêng mới commit/push/deploy, rồi kiểm production.

## 8. Những điểm cần chủ sở hữu xác nhận trước triển khai

1. **Duyệt đợt 1 trước?** Đề xuất sửa lỗi số liệu/xuất file và dependency trước khi cleanup diện rộng.
2. **Phạm vi sản phẩm:** tiếp tục giữ cả standalone/CLI và sáu công cụ đang phát triển, hay archive một số? Mặc định đề xuất giữ cho đến khi có quyết định rõ; không coi chúng là junk.
3. **Cam kết chuyển đổi:** PDF nén có được phép raster mất text/form? PPTX cần giữ nguyên bố cục hay chỉ trích nội dung? Đề xuất UI chỉ cho phép cam kết đã kiểm chứng; tính năng chưa đạt thì khóa hoặc gắn giới hạn cụ thể.
4. **Editor và AI:** đề xuất khóa rewrite giả, gắn nhãn demo cho mẫu; AI thật và lưu workspace là hạng mục riêng cần phạm vi/chi phí/runtime được duyệt.
5. **Thương hiệu và ngôn ngữ:** Toolio là tên mới cần thay toàn bộ AI-Tools hay chỉ tên gọi dự án? Mức hoàn thiện VI/EN/JA mong muốn? Đề xuất chưa đổi thương hiệu trong đợt sửa lỗi.
6. **Nghiệp vụ số liệu:** quy ước locale và xử lý ô lỗi của Auto-BI; nguồn fixture/golden cho kế toán. Không mặc định ô lỗi = 0.

Các quyết định 2–6 có thể chốt lần lượt khi đến hạng mục phụ thuộc. Không cần chờ chúng để chuẩn bị regression tests cho lỗi đã tái hiện, nhưng báo cáo này chưa thực hiện sửa chữa.

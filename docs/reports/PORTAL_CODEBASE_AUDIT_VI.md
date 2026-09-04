# Báo cáo rà soát codebase và khả năng thực thi AI-Tools Portal

**Ngày rà soát:** 14/08/2026  
**Phạm vi:** toàn bộ workspace `ai-tools`, gồm portal, các miniapp, package dùng chung, backend AI và ứng dụng hóa đơn legacy.  
**Phương pháp:** đọc mã nguồn và cấu hình; đối chiếu luồng frontend/backend; build toàn workspace; lint; kiểm tra dependency; biên dịch cú pháp Python; chạy các script kiểm thử hiện có; smoke test portal và các luồng AI bằng trình duyệt.

> Đây là ảnh chụp hiện trạng tại thời điểm audit ban đầu. Đợt hardening P0 đầu tiên đã được triển khai sau đó; xem [P0_IMPLEMENTATION_REPORT_VI.md](./P0_IMPLEMENTATION_REPORT_VI.md) để biết thay đổi, bằng chứng kiểm thử và các điều kiện còn thiếu trước production.

### Quyết định sản phẩm đã được xác nhận

Ngày 14/08/2026, chủ sở hữu sản phẩm đã xác nhận:

- Portal **được phép upload dữ liệu lên backend/cloud**.
- Ba miniapp ưu tiên sản xuất đầu tiên là **Đối chiếu kế toán**, **Đề nghị thanh toán** và **Chuyển đổi ảnh**.
- Đầu ra tài chính/pháp lý chỉ mang tính **tham khảo**, không phải quyết định hay phê duyệt chính thức.
- Miniapp cần AI phải dùng model thông qua **Antigravity runtime/SDK**, không gọi trực tiếp API Gemini, OpenAI hoặc nhà cung cấp model khác.

Các quyết định này được phản ánh trong kiến trúc và thứ tự triển khai bên dưới.

## 1. Kết luận điều hành

Portal hiện có **14 mục công cụ**, nhưng chưa thể coi là một miniapp hub sẵn sàng cho người dùng cuối. Ba nhóm chính:

| Nhóm | Miniapp | Đánh giá ngắn |
|---|---|---|
| Có thể dùng với giới hạn | Chuyển ảnh WebP, Tách PDF, Gộp PDF | Hoạt động phía trình duyệt cho file thông thường; thiếu giới hạn tài nguyên, xử lý lỗi và kiểm thử tải lớn |
| Prototype/hẹp/thủ công | Certificate Studio, Excel Mapping cục bộ, Editor Studio, Invoice Hub phía client, Auto-BI, Accounting Reconcile | Có thể tạo đầu ra trong các trường hợp dữ liệu phù hợp, nhưng phụ thuộc mạnh vào mẫu và heuristic; một số tên/mô tả vượt quá khả năng thật |
| Không đáng tin cậy cho tác vụ được quảng bá | PDF Overlay, Legal Studio, Long Translator, Contract Auditor, Policy Assistant; AI Excel Mapping | Thiếu luồng cốt lõi, lỗi tích hợp, dùng dữ liệu giả/hard-code hoặc không có nguồn chính sách phiên bản hóa |

Các vấn đề mang tính hệ thống:

1. **Nhãn “100% client-side/không upload” không đúng cho toàn portal.** Một số tính năng gọi backend AI; backend có endpoint nhận file. Cần công bố theo từng công cụ, không công bố chung.
2. **Các luồng AI chính đang hỏng contract frontend/backend.** URL endpoint sai, kiểu payload sai, schema kết quả không tương thích và URL backend bị hard-code.
3. **Long Translator không phải trình dịch tài liệu dài.** Không có upload file, OCR, parser PDF/DOCX, chia đoạn, bộ nhớ ngữ cảnh, hàng đợi, checkpoint hay phục hồi. Smoke test văn bản ngắn cũng trả về `Method Not Allowed`.
4. **Contract Auditor có rủi ro nghiêm trọng.** Nó không đọc hợp đồng/biên bản theo nghĩa nghiệp vụ và có nhánh tự tạo số hóa đơn, ngày, nhà cung cấp và số tiền giả khi trích xuất thất bại; đầu ra Excel vẫn có dáng vẻ một báo cáo kiểm toán.
5. **Code bị nhân bản lớn.** Tám package `docstudio-*`, `packages/core` và một phần portal chứa nhiều cây mã giống hệt nhau. Một số package thực tế gọi view từ `core`, khiến bản sao cục bộ trở thành code chết.
6. **Không có nền tảng vận hành tối thiểu:** CI, test suite đúng nghĩa, auth/RBAC, quota, giới hạn file, theo dõi job, logging/telemetry, retention, retry/cancel/resume và tài liệu triển khai.
7. **Dependency/reproducibility chưa đạt:** lockfile không đồng bộ workspace; `npm ci --dry-run` thất bại; backend Python yêu cầu một phiên bản package không tồn tại trên index hiện tại.

Khuyến nghị: **không phát hành portal như một hub sản xuất ở trạng thái hiện tại**. Có thể mở beta nội bộ sau khi hoàn thành P0, với nhãn trạng thái và phạm vi hỗ trợ rõ cho từng công cụ.

## 2. Kiến trúc hiện tại

### 2.1 Thành phần

- `hub`: React 19 + Vite, lazy-load 14 miniapp từ một registry.
- `packages/core`: UI, hook, business logic và view dùng chung.
- `packages/agent-backend`: FastAPI cho các tác vụ AI/agent.
- Tám package `docstudio-*`: các shell Vite độc lập cho các studio tài liệu.
- Các miniapp độc lập: `image-convert`, `contract-auditor`, `auto-bi`, `policy-assistant`, `accounting-reconcile`.
- `invoice-webapp`: FastAPI + frontend vanilla legacy, tách khỏi luồng Invoice Hub trong React.

### 2.2 Cách portal ghép miniapp

Registry của hub khai báo 14 tool và lazy-load component tương ứng. Hub có tìm kiếm nhanh, theme, đổi ngôn ngữ và error boundary. Tuy nhiên:

- Không có router/deep link; trạng thái miniapp đang mở chỉ nằm trong React state. Refresh hoặc chia sẻ URL không giữ đúng công cụ.
- Không có manifest năng lực: input, output, giới hạn, privacy mode, backend dependency, trạng thái beta/ready.
- Quy ước locale không thống nhất (`vi/vn`, `ja/jp`); nhiều miniapp không thực sự dùng `displayLang`.
- Không có lịch sử job, trạng thái backend, phiên bản công cụ hay khả năng kiểm tra readiness.

## 3. Trả lời trực tiếp về ứng dụng dịch tài liệu dài

### 3.1 Có thể upload tài liệu gốc và dịch toàn bộ không?

**Không.** Giao diện Long Translator hiện chỉ có ô nhập văn bản. Không có input upload PDF/DOCX, không có OCR, không đọc cấu trúc tài liệu, bảng, ảnh, header/footer hoặc layout của tài liệu nguồn.

Luồng hiện tại gửi toàn bộ nội dung ô text trong **một request duy nhất**, với `batch_index=1` và `total_batches=1`. Backend cũng không có bộ điều phối chia tài liệu thành nhiều đoạn, không giữ ngữ cảnh giữa các đoạn và không xây lại tài liệu nguồn.

### 3.2 Có giới hạn dịch thuật không?

Không có giới hạn ký tự/trang được khai báo trong UI hoặc backend. Điều này **không có nghĩa là không giới hạn**; ngược lại, hệ thống chưa quản trị các giới hạn thực tế:

- kích thước request của trình duyệt, reverse proxy và server;
- cửa sổ ngữ cảnh và giới hạn output token của model;
- timeout, rate limit và chi phí nhà cung cấp;
- bộ nhớ của process và trình duyệt;
- không có cancel, retry, resume, checkpoint hoặc idempotency.

Vì vậy không thể cam kết dịch ổn định tài liệu dài ở bất kỳ số trang cụ thể nào.

### 3.3 Nó có hoạt động với văn bản ngắn không?

Trong smoke test, nhập “Xin chào thế giới” rồi bấm dịch trả về **“Lỗi dịch thuật: Method Not Allowed”**. Nguyên nhân từ mã nguồn gồm:

- frontend hard-code base URL `http://localhost:8000`;
- frontend gọi `/translate`, trong khi backend khai báo route dưới `/api/agents/...`;
- schema block backend và renderer frontend không dùng cùng tên loại block.

Legal Studio cũng trả về `Method Not Allowed` trong smoke test và còn gửi `FormData` qua nhánh xử lý JSON, nên payload có thể biến thành `{}`.

### 3.4 Đầu ra được dự kiến và đầu ra thực tế

- **Dự kiến:** lưu các block dịch trong IndexedDB, xem trước theo ngôn ngữ, xuất DOCX và in ra PDF.
- **Thực tế hiện tại:** request thất bại; chưa tạo được bản dịch. Kể cả sau khi sửa endpoint, schema `heading/paragraph/table/list/signature` của backend không khớp renderer đang chờ `h1/p/ul/...`, nên hiển thị/xuất file vẫn chưa đáng tin cậy.

Muốn trở thành trình dịch tài liệu dài thực sự, cần một job pipeline: upload → kiểm tra file → trích xuất/OCR → phân đoạn ngữ nghĩa → dịch có glossary/context → QA đầy đủ đoạn/số/tên/bảng → tái dựng DOCX/PDF → cho phép resume/cancel và công bố giới hạn/chi phí.

## 4. Đánh giá từng miniapp

### 4.1 WebP Image Converter — **Có thể dùng với giới hạn**

**Luồng thật:** đọc ảnh bằng browser, vẽ lên canvas, xuất WebP; tải từng file hoặc ZIP.

**Đầu ra:** `.webp` hoặc ZIP chứa nhiều `.webp`.

**Điểm đạt:** luồng cơ bản hoạt động client-side, không phụ thuộc backend.

**Giới hạn/rủi ro:**

- UI nhận nhiều extension, nhưng khả năng đọc thật phụ thuộc decoder của trình duyệt; TIFF không thể được cam kết trên mọi trình duyệt.
- GIF/WebP/AVIF động sẽ bị phẳng thành một frame.
- Mất metadata và có thể mất profile màu.
- Giữ data URL, object URL và blob trong bộ nhớ; không có giới hạn số file, dung lượng hoặc pixel, dễ treo với ảnh lớn.
- Xử lý tuần tự trên main thread; không có worker/cancel.
- CLI có nhánh kiểm tra `statSync` trên đường dẫn output chưa tồn tại, có thể lỗi khi chuyển một file tới tên output không kết thúc bằng `.webp`.

### 4.2 PDF Split — **Có thể dùng với giới hạn**

**Luồng thật:** mở PDF bằng pdf.js, tạo thumbnail cho từng trang, dùng pdf-lib tạo file trang riêng hoặc file chứa các trang chọn.

**Đầu ra:** nhiều PDF một trang hoặc một PDF gồm các trang đã chọn.

**Giới hạn/rủi ro:** toàn bộ PDF và thumbnail base64 được giữ trong RAM; render tuần tự; không có giới hạn file/trang, progress/cancel; PDF mã hóa/hỏng chủ yếu chỉ log console; tải nhiều file riêng lẻ có thể bị browser chặn.

### 4.3 PDF Merge — **Có thể dùng với giới hạn**

**Luồng thật:** đọc nhiều PDF, hiển thị thumbnail, gộp bằng pdf-lib.

**Đầu ra:** `merged_N_files.pdf`.

**Giới hạn/rủi ro:** lọc nghiêm theo MIME `application/pdf` có thể từ chối PDF hợp lệ; tải toàn bộ file vào RAM; thiếu giới hạn, cancel/progress; PDF mã hóa/hỏng xử lý lỗi chưa thân thiện.

### 4.4 PDF Overlay — **Không thực hiện tác vụ theo tên**

Không có upload/open một PDF nguồn và không overlay nội dung lên PDF đó. Đây thực chất là trình dựng mẫu chứng chỉ bằng HTML + JSON, trong đó người dùng tự lấy HTML/JSON do AI bên ngoài tạo rồi dán vào.

**Đầu ra:** in trình duyệt/PDF và DOCX xấp xỉ từ HTML.

**Rủi ro bảo mật cao:** dùng `dangerouslySetInnerHTML`; hàm `sanitizeHtml` không phải sanitizer bảo mật, chỉ dọn markdown/CSS. Script, event handler, URL và SVG độc hại có thể lọt qua. Dữ liệu động được nội suy không escape; cửa sổ in cũng `document.write` HTML không tin cậy và tải Tailwind CDN.

**Khuyến nghị:** tạm ẩn hoặc đổi tên thành “HTML Certificate Template Builder”; dùng DOMPurify với allowlist hoặc sandboxed iframe, CSP và pipeline xuất file không chạy nội dung chủ động.

### 4.5 Legal Studio — **Không hoạt động end-to-end**

**Khả năng thật:** chỉ nhận raw text; không upload tài liệu. Luồng dịch AI hỏng do endpoint/payload/storage contract. Hook `useLocalStorage` trả tuple nhưng component destructure như object, khiến hàm lưu/xóa không tồn tại.

**Đầu ra dự kiến:** Markdown đa ngôn ngữ, DOCX, in/PDF. **Đầu ra thực tế:** smoke test trả `Method Not Allowed`.

### 4.6 Long Translator — **Không hoạt động; không phải dịch tài liệu dài**

Chi tiết tại mục 3. Đây là ưu tiên P0/P2 nếu dịch thuật là năng lực chiến lược.

### 4.7 Certificate Studio — **Prototype thủ công**

**Luồng thật:** hiển thị chứng chỉ từ JSON. Người dùng sao chép prompt, đưa tài liệu sang Gemini/NotebookLM bên ngoài, rồi dán JSON kết quả về portal.

**Không có:** upload, OCR, phân tích hoặc dịch bên trong app.

**Đầu ra:** trang A4 qua print/PDF.

**Rủi ro:** dữ liệu mẫu làm app trông như đã phân tích; props giữa wrapper và page không đồng nhất; SVG từ JSON được inject không sanitize; localStorage không phù hợp cho tài liệu lớn.

### 4.8 Excel Mapping — **Khả dụng hẹp ở chế độ cục bộ; AI mapping hỏng**

**Luồng thật:** đọc sheet đầu tiên, dò header/footer bằng heuristic, map cột nguồn sang template, xuất workbook giữ một phần style/merge/formula.

**Đầu ra:** `.xlsx` đã map.

**Giới hạn:**

- chỉ sheet đầu; dò header trong vùng đầu và dựa keyword footer;
- dòng trống/sparse có thể làm dừng vùng dữ liệu;
- header merge/trùng hoặc template không chuẩn dễ sai;
- chỉ map trực tiếp một-một; chưa có transformation thực tế;
- hiệu chỉnh công thức/merge dựa regex và heuristic;
- lưu template nhị phân trong localStorage dễ vượt quota;
- AI auto-map gọi sai endpoint.

### 4.9 Editor Studio — **Prototype định dạng tài liệu có thể dùng**

**Luồng thật:** nhập Markdown/text/DOCX, áp rule và template, xem trước, xuất DOCX hoặc print/PDF.

**Đầu ra:** DOCX, print/PDF, file template text.

**Giới hạn:** dashboard dùng dữ liệu mock; “AI rewrite” là `setTimeout` với thay thế hard-code; kiểm tra/format là heuristic; nhận `.doc` dù thư viện Mammoth hỗ trợ DOCX chứ không hỗ trợ tốt định dạng `.doc` legacy; không có persistence/versioning/collaboration thực.

### 4.10 Invoice Hub — **Khả dụng hẹp, chưa đúng lời hứa đầu ra**

**Luồng React:** parse XML/PDF/ZIP ngay client. PDF chỉ đọc text, không OCR ảnh scan; extraction dựa regex và một số vendor pattern. XML thiếu ngày có thể lấy ngày hiện tại. Khi chỉ thấy tổng tiền, code có thể suy ngược VAT 8%, tạo cảm giác chính xác giả. Dedup theo amount/date có thể false positive.

**Đầu ra React:** workbook tổng hợp `.xlsx` mới; **không điền vào mẫu `Mẫu ĐNTT.xlsx`** như thông điệp sản phẩm gợi ý.

`invoice-webapp` legacy có endpoint điền template Excel, nhưng không nối với hub. Root workspace khai báo nó như npm package dù không có `package.json`; script dev không chạy. Backend legacy dùng `extractall` với ZIP không tin cậy, có nguy cơ ZIP Slip/zip bomb.

### 4.11 Contract Auditor — **Không được dùng cho quyết định nghiệp vụ**

Tên gợi ý đối soát ba bên, nhưng thực tế:

- không có luồng đọc nội dung hợp đồng; thông tin hợp đồng là field mặc định/thủ công;
- file nghiệm thu chỉ được kiểm tra “có file”, không đọc nội dung;
- UI cho ZIP nhưng parser chỉ xử lý XML/PDF;
- khi parse PDF/XML thất bại, code có nhánh gán nhà cung cấp, mã số thuế, số hóa đơn, ngày và số tiền cố định/giả;
- audit chủ yếu so tổng ngân sách, sự hiện diện file và thuế, không đối chiếu điều khoản, deliverable, mốc nghiệm thu, ngày hay số tiền nghiệm thu.

**Đầu ra:** Excel audit report. Vì báo cáo này có hình thức chính thức dù dữ liệu có thể được bịa, đây là rủi ro tài chính/kiểm soát cao nhất. Cần tắt export hoặc gắn watermark “demo” ngay P0; tuyệt đối không fallback bằng dữ liệu giả.

### 4.12 Auto-BI — **Bộ tổng hợp cơ bản, không phải AI BI**

**Luồng thật:** đọc sheet đầu, suy kiểu từ dòng đầu, chọn dimension text và metric numeric đầu tiên, tổng hợp và vẽ top 8 bằng CSS.

**Đầu ra:** workbook tóm tắt `.xlsx` và biểu đồ trên màn hình.

**Giới hạn:** parse số theo locale dễ sai (`1.234,56`); missing/invalid có thể bị tính như 0; lựa chọn field quá đơn giản; biểu đồ có edge case với số âm; insight là câu tĩnh, không phải phân tích AI.

### 4.13 Policy Assistant — **Calculator/FAQ tĩnh; không an toàn để tư vấn tuân thủ**

**Luồng thật:** bảng định mức và FAQ hard-code; tính ngân sách công tác với giả định cố định. Số ngày bị cố định thay vì tính từ khoảng ngày; vé máy bay và hệ số vai trò là số mặc định.

**Đầu ra:** Excel dự toán công tác phí.

Không có kho chính sách, citation, version/effective date hay phê duyệt nội dung. Code vẫn nêu ngưỡng chứng từ thanh toán không dùng tiền mặt 20 triệu đồng, trong khi quy định áp dụng từ 01/07/2025 sử dụng ngưỡng 5 triệu đồng cho các trường hợp liên quan. Cần xác nhận chi tiết theo loại thuế/chi phí với bộ phận pháp chế-kế toán và nguồn chính thức: [Nghị định 181/2025/NĐ-CP](https://vanban.chinhphu.vn/?docid=214336&lead=MGM&pageid=27160), [bài hướng dẫn chính sách của Chính phủ](https://xaydungchinhsach.chinhphu.vn/cac-khoan-chi-duoc-tru-va-khong-duoc-tru-khi-xac-dinh-thu-nhap-chiu-thue-119250714085640244.htm).

### 4.14 Accounting Reconcile — **Có thể dùng cho đúng mẫu công ty**

**Luồng thật:** đọc file BR/ledger theo tên sheet, vị trí header/cột cố định; chuẩn hóa số hóa đơn; đối chiếu số tiền/thuế; xuất workbook kết quả nhiều sheet.

**Đầu ra:** `Ket_qua_doi_chieu.xlsx`.

**Giới hạn:** phát hiện BR bằng tên sheet; vị trí dòng/cột hard-code; `parseFloat` không an toàn cho định dạng số locale; BR trùng số hóa đơn chỉ lấy bản ghi đầu thay vì aggregate; so float tuyệt đối không tolerance; chỉ bỏ zero đầu có thể gây collision. Cần fixture thật cho từng mẫu trước khi dùng rộng.

## 5. Chất lượng kỹ thuật và khả năng tái lập

### 5.1 Kết quả kiểm tra

| Kiểm tra | Kết quả | Ý nghĩa |
|---|---|---|
| `npm run build:all` | Thành công cho các workspace JS | Mã có thể bundle, nhưng không chứng minh luồng nghiệp vụ hoạt động |
| Hub build | Có chunk office khoảng 1.74 MB minified, vendor khoảng 1.12 MB, PDF worker khoảng 1.23 MB | Tải nặng; có cảnh báo circular chunk và chunk vượt ngưỡng |
| `npm run lint --workspaces --if-present` | Thất bại | Mỗi bản sao docstudio lặp 19 lỗi; tổng lỗi bị nhân lên do copy |
| ESLint trực tiếp `hub/src` + `packages/core/src` | 110 lỗi | Nhiều code chết/unused, ref đọc khi render, effect/case scope không an toàn |
| `npm ls --depth=0` | Thất bại | Bốn workspace bị báo unmet do lock/package tree không đồng bộ |
| `npm ci --dry-run` | Thất bại | Không thể cài reproducible từ lockfile hiện tại |
| `npm audit` | Không chạy được | Cây dependency không hợp lệ; chưa thể kết luận an toàn dependency |
| Python `compileall` | Thành công | Chỉ xác nhận cú pháp |
| Khởi động backend trong môi trường hiện tại | Không thể | Thiếu FastAPI/uvicorn/python-multipart/SDK |
| Resolve `google-antigravity>=1.0.0` | Không thể | Index hiện chỉ có nhánh 0.1.x; version constraint không tồn tại |
| Test hiện có | Không phải suite đầy đủ | Một script regex in kết quả; hai script PDF fail do đường dẫn tuyệt đối tới Downloads |

### 5.2 Dependency và cấu trúc package

- `packages/core` import nhiều thư viện mà không khai báo trực tiếp, dựa vào phantom dependency từ workspace khác.
- `packages/agent-backend/pyproject.toml` tham chiếu `README.md` không tồn tại.
- Root workspace chứa `invoice-webapp` dù thư mục không có `package.json`.
- Không có CI workflow, test runner frontend/backend, migration/deploy config hay tài liệu vận hành đầy đủ.
- README của các app chủ yếu là boilerplate Vite, không mô tả input/output/giới hạn.

### 5.3 Nhân bản code

Kiểm tra hash cho thấy nhiều file prompt, Excel utility, editor library và component giống hệt giữa tám `docstudio-*`, `packages/core` và hub. Đây không chỉ là vấn đề dung lượng:

- bug fix có thể chỉ được áp dụng vào một bản sao;
- lint/build làm cùng một công việc nhiều lần;
- không rõ đâu là canonical implementation;
- package độc lập trông như có source riêng nhưng runtime lại import view từ `core`.

Nên chọn một implementation chuẩn trong `packages/core` hoặc package theo domain; các app standalone chỉ là thin shell. Xóa code copy sau khi có test bảo vệ hành vi.

## 6. Bảo mật, riêng tư và vận hành

### 6.1 Rủi ro P0

- **XSS:** HTML/SVG không tin cậy được inject trong PDF Overlay/Certificate Studio; sanitizer hiện tại không đủ.
- **Path traversal/temp collision:** backend ghép trực tiếp `file.filename` vào thư mục tạm; tên file có thể chứa path, ghi đè hoặc va chạm concurrent job.
- **ZIP Slip/zip bomb:** backend hóa đơn dùng `extractall` trên ZIP do người dùng tải lên, không kiểm tra path/nén/kích thước.
- **Không giới hạn file/request:** không thấy giới hạn upload, số file, số trang, pixel, thời gian hay token.
- **CORS/auth:** backend mở CORS quá rộng, có credentials nhưng không có auth/RBAC/tenant isolation.
- **Hard-code localhost:** production HTTPS sẽ sai host hoặc gặp mixed content.
- **Không timeout/retry/job queue:** request AI dài chạy trực tiếp; không có phục hồi hay cost/rate control.
- **Khai báo privacy sai:** người dùng có thể gửi tài liệu nhạy cảm sang backend/model mà vẫn thấy banner “100% client-side”.

### 6.2 Thiếu kiểm soát sản xuất

- không có mã hóa/retention/xóa dữ liệu theo tenant;
- không có audit trail, job history, correlation ID hoặc observability;
- không có secrets/config validation;
- không có backup/DR/SLO;
- không có human-in-the-loop cho extraction có độ tin cậy thấp;
- không có provenance/citation cho dữ liệu chính sách và kết quả audit.

## 7. Ma trận đầu vào, đầu ra và trạng thái

| Miniapp | Đầu vào thật | Đầu ra thật | Phụ thuộc server | Trạng thái đề xuất |
|---|---|---|---|---|
| WebP Converter | Ảnh browser đọc được | WebP/ZIP | Không | Beta |
| PDF Split | PDF thường | PDF trang/chọn trang | Không | Beta |
| PDF Merge | Nhiều PDF thường | PDF gộp | Không | Beta |
| PDF Overlay | HTML/JSON dán tay | Print/PDF, DOCX gần đúng | Không | Đổi tên + Experimental |
| Legal Studio | Raw text | Hiện lỗi; dự kiến DOCX/PDF | Có | Disabled |
| Long Translator | Raw text | Hiện lỗi; dự kiến DOCX/PDF | Có | Disabled |
| Certificate Studio | JSON dán tay | Print/PDF | Không, AI ngoài portal | Experimental |
| Excel Mapping | XLSX nguồn + template | XLSX đã map | AI optional đang hỏng | Beta theo mẫu |
| Editor Studio | Text/Markdown/DOCX | DOCX/print PDF | Không | Beta |
| Invoice Hub | XML/PDF text/ZIP | XLSX tổng hợp | Không trong hub | Beta theo vendor |
| Contract Auditor | Field thủ công + file | XLSX có thể chứa dữ liệu giả | Không | Disabled |
| Auto-BI | XLSX sheet đầu | XLSX summary + chart | Không | Experimental |
| Policy Assistant | Form/FAQ hard-code | XLSX dự toán | Không | Demo only |
| Accounting Reconcile | BR + ledger đúng mẫu | XLSX đối chiếu | Không | Beta theo mẫu |

## 8. Kế hoạch audit/refactor đề xuất

### P0 — Chặn rủi ro và làm hệ thống tái lập được (1–2 tuần)

1. **Quản trị trạng thái sản phẩm**
   - Gắn `Ready / Beta / Experimental / Disabled` cho từng tool.
   - Tắt Legal, Long Translator, Contract Auditor và AI Mapping cho đến khi có smoke test pass.
   - Xóa mọi fallback bịa dữ liệu; extraction fail phải trả lỗi hoặc yêu cầu xác nhận.
   - Đổi tên/mô tả PDF Overlay; sửa claim privacy theo từng công cụ.

2. **Sửa build/dependency**
   - Chốt package manager, đồng bộ workspace và lockfile; làm `npm ci` pass.
   - Khai báo dependency trực tiếp cho `core`.
   - Sửa workspace/script của `invoice-webapp`.
   - Chọn đúng SDK/version backend, thêm README và lock Python.

3. **Sửa API contract**
   - Dùng biến môi trường cho API origin và versioned base path.
   - Đồng bộ endpoint, JSON/FormData, request/response schema.
   - Sửa hook local storage và schema block translator.
   - Thêm contract test giữa TypeScript/JavaScript client và Pydantic server.

4. **Bảo mật tối thiểu**
   - Auth, CORS allowlist, validation MIME + magic bytes.
   - `basename`/UUID cho upload, temp dir riêng mỗi job, cleanup bảo đảm.
   - Safe ZIP extraction, giới hạn decompressed size/file count.
   - Giới hạn size/count/page/pixel/token/time; rate/cost limit.
   - Sanitize bằng allowlist đã kiểm chứng hoặc render trong sandbox; CSP, không chạy script từ nội dung dán.

**Điều kiện thoát P0:** cài sạch từ lockfile; CI build/lint/test pass; không còn dữ liệu giả; từng tool công bố đúng privacy/input/output/limit; các tool Disabled không thể tạo đầu ra có vẻ chính thức.

### P1 — Hợp nhất nền tảng miniapp hub (2–4 tuần)

1. Tạo **Tool Manifest** duy nhất: id, route, version, readiness, accepted inputs, outputs, privacy mode, backend health, limits, owner.
2. Thêm router/deep links, trang trạng thái và error boundary theo tool.
3. Hợp nhất code copy về package canonical; standalone app là thin shell.
4. Shared file pipeline: validate, progress, cancel, error taxonomy, cleanup và download naming.
5. IndexedDB cho tài liệu/job cục bộ; localStorage chỉ cho preference nhỏ.
6. Test:
   - Vitest cho parser/normalizer/formula với fixture đã ẩn danh;
   - Playwright E2E cho upload → preview → export của mỗi tool;
   - Pytest cho API, security boundary và malformed files;
   - golden-file diff cho XLSX/DOCX/PDF đầu ra.
7. CI: clean install → lint → unit → integration → E2E → build → dependency/security scan.

**Điều kiện thoát P1:** mỗi tool có owner, manifest, test luồng chính/luồng lỗi và giới hạn được enforce; không còn source tree nhân bản.

### P2 — Xây năng lực nghiệp vụ thực (4–8 tuần tùy phạm vi)

#### Long Translator/Legal Studio

- Upload PDF/DOCX; OCR cho scan; tách text và giữ map layout/page.
- Chunk theo đoạn/heading/table, không cắt mù theo ký tự.
- Glossary, translation memory, context window giữa chunk và quy tắc tên/số/ngày.
- Job queue, idempotency, checkpoint, resume/cancel/retry và stream progress.
- Structured model output được validate; phát hiện thiếu đoạn, lệch số, mất bảng.
- Tái dựng DOCX/PDF và báo cáo QA; công bố page/file/token/cost/time limit.

#### Invoice/Contract

- Trích xuất có confidence và evidence theo trang/tọa độ.
- Không suy đoán im lặng; field thấp confidence phải được người dùng xác nhận.
- Schema ba bên thật: hợp đồng ↔ nghiệm thu ↔ hóa đơn, gồm điều khoản, deliverable, mốc, số tiền, thuế và ngày.
- Parser vendor/version có fixture và regression test; OCR nếu nằm trong scope.

#### Policy Assistant

- Kho chính sách có nguồn, phiên bản, ngày hiệu lực/hết hiệu lực và người phê duyệt.
- Citation cạnh từng câu trả lời; rule engine tách khỏi UI.
- Bộ kiểm thử theo ngày hiệu lực và scenario kế toán/pháp lý.

**Điều kiện thoát P2:** đạt ngưỡng định lượng đã thống nhất cho completeness/accuracy/fidelity; mọi kết luận tài chính-pháp lý có evidence và human confirmation khi confidence thấp.

### P3 — Production hardening

- Tenant isolation, RBAC, encryption, retention/deletion, object storage và queue/worker.
- Rate limit/cost budget, secrets management, audit log, metrics/traces/alerts.
- SLO, backup/DR, load test, penetration test, privacy/legal review.
- Release gate theo dữ liệu benchmark thật và canary rollout.

## 9. Thứ tự ưu tiên sản phẩm đã chốt

### Ưu tiên 1 — Đối chiếu kế toán

Mục tiêu: biến `Accounting Reconcile` thành công cụ deterministic, có thể kiểm chứng cho các mẫu BR/ledger được công bố.

- Không dùng AI cho đối chiếu số học và matching thông thường.
- Tạo profile cấu hình cột/sheet/header thay cho hard-code.
- Parse số/ngày theo locale; aggregate invoice trùng; tolerance có cấu hình.
- Hiển thị evidence cho từng kết quả: workbook, sheet, dòng và giá trị nguồn.
- Cho người dùng xác nhận các match mơ hồ trước khi export.
- Đầu ra Excel phải có sheet `Tóm tắt`, `Đã khớp`, `Chênh lệch`, `Không tìm thấy`, `Cần xác nhận` và metadata phiên bản rule.
- Gắn nhãn rõ “Kết quả tham khảo — cần kế toán kiểm tra/phê duyệt”.

### Ưu tiên 2 — Đề nghị thanh toán

Mục tiêu: hợp nhất Invoice Hub React và `invoice-webapp` legacy thành một luồng duy nhất: upload chứng từ → trích xuất → người dùng xác nhận → điền đúng template đề nghị thanh toán.

- XML có cấu trúc phải được parse deterministic trước, không gọi model nếu không cần.
- PDF có text dùng parser/rule trước; PDF scan/ảnh hoặc field mơ hồ mới chuyển sang Antigravity.
- Antigravity chỉ đề xuất field kèm confidence/evidence; không được tự suy VAT, ngày, số tiền hoặc nhà cung cấp khi thiếu dữ liệu.
- Mọi field thấp confidence phải được người dùng xác nhận.
- Bỏ ZIP extraction không an toàn; dùng safe extraction và giới hạn file/decompressed size.
- Dùng template đề nghị thanh toán được version hóa, không xuất workbook tổng hợp chung thay cho mẫu chính thức.
- Kết quả phải có watermark/ghi chú “Bản nháp tham khảo — chưa phê duyệt”.

### Ưu tiên 3 — Chuyển đổi ảnh

Mục tiêu: harden WebP Converter thành công cụ client-side nhanh, ổn định và không cần AI.

- Giới hạn số file, dung lượng và tổng pixel; phát hiện ảnh vượt khả năng trình duyệt.
- Dùng Web Worker/OffscreenCanvas khi khả dụng; có progress và cancel.
- Công bố rõ ảnh động chỉ lấy frame đầu nếu chưa hỗ trợ animation.
- Xử lý tên file trùng trong ZIP; revoke object URL và giải phóng bộ nhớ.
- Chỉ quảng bá định dạng đã được test trên browser hỗ trợ.
- Bổ sung fixture/golden test cho chất lượng, kích thước, orientation và transparency.

### Các miniapp còn lại

- Giữ PDF Split/Merge như beta hỗ trợ sau ba ưu tiên trên.
- Giữ Editor/Auto-BI/Certificate dưới nhãn Experimental.
- Tạm ẩn Contract Auditor, Policy Assistant compliance, Legal/Long Translator đang lỗi.
- Chỉ mở lại AI/document tools sau khi có Antigravity gateway, backend job pipeline, giới hạn rõ và E2E/golden tests.

Cách này cho phép portal có giá trị sớm mà không đánh đổi niềm tin người dùng bằng các đầu ra có vẻ hoàn chỉnh nhưng không phản ánh dữ liệu nguồn.

## 10. Kiến trúc Antigravity-first

### 10.1 Phân biệt API nội bộ và API model

Yêu cầu “không dùng API, dùng model trong Antigravity” được diễn giải như sau:

- **Không gọi trực tiếp API model của Gemini/OpenAI/nhà cung cấp khác** và không đặt API key nhà cung cấp trong frontend.
- Portal vẫn cần **API backend nội bộ** cho upload, xác thực, tạo job, progress, cancel, lưu file tạm, validation và download kết quả. Đây là giao diện của chính ứng dụng, không phải API model bên thứ ba.
- Backend gọi model duy nhất qua **Antigravity SDK/runtime adapter**.

Tài liệu chính thức mô tả Antigravity SDK là Python SDK cho custom agent, chạy trên cùng Antigravity harness và có thể chạy local hoặc triển khai lên cloud: [Google Cloud — Choosing your Antigravity surface](https://cloud.google.com/blog/topics/developers-practitioners/choosing-your-surface-antigravity-20-antigravity-cli-antigravity-ide-or-antigravity-sdk), [Google Codelab — Antigravity ecosystem](https://codelabs.developers.google.com/agentic-ui-automation-with-antigravity).

### 10.2 Kiến trúc đề xuất

```text
Browser / Portal
       |
       | HTTPS: upload, job, progress, result
       v
Portal Backend
  |-- Auth / RBAC / quota
  |-- File validation + object storage
  |-- Deterministic parsers and business rules
  |-- Job queue / worker / audit metadata
  `-- ModelGateway interface
          `-- AntigravityGateway (implementation duy nhất ở production)
                  `-- Antigravity SDK / shared harness / configured model
```

Quy tắc thực thi:

1. **Deterministic-first:** Đối chiếu kế toán và chuyển ảnh không dùng model. Đề nghị thanh toán chỉ dùng model khi parser XML/PDF không đủ.
2. **Model isolation:** component React không biết model name, prompt hay credential; chỉ biết loại job nghiệp vụ.
3. **Structured contract:** Antigravity phải trả schema được validate; output sai schema bị từ chối, không tự “sửa” bằng dữ liệu giả.
4. **Provenance:** lưu harness/model, prompt version, parser/rule version, timestamp, confidence và evidence cho mỗi lần trích xuất.
5. **Human-in-the-loop:** model không được phê duyệt thanh toán/đối chiếu; người dùng xác nhận field mơ hồ và đầu ra luôn là tham khảo.
6. **No-provider fallback:** nếu Antigravity unavailable/quota exceeded, job dừng với lỗi có thể retry; không âm thầm chuyển sang API provider khác.

### 10.3 Việc cần xác minh trước khi code integration

Code hiện tại dùng `from google.antigravity import Agent, LocalAgentConfig`, phù hợp với ví dụ SDK chính thức. Tuy nhiên `pyproject.toml` khóa `google-antigravity>=1.0.0`, trong khi kiểm tra package index tại thời điểm audit chỉ resolve được các bản 0.1.x. Trước P0 implementation cần:

- lấy đúng hướng dẫn cài/version/channel từ Antigravity SDK đang dùng trong môi trường đích;
- xác định cơ chế xác thực cho local development và cloud worker;
- benchmark quota, concurrency, timeout, kích thước document và model availability;
- pin phiên bản thực tế bằng lockfile, không dùng version range chưa kiểm chứng;
- chạy một contract smoke test tối thiểu: text → structured schema và PDF/ảnh → field + evidence.

Nếu portal chạy cho nhiều người trên cloud, không nên phụ thuộc vào một phiên Antigravity Desktop cá nhân đang mở. Nên triển khai backend worker dùng Antigravity SDK/harness được hỗ trợ cho headless/cloud, với quota và identity của môi trường dịch vụ.

## 11. Tiêu chí chấp nhận cho một “miniapp hub” thực sự

Mỗi miniapp chỉ được đánh dấu Ready khi đáp ứng tất cả:

- mô tả đúng khả năng thật; input/output/min-max limit công khai;
- privacy mode và nơi xử lý dữ liệu được hiển thị trước upload;
- kiểm tra file, lỗi rõ ràng, progress/cancel và không tự bịa dữ liệu;
- unit + integration + E2E cho happy path và malformed/adversarial input;
- đầu ra có fixture/golden comparison và provenance khi cần;
- dependency/build tái lập được từ CI;
- owner, version, changelog, telemetry và runbook hỗ trợ;
- với tài chính/pháp lý: version nguồn, citation, confidence và human approval.

## 12. Thông số cần chốt trong discovery của ba miniapp ưu tiên

Các quyết định kiến trúc cấp cao đã có. Khi bắt đầu triển khai cần thu thập fixture và chốt chi tiết sau, không nên đoán từ code hiện tại:

1. Các mẫu BR/ledger, quy tắc match, tolerance và trường hợp invoice trùng của Đối chiếu kế toán.
2. File template đề nghị thanh toán chuẩn, các phiên bản template, danh sách vendor/chứng từ và trường bắt buộc.
3. Loại file tối đa, dung lượng, thời gian giữ dữ liệu, vùng cloud và nhóm người được phép truy cập.
4. Chất lượng WebP mặc định, có cần giữ metadata/ICC/animation hay không.
5. Antigravity execution target cho production: SDK worker local/on-prem hay cloud/headless; identity và quota đi kèm.

Các thông số này ảnh hưởng acceptance test và sizing, nhưng không cản việc bắt đầu P0 về dependency, security, manifest và hợp nhất code.

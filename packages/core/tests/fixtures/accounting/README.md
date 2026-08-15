# Fixture và golden result cho Đối chiếu kế toán

Mỗi file `.json` ở đây là một **bộ chứng từ mẫu kèm kết quả đối chiếu đã được chốt**.
`packages/core/tests/accounting-golden.test.js` chạy tất cả qua đúng pipeline mà miniapp
dùng (`reconcileWorkbooks`), nên khi test xanh thì kết quả kế toán đã duyệt chính là kết
quả người dùng nhìn thấy trên màn hình và trong file xuất.

## Vì sao cần

Kết quả đối chiếu chỉ đáng tin khi có hai thứ: bộ chứng từ đại diện được cho dữ liệu thật,
và một kết quả đúng do người có thẩm quyền xác nhận. Thiếu vế thứ hai thì test chỉ đang
chụp lại hành vi hiện tại của code, kể cả khi hành vi đó sai.

## Cấu trúc một fixture

```jsonc
{
  "name": "Tên ngắn hiển thị trong kết quả test",
  "description": "Bộ này bảo vệ điều gì — nêu rõ tình huống nghiệp vụ",
  "source": "synthetic | real-deidentified",
  "approvedBy": "Người duyệt (bắt buộc với real-deidentified)",
  "approvedOn": "YYYY-MM-DD",
  "workbooks": [
    { "sourceFile": "So_511.xlsx", "sheetNames": ["So 511"], "sheetRows": { "So 511": [[...]] } }
  ],
  "expected": {
    "summary": { "total": 2, "matched511": 2, "...": 0 },
    "report511":  { "<số hóa đơn>": { "ledger": 0, "br": 0, "diff": 0, "status": "MATCH", "needsReview": false } },
    "report33311": { "<số hóa đơn>": { "...": 0, "vatTang": 0 } }
  }
}
```

`sheetRows` giữ nguyên dòng trống để chỉ số mảng khớp đúng số dòng trong Excel — bằng chứng
"dòng N" trong kết quả phải chỉ đúng dòng kế toán mở ra xem.

## Bộ hiện có

| File | Bảo vệ điều gì |
|---|---|
| `khop-hoan-toan.json` | Trường hợp nền: ba nguồn khớp từng đồng. |
| `lech-va-thieu-mot-phia.json` | Phân biệt đúng ba tình huống: lệch số tiền, chỉ có trên sổ, chỉ có trên bảng kê. |
| `br-trung-ban-ghi.json` | Bảng kê tách một hóa đơn thành hai dòng: phải cộng gộp và đánh dấu cần xác nhận. |
| `dinh-dang-so-va-bo-cuc-lech.json` | Số dạng `10.000.000`, dòng trống trên tiêu đề, số 0 đầu số hóa đơn. |
| `vat-hang-tang-va-mtt.json` | Tách riêng VAT hàng tặng; sheet MTT có bố cục cột khác sheet GTGT. |

Tất cả đang là `synthetic`. Chúng khóa được hành vi engine, nhưng **chưa thay thế được
fixture từ dữ liệu thật**: chỉ dữ liệu thật mới cho biết mẫu sổ của công ty có đúng như giả
định hay không.

## Thêm fixture từ dữ liệu thật

```bash
npm run golden:accounting -- --name thang-07-2026 So_511.xlsx So_33311.xlsx BR.xlsx
```

Lệnh này in ra nhật ký đọc từng sheet (dòng tiêu đề, số dòng đọc được) và tạo hai file trong
`fixtures/generated/`:

- `<tên>.review.xlsx` — kết quả đối chiếu đã định dạng, in được, để kế toán soát.
- `<tên>.golden.json` — fixture ứng viên.

Sau đó:

1. Kế toán đối chiếu `.review.xlsx` với chứng từ gốc.
2. **Nếu đúng:** điền `description`, `approvedBy`, `approvedOn` vào `.golden.json` rồi chuyển
   file vào thư mục này. Từ lúc đó CI sẽ giữ nguyên hành vi ấy.
3. **Nếu sai:** báo lại số hóa đơn và giá trị đúng. Sửa engine cho đúng trước, rồi mới sinh
   lại golden. **Không bao giờ sửa golden để test xanh** — làm vậy là khóa lại đúng cái lỗi.

## Khử nhạy cảm trước khi commit

`.golden.json` chứa nguyên dữ liệu nguồn. Trước khi commit phải thay tên khách hàng, mã số
thuế và số hóa đơn thật bằng dữ liệu giả, giữ nguyên **cấu trúc** (số dòng tiêu đề, vị trí
cột, định dạng số, các dòng trùng) vì đó mới là thứ fixture cần bảo vệ.

## Khi đổi quy tắc đối chiếu

`ACCOUNTING_RULE_VERSION` và `DEFAULT_TOLERANCE` được ghim trong test. Đổi quy tắc sẽ làm
test đỏ — đó là chủ ý: mỗi lần đổi quy tắc phải trình kế toán duyệt lại golden, không được
đổi lặng lẽ.

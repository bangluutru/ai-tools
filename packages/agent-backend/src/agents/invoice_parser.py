from google.antigravity import Document, Image
from ..schemas.invoice import InvoiceBatchResult
from ..services.antigravity_gateway import gateway

async def parse_invoices(
    file_paths: list[str], source_names: list[str] | None = None
) -> InvoiceBatchResult:
    names = source_names or [f"file-{index + 1}" for index in range(len(file_paths))]
    inputs = [
        "Trích xuất các hóa đơn sau. Mỗi file được đặt sau một dòng SOURCE_FILE."
    ]
    for file_path, source_name in zip(file_paths, names, strict=True):
        inputs.append(f"SOURCE_FILE: {source_name}")
        if file_path.lower().endswith(".pdf"):
            inputs.append(Document.from_file(file_path))
        else:
            inputs.append(Image.from_file(file_path))

    return await gateway.structured(
        prompt=inputs,
        system_instructions="""Bạn trích xuất dữ liệu hóa đơn để lập bản nháp tham khảo.
Chỉ ghi giá trị nhìn thấy trong tài liệu. Không suy ngược VAT, không dùng ngày hiện tại,
không tạo nhà cung cấp, số hóa đơn hoặc số tiền khi không đọc được. Field không chắc chắn
phải để null, thêm vào missing_fields và đặt needs_review=true. Mỗi giá trị quan trọng
phải có evidence ngắn gắn với source_file. Trả đúng schema và không phê duyệt thanh toán.""",
        response_schema=InvoiceBatchResult,
    )

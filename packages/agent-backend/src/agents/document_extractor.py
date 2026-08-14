from google.antigravity import Document, Image
from ..schemas.document import ExtractedDocument
from ..services.antigravity_gateway import AntigravityGateway, gateway

async def extract_document(file_path: str, model: str = None):
    active_gateway = AntigravityGateway(model=model) if model else gateway
    if file_path.lower().endswith(".pdf"):
        media = Document.from_file(file_path)
    else:
        media = Image.from_file(file_path)
    return await active_gateway.structured(
        prompt=["Trích xuất toàn bộ nội dung nhìn thấy trong tài liệu.", media],
        system_instructions="""Bạn là chuyên gia phân tích tài liệu.
Chỉ trích xuất nội dung có bằng chứng trong file và trả JSON đúng schema.
Nhận diện tiêu đề, bảng, chữ ký, ngày tháng và mô tả dấu mộc nếu nhìn thấy.
Không tự bổ sung nội dung bị thiếu và không tạo SVG/chữ ký mới.""",
        response_schema=ExtractedDocument,
    )

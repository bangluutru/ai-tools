import os
from google.antigravity import Agent, LocalAgentConfig
from google.antigravity.types import Document, Image
from ..schemas.document import ExtractedDocument

async def extract_document(file_path: str, model: str = None):
    if model is None:
        model = os.getenv("DEFAULT_MODEL", "gemini-3.7-flash")
    
    config = LocalAgentConfig(
        model=model,
        system_instructions="""Bạn là chuyên gia phân tích tài liệu.
Nhận file PDF/ảnh và trích xuất TOÀN BỘ nội dung thành JSON chuẩn.
Phải nhận diện: tiêu đề, bảng biểu, dấu mộc đỏ (mô tả vị trí SVG),
chữ ký, ngày tháng. Hỗ trợ 3 ngôn ngữ: Việt, Anh, Nhật.""",
        response_schema=ExtractedDocument,
    )
    async with Agent(config) as agent:
        if file_path.lower().endswith(".pdf"):
            doc = Document.from_file(file_path)
            inputs = ["Trích xuất toàn bộ nội dung tài liệu này", doc]
        else:
            img = Image.from_file(file_path)
            inputs = ["Trích xuất toàn bộ nội dung tài liệu này", img]
            
        response = await agent.chat(inputs)
        return await response.structured_output()

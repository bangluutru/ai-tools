from ..schemas.legal import LegalTranslationResult
from ..services.antigravity_gateway import gateway

async def translate_legal_document(text: str):
    return await gateway.structured(
        prompt=f"Dịch văn bản sau sang Việt, Anh và Nhật:\n\n{text}",
        system_instructions="""Bạn là chuyên gia dịch thuật văn bản pháp lý.
Nhiệm vụ: phân tích văn bản pháp luật, hợp đồng, tài liệu pháp lý và dịch sang 3 ngôn ngữ (Việt, Anh, Nhật).
Giữ nguyên cấu trúc và ý nghĩa pháp lý. Xuất định dạng JSON theo schema yêu cầu.
Không bổ sung điều khoản hoặc tư vấn pháp lý. Nội dung chỉ mang tính tham khảo.
Sử dụng Markdown cho phần content (content_vn, content_en, content_jp).""",
        response_schema=LegalTranslationResult,
    )

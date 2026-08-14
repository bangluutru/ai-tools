from ..schemas.translation import TranslationResult
from ..services.antigravity_gateway import gateway

async def translate_document(text: str, batch_index: int, total: int):
    return await gateway.structured(
        prompt=f"[Batch {batch_index}/{total}] Dịch nội dung sau sang 3 ngôn ngữ:\n\n{text}",
        system_instructions="""Bạn là dịch giả chuyên nghiệp VN-EN-JP.
Dịch chính xác, giữ nguyên cấu trúc heading/paragraph/table/list.
Thuật ngữ pháp lý/kỹ thuật phải nhất quán xuyên suốt. Không tự thêm nội dung.""",
        response_schema=TranslationResult,
    )

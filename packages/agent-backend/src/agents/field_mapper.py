from ..schemas.mapping import MappingResult
from ..services.antigravity_gateway import gateway

async def map_fields(source_headers: list[str], target_headers: list[str], sample_rows: list[list[str]]):
    prompt = f"""Source headers: {source_headers}
Target headers: {target_headers}
Sample data (2 rows): {sample_rows}
Hãy mapping từng cặp source->target."""
    return await gateway.structured(
        prompt=prompt,
        system_instructions="""Bạn là chuyên gia mapping dữ liệu.
Chỉ đề xuất mapping theo ngữ nghĩa của header và sample được cung cấp.
Không tự tạo cột. Nếu không đủ bằng chứng, để mapping ở trạng thái không chắc chắn.
Ghi rõ transformation khi thực sự cần đổi format.""",
        response_schema=MappingResult,
    )

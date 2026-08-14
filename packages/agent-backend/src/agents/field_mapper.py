import os
from google.antigravity import Agent, LocalAgentConfig
from ..schemas.mapping import MappingResult

async def map_fields(source_headers: list[str], target_headers: list[str], sample_rows: list[list[str]]):
    model = os.getenv("DEFAULT_MODEL", "gemini-3.7-flash")
    config = LocalAgentConfig(
        model=model,
        system_instructions="""Bạn là chuyên gia mapping dữ liệu.
Nhận danh sách header nguồn và header đích.
Map chúng theo ngữ nghĩa (VD: "DOB" -> "Ngày sinh", "Qty" -> "Số lượng").
Nếu cần chuyển đổi format, ghi rõ transformation.""",
        response_schema=MappingResult,
    )
    async with Agent(config) as agent:
        prompt = f"""Source headers: {source_headers}
Target headers: {target_headers}
Sample data (2 rows): {sample_rows}
Hãy mapping từng cặp source->target."""
        response = await agent.chat(prompt)
        return await response.structured_output()

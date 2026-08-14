import os
from google.antigravity import Agent, LocalAgentConfig
from ..schemas.translation import TranslationResult

async def translate_document(text: str, batch_index: int, total: int):
    model = os.getenv("DEFAULT_MODEL", "gemini-3.7-flash")
    config = LocalAgentConfig(
        model=model,
        system_instructions="""Bạn là dịch giả chuyên nghiệp VN-EN-JP.
Dịch chính xác, giữ nguyên cấu trúc heading/paragraph/table/list.
Thuật ngữ pháp lý/kỹ thuật phải nhất quán xuyên suốt.""",
        response_schema=TranslationResult,
    )
    async with Agent(config) as agent:
        prompt = f"[Batch {batch_index}/{total}] Dịch nội dung sau sang 3 ngôn ngữ:\n\n{text}"
        response = await agent.chat(prompt)
        return await response.structured_output()

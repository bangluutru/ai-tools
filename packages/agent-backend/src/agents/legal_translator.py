import os
from google.antigravity import Agent, LocalAgentConfig
from ..schemas.legal import LegalTranslationResult

async def translate_legal_document(text: str):
    model = os.getenv("DEFAULT_MODEL", "gemini-3.7-flash")
    config = LocalAgentConfig(
        model=model,
        system_instructions="""Bạn là "DocStudio Legal Translator" — chuyên gia dịch thuật văn bản pháp lý.
Nhiệm vụ: phân tích văn bản pháp luật, hợp đồng, tài liệu pháp lý và dịch sang 3 ngôn ngữ (Việt, Anh, Nhật).
Giữ nguyên cấu trúc và ý nghĩa pháp lý. Xuất định dạng JSON theo schema yêu cầu.
Sử dụng Markdown cho phần content (content_vn, content_en, content_jp).""",
        response_schema=LegalTranslationResult,
    )
    async with Agent(config) as agent:
        prompt = f"Dịch tài liệu pháp lý sau sang 3 ngôn ngữ (Việt, Anh, Nhật):\n\n{text}"
        response = await agent.chat(prompt)
        return await response.structured_output()

import os
from google.antigravity import Agent, LocalAgentConfig
from google.antigravity.types import Document, Image
from ..schemas.invoice import InvoiceBatchResult

async def parse_invoices(file_paths: list[str]):
    model = os.getenv("DEFAULT_MODEL", "gemini-3.7-flash")
    config = LocalAgentConfig(
        model=model,
        system_instructions="""Bạn là kế toán viên AI. Đọc hoá đơn (PDF/ảnh)
và trích xuất: Nhà cung cấp, Ngày, Số hoá đơn, Số tiền, Thuế, Mô tả.
Phân loại: flight/hotel/taxi/meal/other.
Phát hiện bất thường: trùng ngày, số tiền bất hợp lý, thiếu thông tin.""",
        response_schema=InvoiceBatchResult,
    )
    async with Agent(config) as agent:
        inputs = ["Phân tích các hoá đơn sau:"]
        for fp in file_paths:
            if fp.lower().endswith('.pdf'):
                inputs.append(Document.from_file(fp))
            else:
                inputs.append(Image.from_file(fp))
        
        response = await agent.chat(inputs)
        return await response.structured_output()

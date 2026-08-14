import os
from google.antigravity import Agent, LocalAgentConfig
from google.antigravity.types import Document, Image

async def generate_layout(file_path: str):
    model = os.getenv("HEAVY_MODEL", "gemini-3.1-pro")
    config = LocalAgentConfig(
        model=model,
        system_instructions="""Bạn là chuyên gia tái tạo tài liệu.
Nhận ảnh/PDF và tạo ra HTML + Tailwind CSS layout giống y hệt bản gốc.
Đặt placeholder {{variable_name}} cho các vùng dữ liệu động.
Tạo SVG cho dấu mộc đỏ. Giữ tỷ lệ A4 (210mm x 297mm).
Trả về HTML hợp lệ không chứa markdown fences ở ngoài.""",
    )
    async with Agent(config) as agent:
        if file_path.lower().endswith(".pdf"):
            doc = Document.from_file(file_path)
            inputs = ["Tái tạo layout HTML cho tài liệu này", doc]
        else:
            img = Image.from_file(file_path)
            inputs = ["Tái tạo layout HTML cho tài liệu này", img]
            
        response = await agent.chat(inputs)
        html_text = await response.text()
        
        # Clean markdown fences if model returns them
        if html_text.startswith("```html"):
            html_text = html_text[7:]
        if html_text.startswith("```"):
            html_text = html_text[3:]
        if html_text.endswith("```"):
            html_text = html_text[:-3]
            
        return html_text.strip()

from google.antigravity import Document, Image
from ..services.antigravity_gateway import gateway

async def generate_layout(file_path: str):
    system_instructions = """Bạn là chuyên gia tái tạo tài liệu.
Nhận ảnh/PDF và tạo ra HTML + Tailwind CSS layout giống y hệt bản gốc.
Đặt placeholder {{variable_name}} cho các vùng dữ liệu động.
Giữ tỷ lệ A4 (210mm x 297mm). Không tạo script, iframe, event handler, URL ngoài,
SVG, form hoặc nội dung chủ động. Trả HTML hợp lệ không có markdown fences."""
    if file_path.lower().endswith(".pdf"):
        media = Document.from_file(file_path)
    else:
        media = Image.from_file(file_path)
    html_text = await gateway.text(
        prompt=["Tái tạo layout HTML tĩnh cho tài liệu này.", media],
        system_instructions=system_instructions,
    )

    if html_text.startswith("```html"):
        html_text = html_text[7:]
    if html_text.startswith("```"):
        html_text = html_text[3:]
    if html_text.endswith("```"):
        html_text = html_text[:-3]
    return html_text.strip()

from pydantic import BaseModel
from typing import Literal
from google.antigravity import Document, Image
from ..services.antigravity_gateway import gateway

class ClassificationResult(BaseModel):
    document_type: Literal["certificate", "legal", "invoice", "unknown"]
    confidence: float
    suggested_tool: str

async def classify_document(file_path: str):
    if file_path.lower().endswith(".pdf"):
        media = Document.from_file(file_path)
    else:
        media = Image.from_file(file_path)
    return await gateway.structured(
        prompt=["Phân loại tài liệu này.", media],
        system_instructions=(
            "Chỉ phân loại tài liệu theo schema. Không suy đoán ngoài nội dung file."
        ),
        response_schema=ClassificationResult,
    )

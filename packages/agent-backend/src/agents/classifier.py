import os
from pydantic import BaseModel
from typing import Literal
from google.antigravity import Agent, LocalAgentConfig
from google.antigravity.types import Document, Image

class ClassificationResult(BaseModel):
    document_type: Literal["certificate", "legal", "invoice", "unknown"]
    confidence: float
    suggested_tool: str

async def classify_document(file_path: str):
    model = os.getenv("DEFAULT_MODEL", "gemini-3.7-flash")
    config = LocalAgentConfig(
        model=model,
        response_schema=ClassificationResult,
    )
    async with Agent(config) as agent:
        if file_path.lower().endswith(".pdf"):
            doc = Document.from_file(file_path)
            inputs = ["Phân loại loại tài liệu này", doc]
        else:
            img = Image.from_file(file_path)
            inputs = ["Phân loại loại tài liệu này", img]
            
        response = await agent.chat(inputs)
        return await response.structured_output()

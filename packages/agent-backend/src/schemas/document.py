from pydantic import BaseModel
from typing import Literal

class DocumentField(BaseModel):
    label: str
    value: str
    language: Literal["vi", "en", "ja"]

class ExtractedDocument(BaseModel):
    """Schema for agent document extraction"""
    title: str
    document_type: Literal["certificate", "legal", "sds", "invoice", "contract"]
    fields: list[DocumentField]
    tables: list[dict]
    stamps: list[dict]
    metadata: dict

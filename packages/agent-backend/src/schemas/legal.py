from pydantic import BaseModel, Field
from typing import Optional

class LegalMetaInfo(BaseModel):
    doc_number: Optional[str] = Field(None, description="Document number (e.g., Số: XX/XXXX/NĐ-CP)")
    date_vn: Optional[str] = Field(None, description="Vietnamese date (e.g., Hà Nội, ngày ... tháng ... năm ...)")
    date_en: Optional[str] = Field(None, description="English date")
    date_jp: Optional[str] = Field(None, description="Japanese date")
    issuer_vn: Optional[str] = Field(None, description="Issuing authority in Vietnamese")
    issuer_en: Optional[str] = Field(None, description="Issuing authority in English")
    issuer_jp: Optional[str] = Field(None, description="Issuing authority in Japanese")

class LegalTranslationResult(BaseModel):
    type: str = Field("legal_doc", description="Always 'legal_doc'")
    meta_info: Optional[LegalMetaInfo] = Field(None, description="Metadata of the document")
    title_vn: Optional[str] = Field(None, description="Title in Vietnamese")
    title_en: Optional[str] = Field(None, description="Title in English")
    title_jp: Optional[str] = Field(None, description="Title in Japanese")
    content_vn: str = Field(..., description="Markdown content in Vietnamese")
    content_en: str = Field(..., description="Markdown content in English")
    content_jp: str = Field(..., description="Markdown content in Japanese")

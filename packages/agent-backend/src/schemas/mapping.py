from pydantic import BaseModel

class FieldMapping(BaseModel):
    source_header: str
    target_header: str
    confidence: float
    transformation: str | None

class MappingResult(BaseModel):
    """Schema for mapping excel fields"""
    mappings: list[FieldMapping]
    unmapped_source: list[str]
    unmapped_target: list[str]

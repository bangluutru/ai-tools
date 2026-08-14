from pydantic import BaseModel
from typing import Literal

class TranslationBlock(BaseModel):
    block_type: Literal["heading", "paragraph", "table", "list", "signature"]
    vi: str
    en: str
    ja: str

class TranslationResult(BaseModel):
    """Schema for agent translation"""
    blocks: list[TranslationBlock]
    batch_index: int
    total_batches: int
    is_final: bool

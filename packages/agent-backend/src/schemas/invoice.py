from pydantic import BaseModel, ConfigDict, Field
from typing import Literal


class InvoiceEvidence(BaseModel):
    """Evidence copied from a source document for human verification."""

    model_config = ConfigDict(extra="forbid")

    source_file: str
    field_name: str
    quote: str = Field(min_length=1, max_length=500)
    page: int | None = Field(default=None, ge=1)


class InvoiceData(BaseModel):
    """Unapproved extraction result for a single invoice."""

    model_config = ConfigDict(extra="forbid")

    source_file: str
    provider: str | None = None
    date: str | None = None
    invoice_no: str | None = None
    amount: float | None = None
    tax_amount: float | None = None
    description: str | None = None
    category: Literal["flight", "hotel", "taxi", "meal", "other"]
    confidence: float = Field(ge=0, le=1)
    needs_review: bool = True
    missing_fields: list[str] = Field(default_factory=list)
    evidence: list[InvoiceEvidence] = Field(default_factory=list)


class InvoiceBatchResult(BaseModel):
    """Reference-only extraction result; never an approval decision."""

    model_config = ConfigDict(extra="forbid")

    invoices: list[InvoiceData]
    anomalies: list[str] = Field(default_factory=list)
    summary: str
    output_purpose: Literal["reference"] = "reference"
    requires_human_approval: Literal[True] = True

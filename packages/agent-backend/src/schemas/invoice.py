from pydantic import BaseModel
from typing import Literal

class InvoiceData(BaseModel):
    """Schema for single invoice"""
    provider: str
    date: str
    invoice_no: str
    amount: float
    tax_amount: float | None
    description: str
    category: Literal["flight", "hotel", "taxi", "meal", "other"]
    confidence: float

class InvoiceBatchResult(BaseModel):
    """Schema for parsing multiple invoices"""
    invoices: list[InvoiceData]
    anomalies: list[str]
    summary: str

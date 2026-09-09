from pydantic import BaseModel, HttpUrl
from datetime import date as date_type, datetime
import uuid


class ExpenseProcessRequest(BaseModel):
    image_url: HttpUrl

class ExpenseProcessResponse(BaseModel):
    merchant: str | None = None
    reason: str | None = None
    amount: float | None = None
    category: str | None = None
    currency: str | None = None
    date: str | None = None

class ExpenseCreate(BaseModel):
    image_url: HttpUrl
    merchant: str | None = None
    reason: str | None = None
    amount: float | None = None
    category: str | None = None
    currency: str | None = None
    date: str | None = None

class ExpenseResponse(BaseModel):
    id: uuid.UUID
    image_url: str
    merchant: str | None
    amount: float | None
    currency: str
    expense_date: date_type | None
    reason: str | None
    category: str | None
    confidence: float | None
    created_at: datetime

    class Config:
        from_attributes = True


class CategorySummary(BaseModel):
    category: str
    totals_by_currency: dict[str, float]   # e.g. {"USD": 120.50, "RWF": 5000}
    count: int


class ExpenseListResponse(BaseModel):
    expenses: list[ExpenseResponse]
    summary: list[CategorySummary]
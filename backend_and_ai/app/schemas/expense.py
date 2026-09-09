from pydantic import BaseModel, HttpUrl

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


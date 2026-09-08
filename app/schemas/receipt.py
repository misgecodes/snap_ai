from pydantic import BaseModel, HttpUrl

class ReceiptProcessRequest(BaseModel):
    image_url: HttpUrl

class ReceiptProcessResponse(BaseModel):
    merchant: str | None = None
    reason: str | None = None
    amount: float | None = None
    category: str | None = None
    currency: str | None = None
    date: str | None = None
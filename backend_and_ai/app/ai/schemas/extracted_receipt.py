from pydantic import BaseModel  # type: ignore


class ExtractedReceipt(BaseModel):
    merchant: str
    amount: float
    currency: str
    date: str
    reason: str

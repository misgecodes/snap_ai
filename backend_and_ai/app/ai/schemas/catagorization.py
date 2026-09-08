
from pydantic import BaseModel, Field


class Categorization(BaseModel):
    category: str
    confidence: float = Field(ge=0, le=1, description="Confidence score between 0 and 1")
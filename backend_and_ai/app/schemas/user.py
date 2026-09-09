from pydantic import BaseModel
from datetime import datetime

class UserProfileResponse(BaseModel):
    id: str
    email: str
    full_name: str
    created_at: datetime

    class Config:
        from_attributes = True
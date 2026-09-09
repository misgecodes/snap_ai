import uuid

from sqlalchemy import (
    Column,
    ForeignKey,
    String,
    Float,
    Text,
    Date,
    DateTime,
)
from datetime import datetime

from app.db.base import Base




class Expense(Base):
    __tablename__ = "expenses"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    
    user_id = Column(String, ForeignKey("users.id"), nullable=True)
    image_url = Column(Text, nullable=False)

    merchant = Column(String, nullable=True)
    amount = Column(Float, nullable=True)
    currency = Column(String, nullable=False, default="USD")
    expense_date = Column(Date, nullable=True)
    reason = Column(Text, nullable=True)

    category = Column(String, nullable=True)
    confidence = Column(Float, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    
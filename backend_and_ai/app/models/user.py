import uuid
from sqlalchemy import Column, String, DateTime
from sqlalchemy.sql import func

from app.db.base import Base


class User(Base):
    __tablename__ = "users"

    id = Column(
        String,
        primary_key=True,
        default=lambda: str(uuid.uuid4())
    )

    email = Column(
        String,
        unique=True,
        nullable=False
    )

    full_name = Column(
        String,
        nullable=False
    )

    google_id = Column(
        String,
        unique=True,
        nullable=False
    )

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now()
    )
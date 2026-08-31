import enum
from datetime import datetime
from uuid import UUID

from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base, uuid_pk, created_at_col


class UserRole(str, enum.Enum):
    ADMIN = "admin"
    VIEWER = "viewer"


class User(Base):
    __tablename__ = "users"

    id: Mapped[uuid_pk]
    email: Mapped[str] = mapped_column(
        String(255), unique=True, nullable=False, index=True
    )
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
        default=UserRole.VIEWER.value,
    )
    created_at: Mapped[created_at_col]
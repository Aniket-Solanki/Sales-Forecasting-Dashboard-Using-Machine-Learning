import enum
from datetime import datetime
from uuid import UUID

from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base, uuid_pk, created_at


class UserRole(str, enum.Enum):
    ADMIN = "admin"
    VIEWER = "viewer"


class User(Base):
    __tablename__ = "users"

    id: Mapped[UUID] = uuid_pk
    email: Mapped[str] = mapped_column(
        String(255), unique=True, nullable=False, index=True
    )
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[UserRole] = mapped_column(
        String(50),
        nullable=False,
        default=UserRole.VIEWER,
    )
    created_at: Mapped[datetime] = created_at

    # Relationships
    # products: Mapped[list["Product"]] = relationship(back_populates="owner")
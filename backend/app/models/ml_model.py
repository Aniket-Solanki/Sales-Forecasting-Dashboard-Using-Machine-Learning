from datetime import datetime
from uuid import UUID

from sqlalchemy import LargeBinary, Float, String, Index, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base, uuid_pk, created_at_col


class MLModel(Base):
    __tablename__ = "ml_models"

    id: Mapped[uuid_pk]
    model_version: Mapped[str] = mapped_column(String(50), unique=True, nullable=False, index=True)
    model_binary: Mapped[bytes] = mapped_column(LargeBinary, nullable=False)
    mape: Mapped[float] = mapped_column(Float, nullable=False)
    created_at: Mapped[created_at_col]

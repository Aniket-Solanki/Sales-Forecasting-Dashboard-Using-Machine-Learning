from datetime import datetime
from uuid import UUID

from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, uuid_pk, created_at


class Product(Base):
    __tablename__ = "products"

    id: Mapped[UUID] = uuid_pk
    sku: Mapped[str] = mapped_column(String(100), unique=True, nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    # index=True generates ix_products_category automatically
    category: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    created_at: Mapped[datetime] = created_at

    # Relationships
    sales_history: Mapped[list["SalesHistory"]] = relationship(
        back_populates="product", cascade="all, delete-orphan"
    )
    forecasts: Mapped[list["Forecast"]] = relationship(
        back_populates="product", cascade="all, delete-orphan"
    )
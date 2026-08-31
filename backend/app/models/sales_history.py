from datetime import date
from decimal import Decimal
from uuid import UUID

from sqlalchemy import BigInteger, Date, ForeignKey, Numeric, Index, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class SalesHistory(Base):
    __tablename__ = "sales_history"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    product_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("products.id", ondelete="CASCADE"),
        nullable=False,
    )
    date: Mapped[date] = mapped_column(Date, nullable=False)
    units_sold: Mapped[int] = mapped_column(default=0, nullable=False)
    revenue: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)

    # Relationships
    product: Mapped["Product"] = relationship(back_populates="sales_history")

    # Constraints and Indexes
    __table_args__ = (
        # Composite index on (product_id, date) - CRITICAL for performance
        Index("ix_sales_history_product_id_date", "product_id", "date"),
        # Unique constraint to prevent duplicate entries for same product on same date
        UniqueConstraint("product_id", "date", name="uq_sales_history_product_date"),
    )
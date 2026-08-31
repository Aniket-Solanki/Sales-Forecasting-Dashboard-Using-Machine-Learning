from datetime import date
from typing import Optional
from uuid import UUID

from sqlalchemy import BigInteger, Date, Float, ForeignKey, String, Index, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class Forecast(Base):
    __tablename__ = "forecasts"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    product_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("products.id", ondelete="CASCADE"),
        nullable=False,
    )
    forecast_date: Mapped[date] = mapped_column(Date, nullable=False)
    predicted_units: Mapped[float] = mapped_column(Float, nullable=False)
    # 95% CI bounds — nullable per spec (no "Not Null" listed)
    lower_bound: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    upper_bound: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    model_version: Mapped[str] = mapped_column(String(50), nullable=False)

    # Relationships
    product: Mapped["Product"] = relationship(back_populates="forecasts")

    # Constraints and Indexes
    __table_args__ = (
        # Composite index for efficient date-range queries
        Index("ix_forecasts_product_id_forecast_date", "product_id", "forecast_date"),
        # One forecast row per product per date per model run
        UniqueConstraint("product_id", "forecast_date", name="uq_forecasts_product_date"),
    )
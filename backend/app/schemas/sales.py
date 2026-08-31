from datetime import date
from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel, Field


class SalesHistoryBase(BaseModel):
    product_id: UUID
    date: date
    units_sold: int = Field(..., ge=0, description="Quantity sold must be 0 or more")
    revenue: Decimal = Field(..., ge=0.0, max_digits=10, decimal_places=2, description="Revenue must be 0.00 or more")


class SalesHistoryCreate(SalesHistoryBase):
    pass


class SalesHistoryResponse(SalesHistoryBase):
    id: int

    class Config:
        from_attributes = True

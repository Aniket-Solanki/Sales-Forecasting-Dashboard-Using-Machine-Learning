from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field


class ProductBase(BaseModel):
    sku: str = Field(..., max_length=100, description="Unique stock keeping unit")
    name: str = Field(..., max_length=255, description="Product display name")
    category: str = Field(..., max_length=100, description="Product department or category")


class ProductCreate(ProductBase):
    pass


class ProductResponse(ProductBase):
    id: UUID
    created_at: datetime

    class Config:
        from_attributes = True

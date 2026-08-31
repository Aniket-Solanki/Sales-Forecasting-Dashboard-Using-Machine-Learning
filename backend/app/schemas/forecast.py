from datetime import date, datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class ForecastBase(BaseModel):
    product_id: UUID
    forecast_date: date
    predicted_units: float
    lower_bound: float
    upper_bound: float
    model_version: str


class ForecastResponse(ForecastBase):
    id: UUID
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

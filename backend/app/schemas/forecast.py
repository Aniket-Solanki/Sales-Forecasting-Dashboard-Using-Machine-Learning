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

    model_config = ConfigDict(protected_namespaces=())


class ForecastResponse(ForecastBase):
    id: int

    model_config = ConfigDict(from_attributes=True, protected_namespaces=())

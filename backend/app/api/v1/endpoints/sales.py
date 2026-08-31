from datetime import date
from typing import Any, List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import and_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.api.deps import get_current_user, get_db
from app.models.product import Product
from app.models.sales_history import SalesHistory
from app.schemas.sales import SalesHistoryCreate, SalesHistoryResponse

router = APIRouter()


@router.get("/", response_model=List[SalesHistoryResponse])
async def read_sales_history(
    db: AsyncSession = Depends(get_db),
    current_user: Any = Depends(get_current_user),
    product_id: Optional[UUID] = None,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    skip: int = 0,
    limit: int = 500,
) -> Any:
    """Retrieve historical sales records, with optional filtering by product and date range."""
    query = select(SalesHistory)
    filters = []

    if product_id:
        filters.append(SalesHistory.product_id == product_id)
    if start_date:
        filters.append(SalesHistory.date >= start_date)
    if end_date:
        filters.append(SalesHistory.date <= end_date)

    if filters:
        query = query.where(and_(*filters))

    result = await db.execute(query.offset(skip).limit(limit))
    sales = result.scalars().all()
    return sales


@router.post("/", response_model=SalesHistoryResponse, status_code=status.HTTP_201_CREATED)
async def create_sales_history(
    sales_in: SalesHistoryCreate,
    db: AsyncSession = Depends(get_db),
    current_user: Any = Depends(get_current_user),
) -> Any:
    """Ingest a new historical sales record."""
    # Verify product exists
    product_result = await db.execute(
        select(Product).where(Product.id == sales_in.product_id)
    )
    product = product_result.scalars().first()
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="The referenced product ID does not exist.",
        )

    # Check for duplicate record (date + product_id must be unique)
    duplicate_result = await db.execute(
        select(SalesHistory).where(
            and_(
                SalesHistory.product_id == sales_in.product_id,
                SalesHistory.date == sales_in.date,
            )
        )
    )
    duplicate = duplicate_result.scalars().first()
    if duplicate:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A sales record already exists for this product on the specified date.",
        )

    new_sales = SalesHistory(
        product_id=sales_in.product_id,
        date=sales_in.date,
        units_sold=sales_in.units_sold,
        revenue=sales_in.revenue,
    )
    db.add(new_sales)
    await db.commit()
    await db.refresh(new_sales)
    return new_sales

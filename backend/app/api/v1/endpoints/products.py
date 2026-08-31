from typing import Any, List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.api.deps import check_admin_role, get_current_user, get_db
from app.models.product import Product
from app.schemas.product import ProductCreate, ProductResponse

router = APIRouter()


@router.get("/", response_model=List[ProductResponse])
async def read_products(
    db: AsyncSession = Depends(get_db),
    current_user: Any = Depends(get_current_user),
    skip: int = 0,
    limit: int = 100,
) -> Any:
    """Retrieve list of products (requires active authentication)."""
    result = await db.execute(select(Product).offset(skip).limit(limit))
    products = result.scalars().all()
    return products


@router.post("/", response_model=ProductResponse, status_code=status.HTTP_201_CREATED)
async def create_product(
    product_in: ProductCreate,
    db: AsyncSession = Depends(get_db),
    admin_user: Any = Depends(check_admin_role),
) -> Any:
    """Create a new product (requires Admin privileges)."""
    result = await db.execute(select(Product).where(Product.sku == product_in.sku))
    product = result.scalars().first()
    if product:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A product with this SKU already exists.",
        )

    new_product = Product(
        sku=product_in.sku,
        name=product_in.name,
        category=product_in.category,
    )
    db.add(new_product)
    await db.commit()
    await db.refresh(new_product)
    return new_product

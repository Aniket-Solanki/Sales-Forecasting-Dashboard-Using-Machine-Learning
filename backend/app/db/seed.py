import asyncio
import random
from datetime import date, timedelta
from decimal import Decimal
from uuid import uuid4

from sqlalchemy.future import select

from app.core.security import get_password_hash
from app.db.session import async_session_factory
from app.models.user import User, UserRole
from app.models.product import Product
from app.models.sales_history import SalesHistory


async def seed_data():
    print("Connecting to database to seed mock data...")
    async with async_session_factory() as session:
        # 1. Create Admin User
        user_result = await session.execute(select(User).where(User.email == "admin@sales.com"))
        admin = user_result.scalars().first()
        if not admin:
            admin = User(
                email="admin@sales.com",
                password_hash=get_password_hash("admin123"),
                role=UserRole.ADMIN,
            )
            session.add(admin)
            print("Created Admin User: admin@sales.com (password: admin123)")

        # 2. Create Products
        products_data = [
            {"sku": "ELEC-001", "name": "Wireless Noise-Canceling Headphones", "category": "Electronics", "base_price": 150.0, "base_sales": 25},
            {"sku": "APPA-002", "name": "Premium Cotton Hoodie", "category": "Apparel", "base_price": 60.0, "base_sales": 40},
            {"sku": "HOME-003", "name": "Smart LED Desk Lamp", "category": "Home & Living", "base_price": 45.0, "base_sales": 15},
        ]

        products = []
        for p_data in products_data:
            prod_result = await session.execute(select(Product).where(Product.sku == p_data["sku"]))
            prod = prod_result.scalars().first()
            if not prod:
                prod = Product(
                    id=uuid4(),
                    sku=p_data["sku"],
                    name=p_data["name"],
                    category=p_data["category"],
                )
                session.add(prod)
                print(f"Created Product: {prod.name} ({prod.sku})")
            products.append((prod, p_data))

        await session.commit()

        # 3. Seed Sales History (2024-01-01 to 2026-08-31)
        start_date = date(2024, 1, 1)
        end_date = date(2026, 8, 31)
        total_days = (end_date - start_date).days + 1

        print(f"Generating sales history for {total_days} days...")

        for prod, p_data in products:
            # Check if sales history already exists for this product
            sales_exist = await session.execute(
                select(SalesHistory).where(SalesHistory.product_id == prod.id).limit(1)
            )
            if sales_exist.scalars().first():
                print(f"Sales history already exists for {prod.sku}. Skipping.")
                continue

            records = []
            for day_offset in range(total_days):
                current_date = start_date + timedelta(days=day_offset)

                # Generate simulated sales with seasonality and noise
                # Day of week seasonality: sales peak on weekends (Sat=5, Sun=6)
                day_of_week = current_date.weekday()
                seasonality = 1.3 if day_of_week in (5, 6) else 0.9

                # Month of year seasonality (holiday bump in November/December)
                month = current_date.month
                if month in (11, 12):
                    seasonality *= 1.4

                # Random noise +/- 20%
                noise = random.uniform(0.8, 1.2)

                # Calculate final units sold
                units_sold = int(p_data["base_sales"] * seasonality * noise)
                # Safeguard zero sales
                if units_sold < 0:
                    units_sold = 0

                revenue = Decimal(str(round(units_sold * p_data["base_price"], 2)))

                sales_record = SalesHistory(
                    product_id=prod.id,
                    date=current_date,
                    units_sold=units_sold,
                    revenue=revenue,
                )
                records.append(sales_record)

            session.add_all(records)
            print(f"Generated {len(records)} sales records for product {prod.sku}")

        await session.commit()
        print("Data seeding completed successfully!")


if __name__ == "__main__":
    asyncio.run(seed_data())

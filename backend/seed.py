import asyncio
from datetime import datetime, timedelta
import random
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import async_session_factory
from app.models.user import User
from app.models.sales_history import SalesHistory
from app.models.product import Product
from app.core.security import get_password_hash

async def seed():
    async with async_session_factory() as session:
        print("Checking for existing user...")
        # Check if user exists
        from sqlalchemy import select
        user = await session.scalar(select(User).filter_by(email="admin@example.com"))
        if not user:
            print("Creating default admin user...")
            user = User(
                email="admin@example.com",
                password_hash=get_password_hash("password123"),
                role="admin"
            )
            session.add(user)
            await session.commit()
            await session.refresh(user)

        print("Checking products...")
        products = await session.scalars(select(Product))
        products = products.all()
        if not products:
            print("Creating products...")
            p1 = Product(sku="ELEC-01", name="Wireless Earbuds", category="Electronics")
            p2 = Product(sku="ELEC-02", name="Smart Watch", category="Electronics")
            p3 = Product(sku="HOME-01", name="Coffee Maker", category="Home")
            session.add_all([p1, p2, p3])
            await session.commit()
            
            await session.refresh(p1)
            await session.refresh(p2)
            await session.refresh(p3)
            products = [p1, p2, p3]

        print("Checking sales data...")
        sales = await session.scalars(select(SalesHistory).limit(1))
        if not sales.first():
            print("Generating 365 days of sales data...")
            today = datetime.now().date()
            start_date = today - timedelta(days=365)
            
            sales_records = []
            for i in range(365):
                current_date = start_date + timedelta(days=i)
                # Add some seasonality and trend
                base_sales = 50 + (i * 0.1) # Upward trend
                
                # Weekend bump
                if current_date.weekday() >= 5:
                    base_sales *= 1.5
                    
                for p in products:
                    noise = random.uniform(0.8, 1.2)
                    units = int(base_sales * noise)
                    revenue = units * (29.99 if "ELEC" in p.sku else 49.99)
                    
                    sales_records.append(SalesHistory(
                        product_id=p.id,
                        date=current_date,
                        units_sold=units,
                        revenue=revenue
                    ))
                    
            session.add_all(sales_records)
            await session.commit()
            print(f"Added {len(sales_records)} sales records.")
        else:
            print("Sales data already exists.")
            
        print("Done seeding!")
        print("-" * 30)
        print("Test Account:")
        print("Email: admin@example.com")
        print("Password: password123")
        print("-" * 30)

if __name__ == "__main__":
    asyncio.run(seed())

import asyncio
import sys
from sqlalchemy import select, update
from app.db.session import async_session_factory
from app.models.user import User, UserRole

async def make_admin(email: str):
    async with async_session_factory() as session:
        # Check if user exists
        result = await session.execute(select(User).filter(User.email == email))
        user = result.scalar_one_or_none()
        
        if not user:
            print(f"User with email {email} not found!")
            return
            
        # Update role to admin
        await session.execute(
            update(User)
            .where(User.email == email)
            .values(role=UserRole.ADMIN.value)
        )
        await session.commit()
        print(f"Successfully upgraded {email} to ADMIN!")

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python make_admin.py <email>")
        sys.exit(1)
        
    email = sys.argv[1]
    asyncio.run(make_admin(email))

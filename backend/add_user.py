import asyncio
from app.db.session import async_session_factory
from app.models.user import User
from app.core.security import get_password_hash
from sqlalchemy import select

async def add_user():
    async with async_session_factory() as session:
        email = 'ssaniket.2004@gmail.com'
        user = await session.scalar(select(User).filter_by(email=email))
        if not user:
            user = User(
                email=email,
                password_hash=get_password_hash('password123'),
                role='admin'
            )
            session.add(user)
            await session.commit()
            print('User created successfully.')
        else:
            print('User already exists, updating password...')
            user.password_hash = get_password_hash('password123')
            user.role = 'admin'
            await session.commit()
            print('Password updated successfully.')

asyncio.run(add_user())

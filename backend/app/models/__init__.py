# Import all models to ensure they are registered with SQLAlchemy
from app.models.user import User, UserRole
from app.models.product import Product
from app.models.sales_history import SalesHistory
from app.models.forecast import Forecast

__all__ = [
    "User",
    "UserRole",
    "Product",
    "SalesHistory",
    "Forecast",
]
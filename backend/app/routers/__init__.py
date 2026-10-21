from app.routers.admin import router as admin_router
from app.routers.auth import router as auth_router
from app.routers.cart import router as cart_router
from app.routers.health import router as health_router
from app.routers.orders import router as orders_router
from app.routers.products import router as products_router

__all__ = [
    "admin_router",
    "auth_router",
    "cart_router",
    "health_router",
    "orders_router",
    "products_router",
]

from app.services.auth_service import AuthService, auth_service
from app.services.inventory_service import InventoryService, inventory_service
from app.services.notification_service import NotificationService, notification_service
from app.services.order_service import OrderService, order_service
from app.services.product_service import ProductService, product_service

__all__ = [
    "AuthService",
    "auth_service",
    "ProductService",
    "product_service",
    "InventoryService",
    "inventory_service",
    "OrderService",
    "order_service",
    "NotificationService",
    "notification_service",
]

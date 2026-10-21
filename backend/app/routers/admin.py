from decimal import Decimal
from typing import Any

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import require_admin
from app.models.inventory import Inventory
from app.models.order import Order, OrderStatus
from app.models.product import Product
from app.models.user import User
from app.schemas.order import OrderResponse, OrderStatusUpdate
from app.schemas.product import (
    InventoryResponse,
    InventoryUpdate,
    ProductCreate,
    ProductResponse,
    ProductUpdate,
)
from app.services.inventory_service import inventory_service
from app.services.order_service import order_service
from app.services.product_service import product_service

router = APIRouter(prefix="/admin", tags=["Admin"])


@router.get(
    "/orders",
    response_model=list[OrderResponse],
    summary="List all customer orders across platform (Admin only)",
)
def get_all_orders(
    status_filter: OrderStatus | None = Query(default=None, alias="status"),
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=50, ge=1, le=100),
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_admin),
) -> list[OrderResponse]:
    """Admin endpoint to view and filter orders across all users."""
    return order_service.get_all_orders(
        db=db,
        status_filter=status_filter,
        skip=skip,
        limit=limit,
    )


@router.put(
    "/orders/{order_id}/status",
    response_model=OrderResponse,
    summary="Update customer order status (Admin only)",
)
async def update_order_status_admin(
    order_id: int,
    status_in: OrderStatusUpdate,
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_admin),
) -> OrderResponse:
    """Admin endpoint to update order status (e.g. shipped, delivered, cancelled)."""
    return await order_service.update_order_status(
        db=db,
        order_id=order_id,
        new_status=status_in.status,
    )


@router.post(
    "/products",
    response_model=ProductResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create product with initial stock (Admin only)",
)
def create_product_admin(
    product_in: ProductCreate,
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_admin),
) -> ProductResponse:
    """Admin endpoint to create a product catalog item and assign initial stock."""
    return product_service.create_product(db, product_in)


@router.put(
    "/products/{product_id}",
    response_model=ProductResponse,
    summary="Update product catalog details (Admin only)",
)
def update_product_admin(
    product_id: int,
    product_in: ProductUpdate,
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_admin),
) -> ProductResponse:
    """Admin endpoint to update product information."""
    return product_service.update_product(db, product_id, product_in)


@router.delete(
    "/products/{product_id}",
    summary="Deactivate or remove product (Admin only)",
)
def delete_product_admin(
    product_id: int,
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_admin),
) -> dict[str, str]:
    """Admin endpoint to deactivate product from the catalog."""
    product_service.delete_product(db, product_id)
    return {"message": f"Product {product_id} deleted successfully"}


@router.put(
    "/products/{product_id}/inventory",
    response_model=InventoryResponse,
    summary="Update stock quantity for a product (Admin only)",
)
def update_inventory_admin(
    product_id: int,
    inventory_in: InventoryUpdate,
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_admin),
) -> InventoryResponse:
    """Admin endpoint to directly adjust inventory stock count. Prevents negative stock."""
    inventory = inventory_service.update_inventory(
        db=db,
        product_id=product_id,
        quantity=inventory_in.quantity,
    )
    return InventoryResponse.model_validate(inventory)


@router.get(
    "/dashboard",
    summary="System and business analytics dashboard (Admin only)",
)
def get_dashboard_metrics(
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_admin),
) -> dict[str, Any]:
    """Admin dashboard summary displaying platform health, total revenue, and inventory alerts."""
    total_orders = db.query(func.count(Order.id)).scalar() or 0
    total_users = db.query(func.count(User.id)).scalar() or 0
    total_products = db.query(func.count(Product.id)).filter(Product.is_active.is_(True)).scalar() or 0

    revenue_val = (
        db.query(func.sum(Order.total_amount))
        .filter(Order.status != OrderStatus.CANCELLED)
        .scalar()
    )
    total_revenue = Decimal(str(revenue_val)) if revenue_val else Decimal("0.00")

    pending_orders = (
        db.query(func.count(Order.id))
        .filter(Order.status.in_([OrderStatus.PENDING, OrderStatus.CONFIRMED]))
        .scalar()
        or 0
    )

    # Low stock items (stock <= 5)
    low_stock_count = (
        db.query(func.count(Inventory.id))
        .filter(Inventory.quantity <= 5)
        .scalar()
        or 0
    )

    return {
        "total_revenue": float(total_revenue),
        "total_orders": total_orders,
        "pending_orders": pending_orders,
        "total_users": total_users,
        "active_products": total_products,
        "low_stock_items": low_stock_count,
    }

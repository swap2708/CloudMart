from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.dependencies import get_current_user, require_admin
from app.models.user import User
from app.schemas.order import OrderCreate, OrderResponse, OrderStatusUpdate
from app.services.order_service import order_service

router = APIRouter(prefix="/orders", tags=["Orders"])


@router.post(
    "",
    response_model=OrderResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Place a new order",
)
async def create_order(
    order_in: OrderCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> OrderResponse:
    """Place an order with atomic stock verification.

    All pricing and totals are calculated strictly server-side from current database prices.
    """
    return await order_service.create_order(
        db=db,
        user=current_user,
        order_in=order_in,
    )


@router.get(
    "",
    response_model=list[OrderResponse],
    summary="List authenticated user's order history",
)
def list_my_orders(
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=50, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[OrderResponse]:
    """Retrieve all historical orders placed by the current customer."""
    return order_service.get_user_orders(
        db=db,
        user_id=current_user.id,
        skip=skip,
        limit=limit,
    )


@router.get(
    "/{order_id}",
    response_model=OrderResponse,
    summary="Get order details by ID",
)
def get_order(
    order_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> OrderResponse:
    """Retrieve details of a specific order. Customers may only view their own orders."""
    return order_service.get_order_by_id(
        db=db,
        order_id=order_id,
        current_user=current_user,
    )


@router.put(
    "/{order_id}/status",
    response_model=OrderResponse,
    summary="Update order lifecycle status (Admin only)",
)
async def update_order_status(
    order_id: int,
    status_in: OrderStatusUpdate,
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_admin),
) -> OrderResponse:
    """Transition order status. Requires admin role.

    If status is changed to cancelled, inventory is automatically replenished.
    """
    return await order_service.update_order_status(
        db=db,
        order_id=order_id,
        new_status=status_in.status,
    )

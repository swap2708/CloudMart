from decimal import Decimal
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.dependencies import get_current_user
from app.models.product import Product
from app.models.user import User
from app.schemas.cart import CartItemDetail, CartItemInput, CartResponse
from app.schemas.order import OrderCreate, OrderItemCreate, OrderResponse
from app.services.order_service import order_service

router = APIRouter(prefix="/cart", tags=["Cart"])


@router.post(
    "/calculate",
    response_model=CartResponse,
    summary="Validate and calculate live cart totals against DB pricing",
)
def calculate_cart(
    items: list[CartItemInput],
    db: Session = Depends(get_db),
) -> CartResponse:
    """Stateless cart validation endpoint.

    Fetches current catalog prices and inventory stock from the database,
    calculates subtotals and grand totals server-side, and flags items with
    insufficient inventory.
    """
    cart_details: list[CartItemDetail] = []
    total_amount = Decimal("0.00")
    total_items = 0
    can_checkout = True

    for item in items:
        product = db.query(Product).filter(Product.id == item.product_id).first()
        if not product or not product.is_active:
            can_checkout = False
            continue

        stock = product.inventory.quantity if product.inventory else 0
        has_stock = stock >= item.quantity
        if not has_stock:
            can_checkout = False

        subtotal = Decimal(str(product.price)) * Decimal(item.quantity)
        total_amount += subtotal
        total_items += item.quantity

        cart_details.append(
            CartItemDetail(
                product_id=product.id,
                product_name=product.name,
                price=product.price,
                quantity=item.quantity,
                subtotal=subtotal,
                image_url=product.image_url,
                in_stock=has_stock,
                available_stock=stock,
            )
        )

    return CartResponse(
        items=cart_details,
        total_amount=total_amount,
        item_count=total_items,
        can_checkout=can_checkout and len(cart_details) > 0,
    )


@router.post(
    "/checkout",
    response_model=OrderResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Mock checkout cart items and convert to confirmed order",
)
async def checkout_cart(
    items: list[CartItemInput],
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> OrderResponse:
    """Mock checkout endpoint that converts cart items into a confirmed order.

    Executes transactional inventory verification and records order items.
    """
    if not items:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot checkout an empty cart",
        )

    order_in = OrderCreate(
        items=[OrderItemCreate(product_id=i.product_id, quantity=i.quantity) for i in items]
    )
    return await order_service.create_order(db=db, user=current_user, order_in=order_in)

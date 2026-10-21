from decimal import Decimal
from typing import Optional
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from app.models.inventory import Inventory
from app.models.order import Order, OrderItem, OrderStatus
from app.models.product import Product
from app.models.user import User, UserRole
from app.schemas.order import (
    OrderCreate,
    OrderItemResponse,
    OrderResponse,
)
from app.utils.events import event_bus


class OrderService:
    """Service managing atomic checkout transactions, order retrieval, and status changes."""

    @staticmethod
    def _format_order_response(order: Order) -> OrderResponse:
        """Map Order ORM entity and its items to OrderResponse schema."""
        items = []
        for item in order.items:
            items.append(
                OrderItemResponse(
                    id=item.id,
                    order_id=item.order_id,
                    product_id=item.product_id,
                    product_name=item.product.name if item.product else None,
                    quantity=item.quantity,
                    unit_price=item.unit_price,
                    subtotal=Decimal(item.unit_price) * Decimal(item.quantity),
                )
            )

        return OrderResponse(
            id=order.id,
            user_id=order.user_id,
            status=order.status,
            total_amount=order.total_amount,
            created_at=order.created_at,
            updated_at=order.updated_at,
            items=items,
        )

    @staticmethod
    async def create_order(
        db: Session,
        user: User,
        order_in: OrderCreate,
    ) -> OrderResponse:
        """Place a customer order with atomic stock verification and server-side totals."""
        if not order_in.items:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Order must contain at least one item",
            )

        total_amount = Decimal("0.00")
        line_items_data = []
        event_items = []

        try:
            for item in order_in.items:
                if item.quantity <= 0:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail="Item quantity must be greater than zero",
                    )

                product = db.query(Product).filter(Product.id == item.product_id).first()
                if not product:
                    raise HTTPException(
                        status_code=status.HTTP_404_NOT_FOUND,
                        detail=f"Product with id {item.product_id} not found",
                    )

                if not product.is_active:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail=f"Product '{product.name}' is currently unavailable",
                    )

                # Row lock inventory to prevent concurrent race conditions
                inventory = (
                    db.query(Inventory)
                    .filter(Inventory.product_id == item.product_id)
                    .with_for_update()
                    .first()
                )

                available_qty = inventory.quantity if inventory else 0
                if not inventory or available_qty < item.quantity:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail=(
                            f"Insufficient inventory for product '{product.name}'. "
                            f"Requested: {item.quantity}, Available: {available_qty}"
                        ),
                    )

                # Atomically decrement inventory
                inventory.quantity -= item.quantity

                unit_price = Decimal(str(product.price))
                subtotal = unit_price * item.quantity
                total_amount += subtotal

                line_items_data.append(
                    {
                        "product_id": product.id,
                        "quantity": item.quantity,
                        "unit_price": unit_price,
                        "product_name": product.name,
                    }
                )

                event_items.append(
                    {
                        "product_id": product.id,
                        "product_name": product.name,
                        "quantity": item.quantity,
                        "unit_price": float(unit_price),
                        "subtotal": float(subtotal),
                    }
                )

            # Create Order header
            order = Order(
                user_id=user.id,
                status=OrderStatus.CONFIRMED,
                total_amount=total_amount,
            )
            db.add(order)
            db.flush()

            # Create line items
            for item_data in line_items_data:
                order_item = OrderItem(
                    order_id=order.id,
                    product_id=item_data["product_id"],
                    quantity=item_data["quantity"],
                    unit_price=item_data["unit_price"],
                )
                db.add(order_item)

            db.commit()
            db.refresh(order)

        except Exception:
            db.rollback()
            raise

        # Dispatch order confirmation event asynchronously
        await event_bus.publish(
            "order.created",
            {
                "order_id": str(order.id),
                "user_email": user.email,
                "total": float(order.total_amount),
                "items": event_items,
            },
        )

        return OrderService._format_order_response(order)

    @staticmethod
    def get_user_orders(
        db: Session,
        user_id: int,
        skip: int = 0,
        limit: int = 100,
    ) -> list[OrderResponse]:
        """Fetch all orders placed by a specific user."""
        orders = (
            db.query(Order)
            .filter(Order.user_id == user_id)
            .order_by(Order.created_at.desc())
            .offset(skip)
            .limit(limit)
            .all()
        )
        return [OrderService._format_order_response(o) for o in orders]

    @staticmethod
    def get_order_by_id(
        db: Session,
        order_id: int,
        current_user: User,
    ) -> OrderResponse:
        """Fetch single order by id, ensuring customer can only view their own order."""
        order = db.query(Order).filter(Order.id == order_id).first()
        if not order:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Order with id {order_id} not found",
            )

        if current_user.role != UserRole.ADMIN and order.user_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to access this order",
            )

        return OrderService._format_order_response(order)

    @staticmethod
    def get_all_orders(
        db: Session,
        status_filter: Optional[OrderStatus] = None,
        skip: int = 0,
        limit: int = 100,
    ) -> list[OrderResponse]:
        """Admin query to list orders across all customers."""
        query = db.query(Order)
        if status_filter:
            query = query.filter(Order.status == status_filter)

        orders = query.order_by(Order.created_at.desc()).offset(skip).limit(limit).all()
        return [OrderService._format_order_response(o) for o in orders]

    @staticmethod
    async def update_order_status(
        db: Session,
        order_id: int,
        new_status: OrderStatus,
    ) -> OrderResponse:
        """Admin endpoint to update order status, replenishing inventory if cancelled."""
        order = db.query(Order).filter(Order.id == order_id).first()
        if not order:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Order with id {order_id} not found",
            )

        old_status = order.status
        if old_status != OrderStatus.CANCELLED and new_status == OrderStatus.CANCELLED:
            # Replenish inventory stock
            for item in order.items:
                inventory = (
                    db.query(Inventory)
                    .filter(Inventory.product_id == item.product_id)
                    .with_for_update()
                    .first()
                )
                if inventory:
                    inventory.quantity += item.quantity

        order.status = new_status
        db.commit()
        db.refresh(order)

        # Dispatch status transition event
        user = order.user
        await event_bus.publish(
            "order.status_updated",
            {
                "order_id": str(order.id),
                "user_email": user.email if user else "",
                "old_status": old_status.value,
                "status": new_status.value,
            },
        )

        return OrderService._format_order_response(order)


order_service = OrderService()

from datetime import datetime
from decimal import Decimal
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field
from app.models.order import OrderStatus


class OrderItemCreate(BaseModel):
    """Line item requested in order creation.

    Notice: unit_price is NOT accepted from client to guarantee pricing integrity.
    """

    product_id: int = Field(..., gt=0)
    quantity: int = Field(..., gt=0)


class OrderCreate(BaseModel):
    """Payload to place a new order."""

    items: list[OrderItemCreate] = Field(..., min_length=1)


class OrderItemResponse(BaseModel):
    """Order item line response including product snapshot data."""

    id: int
    order_id: int
    product_id: int
    product_name: Optional[str] = None
    quantity: int
    unit_price: Decimal
    subtotal: Optional[Decimal] = None

    model_config = ConfigDict(from_attributes=True)


class OrderResponse(BaseModel):
    """Complete customer order response."""

    id: int
    user_id: int
    status: OrderStatus
    total_amount: Decimal
    created_at: datetime
    updated_at: datetime
    items: list[OrderItemResponse] = []

    model_config = ConfigDict(from_attributes=True)


class OrderStatusUpdate(BaseModel):
    """Admin payload to transition order status."""

    status: OrderStatus

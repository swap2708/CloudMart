from decimal import Decimal

from pydantic import BaseModel, Field


class CartItemInput(BaseModel):
    """Input representation of a shopping cart item."""

    product_id: int = Field(..., gt=0)
    quantity: int = Field(..., gt=0)


class CartItemDetail(BaseModel):
    """Enriched cart item evaluated against current database inventory and pricing."""

    product_id: int
    product_name: str
    price: Decimal
    quantity: int
    subtotal: Decimal
    image_url: str | None = None
    in_stock: bool
    available_stock: int


class CartResponse(BaseModel):
    """Calculated shopping cart totals and line items."""

    items: list[CartItemDetail] = []
    total_amount: Decimal = Decimal("0.00")
    item_count: int = 0
    can_checkout: bool = True


class CartAddRequest(BaseModel):
    """Add item to cart request."""

    product_id: int = Field(..., gt=0)
    quantity: int = Field(default=1, gt=0)


class CartUpdateRequest(BaseModel):
    """Update item in cart request."""

    product_id: int = Field(..., gt=0)
    quantity: int = Field(..., ge=0)

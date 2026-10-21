from datetime import datetime
from decimal import Decimal
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field


class ProductBase(BaseModel):
    """Shared product attributes."""

    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    price: Decimal = Field(..., gt=0, decimal_places=2)
    category: str = Field(..., min_length=1, max_length=100)
    image_url: Optional[str] = None
    is_active: bool = True


class ProductCreate(ProductBase):
    """Payload to create a new product, optionally initializing inventory stock."""

    initial_stock: int = Field(default=0, ge=0)


class ProductUpdate(BaseModel):
    """Payload to partially update product details."""

    name: Optional[str] = Field(default=None, min_length=1, max_length=255)
    description: Optional[str] = None
    price: Optional[Decimal] = Field(default=None, gt=0, decimal_places=2)
    category: Optional[str] = Field(default=None, min_length=1, max_length=100)
    image_url: Optional[str] = None
    is_active: Optional[bool] = None


class InventoryResponse(BaseModel):
    """Inventory stock details response."""

    id: int
    product_id: int
    quantity: int
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class InventoryUpdate(BaseModel):
    """Payload for updating product stock count."""

    quantity: int = Field(..., ge=0)


class ProductResponse(ProductBase):
    """Product response schema including current inventory stock."""

    id: int
    created_at: datetime
    updated_at: datetime
    stock_quantity: int = 0

    model_config = ConfigDict(from_attributes=True)

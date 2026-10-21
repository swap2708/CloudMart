from decimal import Decimal
from typing import Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.dependencies import require_admin
from app.models.user import User
from app.schemas.product import ProductCreate, ProductResponse, ProductUpdate
from app.services.product_service import product_service

router = APIRouter(prefix="/products", tags=["Products"])


@router.get(
    "",
    response_model=list[ProductResponse],
    summary="List products with filtering and pagination",
)
def list_products(
    category: Optional[str] = Query(default=None, description="Filter by category name"),
    min_price: Optional[Decimal] = Query(default=None, ge=0, description="Minimum price filter"),
    max_price: Optional[Decimal] = Query(default=None, ge=0, description="Maximum price filter"),
    search: Optional[str] = Query(default=None, description="Search keyword in name or description"),
    skip: int = Query(default=0, ge=0, description="Pagination offset"),
    limit: int = Query(default=50, ge=1, le=100, description="Pagination page size"),
    db: Session = Depends(get_db),
) -> list[ProductResponse]:
    """Public catalog endpoint to search, filter, and paginate products."""
    return product_service.get_products(
        db=db,
        category=category,
        min_price=min_price,
        max_price=max_price,
        search=search,
        is_active=True,
        skip=skip,
        limit=limit,
    )


@router.get(
    "/{product_id}",
    response_model=ProductResponse,
    summary="Get product detail by ID",
)
def get_product(
    product_id: int,
    db: Session = Depends(get_db),
) -> ProductResponse:
    """Public endpoint to fetch detailed product information including stock availability."""
    return product_service.get_product_response(db, product_id)


@router.post(
    "",
    response_model=ProductResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create product (Admin only)",
)
def create_product(
    product_in: ProductCreate,
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_admin),
) -> ProductResponse:
    """Create a new product catalog item with initial inventory stock. Requires admin role."""
    return product_service.create_product(db, product_in)


@router.put(
    "/{product_id}",
    response_model=ProductResponse,
    summary="Update product (Admin only)",
)
def update_product(
    product_id: int,
    product_in: ProductUpdate,
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_admin),
) -> ProductResponse:
    """Update product information. Requires admin role."""
    return product_service.update_product(db, product_id, product_in)


@router.delete(
    "/{product_id}",
    summary="Delete or deactivate product (Admin only)",
)
def delete_product(
    product_id: int,
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_admin),
) -> dict[str, str]:
    """Deactivate product from catalog. Requires admin role."""
    product_service.delete_product(db, product_id)
    return {"message": f"Product {product_id} deleted successfully"}

from decimal import Decimal
from typing import Optional
from fastapi import HTTPException, status
from sqlalchemy import or_
from sqlalchemy.orm import Session
from app.models.inventory import Inventory
from app.models.product import Product
from app.schemas.product import ProductCreate, ProductResponse, ProductUpdate


class ProductService:
    """Service managing product catalog items and inventory association."""

    @staticmethod
    def _format_product_response(product: Product) -> ProductResponse:
        """Map Product ORM entity and its Inventory to ProductResponse schema."""
        stock = product.inventory.quantity if product.inventory else 0
        return ProductResponse(
            id=product.id,
            name=product.name,
            description=product.description,
            price=product.price,
            category=product.category,
            image_url=product.image_url,
            is_active=product.is_active,
            created_at=product.created_at,
            updated_at=product.updated_at,
            stock_quantity=stock,
        )

    @staticmethod
    def get_products(
        db: Session,
        category: Optional[str] = None,
        min_price: Optional[Decimal] = None,
        max_price: Optional[Decimal] = None,
        search: Optional[str] = None,
        is_active: Optional[bool] = True,
        skip: int = 0,
        limit: int = 100,
    ) -> list[ProductResponse]:
        """Fetch list of products with optional search, category, and price filtering."""
        query = db.query(Product)

        if is_active is not None:
            query = query.filter(Product.is_active == is_active)

        if category:
            query = query.filter(Product.category.ilike(f"%{category.strip()}%"))

        if min_price is not None:
            query = query.filter(Product.price >= min_price)

        if max_price is not None:
            query = query.filter(Product.price <= max_price)

        if search:
            search_pattern = f"%{search.strip()}%"
            query = query.filter(
                or_(
                    Product.name.ilike(search_pattern),
                    Product.description.ilike(search_pattern),
                )
            )

        products = query.order_by(Product.id.asc()).offset(skip).limit(limit).all()
        return [ProductService._format_product_response(p) for p in products]

    @staticmethod
    def get_product_by_id(db: Session, product_id: int) -> Product:
        """Fetch a single product by primary key id, raising 404 if not found."""
        product = db.query(Product).filter(Product.id == product_id).first()
        if not product:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Product with id {product_id} not found",
            )
        return product

    @staticmethod
    def get_product_response(db: Session, product_id: int) -> ProductResponse:
        """Fetch single product response with stock quantity."""
        product = ProductService.get_product_by_id(db, product_id)
        return ProductService._format_product_response(product)

    @staticmethod
    def create_product(db: Session, product_in: ProductCreate) -> ProductResponse:
        """Create a new product catalog item along with its initial inventory stock."""
        product = Product(
            name=product_in.name.strip(),
            description=product_in.description.strip() if product_in.description else None,
            price=product_in.price,
            category=product_in.category.strip(),
            image_url=product_in.image_url.strip() if product_in.image_url else None,
            is_active=product_in.is_active,
        )
        db.add(product)
        db.flush()

        inventory = Inventory(
            product_id=product.id,
            quantity=max(0, product_in.initial_stock),
        )
        db.add(inventory)
        db.commit()
        db.refresh(product)

        return ProductService._format_product_response(product)

    @staticmethod
    def update_product(
        db: Session,
        product_id: int,
        product_in: ProductUpdate,
    ) -> ProductResponse:
        """Update existing product attributes."""
        product = ProductService.get_product_by_id(db, product_id)

        update_data = product_in.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            if field == "name" and value is not None:
                setattr(product, field, value.strip())
            elif field == "category" and value is not None:
                setattr(product, field, value.strip())
            else:
                setattr(product, field, value)

        db.commit()
        db.refresh(product)
        return ProductService._format_product_response(product)

    @staticmethod
    def delete_product(db: Session, product_id: int) -> bool:
        """Deactivate or delete a product. Soft deactivation preserves order item integrity."""
        product = ProductService.get_product_by_id(db, product_id)
        product.is_active = False
        db.commit()
        return True


product_service = ProductService()

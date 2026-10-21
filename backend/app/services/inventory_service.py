from typing import Optional
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from app.models.inventory import Inventory
from app.models.product import Product


class InventoryService:
    """Service managing warehouse stock counts separately from product catalog data."""

    @staticmethod
    def get_inventory_by_product_id(db: Session, product_id: int) -> Optional[Inventory]:
        """Fetch inventory entry for a given product ID."""
        return db.query(Inventory).filter(Inventory.product_id == product_id).first()

    @staticmethod
    def get_or_create_inventory(
        db: Session,
        product_id: int,
        initial_quantity: int = 0,
    ) -> Inventory:
        """Fetch existing inventory or initialize a new record."""
        inventory = InventoryService.get_inventory_by_product_id(db, product_id)
        if not inventory:
            if initial_quantity < 0:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Inventory stock cannot be negative",
                )
            inventory = Inventory(product_id=product_id, quantity=initial_quantity)
            db.add(inventory)
            db.flush()
        return inventory

    @staticmethod
    def update_inventory(
        db: Session,
        product_id: int,
        quantity: int,
    ) -> Inventory:
        """Update inventory stock count, validating that stock cannot be negative."""
        if quantity < 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Inventory stock cannot be negative",
            )

        product = db.query(Product).filter(Product.id == product_id).first()
        if not product:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Product with id {product_id} not found",
            )

        inventory = InventoryService.get_inventory_by_product_id(db, product_id)
        if not inventory:
            inventory = Inventory(product_id=product_id, quantity=quantity)
            db.add(inventory)
        else:
            inventory.quantity = quantity

        db.commit()
        db.refresh(inventory)
        return inventory

    @staticmethod
    def check_availability(
        db: Session,
        product_id: int,
        requested_quantity: int,
    ) -> bool:
        """Check whether sufficient stock exists for the requested quantity."""
        if requested_quantity <= 0:
            return False
        inventory = InventoryService.get_inventory_by_product_id(db, product_id)
        if not inventory:
            return False
        return inventory.quantity >= requested_quantity

    @staticmethod
    def decrement_inventory(
        db: Session,
        product_id: int,
        quantity: int,
    ) -> Inventory:
        """Atomically decrement stock. Raises 400 if stock is insufficient."""
        if quantity <= 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Quantity to decrement must be greater than zero",
            )

        inventory = (
            db.query(Inventory)
            .filter(Inventory.product_id == product_id)
            .with_for_update()
            .first()
        )
        if not inventory:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"No inventory record found for product id {product_id}",
            )

        if inventory.quantity < quantity:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=(
                    f"Insufficient stock for product id {product_id}. "
                    f"Available: {inventory.quantity}, Requested: {quantity}"
                ),
            )

        inventory.quantity -= quantity
        db.flush()
        return inventory

    @staticmethod
    def increment_inventory(
        db: Session,
        product_id: int,
        quantity: int,
    ) -> Inventory:
        """Increment stock (e.g. for cancelled orders or restocking)."""
        if quantity <= 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Quantity to increment must be greater than zero",
            )

        inventory = (
            db.query(Inventory)
            .filter(Inventory.product_id == product_id)
            .with_for_update()
            .first()
        )
        if not inventory:
            inventory = Inventory(product_id=product_id, quantity=quantity)
            db.add(inventory)
        else:
            inventory.quantity += quantity

        db.flush()
        return inventory


inventory_service = InventoryService()

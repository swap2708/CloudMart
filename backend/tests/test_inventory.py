import pytest
from fastapi import HTTPException
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from app.models.product import Product
from app.services.inventory_service import inventory_service


def test_inventory_creation_with_product(sample_product: Product, db: Session):
    """Test that creating a product creates its inventory row."""
    inv = inventory_service.get_inventory_by_product_id(db, sample_product.id)
    assert inv is not None
    assert inv.quantity == 20


def test_update_inventory_admin(admin_client: TestClient, sample_product: Product):
    """Test admin updates inventory stock count."""
    payload = {"quantity": 45}
    response = admin_client.put(f"/admin/products/{sample_product.id}/inventory", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["quantity"] == 45
    assert data["product_id"] == sample_product.id


def test_prevent_negative_inventory_endpoint(admin_client: TestClient, sample_product: Product):
    """Test updating inventory with negative quantity fails with 422/400 validation error."""
    payload = {"quantity": -5}
    response = admin_client.put(f"/admin/products/{sample_product.id}/inventory", json=payload)
    # Pydantic ge=0 constraint triggers 422 Unprocessable Entity
    assert response.status_code in (400, 422)


def test_prevent_negative_inventory_service_layer(db: Session, sample_product: Product):
    """Test service level validation prevents negative inventory."""
    with pytest.raises(HTTPException) as exc_info:
        inventory_service.update_inventory(db, sample_product.id, -10)
    assert exc_info.value.status_code == 400
    assert "cannot be negative" in exc_info.value.detail


def test_decrement_inventory_service_success(db: Session, sample_product: Product):
    """Test decrementing inventory decreases available stock."""
    inv = inventory_service.decrement_inventory(db, sample_product.id, 5)
    db.commit()
    assert inv.quantity == 15


def test_decrement_inventory_service_insufficient_stock(db: Session, sample_product: Product):
    """Test decrementing more than available stock raises 400."""
    with pytest.raises(HTTPException) as exc_info:
        inventory_service.decrement_inventory(db, sample_product.id, 50)
    assert exc_info.value.status_code == 400
    assert "Insufficient stock" in exc_info.value.detail


def test_increment_inventory_service(db: Session, sample_product: Product):
    """Test incrementing inventory increases stock count."""
    inv = inventory_service.increment_inventory(db, sample_product.id, 10)
    db.commit()
    assert inv.quantity == 30

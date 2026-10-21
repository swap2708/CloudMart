from decimal import Decimal
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from app.models.inventory import Inventory
from app.models.product import Product


def test_place_order_success(customer_client: TestClient, sample_product: Product, db: Session):
    """Test customer successfully placing an order.

    Verifies server-side total calculation and inventory decrement.
    """
    initial_stock = (
        db.query(Inventory).filter(Inventory.product_id == sample_product.id).first().quantity
    )

    payload = {
        "items": [
            {"product_id": sample_product.id, "quantity": 2}
        ]
    }
    response = customer_client.post("/orders", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["status"] == "confirmed"
    # Total must equal 99.99 * 2 = 199.98
    assert Decimal(str(data["total_amount"])) == Decimal("199.98")
    assert len(data["items"]) == 1
    assert data["items"][0]["quantity"] == 2
    assert Decimal(str(data["items"][0]["unit_price"])) == Decimal("99.99")

    # Verify inventory was decremented in DB
    updated_stock = (
        db.query(Inventory).filter(Inventory.product_id == sample_product.id).first().quantity
    )
    assert updated_stock == initial_stock - 2


def test_place_order_insufficient_stock(customer_client: TestClient, sample_product: Product):
    """Test placing an order for more items than available in stock returns 400."""
    payload = {
        "items": [
            {"product_id": sample_product.id, "quantity": 100}  # Available is 20
        ]
    }
    response = customer_client.post("/orders", json=payload)
    assert response.status_code == 400
    assert "Insufficient inventory" in response.json()["detail"]


def test_place_order_nonexistent_product(customer_client: TestClient):
    """Test placing an order for non-existent product returns 404."""
    payload = {
        "items": [
            {"product_id": 99999, "quantity": 1}
        ]
    }
    response = customer_client.post("/orders", json=payload)
    assert response.status_code == 404


def test_order_history_and_detail(customer_client: TestClient, sample_product: Product):
    """Test listing user orders and fetching single order detail."""
    # Place order
    payload = {"items": [{"product_id": sample_product.id, "quantity": 1}]}
    create_resp = customer_client.post("/orders", json=payload)
    assert create_resp.status_code == 201
    order_id = create_resp.json()["id"]

    # List my orders
    history_resp = customer_client.get("/orders")
    assert history_resp.status_code == 200
    orders = history_resp.json()
    assert len(orders) >= 1
    assert any(o["id"] == order_id for o in orders)

    # Get single order detail
    detail_resp = customer_client.get(f"/orders/{order_id}")
    assert detail_resp.status_code == 200
    assert detail_resp.json()["id"] == order_id


def test_cart_calculation(client: TestClient, sample_product: Product):
    """Test stateless cart calculation against live database prices."""
    payload = [
        {"product_id": sample_product.id, "quantity": 3}
    ]
    response = client.post("/cart/calculate", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["item_count"] == 3
    assert Decimal(str(data["total_amount"])) == Decimal("299.97")
    assert data["can_checkout"] is True
    assert data["items"][0]["in_stock"] is True


def test_cart_checkout(customer_client: TestClient, sample_product: Product):
    """Test mock checkout via cart endpoint."""
    payload = [
        {"product_id": sample_product.id, "quantity": 1}
    ]
    response = customer_client.post("/cart/checkout", json=payload)
    assert response.status_code == 201
    assert response.json()["status"] == "confirmed"

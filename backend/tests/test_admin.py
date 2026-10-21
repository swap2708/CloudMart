from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from app.models.inventory import Inventory
from app.models.product import Product


def test_admin_get_all_orders(
    admin_client: TestClient,
    customer_client: TestClient,
    sample_product: Product,
):
    """Test admin can view all customer orders while customers are forbidden."""
    # Place order as customer
    order_payload = {"items": [{"product_id": sample_product.id, "quantity": 1}]}
    customer_client.post("/orders", json=order_payload)

    # Admin lists all orders
    admin_resp = admin_client.get("/admin/orders")
    assert admin_resp.status_code == 200
    orders = admin_resp.json()
    assert len(orders) >= 1

    # Customer forbidden from accessing admin orders endpoint
    cust_resp = customer_client.get("/admin/orders")
    assert cust_resp.status_code == 403


def test_admin_update_order_status_and_replenish(
    admin_client: TestClient,
    customer_client: TestClient,
    sample_product: Product,
    db: Session,
):
    """Test updating status to cancelled replenishes inventory."""
    # Customer places order for 4 items (20 - 4 = 16 left)
    order_resp = customer_client.post(
        "/orders",
        json={"items": [{"product_id": sample_product.id, "quantity": 4}]},
    )
    order_id = order_resp.json()["id"]

    inv_after_order = (
        db.query(Inventory).filter(Inventory.product_id == sample_product.id).first().quantity
    )
    assert inv_after_order == 16

    # Admin updates status to shipped
    ship_resp = admin_client.put(
        f"/admin/orders/{order_id}/status",
        json={"status": "shipped"},
    )
    assert ship_resp.status_code == 200
    assert ship_resp.json()["status"] == "shipped"

    # Admin cancels order -> inventory should be replenished
    cancel_resp = admin_client.put(
        f"/admin/orders/{order_id}/status",
        json={"status": "cancelled"},
    )
    assert cancel_resp.status_code == 200
    assert cancel_resp.json()["status"] == "cancelled"

    inv_after_cancel = (
        db.query(Inventory).filter(Inventory.product_id == sample_product.id).first().quantity
    )
    assert inv_after_cancel == 20


def test_admin_dashboard_metrics(admin_client: TestClient, customer_client: TestClient):
    """Test admin dashboard returns system analytics while customer is forbidden."""
    admin_resp = admin_client.get("/admin/dashboard")
    assert admin_resp.status_code == 200
    data = admin_resp.json()
    assert "total_orders" in data
    assert "total_revenue" in data
    assert "pending_orders" in data
    assert "total_users" in data
    assert "active_products" in data
    assert "low_stock_items" in data

    # Customer forbidden
    cust_resp = customer_client.get("/admin/dashboard")
    assert cust_resp.status_code == 403

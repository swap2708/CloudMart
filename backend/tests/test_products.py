from fastapi.testclient import TestClient
from app.models.product import Product


def test_list_products_empty(client: TestClient):
    """Test listing products when catalog is empty."""
    response = client.get("/products")
    assert response.status_code == 200
    assert response.json() == []


def test_list_and_filter_products(client: TestClient, sample_product: Product):
    """Test retrieving product list and applying category and price filters."""
    # List all
    response = client.get("/products")
    assert response.status_code == 200
    items = response.json()
    assert len(items) == 1
    assert items[0]["name"] == sample_product.name
    assert items[0]["stock_quantity"] == 20

    # Filter matching category
    cat_resp = client.get("/products?category=Electronics")
    assert cat_resp.status_code == 200
    assert len(cat_resp.json()) == 1

    # Filter non-matching category
    non_cat_resp = client.get("/products?category=Books")
    assert non_cat_resp.status_code == 200
    assert len(non_cat_resp.json()) == 0

    # Price range filter
    price_resp = client.get("/products?min_price=50&max_price=150")
    assert price_resp.status_code == 200
    assert len(price_resp.json()) == 1

    price_out_resp = client.get("/products?min_price=200")
    assert price_out_resp.status_code == 200
    assert len(price_out_resp.json()) == 0

    # Search keyword
    search_resp = client.get("/products?search=Headphones")
    assert search_resp.status_code == 200
    assert len(search_resp.json()) == 1


def test_get_product_detail(client: TestClient, sample_product: Product):
    """Test retrieving detail of a single product."""
    response = client.get(f"/products/{sample_product.id}")
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == sample_product.id
    assert data["name"] == sample_product.name
    assert data["stock_quantity"] == 20


def test_get_product_detail_not_found(client: TestClient):
    """Test retrieving nonexistent product returns 404."""
    response = client.get("/products/99999")
    assert response.status_code == 404


def test_create_product_admin(admin_client: TestClient):
    """Test admin successfully creates a product with initial stock."""
    payload = {
        "name": "Smart Watch Pro",
        "description": "Fitness tracker with heart rate monitor",
        "price": "199.99",
        "category": "Electronics",
        "image_url": "https://example.com/watch.jpg",
        "is_active": True,
        "initial_stock": 50,
    }
    response = admin_client.post("/products", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "Smart Watch Pro"
    assert data["stock_quantity"] == 50
    assert "id" in data


def test_create_product_customer_forbidden(customer_client: TestClient):
    """Test customer user is forbidden from creating products."""
    payload = {
        "name": "Unauthorized Product",
        "price": "10.00",
        "category": "Test",
        "initial_stock": 5,
    }
    response = customer_client.post("/products", json=payload)
    assert response.status_code == 403


def test_create_product_unauthenticated(client: TestClient):
    """Test unauthenticated request cannot create products."""
    payload = {
        "name": "Unauthorized Product",
        "price": "10.00",
        "category": "Test",
    }
    response = client.post("/products", json=payload)
    assert response.status_code == 401


def test_update_product_admin(admin_client: TestClient, sample_product: Product):
    """Test admin updates existing product details."""
    payload = {
        "name": "Updated Headphones",
        "price": "129.99",
    }
    response = admin_client.put(f"/products/{sample_product.id}", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "Updated Headphones"
    assert float(data["price"]) == 129.99


def test_delete_product_admin(admin_client: TestClient, sample_product: Product):
    """Test admin deactivates product."""
    response = admin_client.delete(f"/products/{sample_product.id}")
    assert response.status_code == 200

    # Public list should no longer include deactivated product
    list_resp = admin_client.get("/products")
    assert len(list_resp.json()) == 0

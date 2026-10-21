from fastapi.testclient import TestClient
from app.utils.security import decode_access_token


def test_register_customer_success(client: TestClient):
    """Test registering a new customer account."""
    payload = {
        "email": "newuser@example.com",
        "full_name": "New User",
        "password": "Password123!",
    }
    response = client.post("/auth/register", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["email"] == "newuser@example.com"
    assert data["full_name"] == "New User"
    assert data["role"] == "customer"
    assert data["is_active"] is True
    assert "id" in data
    assert "hashed_password" not in data


def test_register_duplicate_email_fails(client: TestClient):
    """Test registering with an existing email returns 400 Bad Request."""
    payload = {
        "email": "duplicate@example.com",
        "full_name": "First User",
        "password": "Password123!",
    }
    first_resp = client.post("/auth/register", json=payload)
    assert first_resp.status_code == 201

    second_resp = client.post("/auth/register", json=payload)
    assert second_resp.status_code == 400
    assert "already exists" in second_resp.json()["detail"]


def test_login_json_success(client: TestClient):
    """Test logging in with JSON payload returns valid JWT access token."""
    # Register user
    reg_payload = {
        "email": "loginuser@example.com",
        "full_name": "Login User",
        "password": "MySecretPassword123!",
    }
    client.post("/auth/register", json=reg_payload)

    # Login with JSON
    login_payload = {
        "email": "loginuser@example.com",
        "password": "MySecretPassword123!",
    }
    response = client.post("/auth/login", json=login_payload)
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"

    # Verify JWT claims
    claims = decode_access_token(data["access_token"])
    assert claims is not None
    assert claims["sub"] == "loginuser@example.com"
    assert claims["role"] == "customer"


def test_login_form_encoded_success(client: TestClient):
    """Test logging in with OAuth2 form urlencoded payload."""
    reg_payload = {
        "email": "formuser@example.com",
        "full_name": "Form User",
        "password": "FormPassword123!",
    }
    client.post("/auth/register", json=reg_payload)

    response = client.post(
        "/auth/login",
        data={"username": "formuser@example.com", "password": "FormPassword123!"},
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data


def test_login_invalid_password(client: TestClient):
    """Test login with wrong password returns 401 Unauthorized."""
    reg_payload = {
        "email": "wrongpass@example.com",
        "full_name": "Wrong Pass User",
        "password": "CorrectPassword123!",
    }
    client.post("/auth/register", json=reg_payload)

    response = client.post(
        "/auth/login",
        json={"email": "wrongpass@example.com", "password": "IncorrectPassword"},
    )
    assert response.status_code == 401
    assert "Incorrect email or password" in response.json()["detail"]


def test_login_nonexistent_user(client: TestClient):
    """Test login with non-existent user returns 401 Unauthorized."""
    response = client.post(
        "/auth/login",
        json={"email": "nonexistent@example.com", "password": "Password123!"},
    )
    assert response.status_code == 401


def test_get_me_authenticated(client: TestClient, customer_token: str):
    """Test /auth/me returns current user profile when valid token provided."""
    headers = {"Authorization": f"Bearer {customer_token}"}
    response = client.get("/auth/me", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == "test_customer@cloudmart.com"
    assert data["role"] == "customer"


def test_get_me_unauthorized(client: TestClient):
    """Test /auth/me returns 401 without authentication token."""
    response = client.get("/auth/me")
    assert response.status_code == 401


def test_get_me_invalid_token(client: TestClient):
    """Test /auth/me returns 401 when given an invalid token."""
    headers = {"Authorization": "Bearer invalid.token.value"}
    response = client.get("/auth/me", headers=headers)
    assert response.status_code == 401

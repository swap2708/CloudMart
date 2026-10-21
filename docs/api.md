# CloudMart REST API Specification

## 1. Overview & Base URL

CloudMart provides a standards-compliant RESTful API serving JSON payloads over HTTP/HTTPS.

- **Base URL (Local Development)**: `http://localhost:8000`
- **Interactive OpenAPI Documentation (Swagger UI)**: `http://localhost:8000/docs`
- **Alternative ReDoc Documentation**: `http://localhost:8000/redoc`
- **OpenAPI 3.1.0 Raw Specification**: `http://localhost:8000/openapi.json`

---

## 2. Authentication & Authorization

CloudMart uses stateless JSON Web Tokens (JWT) adhering to RFC 7519.

### Token Usage
For protected endpoints, include the access token in the standard HTTP `Authorization` request header:
```http
Authorization: Bearer <your_jwt_access_token>
```

### Roles & Permissions
- **Public**: Endpoints accessible without authentication (e.g., browse products, user registration, login, health check).
- **Authenticated (`customer`)**: Accessible by any verified user (e.g., fetch profile, create order, list own orders).
- **Administrator (`admin`)**: Restrictive access requiring a token with the claim `"role": "admin"` (e.g., create/edit/delete products, list all global orders, update fulfillment statuses).

---

## 3. Standard Error Response Format

All error responses adhere to FastAPI's standardized error schema:

```json
{
  "detail": "Descriptive error message explaining the failure reason"
}
```

### Validation Error (HTTP 422 Unprocessable Entity)
When request payload validation fails against Pydantic models:
```json
{
  "detail": [
    {
      "loc": ["body", "price"],
      "msg": "Input should be greater than 0",
      "type": "greater_than",
      "ctx": { "gt": 0 }
    }
  ]
}
```

### Common HTTP Status Codes
| Status Code | Description | Scenario |
| :--- | :--- | :--- |
| `200 OK` | Standard success response | Successful GET, PUT |
| `201 Created` | Resource created | Successful POST (/auth/register, /products, /orders) |
| `204 No Content` | Success with empty body | Successful DELETE (/products/{id}) |
| `400 Bad Request` | Invalid payload logic | Email already registered, malformed input |
| `401 Unauthorized` | Missing / invalid token | Expired token, signature mismatch |
| `403 Forbidden` | Insufficient permissions | Non-admin user accessing admin endpoint |
| `404 Not Found` | Resource does not exist | Invalid product ID or order ID |
| `409 Conflict` | Business constraint violation | Insufficient stock available during checkout |
| `422 Unprocessable`| Pydantic schema validation failure | Missing required fields, invalid types |
| `500 Server Error` | Unhandled backend exception | Internal database connection failure |

---

## 4. Endpoints

### 4.1 Health Check

#### `GET /health`
Verifies API availability and database connectivity.
- **Access**: Public
- **Headers**: None required

##### Response: `200 OK`
```json
{
  "status": "healthy",
  "timestamp": "2026-10-20T14:30:00Z",
  "database": "connected",
  "version": "1.0.0"
}
```

---

### 4.2 Authentication Endpoints

#### `POST /auth/register`
Creates a new customer account.
- **Access**: Public
- **Request Body**:
```json
{
  "email": "customer@example.com",
  "password": "SecurePassword123!",
  "full_name": "Jane Doe"
}
```
##### Response: `201 Created`
```json
{
  "id": "e5861270-22c6-49dc-b290-d64b1f4ee772",
  "email": "customer@example.com",
  "full_name": "Jane Doe",
  "role": "customer",
  "is_active": true,
  "created_at": "2026-10-20T14:30:00Z"
}
```

---

#### `POST /auth/login`
Authenticates credentials and returns a Bearer JWT access token.
- **Access**: Public
- **Content-Type**: `application/x-www-form-urlencoded` (or `application/json` depending on client configuration)
- **Request Body (JSON format)**:
```json
{
  "username": "customer@example.com",
  "password": "SecurePassword123!"
}
```
##### Response: `200 OK`
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "expires_in": 3600,
  "user": {
    "id": "e5861270-22c6-49dc-b290-d64b1f4ee772",
    "email": "customer@example.com",
    "full_name": "Jane Doe",
    "role": "customer"
  }
}
```

---

#### `GET /auth/me`
Retrieves the profile of the currently authenticated user.
- **Access**: Authenticated (`customer` or `admin`)
- **Headers**: `Authorization: Bearer <token>`

##### Response: `200 OK`
```json
{
  "id": "e5861270-22c6-49dc-b290-d64b1f4ee772",
  "email": "customer@example.com",
  "full_name": "Jane Doe",
  "role": "customer",
  "is_active": true,
  "created_at": "2026-10-20T14:30:00Z"
}
```

---

### 4.3 Products Endpoints

#### `GET /products`
Lists all active products in the catalog with pagination and optional category filtering.
- **Access**: Public
- **Query Parameters**:
  - `page` (integer, optional, default: `1`): Current page number.
  - `page_size` (integer, optional, default: `20`, max: `100`): Results per page.
  - `category` (string, optional): Filter by category name (e.g. `Electronics`).
  - `search` (string, optional): Search keyword matching title or description.

##### Example Request:
`GET /products?page=1&page_size=10&category=Electronics`

##### Response: `200 OK`
```json
{
  "items": [
    {
      "id": 1,
      "sku": "ELEC-HEAD-001",
      "title": "CloudMart ANC Wireless Headphones",
      "description": "Active Noise Cancelling over-ear headphones with 40-hour battery life.",
      "price": 149.99,
      "category": "Electronics",
      "image_url": "https://assets.cloudmart.com/products/headphones.png",
      "stock": 45,
      "is_active": true,
      "created_at": "2026-10-15T10:00:00Z"
    }
  ],
  "total": 1,
  "page": 1,
  "page_size": 10,
  "total_pages": 1
}
```

---

#### `GET /products/{id}`
Retrieves details for a single product by ID.
- **Access**: Public
- **Path Parameters**: `id` (integer, required)

##### Response: `200 OK`
```json
{
  "id": 1,
  "sku": "ELEC-HEAD-001",
  "title": "CloudMart ANC Wireless Headphones",
  "description": "Active Noise Cancelling over-ear headphones with 40-hour battery life.",
  "price": 149.99,
  "category": "Electronics",
  "image_url": "https://assets.cloudmart.com/products/headphones.png",
  "stock": 45,
  "is_active": true,
  "created_at": "2026-10-15T10:00:00Z"
}
```

---

#### `POST /products`
Creates a new product item and initializes its inventory.
- **Access**: Admin only (`role: admin`)
- **Headers**: `Authorization: Bearer <admin_token>`
- **Request Body**:
```json
{
  "sku": "ELEC-KEYB-002",
  "title": "CloudMart Mechanical Gaming Keyboard",
  "description": "RGB Backlit hot-swappable tactile mechanical switches.",
  "price": 89.99,
  "category": "Electronics",
  "image_url": "https://assets.cloudmart.com/products/keyboard.png",
  "stock": 100
}
```

##### Response: `201 Created`
```json
{
  "id": 2,
  "sku": "ELEC-KEYB-002",
  "title": "CloudMart Mechanical Gaming Keyboard",
  "description": "RGB Backlit hot-swappable tactile mechanical switches.",
  "price": 89.99,
  "category": "Electronics",
  "image_url": "https://assets.cloudmart.com/products/keyboard.png",
  "stock": 100,
  "is_active": true,
  "created_at": "2026-10-20T14:35:00Z"
}
```

---

#### `PUT /products/{id}`
Updates details of an existing product or modifies stock level.
- **Access**: Admin only (`role: admin`)
- **Headers**: `Authorization: Bearer <admin_token>`
- **Path Parameters**: `id` (integer, required)
- **Request Body**:
```json
{
  "title": "CloudMart Pro Mechanical Gaming Keyboard (V2)",
  "price": 94.99,
  "stock": 120
}
```

##### Response: `200 OK`
```json
{
  "id": 2,
  "sku": "ELEC-KEYB-002",
  "title": "CloudMart Pro Mechanical Gaming Keyboard (V2)",
  "description": "RGB Backlit hot-swappable tactile mechanical switches.",
  "price": 94.99,
  "category": "Electronics",
  "image_url": "https://assets.cloudmart.com/products/keyboard.png",
  "stock": 120,
  "is_active": true,
  "updated_at": "2026-10-20T14:36:00Z"
}
```

---

#### `DELETE /products/{id}`
Soft-deletes or archives a product from the catalog.
- **Access**: Admin only (`role: admin`)
- **Headers**: `Authorization: Bearer <admin_token>`
- **Path Parameters**: `id` (integer, required)

##### Response: `204 No Content`
*(Empty response body)*

---

### 4.4 Orders Endpoints

#### `POST /orders`
Creates a new customer order. Prices are computed entirely on the server using canonical database prices.
- **Access**: Authenticated (`customer` or `admin`)
- **Headers**: `Authorization: Bearer <token>`
- **Request Body**:
```json
{
  "items": [
    {
      "product_id": 1,
      "quantity": 2
    },
    {
      "product_id": 2,
      "quantity": 1
    }
  ],
  "shipping_address": "123 Cloud Way, Suite 400, Seattle, WA 98101",
  "payment_method": "mock_credit_card"
}
```

##### Response: `201 Created`
```json
{
  "id": 1001,
  "user_id": "e5861270-22c6-49dc-b290-d64b1f4ee772",
  "status": "CONFIRMED",
  "subtotal": 389.97,
  "tax": 31.20,
  "shipping_fee": 10.00,
  "total_amount": 431.17,
  "shipping_address": "123 Cloud Way, Suite 400, Seattle, WA 98101",
  "payment_status": "PAID",
  "created_at": "2026-10-20T14:40:00Z",
  "items": [
    {
      "id": 501,
      "product_id": 1,
      "title": "CloudMart ANC Wireless Headphones",
      "quantity": 2,
      "unit_price": 149.99,
      "total_price": 299.98
    },
    {
      "id": 502,
      "product_id": 2,
      "title": "CloudMart Pro Mechanical Gaming Keyboard (V2)",
      "quantity": 1,
      "unit_price": 89.99,
      "total_price": 89.99
    }
  ]
}
```

---

#### `GET /orders`
Retrieves all orders placed by the currently logged-in user.
- **Access**: Authenticated (`customer`)
- **Headers**: `Authorization: Bearer <token>`

##### Response: `200 OK`
```json
[
  {
    "id": 1001,
    "status": "CONFIRMED",
    "total_amount": 431.17,
    "items_count": 3,
    "created_at": "2026-10-20T14:40:00Z"
  }
]
```

---

#### `GET /orders/{id}`
Retrieves detailed breakdown of a specific order. Regular users can only access their own orders; admins can inspect any order.
- **Access**: Authenticated owner or Admin
- **Headers**: `Authorization: Bearer <token>`
- **Path Parameters**: `id` (integer, required)

##### Response: `200 OK`
```json
{
  "id": 1001,
  "user_id": "e5861270-22c6-49dc-b290-d64b1f4ee772",
  "status": "CONFIRMED",
  "subtotal": 389.97,
  "tax": 31.20,
  "shipping_fee": 10.00,
  "total_amount": 431.17,
  "shipping_address": "123 Cloud Way, Suite 400, Seattle, WA 98101",
  "payment_status": "PAID",
  "created_at": "2026-10-20T14:40:00Z",
  "items": [
    {
      "id": 501,
      "product_id": 1,
      "title": "CloudMart ANC Wireless Headphones",
      "quantity": 2,
      "unit_price": 149.99,
      "total_price": 299.98
    }
  ]
}
```

---

#### `GET /orders/admin/all`
Administrative endpoint to view all system orders with user email details.
- **Access**: Admin only (`role: admin`)
- **Headers**: `Authorization: Bearer <admin_token>`
- **Query Parameters**:
  - `status` (string, optional): Filter by order status (`PENDING`, `CONFIRMED`, `PROCESSING`, `SHIPPED`, `DELIVERED`, `CANCELLED`).
  - `limit` (integer, optional, default: `50`).
  - `offset` (integer, optional, default: `0`).

##### Response: `200 OK`
```json
{
  "orders": [
    {
      "id": 1001,
      "user_email": "customer@example.com",
      "status": "CONFIRMED",
      "total_amount": 431.17,
      "created_at": "2026-10-20T14:40:00Z"
    }
  ],
  "total": 1
}
```

---

#### `PUT /orders/{id}/status`
Updates order fulfillment status. If an order is set to `CANCELLED`, reserved stock is automatically refunded back to the `inventory` module.
- **Access**: Admin only (`role: admin`)
- **Headers**: `Authorization: Bearer <admin_token>`
- **Path Parameters**: `id` (integer, required)
- **Request Body**:
```json
{
  "status": "SHIPPED",
  "tracking_number": "TRK-98471928"
}
```

##### Response: `200 OK`
```json
{
  "id": 1001,
  "status": "SHIPPED",
  "tracking_number": "TRK-98471928",
  "updated_at": "2026-10-20T14:45:00Z"
}
```

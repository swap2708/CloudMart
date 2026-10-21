# CloudMart Architecture Decision Records (ADRs)

Architecture Decision Records (ADRs) capture significant architectural and technical decisions made during the design and development of CloudMart, along with their context, trade-offs, and consequences.

---

## Index of Decisions

- [ADR-001: Modular Monolith Over Immediate Microservices](#adr-001-modular-monolith-over-immediate-microservices)
- [ADR-002: PostgreSQL Over NoSQL Database](#adr-002-postgresql-over-nosql-database)
- [ADR-003: JWT Stateless Authentication Over Server Sessions](#adr-003-jwt-stateless-authentication-over-server-sessions)
- [ADR-004: In-Process Asynchronous Event Bus Over External Message Broker](#adr-004-in-process-asynchronous-event-bus-over-external-message-broker)
- [ADR-005: SQLite In-Memory Database for Automated Tests Over PostgreSQL](#adr-005-sqlite-in-memory-database-for-automated-tests-over-postgresql)
- [ADR-006: Docker Compose for Local Development Over Local Kubernetes](#adr-006-docker-compose-for-local-development-over-local-kubernetes)
- [ADR-007: Mock Payment Gateway Over External Production Payment Integration](#adr-007-mock-payment-gateway-over-external-production-payment-integration)
- [ADR-008: Strict Server-Side Order Price Calculation for Financial Security](#adr-008-strict-server-side-order-price-calculation-for-financial-security)

---

## ADR-001: Modular Monolith Over Immediate Microservices

### Status
**Accepted**

### Context
E-commerce architectures often default to microservices under the assumption that fine-grained services are necessary from day one. However, decomposing a small or developing application into multiple independent services introduces high operational tax: distributed transactions, eventual consistency challenges, cross-service network latency, complex API versioning, and heavy local development requirements.

### Decision
We build CloudMart as a **modular monolith** using FastAPI. The system is split into distinct domain modules (`auth`, `users`, `products`, `inventory`, `orders`, `notifications`) inside a single repository and runtime process. Modules communicate through internal interfaces and domain events, avoiding circular imports or direct table coupling.

### Consequences
- **Positive**:
  - Simplified deployment (one single container to build and run).
  - ACID transactions across order creation and stock reservation without two-phase commit overhead.
  - Zero cross-service network latency.
  - Straightforward migration path to microservices later by extracting clean module folders.
- **Negative**:
  - All domains scale together on compute resources.
  - A bug causing process memory exhaustion impacts all domains.

---

## ADR-002: PostgreSQL Over NoSQL Database

### Status
**Accepted**

### Context
E-commerce domains have strong relational models (Users place Orders, Orders contain OrderItems, OrderItems reference Products, Products have Inventory). Data integrity, non-negative stock counts, and financial transaction consistency are strict business requirements.

### Decision
We choose **PostgreSQL 16** as the sole primary datastore, managed through **SQLAlchemy 2.0** and **Alembic**.

### Consequences
- **Positive**:
  - Full ACID compliance protects financial transactions and order integrity.
  - Foreign key constraints prevent orphaned records.
  - Rich JSONB capabilities provide flexibility for schema-less attributes if needed in product listings.
  - Concurrency safety with conditional updates (`UPDATE inventory SET stock = stock - N WHERE stock >= N`).
- **Negative**:
  - Horizontal write scaling requires read-replicas or sharding at high scale.
  - Requires strict Alembic schema migrations during CI/CD.

---

## ADR-003: JWT Stateless Authentication Over Server Sessions

### Status
**Accepted**

### Context
Traditional session-based authentication requires a centralized shared session store (like Redis or sticky load balancer sessions) so multiple backend replicas can authenticate requests. Stateless tokens reduce backend storage overhead and allow the API to scale horizontally with zero shared session state.

### Decision
We implement **stateless JSON Web Tokens (JWT)** signed via HMAC-SHA256 (`HS256`) using `python-jose` and passwords hashed with `passlib[bcrypt]`. Tokens carry standard claims (`sub`, `exp`, `role`).

### Consequences
- **Positive**:
  - Completely stateless: Any backend replica can validate incoming requests without querying the database or Redis.
  - Decoupled client architecture: Works natively with web SPAs, mobile apps, and microservices.
  - Role-Based Access Control (RBAC) claims (`role: admin`) are embedded directly into token payloads.
- **Negative**:
  - Token revocation before expiration requires token blocklisting (short expiration times of 60 minutes are used to mitigate this).
  - Token payload is visible to anyone who decodes it (sensitive data must not be stored inside claims).

---

## ADR-004: In-Process Asynchronous Event Bus Over External Message Broker

### Status
**Accepted**

### Context
Certain order-related side effects (sending confirmation emails, firing audit alerts, metric tracking) should not block the primary HTTP request thread or cause an order transaction to fail if email dispatching encounters a network timeout. Deploying RabbitMQ or Kafka for local development introduces high RAM consumption and operational burden.

### Decision
For local development and baseline deployment, CloudMart implements an **in-process asynchronous event bus** utilizing Python's `asyncio.Queue` and background task execution. The event publisher and consumer interfaces are abstracted so external brokers (AWS SQS, RabbitMQ) can be swapped in without modifying domain code.

### Consequences
- **Positive**:
  - Zero external infrastructure dependencies for local development and unit tests.
  - Non-blocking execution: Customers receive HTTP 201 responses immediately while notifications process in the background.
  - Fault isolation: Failures in email dispatching do not abort completed database transactions.
- **Negative**:
  - In-flight events stored in memory could be lost if the server process terminates abruptly before workers finish processing. (Acceptable for non-critical notifications in development).

---

## ADR-005: SQLite In-Memory Database for Automated Tests Over PostgreSQL

### Status
**Accepted**

### Context
Running automated unit and integration tests against a live PostgreSQL container introduces latency, requires managing database credentials in test environments, and risks test pollution if cleanups fail between test runs. Developers and CI pipelines need tests to complete in seconds.

### Decision
All unit and module-level integration tests execute against an **in-memory SQLite database** (`sqlite+aiosqlite:///:memory:`). SQLAlchemy's `Base.metadata.create_all` generates tables directly in memory per test session, and each test runs inside a rollback-isolated transaction.

### Consequences
- **Positive**:
  - High performance: Entire backend test suite runs in under 4 seconds.
  - Zero environment friction: Tests execute without Docker, network ports, or credentials.
  - Perfect isolation: Tests run in pristine memory spaces with zero shared state.
- **Negative**:
  - Minor dialect differences: Advanced PostgreSQL-specific features (e.g. native JSON operators or specific locking syntax) must be avoided in core queries or guarded with conditional compatibility logic.

---

## ADR-006: Docker Compose for Local Development Over Local Kubernetes

### Status
**Accepted**

### Context
While Kubernetes is ideal for production container orchestration, running a local Kubernetes cluster (such as Minikube or Kind) during active code-and-debug cycles demands significant host resources (4-6 GB RAM) and introduces friction with image rebuilding and redeployment delays.

### Decision
We designate **Docker Compose v5** as the primary local development toolchain. Kubernetes manifests (`k8s/`) are maintained for staging, production, and cloud-native simulation, but local feature development uses `docker compose up`.

### Consequences
- **Positive**:
  - Fast feedback loop: Supports live-reload file mounting for FastAPI and Vite frontend.
  - Low resource footprint on developer laptops.
  - Simple CLI commands (`docker compose up`, `docker compose down`).
- **Negative**:
  - Developers must test in Minikube before submitting PRs to verify that Kubernetes manifests and network policies function properly.

---

## ADR-007: Mock Payment Gateway Over External Production Payment Integration

### Status
**Accepted**

### Context
Integrating production payment processors (e.g. Stripe, PayPal, Square) requires external merchant accounts, live API keys, webhook ingress tunnels (ngrok), and complex sandbox testing. CloudMart's primary objective is demonstrating cloud-native infrastructure, DevOps, and clean software architecture.

### Decision
We implement a **mock payment provider** that simulates payment processing synchronously or asynchronously. The provider accepts simulated tokens (e.g., `mock_credit_card`, `tok_success`, `tok_declined`) to validate authorization, decline handling, and ledger persistence.

### Consequences
- **Positive**:
  - Complete operational autonomy: Anyone can clone, test, and run the entire checkout workflow without registering for third-party merchant developer accounts.
  - Deterministic test cases for payment failures and retries.
- **Negative**:
  - Cannot be used in real commercial production without swapping the payment adapter for a PCI-compliant processor SDK.

---

## ADR-008: Strict Server-Side Order Price Calculation for Financial Security

### Status
**Accepted**

### Context
A classic vulnerability in naive e-commerce applications is trusting client-submitted prices in the checkout request payload (e.g., a malicious user modifying `{product_id: 1, price: 0.01}`).

### Decision
The `orders` module enforces **server-side canonical price computation**. When a checkout request arrives containing `[{product_id, quantity}]`, the backend:
1. Ignores any price fields provided in the HTTP request payload.
2. Queries the canonical price directly from the `products` table in the database.
3. Computes the subtotal, applies verified server-side tax/shipping rules, and calculates the final total.
4. Stores a point-in-time copy of `unit_price` on the `order_items` record.

### Consequences
- **Positive**:
  - Total defense against client-side parameter tampering and price spoofing.
  - Centralized accounting and tax logic on the trusted server.
  - Accurate historical order snapshots even if product catalog prices change later.
- **Negative**:
  - Checkout logic requires an additional database read to look up canonical product prices before writing the order. (Mitigated with efficient primary-key batch lookups: `WHERE id IN (...)`).

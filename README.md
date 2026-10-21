# CloudMart: Cloud-Native E-Commerce Platform

[![Python](https://img.shields.io/badge/Python-3.13-blue.svg?logo=python&logoColor=white)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115+-009688.svg?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-18-61DAFB.svg?logo=react&logoColor=black)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-5-646C99.svg?logo=vite&logoColor=white)](https://vitejs.dev/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1.svg?logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Docker](https://img.shields.io/badge/Docker-Compose_v5-2496ED.svg?logo=docker&logoColor=white)](https://www.docker.com/)
[![Kubernetes](https://img.shields.io/badge/Kubernetes-Minikube-326CE5.svg?logo=kubernetes&logoColor=white)](https://kubernetes.io/)
[![CI/CD](https://img.shields.io/badge/CI%2FCD-Jenkins-D24939.svg?logo=jenkins&logoColor=white)](https://www.jenkins.io/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

CloudMart is a modern, enterprise-ready, cloud-native e-commerce platform built as a **modular monolith** with clear domain boundaries designed for seamless microservices extraction. It showcases best-in-class cloud computing, container orchestration, automated CI/CD pipelines, and hybrid-cloud capabilities.

---

## Table of Contents

- [Overview & Architecture](#overview--architecture)
- [Key Features](#key-features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Quick Start with Docker Compose](#quick-start-with-docker-compose)
- [Local Development Setup (Without Docker)](#local-development-setup-without-docker)
- [Environment Configuration](#environment-configuration)
- [Available Scripts & Make Targets](#available-scripts--make-targets)
- [API Documentation](#api-documentation)
- [Testing](#testing)
- [Documentation Index](#documentation-index)
- [Contributing](#contributing)
- [License](#license)

---

## Overview & Architecture

CloudMart is engineered using a **modular monolith** architectural pattern. Business domains are cleanly decoupled within a single deployable unit, utilizing an in-process asynchronous event bus for inter-module domain events (such as order confirmation and inventory reservation).

```mermaid
graph TD
    subgraph Client["Client Tier"]
        SPA["React 18 + Vite SPA<br/>(Port: 5173 / 80)"]
    end

    subgraph Gateway["API Gateway / Ingress Tier"]
        Proxy["Nginx / Port Forward<br/>(Reverse Proxy)"]
    end

    subgraph Backend["CloudMart Core Application (FastAPI / Python 3.13)"]
        Router["FastAPI APIRouter & Middleware<br/>(CORS, JWT Auth, Logging)"]
        
        subgraph Domains["Modular Monolith Domains"]
            AuthMod["auth Module<br/>(JWT + Passlib Bcrypt)"]
            UserMod["users Module<br/>(User Management)"]
            ProdMod["products Module<br/>(Catalog Management)"]
            InvMod["inventory Module<br/>(Stock Control & Res)"]
            OrdMod["orders Module<br/>(Order Processing & Price Calc)"]
            NotifMod["notifications Module<br/>(Order Receipt / Alerts)"]
        end
        
        EventBus["In-Process Async Event Bus<br/>(Publish / Subscribe)"]
    end

    subgraph Storage["Persistence & Hybrid Integration"]
        PG[("PostgreSQL 16<br/>(CloudMart DB)")]
        LocalInv["Optional Local/Edge<br/>Inventory Service"]
        AWS_S3["AWS S3<br/>(Static Assets & Product Media)"]
    end

    SPA -->|REST API / HTTPS| Proxy
    Proxy -->|Proxy Pass / Port 8000| Router
    Router --> AuthMod
    Router --> UserMod
    Router --> ProdMod
    Router --> OrdMod
    
    OrdMod -->|Check & Decrement Stock| InvMod
    OrdMod -->|Publish OrderPlacedEvent| EventBus
    EventBus -->|Consume Event| NotifMod
    
    UserMod -->|SQLAlchemy 2.x| PG
    ProdMod -->|SQLAlchemy 2.x| PG
    InvMod -->|SQLAlchemy 2.x| PG
    OrdMod -->|SQLAlchemy 2.x| PG
    
    InvMod -.->|REST / Fallback| LocalInv
    ProdMod -.->|Object Storage| AWS_S3
```

---

## Key Features

### Customer Experience
- **Catalog Browsing & Search**: Search, category filtering, pagination, and real-time product availability.
- **Product Details**: High-resolution image galleries, dynamic stock count, and price breakdowns.
- **Resilient Shopping Cart**: Client-side persisted state with real-time server verification.
- **Secure Server-Side Checkout**: Server-authoritative price and discount calculation preventing client-side price tampering.
- **Order Tracking**: Order lifecycle updates (`PENDING` &rarr; `CONFIRMED` &rarr; `PROCESSING` &rarr; `SHIPPED` &rarr; `DELIVERED`).
- **User Authentication**: Secure signup, login, session validation using stateless JWT tokens.

### Admin Operations
- **Product Management**: Full CRUD operations for product inventory, SKU definitions, and price configurations.
- **Stock & Inventory Control**: Real-time stock increments, low-stock threshold alerts, and manual adjustments.
- **Order Fulfillment Dashboard**: View all global customer orders, modify fulfillment states, and cancel orders with automatic inventory restocking.
- **Customer Directory**: View registered customer profiles and account statuses.

---

## Tech Stack

| Component | Technology | Description |
| :--- | :--- | :--- |
| **Frontend** | React 18, Vite 5, JavaScript (ES6+), CSS3 | High-performance SPA with client-side routing |
| **Backend** | Python 3.13, FastAPI, Uvicorn (ASGI) | Modern asynchronous REST API framework |
| **ORM & Migrations** | SQLAlchemy 2.0 (asyncio-ready), Alembic | Schema migrations and declarative data models |
| **Database** | PostgreSQL 16 | Relational database with full ACID compliance |
| **Authentication** | JWT (`python-jose`), Bcrypt (`passlib`) | Stateless Bearer token authentication |
| **Containerization** | Docker, Docker Compose v5 | Container packaging & multi-container orchestration |
| **Orchestration** | Kubernetes (Minikube locally) | Production-ready declarative k8s manifests |
| **CI/CD** | Jenkins | Automated linting, testing, image build, and deployment |
| **Cloud (Target)** | AWS (S3, RDS, Lambda, CloudWatch) | Cloud infrastructure for scalable workloads |

---

## Project Structure

```text
CloudMart/
├── .env.example                  # Template environment variables
├── .gitignore                    # Git ignore configuration
├── docker-compose.yml            # Multi-container orchestration definition
├── Dockerfile.backend            # Multi-stage Dockerfile for FastAPI backend
├── Dockerfile.frontend           # Multi-stage Dockerfile for React frontend
├── Makefile                      # Standard project development automation targets
├── README.md                     # Project documentation overview
├── docs/                         # Detailed architecture and operational guides
│   ├── api.md                    # REST API specifications and schemas
│   ├── architecture.md           # Architecture overview, data flow, ERD
│   ├── aws-deployment.md         # AWS cloud deployment runbook
│   ├── decisions.md              # Architecture Decision Records (ADRs)
│   ├── docker.md                 # Docker & Compose deployment guide
│   ├── hybrid-cloud.md           # Hybrid-cloud & local inventory integration
│   ├── jenkins.md                # CI/CD Jenkins pipeline configuration
│   ├── kubernetes.md             # Kubernetes Minikube deployment guide
│   └── testing.md                # Unit, integration, and CI testing guide
├── backend/                      # FastAPI Python Application
│   ├── app/
│   │   ├── core/                 # Config, security, database session, event bus
│   │   ├── modules/              # Domain modules (auth, users, products, orders, etc.)
│   │   └── main.py               # FastAPI application entrypoint
│   ├── migrations/               # Alembic database migration scripts
│   ├── tests/                    # Pytest suite (unit and integration)
│   ├── pyproject.toml            # Poetry / Pip build metadata
│   └── requirements.txt          # Python runtime dependencies
├── frontend/                     # React 18 + Vite Application
│   ├── public/                   # Static public assets
│   ├── src/                      # React source code (components, pages, services)
│   ├── package.json              # Node.js dependencies and scripts
│   └── vite.config.js            # Vite build configuration
└── k8s/                          # Kubernetes Manifests
    ├── namespace.yaml            # CloudMart namespace
    ├── backend-deployment.yaml   # Backend deployment & service
    ├── frontend-deployment.yaml  # Frontend deployment & service
    ├── postgres-statefulset.yaml # PostgreSQL StatefulSet & PVC
    └── secrets.yaml              # Secret and ConfigMap templates
```

---

## Prerequisites

Before setting up CloudMart, ensure you have the following installed on your system:

- **Docker Desktop**: Version 4.x+ (with Compose v2 / v5 engine enabled)
- **Node.js**: Version 18.x or 20.x LTS (`npm` v9+)
- **Python**: Version 3.13 (`python --version`)
- **Git**: Version 2.40+
- **Minikube & Kubectl** *(Optional, for Kubernetes orchestration)*: Minikube v1.39+, Kubectl v1.36+

---

## Quick Start with Docker Compose

Get the entire CloudMart stack (PostgreSQL, Backend API, and Frontend SPA) running in less than 2 minutes using 5 commands:

```bash
# 1. Clone the repository
git clone https://github.com/your-org/cloudmart.git
cd CloudMart

# 2. Copy the environment configuration template
cp .env.example .env

# 3. Build and launch all services in detached mode
docker compose up --build -d

# 4. Verify system health
docker compose ps
curl http://localhost:8000/health

# 5. Access the applications
# Frontend Application:  http://localhost:5173 (or http://localhost:80 in production mode)
# Backend Swagger Docs:  http://localhost:8000/docs
# Backend ReDoc:         http://localhost:8000/redoc
```

To stop all services:
```bash
docker compose down
```

---

## Local Development Setup (Without Docker)

If you prefer to run services bare-metal on your host machine for development:

### 1. Database Setup
Ensure PostgreSQL 16 is installed and running locally on port 5432, or run a single database container:
```bash
docker run -d --name cloudmart-postgres -e POSTGRES_DB=cloudmart -e POSTGRES_USER=cloudmart_user -e POSTGRES_PASSWORD=cloudmart_pass -p 5432:5432 postgres:16-alpine
```

### 2. Backend Setup (FastAPI)
```bash
# Navigate to backend directory
cd backend

# Create and activate Python 3.13 virtual environment
python -m venv venv

# Windows (PowerShell):
.\venv\Scripts\Activate.ps1
# Linux / macOS:
# source venv/bin/activate

# Install dependencies
pip install --upgrade pip
pip install -r requirements.txt

# Run database migrations
alembic upgrade head

# Start development server with auto-reload
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

### 3. Frontend Setup (React + Vite)
```bash
# Open a new terminal and navigate to frontend directory
cd frontend

# Install Node.js packages
npm install

# Start Vite development server
npm run dev
```

The frontend will be accessible at `http://localhost:5173`.

---

## Environment Configuration

CloudMart uses environment variables for all configuration. Copy `.env.example` to `.env` in the project root:

```ini
# --- Application Environment ---
ENVIRONMENT=development
DEBUG=True
SECRET_KEY=super-secret-development-jwt-key-change-in-production-32bytes!
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60

# --- Database (PostgreSQL) ---
POSTGRES_SERVER=localhost
POSTGRES_PORT=5432
POSTGRES_USER=cloudmart_user
POSTGRES_PASSWORD=cloudmart_pass
POSTGRES_DB=cloudmart
DATABASE_URL=postgresql+asyncpg://cloudmart_user:cloudmart_pass@localhost:5432/cloudmart

# --- Frontend Configuration ---
VITE_API_BASE_URL=http://localhost:8000

# --- Hybrid Cloud / Inventory ---
INVENTORY_SERVICE_MODE=local
LOCAL_INVENTORY_URL=http://localhost:8001/api/v1/stock

# --- AWS Configuration (Future Deployment) ---
AWS_REGION=us-east-1
AWS_S3_BUCKET_NAME=cloudmart-product-images-prod
```

---

## Available Scripts & Make Targets

A `Makefile` is included to streamline common developer actions:

| Make Target | Shell Command | Description |
| :--- | :--- | :--- |
| `make up` | `docker compose up -d` | Start all services via Docker Compose |
| `make down` | `docker compose down` | Stop all services |
| `make down-v` | `docker compose down -v` | Stop services and purge database volumes |
| `make build` | `docker compose build` | Rebuild application container images |
| `make test` | `pytest backend/tests -v` | Run backend test suite with Pytest |
| `make test-cov` | `pytest --cov=app backend/tests` | Run tests with coverage reporting |
| `make migrate` | `cd backend && alembic upgrade head` | Run pending database migrations |
| `make lint` | `flake8 backend && npm run lint --prefix frontend` | Check backend and frontend code quality |
| `make clean` | `find . -name "*.pyc" -delete` | Remove cached bytecode and temporary files |

---

## API Documentation

FastAPI automatically generates interactive OpenAPI documentation:
- **Interactive Swagger UI**: [http://localhost:8000/docs](http://localhost:8000/docs)
- **ReDoc Specification**: [http://localhost:8000/redoc](http://localhost:8000/redoc)
- **OpenAPI Schema (JSON)**: [http://localhost:8000/openapi.json](http://localhost:8000/openapi.json)

For comprehensive endpoint specifications, schemas, and request/response payloads, read [`docs/api.md`](docs/api.md).

---

## Testing

CloudMart follows a strict test-isolation philosophy. Unit tests run using fast SQLite in-memory databases without external dependencies:

```bash
# Run backend test suite
cd backend
pytest tests/ -v

# Run with test coverage
pytest --cov=app tests/ --cov-report=term-missing
```

For full testing documentation, see [`docs/testing.md`](docs/testing.md).

---

## Documentation Index

Explore the comprehensive engineering documentation in the [`docs/`](docs/) directory:

- [**Architecture Guide**](docs/architecture.md): Deep-dive into domain modularity, data flows, sequence diagrams, and DB schema.
- [**API Specification**](docs/api.md): Complete list of REST endpoints, authentication flows, and JSON schemas.
- [**Testing Guide**](docs/testing.md): Unit testing, integration testing, SQLite test fixtures, and coverage metrics.
- [**Docker Runbook**](docs/docker.md): Multi-stage builds, volume management, compose recipes, and container troubleshooting.
- [**Kubernetes Deployment**](docs/kubernetes.md): Minikube deployment, secrets management, service routing, and operations.
- [**Jenkins CI/CD**](docs/jenkins.md): Pipeline stages, automated testing, container build pipelines, and webhooks.
- [**AWS Cloud Architecture**](docs/aws-deployment.md): Target cloud architecture (ECS, RDS, S3, Lambda), security, and cost controls.
- [**Hybrid Cloud Integration**](docs/hybrid-cloud.md): Architecture for edge/on-premise inventory synchronization.
- [**Architecture Decision Records (ADRs)**](docs/decisions.md): Documented rationales behind key architectural and technology decisions.

---

## Contributing

1. Fork the repository.
2. Create your feature branch (`git checkout -b feature/amazing-feature`).
3. Commit your changes (`git commit -m 'feat: add amazing feature'`).
4. Ensure all tests pass (`pytest` and `npm test`).
5. Push to the branch (`git push origin feature/amazing-feature`).
6. Open a Pull Request.

---

## License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.
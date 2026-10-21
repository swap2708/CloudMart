# ==============================================================================
# CloudMart - Makefile
# ==============================================================================
# Helpful commands for managing CloudMart local containers and workflows.
# Works with GNU Make on Linux/macOS/Windows.
#
# PowerShell Equivalents for Windows users:
# ------------------------------------------------------------------------------
# make dev            -> docker compose up -d
# make dev-build      -> docker compose up -d --build
# make stop           -> docker compose down
# make reset-db       -> docker compose down -v; docker compose up -d
# make test           -> docker compose -f docker-compose.test.yml up --abort-on-container-exit --exit-code-from backend-test
# make logs           -> docker compose logs -f
# make migrate        -> docker compose exec backend alembic upgrade head
# make seed           -> docker compose exec backend python seed_data.py
# make shell-backend  -> docker compose exec backend bash
# make shell-db       -> docker compose exec postgres psql -U cloudmart -d cloudmart
# ==============================================================================

.PHONY: help dev dev-build stop reset-db test logs migrate seed shell-backend shell-db

help:
	@echo "CloudMart Build & Orchestration Targets:"
	@echo "  dev            Start all development services in background"
	@echo "  dev-build      Rebuild and start all development services"
	@echo "  stop           Stop all development services"
	@echo "  reset-db       Tear down database volume and restart fresh"
	@echo "  test           Run backend tests using docker-compose.test.yml"
	@echo "  logs           Tail container logs in real time"
	@echo "  migrate        Run database migrations via Alembic"
	@echo "  seed           Seed database with initial data"
	@echo "  shell-backend  Open interactive bash shell in backend container"
	@echo "  shell-db       Open psql prompt inside postgres container"

dev:
	docker compose up -d

dev-build:
	docker compose up -d --build

stop:
	docker compose down

reset-db:
	docker compose down -v && docker compose up -d

test:
	docker compose -f docker-compose.test.yml up --abort-on-container-exit --exit-code-from backend-test

logs:
	docker compose logs -f

migrate:
	docker compose exec backend alembic upgrade head

seed:
	docker compose exec backend python seed_data.py

shell-backend:
	docker compose exec backend bash

shell-db:
	docker compose exec postgres psql -U cloudmart -d cloudmart

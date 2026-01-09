.PHONY: help up down logs db-shell check test seed simulate certs certs-force prod-up prod-down prod-logs prod-build prod-restart

help:
	@echo "Available commands:"
	@echo "  make up          - Start all services"
	@echo "  make down        - Stop all services"
	@echo "  make logs        - Show logs from all services"
	@echo "  make db-shell    - Connect to PostgreSQL database"
	@echo "  make check       - Run all checks (lint, type-check, test)"
	@echo "  make test        - Run pytest"
	@echo "  make seed        - Create test plants, devices, and telemetry"
	@echo "  make simulate    - Run device simulator (continuous telemetry)"
	@echo "  make certs       - Generate TLS certificates"
	@echo "  make certs-force - Regenerate TLS certificates (overwrites existing)"
	@echo "  make prod-up     - Start production stack"
	@echo "  make prod-down   - Stop production stack"
	@echo "  make prod-logs   - View production logs"
	@echo "  make prod-build  - Build production images"
	@echo "  make prod-restart - Restart production stack"

up:
	docker compose up -d

down:
	docker compose down

logs:
	docker compose logs -f

db-shell:
	docker compose exec db psql -U plantops -d plantops

check:
	cd backend && python3 -m pytest tests/ -v
	cd frontend && npm run build

test:
	cd backend && python3 -m pytest tests/

seed:
	pip install -q paho-mqtt requests 2>/dev/null || true
	python3 scripts/seed.py

simulate:
	pip install -q paho-mqtt requests 2>/dev/null || true
	python3 scripts/simulator.py

certs:
	./scripts/generate_certs.sh

certs-force:
	./scripts/generate_certs.sh --force

# Production commands
prod-up: ## Start production stack
	docker compose -f docker-compose.prod.yml up -d

prod-down: ## Stop production stack
	docker compose -f docker-compose.prod.yml down

prod-logs: ## View production logs
	docker compose -f docker-compose.prod.yml logs -f

prod-build: ## Build production images
	docker compose -f docker-compose.prod.yml build

prod-restart: ## Restart production stack
	docker compose -f docker-compose.prod.yml restart

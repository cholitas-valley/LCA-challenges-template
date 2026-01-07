.PHONY: help up down logs db-shell check test

help:
	@echo "Available commands:"
	@echo "  make up        - Start all services"
	@echo "  make down      - Stop all services"
	@echo "  make logs      - Show logs from all services"
	@echo "  make db-shell  - Connect to PostgreSQL database"
	@echo "  make check     - Run all checks (lint, type-check, test)"
	@echo "  make test      - Run pytest"

up:
	docker compose up -d

down:
	docker compose down

logs:
	docker compose logs -f

db-shell:
	docker compose exec db psql -U plantops -d plantops

check:
	cd backend && python -m pytest tests/ && python -m ruff check src/ && python -m mypy src/

test:
	cd backend && python -m pytest tests/

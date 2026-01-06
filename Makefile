.PHONY: up down logs lint typecheck test e2e check

# Start all services
up:
	docker compose up -d

# Stop all services
down:
	docker compose down

# Show logs from all services
logs:
	docker compose logs -f

# Run linting (stub for now)
lint:
	@echo "Running lint..."
	@echo "Lint check passed (no linters configured yet)"

# Run type checking
typecheck:
	@echo "Running typecheck..."
	@if [ -d backend/src ]; then \
		echo "Type checking backend..."; \
		cd backend && npm run typecheck; \
	fi
	@if [ -d simulator/src ]; then \
		echo "Type checking simulator..."; \
		cd simulator && npm run typecheck; \
	fi
	@if [ -d worker/src ]; then \
		echo "Type checking worker..."; \
		cd worker && npm run typecheck; \
	fi
	@if [ -d frontend/src ]; then \
		echo "Type checking frontend..."; \
		cd frontend && npm run typecheck; \
	fi

# Run tests
test:
	@echo "Running tests..."
	@if [ -d backend/src ]; then \
		echo "Testing backend..."; \
		cd backend && npm test; \
	fi
	@if [ -d worker/src ]; then \
		echo "Testing worker..."; \
		cd worker && npm test; \
	fi
	@echo "All tests passed"

# Run e2e tests
e2e:
	@echo "Running e2e tests..."
	@echo "Starting services..."
	@docker compose up -d
	@echo "Waiting for services to be ready..."
	@./scripts/wait-for-services.sh
	@echo "Running Playwright tests..."
	@npm run test:e2e
	@echo "E2E tests passed"

# Run all quality gates
check:
	@echo "Running all quality gates..."
	@$(MAKE) lint
	@$(MAKE) typecheck
	@$(MAKE) test
	@$(MAKE) e2e
	@echo "All checks passed!"

---
task_id: task-003
title: Backend API foundation
role: lca-backend
follow_roles: []
post:
  - lca-recorder
  - lca-gitops
depends_on:
  - task-002
inputs:
  - objective.md
  - runs/plan.md
  - runs/handoffs/task-002.md
allowed_paths:
  - backend/**
check_command: cd backend && python -m pytest tests/ -v --tb=short
handoff: runs/handoffs/task-003.md
---

# Task 003: Backend API Foundation

## Goal

Build the FastAPI application foundation with proper structure, configuration management, Pydantic models, error handling, and the health endpoint. This establishes the API patterns that all subsequent endpoints will follow.

## Requirements

### Configuration (backend/src/config.py)

Create settings class with:
```python
class Settings(BaseSettings):
    database_url: str
    mqtt_host: str = "mosquitto"
    mqtt_port: int = 1883
    discord_webhook_url: str | None = None
    encryption_key: str  # For LLM API key encryption
    
    model_config = ConfigDict(env_file=".env")
```

### Application Structure

Reorganize `backend/src/main.py`:
- FastAPI app with lifespan handler
- Include routers (empty for now)
- CORS middleware
- Exception handlers
- Health endpoint at `/api/health`

Create `backend/src/routers/__init__.py` (empty package)

### Pydantic Models (backend/src/models/)

Create base models:

**backend/src/models/__init__.py**
- Export all models

**backend/src/models/common.py**
```python
class HealthResponse(BaseModel):
    status: str
    timestamp: datetime
    version: str

class ErrorResponse(BaseModel):
    error: str
    detail: str | None = None
```

### Error Handling

Create `backend/src/exceptions.py`:
```python
class PlantOpsError(Exception):
    """Base exception for PlantOps"""
    
class NotFoundError(PlantOpsError):
    """Resource not found"""
    
class ValidationError(PlantOpsError):
    """Validation failed"""
    
class AuthenticationError(PlantOpsError):
    """Authentication failed"""
```

Add exception handlers in main.py that return proper HTTP responses.

### Tests

Update `backend/tests/test_health.py`:
- Test health endpoint returns 200
- Test response includes status, timestamp, version

Create `backend/tests/conftest.py`:
- pytest fixtures for test client
- Use httpx AsyncClient for async tests

## Definition of Done

- [ ] `backend/src/config.py` exists with Settings class
- [ ] `backend/src/main.py` has proper FastAPI structure
- [ ] `backend/src/models/common.py` exists with base models
- [ ] `backend/src/exceptions.py` exists with custom exceptions
- [ ] `backend/src/routers/__init__.py` exists
- [ ] Health endpoint at `/api/health` returns proper response
- [ ] All tests pass with `pytest tests/ -v`
- [ ] Exception handlers return ErrorResponse format

## Constraints

- Do NOT connect to database in this task
- Do NOT implement business logic endpoints
- Keep dependencies minimal
- Use async/await consistently

---
task_id: task-030
title: Structured Logging with Correlation IDs
role: lca-backend
follow_roles: []
post:
  - lca-recorder
  - code-simplifier
  - lca-gitops
depends_on: []
inputs:
  - objective.md
  - runs/plan.md
allowed_paths:
  - backend/**
check_command: make check
handoff: runs/handoffs/task-030.md
---

# Task 030: Structured Logging with Correlation IDs

## Goal

Implement structured JSON logging using structlog with request correlation IDs for traceability. Logs should be configurable between human-readable (development) and JSON format (production).

## Requirements

### Dependencies

Add to `backend/pyproject.toml`:

```toml
dependencies = [
    # ... existing deps ...
    "structlog>=24.1.0",
]
```

### Configuration

Update `backend/src/config.py`:

```python
class Settings(BaseSettings):
    # ... existing settings ...
    
    # Logging settings
    log_level: str = "INFO"  # DEBUG, INFO, WARNING, ERROR
    log_format: str = "console"  # "console" for dev, "json" for prod
```

### Logging Setup

Create `backend/src/logging_config.py`:

```python
import logging
import structlog
from src.config import settings


def setup_logging() -> None:
    """
    Configure structlog for structured logging.
    
    Uses JSON format in production, colored console output in development.
    """
    # Shared processors
    shared_processors = [
        structlog.contextvars.merge_contextvars,
        structlog.processors.add_log_level,
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.processors.StackInfoRenderer(),
    ]
    
    if settings.log_format == "json":
        # Production: JSON format
        structlog.configure(
            processors=shared_processors + [
                structlog.processors.format_exc_info,
                structlog.processors.JSONRenderer(),
            ],
            wrapper_class=structlog.make_filtering_bound_logger(
                getattr(logging, settings.log_level.upper())
            ),
            context_class=dict,
            logger_factory=structlog.PrintLoggerFactory(),
            cache_logger_on_first_use=True,
        )
    else:
        # Development: Human-readable
        structlog.configure(
            processors=shared_processors + [
                structlog.dev.ConsoleRenderer(colors=True),
            ],
            wrapper_class=structlog.make_filtering_bound_logger(
                getattr(logging, settings.log_level.upper())
            ),
            context_class=dict,
            logger_factory=structlog.PrintLoggerFactory(),
            cache_logger_on_first_use=True,
        )
    
    # Also configure standard logging to use structlog
    logging.basicConfig(
        format="%(message)s",
        level=getattr(logging, settings.log_level.upper()),
    )


def get_logger(name: str | None = None) -> structlog.BoundLogger:
    """Get a structlog logger instance."""
    return structlog.get_logger(name)
```

### Correlation ID Middleware

Create `backend/src/middleware/correlation.py`:

```python
import uuid
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
import structlog


class CorrelationMiddleware(BaseHTTPMiddleware):
    """
    Middleware that adds correlation ID to each request.
    
    - Checks for X-Correlation-ID header
    - Generates new ID if not present
    - Adds to structlog context for all log messages
    - Adds to response headers
    """
    
    HEADER_NAME = "X-Correlation-ID"
    
    async def dispatch(self, request: Request, call_next):
        # Get or generate correlation ID
        correlation_id = request.headers.get(self.HEADER_NAME)
        if not correlation_id:
            correlation_id = str(uuid.uuid4())
        
        # Bind to structlog context
        structlog.contextvars.clear_contextvars()
        structlog.contextvars.bind_contextvars(
            correlation_id=correlation_id,
            path=request.url.path,
            method=request.method,
        )
        
        # Process request
        response = await call_next(request)
        
        # Add correlation ID to response
        response.headers[self.HEADER_NAME] = correlation_id
        
        return response
```

### Update Main Application

Update `backend/src/main.py`:

```python
from src.logging_config import setup_logging, get_logger
from src.middleware.correlation import CorrelationMiddleware

# Setup logging early
setup_logging()
logger = get_logger(__name__)

# ... existing code ...

# Add correlation middleware (before CORS)
app.add_middleware(CorrelationMiddleware)

# Update health endpoint to use structured logging
@app.get("/api/health")
async def health():
    logger.info("health_check", status="healthy")
    # ... rest of implementation
```

### Update Services to Use Structured Logging

Update key services to use structlog:

```python
# Example: backend/src/services/telemetry_handler.py
from src.logging_config import get_logger

logger = get_logger(__name__)

class TelemetryHandler:
    async def handle_telemetry(self, device_id: str, payload: dict):
        logger.info(
            "telemetry_received",
            device_id=device_id,
            soil_moisture=payload.get("soil_moisture"),
            temperature=payload.get("temperature"),
        )
        # ... rest of implementation
```

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `LOG_LEVEL` | `INFO` | Logging level (DEBUG, INFO, WARNING, ERROR) |
| `LOG_FORMAT` | `console` | Log format ("console" or "json") |

### Docker Compose Update

Update `docker-compose.yml`:

```yaml
backend:
  environment:
    LOG_LEVEL: ${LOG_LEVEL:-INFO}
    LOG_FORMAT: ${LOG_FORMAT:-console}
```

### Tests

Add tests in `backend/tests/test_logging.py`:

```python
import pytest
from src.logging_config import setup_logging, get_logger

def test_get_logger_returns_bound_logger():
    """Test get_logger returns a structlog logger."""
    setup_logging()
    logger = get_logger("test")
    assert logger is not None
    # Logger should be callable
    logger.info("test_message", key="value")

def test_correlation_middleware_adds_header(client):
    """Test correlation middleware adds X-Correlation-ID header."""
    response = client.get("/api/health")
    assert "X-Correlation-ID" in response.headers
    # Should be a valid UUID
    import uuid
    uuid.UUID(response.headers["X-Correlation-ID"])

def test_correlation_middleware_preserves_incoming_id(client):
    """Test correlation middleware preserves incoming correlation ID."""
    test_id = "test-correlation-123"
    response = client.get(
        "/api/health",
        headers={"X-Correlation-ID": test_id}
    )
    assert response.headers["X-Correlation-ID"] == test_id
```

## Constraints

- Do not break existing logging functionality
- Maintain backward compatibility with stdlib logging
- JSON format must be valid JSON on each line
- Context (device_id, plant_id) should be included where available

## Definition of Done

- [ ] structlog dependency added
- [ ] `LOG_LEVEL` environment variable configures log level
- [ ] `LOG_FORMAT=json` produces JSON log output
- [ ] `LOG_FORMAT=console` produces human-readable output
- [ ] Correlation IDs added to all request logs
- [ ] X-Correlation-ID header in responses
- [ ] Key services updated to use structured logging
- [ ] Tests for logging configuration
- [ ] All existing tests still pass (`make check`)

## Notes

Example JSON log output:
```json
{"event": "telemetry_received", "device_id": "dev-001", "soil_moisture": 45.2, "correlation_id": "abc-123", "timestamp": "2026-01-09T12:00:00Z", "level": "info"}
```

Example console log output:
```
2026-01-09T12:00:00Z [info     ] telemetry_received device_id=dev-001 soil_moisture=45.2
```

The correlation ID allows tracing a single request across all log entries, which is essential for debugging in production.

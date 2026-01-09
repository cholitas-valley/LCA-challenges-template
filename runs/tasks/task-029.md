---
task_id: task-029
title: Health and Ready Endpoints with Connection Status
role: lca-backend
follow_roles: []
post:
  - lca-recorder
  - code-simplifier
  - lca-gitops
depends_on:
  - task-028
inputs:
  - objective.md
  - runs/plan.md
  - runs/handoffs/task-028.md
allowed_paths:
  - backend/**
check_command: make check
handoff: runs/handoffs/task-029.md
---

# Task 029: Health and Ready Endpoints with Connection Status

## Goal

Enhance the health check endpoint to report component status (database, MQTT) and add a readiness endpoint that returns 503 when critical components are disconnected.

## Requirements

### Health Response Model

Update `backend/src/models/health_check.py`:

```python
from datetime import datetime
from pydantic import BaseModel


class ComponentStatus(BaseModel):
    """Status of a single component."""
    status: str  # "connected", "disconnected", "error"
    message: str | None = None


class HealthResponse(BaseModel):
    """Health check response with component status."""
    status: str  # "healthy", "degraded", "unhealthy"
    timestamp: datetime
    version: str
    components: dict[str, ComponentStatus]


class ReadyResponse(BaseModel):
    """Readiness check response."""
    ready: bool
    checks: dict[str, bool]
```

### Connection State Tracking

Update `backend/src/services/mqtt_subscriber.py` to track connection state:

```python
class MQTTSubscriber:
    def __init__(self, ...):
        # ... existing init ...
        self._connected = False
    
    @property
    def is_connected(self) -> bool:
        """Return current connection state."""
        return self._connected
    
    async def connect(self) -> None:
        # ... existing connect ...
        self._connected = True
    
    async def disconnect(self) -> None:
        self._connected = False
        # ... existing disconnect ...
    
    async def _listen_loop(self) -> None:
        # On error, set _connected = False
        # On successful reconnect, set _connected = True
```

### Database Health Check

Add `backend/src/db/health.py`:

```python
from src.db.connection import get_pool

async def check_database_health() -> tuple[bool, str | None]:
    """
    Check database connectivity.
    
    Returns:
        Tuple of (is_healthy, error_message)
    """
    try:
        pool = get_pool()
        async with pool.acquire() as conn:
            await conn.fetchval("SELECT 1")
        return True, None
    except Exception as e:
        return False, str(e)
```

### Updated Health Endpoint

Update `backend/src/main.py`:

```python
from src.db.health import check_database_health

@app.get("/api/health", response_model=HealthResponse)
async def health() -> HealthResponse:
    """
    Health check endpoint with component status.
    
    Returns overall health based on component states:
    - healthy: All components connected
    - degraded: Some components disconnected
    - unhealthy: Critical components disconnected
    """
    # Check database
    db_ok, db_error = await check_database_health()
    db_status = ComponentStatus(
        status="connected" if db_ok else "disconnected",
        message=db_error,
    )
    
    # Check MQTT
    mqtt_connected = app.state.mqtt.is_connected if hasattr(app.state, 'mqtt') else False
    mqtt_status = ComponentStatus(
        status="connected" if mqtt_connected else "disconnected",
    )
    
    # Determine overall status
    if db_ok and mqtt_connected:
        overall = "healthy"
    elif db_ok or mqtt_connected:
        overall = "degraded"
    else:
        overall = "unhealthy"
    
    return HealthResponse(
        status=overall,
        timestamp=datetime.now(),
        version="1.0.0",
        components={
            "database": db_status,
            "mqtt": mqtt_status,
        },
    )
```

### Readiness Endpoint

Add to `backend/src/main.py`:

```python
from fastapi import Response

@app.get("/api/ready", response_model=ReadyResponse)
async def ready(response: Response) -> ReadyResponse:
    """
    Readiness probe for orchestration (k8s, Docker).
    
    Returns 200 if ready to serve traffic, 503 if not.
    Both database and MQTT must be connected for readiness.
    """
    # Check database
    db_ok, _ = await check_database_health()
    
    # Check MQTT
    mqtt_ok = app.state.mqtt.is_connected if hasattr(app.state, 'mqtt') else False
    
    ready = db_ok and mqtt_ok
    
    if not ready:
        response.status_code = 503
    
    return ReadyResponse(
        ready=ready,
        checks={
            "database": db_ok,
            "mqtt": mqtt_ok,
        },
    )
```

### Tests

Add tests in `backend/tests/test_health.py`:

```python
import pytest
from unittest.mock import AsyncMock, patch

@pytest.mark.asyncio
async def test_health_all_connected(client, mock_mqtt):
    """Test health returns healthy when all components connected."""
    mock_mqtt.is_connected = True
    with patch('src.main.check_database_health', return_value=(True, None)):
        response = await client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["components"]["database"]["status"] == "connected"
    assert data["components"]["mqtt"]["status"] == "connected"

@pytest.mark.asyncio
async def test_health_mqtt_disconnected(client, mock_mqtt):
    """Test health returns degraded when MQTT disconnected."""
    mock_mqtt.is_connected = False
    with patch('src.main.check_database_health', return_value=(True, None)):
        response = await client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "degraded"
    assert data["components"]["mqtt"]["status"] == "disconnected"

@pytest.mark.asyncio
async def test_ready_returns_503_when_not_ready(client, mock_mqtt):
    """Test ready returns 503 when components disconnected."""
    mock_mqtt.is_connected = False
    with patch('src.main.check_database_health', return_value=(True, None)):
        response = await client.get("/api/ready")
    assert response.status_code == 503
    data = response.json()
    assert data["ready"] is False

@pytest.mark.asyncio
async def test_ready_returns_200_when_ready(client, mock_mqtt):
    """Test ready returns 200 when all components connected."""
    mock_mqtt.is_connected = True
    with patch('src.main.check_database_health', return_value=(True, None)):
        response = await client.get("/api/ready")
    assert response.status_code == 200
    data = response.json()
    assert data["ready"] is True
```

## Constraints

- Do not break existing health endpoint tests
- Health endpoint should always return 200 (even if unhealthy)
- Ready endpoint returns 503 when not ready
- Connection state must be thread-safe

## Definition of Done

- [ ] `HealthResponse` model includes component status
- [ ] `ReadyResponse` model created
- [ ] `MQTTSubscriber.is_connected` property tracks connection state
- [ ] Database health check function created
- [ ] `/api/health` returns component status
- [ ] `/api/ready` returns 503 when disconnected
- [ ] Tests for all health scenarios added
- [ ] All existing tests still pass (`make check`)

## Notes

The health endpoint should always return HTTP 200 - it reports the health status in the response body. The ready endpoint returns 503 to allow load balancers and orchestrators to remove unhealthy instances from rotation.

For Docker health checks, use the ready endpoint:
```yaml
healthcheck:
  test: ["CMD", "curl", "-f", "http://localhost:8000/api/ready"]
  interval: 10s
  timeout: 5s
  retries: 3
```

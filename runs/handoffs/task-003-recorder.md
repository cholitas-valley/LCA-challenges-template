# Recorder: task-003

## Changes Summary

Established FastAPI backend foundation with configuration management, exception handling, Pydantic models, and API patterns.

## Key Files

- `backend/src/config.py`: Settings class with database_url, mqtt_host/port, discord_webhook_url, encryption_key
- `backend/src/exceptions.py`: PlantOpsError, NotFoundError, ValidationError, AuthenticationError
- `backend/src/models/__init__.py`: Package exports
- `backend/src/models/common.py`: HealthResponse, ErrorResponse models
- `backend/src/routers/__init__.py`: Empty router package (ready for domain routers)
- `backend/src/main.py`: FastAPI with lifespan, CORS, exception handlers, /api/health endpoint
- `backend/tests/conftest.py`: async_client fixture with AsyncClient
- `backend/tests/test_health.py`: 2 passing tests for health endpoint

## Interfaces for Next Task

### Settings
```python
from src.config import settings
settings.database_url, settings.mqtt_host, settings.encryption_key
```

### Exceptions
```python
from src.exceptions import NotFoundError, ValidationError
raise NotFoundError("message")  # Auto-converts to HTTP 404 with ErrorResponse
```

### Models
```python
from src.models import HealthResponse, ErrorResponse
```

### Router Pattern
```python
from src.routers.plants import router as plants_router
app.include_router(plants_router, prefix="/api/plants")
```

### Test Pattern
```python
@pytest.mark.asyncio
async def test_endpoint(async_client: AsyncClient):
    response = await async_client.get("/api/endpoint")
```

## Notes

- Lifespan handler empty - ready for DB pool init
- CORS allow_origins=["*"] - restrict for production
- Settings validates at import - requires .env with DATABASE_URL, ENCRYPTION_KEY
- All endpoints must use async/await and response_model parameters

# Task 029: Health and Ready Endpoints with Connection Status - Handoff

## Summary

Successfully enhanced the health check endpoint to report component status (database and MQTT) and added a readiness endpoint that returns 503 when critical components are disconnected. The solution includes:

1. **Health check models** - Added ComponentStatus, HealthResponse, and ReadyResponse models
2. **Connection state tracking** - Added is_connected property to MQTTSubscriber
3. **Database health check** - Created check_database_health() function
4. **Enhanced health endpoint** - Returns component status and overall health (healthy/degraded/unhealthy)
5. **Readiness endpoint** - Returns 200 when ready, 503 when not ready
6. **Test coverage** - Added 7 new tests covering all health scenarios

All 126 tests pass, including 9 new/updated tests for health functionality.

## Files Touched

### Created Files
- `backend/src/db/health.py` - Database health check function

### Modified Files
- `backend/src/models/health_check.py` - Added ComponentStatus, HealthResponse, and ReadyResponse models
- `backend/src/models/common.py` - Removed old HealthResponse (moved to health_check.py)
- `backend/src/models/__init__.py` - Removed HealthResponse export (now in health_check.py)
- `backend/src/services/mqtt_subscriber.py` - Added _connected state tracking and is_connected property
- `backend/src/main.py` - Enhanced health endpoint and added ready endpoint
- `backend/tests/test_health.py` - Added 7 new tests and updated 2 existing tests
- `backend/tests/test_mqtt_subscriber.py` - Added test for is_connected property and updated instantiation test

## Interfaces Changed

### New Models (backend/src/models/health_check.py)

Added three new models for system health:

```python
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

### MQTTSubscriber Connection State (backend/src/services/mqtt_subscriber.py)

Added connection state tracking:

```python
class MQTTSubscriber:
    def __init__(self, ...):
        # ... existing fields ...
        self._connected = False
    
    @property
    def is_connected(self) -> bool:
        """Return current connection state."""
        return self._connected
```

Connection state is updated:
- Set to True when connect() succeeds
- Set to False on disconnect() or connection errors
- Set to False in _listen_loop when MQTT errors occur

### Database Health Check (backend/src/db/health.py)

New function to check database connectivity:

```python
async def check_database_health() -> tuple[bool, str | None]:
    """
    Check database connectivity.
    
    Returns:
        Tuple of (is_healthy, error_message)
    """
```

### Enhanced Health Endpoint (backend/src/main.py)

Updated `/api/health` to return component status:

```python
@app.get("/api/health", response_model=HealthResponse)
async def health() -> HealthResponse:
    """
    Health check endpoint with component status.
    
    Returns overall health based on component states:
    - healthy: All components connected
    - degraded: Some components disconnected
    - unhealthy: Critical components disconnected
    """
```

Example response:
```json
{
  "status": "healthy",
  "timestamp": "2026-01-10T12:00:00",
  "version": "0.1.0",
  "components": {
    "database": {
      "status": "connected",
      "message": null
    },
    "mqtt": {
      "status": "connected",
      "message": null
    }
  }
}
```

### New Readiness Endpoint (backend/src/main.py)

Added `/api/ready` endpoint for orchestration readiness probes:

```python
@app.get("/api/ready", response_model=ReadyResponse)
async def ready(response: Response) -> ReadyResponse:
    """
    Readiness probe for orchestration (k8s, Docker).
    
    Returns 200 if ready to serve traffic, 503 if not.
    Both database and MQTT must be connected for readiness.
    """
```

Example responses:

Ready (HTTP 200):
```json
{
  "ready": true,
  "checks": {
    "database": true,
    "mqtt": true
  }
}
```

Not ready (HTTP 503):
```json
{
  "ready": false,
  "checks": {
    "database": true,
    "mqtt": false
  }
}
```

## How to Verify

### 1. Run all tests
```bash
make check
```

Expected output: All 126 tests pass (including 9 new/updated health tests)

### 2. Test health endpoint with components
```bash
# Start services
make up

# Check health - should show component status
curl http://localhost:8000/api/health | jq
```

Expected output:
```json
{
  "status": "healthy",
  "timestamp": "2026-01-10T12:00:00.000Z",
  "version": "0.1.0",
  "components": {
    "database": {
      "status": "connected",
      "message": null
    },
    "mqtt": {
      "status": "connected",
      "message": null
    }
  }
}
```

### 3. Test ready endpoint
```bash
# When services are up - should return 200
curl -i http://localhost:8000/api/ready

# When MQTT is down - should return 503
docker stop plantops-mosquitto
sleep 5
curl -i http://localhost:8000/api/ready
```

Expected output when ready: HTTP 200
Expected output when not ready: HTTP 503

### 4. Test degraded state
```bash
# Stop MQTT broker
docker stop plantops-mosquitto

# Wait for disconnect
sleep 5

# Check health - should show degraded
curl http://localhost:8000/api/health | jq .status
```

Expected output: "degraded" (database connected, MQTT disconnected)

### 5. Verify connection state tracking
```bash
# Check logs for connection state changes
docker logs plantops-backend | grep -i "connected"
```

Expected: Logs showing "Connected to MQTT broker" and tracking disconnections

## Implementation Notes

### Connection State Tracking

The MQTTSubscriber now tracks connection state via the `_connected` flag:

- **Initial state**: False (disconnected)
- **On connect() success**: Set to True
- **On connect() failure**: Set to False
- **On disconnect()**: Set to False
- **On MQTT error in _listen_loop**: Set to False
- **On reconnection failure**: Set to False

This provides accurate real-time connection status for health checks.

### Health Status Logic

The health endpoint determines overall status based on component states:

1. **healthy**: Both database and MQTT connected
2. **degraded**: Only one component connected
3. **unhealthy**: Both components disconnected

This allows monitoring systems to differentiate between partial outages and complete failures.

### Readiness vs. Health

Two distinct endpoints serve different purposes:

- **Health (`/api/health`)**: Always returns HTTP 200, reports status in body
  - Used for monitoring/observability
  - Shows detailed component status
  - Supports "degraded" state

- **Ready (`/api/ready`)**: Returns HTTP 503 when not ready
  - Used for load balancer/orchestrator health checks
  - Binary ready/not-ready decision
  - Load balancers can remove unhealthy instances from rotation

### Docker Health Check

The ready endpoint is suitable for Docker healthcheck:

```yaml
healthcheck:
  test: ["CMD", "curl", "-f", "http://localhost:8000/api/ready"]
  interval: 10s
  timeout: 5s
  retries: 3
```

### Test Coverage

Added comprehensive test coverage:

1. `test_health_endpoint` - Basic health check (updated with mocks)
2. `test_health_response_structure` - Verify response fields (updated)
3. `test_health_all_connected` - All components healthy
4. `test_health_mqtt_disconnected` - Degraded state (MQTT down)
5. `test_health_database_disconnected` - Degraded state (DB down)
6. `test_health_all_disconnected` - Unhealthy state
7. `test_ready_returns_503_when_not_ready` - Ready endpoint not ready
8. `test_ready_returns_200_when_ready` - Ready endpoint ready
9. `test_ready_returns_503_when_database_down` - DB failure scenario
10. `test_mqtt_subscriber_is_connected_property` - Connection state tracking
11. Updated `test_mqtt_subscriber_instantiation` - Verify initial state

## Next Steps

### Immediate
The health and ready endpoints are now functional and can be used for:
1. Load balancer health checks
2. Kubernetes readiness/liveness probes
3. Monitoring dashboards
4. Alert systems

### Downstream Tasks
- **Task-030**: Add health checks for additional components (LLM service, Discord webhook)
- **Task-031**: Add metrics endpoint for Prometheus integration
- **Task-032**: Document health check usage in deployment guide

### Documentation
Document health endpoints in:
- API documentation (OpenAPI/Swagger)
- README.md monitoring section
- Deployment guide for load balancer configuration
- Kubernetes deployment manifests with readiness probes

## Risks and Follow-ups

### Risks
- **Database pool exhaustion**: Health checks acquire database connections. If pool is exhausted, health check will fail even if database is healthy. Mitigation: Use small timeout on pool.acquire()
- **Cascading failures**: If health check fails, load balancer removes instance, increasing load on remaining instances. Mitigation: Configure appropriate retry/interval thresholds
- **MQTT reconnection race**: Connection state might briefly show disconnected during normal reconnection. Mitigation: Consider grace period or exponential backoff tracking

### Follow-ups
- Add timeout configuration for health check database query
- Add health check execution time metrics
- Consider adding "starting" state for initial startup period
- Add version/build info to health response for deployment tracking
- Consider adding uptime to health response

## Testing Performed

1. ✅ Added ComponentStatus model with status and message fields
2. ✅ Added HealthResponse model with status, timestamp, version, components
3. ✅ Added ReadyResponse model with ready and checks fields
4. ✅ Added _connected = False in MQTTSubscriber.__init__
5. ✅ Added is_connected property to MQTTSubscriber
6. ✅ Set _connected = True in connect() on success
7. ✅ Set _connected = False in disconnect() and on errors
8. ✅ Created check_database_health() function
9. ✅ Updated /api/health to return component status
10. ✅ Added /api/ready endpoint with 503 on not ready
11. ✅ Added 7 new health tests
12. ✅ Updated 2 existing health tests with mocks
13. ✅ Added MQTT is_connected test
14. ✅ All 126 tests pass
15. ✅ Frontend builds successfully

## Definition of Done Checklist

- [x] `HealthResponse` model includes component status
- [x] `ReadyResponse` model created
- [x] `MQTTSubscriber.is_connected` property tracks connection state
- [x] Database health check function created
- [x] `/api/health` returns component status
- [x] `/api/ready` returns 503 when disconnected
- [x] Tests for all health scenarios added
- [x] All existing tests still pass (`make check`)

## Additional Notes

### Health Check Response Evolution

The HealthResponse model in `health_check.py` now supports both:
1. System health (infrastructure components) - New in this task
2. Plant health (telemetry/thresholds) - Existing PlantHealthCheckResponse

These are separate concerns served by different endpoints:
- `/api/health` - System infrastructure health
- `/api/plants/{id}/health` - Plant-specific health (future task)

### Connection State Thread Safety

The `_connected` flag is accessed from multiple contexts:
- Set by async MQTT operations (connect, disconnect, _listen_loop)
- Read by health endpoint handler

Since Python's GIL ensures atomic reads/writes of boolean flags, and we're in an async single-threaded context, no explicit locking is needed. If this changes in the future (e.g., threading), consider using `asyncio.Lock` or `threading.Lock`.

### Error Message Propagation

The database health check captures error messages and includes them in the ComponentStatus. This helps with debugging:
- Connection errors show specific connection failure reasons
- Query errors show database-specific error messages
- Frontend/monitoring can display these to operators

MQTT errors are not currently captured in the message field, but could be added in a future enhancement.

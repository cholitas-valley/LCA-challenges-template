# Handoff: Task-030 - Structured Logging with Correlation IDs

## Summary

Successfully implemented structured JSON logging using structlog with request correlation IDs for enhanced observability and traceability. The system now supports both human-readable console output (development) and JSON format (production) with automatic correlation ID injection into all log messages.

## Changes Made

### Dependencies
- Added `structlog>=24.1.0` to `backend/pyproject.toml`

### Configuration
- Updated `backend/src/config.py`:
  - Added `log_level: str = "INFO"` setting
  - Added `log_format: str = "console"` setting

### New Files Created
1. **backend/src/logging_config.py**
   - `setup_logging()` function that configures structlog
   - Supports JSON format (production) and console format (development)
   - Configures logging level based on environment
   - `get_logger(name)` function for obtaining logger instances

2. **backend/src/middleware/__init__.py**
   - Package initialization for middleware

3. **backend/src/middleware/correlation.py**
   - `CorrelationMiddleware` class
   - Generates or preserves X-Correlation-ID header
   - Binds correlation ID, path, and method to structlog context
   - Adds correlation ID to all response headers

4. **backend/tests/test_logging.py**
   - Tests for logging configuration
   - Tests for correlation middleware functionality
   - Tests that correlation ID is added to responses
   - Tests that incoming correlation IDs are preserved

### Modified Files

1. **backend/src/main.py**
   - Imported `setup_logging` and `get_logger` from logging_config
   - Imported `CorrelationMiddleware`
   - Called `setup_logging()` early in module initialization
   - Replaced standard logger with structlog logger
   - Added `CorrelationMiddleware` before CORS middleware
   - Updated health endpoint to use structured logging

2. **backend/src/services/telemetry_handler.py**
   - Replaced standard logging with structlog
   - Updated all log statements to use structured format with key-value pairs
   - Example: `logger.info("telemetry_stored", device_id=device_id, plant_id=plant_id, ...)`

3. **docker-compose.yml**
   - Added `LOG_LEVEL: ${LOG_LEVEL:-INFO}` environment variable
   - Added `LOG_FORMAT: ${LOG_FORMAT:-console}` environment variable

## Interfaces/Contracts Changed

### HTTP Headers
- All API responses now include `X-Correlation-ID` header
- Clients can send `X-Correlation-ID` header to trace requests

### Environment Variables
New environment variables:
- `LOG_LEVEL`: Controls log verbosity (DEBUG, INFO, WARNING, ERROR) - defaults to INFO
- `LOG_FORMAT`: Controls log format ("console" or "json") - defaults to console

### Logging Format

**Console format (development):**
```
2026-01-10T12:00:00Z [info     ] telemetry_stored device_id=dev-001 plant_id=plant-123 soil_moisture=45.2
```

**JSON format (production):**
```json
{"event": "telemetry_stored", "device_id": "dev-001", "plant_id": "plant-123", "soil_moisture": 45.2, "correlation_id": "abc-123-uuid", "timestamp": "2026-01-10T12:00:00Z", "level": "info"}
```

## Files Touched

### Created
- `/home/genge/dev-ash/foundry-nodevenv/cholitas/challenge-001-plantops/backend/src/logging_config.py`
- `/home/genge/dev-ash/foundry-nodevenv/cholitas/challenge-001-plantops/backend/src/middleware/__init__.py`
- `/home/genge/dev-ash/foundry-nodevenv/cholitas/challenge-001-plantops/backend/src/middleware/correlation.py`
- `/home/genge/dev-ash/foundry-nodevenv/cholitas/challenge-001-plantops/backend/tests/test_logging.py`

### Modified
- `/home/genge/dev-ash/foundry-nodevenv/cholitas/challenge-001-plantops/backend/pyproject.toml`
- `/home/genge/dev-ash/foundry-nodevenv/cholitas/challenge-001-plantops/backend/src/config.py`
- `/home/genge/dev-ash/foundry-nodevenv/cholitas/challenge-001-plantops/backend/src/main.py`
- `/home/genge/dev-ash/foundry-nodevenv/cholitas/challenge-001-plantops/backend/src/services/telemetry_handler.py`
- `/home/genge/dev-ash/foundry-nodevenv/cholitas/challenge-001-plantops/docker-compose.yml`

## How to Verify

### 1. Run all tests
```bash
make check
```
Result: All 130 tests pass, including 4 new logging tests.

### 2. Test correlation ID in development
```bash
# Start the backend
docker-compose up backend

# Make a request without correlation ID
curl -v http://localhost:8000/api/health

# Verify response includes X-Correlation-ID header (auto-generated UUID)

# Make a request with custom correlation ID
curl -v -H "X-Correlation-ID: my-test-123" http://localhost:8000/api/health

# Verify response includes same X-Correlation-ID: my-test-123
```

### 3. Test JSON logging format
```bash
# Set environment variable for JSON format
LOG_FORMAT=json docker-compose up backend

# Check logs - should be JSON formatted
docker-compose logs backend
```

### 4. Test different log levels
```bash
# Set log level to DEBUG
LOG_LEVEL=DEBUG docker-compose up backend

# Verify more verbose logging output
```

### 5. Verify structured logging in telemetry
```bash
# Send telemetry via MQTT and check logs show structured format
# Example log line should include device_id, plant_id, soil_moisture as separate fields
```

## Definition of Done - Checklist

- [x] structlog dependency added to pyproject.toml
- [x] LOG_LEVEL environment variable configures log level
- [x] LOG_FORMAT=json produces JSON log output
- [x] LOG_FORMAT=console produces human-readable output
- [x] Correlation IDs added to all request logs via middleware
- [x] X-Correlation-ID header in all responses
- [x] Key services (telemetry_handler) updated to use structured logging
- [x] Tests for logging configuration created
- [x] All existing tests still pass (130 tests passing)
- [x] docker-compose.yml updated with LOG_LEVEL and LOG_FORMAT

## Next Steps / Risks

### Next Steps
1. Consider updating other services to use structured logging:
   - `heartbeat_handler.py`
   - `threshold_evaluator.py`
   - `alert_worker.py`
   - `care_plan_worker.py`
   - All routers

2. Consider adding request/response logging middleware for automatic endpoint tracing

3. Consider integrating with centralized logging system (ELK, Datadog, etc.) in production

### Risks
1. **Log volume**: Structured logging with full context may increase log volume. Monitor in production and adjust log level if needed.

2. **Performance**: Adding correlation context to every log statement has minimal overhead, but should be monitored in high-throughput scenarios.

3. **Backward compatibility**: Old logging statements using stdlib logging will still work but won't have structured format. Gradual migration recommended.

### Notes
- The implementation maintains backward compatibility with Python's standard logging
- Existing log statements using stdlib logging continue to work
- Correlation IDs persist across async operations within the same request
- The middleware clears context at the start of each request to prevent cross-request contamination

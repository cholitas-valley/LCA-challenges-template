# Task 005 Handoff: Backend REST API with Express

## Summary
Successfully implemented a complete REST API using Express.js with 4 endpoints for plant monitoring. The API integrates with the existing MQTT subscriber and TimescaleDB backend, providing endpoints for retrieving plant data, telemetry history, configuration updates, and health checks.

## Files Created

### API Infrastructure
- `backend/src/api/server.ts` - Express server setup with CORS, Helmet security, and middleware
- `backend/src/api/middleware/error-handler.ts` - Global error handler and request logger
- `backend/src/api/routes/plants.ts` - Plant endpoints (GET /api/plants, GET /api/plants/:id/history, POST /api/plants/:id/config)
- `backend/src/api/routes/health.ts` - Health check endpoint (GET /api/health)

### Database Layer
- `backend/src/db/plants-repository.ts` - Repository pattern for plant CRUD operations with TimescaleDB queries

## Files Modified
- `backend/src/index.ts` - Updated to start Express server alongside MQTT subscriber
- `backend/src/mqtt/client.ts` - Added `getMqttConnectionStatus()` function and `isConnected()` method for health checks

## API Endpoints

### 1. GET /api/plants
Returns all 6 plants with their latest telemetry values.
- Uses PostgreSQL LATERAL join for efficient "latest per plant" query
- Returns: array of PlantWithTelemetry objects

### 2. GET /api/plants/:id/history?hours=24
Returns time-series telemetry data for a specific plant.
- Query param: `hours` (default: 24, max: 168)
- Uses TimescaleDB `time_bucket('5 minutes')` for aggregation
- Returns: { plant_id, plant_name, hours, data: [...] }

### 3. POST /api/plants/:id/config
Updates plant threshold configuration.
- Validates request body with Zod schema (PlantConfigUpdateSchema)
- All fields optional: soil_moisture_min/max, light_min, temperature_min/max, alert_cooldown_minutes
- Returns: updated PlantConfig object

### 4. GET /api/health
Service health check for monitoring.
- Checks database connection (SELECT 1)
- Checks MQTT connection status
- Returns: { status, timestamp, database, mqtt }
- Status codes: 200 (healthy/degraded), 503 (unhealthy)

## Middleware Stack
1. Helmet - Security headers
2. CORS - Configurable via CORS_ORIGIN env var (default: http://localhost:5173)
3. express.json() - Body parsing
4. requestLogger - Logs method, path, status, duration
5. errorHandler - Catches all errors, handles Zod validation, returns proper HTTP status

## Environment Variables
- `API_PORT` - Express server port (default: 3001)
- `CORS_ORIGIN` - Allowed CORS origin (default: http://localhost:5173)

## Integration
The Express server now runs alongside the MQTT subscriber:
1. Database connection verified
2. Express API server started on port 3001
3. MQTT subscriber connects and processes telemetry
4. Both services share the same database pool

## Technical Details

### Database Queries
- **Latest telemetry per plant**: Uses LEFT JOIN LATERAL for optimal performance
- **Time-series aggregation**: Uses TimescaleDB's time_bucket for 5-minute intervals
- **Dynamic updates**: Builds UPDATE queries dynamically based on provided fields

### Type Safety
- All endpoints use TypeScript strict mode
- Zod schemas for runtime validation
- Proper error handling with typed responses

### Error Handling
- Zod validation errors → 400 Bad Request
- Not found → 404 Not Found
- Database errors → 500 Internal Server Error
- All errors logged with context (method, path, error, stack)

## How to Verify

### 1. Run type check and build
```bash
make typecheck && npm run build --prefix backend
```

### 2. Start the backend service
```bash
npm run dev --prefix backend
# or with docker-compose
docker-compose up backend
```

### 3. Test endpoints
```bash
# Health check
curl http://localhost:3001/api/health

# Get all plants
curl http://localhost:3001/api/plants

# Get telemetry history
curl http://localhost:3001/api/plants/monstera/history?hours=24

# Update plant config
curl -X POST http://localhost:3001/api/plants/monstera/config \
  -H "Content-Type: application/json" \
  -d '{"soil_moisture_min": 25, "light_min": 350}'
```

## Interfaces & Contracts

### Request/Response Types
- `PlantWithTelemetry` - Plant with latest sensor readings
- `PlantConfig` - Plant configuration object
- `PlantConfigUpdate` - Partial update schema (Zod validated)
- `TelemetryHistory` - Array of time-bucketed telemetry points

### Repository Interface
- `getAllWithLatestTelemetry()` - Get all plants with latest data
- `getById(plantId)` - Get plant config by ID
- `getTelemetryHistory(plantId, hours)` - Get aggregated history
- `updateConfig(plantId, updates)` - Update plant thresholds

## Next Steps / Risks

### Next Steps
1. Frontend integration (task-006) can now consume these endpoints
2. Add rate limiting middleware for production
3. Add API authentication/authorization if needed
4. Consider adding WebSocket endpoint for real-time updates
5. Add API documentation (Swagger/OpenAPI)

### Risks/Considerations
1. **No authentication** - Currently open API, add auth before production
2. **No rate limiting** - Could be vulnerable to abuse
3. **CORS configuration** - Update CORS_ORIGIN for production domains
4. **Error messages** - Sensitive info in dev mode only (NODE_ENV check)
5. **Server shutdown** - Express server not explicitly closed in shutdown handler (minor)

### Follow-up Tasks
- Add integration tests for API endpoints
- Add API documentation
- Consider adding request validation middleware
- Add metrics/monitoring endpoints
- Configure production CORS policy

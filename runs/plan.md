# PlantOps Implementation Plan

> Run 004 - Production Hardening for Real ESP32 Deployment

## Run/004 Status: COMPLETE ✅

All 12 tasks executed successfully:

```
┌──────┬───────────────────────────────┬────────┐
│ Task │             Title             │ Status │
├──────┼───────────────────────────────┼────────┤
│ 026  │ TLS Certificate Generation    │ ✓      │
├──────┼───────────────────────────────┼────────┤
│ 027  │ Mosquitto TLS Configuration   │ ✓      │
├──────┼───────────────────────────────┼────────┤
│ 028  │ Backend TLS Connection        │ ✓      │
├──────┼───────────────────────────────┼────────┤
│ 029  │ Health and Ready Endpoints    │ ✓      │
├──────┼───────────────────────────────┼────────┤
│ 030  │ Structured Logging            │ ✓      │
├──────┼───────────────────────────────┼────────┤
│ 031  │ Migration System Verification │ ✓      │
├──────┼───────────────────────────────┼────────┤
│ 032  │ Docker Production Config      │ ✓      │
├──────┼───────────────────────────────┼────────┤
│ 033  │ ESP32 Project Scaffold        │ ✓      │
├──────┼───────────────────────────────┼────────┤
│ 034  │ ESP32 WiFi and Registration   │ ✓      │
├──────┼───────────────────────────────┼────────┤
│ 035  │ ESP32 Sensors and MQTT        │ ✓      │
├──────┼───────────────────────────────┼────────┤
│ 036  │ Documentation Update          │ ✓      │
├──────┼───────────────────────────────┼────────┤
│ 037  │ Feature 3 Final QA            │ ✓      │
└──────┴───────────────────────────────┴────────┘
```

**PlantOps is now production-ready with all 3 features complete:**
1. Feature 1: Core Platform ✓
2. Feature 2: LLM Care Advisor ✓
3. Feature 3: Production Hardening ✓

**Final Test Count:** 139 tests passing (23 new tests added in Feature 3)

---

## Overview

This plan implements Feature 3: Production Hardening for the PlantOps system, enabling real ESP32 sensor deployment with proper security, resilience, and operational tooling.

**Completed (run/003):**
- Feature 1: Core Platform (devices, plants, telemetry, alerts)
- Feature 2: LLM Care Advisor (settings, care plans, UI)
- 116 backend tests passing
- React dashboard with full functionality

**This Run (run/004) - COMPLETE:**
- ✅ 3.1 MQTT Security (TLS on port 8883)
- ✅ 3.2 Connection Resilience (auto-reconnect, health status)
- ✅ 3.3 Structured Logging (JSON format, correlation IDs)
- ✅ 3.4 Database Migrations (versioned, idempotent, schema_version)
- ✅ 3.5 Docker Production Config (resource limits, health checks)
- ✅ 3.6 ESP32 Firmware (PlatformIO, WiFi portal, self-registration)
- ✅ 3.7 Documentation (deployment guide, API reference, firmware setup)

## Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                    PLANTOPS PRODUCTION SYSTEM                       │
└─────────────────────────────────────────────────────────────────────┘

  ┌──────────────┐     1. Register (HTTPS)  ┌──────────────┐
  │   ESP32      │─────────────────────────▶│   Backend    │
  │  (Sensor)    │     (get credentials)    │   (FastAPI)  │
  └──────┬───────┘                          └──────┬───────┘
         │                                         │
         │ 2. MQTT/TLS (8883)                     │ Store credentials
         ▼                                         ▼
  ┌──────────────┐                          ┌──────────────┐
  │  Mosquitto   │                          │  TimescaleDB │
  │  (TLS+Auth)  │                          │              │
  └──────┬───────┘                          └──────────────┘
         │ 1883 (dev) / 8883 (prod)                ▲
         │                                         │
         │ 3. Publish telemetry                    │
         ▼                                         │
  ┌──────────────┐     4. Persist (JSON logs)     │
  │   Backend    │────────────────────────────────┘
  │ (reconnect)  │
  └──────┬───────┘
         │
    ┌────┴────┬──────────────┐
    ▼         ▼              ▼
┌────────┐ ┌────────┐  ┌───────────┐
│ Worker │ │Frontend│  │ LLM Care  │──▶ Anthropic/OpenAI
│(alerts)│ │        │  │ Advisor   │   (user's API key)
└────────┘ └────────┘  └───────────┘
```

## Tech Stack

| Component | Technology |
|-----------|------------|
| Backend | Python 3.11+ with FastAPI |
| Database | PostgreSQL 15 + TimescaleDB |
| Frontend | React 18 + TypeScript + Vite |
| MQTT Broker | Mosquitto 2.x with TLS |
| Firmware | ESP32 with PlatformIO (C++) |
| Containerization | Docker + Docker Compose |
| Logging | structlog (JSON format) |

## New Components for Feature 3

### MQTT TLS Infrastructure
- Self-signed CA and server certificates
- Mosquitto TLS listener on port 8883
- Backend TLS connection support
- ESP32 TLS client with CA certificate

### Resilience Layer
- Backend MQTT auto-reconnect with exponential backoff
- ESP32 WiFi and MQTT reconnection
- Health endpoint with connection status
- Readiness endpoint (503 when disconnected)

### Structured Logging
- JSON log format via structlog
- Correlation IDs for request tracing
- Configurable log levels (LOG_LEVEL env)
- Device/plant context in log entries

### Migration System
- schema_version table (already exists)
- Migration files with up() functions (already exists)
- Idempotent execution (already exists)
- Migration runner at startup (already exists)

### Production Docker
- docker-compose.prod.yml
- Resource limits (memory, CPU)
- Health checks for all services
- No bind mounts (built-in code)

### ESP32 Firmware
- PlatformIO project structure
- WiFi captive portal for configuration
- HTTP registration with backend
- MQTT/TLS connection and publishing
- DHT22, soil moisture, BH1750 sensors

## Database Schema Updates

No schema changes required for Feature 3. Existing schema from run/003:

```sql
-- schema_migrations table (existing)
CREATE TABLE IF NOT EXISTS schema_migrations (
    version TEXT PRIMARY KEY,
    applied_at TIMESTAMPTZ DEFAULT NOW()
);
```

## API Endpoint Changes

### Health Endpoints (Enhanced)
| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/health` | Health check with component status |
| GET | `/api/ready` | Readiness probe (503 if not ready) |

### Response Changes
```json
// GET /api/health
{
  "status": "healthy",
  "timestamp": "2026-01-09T12:00:00Z",
  "version": "1.0.0",
  "components": {
    "database": "connected",
    "mqtt": "connected"
  }
}

// GET /api/ready
// Returns 200 if ready, 503 if not
{
  "ready": true,
  "checks": {
    "database": true,
    "mqtt": true
  }
}
```

## Implementation Phases

### Phase 11: MQTT Security (Tasks 026-027)
- Generate TLS certificates
- Configure Mosquitto TLS
- Backend TLS connection support

### Phase 12: Connection Resilience (Tasks 028-029)
- Enhanced MQTT reconnection
- Health/ready endpoints with status

### Phase 13: Structured Logging (Task 030)
- Implement structlog
- Correlation IDs
- Log level configuration

### Phase 14: Migration Enhancement (Task 031)
- Verify migration system
- Add migration tests
- Document migration process

### Phase 15: Docker Production (Task 032)
- docker-compose.prod.yml
- Dockerfiles for production
- Environment documentation

### Phase 16: ESP32 Firmware (Tasks 033-035)
- PlatformIO project setup
- WiFi and registration
- Sensor reading and MQTT publishing
- TLS support

### Phase 17: Documentation (Task 036)
- Deployment guide
- API reference
- Firmware setup guide

### Phase 18: Final QA (Task 037)
- Integration testing
- TLS verification
- Documentation review

## Documentation

Documentation lives in `docs/`:

- `docs/deployment.md` - Production deployment guide
  - Sections: Prerequisites, Docker Production, TLS Setup, Environment Variables
  - Updated by: task-032 (Docker production), task-027 (TLS)

- `docs/api.md` - Complete API reference
  - Sections: Health, Devices, Plants, Settings, Care Plans
  - Updated by: task-029 (health endpoints)

- `docs/firmware.md` - ESP32 firmware guide (NEW)
  - Sections: Hardware, PlatformIO Setup, Configuration, Flashing, Troubleshooting
  - Created by: task-035

- `docs/development.md` - Development setup
  - Sections: Local Setup, Testing, Simulator, Debugging
  - Updated by: task-037 (final QA)

## Task Outline

### Feature 3: Production Hardening

| ID | Title | Role | Depends On |
|----|-------|------|------------|
| 026 | TLS Certificate Generation | backend | - |
| 027 | Mosquitto TLS Configuration | backend | 026 |
| 028 | Backend TLS Connection | backend | 027 |
| 029 | Health and Ready Endpoints | backend | 028 |
| 030 | Structured Logging | backend | - |
| 031 | Migration System Verification | backend | - |
| 032 | Docker Production Config | backend | 029, 030, 031 |
| 033 | ESP32 Project Scaffold | backend | - |
| 034 | ESP32 WiFi and Registration | backend | 033 |
| 035 | ESP32 Sensors and MQTT | backend | 034, 028 |
| 036 | Documentation Update | docs | 032, 035 |
| 037 | Feature 3 Final QA | qa | 036 |

## Risks and Mitigations

| Risk | Mitigation |
|------|------------|
| Certificate expiration | Document renewal process, use long-lived certs for home use |
| ESP32 memory constraints | Optimize firmware, use streaming for large payloads |
| TLS handshake failures | Include CA cert in firmware, document debugging |
| Log volume in production | Implement log rotation, default to INFO level |
| Migration conflicts | Use semantic versioning, test on production clone |

## Success Criteria (Feature 3)

From objective.md Definition of Done:

**MQTT Security:**
1. [ ] Mosquitto configured with TLS on port 8883
2. [ ] Self-signed certificates generated and documented
3. [ ] Backend connects via TLS when `MQTT_USE_TLS=true`
4. [ ] ESP32 firmware connects via TLS

**Connection Resilience:**
5. [ ] Backend reconnects automatically on MQTT disconnect
6. [ ] ESP32 reconnects automatically on WiFi/MQTT disconnect
7. [ ] `/health` endpoint shows MQTT connection status
8. [ ] `/ready` endpoint returns 503 when not connected

**Structured Logging:**
9. [ ] All backend logs in JSON format (when `LOG_FORMAT=json`)
10. [ ] Log level configurable via `LOG_LEVEL`
11. [ ] Request tracing with correlation IDs

**Database Migrations:**
12. [ ] Migrations versioned in `migrations/` directory
13. [ ] `schema_version` table tracks applied migrations
14. [ ] Startup skips already-applied migrations

**Docker Production:**
15. [ ] `docker-compose.prod.yml` with resource limits
16. [ ] No bind mounts in production config
17. [ ] Health checks on all services
18. [ ] `.env.prod.example` documented

**ESP32 Firmware:**
19. [ ] PlatformIO project compiles for ESP32
20. [ ] WiFi connection with captive portal setup
21. [ ] Device self-registration working
22. [ ] Telemetry and heartbeat publishing
23. [ ] TLS connection to Mosquitto

**Documentation:**
24. [ ] Deployment guide created
25. [ ] API reference updated
26. [ ] Firmware setup guide created
27. [ ] README updated with production instructions

**Tests:**
28. [ ] All existing 116 tests still pass
29. [ ] New tests for TLS, reconnection, logging
30. [ ] `make check` passes

---

*Generated by lca-planner for run/004*

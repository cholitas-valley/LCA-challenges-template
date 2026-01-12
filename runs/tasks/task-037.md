---
task_id: task-037
title: Feature 3 Final QA
role: lca-qa
follow_roles: []
post:
  - lca-recorder
  - lca-docs
  - lca-gitops
depends_on:
  - task-036
inputs:
  - objective.md
  - runs/plan.md
  - runs/handoffs/task-036.md
allowed_paths:
  - backend/**
  - frontend/**
  - firmware/**
  - docs/**
  - Makefile
  - docker-compose.yml
  - docker-compose.prod.yml
check_command: make check
handoff: runs/handoffs/task-037.md
---

# Task 037: Feature 3 Final QA

## Goal

Final validation of Feature 3: Production Hardening. Verify all Definition of Done items from objective.md and ensure the system is ready for real ESP32 deployment.

## Requirements

### Definition of Done Verification

From objective.md, verify each item:

#### MQTT Security
- [ ] Mosquitto configured with TLS on port 8883
- [ ] Self-signed certificates generated and documented
- [ ] Backend connects via TLS when `MQTT_USE_TLS=true`
- [ ] ESP32 firmware connects via TLS

#### Connection Resilience
- [ ] Backend reconnects automatically on MQTT disconnect
- [ ] ESP32 reconnects automatically on WiFi/MQTT disconnect
- [ ] `/health` endpoint shows MQTT connection status
- [ ] `/ready` endpoint returns 503 when not connected

#### Structured Logging
- [ ] All backend logs in JSON format (when `LOG_FORMAT=json`)
- [ ] Log level configurable via `LOG_LEVEL`
- [ ] Request tracing with correlation IDs

#### Database Migrations
- [ ] Migrations versioned in `migrations/` directory
- [ ] `schema_migrations` table tracks applied migrations
- [ ] Startup skips already-applied migrations

#### Docker Production
- [ ] `docker-compose.prod.yml` with resource limits
- [ ] No bind mounts in production config
- [ ] Health checks on all services
- [ ] `.env.prod.example` documented

#### ESP32 Firmware
- [ ] PlatformIO project compiles for ESP32
- [ ] WiFi connection with captive portal setup
- [ ] Device self-registration working
- [ ] Telemetry and heartbeat publishing
- [ ] TLS connection to Mosquitto

#### Documentation
- [ ] Deployment guide created (`docs/deployment.md`)
- [ ] API reference updated (`docs/api.md`)
- [ ] Firmware setup guide created (`docs/firmware.md`)
- [ ] README updated with production instructions

#### Tests
- [ ] All existing 116 tests still pass
- [ ] New tests for TLS, reconnection, logging
- [ ] `make check` passes

### Test Execution

Run all test suites:

```bash
# Full test suite
make check

# Backend tests only
cd backend && python -m pytest tests/ -v

# Verify test count >= 116 (from run/003) + new tests
```

### TLS Verification

Verify TLS configuration:

```bash
# Generate certificates
make certs

# Verify certificate validity
openssl verify -CAfile certs/ca.crt certs/server.crt

# Check certificate SANs
openssl x509 -in certs/server.crt -text -noout | grep -A1 "Subject Alternative Name"

# Test MQTT TLS connection
mosquitto_pub -h localhost -p 8883 --cafile certs/ca.crt \
  -u plantops_backend -P $MQTT_BACKEND_PASSWORD \
  -t test -m "tls test"
```

### Health Endpoint Verification

Test health endpoints:

```bash
# Health check
curl -s http://localhost:8000/api/health | jq .

# Expected: status="healthy", components.mqtt.status="connected"

# Ready check
curl -s http://localhost:8000/api/ready | jq .

# Expected: ready=true, HTTP 200
```

### Logging Verification

Test structured logging:

```bash
# Set JSON logging
export LOG_FORMAT=json

# Check log output format
docker logs plantops-backend | head -5 | jq .

# Verify correlation ID in response headers
curl -s -I http://localhost:8000/api/health | grep X-Correlation-ID
```

### Docker Production Verification

Verify production configuration:

```bash
# Check docker-compose.prod.yml exists
cat docker-compose.prod.yml

# Verify resource limits present
grep -A5 "deploy:" docker-compose.prod.yml

# Verify health checks present
grep -A5 "healthcheck:" docker-compose.prod.yml

# Verify no source bind mounts
grep -v "volumes:" docker-compose.prod.yml | grep -E "\./(backend|frontend):"
# Should return empty
```

### Firmware Verification

Verify ESP32 firmware:

```bash
# Check PlatformIO project structure
ls -la firmware/

# Verify platformio.ini exists
cat firmware/platformio.ini

# Verify main.cpp compiles (if PlatformIO installed)
cd firmware && pio run --dry-run
```

### Documentation Verification

Verify all documentation:

```bash
# Check required docs exist
ls -la docs/deployment.md docs/api.md docs/firmware.md

# Verify README has production section
grep -q "Production Deployment" README.md && echo "OK" || echo "MISSING"

# Check .env.prod.example exists
ls -la .env.prod.example
```

### Integration Testing

Test full device lifecycle:

```bash
# 1. Start services
make up

# 2. Register device via API
curl -X POST http://localhost:8000/api/devices/register \
  -H "Content-Type: application/json" \
  -d '{"mac_address": "AA:BB:CC:DD:EE:FF", "firmware_version": "1.0.0"}'

# 3. Create plant
curl -X POST http://localhost:8000/api/plants \
  -H "Content-Type: application/json" \
  -d '{"name": "Test Plant", "species": "Monstera"}'

# 4. Provision device to plant
curl -X POST http://localhost:8000/api/devices/{device_id}/provision \
  -H "Content-Type: application/json" \
  -d '{"plant_id": "{plant_id}"}'

# 5. Send telemetry via MQTT (use simulator or mosquitto_pub)
mosquitto_pub -h localhost -p 1883 \
  -u {mqtt_username} -P {mqtt_password} \
  -t "devices/{device_id}/telemetry" \
  -m '{"temperature": 22.5, "humidity": 65.0, "soil_moisture": 45.0, "light_level": 800}'

# 6. Verify telemetry received
curl http://localhost:8000/api/plants/{plant_id}/history | jq .
```

### Regression Testing

Ensure Features 1 and 2 still work:

1. Device registration and provisioning
2. Plant CRUD operations
3. Telemetry pipeline
4. Discord alerts (if webhook configured)
5. LLM settings (if API key available)
6. Care plan generation
7. Frontend pages all load

### Bug Fixes

If any issues found:
- Fix in appropriate codebase
- Add regression tests
- Update documentation if needed

## Constraints

- Do not add new features
- Keep fixes minimal and targeted
- Document any known limitations
- Update test count in handoff

## Definition of Done

- [ ] All Feature 3 DoD items verified
- [ ] All backend tests pass
- [ ] Frontend builds without errors
- [ ] `make check` exits 0
- [ ] TLS connection verified
- [ ] Health endpoints return correct status
- [ ] Structured logging works
- [ ] Docker production config validated
- [ ] ESP32 firmware structure complete
- [ ] All documentation accurate
- [ ] No regressions in Features 1 & 2

## Notes

This is the final task for run/004. After completion:
1. Feature 3 is complete
2. System is ready for real ESP32 deployment
3. Documentation enables production setup
4. All 3 features are production-ready

Expected test count: 116+ (from run/003 plus new tests added in Feature 3)

The handoff should include:
- Final test count
- List of verified DoD items
- Any known limitations
- Recommendations for future improvements

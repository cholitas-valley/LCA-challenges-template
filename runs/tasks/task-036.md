---
task_id: task-036
title: Documentation Update
role: lca-docs
follow_roles: []
post:
  - lca-recorder
  - lca-gitops
depends_on:
  - task-032
  - task-035
inputs:
  - objective.md
  - runs/plan.md
  - runs/handoffs/task-032.md
  - runs/handoffs/task-035.md
allowed_paths:
  - docs/**
  - README.md
check_command: make check
handoff: runs/handoffs/task-036.md
---

# Task 036: Documentation Update

## Goal

Create comprehensive documentation for Feature 3 including deployment guide, API reference updates, and README improvements.

## Requirements

### Update docs/deployment.md

Expand deployment documentation (started in task-032):

```markdown
# PlantOps Deployment Guide

## Overview

This guide covers deploying PlantOps for home production use with:
- TLS-secured MQTT connections
- Docker containerization
- Real ESP32 sensor hardware

## Prerequisites

- Docker 20.10+ and Docker Compose 2.0+
- Linux server (Raspberry Pi, Ubuntu, etc.)
- ESP32 development board with sensors
- Home network with static IP or DHCP reservation

## Quick Start

### 1. Clone Repository

```bash
git clone https://github.com/your-org/plantops.git
cd plantops
```

### 2. Generate TLS Certificates

```bash
make certs
```

This creates self-signed certificates in `certs/` directory.

### 3. Configure Environment

```bash
cp .env.prod.example .env.prod
# Edit .env.prod with secure passwords
```

### 4. Start Services

```bash
make prod-up
```

### 5. Verify Deployment

```bash
curl http://localhost:8000/api/health
curl http://localhost:80
```

## Detailed Setup

### TLS Certificates

The system uses self-signed certificates for home deployment:

| File | Purpose |
|------|---------|
| `certs/ca.crt` | Certificate Authority (share with ESP32) |
| `certs/ca.key` | CA private key (keep secure) |
| `certs/server.crt` | Mosquitto server certificate |
| `certs/server.key` | Server private key |

**Regenerate certificates:**
```bash
make certs-force
```

**Certificate validity:** 10 years (suitable for home use)

### Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `POSTGRES_USER` | Yes | - | Database username |
| `POSTGRES_PASSWORD` | Yes | - | Database password |
| `POSTGRES_DB` | Yes | - | Database name |
| `MQTT_BACKEND_PASSWORD` | Yes | - | MQTT password for backend |
| `ENCRYPTION_KEY` | Yes | - | 64-char hex for API key encryption |
| `DISCORD_WEBHOOK_URL` | No | - | Discord alerts webhook |
| `LOG_LEVEL` | No | INFO | Log level (DEBUG/INFO/WARNING/ERROR) |
| `LOG_FORMAT` | No | json | Log format (console/json) |

**Generate encryption key:**
```bash
openssl rand -hex 32
```

### Network Configuration

**Required ports:**
| Port | Service | Protocol |
|------|---------|----------|
| 80 | Frontend | HTTP |
| 8000 | Backend API | HTTP |
| 8883 | MQTT (TLS) | MQTT/TLS |

**Firewall (UFW example):**
```bash
sudo ufw allow 80/tcp
sudo ufw allow 8000/tcp
sudo ufw allow 8883/tcp
```

### Docker Services

| Service | Image | Resources |
|---------|-------|-----------|
| db | timescale/timescaledb:latest-pg15 | 512MB RAM |
| mosquitto | eclipse-mosquitto:2 | 128MB RAM |
| backend | plantops-backend | 512MB RAM |
| frontend | plantops-frontend | 128MB RAM |

## Operations

### View Logs

```bash
# All services
make prod-logs

# Specific service
docker compose -f docker-compose.prod.yml logs -f backend
```

### Restart Services

```bash
make prod-restart
```

### Update Deployment

```bash
git pull origin main
make prod-build
make prod-restart
```

### Backup Database

```bash
# Create backup
docker exec plantops-db pg_dump -U plantops plantops > backup-$(date +%Y%m%d).sql

# Restore backup
cat backup.sql | docker exec -i plantops-db psql -U plantops plantops
```

## Troubleshooting

### Services Won't Start

1. Check Docker is running: `docker info`
2. Check logs: `make prod-logs`
3. Verify environment file: `cat .env.prod`
4. Check port conflicts: `netstat -tlnp | grep -E '80|8000|8883'`

### MQTT Connection Issues

1. Verify Mosquitto is running: `docker ps | grep mosquitto`
2. Test TLS connection:
   ```bash
   mosquitto_pub -h localhost -p 8883 --cafile certs/ca.crt \
     -u plantops_backend -P $MQTT_BACKEND_PASSWORD \
     -t test -m "hello"
   ```
3. Check certificate validity: `openssl x509 -in certs/server.crt -text -noout`

### ESP32 Can't Connect

1. Verify ESP32 has correct CA certificate embedded
2. Check ESP32 can reach server IP
3. Verify MQTT port 8883 is open
4. Check serial output for error messages

### Database Connection Issues

1. Verify database is running: `docker ps | grep db`
2. Check database logs: `docker logs plantops-db`
3. Test connection:
   ```bash
   docker exec -it plantops-db psql -U plantops -c "SELECT 1"
   ```
```

### Create docs/api.md

Create comprehensive API reference:

```markdown
# PlantOps API Reference

Base URL: `http://localhost:8000/api`

## Health Endpoints

### GET /health

Returns system health status with component information.

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2026-01-09T12:00:00Z",
  "version": "1.0.0",
  "components": {
    "database": {"status": "connected", "message": null},
    "mqtt": {"status": "connected", "message": null}
  }
}
```

**Status values:** `healthy`, `degraded`, `unhealthy`

### GET /ready

Returns 200 if ready, 503 if not ready.

**Response (200):**
```json
{
  "ready": true,
  "checks": {
    "database": true,
    "mqtt": true
  }
}
```

## Device Endpoints

### POST /devices/register

Register a new device.

**Request:**
```json
{
  "mac_address": "AA:BB:CC:DD:EE:FF",
  "firmware_version": "1.0.0"
}
```

**Response (201):**
```json
{
  "device_id": "dev-abc123",
  "mqtt_username": "dev_abc123",
  "mqtt_password": "generated_secure_password"
}
```

### GET /devices

List all devices.

**Query Parameters:**
- `limit` (int, default 50): Maximum results
- `offset` (int, default 0): Skip results

**Response:**
```json
{
  "devices": [
    {
      "id": "dev-abc123",
      "mac_address": "AA:BB:CC:DD:EE:FF",
      "status": "online",
      "plant_id": "plant-123",
      "last_seen_at": "2026-01-09T12:00:00Z"
    }
  ],
  "total": 1
}
```

### POST /devices/{id}/provision

Associate device with a plant.

**Request:**
```json
{
  "plant_id": "plant-123"
}
```

### DELETE /devices/{id}

Remove a device.

**Response:** 204 No Content

## Plant Endpoints

### POST /plants

Create a new plant.

**Request:**
```json
{
  "name": "Monstera",
  "species": "Monstera deliciosa",
  "thresholds": {
    "soil_moisture": {"min": 30, "max": 70},
    "temperature": {"min": 18, "max": 28},
    "humidity": {"min": 50, "max": 80},
    "light_level": {"min": 200, "max": null}
  }
}
```

**Response (201):**
```json
{
  "id": "plant-123",
  "name": "Monstera",
  "species": "Monstera deliciosa",
  "thresholds": {...},
  "created_at": "2026-01-09T12:00:00Z"
}
```

### GET /plants

List all plants with current status.

### GET /plants/{id}

Get single plant with latest telemetry.

### GET /plants/{id}/history

Get 24-hour telemetry history.

**Query Parameters:**
- `hours` (int, default 24): Hours of history

### PUT /plants/{id}

Update plant settings.

### DELETE /plants/{id}

Remove a plant.

## Settings Endpoints

### GET /settings/llm

Get LLM configuration (API key masked).

**Response:**
```json
{
  "provider": "anthropic",
  "model": "claude-sonnet-4-20250514",
  "api_key_set": true,
  "api_key_preview": "****abc123"
}
```

### PUT /settings/llm

Update LLM configuration.

**Request:**
```json
{
  "provider": "anthropic",
  "model": "claude-sonnet-4-20250514",
  "api_key": "sk-ant-..."
}
```

### POST /settings/llm/test

Test LLM API key validity.

**Response:**
```json
{
  "valid": true,
  "message": "Connection successful"
}
```

## Care Plan Endpoints

### POST /plants/{id}/analyze

Generate AI care plan for plant.

**Response:**
```json
{
  "status": "generating",
  "message": "Care plan generation started"
}
```

### GET /plants/{id}/care-plan

Get current care plan.

**Response:**
```json
{
  "plant_id": "plant-123",
  "summary": "Your Monstera is thriving!",
  "watering": {...},
  "light": {...},
  "humidity": {...},
  "temperature": {...},
  "alerts": [],
  "tips": [...],
  "generated_at": "2026-01-09T12:00:00Z"
}
```

## Error Responses

All endpoints return errors in this format:

```json
{
  "error": "Not Found",
  "detail": "Plant with id 'xyz' not found"
}
```

**HTTP Status Codes:**
- 200: Success
- 201: Created
- 204: No Content
- 400: Bad Request
- 404: Not Found
- 422: Validation Error
- 500: Internal Server Error
- 503: Service Unavailable
```

### Update README.md

Update the main README with production deployment info:

```markdown
# PlantOps

IoT plant monitoring system with AI care advisor.

## Features

- **Device Provisioning**: Auto-register ESP32 sensors with MQTT credentials
- **Real-time Monitoring**: Temperature, humidity, soil moisture, light level
- **Smart Alerts**: Discord notifications for threshold breaches
- **AI Care Advisor**: Personalized plant care recommendations (Anthropic/OpenAI)
- **Production Ready**: TLS security, Docker deployment, structured logging

## Quick Start (Development)

```bash
# Start services
make up

# Run tests
make check

# View logs
make logs
```

## Production Deployment

See [docs/deployment.md](docs/deployment.md) for full instructions.

```bash
# Generate TLS certificates
make certs

# Configure environment
cp .env.prod.example .env.prod

# Start production stack
make prod-up
```

## ESP32 Firmware

See [docs/firmware.md](docs/firmware.md) for hardware setup.

```bash
cd firmware
pio run -t upload
```

## Documentation

- [Deployment Guide](docs/deployment.md)
- [API Reference](docs/api.md)
- [Firmware Setup](docs/firmware.md)
- [Development Guide](docs/development.md)

## Architecture

```
ESP32 Sensor --> MQTT/TLS --> Backend --> TimescaleDB
                               |
                           Dashboard
                               |
                          LLM Care API
```

## License

MIT
```

## Constraints

- Documentation must be accurate to implementation
- Include all environment variables
- Include troubleshooting sections
- Keep examples current with actual API

## Definition of Done

- [ ] `docs/deployment.md` complete with TLS, Docker, operations
- [ ] `docs/api.md` covers all endpoints with examples
- [ ] `docs/firmware.md` exists (created in task-035)
- [ ] `README.md` updated with production instructions
- [ ] All documentation accurate to implementation
- [ ] All existing tests still pass (`make check`)

## Notes

This task consolidates all Feature 3 documentation. The docs should enable:
1. New developers to set up development environment
2. Users to deploy to production
3. Hardware enthusiasts to flash ESP32 firmware
4. API consumers to integrate with PlantOps

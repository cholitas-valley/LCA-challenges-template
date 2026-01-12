# Feature 1: Core Platform

## Overview

Feature 1 provides the production-ready IoT infrastructure for PlantOps, enabling automated device provisioning, secure telemetry ingestion, real-time monitoring, and intelligent alerting.

**Status:** Complete and validated (95 automated tests passing)

### Capabilities

1. **Dynamic Device Provisioning** - Devices self-register and receive unique MQTT credentials
2. **Plant Management** - CRUD operations for plants with configurable thresholds
3. **Telemetry Pipeline** - MQTT-based ingestion with TimescaleDB storage
4. **Alert System** - Threshold monitoring with Discord notifications and cooldown
5. **Dashboard** - React frontend with live plant status and historical charts
6. **Device Status Tracking** - Heartbeat monitoring with offline detection

## Device Provisioning Flow

1. Device registers via `POST /api/devices/register` with MAC address
2. Backend generates MQTT credentials and writes to Mosquitto password file
3. Device connects to MQTT broker with credentials
4. User assigns device to plant via UI
5. Device publishes telemetry to `plantops/{device_id}/telemetry`

## API Endpoints

### Devices
| Method | Path | Purpose |
|--------|------|---------|
| POST | `/api/devices/register` | Register new device |
| GET | `/api/devices` | List all devices |
| POST | `/api/devices/{id}/provision` | Assign to plant |
| DELETE | `/api/devices/{id}` | Delete device |

### Plants
| Method | Path | Purpose |
|--------|------|---------|
| POST | `/api/plants` | Create plant |
| GET | `/api/plants` | List all plants |
| GET | `/api/plants/{id}` | Get plant details |
| PUT | `/api/plants/{id}` | Update plant |
| DELETE | `/api/plants/{id}` | Delete plant |
| GET | `/api/plants/{id}/history` | Get telemetry history |

## Running Tests

```bash
# Full validation
make check

# Backend only
cd backend && python3 -m pytest tests/ -v

# Frontend only
cd frontend && npm run build
```

## Test Coverage

- 95 backend tests across device, plant, telemetry, threshold, alert, and MQTT modules
- Frontend TypeScript strict mode compilation
- All tests pass with `make check` exit code 0

## What's Next

Feature 2: LLM Care Advisor - AI-powered plant care recommendations

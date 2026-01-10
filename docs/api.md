# PlantOps API Reference

Base URL: `http://localhost:8000/api`

## Health Endpoints

### GET /health

Returns system health status with component information.

**Response (200):**
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

Returns readiness status. Returns 503 if critical services are unavailable.

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

**Response (503 - Not Ready):**
```json
{
  "ready": false,
  "checks": {
    "database": true,
    "mqtt": false
  }
}
```

## Device Endpoints

Base path: `/api/devices`

### POST /devices/register

Register a new IoT device. Returns MQTT credentials for the device.

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

**Errors:**
- 400: Device with this MAC address already registered

### GET /devices

List all registered devices.

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `limit` | int | 50 | Maximum results (1-100) |
| `offset` | int | 0 | Skip results |

**Response (200):**
```json
{
  "devices": [
    {
      "id": "dev-abc123",
      "mac_address": "AA:BB:CC:DD:EE:FF",
      "status": "online",
      "plant_id": "plant-123",
      "firmware_version": "1.0.0",
      "last_seen_at": "2026-01-09T12:00:00Z",
      "created_at": "2026-01-08T10:00:00Z"
    }
  ],
  "total": 1
}
```

### DELETE /devices/{device_id}

Remove a device registration.

**Response:** 204 No Content

**Errors:**
- 404: Device not found

### POST /devices/{device_id}/provision

Associate a device with a plant.

**Request:**
```json
{
  "plant_id": "plant-123"
}
```

**Response (200):**
```json
{
  "device_id": "dev-abc123",
  "plant_id": "plant-123",
  "provisioned_at": "2026-01-09T12:00:00Z"
}
```

**Errors:**
- 404: Device or plant not found
- 400: Device already assigned to a plant

### POST /devices/{device_id}/unassign

Remove device from its assigned plant.

**Response (200):**
```json
{
  "device_id": "dev-abc123",
  "plant_id": null,
  "message": "Device unassigned from plant"
}
```

### GET /devices/{device_id}/telemetry/latest

Get the most recent telemetry reading for a device.

**Response (200):**
```json
{
  "device_id": "dev-abc123",
  "timestamp": "2026-01-09T12:00:00Z",
  "temperature": 22.5,
  "humidity": 55.0,
  "soil_moisture": 65.0,
  "light_level": 450.0
}
```

**Errors:**
- 404: Device not found or no telemetry data

## Plant Endpoints

Base path: `/api/plants`

### POST /plants

Create a new plant profile.

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
  "thresholds": {
    "soil_moisture": {"min": 30, "max": 70},
    "temperature": {"min": 18, "max": 28},
    "humidity": {"min": 50, "max": 80},
    "light_level": {"min": 200, "max": null}
  },
  "device_id": null,
  "latest_telemetry": null,
  "created_at": "2026-01-09T12:00:00Z",
  "updated_at": "2026-01-09T12:00:00Z"
}
```

### GET /plants

List all plants with their current status.

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `limit` | int | 50 | Maximum results |
| `offset` | int | 0 | Skip results |

**Response (200):**
```json
{
  "plants": [
    {
      "id": "plant-123",
      "name": "Monstera",
      "species": "Monstera deliciosa",
      "thresholds": {...},
      "device_id": "dev-abc123",
      "latest_telemetry": {
        "timestamp": "2026-01-09T12:00:00Z",
        "temperature": 22.5,
        "humidity": 55.0,
        "soil_moisture": 65.0,
        "light_level": 450.0
      },
      "created_at": "2026-01-09T12:00:00Z",
      "updated_at": "2026-01-09T12:00:00Z"
    }
  ],
  "total": 1
}
```

### GET /plants/{plant_id}

Get a single plant with latest telemetry.

**Response (200):**
```json
{
  "id": "plant-123",
  "name": "Monstera",
  "species": "Monstera deliciosa",
  "thresholds": {...},
  "device_id": "dev-abc123",
  "latest_telemetry": {...},
  "created_at": "2026-01-09T12:00:00Z",
  "updated_at": "2026-01-09T12:00:00Z"
}
```

**Errors:**
- 404: Plant not found

### PUT /plants/{plant_id}

Update plant settings.

**Request:**
```json
{
  "name": "My Monstera",
  "species": "Monstera deliciosa",
  "thresholds": {
    "soil_moisture": {"min": 35, "max": 75}
  }
}
```

**Response (200):** Updated plant object

### DELETE /plants/{plant_id}

Remove a plant profile.

**Response:** 204 No Content

**Errors:**
- 404: Plant not found

### GET /plants/{plant_id}/devices

List devices assigned to a plant.

**Response (200):**
```json
{
  "devices": [...],
  "total": 1
}
```

### GET /plants/{plant_id}/history

Get telemetry history for a plant.

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `hours` | int | 24 | Hours of history (1-168) |

**Response (200):**
```json
{
  "plant_id": "plant-123",
  "readings": [
    {
      "timestamp": "2026-01-09T12:00:00Z",
      "temperature": 22.5,
      "humidity": 55.0,
      "soil_moisture": 65.0,
      "light_level": 450.0
    }
  ],
  "period_hours": 24
}
```

### POST /plants/{plant_id}/analyze

Generate an AI care plan for a plant using telemetry data.

**Response (200):**
```json
{
  "plant_id": "plant-123",
  "summary": "Your Monstera is thriving with optimal conditions.",
  "watering": {
    "status": "good",
    "recommendation": "Maintain current watering schedule",
    "details": "Soil moisture at 65% is ideal"
  },
  "light": {
    "status": "good",
    "recommendation": "Current light levels are perfect",
    "details": "450 lux is ideal for Monstera"
  },
  "humidity": {
    "status": "good",
    "recommendation": "Humidity levels are optimal",
    "details": "55% relative humidity"
  },
  "temperature": {
    "status": "good",
    "recommendation": "Temperature is in ideal range",
    "details": "22.5°C is perfect"
  },
  "alerts": [],
  "tips": [
    "Rotate the plant quarterly for even growth",
    "Wipe leaves monthly to prevent dust buildup"
  ],
  "generated_at": "2026-01-09T12:00:00Z"
}
```

**Status values:** `good`, `warning`, `critical`

**Errors:**
- 404: Plant not found
- 503: LLM service unavailable or not configured

### GET /plants/{plant_id}/care-plan

Get the most recent care plan for a plant.

**Response (200):** Same as POST /plants/{plant_id}/analyze

**Errors:**
- 404: Plant not found or no care plan generated yet

### POST /plants/{plant_id}/health-check

Perform a quick health check on plant readings.

**Response (200):**
```json
{
  "plant_id": "plant-123",
  "status": "healthy",
  "issues": [],
  "checked_at": "2026-01-09T12:00:00Z"
}
```

**Status values:** `healthy`, `warning`, `critical`, `unknown`

## Settings Endpoints

Base path: `/api/settings`

### GET /settings/llm

Get current LLM configuration (API key masked).

**Response (200):**
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

**Provider options:** `anthropic`, `openai`

**Model options:**
- Anthropic: `claude-sonnet-4-20250514`, `claude-opus-4-20250514`
- OpenAI: `gpt-4o`, `gpt-4-turbo`

**Response (200):**
```json
{
  "provider": "anthropic",
  "model": "claude-sonnet-4-20250514",
  "api_key_set": true,
  "api_key_preview": "****abc123"
}
```

### POST /settings/llm/test

Test LLM API key validity.

**Response (200):**
```json
{
  "valid": true,
  "message": "Connection successful"
}
```

**Response (200 - Invalid):**
```json
{
  "valid": false,
  "message": "Invalid API key"
}
```

## Error Responses

All endpoints return errors in a consistent format:

```json
{
  "detail": "Plant with id 'xyz' not found"
}
```

**HTTP Status Codes:**
| Code | Description |
|------|-------------|
| 200 | Success |
| 201 | Created |
| 204 | No Content (successful deletion) |
| 400 | Bad Request (invalid input) |
| 404 | Not Found |
| 422 | Validation Error (invalid data format) |
| 500 | Internal Server Error |
| 503 | Service Unavailable |

**Validation Error Format (422):**
```json
{
  "detail": [
    {
      "loc": ["body", "name"],
      "msg": "field required",
      "type": "value_error.missing"
    }
  ]
}
```

## MQTT Topics

Devices publish telemetry data over MQTT:

### Telemetry Topic
`devices/{device_id}/telemetry`

**Payload:**
```json
{
  "timestamp": 123456789,
  "temperature": 22.5,
  "humidity": 55.0,
  "soil_moisture": 65.0,
  "light_level": 450.0
}
```

### Heartbeat Topic
`devices/{device_id}/heartbeat`

**Payload:**
```json
{
  "timestamp": 123456789,
  "uptime": 3600,
  "rssi": -65
}
```

## Authentication

The API does not currently require authentication for local home network use. For production deployments with internet exposure, add authentication middleware.

## Rate Limiting

No rate limiting is applied by default. Configure nginx or a reverse proxy for rate limiting in production.

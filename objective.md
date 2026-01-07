# PlantOps Objective

> Challenge 001 — Production Plant Monitoring with AI Care Advisor

## Vision

A production-ready IoT plant monitoring system that:
1. Dynamically provisions sensor devices with proper authentication
2. Ingests telemetry via secured MQTT
3. Displays real-time dashboards with alerts
4. Uses an LLM (user's own API key) to generate personalized plant care plans

---

## Feature 1: Core Platform (Infrastructure + Monitoring)

**Goal:** Production IoT infrastructure with device provisioning, telemetry ingestion, and alerting.

### Device Provisioning

1. **Device Registration API**
   - `POST /api/devices/register` — Register new device (returns device_id + MQTT credentials)
   - `POST /api/devices/{id}/provision` — Associate device with a plant
   - `GET /api/devices` — List all devices with status
   - `DELETE /api/devices/{id}` — Decommission device

2. **Auto-Discovery Flow**
   ```
   Device boots → POST /api/devices/register { mac_address, firmware_version }
               → Receives: device_id, mqtt_username, mqtt_password
               → Connects to MQTT with credentials
               → Publishes to: devices/{device_id}/telemetry
               → User assigns device to plant in UI (or auto-create)
   ```

3. **MQTT Authentication**
   - Mosquitto requires username/password
   - Each device gets unique credentials on registration
   - Reject unauthenticated connections
   - Topic ACLs: devices publish only to their own topics

4. **Device Lifecycle**
   - Status: `online`, `offline`, `provisioning`, `error`
   - Heartbeat: `devices/{device_id}/heartbeat` every 60s
   - Auto-mark offline after 3 missed heartbeats
   - Alert when device goes offline

### Plant Management

- `POST /api/plants` — Create plant (name, species, thresholds)
- `GET /api/plants` — List all plants with current status
- `GET /api/plants/{id}` — Single plant with latest telemetry
- `GET /api/plants/{id}/history` — 24h telemetry history
- `PUT /api/plants/{id}` — Update plant (name, species, thresholds)
- `DELETE /api/plants/{id}` — Remove plant
- `GET /api/plants/{id}/devices` — List sensors attached to plant

### Telemetry Pipeline

- Backend subscribes to `devices/+/telemetry`
- Validates payload, maps device → plant
- Writes to TimescaleDB with device + plant context
- Worker evaluates thresholds, sends Discord alerts with cooldown

### Telemetry Payload
```json
{
  "timestamp": "2026-01-07T12:00:00Z",
  "soil_moisture": 45.2,
  "temperature": 22.5,
  "humidity": 65.0,
  "light_level": 800
}
```

### Database Schema
```sql
CREATE TABLE devices (
  id TEXT PRIMARY KEY,
  mac_address TEXT UNIQUE,
  mqtt_username TEXT UNIQUE,
  mqtt_password_hash TEXT NOT NULL,
  plant_id TEXT REFERENCES plants(id),
  status TEXT DEFAULT 'provisioning',
  firmware_version TEXT,
  sensor_types JSONB,
  last_seen_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE plants (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  species TEXT,
  thresholds JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE telemetry (
  time TIMESTAMPTZ NOT NULL,
  device_id TEXT REFERENCES devices(id),
  plant_id TEXT REFERENCES plants(id),
  soil_moisture FLOAT,
  temperature FLOAT,
  humidity FLOAT,
  light_level FLOAT
);
-- TimescaleDB hypertable on telemetry

CREATE TABLE alerts (
  id SERIAL PRIMARY KEY,
  plant_id TEXT REFERENCES plants(id),
  metric TEXT,
  value FLOAT,
  threshold FLOAT,
  sent_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Frontend
- **Dashboard**: Plant cards with live status, alerts badge
- **Device Management**: List devices, status indicators, assign to plants
- **Plant Detail**: Current readings, 24h history chart, threshold config

### Simulator (Dev Only)
- Simulates 6 devices with mock telemetry
- Auto-registers on startup (uses device provisioning API)
- Useful for development, not required in production

### Definition of Done
- [ ] Device can self-register via API
- [ ] Device receives unique MQTT credentials
- [ ] MQTT broker rejects unauthenticated connections
- [ ] Plants can be created/updated/deleted via API
- [ ] Telemetry flows: device → MQTT → backend → DB
- [ ] Dashboard shows plants with live data
- [ ] Device status tracked (online/offline)
- [ ] Discord alert fires on threshold breach
- [ ] Discord alert fires when device goes offline
- [ ] `make check` passes

---

## Feature 2: LLM Plant Care Advisor

**Goal:** AI analyzes each plant and generates personalized care plans. User brings their own API key.

### User Configuration

1. **LLM Settings Page**
   - User selects provider: `Anthropic` or `OpenAI`
   - User enters their own API key
   - Key stored encrypted in DB (or local storage)
   - Test connection button

2. **Supported Providers**
   - Anthropic Claude (claude-sonnet-4-20250514 default)
   - OpenAI GPT (gpt-4o default)
   - Configurable model selection

### Care Plan Generation

1. **Plant Identification**
   - User sets plant species (e.g., "Monstera Deliciosa", "Fiddle Leaf Fig")
   - Species informs ideal conditions

2. **LLM Analysis**
   - Input: plant name, species, current readings, 24h trends
   - Output: structured care plan JSON
   ```json
   {
     "summary": "Your Monstera is slightly underwatered",
     "watering": { "frequency": "Every 5-7 days", "amount": "Until water drains", "next": "2026-01-09" },
     "light": { "current": "Low", "ideal": "Bright indirect", "recommendation": "Move closer to window" },
     "humidity": { "current": 45, "ideal": "60-80%", "recommendation": "Consider a humidifier" },
     "alerts": ["Soil moisture critically low", "Light level below optimal"],
     "generated_at": "2026-01-07T12:00:00Z"
   }
   ```

3. **Care Plan Storage**
   - Store in DB, don't regenerate every page load
   - Refresh on: user request, weekly, or significant state change

### API Endpoints
| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/settings/llm` | Get LLM config (provider, model, key masked) |
| PUT | `/api/settings/llm` | Update LLM config |
| POST | `/api/settings/llm/test` | Test API key validity |
| POST | `/api/plants/{id}/analyze` | Generate care plan |
| GET | `/api/plants/{id}/care-plan` | Get current care plan |

### Frontend
- **Settings Page**: LLM provider selection, API key input, test button
- **Plant Care Page** (`/plants/{id}/care`): AI recommendations, care schedule
- **Regenerate Button**: Refresh care plan with latest data

### Definition of Done
- [ ] User can configure Anthropic or OpenAI API key
- [ ] API key is stored securely (encrypted or hashed)
- [ ] LLM generates care plan based on plant species + sensor data
- [ ] Care plan displays on per-plant care page
- [ ] Care plans persist, refresh on demand
- [ ] Works without LLM configured (graceful degradation)
- [ ] `make check` passes

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                        PLANTOPS SYSTEM                              │
└─────────────────────────────────────────────────────────────────────┘

  ┌──────────────┐     1. Register       ┌──────────────┐
  │   Device     │──────────────────────▶│   Backend    │
  │  (ESP32/Pi)  │     (get credentials) │   (FastAPI)  │
  └──────┬───────┘                       └──────┬───────┘
         │                                      │
         │ 2. MQTT connect (auth)               │ Store credentials
         ▼                                      ▼
  ┌──────────────┐                       ┌──────────────┐
  │  Mosquitto   │                       │  TimescaleDB │
  │  (auth req)  │                       │              │
  └──────┬───────┘                       └──────────────┘
         │                                      ▲
         │ 3. Publish telemetry                 │
         ▼                                      │
  ┌──────────────┐     4. Persist              │
  │   Backend    │─────────────────────────────┘
  │ (MQTT sub)   │
  └──────┬───────┘
         │
    ┌────┴────┬──────────────┐
    ▼         ▼              ▼
┌────────┐ ┌────────┐  ┌───────────┐
│ Worker │ │Frontend│  │ LLM Care  │──▶ Anthropic/OpenAI
│(alerts)│ │        │  │ (Feature 2)│   (user's API key)
└────────┘ └────────┘  └───────────┘
```

---

## Constraints

- Simulator uses device provisioning API (not hardcoded credentials)
- No external auth for users (single-user system)
- LLM is optional - system works without it configured

## Tech Stack

| Component | Technology |
|-----------|------------|
| Backend | Python 3.11+ with FastAPI |
| Database | PostgreSQL 15 + TimescaleDB |
| Frontend | React 18 + TypeScript + Vite |
| MQTT Broker | Mosquitto 2.x |
| Styling | TailwindCSS (or similar) |

## Out of Scope

- OTA firmware updates
- Multi-tenancy / user accounts
- TLS for MQTT
- Mobile app

---

## Implementation Order

1. **Feature 1** (Core Platform) - This is the foundation
   - Device provisioning + MQTT auth
   - Plant CRUD + telemetry pipeline
   - Dashboard + alerts

2. **Feature 2** (LLM Care Advisor) - Enhancement after core works
   - Settings page for API keys
   - Care plan generation
   - Per-plant care pages

## Success Criteria

The system is complete when:
1. A new device can self-register and start sending authenticated telemetry
2. Plants are created dynamically via UI (no seed data)
3. Dashboard shows live plant status with working alerts
4. User can add their LLM API key and get AI care recommendations
5. All tests pass: `make check`

---

## Clarifications

### Thresholds JSONB Structure
```json
{
  "soil_moisture": { "min": 20, "max": 80 },
  "temperature": { "min": 18, "max": 30 },
  "humidity": { "min": 40, "max": 80 },
  "light_level": { "min": 200, "max": null }
}
```
- `min`/`max` are optional (null = no limit)
- Alert triggers when value < min or value > max

### MQTT Authentication
- Use Mosquitto's built-in password file auth (`password_file`)
- Backend generates random password on device registration
- Store password hash in DB (bcrypt), but write plaintext to Mosquitto password file
- Mosquitto reloads password file on SIGHUP or restart
- Alternative: use `mosquitto-go-auth` plugin with DB backend (more complex)

### Unassigned Device Telemetry
- Devices without `plant_id` are "unassigned"
- Telemetry still stored with `plant_id = NULL`
- Dashboard shows "Unassigned Devices" section
- Alerts NOT evaluated until device is assigned to a plant
- User assigns device → plant via UI

### Telemetry Subscriptions
Backend subscribes to:
- `devices/+/telemetry` — sensor readings
- `devices/+/heartbeat` — device alive signals

### LLM API Key Storage
- Stored in `settings` table, encrypted with server-side key
- Server key from environment variable `ENCRYPTION_KEY`
- Never stored in plaintext, never logged
- Frontend receives masked version (last 4 chars only)

### Alert Message Generation
Alert message is generated from stored data:
```python
f"{metric} is {value:.1f}, threshold {direction} {threshold:.1f}"
# Example: "soil_moisture is 15.2, threshold min 20.0"
```

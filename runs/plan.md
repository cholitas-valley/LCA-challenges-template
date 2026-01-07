# PlantOps Implementation Plan

> Run 003 - IoT Plant Monitoring with LLM Care Advisor

## Overview

This plan implements a production-ready IoT plant monitoring system with two main features:

1. **Feature 1 (Core Platform)**: Device provisioning, MQTT authentication, plant management, telemetry pipeline, dashboard, and alerts
2. **Feature 2 (LLM Care Advisor)**: User-configurable LLM settings, care plan generation, per-plant care pages

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

## Tech Stack

| Component | Technology |
|-----------|------------|
| Backend | Python 3.11+ with FastAPI |
| Database | PostgreSQL 15 + TimescaleDB |
| Frontend | React 18 + TypeScript + Vite |
| MQTT Broker | Mosquitto 2.x |
| Styling | TailwindCSS |
| Containerization | Docker + Docker Compose |

## Database Schema

```sql
-- Devices table
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

-- Plants table
CREATE TABLE plants (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  species TEXT,
  thresholds JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Telemetry table (TimescaleDB hypertable)
CREATE TABLE telemetry (
  time TIMESTAMPTZ NOT NULL,
  device_id TEXT REFERENCES devices(id),
  plant_id TEXT REFERENCES plants(id),
  soil_moisture FLOAT,
  temperature FLOAT,
  humidity FLOAT,
  light_level FLOAT
);

-- Alerts table
CREATE TABLE alerts (
  id SERIAL PRIMARY KEY,
  plant_id TEXT REFERENCES plants(id),
  metric TEXT,
  value FLOAT,
  threshold FLOAT,
  sent_at TIMESTAMPTZ DEFAULT NOW()
);

-- Settings table (for LLM config)
CREATE TABLE settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Care plans table
CREATE TABLE care_plans (
  id SERIAL PRIMARY KEY,
  plant_id TEXT REFERENCES plants(id) UNIQUE,
  plan_data JSONB NOT NULL,
  generated_at TIMESTAMPTZ DEFAULT NOW()
);
```

## API Endpoints

### Device Management
| Method | Path | Purpose |
|--------|------|---------|
| POST | `/api/devices/register` | Register new device (returns credentials) |
| POST | `/api/devices/{id}/provision` | Associate device with plant |
| GET | `/api/devices` | List all devices with status |
| DELETE | `/api/devices/{id}` | Decommission device |

### Plant Management
| Method | Path | Purpose |
|--------|------|---------|
| POST | `/api/plants` | Create plant |
| GET | `/api/plants` | List all plants with status |
| GET | `/api/plants/{id}` | Single plant with telemetry |
| GET | `/api/plants/{id}/history` | 24h telemetry history |
| PUT | `/api/plants/{id}` | Update plant |
| DELETE | `/api/plants/{id}` | Remove plant |
| GET | `/api/plants/{id}/devices` | List sensors for plant |

### LLM Care Advisor
| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/settings/llm` | Get LLM config (masked key) |
| PUT | `/api/settings/llm` | Update LLM config |
| POST | `/api/settings/llm/test` | Test API key validity |
| POST | `/api/plants/{id}/analyze` | Generate care plan |
| GET | `/api/plants/{id}/care-plan` | Get current care plan |

## Implementation Phases

### Phase 1: Infrastructure (Tasks 001-003)
- Project scaffolding (Docker, Makefile, configs)
- Database schema and migrations
- Backend API foundation

### Phase 2: Device Provisioning (Tasks 004-006)
- Device registration API
- MQTT credential generation
- Mosquitto authentication integration

### Phase 3: Plant Management (Tasks 007-008)
- Plant CRUD API
- Device-to-plant association

### Phase 4: Telemetry Pipeline (Tasks 009-011)
- MQTT subscriber
- Telemetry ingestion and storage
- Device heartbeat and status tracking

### Phase 5: Alerts (Tasks 012-013)
- Threshold evaluation worker
- Discord webhook integration

### Phase 6: Frontend Foundation (Tasks 014-016)
- React project setup
- API client and state management
- Layout and navigation

### Phase 7: Dashboard (Tasks 017-019)
- Plant cards with live status
- Device management UI
- Plant detail with history charts

### Phase 8: Feature 1 QA (Task 020)
- End-to-end validation of core platform

### Phase 9: LLM Integration (Tasks 021-024)
- LLM settings API
- Care plan generation
- Settings UI
- Per-plant care pages

### Phase 10: Final QA (Task 025)
- Complete system validation

## Documentation

Documentation is written by `lca-docs` agent and lives in `docs/`:

- `docs/system-design.md` - Architecture overview, component interactions, data flow
  - Sections: Overview, Components, Data Flow, Database Schema, MQTT Topics
  - Updated by: task-003 (after backend foundation)

- `docs/api.md` - REST API reference with request/response schemas
  - Sections: Authentication, Devices API, Plants API, Settings API, Care Plans API
  - Updated by: task-008 (after plant management), task-024 (after LLM features)

- `docs/deployment.md` - Docker setup, environment variables, production configuration
  - Sections: Prerequisites, Quick Start, Environment Variables, Docker Compose, Mosquitto Setup
  - Updated by: task-001 (after scaffolding)

- `docs/development.md` - Local development setup, running tests, simulator usage
  - Sections: Setup, Running Services, Testing, Simulator, Debugging
  - Updated by: task-020 (after Feature 1 QA)

## Task Outline

### Feature 1: Core Platform

| ID | Title | Role | Depends On |
|----|-------|------|------------|
| 001 | Project scaffolding | backend | - |
| 002 | Database schema | backend | 001 |
| 003 | Backend API foundation | backend | 002 |
| 004 | Device registration API | backend | 003 |
| 005 | MQTT credential generation | backend | 004 |
| 006 | Mosquitto auth integration | backend | 005 |
| 007 | Plant CRUD API | backend | 003 |
| 008 | Device-plant association | backend | 007 |
| 009 | MQTT subscriber | backend | 006 |
| 010 | Telemetry ingestion | backend | 009 |
| 011 | Device heartbeat tracking | backend | 010 |
| 012 | Threshold evaluation worker | backend | 010 |
| 013 | Discord alerts | backend | 012 |
| 014 | Frontend scaffolding | frontend | 003 |
| 015 | API client setup | frontend | 014 |
| 016 | Layout and navigation | frontend | 015 |
| 017 | Dashboard plant cards | frontend | 016, 007 |
| 018 | Device management UI | frontend | 017, 008 |
| 019 | Plant detail with charts | frontend | 018, 010 |
| 020 | Feature 1 QA | qa | 019, 013 |

### Feature 2: LLM Care Advisor

| ID | Title | Role | Depends On |
|----|-------|------|------------|
| 021 | LLM settings API | backend | 020 |
| 022 | Care plan generation | backend | 021 |
| 023 | Settings UI | frontend | 021 |
| 024 | Per-plant care pages | frontend | 022, 023 |
| 025 | Final QA | qa | 024 |

## Risks and Mitigations

| Risk | Mitigation |
|------|------------|
| Mosquitto password file sync | Backend writes to file, sends SIGHUP to reload |
| MQTT connection stability | Implement reconnection logic with backoff |
| LLM API rate limits | Cache care plans, refresh on demand only |
| TimescaleDB complexity | Use standard PostgreSQL queries, hypertable for performance |
| Frontend state complexity | Use React Query for server state management |

## Success Criteria

1. Device can self-register via API
2. Device receives unique MQTT credentials
3. MQTT broker rejects unauthenticated connections
4. Plants can be created/updated/deleted via API
5. Telemetry flows: device -> MQTT -> backend -> DB
6. Dashboard shows plants with live data
7. Device status tracked (online/offline)
8. Discord alert fires on threshold breach
9. Discord alert fires when device goes offline
10. User can configure Anthropic or OpenAI API key
11. LLM generates care plan based on plant species + sensor data
12. Care plan displays on per-plant care page
13. `make check` passes

---

*Generated by lca-planner for run/003*

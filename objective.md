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
- [x] Device can self-register via API
- [x] Device receives unique MQTT credentials
- [x] MQTT broker rejects unauthenticated connections
- [x] Plants can be created/updated/deleted via API
- [x] Telemetry flows: device → MQTT → backend → DB
- [x] Dashboard shows plants with live data
- [x] Device status tracked (online/offline)
- [x] Discord alert fires on threshold breach
- [x] Discord alert fires when device goes offline
- [x] `make check` passes

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
- [x] User can configure Anthropic or OpenAI API key
- [x] API key is stored securely (encrypted or hashed)
- [x] LLM generates care plan based on plant species + sensor data
- [x] Care plan displays on per-plant care page
- [x] Care plans persist, refresh on demand
- [x] Works without LLM configured (graceful degradation)
- [x] `make check` passes

---

## Feature 3: Production Hardening for Real ESP32 Deployment

**Goal:** Harden the system for real home production deployment with actual ESP32 sensors, focusing on security, reliability, and operational readiness.

### Completed State (run/003)

Features 1 and 2 are **complete** as of run/003:

| Metric | Value |
|--------|-------|
| Branch | `run/003` (COMPLETE) |
| Tasks completed | 25/25 |
| Backend tests | 116 passing |
| Frontend build | Success (795 modules) |
| Last task | `task-025` (Final QA) |
| Last handoff | `runs/handoffs/task-025.md` |

**What exists (Backend):**
- Device registration API (`POST /api/devices/register`)
- MQTT credential generation (unique username/password per device)
- Mosquitto password file authentication (auto-reload via SIGHUP)
- Plant CRUD API with threshold configuration
- Telemetry ingestion via MQTT → TimescaleDB
- Device heartbeat tracking (online/offline status)
- Discord alerts (threshold breach, device offline)
- LLM care plan generation (Anthropic/OpenAI with user API key)
- Alert worker with queue processing
- Care plan worker with async generation

**What exists (Frontend):**
- React dashboard with plant cards, device management
- Plant detail page with 24h history charts
- Device management UI (register, assign to plants)
- Settings UI for LLM configuration
- Per-plant care pages with AI recommendations

**What exists (DevOps/Scripts):**
- `docker-compose.yml` - Dev environment (db, mosquitto, backend, frontend)
- `Makefile` with targets: `up`, `down`, `logs`, `check`, `test`, `seed`, `simulate`
- `scripts/seed.py` - Creates test plants, registers devices, assigns them, sends telemetry
- `scripts/simulator.py` - Continuous device simulator (registers, connects MQTT, publishes)
- `mosquitto/mosquitto.conf` - Basic config with password file auth
- `mosquitto/passwd` - Password file (auto-managed by backend)

**What exists (Reference Skills):**
- `.spawner/skills/` - Domain expertise YAML files (backend, frontend, hardware, etc.)
- Agent prompts reference skills in `.claude/agents/*.md`

**Post-run/003 commits (already on branch):**
- `1e4c050` - Complete backend and frontend implementation
- `8321e0c` - fix: missing runs
- `73a7aed` - feat: spawner skills integration

**Current limitations identified in task-025:**
1. No MQTT TLS (connections unencrypted)
2. No connection resilience (reconnect logic)
3. No structured logging
4. No proper migration versioning
5. No health/readiness probes beyond basic `/health`
6. Docker config is dev-only (bind mounts, no resource limits)
7. No real ESP32 firmware (only Python simulator)
8. Incomplete documentation

### Starting Point for run/004

**Branch from:** `run/003` (latest commit on branch)
**Phase:** `PLANNING`
**First task:** `task-026`

**Context for planner - what already exists:**
- Working device registration + MQTT authentication (password file)
- Telemetry pipeline (MQTT → Backend → TimescaleDB)
- Python simulator (`scripts/simulator.py`) and seeder (`scripts/seed.py`)
- Basic migration runner, health endpoint, care plan worker
- React dashboard with all Feature 1 & 2 functionality
- Reference skills in `.spawner/skills/` for domain patterns

**Frontend scope:** Unchanged unless required by new backend capabilities.

### 3.1 MQTT Security (TLS)

**Requirement:** Secure MQTT connections for home network deployment.

- Mosquitto must support TLS connections (port 8883)
- Backend must connect via TLS when configured
- ESP32 firmware must connect via TLS
- Self-signed certificates acceptable for home use
- Plain TCP (1883) may remain available for local development

### 3.2 Connection Resilience

**Requirement:** System recovers gracefully from network interruptions.

- Backend auto-reconnects to MQTT with backoff
- ESP32 auto-reconnects to WiFi and MQTT
- Health endpoint reflects actual connection status
- Optional: offline buffering on ESP32

### 3.3 Structured Logging

**Requirement:** Production-ready logging for debugging and monitoring.

- JSON-formatted logs when configured for production
- Configurable log levels via environment variable
- Logs include relevant context (device_id, plant_id, etc.)

### 3.4 Database Migrations

**Requirement:** Repeatable, versioned database schema management.

- Migrations are versioned and idempotent
- System tracks which migrations have been applied
- Safe to run migrations multiple times

### 3.5 Docker Production Configuration

**Requirement:** Production-ready container deployment.

- Production Docker config without development bind mounts
- Resource limits on containers
- Health checks for orchestration
- Documented environment variables

### 3.6 ESP32 Firmware

**Requirement:** Real hardware support for plant monitoring.

- PlatformIO project for ESP32
- Self-registration via backend API on first boot
- Publishes telemetry and heartbeat to MQTT
- Supports common sensors (temperature, humidity, soil moisture, light)
- WiFi configuration without hardcoded credentials

### 3.7 Documentation

**Requirement:** Complete documentation for deployment and hardware setup.

- Feature 2 documentation (missing)
- Production deployment guide
- ESP32 firmware setup and flashing instructions
- API reference

### Definition of Done

**MQTT Security:**
- [x] Mosquitto configured with TLS on port 8883
- [x] Self-signed certificates generated and documented
- [x] Backend connects via TLS when `MQTT_USE_TLS=true`
- [x] ESP32 firmware connects via TLS

**Connection Resilience:**
- [x] Backend reconnects automatically on MQTT disconnect
- [x] ESP32 reconnects automatically on WiFi/MQTT disconnect
- [x] `/health` endpoint shows MQTT connection status
- [x] `/ready` endpoint returns 503 when not connected

**Structured Logging:**
- [x] All backend logs in JSON format (when `LOG_FORMAT=json`)
- [x] Log level configurable via `LOG_LEVEL`
- [x] Request tracing with correlation IDs

**Database Migrations:**
- [x] Migrations versioned in `migrations/` directory
- [x] `schema_version` table tracks applied migrations
- [x] Startup skips already-applied migrations

**Docker Production:**
- [x] `docker-compose.prod.yml` with resource limits
- [x] No bind mounts in production config
- [x] Health checks on all services
- [x] `.env.prod.example` documented

**ESP32 Firmware:**
- [x] PlatformIO project compiles for ESP32
- [x] WiFi connection with captive portal setup
- [x] Device self-registration working
- [x] Telemetry and heartbeat publishing
- [x] TLS connection to Mosquitto

**Documentation:**
- [x] All docs listed above created
- [x] README updated with production instructions

**Tests:**
- [x] All existing 116 tests still pass
- [x] New tests for TLS, reconnection, logging
- [x] `make check` passes

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
- Mobile app

---

## Implementation Order

1. **Feature 1** (Core Platform) - Foundation ✅ COMPLETE (run/003)
   - Device provisioning + MQTT auth
   - Plant CRUD + telemetry pipeline
   - Dashboard + alerts

2. **Feature 2** (LLM Care Advisor) - Enhancement ✅ COMPLETE (run/003)
   - Settings page for API keys
   - Care plan generation
   - Per-plant care pages

3. **Feature 3** (Production Hardening) - Real deployment ✅ COMPLETE (run/004)
   - MQTT TLS security
   - Connection resilience
   - Structured logging
   - Database migrations
   - Docker production config
   - ESP32 firmware
   - Documentation

4. **Feature 4** (UI/UX Refactor) - Design cleanup ✅ COMPLETE (run/005)
   - Semantic color system (fix red/green button chaos)
   - Consistent component patterns
   - Proper button hierarchy (primary/secondary/danger)
   - Status indicators vs action buttons separation
   - Accessibility improvements (color blindness, contrast)
   - Design token architecture

5. **Feature 5** (Designer Space) - Visual floor plan ✅ COMPLETE (run/006)
   - Minimalist "clean technical" aesthetic
   - 20 SVG plant icons (top-down line art)
   - Interactive canvas with drag-and-drop
   - Real-time status overlays
   - Backend position storage

6. **Feature 6** (Scandinavian Room View) - Visual upgrade
   - Cozy room diorama replacing blueprint style
   - Botanically accurate plant illustrations
   - 20 fixed placement spots (shelves, sideboard, floor)
   - Soft Scandinavian color palette

---

## Feature 4: UI/UX Refactor

**Goal:** Clean up the frontend design for consistency, accessibility, and professional appearance.

**Scope:** Frontend only (`frontend/` directory). No backend changes required.

**Primary role:** `lca-frontend` for all implementation tasks.

### Current Problems

1. **Color Chaos**
   - `bg-green-600` used for everything (buttons, links, status, filters)
   - `bg-red-600` used for both delete buttons AND error status
   - No semantic color system despite tokens defined in tailwind.config.js

2. **Button Hierarchy Missing**
   - All buttons look the same (green)
   - No visual distinction between primary/secondary/tertiary actions
   - Destructive actions not clearly differentiated

3. **Status vs Actions Confused**
   - Same colors for status indicators and action buttons
   - "Online" status and "Assign" button both green
   - "Error" status and "Delete" button both red

4. **Tailwind Tokens Unused**
   - `plant.healthy`, `plant.warning`, `plant.danger` defined but ignored
   - Raw color utilities used instead (`bg-green-600`)

### 4.1 Semantic Color System

**Requirement:** Implement proper semantic colors.

```
Action Colors (buttons):
- primary    → Brand color for main actions
- secondary  → Muted for alternative actions
- danger     → Red, destructive actions only

Status Colors (indicators):
- success    → Green for healthy/online/good
- warning    → Yellow/amber for caution
- error      → Red for critical/offline/bad
- info       → Blue for informational
```

### 4.2 Component Patterns

**Requirement:** Consistent component styling.

- **Buttons:** Primary (filled), Secondary (outlined), Ghost (text), Danger (red filled)
- **Status Badges:** Colored dots/pills for status, never buttons
- **Cards:** Consistent padding, shadows, borders
- **Forms:** Consistent input styling, error states
- **Links:** Consistent hover states, not confused with buttons

### 4.3 Accessibility

**Requirement:** WCAG 2.1 AA compliance.

- Contrast ratios meet 4.5:1 for text
- Color is not the only indicator (add icons/text)
- Focus states visible
- Screen reader friendly

### 4.4 Design Tokens

**Requirement:** Single source of truth for design values.

- Update tailwind.config.js with proper semantic tokens
- Use tokens consistently throughout components
- Theme changeable from one file

**Token Architecture (3 layers):**
```
Layer 1: Primitives (raw values)
  --green-500, --red-500, --blue-500

Layer 2: Semantic (intent-based)
  --color-primary, --color-danger, --color-success

Layer 3: Component (specific use)
  --button-primary-bg, --status-online-bg
```

### 4.5 Component Library

**Requirement:** Reusable components with consistent styling.

- **Button:** Primary (filled brand), Secondary (outlined), Ghost (text-only), Danger (filled red)
- **StatusBadge:** Dot + text for status indicators (online/offline/error/warning)
- **FilterPills:** Toggle pattern for filters (not action buttons)
- **Card:** Consistent padding (p-4/p-6), shadows, borders
- **Alert:** Info/Warning/Error banners with icon + color + text

**Button Hierarchy:**
```
Primary   → Main CTA (1 per section max)
Secondary → Alternative actions
Ghost     → Tertiary/cancel actions
Danger    → Destructive only (delete, remove)
```

### 4.6 Loading & Empty States

**Requirement:** Proper loading and zero-state patterns.

- **Skeleton screens:** For tables, cards during data fetch
- **Loading spinners:** Consistent size/color across app
- **Empty states:** Icon + message + clear CTA
- **Error states:** Red banner with retry action

### 4.7 Filter vs Action Distinction

**Requirement:** Visual separation of toggles from actions.

Current problem: Filter buttons (All/Online/Offline) look identical to action buttons (Register Device).

Solution:
- **Filters:** Use pill/chip toggle pattern (gray background, no shadow)
- **Actions:** Use filled button pattern (brand color, shadow)

### Definition of Done

**Color System:**
- [x] 3-layer token architecture in tailwind.config.js (primitives → semantic → component)
- [x] No raw color utilities in components (no `bg-green-600`)
- [x] Status colors separate from action colors
- [x] Color contrast meets WCAG AA (4.5:1 for text)

**Components:**
- [x] Button component with Primary/Secondary/Ghost/Danger variants
- [x] StatusBadge component for online/offline/error states
- [x] FilterPills component for filter toggles
- [x] All buttons use consistent hierarchy

**States:**
- [x] Skeleton loading for tables and cards
- [x] Empty states with clear CTAs
- [x] Focus states visible on all interactive elements

**Quality:**
- [x] `make check` passes (build + tests)
- [x] Visual review confirms professional appearance
- [x] No duplicate color definitions

**Completed:** run/005 (2026-01-10) — 139 tests passing

### Skills Available

Design skills in `.claude/skills/`:
- `color-theory` - Semantic colors, contrast, 60-30-10 rule
- `design-systems` - Token architecture, consistency
- `ui-design` - Component patterns, hierarchy, 8pt grid
- `ux-design` - User flows, loading states, error recovery
- `tailwind-css` - Tailwind best practices, custom config

## Success Criteria

**Features 1 & 2 (COMPLETE):**
1. ✅ A new device can self-register and start sending authenticated telemetry
2. ✅ Plants are created dynamically via UI (no seed data)
3. ✅ Dashboard shows live plant status with working alerts
4. ✅ User can add their LLM API key and get AI care recommendations
5. ✅ All tests pass: `make check` (116 tests)

**Feature 3 (COMPLETE - run/004):**
6. ✅ Real ESP32 connects via TLS and sends telemetry
7. ✅ System recovers automatically from MQTT/WiFi disconnections
8. ✅ Logs are structured JSON, queryable for debugging
9. ✅ Database migrations are versioned and repeatable
10. ✅ Production Docker deployment documented and tested
11. ✅ All tests pass: `make check` (139 tests)

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

---

## Feature 5: Designer Space (Visual Floor Plan)

**Goal:** A visual "room view" where users can see their plants spatially arranged, using a minimalist architectural blueprint aesthetic with real-time status overlays.

**Scope:** Frontend-heavy (`frontend/`) with minor backend additions for position storage.

**Primary role:** `lca-frontend` for UI implementation, `lca-backend` for position API.

### Design Philosophy

**"Clean Technical" Style:**
- Top-down 2D view (like an architectural floor plan)
- Uniform black or dark grey lines on white background
- No shading, shadows, or 3D effects
- Simple geometric outlines for plants
- Status colors (green/yellow/red) pop against the monochrome base

**Visual Language:**
```
┌─────────────────────────────────────────────┐
│                                             │
│     🌿              🪴                      │
│   [Monstera]     [Snake Plant]              │
│    ● Online       ● Warning                 │
│                                             │
│              🌱                             │
│           [Pothos]                          │
│           ● Offline                         │
│                                             │
└─────────────────────────────────────────────┘
```

### 5.1 Plant Icon Library

**Requirement:** SVG line art icons for common houseplants.

Top 20 houseplants to support (geometric top-down silhouettes):
1. Monstera Deliciosa (split leaves)
2. Snake Plant / Sansevieria (pointed cluster)
3. Pothos (trailing heart leaves)
4. Fiddle Leaf Fig (large oval leaves)
5. Spider Plant (arching fronds)
6. Peace Lily (oval leaves, central flower)
7. Rubber Plant (large oval)
8. ZZ Plant (compound leaves)
9. Philodendron (heart-shaped cluster)
10. Aloe Vera (pointed rosette)
11. Boston Fern (arching fronds)
12. Chinese Evergreen (oval pointed)
13. Dracaena (sword-shaped)
14. Jade Plant (round succulent leaves)
15. String of Pearls (trailing dots)
16. Calathea (striped oval)
17. Bird of Paradise (large paddle)
18. English Ivy (trailing star)
19. Succulent (generic rosette)
20. Cactus (generic outline)

**Icon specs:**
- SVG format, single path
- Viewbox: 64x64 or 128x128
- Stroke-only (no fills) - `stroke: currentColor`
- Line weight: 1.5-2px
- Monochrome (inherit color from parent)

### 5.2 Designer Canvas

**Requirement:** Interactive canvas for placing and viewing plants.

- **Canvas Component**: SVG or Canvas-based, responsive to container
- **Grid System**: Optional snap-to-grid (8pt or 16pt grid)
- **Room Outline**: Simple rectangle or user-customizable shape
- **Zoom/Pan**: Optional, but nice for larger spaces

**Plant Placement:**
- Drag plants from a sidebar onto the canvas
- Plants snap to grid (optional toggle)
- Position persisted to backend
- Click plant to see details (opens existing PlantDetail)

### 5.3 Status Overlay

**Requirement:** Real-time status visualization on each plant.

**Status Indicators:**
- Small colored dot below/beside plant icon
- Uses existing status tokens: `status-success`, `status-warning`, `status-error`
- Optionally: colored ring/glow around plant outline

**Status Rules:**
- Online + Optimal → Green dot
- Online + Warning → Yellow dot
- Online + Critical → Red dot
- Offline → Grey dot + dimmed icon

**Hover Tooltip (Required):**
- On hover, show tooltip with current sensor readings:
  ```
  ┌──────────────────┐
  │ Monstera         │
  │ ──────────────── │
  │ 💧 Soil: 45%     │
  │ 🌡️ Temp: 22°C    │
  │ 💨 Humidity: 65% │
  │ ☀️ Light: 800 lx │
  │ ──────────────── │
  │ Last: 2 min ago  │
  └──────────────────┘
  ```
- Tooltip appears on hover (desktop) or tap (mobile)
- Shows "No data" if device offline
- Uses existing telemetry from plant API

**Optional Enhancements:**
- Subtle pulse animation for alerts

### 5.4 Backend: Position Storage

**Requirement:** Store plant positions for the designer view.

**API Endpoint:**
```
PUT /api/plants/{id}/position
Body: { "x": 120, "y": 80 }

GET /api/plants (existing, add position to response)
Response: { ..., "position": { "x": 120, "y": 80 } }
```

**Database:**
- Add `position JSONB` column to plants table
- Default: `null` (not placed in designer)
- Migration: `ALTER TABLE plants ADD COLUMN position JSONB;`

### 5.5 Designer Page

**Requirement:** New page route `/designer` or `/space`.

**Layout:**
```
┌──────────────────────────────────────────────────┐
│ Designer Space                        [Edit Mode]│
├───────────┬──────────────────────────────────────┤
│           │                                      │
│ Unplaced: │                                      │
│ [🌿 M...]│         ┌─────────────┐              │
│ [🪴 S...]│         │    ROOM     │              │
│           │         │             │              │
│           │         │  🌿   🪴   │              │
│           │         │             │              │
│           │         └─────────────┘              │
│           │                                      │
└───────────┴──────────────────────────────────────┘
```

**Modes:**
- **View Mode**: See plants with status, click for details
- **Edit Mode**: Drag to reposition, toggle grid

### Definition of Done

**Icons:**
- [x] 20 SVG plant icons created (top-down line art)
- [x] Icons accessible via `<PlantIcon species="monstera" />`
- [x] Fallback icon for unknown species

**Canvas:**
- [x] DesignerCanvas component renders plants at positions
- [x] Drag-and-drop to reposition (edit mode)
- [x] Click plant navigates to plant detail
- [x] Responsive canvas sizing

**Status:**
- [x] Status dots use semantic tokens
- [x] Real-time updates (polling or existing data)
- [x] Offline plants visually dimmed
- [x] Hover tooltip shows sensor readings (soil, temp, humidity, light)
- [x] Tooltip shows "last updated" timestamp

**Backend:**
- [x] `position` column added to plants table
- [x] `PUT /api/plants/{id}/position` endpoint
- [x] Position included in `GET /api/plants` response

**Page:**
- [x] `/designer` route added
- [x] Sidebar shows unplaced plants
- [x] Edit/View mode toggle
- [x] Integrates with existing navigation

**Quality:**
- [x] `make check` passes
- [x] Visual matches "clean technical" aesthetic
- [x] Touch-friendly (works on tablet)

**Completed:** run/006 (2026-01-10) — tests passing

### Skills Available

For Feature 5, relevant skills in `.claude/skills/`:
- `ui-design` - Component patterns, hierarchy
- `ux-design` - User flows, interaction patterns
- `tailwind-css` - Styling
- `frontend` - React patterns
- `design-systems` - Consistent tokens

---

## Feature 6: Scandinavian Room View (Visual Upgrade)

**Goal:** Transform the Designer Space from a technical blueprint into a cozy, inviting Scandinavian-style room illustration with botanically accurate plant artwork.

**Scope:** Frontend-only visual redesign of `/designer` page. Reuses existing backend (position storage).

**Primary role:** `lca-frontend` for all implementation.

### Design Philosophy

**"Minimalist Scandinavian Plant Room" Style:**
- 2D flat-lay illustration, viewed from the front like a diorama
- Minimalist, clean lines with hand-drawn vector art feel
- Cozy blueprint / children's book illustration aesthetic
- Subtle paper-like texture for tactile, non-digital feel

**Color Palette:**
- Soft, muted, natural tones
- Whites and creams (walls)
- Light woods: birch, ash (furniture)
- Soft greens (plants)
- Touches of grey and pastel blue (accents)
- NO harsh colors - everything soft and inviting

### 6.1 Room Scene Illustration

**Requirement:** Static room background SVG/image.

**Scene Elements:**
- **Sideboard:** Long, low Scandinavian buffet in light wood, handle-less doors, tapered legs (centerpiece)
- **Shelves:** Two floating wooden shelves above sideboard
- **Armchair:** Simple cozy chair with sheepskin throw (side element)
- **Lighting:** Arc floor lamp with rounded shade, globe table lamp on sideboard
- **Decor:** Stack of art books, ceramic vase with branch, framed abstract print, woven basket with blanket, fluffy cat on rug

**Technical:**
- SVG or high-quality PNG background
- Layered so plants render on top
- Responsive scaling

**Asset Location:** `plants-png/room.png`

**Status: COMPLETE** - Room background illustration has been created.

**How it was created:**
- Generated using Google Gemini with prompt matching plant style
- Consistent with plant illustrations (same soft muted Scandinavian palette)
- Prompt used:
  ```
  Create a 2D illustration of a cozy Scandinavian living room scene,
  viewed from the front like a diorama. Include:
  - Long, low birch wood sideboard with tapered legs
  - Two floating wooden shelves above
  - Cozy armchair with sheepskin throw
  - Arc floor lamp, globe table lamp
  - Decor: books, ceramic vase with branch, abstract print, woven basket, fluffy cat on rug

  Style: Minimalist, hand-drawn vector art, soft muted colors (cream, birch, soft grey)
  Leave clear spots for plants on shelves, sideboard, and floor.
  ```

**Scene includes:**
- Scandinavian sideboard (centerpiece) with clear surface for plants
- Two floating shelves (empty, ready for plants)
- Armchair with sheepskin + arc floor lamp
- Globe lamp, books, vase with branch on sideboard
- Framed abstract art on wall
- Woven basket with blanket
- Fluffy cat curled up on woven rug
- Floor space for larger potted plants

**Style notes:**
- Matches plant illustrations perfectly (same Gemini style)
- Soft cream/birch/grey Scandinavian palette
- 2D flat illustration with hand-drawn feel
- Clean lines, minimalist furniture
- High resolution PNG (~10MB)

### 6.2 Fixed Plant Positions (20 Spots)

**Requirement:** 20 pre-defined placement spots instead of free positioning.

**Distribution:**
| Location | Spots | Plant Sizes |
|----------|-------|-------------|
| Floating shelves | 6 | Small to medium |
| Sideboard surface | 8 | Varying sizes |
| Floor (stands/pots) | 6 | Larger plants |

**Position Data:**
```typescript
interface PlantSpot {
  id: number;           // 1-20
  location: 'shelf' | 'sideboard' | 'floor';
  x: number;            // Fixed X coordinate
  y: number;            // Fixed Y coordinate
  maxSize: 'small' | 'medium' | 'large';
  plantId: string | null;  // Assigned plant or empty
}
```

**Interaction:**
- Click empty spot → assign plant from sidebar
- Click occupied spot → view plant details or reassign
- Drag plant to different spot (edit mode)

### 6.3 Botanically Accurate Plant Illustrations

**Requirement:** Detailed, realistic plant artwork contrasting with minimalist room.

**Style Contrast:**
- Room/furniture: Simple, minimalist vector art
- Plants: Highly detailed, botanically accurate illustrations
- Plants should "pop" against the simple background

**Plant Species (20 varieties):**
1. Monstera Deliciosa (split leaves, iconic)
2. Fiddle Leaf Fig (large violin-shaped leaves)
3. Snake Plant / Sansevieria (upright sword leaves)
4. Pothos (trailing heart leaves)
5. ZZ Plant (glossy compound leaves)
6. Calathea (striped oval leaves)
7. Peace Lily (white flower, dark leaves)
8. Rubber Plant (large glossy oval)
9. Bird of Paradise (paddle leaves)
10. Spider Plant (arching variegated)
11. Boston Fern (feathery fronds)
12. Philodendron (heart-shaped)
13. Dracaena (sword-shaped cluster)
14. Aloe Vera (pointed succulent rosette)
15. String of Pearls (trailing beads)
16. Chinese Evergreen (silver-green)
17. English Ivy (trailing star leaves)
18. Jade Plant (thick succulent leaves)
19. Succulent Arrangement (mixed rosettes)
20. Cactus (various shapes)

**Illustration Specs:**
- Multiple sizes per species (small/medium/large variants)
- PNG with transparency OR detailed SVG
- Consistent lighting direction (top-left)
- Visible pot/planter matching Scandinavian aesthetic
- Species should be identifiable at a glance

**Asset Location:** `plants-png/` (root of repository)

**Status: COMPLETE** - All 20 plant illustrations have been created.

**How they were created:**
- Generated using Google Gemini with consistent prompt template
- Each plant generated individually to ensure botanical accuracy
- Consistent style achieved through standardized prompt:
  ```
  Create a botanical illustration of a [PLANT_NAME] ([DESCRIPTION]) in a ceramic pot.

  Style requirements:
  - Highly detailed, botanically accurate illustration
  - Soft, muted Scandinavian color palette
  - Pot should be simple, modern ceramic in cream/white
  - Clean white or very light grey background
  - Soft natural lighting from top-left
  - 2D illustration style, not photorealistic
  ```

**Generated files (20 plants):**

| File | Plant Species |
|------|---------------|
| `monstera.png` | Monstera Deliciosa |
| `snakeplant.png` | Snake Plant / Sansevieria |
| `pothos.png` | Pothos |
| `fiddle.png` | Fiddle Leaf Fig |
| `spider.png` | Spider Plant |
| `peacelily.png` | Peace Lily |
| `rubber.png` | Rubber Plant |
| `zzplant.png` | ZZ Plant |
| `philondendron.png` | Philodendron |
| `aloevera.png` | Aloe Vera |
| `boston.png` | Boston Fern |
| `chinese.png` | Chinese Evergreen |
| `dracaena.png` | Dracaena |
| `jade.png` | Jade Plant |
| `stringofpearls.png` | String of Pearls |
| `calathea.png` | Calathea |
| `birdofparadise.png` | Bird of Paradise |
| `englishivy.png` | English Ivy |
| `succulenta.png` | Succulent Arrangement |
| `cactus.png` | Cactus |

**Style notes:**
- All images have consistent soft muted green tones
- Cream/white ceramic pots throughout
- Light grey background (nearly white) - blends with Scandinavian aesthetic
- No background removal needed - grey matches room design
- High resolution PNG format (~6-9MB each)

**Implementation task:**
- Copy to `frontend/src/assets/plants/`
- Create mapping component to match plant species to image file

### 6.4 Updated Hover/Tooltip

**Requirement:** Tooltip matches cozy aesthetic.

**Design:**
- Soft rounded corners
- Cream/white background with subtle shadow
- Plant name in handwritten-style font (or soft sans-serif)
- Sensor readings with small icons
- "Last watered" style language

```
┌─────────────────────────┐
│  🌿 Monstera            │
│  ─────────────────────  │
│  💧 Soil moisture: 45%  │
│  🌡️ Temperature: 22°C   │
│  💨 Humidity: 65%       │
│  ☀️ Light: Good         │
│  ─────────────────────  │
│  Updated 2 min ago      │
└─────────────────────────┘
```

### 6.5 Status Indicators (Subtle)

**Requirement:** Status without breaking cozy aesthetic.

**Options:**
- Small colored ring around pot base (not harsh dot)
- Subtle glow effect on plant
- Small status icon in corner of plant

**Status Colors (muted versions):**
- Healthy: Soft sage green
- Warning: Muted amber/gold
- Critical: Dusty rose/coral (not harsh red)
- Offline: Light grey, slightly faded plant

### Definition of Done

**Room Scene:**
- [x] Background illustration created (`plants-png/room.png`)
- [x] Includes sideboard, shelves, armchair, lamps, decor
- [x] Matches Scandinavian aesthetic
- [ ] Copy to `frontend/src/assets/room/`
- [ ] Responsive scaling works

**Plant Positions:**
- [ ] 20 fixed spots defined (6 shelf, 8 sideboard, 6 floor)
- [ ] Click-to-assign interaction
- [ ] Visual indicator for empty vs occupied spots
- [ ] Position assignment persists to backend

**Plant Illustrations:**
- [x] 20 plant species created (Gemini-generated, stored in `plants-png/`)
- [ ] Multiple sizes per species (small/medium/large) - *optional, single size may suffice*
- [x] Botanically accurate, detailed style
- [x] Contrast with minimalist room background (soft grey blends with Scandinavian walls)
- [ ] Fallback for unknown species
- [ ] Copy assets to `frontend/src/assets/plants/`

**UI Polish:**
- [ ] Tooltip matches cozy aesthetic
- [ ] Status indicators are subtle (not harsh colors)
- [ ] Smooth transitions/animations
- [ ] Works on desktop and tablet

**Quality:**
- [ ] `make check` passes
- [ ] Visual review confirms cozy Scandinavian feel
- [ ] Plants are identifiable by species
- [ ] No visual clutter - maintains minimalism

### Skills Available

For Feature 6, relevant skills in `.claude/skills/`:
- `ui-design` - Component patterns, illustration integration
- `ux-design` - Interaction patterns, delight details
- `tailwind-css` - Styling, color palette
- `frontend` - React component structure
- `design-systems` - Consistent visual language

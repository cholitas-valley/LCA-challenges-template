---
task_id: task-003
title: MQTT broker and simulator implementation
role: lca-backend
post: [lca-docs]
depends_on: [task-001]
inputs:
  - runs/plan.md
  - runs/handoffs/task-001.md
  - docker-compose.yml
allowed_paths:
  - simulator/**
  - mosquitto/**
check_command: make check
handoff: runs/handoffs/task-003.md
---

## Goal

Configure MQTT broker (Mosquitto) and implement a simulator service that publishes realistic plant telemetry data for 6 plants to MQTT topics.

## Scope

**Create:**
- `mosquitto/mosquitto.conf` - Mosquitto configuration (allow anonymous, listener on 1883)
- `simulator/package.json` - Node.js dependencies (mqtt, typescript)
- `simulator/tsconfig.json` - TypeScript configuration
- `simulator/src/index.ts` - Main simulator logic:
  - Connect to MQTT broker
  - For each of 6 plants, publish telemetry every 10 seconds
  - Topic: `plants/<plant_id>/telemetry`
  - Payload: `{timestamp: ISO8601, soil_moisture: 0-100, light: 0-100, temperature: 15-35}`
  - Simulate realistic variation (random walk with bounds)
  - Occasionally trigger threshold breaches (e.g., soil_moisture < 20)
- `simulator/Dockerfile` - Node.js 20 Alpine
- `simulator/.dockerignore`

**Plant IDs:**
- `monstera`, `snake-plant`, `pothos`, `fiddle-leaf`, `spider-plant`, `peace-lily`

**Telemetry generation rules:**
- Use random walk to simulate gradual changes
- Add occasional spikes/dips to trigger alerts
- Ensure timestamps are in ISO 8601 format (UTC)
- Soil moisture: 0-100 (dry to wet)
- Light: 0-100 (dark to bright)
- Temperature: 15-35 (Celsius)

## Constraints

- Mosquitto must allow anonymous connections (for local dev)
- Simulator must wait for MQTT broker to be ready (health check)
- Use MQTT QoS 1 for reliability
- Simulator should log each published message to console
- Use TypeScript with strict mode
- Handle MQTT reconnection gracefully

## Definition of Done

- [ ] `mosquitto/mosquitto.conf` exists with proper configuration
- [ ] `simulator/src/index.ts` publishes telemetry for 6 plants every 10 seconds
- [ ] `simulator/package.json` has mqtt and TypeScript dependencies
- [ ] `simulator/tsconfig.json` configured with strict mode
- [ ] `simulator/Dockerfile` builds successfully
- [ ] Docker Compose starts mosquitto and simulator services
- [ ] Running `docker compose logs simulator` shows telemetry being published
- [ ] Can subscribe to `plants/+/telemetry` and receive messages
- [ ] `make typecheck` passes for simulator code
- [ ] Telemetry payloads are valid JSON with all required fields

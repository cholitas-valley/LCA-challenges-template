# Architecture

> 001 — PlantOps

## Overview

IoT plant monitoring: MQTT ingestion → DB → Dashboard + Alerts

## Components

| Component | Purpose |
|-----------|---------|
| MQTT Broker (Mosquitto) | Message bus for sensor telemetry |
| Simulator | Publishes plant telemetry (6 plants) |
| Backend | MQTT subscriber + REST API |
| Database (PostgreSQL + TimescaleDB) | Time-series storage |
| Worker | Threshold evaluation + Discord alerts |
| Frontend | Dashboard with plant cards + history charts |

## Data Flow

```
Simulator → MQTT → Backend → Database
                               ↓
                        Worker → Discord
                               ↓
                        Frontend (polls API)
```

## Configuration

See `.env.example`

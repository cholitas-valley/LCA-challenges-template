# PlantOps - IoT Plant Monitoring System

An IoT platform for monitoring plant health with real-time sensor data, automated alerts, and AI-powered care recommendations.

## Quick Start

```bash
# Start all services (migrations run automatically)
make up

# Open the app
open http://localhost:5173
```

## Services

| Service | URL | Description |
|---------|-----|-------------|
| Frontend | http://localhost:5173 | React dashboard |
| Backend API | http://localhost:8000 | FastAPI REST API |
| MQTT Broker | localhost:1883 | Mosquitto for device telemetry |
| Database | localhost:5432 | TimescaleDB (PostgreSQL) |

## Features

### Feature 1: Core Platform
- Device registration with auto-provisioned MQTT credentials
- Plant management with configurable thresholds
- Real-time telemetry ingestion and storage
- Dashboard with live charts
- Threshold alerts with Discord notifications
- Device offline detection

See: [docs/feature-1-core-platform.md](docs/feature-1-core-platform.md)

### Feature 2: LLM Care Advisor
- AI-powered care plan generation
- Anthropic Claude and OpenAI GPT support
- Encrypted API key storage
- Per-plant care recommendations

See: [docs/feature-2-llm-care-advisor.md](docs/feature-2-llm-care-advisor.md)

## Testing with Sample Data

### Quick Start (Recommended)

```bash
# 1. Start all services
make up

# 2. Seed with test data (creates 3 plants, 3 devices, sends telemetry)
make seed

# 3. Open the dashboard
open http://localhost:5173
```

The seed script automatically:
- Creates 3 sample plants (Monstera, Snake Plant, Pothos)
- Registers 3 IoT devices with MQTT credentials
- Assigns each device to a plant
- Sends 5 telemetry readings per device
- Restarts Mosquitto to load credentials

### Continuous Simulation

To keep sending telemetry data:

```bash
# Run simulator (new device, continuous readings every 10s)
make simulate

# Or with custom interval
python3 scripts/simulator.py --interval 5
```

### Manual Testing

```bash
# Register a device manually
curl -X POST http://localhost:8000/api/devices/register \
  -H "Content-Type: application/json" \
  -d '{"mac_address": "aa:bb:cc:dd:ee:ff"}'

# Create a plant
curl -X POST http://localhost:8000/api/plants \
  -H "Content-Type: application/json" \
  -d '{"name": "My Plant", "species": "Test species"}'

# Assign device to plant
curl -X POST http://localhost:8000/api/devices/{device_id}/provision \
  -H "Content-Type: application/json" \
  -d '{"plant_id": "{plant_id}"}'
```

## Environment Variables

Create a `.env` file (optional):

```bash
# Discord webhook for alerts
DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/...

# Encryption key for LLM API keys (generate with: python3 -c 'from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())')
ENCRYPTION_KEY=your-fernet-key-here
```

## Development

```bash
# View logs
make logs

# Stop services
make down

# Run tests
make check

# Backend tests only
cd backend && python3 -m pytest tests/ -v

# Frontend build
cd frontend && npm run build
```

## Architecture

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Devices   │────▶│  Mosquitto  │────▶│   Backend   │
│   (MQTT)    │     │   Broker    │     │  (FastAPI)  │
└─────────────┘     └─────────────┘     └──────┬──────┘
                                               │
                    ┌─────────────┐     ┌──────▼──────┐
                    │  Frontend   │◀────│ TimescaleDB │
                    │   (React)   │     │ (PostgreSQL)│
                    └─────────────┘     └─────────────┘
```

## API Documentation

- Health: `GET /api/health`
- Devices: `GET/POST /api/devices`
- Plants: `GET/POST/PUT/DELETE /api/plants`
- Telemetry: `GET /api/plants/{id}/history`
- LLM Settings: `GET/PUT /api/settings/llm`
- Care Plans: `POST /api/plants/{id}/analyze`

## License

MIT

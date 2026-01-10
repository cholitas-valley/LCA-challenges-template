# PlantOps

IoT plant monitoring system with AI care advisor.

**Status:** Production-ready (139 tests passing, all features complete)

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

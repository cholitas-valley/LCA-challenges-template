# Recorder: task-009

## Changes Summary

Implemented MQTT subscriber service for receiving device telemetry and heartbeat messages. Integrated with FastAPI lifespan.

## Key Files

- `backend/src/services/mqtt_subscriber.py`: MQTTSubscriber class with connect, subscribe, handlers
- `backend/src/config.py`: Added mqtt_backend_username/password settings
- `backend/src/main.py`: Integrated MQTT in lifespan (connect on startup, disconnect on shutdown)
- `backend/tests/test_mqtt_subscriber.py`: Unit tests for parsing and handlers

## Interfaces for Next Task

### MQTTSubscriber
```python
from src.services.mqtt_subscriber import MQTTSubscriber, parse_device_id

subscriber = MQTTSubscriber(host, port, username, password)
await subscriber.connect()
subscriber.register_handler("devices/+/telemetry", handler)
await subscriber.start()  # Background task
await subscriber.disconnect()
```

### Topic Patterns
- `devices/+/telemetry` - Sensor readings
- `devices/+/heartbeat` - Device alive signals
- `parse_device_id(topic)` extracts device_id

### Configuration
- `settings.mqtt_backend_username` = "plantops_backend"
- `settings.mqtt_backend_password` from environment

## Notes

- Uses aiomqtt library
- Auto-reconnection with exponential backoff (1s to 60s)
- Handler errors isolated - won't crash listener
- Placeholder handlers in main.py (task-010 implements logic)

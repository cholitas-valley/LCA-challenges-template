---
task_id: task-009
title: MQTT subscriber service
role: lca-backend
follow_roles: []
post:
  - lca-recorder
  - lca-gitops
depends_on:
  - task-006
inputs:
  - objective.md
  - runs/plan.md
  - runs/handoffs/task-006.md
allowed_paths:
  - backend/**
check_command: cd backend && python -c "from src.services.mqtt_subscriber import MQTTSubscriber; print('MQTT subscriber OK')"
handoff: runs/handoffs/task-009.md
---

# Task 009: MQTT Subscriber Service

## Goal

Implement the MQTT subscriber that connects to Mosquitto and listens for device telemetry and heartbeat messages. This is the entry point for all sensor data.

## Requirements

### MQTT Subscriber Service (backend/src/services/mqtt_subscriber.py)

```python
class MQTTSubscriber:
    def __init__(self, host: str, port: int, username: str, password: str):
        self.host = host
        self.port = port
        self.username = username
        self.password = password
        self.client: aiomqtt.Client | None = None
        self.handlers: dict[str, Callable] = {}
    
    async def connect(self) -> None:
        """Connect to MQTT broker with credentials."""
        
    async def disconnect(self) -> None:
        """Disconnect from MQTT broker."""
        
    async def subscribe(self, topic: str, handler: Callable) -> None:
        """Subscribe to topic with handler callback."""
        
    async def start(self) -> None:
        """Start listening for messages in background."""
        
    def register_handler(self, topic_pattern: str, handler: Callable) -> None:
        """Register handler for topic pattern."""
```

### Topic Patterns

Subscribe to:
- `devices/+/telemetry` - Sensor readings from devices
- `devices/+/heartbeat` - Device alive signals

Message handlers extract device_id from topic:
```python
# Topic: devices/abc123/telemetry -> device_id = "abc123"
def parse_device_id(topic: str) -> str:
    parts = topic.split('/')
    return parts[1]  # devices/{device_id}/telemetry
```

### Backend Credentials

Create a "backend" MQTT user for the subscriber:
- Username: `plantops_backend`
- Password: from environment variable `MQTT_BACKEND_PASSWORD`
- Add to password file on startup if not exists

Add to Settings:
```python
mqtt_backend_username: str = "plantops_backend"
mqtt_backend_password: str
```

### Integration with FastAPI

In main.py lifespan:
```python
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    mqtt = MQTTSubscriber(...)
    await mqtt.connect()
    mqtt.register_handler("devices/+/telemetry", handle_telemetry)
    mqtt.register_handler("devices/+/heartbeat", handle_heartbeat)
    asyncio.create_task(mqtt.start())
    
    yield
    
    # Shutdown
    await mqtt.disconnect()
```

### Tests (backend/tests/test_mqtt_subscriber.py)

Test cases:
- MQTTSubscriber can be instantiated
- Topic pattern parsing extracts device_id
- Handler registration works
- (No actual connection tests - requires running broker)

## Definition of Done

- [ ] MQTTSubscriber class exists with all methods
- [ ] Backend MQTT credentials configured
- [ ] Topic pattern matching works for device_id extraction
- [ ] Handler registration and dispatch implemented
- [ ] Integration with FastAPI lifespan
- [ ] Module imports without errors

## Constraints

- Use aiomqtt (async MQTT client)
- Do NOT process telemetry data yet (that is task-010)
- Do NOT test actual MQTT connections
- Handle reconnection gracefully (exponential backoff)

## Dependencies

Add to pyproject.toml:
- `aiomqtt>=2.0.0`

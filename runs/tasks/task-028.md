---
task_id: task-028
title: Backend TLS Connection Support
role: lca-backend
follow_roles: []
post:
  - lca-recorder
  - code-simplifier
  - lca-gitops
depends_on:
  - task-027
inputs:
  - objective.md
  - runs/plan.md
  - runs/handoffs/task-027.md
allowed_paths:
  - backend/**
  - docker-compose.yml
check_command: make check
handoff: runs/handoffs/task-028.md
---

# Task 028: Backend TLS Connection Support

## Goal

Update the backend MQTT subscriber to support TLS connections when configured, while maintaining backward compatibility with plain TCP for development.

## Requirements

### Configuration Updates

Update `backend/src/config.py`:

```python
class Settings(BaseSettings):
    # ... existing settings ...
    
    # MQTT TLS settings
    mqtt_use_tls: bool = False  # Enable TLS connection
    mqtt_tls_port: int = 8883   # TLS port
    mqtt_ca_cert: str | None = None  # Path to CA certificate
```

### MQTT Subscriber TLS Support

Update `backend/src/services/mqtt_subscriber.py`:

```python
import ssl

class MQTTSubscriber:
    def __init__(
        self,
        host: str,
        port: int,
        username: str,
        password: str,
        use_tls: bool = False,
        ca_cert: str | None = None,
    ):
        self.host = host
        self.port = port
        self.username = username
        self.password = password
        self.use_tls = use_tls
        self.ca_cert = ca_cert
        # ... rest of init
    
    async def connect(self) -> None:
        """Connect to MQTT broker with optional TLS."""
        tls_context = None
        if self.use_tls:
            tls_context = ssl.create_default_context(ssl.Purpose.SERVER_AUTH)
            if self.ca_cert:
                tls_context.load_verify_locations(self.ca_cert)
            logger.info(f"Connecting to MQTT broker with TLS at {self.host}:{self.port}")
        else:
            logger.info(f"Connecting to MQTT broker at {self.host}:{self.port}")
        
        self.client = aiomqtt.Client(
            hostname=self.host,
            port=self.port,
            username=self.username,
            password=self.password,
            tls_context=tls_context,
        )
        # ... rest of connect
```

### Main Application Update

Update `backend/src/main.py` to pass TLS settings:

```python
mqtt = MQTTSubscriber(
    host=settings.mqtt_host,
    port=settings.mqtt_tls_port if settings.mqtt_use_tls else settings.mqtt_port,
    username=settings.mqtt_backend_username,
    password=settings.mqtt_backend_password,
    use_tls=settings.mqtt_use_tls,
    ca_cert=settings.mqtt_ca_cert,
)
```

### Docker Compose Update

Update `docker-compose.yml` backend service for TLS support:

```yaml
backend:
  environment:
    # ... existing env vars ...
    MQTT_USE_TLS: ${MQTT_USE_TLS:-false}
    MQTT_TLS_PORT: ${MQTT_TLS_PORT:-8883}
    MQTT_CA_CERT: ${MQTT_CA_CERT:-}
  volumes:
    # ... existing volumes ...
    - ./certs/ca.crt:/app/certs/ca.crt:ro  # Mount CA cert for TLS
```

### Test Updates

Add tests for TLS configuration in `backend/tests/test_mqtt_subscriber.py`:

```python
def test_mqtt_subscriber_tls_config():
    """Test MQTT subscriber accepts TLS configuration."""
    subscriber = MQTTSubscriber(
        host="localhost",
        port=8883,
        username="test",
        password="test",
        use_tls=True,
        ca_cert="/path/to/ca.crt",
    )
    assert subscriber.use_tls is True
    assert subscriber.ca_cert == "/path/to/ca.crt"
    assert subscriber.port == 8883

def test_mqtt_subscriber_default_no_tls():
    """Test MQTT subscriber defaults to no TLS."""
    subscriber = MQTTSubscriber(
        host="localhost",
        port=1883,
        username="test",
        password="test",
    )
    assert subscriber.use_tls is False
    assert subscriber.ca_cert is None
```

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `MQTT_USE_TLS` | `false` | Enable TLS for MQTT connection |
| `MQTT_TLS_PORT` | `8883` | MQTT TLS port |
| `MQTT_CA_CERT` | (none) | Path to CA certificate file |

## Constraints

- Maintain backward compatibility (default to plain TCP)
- Do not break existing tests
- TLS should be optional, not required
- Error clearly if TLS enabled but CA cert not found

## Definition of Done

- [ ] `Settings` class has TLS configuration options
- [ ] `MQTTSubscriber` accepts TLS parameters
- [ ] `MQTTSubscriber.connect()` creates TLS context when enabled
- [ ] Main app passes TLS settings to subscriber
- [ ] Docker compose mounts CA cert for backend
- [ ] New tests for TLS configuration added
- [ ] All existing tests still pass (`make check`)

## Notes

The reconnection logic in `_listen_loop` should preserve TLS settings when reconnecting. The existing exponential backoff mechanism should continue to work.

To test TLS locally:
1. Generate certificates: `make certs`
2. Start services: `make up`
3. Set `MQTT_USE_TLS=true` and `MQTT_CA_CERT=/app/certs/ca.crt`
4. Backend should connect via TLS on port 8883

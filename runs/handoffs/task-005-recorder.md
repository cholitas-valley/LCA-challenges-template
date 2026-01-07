# Recorder: task-005

## Changes Summary

Implemented MQTT authentication service for generating device credentials and managing Mosquitto password file. Integrated with device registration flow.

## Key Files

- `backend/src/services/mqtt_auth.py`: MQTTAuthService with generate_credentials, add_user, remove_user, reload_mosquitto
- `backend/src/services/__init__.py`: Service package init
- `backend/src/config.py`: Added mqtt_passwd_file setting
- `backend/src/routers/devices.py`: Integrated MQTT auth on register/delete
- `backend/tests/test_mqtt_auth.py`: 9 unit tests

## Interfaces for Next Task

### MQTTAuthService
```python
from src.services.mqtt_auth import MQTTAuthService
from src.config import settings

mqtt_service = MQTTAuthService(settings.mqtt_passwd_file)
username, password = mqtt_service.generate_credentials()
mqtt_service.add_user(username, password)
mqtt_service.remove_user(username)
mqtt_service.reload_mosquitto()
```

### Configuration
```python
settings.mqtt_passwd_file  # Default: /mosquitto/passwd
```

### Integration Points
- Device registration automatically creates MQTT user
- Device deletion automatically removes MQTT user
- Password file at /mosquitto/passwd (configurable)

## Notes

- Uses mosquitto_passwd for Mosquitto-compatible PBKDF2-SHA512 hashing
- File created with 0o600 permissions
- Error handling is non-blocking (service continues if MQTT ops fail)
- reload_mosquitto sends SIGHUP to mosquitto container
- Integration tested via mocked calls in device tests

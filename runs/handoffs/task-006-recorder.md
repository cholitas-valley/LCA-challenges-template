# Recorder: task-006

## Changes Summary

Configured Mosquitto broker to require authentication. Integrated password file path between backend and Mosquitto container via shared volume.

## Key Files

- `mosquitto/mosquitto.conf`: Authentication directives (allow_anonymous false, password_file)
- `docker-compose.yml`: Volume mounts for passwd file, MQTT_PASSWD_FILE env var
- `backend/src/services/mqtt_auth.py`: Updated reload docs

## Interfaces for Next Task

### Mosquitto Configuration
- Authentication required (allow_anonymous false)
- Password file at /mosquitto/config/passwd (Mosquitto) = ./mosquitto/passwd (host)
- Ports: 1883 (MQTT), 9001 (WebSockets)

### Backend Integration
- MQTT_PASSWD_FILE environment variable available
- Backend writes to /mosquitto/passwd in container
- Mosquitto reads from /mosquitto/config/passwd
- Auto-reload on Mosquitto 2.0+ when file changes

### Docker Services
```bash
make up  # Start all services including Mosquitto with auth
```

## Notes

- Mosquitto config is read-only mount for security
- Password file is shared volume for backend writes
- SIGHUP reload may be needed for older Mosquitto versions
- Ready for actual MQTT connection testing in next tasks

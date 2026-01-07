---
task_id: task-006
title: Mosquitto authentication integration
role: lca-backend
follow_roles: []
post:
  - lca-recorder
  - lca-gitops
depends_on:
  - task-005
inputs:
  - objective.md
  - runs/plan.md
  - runs/handoffs/task-005.md
allowed_paths:
  - backend/**
  - mosquitto/**
  - docker-compose.yml
check_command: docker compose config --quiet && cat mosquitto/mosquitto.conf | grep -q "password_file"
handoff: runs/handoffs/task-006.md
---

# Task 006: Mosquitto Authentication Integration

## Goal

Configure Mosquitto to require authentication and integrate with the backend password file. This ensures only registered devices can connect to the MQTT broker.

## Requirements

### Mosquitto Configuration (mosquitto/mosquitto.conf)

Update configuration:
```
# Listener
listener 1883
listener 9001
protocol websockets

# Authentication
allow_anonymous false
password_file /mosquitto/config/passwd

# Logging
log_dest stdout
log_type all

# ACL (optional, can add later)
# acl_file /mosquitto/config/acl
```

### Docker Compose Updates

Update `docker-compose.yml` mosquitto service:
```yaml
mosquitto:
  image: eclipse-mosquitto:2
  ports:
    - "1883:1883"
    - "9001:9001"
  volumes:
    - ./mosquitto/mosquitto.conf:/mosquitto/config/mosquitto.conf:ro
    - ./mosquitto/passwd:/mosquitto/config/passwd
  restart: unless-stopped
```

Ensure backend can write to mosquitto/passwd:
- Volume mount must allow backend to update password file
- Backend writes to local ./mosquitto/passwd
- Mosquitto reads from /mosquitto/config/passwd (same file)

### Backend Integration

Update MQTTAuthService to:
1. Write to correct password file path (./mosquitto/passwd or configured path)
2. Implement `reload_mosquitto()` to signal Mosquitto:
   - Option A: Use Docker exec to send SIGHUP
   - Option B: Restart mosquitto container
   - Option C: Mosquitto auto-reloads on file change (newer versions)

### Simulator Prep (optional)

Create placeholder for simulator that will:
1. Call device registration API
2. Use returned credentials to connect to MQTT
3. Publish telemetry

### Tests

Update integration:
- Test that mosquitto.conf has required directives
- Test that docker-compose.yml has correct volume mounts
- No actual MQTT connection tests yet (requires running services)

## Definition of Done

- [ ] mosquitto/mosquitto.conf has `allow_anonymous false`
- [ ] mosquitto/mosquitto.conf has `password_file` directive
- [ ] docker-compose.yml mounts passwd file correctly
- [ ] Backend MQTTAuthService writes to correct path
- [ ] Password file permissions allow both backend write and mosquitto read
- [ ] `docker compose config` validates successfully

## Constraints

- Do NOT start services to test actual connections
- Keep ACL simple (no topic restrictions yet)
- Ensure password file path is consistent between backend and mosquitto
- Handle case where passwd file doesn't exist (create empty)

## Notes

For Mosquitto reload options:
- SIGHUP: `docker exec plantops-mosquitto-1 kill -HUP 1`
- Mosquitto 2.0+ supports dynamic reload on password file change
- For simplicity, can skip reload and rely on container restart initially

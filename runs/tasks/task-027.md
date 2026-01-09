---
task_id: task-027
title: Mosquitto TLS Configuration
role: lca-backend
follow_roles: []
post:
  - lca-recorder
  - code-simplifier
  - lca-gitops
depends_on:
  - task-026
inputs:
  - objective.md
  - runs/plan.md
  - runs/handoffs/task-026.md
allowed_paths:
  - mosquitto/**
  - docker-compose.yml
  - docker-compose.prod.yml
check_command: make check
handoff: runs/handoffs/task-027.md
---

# Task 027: Mosquitto TLS Configuration

## Goal

Configure Mosquitto MQTT broker to accept TLS connections on port 8883 while maintaining plain TCP on port 1883 for local development.

## Requirements

### Mosquitto Configuration Update

Update `mosquitto/mosquitto.conf`:

```conf
# Plain TCP listener (development)
listener 1883
protocol mqtt

# TLS listener (production)
listener 8883
protocol mqtt
cafile /mosquitto/certs/ca.crt
certfile /mosquitto/certs/server.crt
keyfile /mosquitto/certs/server.key
require_certificate false  # Clients verify server, server doesn't require client certs

# WebSocket listener (optional, keep for frontend dev)
listener 9001
protocol websockets

# Authentication
allow_anonymous false
password_file /mosquitto/config/passwd

# Logging
log_dest stdout
log_type all

# Persistence
persistence true
persistence_location /mosquitto/data/
```

### Docker Compose Update (Development)

Update `docker-compose.yml` mosquitto service:

```yaml
mosquitto:
  image: eclipse-mosquitto:2
  container_name: plantops-mosquitto
  ports:
    - "1883:1883"   # Plain TCP (dev)
    - "8883:8883"   # TLS
    - "9001:9001"   # WebSocket
  volumes:
    - ./mosquitto/mosquitto.conf:/mosquitto/config/mosquitto.conf:ro
    - ./mosquitto/passwd:/mosquitto/config/passwd
    - ./certs/ca.crt:/mosquitto/certs/ca.crt:ro
    - ./certs/server.crt:/mosquitto/certs/server.crt:ro
    - ./certs/server.key:/mosquitto/certs/server.key:ro
    - mosquitto_data:/mosquitto/data
    - mosquitto_log:/mosquitto/log
  restart: unless-stopped
```

### Docker Compose Production (Stub)

Create `docker-compose.prod.yml` with TLS-only configuration (full implementation in task-032):

```yaml
# Production override - TLS only
services:
  mosquitto:
    ports:
      - "8883:8883"   # TLS only in production
    # Port 1883 not exposed
```

### Verification Script

Create `scripts/test_mqtt_tls.sh`:

```bash
#!/bin/bash
# Test MQTT TLS connection

# Test plain TCP (should work)
mosquitto_pub -h localhost -p 1883 -u plantops_backend -P "$MQTT_BACKEND_PASSWORD" \
  -t "test/hello" -m "plain tcp test" && echo "Plain TCP: OK" || echo "Plain TCP: FAILED"

# Test TLS (should work)
mosquitto_pub -h localhost -p 8883 -u plantops_backend -P "$MQTT_BACKEND_PASSWORD" \
  --cafile certs/ca.crt \
  -t "test/hello" -m "tls test" && echo "TLS: OK" || echo "TLS: FAILED"
```

## Constraints

- Do not modify backend Python code yet (task-028)
- Keep port 1883 available for development
- Mosquitto must start successfully with both listeners
- Password file authentication must still work

## Definition of Done

- [ ] `mosquitto/mosquitto.conf` has TLS listener on port 8883
- [ ] Docker compose mounts certificate files to Mosquitto container
- [ ] Mosquitto container starts without errors
- [ ] Plain TCP connection on port 1883 still works
- [ ] TLS connection on port 8883 works (verified with mosquitto_pub)
- [ ] `docker-compose.prod.yml` stub created
- [ ] Existing tests still pass (`make check`)

## Notes

The backend will be updated in task-028 to support TLS connections. For now, the backend continues to use plain TCP on port 1883, while Mosquitto is prepared to accept TLS connections.

Client certificate authentication (mutual TLS) is not required for this implementation. The ESP32 will verify the server certificate using the CA certificate but will not present its own certificate.

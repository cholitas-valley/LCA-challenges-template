# PlantOps Deployment Guide

## Overview

This guide covers deploying PlantOps for home production use with:
- TLS-secured MQTT connections
- Docker containerization
- Real ESP32 sensor hardware
- Production-grade security and monitoring

**System Status:** Production-ready as of Feature 3 QA (139 tests passing, all DoD items verified)

## Prerequisites

- Docker 20.10+ and Docker Compose 2.0+
- Linux server (Raspberry Pi, Ubuntu, NAS, etc.)
- ESP32 development board with sensors (optional, for hardware deployment)
- Home network with static IP or DHCP reservation
- 2GB RAM minimum, 4GB recommended
- 10GB disk space minimum

## Quick Start

### 1. Clone Repository

```bash
git clone https://github.com/your-org/plantops.git
cd plantops
```

### 2. Generate TLS Certificates

```bash
make certs
```

This creates self-signed certificates in `certs/` directory:
- `ca.crt` - Certificate Authority (share with ESP32)
- `ca.key` - CA private key (keep secure)
- `server.crt` - Mosquitto server certificate
- `server.key` - Server private key

**Certificate validity:** 10 years (suitable for home use)

### 3. Configure Environment

```bash
cp .env.prod.example .env.prod
# Edit .env.prod with secure passwords
```

Generate secure passwords:
```bash
# Database password
openssl rand -base64 32

# MQTT password
openssl rand -base64 32

# Encryption key (64-char hex)
openssl rand -hex 32
```

### 4. Start Services

```bash
make prod-up
```

Or manually:
```bash
docker compose -f docker-compose.prod.yml up -d --build
```

### 5. Verify Deployment

```bash
# Check API health
curl http://localhost:8000/api/health

# Check frontend
curl http://localhost:80

# View logs
make prod-logs
```

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `POSTGRES_USER` | Yes | Database username |
| `POSTGRES_PASSWORD` | Yes | Database password |
| `POSTGRES_DB` | Yes | Database name |
| `MQTT_BACKEND_PASSWORD` | Yes | MQTT password for backend |
| `ENCRYPTION_KEY` | Yes | 64-char hex string for API key encryption |
| `DISCORD_WEBHOOK_URL` | No | Discord webhook for alerts |
| `LOG_LEVEL` | No | INFO, DEBUG, WARNING, ERROR |

**Example .env.prod:**
```bash
# Database
POSTGRES_USER=plantops
POSTGRES_PASSWORD=<generate-with-openssl-rand>
POSTGRES_DB=plantops

# MQTT
MQTT_BACKEND_PASSWORD=<generate-with-openssl-rand>

# Security
ENCRYPTION_KEY=<generate-with-openssl-rand-hex-32>

# Optional
DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/...
LOG_LEVEL=INFO
LOG_FORMAT=json
```

## Resource Limits

| Service | Memory | CPU |
|---------|--------|-----|
| Database | 512MB | 0.5 |
| Mosquitto | 128MB | 0.25 |
| Backend | 512MB | 1.0 |
| Frontend | 128MB | 0.25 |

These limits are suitable for a home server environment (total: ~1.3GB RAM, ~2 CPU cores). Adjust based on your hardware and load requirements.

## Detailed Setup

### TLS Certificates

The production stack requires TLS certificates for secure MQTT communication.

**Certificate structure:**
| File | Purpose | Location |
|------|---------|----------|
| `certs/ca.crt` | Certificate Authority | Share with ESP32 devices |
| `certs/ca.key` | CA private key | Keep secure, do not share |
| `certs/server.crt` | Mosquitto server certificate | Used by broker |
| `certs/server.key` | Server private key | Keep secure |

**Generate certificates:**
```bash
make certs
```

**Regenerate certificates (force):**
```bash
make certs-force
```

**Certificate validity:** 10 years from generation date

**Distribute CA certificate to ESP32:**
The `certs/ca.crt` file must be embedded in ESP32 firmware. Copy its contents to `firmware/include/ca_cert.h` before building firmware.

### Network Configuration

**Required ports:**
| Port | Service | Protocol | Exposure |
|------|---------|----------|----------|
| 80 | Frontend | HTTP | Public |
| 8000 | Backend API | HTTP | Public |
| 8883 | MQTT (TLS) | MQTT/TLS | Device access |
| 5432 | Database | PostgreSQL | Internal only |
| 1883 | MQTT (plain) | MQTT | Internal only |

**Firewall configuration (UFW example):**
```bash
sudo ufw allow 80/tcp
sudo ufw allow 8000/tcp
sudo ufw allow 8883/tcp
sudo ufw enable
```

**Internal network:**
Docker containers communicate via internal network:
- Frontend → Backend (http://backend:8000)
- Backend → Database (host: db, port: 5432)
- Backend → Mosquitto (host: mosquitto, port: 1883 internal, 8883 TLS external)

### Docker Services

Production stack includes 4 services:

| Service | Image | Purpose |
|---------|-------|---------|
| **db** | timescale/timescaledb:latest-pg15 | Time-series database |
| **mosquitto** | eclipse-mosquitto:2 | MQTT broker with TLS |
| **backend** | plantops-backend | FastAPI application |
| **frontend** | plantops-frontend | React dashboard (nginx) |

**Service dependencies:**
- Backend waits for db and mosquitto to be healthy
- Frontend is independent (can start immediately)

## Health Checks

All services have health checks configured:
- Database: `pg_isready`
- Mosquitto: MQTT subscription test
- Backend: `/api/ready` endpoint
- Frontend: HTTP response

To check health status:
```bash
docker compose -f docker-compose.prod.yml ps
```

Services will show as "healthy" when all checks pass.

## Security

### TLS Configuration

The production stack uses TLS for MQTT communication:
- Port 8883 exposed for secure MQTT
- Port 1883 (plain MQTT) NOT exposed to host
- Devices must connect using TLS

Certificate files required:
- `certs/ca.crt` - Certificate Authority
- `certs/server.crt` - Server certificate
- `certs/server.key` - Server private key

### Non-root User

The backend runs as a non-root user (`plantops` UID 1000) for improved security.

### No Source Code Mounts

Production containers do not mount source code directories. All code is copied during build, preventing accidental modifications.

## Operations

### Management Commands

Start production stack:
```bash
make prod-up
```

Stop production stack:
```bash
make prod-down
```

View logs:
```bash
# All services
make prod-logs

# Specific service
docker compose -f docker-compose.prod.yml logs -f backend
docker compose -f docker-compose.prod.yml logs -f mosquitto
```

Build images:
```bash
make prod-build
```

Restart services:
```bash
# All services
make prod-restart

# Specific service
docker compose -f docker-compose.prod.yml restart backend
```

Check service status:
```bash
docker compose -f docker-compose.prod.yml ps
```

**Resource monitoring:**
```bash
# Real-time resource usage
docker stats

# Disk usage
docker system df
```

### Updating

**Update process:**
```bash
# 1. Pull latest code
git pull origin main

# 2. Rebuild and restart
make prod-build
make prod-restart
```

Or in one command:
```bash
docker compose -f docker-compose.prod.yml up -d --build
```

The system will perform a rolling restart. Database migrations run automatically on backend startup.

**Zero-downtime updates:**
For mission-critical deployments, update backend separately:
```bash
# 1. Build new image
docker compose -f docker-compose.prod.yml build backend

# 2. Scale to 2 instances
docker compose -f docker-compose.prod.yml up -d --scale backend=2

# 3. Stop old instance (after health checks pass)
docker compose -f docker-compose.prod.yml stop backend_1

# 4. Scale back to 1
docker compose -f docker-compose.prod.yml up -d --scale backend=1
```

### Backup and Restore

**Create database backup:**
```bash
# Create backup directory
mkdir -p backups

# Backup with timestamp
docker exec plantops-db pg_dump -U plantops plantops > backups/backup_$(date +%Y%m%d_%H%M%S).sql

# Compressed backup
docker exec plantops-db pg_dump -U plantops plantops | gzip > backups/backup_$(date +%Y%m%d).sql.gz
```

**Restore from backup:**
```bash
# From SQL file
cat backups/backup.sql | docker exec -i plantops-db psql -U plantops plantops

# From compressed file
gunzip -c backups/backup.sql.gz | docker exec -i plantops-db psql -U plantops plantops
```

**Automated backups (cron):**
```bash
# Edit crontab
crontab -e

# Add daily backup at 2 AM
0 2 * * * cd /path/to/plantops && docker exec plantops-db pg_dump -U plantops plantops | gzip > backups/backup_$(date +\%Y\%m\%d).sql.gz

# Weekly cleanup (keep last 30 days)
0 3 * * 0 find /path/to/plantops/backups -name "backup_*.sql.gz" -mtime +30 -delete
```

**Backup MQTT credentials:**
```bash
cp mosquitto/passwd mosquitto/passwd.backup
```

**Full system backup:**
```bash
# Backup configuration and certificates
tar -czf plantops-config-$(date +%Y%m%d).tar.gz \
  .env.prod \
  certs/ \
  mosquitto/passwd \
  docker-compose.prod.yml
```

## Monitoring

### Log Format

Production logs use JSON format for easy parsing by log aggregation tools:
```json
{"event": "telemetry_stored", "device_id": "dev-001", "plant_id": "plant-123", "timestamp": "2026-01-10T12:00:00Z", "level": "info"}
```

### Correlation IDs

All requests include a correlation ID (`X-Correlation-ID`) for tracing across services. Include this ID in bug reports.

### Health Endpoints

- `/api/health` - Detailed component status
- `/api/ready` - Readiness probe (returns 503 if not ready)

Example health check:
```bash
curl http://localhost:8000/api/health | jq
```

## Troubleshooting

### Services won't start

Check logs:
```bash
docker compose -f docker-compose.prod.yml logs
```

Common issues:
- Missing environment variables in `.env.prod`
- Certificates not generated
- Port conflicts (8000, 80, 8883 already in use)

### Database connection errors

Verify database is healthy:
```bash
docker compose -f docker-compose.prod.yml ps db
```

Connect to database:
```bash
docker exec -it plantops-db psql -U plantops
```

### MQTT connection errors

Test MQTT connectivity:
```bash
mosquitto_sub -h localhost -p 8883 --cafile certs/ca.crt -t '#' -v
```

Verify backend has correct password:
```bash
docker compose -f docker-compose.prod.yml logs backend | grep -i mqtt
```

### High memory usage

Check resource limits are being enforced:
```bash
docker stats
```

Adjust limits in `docker-compose.prod.yml` if needed.

## Production Checklist

Before deploying to production:

- [ ] Generated TLS certificates
- [ ] Created `.env.prod` with secure passwords
- [ ] Changed default database password
- [ ] Set ENCRYPTION_KEY for API key storage
- [ ] Configured Discord webhook (optional)
- [ ] Set appropriate LOG_LEVEL (INFO or WARNING)
- [ ] Tested backup/restore procedure
- [ ] Set up automated backups
- [ ] Verified health checks working
- [ ] Tested device connectivity via TLS
- [ ] Documented server-specific configuration

## Architecture

```
┌─────────────┐
│  Frontend   │ :80
│   (nginx)   │
└──────┬──────┘
       │
       │ /api/* → proxy
       │
┌──────▼──────┐
│   Backend   │ :8000
│  (FastAPI)  │
└──┬───────┬──┘
   │       │
   │       │ :1883 (internal)
   │       │ :8883 (TLS, external)
   │   ┌───▼────────┐
   │   │ Mosquitto  │
   │   │   (MQTT)   │
   │   └────────────┘
   │
   │ :5432 (internal)
┌──▼──────────┐
│ TimescaleDB │
│ (Postgres)  │
└─────────────┘
```

### Port Mapping

| Service | Internal Port | External Port | Notes |
|---------|---------------|---------------|-------|
| Frontend | 80 | 80 | Public access |
| Backend | 8000 | 8000 | API access |
| Mosquitto | 1883 | - | Internal only |
| Mosquitto TLS | 8883 | 8883 | Device access |
| Database | 5432 | - | Internal only |

## ESP32 Device Deployment

Once the production stack is running, you can deploy physical sensor devices:

1. **Flash firmware** to ESP32 boards:
   ```bash
   cd firmware
   pio run -t upload
   ```

2. **Configure WiFi** via captive portal (first boot)
3. **Devices auto-register** with the backend
4. **Telemetry flows** over MQTT with TLS

For complete firmware setup instructions, see [firmware.md](firmware.md).

### Device Configuration

Devices connect to:
- **MQTT Broker**: Port 8883 (TLS)
- **Backend API**: Port 8000 (for registration)

Ensure these ports are accessible from your device network.

### Troubleshooting Device Connectivity

**Device can't register:**
- Verify backend is accessible from device network
- Check backend IP in `firmware/include/config.h`
- Review serial output for HTTP errors

**MQTT connection fails:**
- Verify port 8883 is accessible
- Check TLS certificate matches CA cert in firmware
- Review serial output for TLS errors

**Telemetry not appearing:**
- Check `/api/health` shows MQTT connected
- Verify device credentials in Mosquitto passwd file
- Monitor backend logs for telemetry events

## Environment Variables Reference

Complete list of environment variables for production deployment:

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `POSTGRES_USER` | Database username | `plantops` |
| `POSTGRES_PASSWORD` | Database password (use `openssl rand -base64 32`) | `<secure_random>` |
| `POSTGRES_DB` | Database name | `plantops` |
| `MQTT_BACKEND_PASSWORD` | MQTT password for backend service | `<secure_random>` |
| `ENCRYPTION_KEY` | 64-char hex for API key encryption | `<openssl rand -hex 32>` |

### Optional Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DISCORD_WEBHOOK_URL` | Discord webhook for alerts | None |
| `LOG_LEVEL` | Logging verbosity (DEBUG, INFO, WARNING, ERROR) | `INFO` |
| `LOG_FORMAT` | Log format (console, json) | `json` (production) |
| `MQTT_HOST` | MQTT broker hostname | `mosquitto` |
| `MQTT_PORT` | MQTT plaintext port (internal) | `1883` |
| `MQTT_TLS_PORT` | MQTT TLS port (external) | `8883` |
| `MQTT_USE_TLS` | Enable TLS for backend-MQTT connection | `false` (dev), `true` (prod) |

### Internal Variables (Docker Compose)

These are set automatically by docker-compose.prod.yml:
- `DATABASE_URL`: PostgreSQL connection string
- `MQTT_BACKEND_USERNAME`: Always `backend`
- `MQTT_CA_CERT`: Path to CA certificate

## Network Configuration

### Port Reference

| Port | Service | Protocol | Exposure | Purpose |
|------|---------|----------|----------|---------|
| 80 | Frontend | HTTP | Host | Web dashboard access |
| 8000 | Backend API | HTTP | Host | API endpoints |
| 8883 | Mosquitto | MQTT/TLS | Host | Device telemetry (TLS) |
| 1883 | Mosquitto | MQTT | Internal only | Backend subscriber (plaintext) |
| 5432 | Database | PostgreSQL | Internal only | TimescaleDB |

### Firewall Configuration

**UFW (Ubuntu):**
```bash
sudo ufw allow 80/tcp    # Frontend
sudo ufw allow 8000/tcp  # Backend API
sudo ufw allow 8883/tcp  # MQTT TLS
sudo ufw enable
```

**firewalld (CentOS/RHEL):**
```bash
sudo firewall-cmd --permanent --add-port=80/tcp
sudo firewall-cmd --permanent --add-port=8000/tcp
sudo firewall-cmd --permanent --add-port=8883/tcp
sudo firewall-cmd --reload
```

### Reverse Proxy Setup (Optional)

For HTTPS access with automatic certificates, use Caddy:

**Caddyfile:**
```
plantops.yourdomain.com {
    reverse_proxy localhost:80
}

api.plantops.yourdomain.com {
    reverse_proxy localhost:8000
}
```

**Docker Compose addition:**
```yaml
  caddy:
    image: caddy:2-alpine
    ports:
      - "443:443"
      - "80:80"
    volumes:
      - ./Caddyfile:/etc/caddy/Caddyfile
      - caddy_data:/data
      - caddy_config:/config
```

## Logging and Monitoring

### Structured Logging

Production logs use JSON format for machine parsing:

```json
{
  "event": "telemetry_stored",
  "device_id": "dev-001",
  "plant_id": "plant-123",
  "timestamp": "2026-01-10T12:00:00Z",
  "level": "info",
  "correlation_id": "550e8400-e29b-41d4-a716-446655440000"
}
```

### Viewing Logs

```bash
# All services (live tail)
make prod-logs

# Specific service
docker compose -f docker-compose.prod.yml logs -f backend

# Last 100 lines
docker compose -f docker-compose.prod.yml logs --tail=100 backend

# Follow and grep for specific events
docker compose -f docker-compose.prod.yml logs -f backend | grep telemetry_stored

# Export logs to file
docker compose -f docker-compose.prod.yml logs --no-color > logs.txt
```

### Log Aggregation

For production monitoring, consider shipping logs to:

**Loki + Grafana:**
```yaml
  # Add to docker-compose.prod.yml
  loki:
    image: grafana/loki:latest
    ports:
      - "3100:3100"
```

**Update backend logging driver:**
```yaml
  backend:
    logging:
      driver: loki
      options:
        loki-url: "http://loki:3100/loki/api/v1/push"
```

### Metrics (Future Enhancement)

Recommended monitoring stack:
- Prometheus for metrics collection
- Grafana for dashboards
- Node Exporter for system metrics

Key metrics to monitor:
- API request latency (p50, p95, p99)
- MQTT connection status
- Database query performance
- Memory usage per container
- Telemetry message rate

## Known Limitations

Based on Feature 3 QA (task-037):

### TLS Certificates
- Current certificates are self-signed for development/staging
- **Production recommendation:** Use certificates from a trusted CA (Let's Encrypt recommended)
- Self-signed certs are acceptable for home/private deployments
- Certificate validity: 10 years (suitable for home use)

### Frontend Bundle Size
- Current bundle: 623KB (exceeds 500KB warning threshold)
- Performance impact minimal for typical home deployment
- **Future enhancement:** Implement code-splitting to reduce initial load

### MQTT Reconnection Testing
- Backend reconnection: Fully tested with unit tests
- ESP32 reconnection: Code verified, but not integration-tested (requires physical hardware)
- Both implementations follow industry best practices with exponential backoff

### Integration Testing
- Health endpoints tested with mocked connections
- Full end-to-end testing requires running services (`make up`)
- Consider periodic smoke tests in production environment

### Database Backups
- Manual backup instructions provided in this guide
- **Production recommendation:** Automate daily backups with retention policy
- Consider scheduled jobs for unattended operation

## Support

For issues or questions:
1. Check logs with `make prod-logs`
2. Review health endpoints (`/api/health`, `/api/ready`)
3. Check correlation IDs for request tracing
4. Consult troubleshooting section above
5. For firmware issues, see [firmware.md](firmware.md)
6. For API documentation, see [api.md](api.md)

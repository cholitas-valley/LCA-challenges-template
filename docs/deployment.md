# Production Deployment

## Prerequisites

- Docker 20.10+
- Docker Compose 2.0+
- TLS certificates generated (`make certs`)
- Environment file configured

## Quick Start

1. Generate certificates:
   ```bash
   make certs
   ```

2. Create environment file:
   ```bash
   cp .env.prod.example .env.prod
   # Edit .env.prod with secure values
   ```

3. Build and start:
   ```bash
   docker compose -f docker-compose.prod.yml up -d --build
   ```

4. Check health:
   ```bash
   curl http://localhost:8000/api/health
   curl http://localhost:80
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

### Generating Secure Values

Generate database password:
```bash
openssl rand -base64 32
```

Generate MQTT password:
```bash
openssl rand -base64 32
```

Generate encryption key:
```bash
openssl rand -hex 32
```

## Resource Limits

| Service | Memory | CPU |
|---------|--------|-----|
| Database | 512MB | 0.5 |
| Mosquitto | 128MB | 0.25 |
| Backend | 512MB | 1.0 |
| Frontend | 128MB | 0.25 |

These limits are suitable for a home server environment. Adjust based on your hardware and load requirements.

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

## Management Commands

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
make prod-logs
```

Build images:
```bash
make prod-build
```

Restart services:
```bash
make prod-restart
```

## Updating

1. Pull latest code:
   ```bash
   git pull origin main
   ```

2. Rebuild and restart:
   ```bash
   docker compose -f docker-compose.prod.yml up -d --build
   ```

The system will perform a rolling restart. Database migrations run automatically on backend startup.

## Backup

### Database Backups

Create backup:
```bash
docker exec plantops-db pg_dump -U plantops plantops > backup_$(date +%Y%m%d_%H%M%S).sql
```

Restore from backup:
```bash
cat backup.sql | docker exec -i plantops-db psql -U plantops plantops
```

### Automated Backups

Set up a cron job for automatic backups:
```bash
# Daily backups at 2 AM
0 2 * * * cd /path/to/plantops && docker exec plantops-db pg_dump -U plantops plantops | gzip > backups/backup_$(date +\%Y\%m\%d).sql.gz
```

### MQTT Credentials

Backup the password file:
```bash
cp mosquitto/passwd mosquitto/passwd.backup
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

## Support

For issues or questions:
1. Check logs with `make prod-logs`
2. Review health endpoints
3. Check correlation IDs for request tracing
4. Consult troubleshooting section above

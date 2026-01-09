# Task 032 Handoff: Docker Production Configuration

## Summary

Successfully created production-ready Docker configuration with all required services, resource limits, health checks, and comprehensive deployment documentation. The production stack is optimized for a home server environment with security best practices including TLS-only MQTT, non-root user execution, JSON logging, and no source code bind mounts.

## Files Touched

### Created Files

1. **docker-compose.prod.yml** - Production Docker Compose configuration
   - All 4 services: db, mosquitto, backend, frontend
   - Resource limits on all services (memory and CPU)
   - Health checks on all services
   - TLS-only MQTT on port 8883
   - JSON logging for backend
   - No source code bind mounts
   - Proper service dependencies with health check conditions

2. **backend/Dockerfile.prod** - Production backend Dockerfile
   - Python 3.11-slim base image
   - curl installed for health checks
   - Production dependencies only (no dev dependencies)
   - Non-root user (plantops, UID 1000)
   - Copies only pyproject.toml and src/
   - No bind mounts

3. **frontend/Dockerfile.prod** - Production frontend Dockerfile
   - Multi-stage build (node:20-alpine → nginx:alpine)
   - Build stage: npm ci, npm run build
   - Production stage: nginx serving static files
   - Copies nginx.conf for configuration

4. **frontend/nginx.conf** - Nginx configuration for SPA routing
   - SPA routing with try_files fallback to index.html
   - Proxy /api/ requests to backend:8000
   - Proper proxy headers (Host, X-Real-IP, X-Forwarded-For, X-Forwarded-Proto)
   - Health check endpoint at /health

5. **.env.prod.example** - Production environment template
   - All required variables documented
   - Placeholders for secure password generation
   - Instructions for generating encryption key

6. **docs/deployment.md** - Comprehensive deployment guide (285 lines)
   - Prerequisites and quick start
   - Environment variable documentation
   - Security configuration (TLS, non-root user)
   - Resource limits table
   - Health check documentation
   - Management commands
   - Backup and restore procedures
   - Monitoring and troubleshooting
   - Production checklist
   - Architecture diagram

### Modified Files

1. **Makefile** - Added production targets
   - `prod-up` - Start production stack
   - `prod-down` - Stop production stack
   - `prod-logs` - View production logs
   - `prod-build` - Build production images
   - `prod-restart` - Restart production stack
   - Updated .PHONY declaration
   - Updated help text

## Interfaces/Contracts Changed

### New Docker Compose File

Production stack is completely separate from development:
- Development: `docker-compose.yml` (default)
- Production: `docker-compose.prod.yml` (explicit flag required)

### Port Exposure Changes

Production vs Development port exposure:
- **Mosquitto**: Only 8883 (TLS) exposed in production, 1883 (plain) NOT exposed
- **Frontend**: Port 80 in production (nginx), 5173 in development (Vite)
- **Database**: Internal only in production, exposed on 5432 in development

### Environment Variables

New required production variables:
- `POSTGRES_USER` - Database username
- `POSTGRES_PASSWORD` - Secure database password
- `POSTGRES_DB` - Database name
- `MQTT_BACKEND_PASSWORD` - Secure MQTT password
- `ENCRYPTION_KEY` - 64-char hex string for API key encryption
- `LOG_LEVEL` - Logging verbosity (defaults to INFO)

### Resource Limits

All services have defined resource limits:
| Service | Memory Limit | Memory Reserve | CPU Limit |
|---------|--------------|----------------|-----------|
| Database | 512MB | 256MB | 0.5 |
| Mosquitto | 128MB | - | 0.25 |
| Backend | 512MB | 256MB | 1.0 |
| Frontend | 128MB | - | 0.25 |

### Health Checks

All services have health check configurations:
- **Database**: `pg_isready -U ${POSTGRES_USER}` every 10s
- **Mosquitto**: MQTT subscription test every 30s
- **Backend**: `curl -f http://localhost:8000/api/ready` every 30s with 30s start period
- **Frontend**: `curl -f http://localhost:80` every 30s

### Logging Format

Production backend uses JSON logging:
- Development: `LOG_FORMAT=console` (human-readable)
- Production: `LOG_FORMAT=json` (machine-parsable)

## How to Verify

### 1. Run all tests (passes)
```bash
make check
```
Result: All 139 backend tests pass, frontend builds successfully

### 2. Verify production files exist
```bash
ls -la docker-compose.prod.yml backend/Dockerfile.prod frontend/Dockerfile.prod frontend/nginx.conf .env.prod.example docs/deployment.md
```

### 3. Validate Docker Compose syntax
```bash
docker compose -f docker-compose.prod.yml config
```

### 4. Test production build (optional - requires certs)
```bash
# Generate certificates
make certs

# Create .env.prod from example
cp .env.prod.example .env.prod
# Edit with secure values

# Build production images
make prod-build

# Start production stack
make prod-up

# Check health
curl http://localhost:8000/api/health
curl http://localhost:80

# Stop stack
make prod-down
```

### 5. Verify Makefile targets
```bash
make help | grep prod-
```
Expected: 5 production commands listed

### 6. Verify documentation
```bash
cat docs/deployment.md
```
Expected: Comprehensive deployment guide with all sections

## Definition of Done - All Complete

- [x] `docker-compose.prod.yml` created with all services
- [x] `backend/Dockerfile.prod` builds without dev dependencies
- [x] `frontend/Dockerfile.prod` creates nginx-based image
- [x] `frontend/nginx.conf` proxies API requests
- [x] `.env.prod.example` documents all required variables
- [x] Resource limits set on all services
- [x] Health checks configured on all services
- [x] Makefile has prod-* targets (5 targets)
- [x] `docs/deployment.md` updated (comprehensive guide created)
- [x] All existing tests still pass (`make check`)

## Key Features

### Security

1. **TLS-Only MQTT**: Port 1883 (plain MQTT) not exposed to host
2. **Non-Root User**: Backend runs as UID 1000 (plantops user)
3. **No Source Mounts**: All code copied during build, preventing modification
4. **JSON Logging**: Structured logs for security auditing
5. **Health Checks**: All services monitored for availability

### Reliability

1. **Health Checks**: Container orchestration can detect failures
2. **Resource Limits**: Prevents resource exhaustion
3. **Restart Policy**: `restart: always` for all services
4. **Service Dependencies**: Backend waits for db and mosquitto health
5. **Start Period**: Backend has 30s grace period for initialization

### Observability

1. **JSON Logs**: Machine-parsable logs for aggregation
2. **Correlation IDs**: Request tracing across services
3. **Health Endpoints**: `/api/health` and `/api/ready`
4. **Resource Monitoring**: Docker stats show resource usage

### Developer Experience

1. **Make Targets**: Simple commands for common operations
2. **Comprehensive Docs**: 285-line deployment guide
3. **Environment Template**: Clear documentation of required variables
4. **Troubleshooting Guide**: Common issues and solutions
5. **Production Checklist**: Step-by-step deployment verification

## Next Steps

### Immediate
The production configuration is ready for deployment to a home server:
1. Generate TLS certificates with `make certs`
2. Create `.env.prod` with secure passwords
3. Build and start with `make prod-build && make prod-up`
4. Verify health with `curl http://localhost:8000/api/health`

### Future Enhancements
1. **Reverse Proxy**: Add Caddy/Traefik for automatic HTTPS
2. **Monitoring**: Add Prometheus and Grafana for metrics
3. **Log Aggregation**: Configure log shipping to ELK/Loki
4. **Automated Backups**: Implement scheduled database backups
5. **CI/CD**: Automate production builds and deployments

### Production Deployment
Before deploying to production, complete the checklist in `docs/deployment.md`:
- Generate TLS certificates
- Set secure passwords
- Configure Discord webhook (optional)
- Test backup/restore procedure
- Verify device connectivity via TLS

## Risks and Follow-ups

### Risks

1. **Resource Constraints**: Limits are tuned for home server. Monitor actual usage and adjust if needed.
2. **TLS Certificate Expiry**: Self-signed certificates don't expire, but production certificates do. Document renewal process.
3. **No Automatic Updates**: Images must be manually rebuilt to get security updates. Consider automated rebuild schedule.
4. **Single Point of Failure**: No redundancy in production stack. Acceptable for home server but note for scaling.

### Follow-ups

1. **Load Testing**: Test resource limits under realistic load
2. **Backup Automation**: Implement scheduled database backups
3. **Certificate Management**: Document renewal for production certificates
4. **Update Strategy**: Document rolling update procedure
5. **Monitoring**: Set up Prometheus for resource and application metrics

## Notes

### Development vs Production

The codebase now has complete separation:
- **Development** (`docker-compose.yml`): Hot reload, bind mounts, exposed ports, console logs
- **Production** (`docker-compose.prod.yml`): Optimized builds, no mounts, limited ports, JSON logs

This allows safe local development without affecting production configuration.

### Resource Limits Rationale

Limits are based on typical home server resources (4-8GB RAM, 2-4 cores):
- **Database (512MB, 0.5 CPU)**: TimescaleDB needs memory for time-series operations
- **Backend (512MB, 1.0 CPU)**: FastAPI + SQLAlchemy + MQTT subscriber
- **Mosquitto (128MB, 0.25 CPU)**: Lightweight MQTT broker
- **Frontend (128MB, 0.25 CPU)**: Static nginx serving

Total: ~1.3GB RAM, ~2 CPU cores (peak usage)

### Health Check Strategy

Different health check intervals based on criticality:
- **Database**: Fast (10s) - critical dependency
- **Backend**: Medium (30s) - user-facing API
- **Mosquitto**: Medium (30s) - device communication
- **Frontend**: Medium (30s) - user interface

### Nginx Configuration

The nginx.conf provides:
1. **SPA Routing**: All non-API routes serve index.html
2. **API Proxy**: Transparent proxying to backend
3. **Proxy Headers**: Correct IP forwarding for logging
4. **Health Endpoint**: Simple /health for container checks

### Docker Compose Version

Using `version: '3.8'` for compatibility with Docker Compose 1.x and 2.x. The `deploy` resource limits require Docker Compose 1.27+ or 2.x.

## Testing Performed

1. ✅ Created docker-compose.prod.yml with all 4 services
2. ✅ Added resource limits to all services
3. ✅ Added health checks to all services
4. ✅ Created backend/Dockerfile.prod with curl and non-root user
5. ✅ Created frontend/Dockerfile.prod with multi-stage build
6. ✅ Created frontend/nginx.conf with SPA routing and API proxy
7. ✅ Created .env.prod.example with all variables
8. ✅ Added 5 Makefile prod-* targets
9. ✅ Created docs/deployment.md (285 lines)
10. ✅ All 139 tests pass
11. ✅ Frontend builds successfully
12. ✅ No bind mounts in production compose
13. ✅ TLS-only MQTT (port 8883, no 1883)
14. ✅ JSON logging configured for backend

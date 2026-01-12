---
task_id: task-032
title: Docker Production Configuration
role: lca-backend
follow_roles: []
post:
  - lca-recorder
  - code-simplifier
  - lca-gitops
depends_on:
  - task-029
  - task-030
  - task-031
inputs:
  - objective.md
  - runs/plan.md
  - runs/handoffs/task-029.md
  - runs/handoffs/task-030.md
  - runs/handoffs/task-031.md
allowed_paths:
  - docker-compose.prod.yml
  - backend/Dockerfile.prod
  - frontend/Dockerfile.prod
  - .env.prod.example
  - Makefile
  - docs/**
check_command: make check
handoff: runs/handoffs/task-032.md
---

# Task 032: Docker Production Configuration

## Goal

Create production-ready Docker configuration with resource limits, health checks, no bind mounts, and documented environment variables.

## Requirements

### Production Docker Compose

Create `docker-compose.prod.yml`:

```yaml
version: '3.8'

services:
  db:
    image: timescale/timescaledb:latest-pg15
    container_name: plantops-db
    restart: always
    environment:
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      POSTGRES_DB: ${POSTGRES_DB}
    volumes:
      - db_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER}"]
      interval: 10s
      timeout: 5s
      retries: 5
    deploy:
      resources:
        limits:
          memory: 512M
          cpus: '0.5'
        reservations:
          memory: 256M

  mosquitto:
    image: eclipse-mosquitto:2
    container_name: plantops-mosquitto
    restart: always
    ports:
      - "8883:8883"  # TLS only in production
    volumes:
      - ./mosquitto/mosquitto.conf:/mosquitto/config/mosquitto.conf:ro
      - ./mosquitto/passwd:/mosquitto/config/passwd
      - ./certs:/mosquitto/certs:ro
      - mosquitto_data:/mosquitto/data
      - mosquitto_log:/mosquitto/log
    healthcheck:
      test: ["CMD", "mosquitto_sub", "-h", "localhost", "-p", "1883", "-t", "$$SYS/#", "-C", "1", "-W", "3"]
      interval: 30s
      timeout: 10s
      retries: 3
    deploy:
      resources:
        limits:
          memory: 128M
          cpus: '0.25'

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile.prod
    container_name: plantops-backend
    restart: always
    ports:
      - "8000:8000"
    environment:
      DATABASE_URL: postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@db:5432/${POSTGRES_DB}
      MQTT_HOST: mosquitto
      MQTT_PORT: 1883
      MQTT_USE_TLS: "true"
      MQTT_TLS_PORT: 8883
      MQTT_CA_CERT: /app/certs/ca.crt
      MQTT_PASSWD_FILE: /mosquitto/passwd
      MQTT_BACKEND_PASSWORD: ${MQTT_BACKEND_PASSWORD}
      DISCORD_WEBHOOK_URL: ${DISCORD_WEBHOOK_URL:-}
      ENCRYPTION_KEY: ${ENCRYPTION_KEY}
      LOG_LEVEL: ${LOG_LEVEL:-INFO}
      LOG_FORMAT: json
    volumes:
      - ./mosquitto/passwd:/mosquitto/passwd
      - ./certs/ca.crt:/app/certs/ca.crt:ro
    depends_on:
      db:
        condition: service_healthy
      mosquitto:
        condition: service_healthy
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/api/ready"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 30s
    deploy:
      resources:
        limits:
          memory: 512M
          cpus: '1.0'
        reservations:
          memory: 256M

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile.prod
    container_name: plantops-frontend
    restart: always
    ports:
      - "80:80"
    depends_on:
      - backend
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:80"]
      interval: 30s
      timeout: 10s
      retries: 3
    deploy:
      resources:
        limits:
          memory: 128M
          cpus: '0.25'

volumes:
  db_data:
  mosquitto_data:
  mosquitto_log:
```

### Backend Production Dockerfile

Create `backend/Dockerfile.prod`:

```dockerfile
FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY pyproject.toml ./
RUN pip install --no-cache-dir .

# Copy application code
COPY src/ ./src/

# Create non-root user
RUN useradd -m -u 1000 plantops
USER plantops

# Expose port
EXPOSE 8000

# Run with uvicorn
CMD ["uvicorn", "src.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### Frontend Production Dockerfile

Create `frontend/Dockerfile.prod`:

```dockerfile
# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build production bundle
RUN npm run build

# Production stage
FROM nginx:alpine

# Copy built files
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

### Frontend Nginx Config

Create `frontend/nginx.conf`:

```nginx
server {
    listen 80;
    server_name localhost;
    root /usr/share/nginx/html;
    index index.html;

    # Handle SPA routing
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Proxy API requests to backend
    location /api/ {
        proxy_pass http://backend:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Health check
    location /health {
        return 200 'ok';
        add_header Content-Type text/plain;
    }
}
```

### Environment Example

Create `.env.prod.example`:

```bash
# Database
POSTGRES_USER=plantops
POSTGRES_PASSWORD=<generate-secure-password>
POSTGRES_DB=plantops

# MQTT
MQTT_BACKEND_PASSWORD=<generate-secure-password>

# Discord (optional)
DISCORD_WEBHOOK_URL=

# Encryption (generate with: openssl rand -hex 32)
ENCRYPTION_KEY=<generate-64-char-hex-string>

# Logging
LOG_LEVEL=INFO
```

### Makefile Updates

Add to Makefile:

```makefile
# Production commands
prod-up: ## Start production stack
	docker compose -f docker-compose.prod.yml up -d

prod-down: ## Stop production stack
	docker compose -f docker-compose.prod.yml down

prod-logs: ## View production logs
	docker compose -f docker-compose.prod.yml logs -f

prod-build: ## Build production images
	docker compose -f docker-compose.prod.yml build

prod-restart: ## Restart production stack
	docker compose -f docker-compose.prod.yml restart
```

### Deployment Documentation

Update `docs/deployment.md`:

```markdown
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

## Resource Limits

| Service | Memory | CPU |
|---------|--------|-----|
| Database | 512MB | 0.5 |
| Mosquitto | 128MB | 0.25 |
| Backend | 512MB | 1.0 |
| Frontend | 128MB | 0.25 |

## Health Checks

All services have health checks configured:
- Database: `pg_isready`
- Mosquitto: MQTT subscription test
- Backend: `/api/ready` endpoint
- Frontend: HTTP response

## Updating

1. Pull latest code:
   ```bash
   git pull origin main
   ```

2. Rebuild and restart:
   ```bash
   docker compose -f docker-compose.prod.yml up -d --build
   ```

## Backup

Database backups:
```bash
docker exec plantops-db pg_dump -U plantops plantops > backup.sql
```

Restore:
```bash
cat backup.sql | docker exec -i plantops-db psql -U plantops plantops
```
```

## Constraints

- No bind mounts for source code in production
- All services must have health checks
- Resource limits must be reasonable for home server
- Frontend must serve via nginx (not Vite dev server)
- API proxy in nginx for frontend-to-backend communication

## Definition of Done

- [ ] `docker-compose.prod.yml` created with all services
- [ ] `backend/Dockerfile.prod` builds without dev dependencies
- [ ] `frontend/Dockerfile.prod` creates nginx-based image
- [ ] `frontend/nginx.conf` proxies API requests
- [ ] `.env.prod.example` documents all required variables
- [ ] Resource limits set on all services
- [ ] Health checks configured on all services
- [ ] Makefile has prod-* targets
- [ ] `docs/deployment.md` updated
- [ ] All existing tests still pass (`make check`)

## Notes

The production stack:
- Uses TLS for MQTT (port 8883 only)
- Logs in JSON format
- Runs backend as non-root user
- Serves frontend via nginx
- Has proper health checks for orchestration

Port 1883 (plain MQTT) is intentionally not exposed in production. Devices must connect via TLS on port 8883.

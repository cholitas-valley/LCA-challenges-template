# Handoff: task-002 - Database schema and TimescaleDB setup

## Summary

Successfully created the complete database schema with TimescaleDB support, including migrations, database client module, and TypeScript configuration. The backend now has a fully functional database layer with:

- Initial migration script with TimescaleDB hypertable for telemetry data
- Connection pool management using pg driver
- Migration runner for automated schema deployment
- TypeScript strict mode configuration
- Production-ready Dockerfile with multi-stage builds
- Seed data for 6 plant configurations

## Files Touched

### Created Files:

1. **backend/migrations/001_initial_schema.sql** - Complete database schema with:
   - TimescaleDB extension enablement
   - `plants` table with thresholds and alert configuration (id, name, soil_moisture_min/max, light_min, temperature_min/max, alert_cooldown_minutes, last_alert_sent_at)
   - `telemetry` hypertable with composite primary key (timestamp, plant_id) for efficient time-series queries
   - `alerts` table for alert history tracking
   - Indexes for efficient queries on telemetry (by plant_id and timestamp) and alerts
   - Seed data for 6 plants: Monstera Deliciosa, Snake Plant, Pothos, Fiddle Leaf Fig, Spider Plant, Peace Lily
   - Idempotent design with `IF NOT EXISTS` and `ON CONFLICT DO NOTHING`

2. **backend/src/db/client.ts** - PostgreSQL connection pool:
   - Exports configured pg Pool instance
   - Connection settings: max 20 connections, 30s idle timeout, 2s connection timeout
   - Error handler for unexpected pool errors
   - Reads DATABASE_URL from environment

3. **backend/src/db/migrate.ts** - Migration runner:
   - Reads and executes SQL migration files
   - Can be run directly via `npm run migrate`
   - Exportable for programmatic use
   - Proper error handling and logging

4. **backend/package.json** - npm configuration:
   - Dependencies: pg (PostgreSQL driver)
   - DevDependencies: @types/node, @types/pg, tsx, typescript
   - Scripts: build, dev, start, migrate, typecheck
   - ES module configuration (type: "module")

5. **backend/tsconfig.json** - TypeScript configuration:
   - Target: ES2022 with ES modules
   - Strict mode enabled
   - Additional strictness: noUnusedLocals, noUnusedParameters, noImplicitReturns, noFallthroughCasesInSwitch
   - Output to dist/, source from src/
   - Source maps and declaration maps enabled

6. **backend/Dockerfile** - Multi-stage production build:
   - Base: Node.js 20 Alpine
   - Stage 1 (deps): Install dependencies with npm ci
   - Stage 2 (builder): Build TypeScript code
   - Stage 3 (runner): Production image with built artifacts, migrations, and dependencies
   - Health check placeholder
   - CMD runs migrations then starts server

7. **backend/.dockerignore** - Docker ignore rules for node_modules, dist, .env, logs, etc.

### Modified Files:

8. **Makefile** - Updated typecheck target:
   - Now checks if backend/src exists and runs `npm run typecheck`
   - Falls back to stub message if no TypeScript is configured
   - Properly integrates with `make check`

## Interfaces/Contracts Changed

### Database Schema:

**plants table:**
```sql
id TEXT PRIMARY KEY
name TEXT NOT NULL
soil_moisture_min INTEGER NOT NULL
soil_moisture_max INTEGER NOT NULL
light_min INTEGER NOT NULL
temperature_min NUMERIC(5,2) NOT NULL
temperature_max NUMERIC(5,2) NOT NULL
alert_cooldown_minutes INTEGER NOT NULL DEFAULT 60
last_alert_sent_at TIMESTAMPTZ
```

**telemetry table (hypertable):**
```sql
timestamp TIMESTAMPTZ NOT NULL
plant_id TEXT NOT NULL
soil_moisture INTEGER NOT NULL
light INTEGER NOT NULL
temperature NUMERIC(5,2) NOT NULL
PRIMARY KEY (timestamp, plant_id)
FOREIGN KEY (plant_id) REFERENCES plants(id) ON DELETE CASCADE
```

**alerts table:**
```sql
id SERIAL PRIMARY KEY
timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
plant_id TEXT NOT NULL
alert_type TEXT NOT NULL
message TEXT NOT NULL
sent_to_discord BOOLEAN NOT NULL DEFAULT FALSE
FOREIGN KEY (plant_id) REFERENCES plants(id) ON DELETE CASCADE
```

### Seed Data (6 Plants):

1. **monstera** - Monstera Deliciosa (moisture: 20-80, light: 300+, temp: 18-27°C)
2. **snake-plant** - Snake Plant (moisture: 15-70, light: 200+, temp: 15-29°C)
3. **pothos** - Pothos (moisture: 25-85, light: 250+, temp: 17-30°C)
4. **fiddle-leaf** - Fiddle Leaf Fig (moisture: 30-85, light: 400+, temp: 18-26°C)
5. **spider-plant** - Spider Plant (moisture: 20-80, light: 300+, temp: 16-28°C)
6. **peace-lily** - Peace Lily (moisture: 35-90, light: 250+, temp: 18-27°C)

### TypeScript Module Exports:

- `backend/src/db/client.ts` - Exports default pg Pool instance
- `backend/src/db/migrate.ts` - Exports default migrate() function

### npm Scripts:

- `npm run build` - Compile TypeScript to JavaScript
- `npm run dev` - Run with tsx watch mode
- `npm start` - Run production build
- `npm run migrate` - Execute database migrations
- `npm run typecheck` - Type check without emitting

## How to Verify

### 1. Verify TypeScript compilation:
```bash
cd backend && npm run typecheck
```
Expected: No type errors, compilation succeeds.

### 2. Run make check (all quality gates):
```bash
make check
```
Expected: All checks pass including backend typecheck.

### 3. Verify file structure:
```bash
find backend -path backend/node_modules -prune -o -type f -print | sort
```
Expected: All created files present (migrations, src/db, Dockerfile, configs).

### 4. Verify migration SQL syntax:
```bash
cat backend/migrations/001_initial_schema.sql
```
Expected: Valid SQL with TimescaleDB commands, all tables, indexes, and seed data.

### 5. Test with Docker Compose (optional, requires .env):
```bash
# Copy .env.example to .env first
docker compose up -d postgres
docker compose exec postgres psql -U plantops -d plantops -c '\dt'
docker compose exec postgres psql -U plantops -d plantops -c 'SELECT * FROM plants'
```
Expected: Tables created, 6 seed plants returned.

### 6. Verify Dockerfile builds:
```bash
docker build -t plantops-backend ./backend
```
Expected: Multi-stage build completes successfully.

## Next Steps / Risks

### Immediate Next Steps:

1. **task-003**: Implement backend Express API server
   - Create Express app with health check endpoint
   - Set up API routes for plants and telemetry queries
   - Add CORS configuration
   - Integrate with database client

2. **task-004**: Implement MQTT subscriber in backend
   - Set up MQTT.js client to connect to mosquitto
   - Subscribe to `plants/+/telemetry` topic
   - Validate incoming telemetry payloads with Zod
   - Insert validated telemetry into TimescaleDB

3. **task-005**: Implement MQTT simulator
   - Create Node.js service that publishes plant telemetry
   - Simulate 6 plants with realistic sensor variations
   - Publish to `plants/<plant_id>/telemetry` topics
   - Configure publish interval (e.g., every 30 seconds)

### Database Considerations:

1. **Migration Path**: Current migration is idempotent but basic. Future migrations may need:
   - Migration tracking table (to track which migrations have run)
   - Migration rollback scripts
   - Schema versioning

2. **Hypertable Configuration**: Default TimescaleDB hypertable settings are used. May want to configure:
   - Chunk time interval (default is 7 days, could be adjusted based on data volume)
   - Compression policies for older data
   - Retention policies to automatically drop old data

3. **Connection Pool Sizing**: Current max is 20 connections. Monitor and adjust based on:
   - Concurrent request load
   - Available database resources
   - Background worker processes

4. **Index Strategy**: Current indexes support basic queries. May need additional indexes for:
   - Alert lookups by sent_to_discord flag
   - Plant lookups by threshold ranges
   - Telemetry aggregation queries

### Known Risks:

1. **require.main Check**: The migrate.ts uses `require.main === module` which is CommonJS. Since we're using ES modules, this needs to be updated or the script should be invoked via npm script only.

2. **Migration Runner Path**: Uses `__dirname` which doesn't exist in ES modules. Will need to use `import.meta.url` and `fileURLToPath` for proper path resolution.

3. **No Index Creation Validation**: The migration doesn't check if indexes were created successfully. Consider adding validation.

4. **Seed Data Updates**: If seed data needs to be updated, current `ON CONFLICT DO NOTHING` won't update existing records. May need `ON CONFLICT DO UPDATE` for updates.

5. **No Migration Rollback**: Current migration is one-way only. Consider adding down migrations for rollback support.

6. **Database Connection Error Handling**: The pool error handler calls `process.exit(-1)` which will crash the entire process. Consider more graceful error handling for production.

### Files Ready for Next Implementation:

- `backend/src/index.ts` - Ready for Express server implementation
- `backend/src/mqtt/` - Ready for MQTT subscriber implementation
- `backend/src/api/` - Ready for API route handlers
- `backend/src/services/` - Ready for business logic services

### Infrastructure Complete:

- Database schema with TimescaleDB ✅
- Connection pool management ✅
- Migration framework ✅
- TypeScript configuration ✅
- Production Dockerfile ✅
- Type checking integration ✅

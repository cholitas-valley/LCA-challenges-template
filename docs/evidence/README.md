# Evidence Directory

This directory contains proof of working system implementation.

## Automated Evidence

These files are generated automatically:
- `api-health.txt` - Backend health check response
- `database-query.txt` - Database telemetry and alerts queries

## Manual Evidence Required

The following evidence files require manual capture:

### Screenshots (Manual Capture Required)
- `dashboard-screenshot.png` - Screenshot of dashboard with 6 plant cards
- `history-chart-screenshot.png` - Screenshot of history modal with charts
- `discord-alert.png` - Screenshot of Discord alert message (if webhook configured)

### Terminal Output (Manual Capture Recommended)
- `docker-compose-up.txt` - Output of `docker compose up` showing all services starting
- `make-check.txt` - Output of `make check` showing all quality gates passing

## How to Capture Manual Evidence

### Dashboard Screenshot
1. Open http://localhost:3001 in browser
2. Wait for plant cards to load
3. Take screenshot (full page or relevant portion)
4. Save as `dashboard-screenshot.png`

### History Chart Screenshot
1. Open dashboard at http://localhost:3001
2. Click "View History" button on any plant card
3. Wait for charts to render
4. Take screenshot of modal with 3 charts visible
5. Save as `history-chart-screenshot.png`

### Discord Alert Screenshot
1. Configure `DISCORD_WEBHOOK_URL` in `.env`
2. Wait for worker to detect threshold breach
3. Open Discord channel
4. Take screenshot of alert message
5. Save as `discord-alert.png`

### Docker Compose Output
```bash
docker compose up > docs/evidence/docker-compose-up.txt 2>&1
# Wait for services to start
# Ctrl+C after confirmation
```

### Make Check Output
```bash
make check > docs/evidence/make-check.txt 2>&1
```

## Notes

- All evidence files should demonstrate working functionality
- Timestamps in outputs should be recent (within submission timeframe)
- Screenshots should be clear and readable
- Terminal outputs should show successful completion

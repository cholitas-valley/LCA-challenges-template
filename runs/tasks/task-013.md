---
task_id: task-013
title: Discord alerts integration
role: lca-backend
follow_roles: []
post:
  - lca-recorder
  - lca-gitops
depends_on:
  - task-012
  - task-011
inputs:
  - objective.md
  - runs/plan.md
  - runs/handoffs/task-012.md
  - runs/handoffs/task-011.md
allowed_paths:
  - backend/**
check_command: cd backend && python -m pytest tests/test_discord.py -v --tb=short
handoff: runs/handoffs/task-013.md
---

# Task 013: Discord Alerts Integration

## Goal

Implement Discord webhook integration for sending alerts when thresholds are breached or devices go offline.

## Requirements

### Discord Service (backend/src/services/discord.py)

```python
class DiscordService:
    def __init__(self, webhook_url: str | None):
        self.webhook_url = webhook_url
        
    async def send_threshold_alert(self, violation: ThresholdViolation, plant_name: str) -> bool:
        """Send threshold breach alert to Discord."""
        
    async def send_offline_alert(self, device_id: str, plant_name: str | None) -> bool:
        """Send device offline alert to Discord."""
        
    async def send_message(self, embed: dict) -> bool:
        """Send raw Discord embed message."""
```

### Alert Message Format

**Threshold Alert:**
```json
{
  "embeds": [{
    "title": "Plant Alert: Monstera",
    "description": "soil_moisture is 15.2, threshold min 20.0",
    "color": 15158332,  // Red
    "fields": [
      { "name": "Metric", "value": "soil_moisture", "inline": true },
      { "name": "Current", "value": "15.2", "inline": true },
      { "name": "Threshold", "value": "min 20.0", "inline": true }
    ],
    "timestamp": "2026-01-07T12:00:00Z"
  }]
}
```

**Device Offline Alert:**
```json
{
  "embeds": [{
    "title": "Device Offline",
    "description": "Device device_abc123 has gone offline",
    "color": 16776960,  // Yellow
    "fields": [
      { "name": "Device ID", "value": "device_abc123", "inline": true },
      { "name": "Plant", "value": "Monstera", "inline": true },
      { "name": "Last Seen", "value": "3 minutes ago", "inline": true }
    ],
    "timestamp": "2026-01-07T12:00:00Z"
  }]
}
```

### Alert Worker

Create background worker that processes alert queue:
```python
class AlertWorker:
    def __init__(self, discord: DiscordService, queue: asyncio.Queue):
        self.discord = discord
        self.queue = queue
        
    async def run(self):
        """Process alerts from queue and send to Discord."""
        while True:
            alert = await self.queue.get()
            try:
                if isinstance(alert, ThresholdViolation):
                    await self.discord.send_threshold_alert(alert, plant_name)
                elif isinstance(alert, DeviceOfflineEvent):
                    await self.discord.send_offline_alert(alert.device_id, plant_name)
            except Exception as e:
                logger.error(f"Failed to send alert: {e}")
            finally:
                self.queue.task_done()
```

### Integration Points

1. **Threshold Evaluator** (task-012): Queue threshold violations
2. **Heartbeat Handler** (task-011): Queue offline events
3. **FastAPI Lifespan**: Start alert worker

### Configuration

Add to Settings:
```python
discord_webhook_url: str | None = None  # Optional
```

### Graceful Degradation

- If webhook_url is None, log alerts but don't fail
- If webhook request fails, log error and continue
- Rate limit handling (Discord allows 30 requests/minute)

### Tests (backend/tests/test_discord.py)

Test cases:
- send_threshold_alert formats message correctly
- send_offline_alert formats message correctly
- Missing webhook_url returns False without error
- HTTP error is handled gracefully
- Alert worker processes queue items

## Definition of Done

- [ ] DiscordService sends threshold alerts
- [ ] DiscordService sends device offline alerts
- [ ] Alert messages include plant name and metric details
- [ ] Graceful handling when webhook not configured
- [ ] Alert worker processes queue asynchronously
- [ ] All tests pass

## Constraints

- Do NOT block telemetry processing on Discord send
- Use asyncio queue for decoupling
- Handle Discord rate limits gracefully
- Mock Discord API in tests (don't send real messages)

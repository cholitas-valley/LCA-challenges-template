# Recorder: task-013

## Changes Summary

Implemented Discord webhook integration for threshold breach and device offline alerts. Non-blocking queue-based architecture.

## Key Files

- `backend/src/services/discord.py`: DiscordService with send_threshold_alert, send_offline_alert
- `backend/src/services/alert_worker.py`: AlertWorker, DeviceOfflineEvent
- `backend/src/services/telemetry_handler.py`: Queue integration
- `backend/src/services/heartbeat_handler.py`: Queue integration
- `backend/src/main.py`: Alert worker in lifespan
- `backend/tests/test_discord.py`: 10 unit tests

## Interfaces for Next Task

### DiscordService
```python
from src.services.discord import DiscordService
discord = DiscordService(settings.discord_webhook_url)
await discord.send_threshold_alert(violation, plant_name)
await discord.send_offline_alert(device_id, plant_name)
```

### AlertWorker
```python
from src.services.alert_worker import AlertWorker, DeviceOfflineEvent
worker = AlertWorker(discord, alert_queue)
await alert_queue.put(violation)  # ThresholdViolation
await alert_queue.put(DeviceOfflineEvent(device_id, plant_name))
```

## Notes

- Non-blocking: asyncio queue decouples from telemetry
- Graceful degradation: works without webhook URL
- Rate limit tracking for Discord API
- Errors logged, not raised
- Background worker in FastAPI lifespan

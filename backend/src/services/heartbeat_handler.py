"""Heartbeat handler for device status tracking."""
import asyncio
import logging
from datetime import datetime, timedelta

from src.db.connection import get_pool
from src.repositories import device as device_repo

logger = logging.getLogger(__name__)


class HeartbeatHandler:
    """Handler for processing device heartbeats and tracking online/offline status."""

    def __init__(self, timeout_seconds: int = 180, alert_queue: asyncio.Queue | None = None):
        """
        Initialize heartbeat handler.

        Args:
            timeout_seconds: Number of seconds without heartbeat before marking offline (default 180)
            alert_queue: Optional queue for sending offline alerts to Discord worker
        """
        self.timeout_seconds = timeout_seconds
        self.alert_queue = alert_queue

    async def handle_heartbeat(self, device_id: str, payload: dict) -> None:
        """
        Process heartbeat from device.

        Updates device.last_seen_at and sets status to 'online'.

        Args:
            device_id: Device ID sending heartbeat
            payload: Heartbeat payload (may contain timestamp, uptime, etc.)
        """
        try:
            pool = get_pool()
            async with pool.acquire() as conn:
                # Get current device to check if it exists
                device = await device_repo.get_device_by_id(conn, device_id)
                if not device:
                    logger.warning(f"Heartbeat from unknown device: {device_id}")
                    return

                # Update last_seen_at and status
                now = datetime.now()
                await device_repo.update_last_seen(conn, device_id, now)
                
                logger.debug(f"Heartbeat processed for device {device_id}")

        except Exception as e:
            logger.error(f"Error processing heartbeat for device {device_id}: {e}")
            # Don't raise - we want MQTT processing to continue

    async def check_offline_devices(self) -> list[str]:
        """
        Find devices that missed heartbeats and mark them offline.

        Devices are considered offline if last_seen_at is older than timeout_seconds.

        Returns:
            List of device_ids that were marked offline
        """
        try:
            pool = get_pool()
            async with pool.acquire() as conn:
                # Get devices that are stale (fetch full records for alerting)
                stale_device_ids = await device_repo.get_stale_devices(
                    conn, self.timeout_seconds
                )

                if not stale_device_ids:
                    return []

                # Fetch device details for alerting
                device_details = []
                for device_id in stale_device_ids:
                    device = await device_repo.get_device_by_id(conn, device_id)
                    if device:
                        device_details.append(device)

                # Mark them offline
                await device_repo.mark_devices_offline(conn, stale_device_ids)

                logger.info(f"Marked {len(stale_device_ids)} devices as offline: {stale_device_ids}")

                # Queue offline alerts if alert queue is configured
                if self.alert_queue:
                    from src.services.alert_worker import DeviceOfflineEvent
                    from src.repositories import plant as plant_repo

                    for device in device_details:
                        # Get plant name if device is assigned
                        plant_name = None
                        if device.get('plant_id'):
                            plant = await plant_repo.get_plant_by_id(conn, device['plant_id'])
                            if plant:
                                plant_name = plant.get('name')

                        # Queue offline event
                        event = DeviceOfflineEvent(
                            device_id=device['id'],
                            plant_name=plant_name,
                            last_seen=device.get('last_seen_at'),
                        )
                        await self.alert_queue.put(event)

                return stale_device_ids

        except Exception as e:
            logger.error(f"Error checking offline devices: {e}")
            return []

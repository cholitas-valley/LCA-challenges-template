"""Heartbeat handler for device status tracking."""
import logging
from datetime import datetime, timedelta

from src.db.connection import get_pool
from src.repositories import device as device_repo

logger = logging.getLogger(__name__)


class HeartbeatHandler:
    """Handler for processing device heartbeats and tracking online/offline status."""

    def __init__(self, timeout_seconds: int = 180):
        """
        Initialize heartbeat handler.

        Args:
            timeout_seconds: Number of seconds without heartbeat before marking offline (default 180)
        """
        self.timeout_seconds = timeout_seconds

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
                # Get devices that are stale
                stale_device_ids = await device_repo.get_stale_devices(
                    conn, self.timeout_seconds
                )

                if not stale_device_ids:
                    return []

                # Mark them offline
                await device_repo.mark_devices_offline(conn, stale_device_ids)

                logger.info(f"Marked {len(stale_device_ids)} devices as offline: {stale_device_ids}")
                return stale_device_ids

        except Exception as e:
            logger.error(f"Error checking offline devices: {e}")
            return []

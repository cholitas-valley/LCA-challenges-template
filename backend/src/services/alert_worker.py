"""Alert worker for processing alert queue and sending to Discord."""
import asyncio
import logging
from dataclasses import dataclass
from datetime import datetime

from src.services.discord import DiscordService

logger = logging.getLogger(__name__)


@dataclass
class DeviceOfflineEvent:
    """Represents a device going offline."""
    device_id: str
    plant_name: str | None
    last_seen: datetime | None


class AlertWorker:
    """Background worker that processes alerts from queue and sends to Discord."""
    
    def __init__(self, discord: DiscordService, queue: asyncio.Queue):
        """
        Initialize alert worker.
        
        Args:
            discord: DiscordService instance for sending alerts
            queue: Queue to receive alert events from
        """
        self.discord = discord
        self.queue = queue
        self._running = False
    
    async def run(self):
        """
        Process alerts from queue and send to Discord.
        
        Runs until cancelled. Alerts are processed sequentially to avoid
        overwhelming Discord rate limits.
        """
        self._running = True
        logger.info("Alert worker started")
        
        while self._running:
            try:
                # Wait for alert from queue (with timeout to allow graceful shutdown)
                try:
                    alert = await asyncio.wait_for(self.queue.get(), timeout=1.0)
                except asyncio.TimeoutError:
                    # No alert received, loop again
                    continue
                
                # Process alert based on type
                try:
                    # Import here to avoid circular dependency
                    from src.services.threshold_evaluator import ThresholdViolation
                    
                    if isinstance(alert, ThresholdViolation):
                        # Threshold violation alert
                        success = await self.discord.send_threshold_alert(
                            alert,
                            alert.plant_name if hasattr(alert, 'plant_name') else "Unknown",
                        )
                        if success:
                            logger.debug(
                                f"Sent threshold alert for {alert.plant_id}/{alert.metric}"
                            )
                    
                    elif isinstance(alert, DeviceOfflineEvent):
                        # Device offline alert
                        success = await self.discord.send_offline_alert(
                            alert.device_id,
                            alert.plant_name,
                            alert.last_seen,
                        )
                        if success:
                            logger.debug(f"Sent offline alert for {alert.device_id}")
                    
                    else:
                        logger.warning(f"Unknown alert type: {type(alert)}")
                
                except Exception as e:
                    logger.error(f"Failed to send alert: {e}")
                
                finally:
                    # Mark task as done
                    self.queue.task_done()
            
            except asyncio.CancelledError:
                logger.info("Alert worker cancelled")
                self._running = False
                break
            except Exception as e:
                logger.error(f"Error in alert worker loop: {e}")
                # Continue running despite errors
    
    def stop(self):
        """Signal the worker to stop processing."""
        self._running = False

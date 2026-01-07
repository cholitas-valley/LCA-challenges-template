"""Discord webhook integration for sending alerts."""
import asyncio
import logging
from datetime import datetime, timedelta
from typing import Any

import httpx

logger = logging.getLogger(__name__)


class DiscordService:
    """Service for sending alerts to Discord via webhook."""
    
    def __init__(self, webhook_url: str | None):
        """
        Initialize Discord service.
        
        Args:
            webhook_url: Discord webhook URL (None disables Discord alerts)
        """
        self.webhook_url = webhook_url
        self._rate_limit_reset: datetime | None = None
        self._rate_limit_remaining = 30  # Discord allows 30 requests/minute
    
    async def send_threshold_alert(
        self,
        violation: Any,  # ThresholdViolation
        plant_name: str,
    ) -> bool:
        """
        Send threshold breach alert to Discord.
        
        Args:
            violation: ThresholdViolation object
            plant_name: Name of the plant
            
        Returns:
            True if sent successfully, False otherwise
        """
        if not self.webhook_url:
            logger.debug("Discord webhook not configured, skipping alert")
            return False
        
        # Format threshold description
        threshold_desc = f"{violation.direction} {violation.threshold}"
        description = (
            f"{violation.metric.replace('_', ' ').title()} is {violation.value:.1f}, "
            f"threshold {threshold_desc}"
        )
        
        # Create embed
        embed = {
            "title": f"Plant Alert: {plant_name}",
            "description": description,
            "color": 15158332,  # Red
            "fields": [
                {
                    "name": "Metric",
                    "value": violation.metric,
                    "inline": True,
                },
                {
                    "name": "Current",
                    "value": f"{violation.value:.1f}",
                    "inline": True,
                },
                {
                    "name": "Threshold",
                    "value": threshold_desc,
                    "inline": True,
                },
            ],
            "timestamp": datetime.utcnow().isoformat(),
        }
        
        return await self.send_message(embed)
    
    async def send_offline_alert(
        self,
        device_id: str,
        plant_name: str | None,
        last_seen: datetime | None = None,
    ) -> bool:
        """
        Send device offline alert to Discord.
        
        Args:
            device_id: ID of the offline device
            plant_name: Name of the plant (or None if unassigned)
            last_seen: Last seen timestamp
            
        Returns:
            True if sent successfully, False otherwise
        """
        if not self.webhook_url:
            logger.debug("Discord webhook not configured, skipping alert")
            return False
        
        # Calculate time since last seen
        time_ago = "Unknown"
        if last_seen:
            delta = datetime.now() - last_seen.replace(tzinfo=None)
            minutes = int(delta.total_seconds() / 60)
            if minutes < 60:
                time_ago = f"{minutes} minute{'s' if minutes != 1 else ''} ago"
            else:
                hours = minutes // 60
                time_ago = f"{hours} hour{'s' if hours != 1 else ''} ago"
        
        # Create embed
        embed = {
            "title": "Device Offline",
            "description": f"Device {device_id} has gone offline",
            "color": 16776960,  # Yellow
            "fields": [
                {
                    "name": "Device ID",
                    "value": device_id,
                    "inline": True,
                },
                {
                    "name": "Plant",
                    "value": plant_name or "Unassigned",
                    "inline": True,
                },
                {
                    "name": "Last Seen",
                    "value": time_ago,
                    "inline": True,
                },
            ],
            "timestamp": datetime.utcnow().isoformat(),
        }
        
        return await self.send_message(embed)
    
    async def send_message(self, embed: dict) -> bool:
        """
        Send raw Discord embed message.
        
        Args:
            embed: Discord embed object
            
        Returns:
            True if sent successfully, False otherwise
        """
        if not self.webhook_url:
            logger.debug("Discord webhook not configured, skipping message")
            return False
        
        # Check rate limit
        if self._rate_limit_reset and datetime.now() < self._rate_limit_reset:
            if self._rate_limit_remaining <= 0:
                logger.warning(
                    f"Discord rate limit exceeded, reset at {self._rate_limit_reset}"
                )
                return False
        
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.post(
                    self.webhook_url,
                    json={"embeds": [embed]},
                )
                
                # Update rate limit tracking
                if "X-RateLimit-Remaining" in response.headers:
                    self._rate_limit_remaining = int(
                        response.headers["X-RateLimit-Remaining"]
                    )
                
                if "X-RateLimit-Reset" in response.headers:
                    reset_timestamp = float(response.headers["X-RateLimit-Reset"])
                    self._rate_limit_reset = datetime.fromtimestamp(reset_timestamp)
                
                if response.status_code == 204:
                    logger.info("Discord alert sent successfully")
                    return True
                elif response.status_code == 429:
                    logger.warning("Discord rate limit hit")
                    return False
                else:
                    logger.error(
                        f"Discord API error: {response.status_code} {response.text}"
                    )
                    return False
        
        except httpx.TimeoutException:
            logger.error("Discord webhook request timed out")
            return False
        except Exception as e:
            logger.error(f"Failed to send Discord message: {e}")
            return False

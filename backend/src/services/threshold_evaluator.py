"""Threshold evaluator service for comparing telemetry against plant thresholds."""
import logging
from dataclasses import dataclass
from datetime import datetime, timedelta

from src.db.connection import get_pool
from src.models.plant import PlantThresholds
from src.models.telemetry import TelemetryPayload
from src.repositories import alert as alert_repo

logger = logging.getLogger(__name__)


@dataclass
class ThresholdViolation:
    """Represents a threshold violation that may trigger an alert."""
    plant_id: str
    device_id: str
    metric: str  # soil_moisture, temperature, humidity, light_level
    value: float
    threshold: float
    direction: str  # 'min' or 'max'


class ThresholdEvaluator:
    """Evaluates telemetry against plant thresholds and manages alert cooldowns."""
    
    def __init__(self, cooldown_seconds: int = 3600):
        """
        Initialize the threshold evaluator.
        
        Args:
            cooldown_seconds: Time to wait before sending duplicate alerts (default 1 hour)
        """
        self.cooldown_seconds = cooldown_seconds
    
    async def evaluate(
        self,
        plant_id: str,
        device_id: str,
        telemetry: TelemetryPayload,
        thresholds: PlantThresholds,
    ) -> list[ThresholdViolation]:
        """
        Check telemetry against thresholds and return violations.
        
        Args:
            plant_id: Plant ID
            device_id: Device ID
            telemetry: Telemetry data from device
            thresholds: Plant threshold configuration
            
        Returns:
            List of threshold violations detected
        """
        violations = []
        
        # Check each metric that has both a value and a threshold
        metrics_to_check = [
            ('soil_moisture', telemetry.soil_moisture, thresholds.soil_moisture),
            ('temperature', telemetry.temperature, thresholds.temperature),
            ('humidity', telemetry.humidity, thresholds.humidity),
            ('light_level', telemetry.light_level, thresholds.light_level),
        ]
        
        for metric_name, value, threshold_config in metrics_to_check:
            # Skip if no value or no threshold configured
            if value is None or threshold_config is None:
                continue
            
            # Check minimum threshold
            if threshold_config.min is not None and value < threshold_config.min:
                violations.append(ThresholdViolation(
                    plant_id=plant_id,
                    device_id=device_id,
                    metric=metric_name,
                    value=value,
                    threshold=threshold_config.min,
                    direction='min',
                ))
            
            # Check maximum threshold
            if threshold_config.max is not None and value > threshold_config.max:
                violations.append(ThresholdViolation(
                    plant_id=plant_id,
                    device_id=device_id,
                    metric=metric_name,
                    value=value,
                    threshold=threshold_config.max,
                    direction='max',
                ))
        
        return violations
    
    async def should_alert(self, violation: ThresholdViolation) -> bool:
        """
        Check if an alert should be sent for this violation (not in cooldown).
        
        Args:
            violation: The threshold violation to check
            
        Returns:
            True if alert should be sent, False if in cooldown period
        """
        try:
            pool = get_pool()
            async with pool.acquire() as conn:
                # Get the latest alert for this plant+metric combination
                latest_alert = await alert_repo.get_latest_alert(
                    conn,
                    violation.plant_id,
                    violation.metric,
                )
                
                if latest_alert is None:
                    # No previous alert, should send
                    return True
                
                # Check if cooldown period has elapsed
                last_alert_time = latest_alert['sent_at']
                cooldown_until = last_alert_time + timedelta(seconds=self.cooldown_seconds)
                
                if datetime.now() >= cooldown_until:
                    # Cooldown expired, should send
                    return True
                else:
                    # Still in cooldown, skip alert
                    logger.debug(
                        f"Alert cooldown active for {violation.plant_id}/{violation.metric} "
                        f"until {cooldown_until}"
                    )
                    return False
        
        except Exception as e:
            logger.error(f"Error checking alert cooldown: {e}")
            # Default to not sending alert on error
            return False
    
    async def record_alert(self, violation: ThresholdViolation) -> None:
        """
        Record that an alert was sent (for cooldown tracking).
        
        Args:
            violation: The violation that triggered the alert
        """
        try:
            pool = get_pool()
            async with pool.acquire() as conn:
                await alert_repo.create_alert(
                    conn=conn,
                    plant_id=violation.plant_id,
                    device_id=violation.device_id,
                    metric=violation.metric,
                    value=violation.value,
                    threshold=violation.threshold,
                    direction=violation.direction,
                )
                logger.info(
                    f"Recorded alert for {violation.plant_id}/{violation.metric}: "
                    f"value={violation.value} {violation.direction}={violation.threshold}"
                )
        
        except Exception as e:
            logger.error(f"Error recording alert: {e}")
            # Don't raise - we don't want to fail telemetry processing

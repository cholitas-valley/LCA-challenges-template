"""Telemetry handler service for processing incoming sensor data."""
import json
import logging
from datetime import datetime

from src.db.connection import get_pool
from src.models.plant import PlantThresholds
from src.models.telemetry import TelemetryPayload
from src.repositories import device as device_repo
from src.repositories import plant as plant_repo
from src.repositories import telemetry as telemetry_repo

logger = logging.getLogger(__name__)


class TelemetryHandler:
    """Handler for processing telemetry messages from MQTT."""

    def __init__(self, threshold_evaluator=None):
        """
        Initialize telemetry handler.

        Args:
            threshold_evaluator: Optional ThresholdEvaluator instance for alert checks
        """
        self.threshold_evaluator = threshold_evaluator

    async def handle_telemetry(self, device_id: str, payload: dict) -> None:
        """
        Process incoming telemetry from MQTT.
        
        Steps:
        1. Validate payload against TelemetryPayload model
        2. Look up device to get plant_id
        3. Store in database with device and plant context
        
        Args:
            device_id: Device ID extracted from MQTT topic
            payload: Telemetry data dictionary
        """
        try:
            # 1. Validate payload
            telemetry = TelemetryPayload(**payload)
            
            # Use server timestamp if device timestamp is missing
            timestamp = telemetry.timestamp if telemetry.timestamp else datetime.now()
            
            # 2. Look up device to get plant_id
            pool = get_pool()
            async with pool.acquire() as conn:
                device_record = await device_repo.get_device_by_id(conn, device_id)
                
                if device_record is None:
                    logger.warning(f"Received telemetry from unknown device: {device_id}")
                    # Store with null plant_id for unregistered devices
                    plant_id = None
                else:
                    plant_id = device_record.get("plant_id")
                    if plant_id is None:
                        logger.debug(f"Device {device_id} is not assigned to a plant")
                
                # 3. Store in database
                await telemetry_repo.insert_telemetry(
                    conn=conn,
                    time=timestamp,
                    device_id=device_id,
                    plant_id=plant_id,
                    soil_moisture=telemetry.soil_moisture,
                    temperature=telemetry.temperature,
                    humidity=telemetry.humidity,
                    light_level=telemetry.light_level,
                )

                logger.info(
                    f"Stored telemetry for device {device_id} "
                    f"(plant: {plant_id or 'unassigned'})"
                )

                # 4. Evaluate thresholds if device is assigned to plant
                if plant_id and self.threshold_evaluator:
                    plant_record = await plant_repo.get_plant_by_id(conn, plant_id)
                    if plant_record and plant_record.get('thresholds'):
                        try:
                            # Parse thresholds from JSONB
                            thresholds_dict = plant_record['thresholds']
                            if isinstance(thresholds_dict, str):
                                import json
                                thresholds_dict = json.loads(thresholds_dict)

                            thresholds = PlantThresholds(**thresholds_dict)

                            # Evaluate telemetry against thresholds
                            violations = await self.threshold_evaluator.evaluate(
                                plant_id=plant_id,
                                device_id=device_id,
                                telemetry=telemetry,
                                thresholds=thresholds,
                            )

                            # Process violations (check cooldown and record alerts)
                            for violation in violations:
                                if await self.threshold_evaluator.should_alert(violation):
                                    await self.threshold_evaluator.record_alert(violation)
                                    logger.info(
                                        f"Alert recorded for {plant_id}: "
                                        f"{violation.metric}={violation.value} "
                                        f"({violation.direction} threshold {violation.threshold})"
                                    )
                        except Exception as e:
                            logger.error(f"Error evaluating thresholds for {plant_id}: {e}")
        
        except Exception as e:
            logger.error(f"Error processing telemetry from {device_id}: {e}")
            # Don't raise - we want to continue processing other messages

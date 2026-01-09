"""Telemetry handler service for processing incoming sensor data."""
import asyncio
import json
from datetime import datetime

from src.db.connection import get_pool
from src.logging_config import get_logger
from src.models.plant import PlantThresholds
from src.models.telemetry import TelemetryPayload
from src.repositories import device as device_repo
from src.repositories import plant as plant_repo
from src.repositories import telemetry as telemetry_repo

logger = get_logger(__name__)


class TelemetryHandler:
    """Handler for processing telemetry messages from MQTT."""

    def __init__(self, threshold_evaluator=None, alert_queue: asyncio.Queue | None = None):
        """
        Initialize telemetry handler.

        Args:
            threshold_evaluator: Optional ThresholdEvaluator instance for alert checks
            alert_queue: Optional queue for sending alerts to Discord worker
        """
        self.threshold_evaluator = threshold_evaluator
        self.alert_queue = alert_queue

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
                    logger.warning("telemetry_unknown_device", device_id=device_id)
                    # Store with null plant_id for unregistered devices
                    plant_id = None
                else:
                    plant_id = device_record.get("plant_id")
                    if plant_id is None:
                        logger.debug("device_unassigned", device_id=device_id)
                
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
                    "telemetry_stored",
                    device_id=device_id,
                    plant_id=plant_id,
                    soil_moisture=telemetry.soil_moisture,
                    temperature=telemetry.temperature,
                    humidity=telemetry.humidity,
                    light_level=telemetry.light_level,
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
                                        "threshold_alert_recorded",
                                        plant_id=plant_id,
                                        metric=violation.metric,
                                        value=violation.value,
                                        direction=violation.direction,
                                        threshold=violation.threshold,
                                    )

                                    # Queue alert for Discord if queue is configured
                                    if self.alert_queue:
                                        # Add plant name to violation for Discord message
                                        violation.plant_name = plant_record.get('name', 'Unknown')
                                        await self.alert_queue.put(violation)
                        except Exception as e:
                            logger.error("threshold_evaluation_error", plant_id=plant_id, error=str(e))

        except Exception as e:
            logger.error("telemetry_processing_error", device_id=device_id, error=str(e))
            # Don't raise - we want to continue processing other messages

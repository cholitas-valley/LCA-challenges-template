"""Telemetry handler service for processing incoming sensor data."""
import json
import logging
from datetime import datetime

from src.db.connection import get_pool
from src.models.telemetry import TelemetryPayload
from src.repositories import device as device_repo
from src.repositories import telemetry as telemetry_repo

logger = logging.getLogger(__name__)


class TelemetryHandler:
    """Handler for processing telemetry messages from MQTT."""

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
        
        except Exception as e:
            logger.error(f"Error processing telemetry from {device_id}: {e}")
            # Don't raise - we want to continue processing other messages

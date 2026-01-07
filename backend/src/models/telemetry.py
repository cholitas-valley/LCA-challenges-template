"""Telemetry data models."""
from datetime import datetime

from pydantic import BaseModel


class TelemetryPayload(BaseModel):
    """
    Incoming telemetry payload from devices.
    All fields are optional to handle partial sensor data.
    """
    timestamp: datetime | None = None  # Defaults to server time if not provided
    soil_moisture: float | None = None
    temperature: float | None = None
    humidity: float | None = None
    light_level: float | None = None


class TelemetryRecord(BaseModel):
    """
    Telemetry record as stored in database.
    Includes device and plant context.
    """
    time: datetime
    device_id: str
    plant_id: str | None
    soil_moisture: float | None = None
    temperature: float | None = None
    humidity: float | None = None
    light_level: float | None = None


class TelemetryHistoryResponse(BaseModel):
    """Response model for telemetry history queries."""
    records: list[TelemetryRecord]
    count: int

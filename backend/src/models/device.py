"""Device-related Pydantic models."""
from datetime import datetime

from pydantic import BaseModel


class DeviceRegisterRequest(BaseModel):
    """Request model for device registration."""
    mac_address: str
    firmware_version: str | None = None
    sensor_types: list[str] | None = None


class DeviceRegisterResponse(BaseModel):
    """Response model for device registration."""
    device_id: str
    mqtt_username: str
    mqtt_password: str  # Plaintext, returned only on registration
    mqtt_host: str
    mqtt_port: int


class DeviceResponse(BaseModel):
    """Response model for device information."""
    id: str
    mac_address: str
    mqtt_username: str
    plant_id: str | None
    status: str
    firmware_version: str | None
    sensor_types: list[str] | None
    last_seen_at: datetime | None
    created_at: datetime


class DeviceListResponse(BaseModel):
    """Response model for device list."""
    devices: list[DeviceResponse]
    total: int

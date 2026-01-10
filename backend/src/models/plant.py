"""Plant-related Pydantic models."""
from datetime import datetime

from pydantic import BaseModel


class ThresholdConfig(BaseModel):
    """Configuration for a single sensor threshold."""
    min: float | None = None
    max: float | None = None


class PlantThresholds(BaseModel):
    """Sensor thresholds for plant monitoring."""
    soil_moisture: ThresholdConfig | None = None
    temperature: ThresholdConfig | None = None
    humidity: ThresholdConfig | None = None
    light_level: ThresholdConfig | None = None


class PlantCreate(BaseModel):
    """Request model for creating a plant."""
    name: str
    species: str | None = None
    thresholds: PlantThresholds | None = None


class PlantUpdate(BaseModel):
    """Request model for updating a plant."""
    name: str | None = None
    species: str | None = None
    thresholds: PlantThresholds | None = None


class PlantPosition(BaseModel):
    """Position on the designer canvas."""
    x: float
    y: float


class PlantPositionUpdate(BaseModel):
    """Request model for updating plant position."""
    x: float
    y: float


class PlantResponse(BaseModel):
    """Response model for plant information."""
    id: str
    name: str
    species: str | None
    thresholds: PlantThresholds | None
    position: PlantPosition | None = None
    created_at: datetime
    latest_telemetry: dict | None = None
    device_count: int = 0


class PlantListResponse(BaseModel):
    """Response model for plant list."""
    plants: list[PlantResponse]
    total: int

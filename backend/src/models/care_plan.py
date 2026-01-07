"""Care plan models."""
from datetime import datetime

from pydantic import BaseModel


class CarePlanWatering(BaseModel):
    """Watering recommendations."""
    frequency: str  # e.g., "Every 5-7 days"
    amount: str  # e.g., "Until water drains"
    next_date: str | None = None  # ISO date


class CarePlanMetric(BaseModel):
    """Care recommendation for a specific metric."""
    current: str | float
    ideal: str
    recommendation: str


class CarePlan(BaseModel):
    """Comprehensive plant care plan."""
    summary: str
    watering: CarePlanWatering
    light: CarePlanMetric
    humidity: CarePlanMetric
    temperature: CarePlanMetric | None = None
    alerts: list[str]  # Current issues requiring attention
    tips: list[str]  # General care tips
    generated_at: datetime


class CarePlanResponse(BaseModel):
    """Care plan API response."""
    plant_id: str
    plant_name: str
    species: str | None
    care_plan: CarePlan | None
    last_generated: datetime | None

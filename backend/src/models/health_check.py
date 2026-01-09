"""Health check models for plant status assessment."""
from datetime import datetime
from enum import Enum

from pydantic import BaseModel


class HealthStatus(str, Enum):
    """Plant health status levels."""

    OPTIMAL = "optimal"
    WARNING = "warning"
    CRITICAL = "critical"
    UNKNOWN = "unknown"  # When no data available


class HealthIssue(BaseModel):
    """A single health issue identified for the plant."""

    metric: str  # e.g., "soil_moisture", "temperature"
    severity: str  # "warning" or "critical"
    current_value: float | None
    threshold_violated: str | None  # e.g., "below min (20%)"
    message: str  # Human-readable issue description


class HealthRecommendation(BaseModel):
    """A brief recommendation for addressing plant health issues."""

    priority: str  # "high", "medium", "low"
    action: str  # Brief action to take


class TrendSummary(BaseModel):
    """24-hour trend summary for a metric."""

    metric: str  # e.g., "soil_moisture"
    direction: str  # "rising", "falling", "stable"
    change_percent: float
    current: float
    min_24h: float
    max_24h: float
    summary: str  # Human-readable summary, e.g., "Stable at 68% (range: 65-70%)"


class PlantHealthCheckResponse(BaseModel):
    """Response for plant health check endpoint."""

    plant_id: str
    plant_name: str
    status: HealthStatus
    issues: list[HealthIssue]
    recommendations: list[HealthRecommendation]
    trends: list[TrendSummary]  # 24-hour trend summaries
    checked_at: datetime
    has_care_plan: bool
    care_plan_age_hours: float | None  # Hours since care plan generated

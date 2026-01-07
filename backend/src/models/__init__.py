"""Pydantic models package."""
from .care_plan import (
    CarePlan,
    CarePlanMetric,
    CarePlanResponse,
    CarePlanWatering,
)
from .common import ErrorResponse, HealthResponse
from .device import (
    DeviceListResponse,
    DeviceProvisionRequest,
    DeviceProvisionResponse,
    DeviceRegisterRequest,
    DeviceRegisterResponse,
    DeviceResponse,
)
from .plant import (
    PlantCreate,
    PlantListResponse,
    PlantResponse,
    PlantThresholds,
    PlantUpdate,
    ThresholdConfig,
)
from .settings import (
    LLMProvider,
    LLMSettingsResponse,
    LLMSettingsUpdate,
    LLMTestResponse,
)
from .telemetry import (
    TelemetryHistoryResponse,
    TelemetryPayload,
    TelemetryRecord,
)

__all__ = [
    "HealthResponse",
    "ErrorResponse",
    "CarePlan",
    "CarePlanWatering",
    "CarePlanMetric",
    "CarePlanResponse",
    "DeviceRegisterRequest",
    "DeviceRegisterResponse",
    "DeviceResponse",
    "DeviceListResponse",
    "DeviceProvisionRequest",
    "DeviceProvisionResponse",
    "PlantCreate",
    "PlantUpdate",
    "PlantResponse",
    "PlantListResponse",
    "PlantThresholds",
    "ThresholdConfig",
    "LLMProvider",
    "LLMSettingsUpdate",
    "LLMSettingsResponse",
    "LLMTestResponse",
    "TelemetryPayload",
    "TelemetryRecord",
    "TelemetryHistoryResponse",
]

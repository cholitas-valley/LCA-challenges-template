"""Plant management endpoints."""
import asyncio
import json
import logging
import uuid
from datetime import datetime, timedelta

import asyncpg
from fastapi import APIRouter, Depends, HTTPException, Response

from src.db.connection import get_db
from src.models.care_plan import CarePlan, CarePlanResponse
from src.models.health_check import (
    HealthIssue,
    HealthRecommendation,
    HealthStatus,
    PlantHealthCheckResponse,
    TrendSummary,
)
from src.models.plant import (
    PlantCreate,
    PlantListResponse,
    PlantResponse,
    PlantUpdate,
)
from src.models.device import DeviceListResponse, DeviceResponse
from src.models.telemetry import TelemetryHistoryResponse, TelemetryRecord
from src.repositories import plant as plant_repo
from src.repositories import device as device_repo
from src.repositories import telemetry as telemetry_repo
from src.repositories import care_plan as care_plan_repo
from src.repositories import settings as settings_repo
from src.services.care_plan_worker import CarePlanGenerationRequest
from src.services.encryption import EncryptionService
from src.services.llm import LLMService
import os

logger = logging.getLogger(__name__)

# Module-level queue reference for background care plan generation
_care_plan_queue: asyncio.Queue | None = None


def set_care_plan_queue(queue: asyncio.Queue) -> None:
    """Set the care plan queue for background generation."""
    global _care_plan_queue
    _care_plan_queue = queue

router = APIRouter(prefix="/api/plants", tags=["plants"])


@router.post("", response_model=PlantResponse, status_code=201)
async def create_plant(
    request: PlantCreate,
    db: asyncpg.Connection = Depends(get_db),
) -> PlantResponse:
    """
    Create a new plant.
    
    Args:
        request: Plant creation request with name, species, and thresholds
    """
    # Generate unique plant ID
    plant_id = str(uuid.uuid4())
    
    # Convert thresholds model to dict for storage
    thresholds_dict = request.thresholds.model_dump() if request.thresholds else None
    
    # Create plant in database
    plant_data = await plant_repo.create_plant(
        db,
        plant_id=plant_id,
        name=request.name,
        species=request.species,
        thresholds=thresholds_dict,
    )
    
    # Get device count (will be 0 for new plant)
    device_count = await plant_repo.get_plant_device_count(db, plant_id)

    # Queue background care plan generation (non-blocking)
    if _care_plan_queue is not None:
        generation_request = CarePlanGenerationRequest(
            plant_id=plant_id,
            plant_name=request.name,
            species=request.species,
            thresholds=thresholds_dict,
        )
        try:
            _care_plan_queue.put_nowait(generation_request)
            logger.info(f"Queued care plan generation for new plant {plant_id}")
        except asyncio.QueueFull:
            logger.warning(f"Care plan queue full, skipping generation for {plant_id}")

    return PlantResponse(
        id=plant_data["id"],
        name=plant_data["name"],
        species=plant_data["species"],
        thresholds=plant_data["thresholds"],
        created_at=plant_data["created_at"],
        latest_telemetry=None,
        device_count=device_count,
    )


@router.get("", response_model=PlantListResponse)
async def list_plants(
    limit: int = 100,
    offset: int = 0,
    db: asyncpg.Connection = Depends(get_db),
) -> PlantListResponse:
    """
    List all plants with pagination.
    
    Args:
        limit: Maximum number of plants to return (default: 100)
        offset: Number of plants to skip (default: 0)
    """
    plants_data, total = await plant_repo.list_plants(db, limit=limit, offset=offset)
    
    # Build response with device counts and latest telemetry
    plants = []
    for p in plants_data:
        device_count = await plant_repo.get_plant_device_count(db, p["id"])
        latest = await telemetry_repo.get_latest_by_plant(db, p["id"])
        plants.append(
            PlantResponse(
                id=p["id"],
                name=p["name"],
                species=p["species"],
                thresholds=p["thresholds"],
                created_at=p["created_at"],
                latest_telemetry=latest,
                device_count=device_count,
            )
        )

    return PlantListResponse(plants=plants, total=total)


@router.get("/{plant_id}", response_model=PlantResponse)
async def get_plant(
    plant_id: str,
    db: asyncpg.Connection = Depends(get_db),
) -> PlantResponse:
    """
    Get a single plant by ID.
    
    Args:
        plant_id: Plant ID to retrieve
    """
    plant_data = await plant_repo.get_plant_by_id(db, plant_id)
    
    if not plant_data:
        raise HTTPException(status_code=404, detail="Plant not found")
    
    # Get device count and latest telemetry
    device_count = await plant_repo.get_plant_device_count(db, plant_id)
    latest = await telemetry_repo.get_latest_by_plant(db, plant_id)

    return PlantResponse(
        id=plant_data["id"],
        name=plant_data["name"],
        species=plant_data["species"],
        thresholds=plant_data["thresholds"],
        created_at=plant_data["created_at"],
        latest_telemetry=latest,
        device_count=device_count,
    )


@router.put("/{plant_id}", response_model=PlantResponse)
async def update_plant(
    plant_id: str,
    request: PlantUpdate,
    db: asyncpg.Connection = Depends(get_db),
) -> PlantResponse:
    """
    Update a plant's fields.
    
    Supports partial updates - only provided fields will be updated.
    
    Args:
        plant_id: Plant ID to update
        request: Update request with optional name, species, and thresholds
    """
    # Convert thresholds model to dict for storage
    thresholds_dict = None
    if request.thresholds is not None:
        thresholds_dict = request.thresholds.model_dump()
    
    # Update plant in database
    plant_data = await plant_repo.update_plant(
        db,
        plant_id=plant_id,
        name=request.name,
        species=request.species,
        thresholds=thresholds_dict,
    )
    
    if not plant_data:
        raise HTTPException(status_code=404, detail="Plant not found")
    
    # Get device count
    device_count = await plant_repo.get_plant_device_count(db, plant_id)
    
    return PlantResponse(
        id=plant_data["id"],
        name=plant_data["name"],
        species=plant_data["species"],
        thresholds=plant_data["thresholds"],
        created_at=plant_data["created_at"],
        latest_telemetry=None,
        device_count=device_count,
    )


@router.delete("/{plant_id}", status_code=204)
async def delete_plant(
    plant_id: str,
    db: asyncpg.Connection = Depends(get_db),
) -> Response:
    """
    Delete a plant by ID.

    This will also unassign all devices from the plant (set plant_id to NULL).

    Args:
        plant_id: Plant ID to delete
    """
    deleted = await plant_repo.delete_plant(db, plant_id)

    if not deleted:
        raise HTTPException(status_code=404, detail="Plant not found")

    return Response(status_code=204)


@router.get("/{plant_id}/devices", response_model=DeviceListResponse)
async def get_plant_devices(
    plant_id: str,
    db: asyncpg.Connection = Depends(get_db),
) -> DeviceListResponse:
    """
    List all devices associated with a plant.

    Args:
        plant_id: Plant ID to get devices for
    """
    # Verify plant exists
    plant = await plant_repo.get_plant_by_id(db, plant_id)
    if not plant:
        raise HTTPException(status_code=404, detail="Plant not found")

    # Get devices for this plant
    devices_data = await device_repo.get_devices_by_plant(db, plant_id)

    devices = [
        DeviceResponse(
            id=d["id"],
            mac_address=d["mac_address"],
            mqtt_username=d["mqtt_username"],
            plant_id=d["plant_id"],
            status=d["status"],
            firmware_version=d["firmware_version"],
            sensor_types=d["sensor_types"],
            last_seen_at=d["last_seen_at"],
            created_at=d["created_at"],
        )
        for d in devices_data
    ]

    return DeviceListResponse(devices=devices, total=len(devices))


@router.get("/{plant_id}/history", response_model=TelemetryHistoryResponse)
async def get_plant_history(
    plant_id: str,
    hours: int = 24,
    db: asyncpg.Connection = Depends(get_db),
) -> TelemetryHistoryResponse:
    """
    Get telemetry history for a plant.

    Args:
        plant_id: Plant ID to get history for
        hours: Number of hours of history to retrieve (default: 24)
    """
    # Verify plant exists
    plant = await plant_repo.get_plant_by_id(db, plant_id)
    if not plant:
        raise HTTPException(status_code=404, detail="Plant not found")

    # Calculate time range
    end_time = datetime.now()
    start_time = end_time - timedelta(hours=hours)

    # Get telemetry history
    records_data = await telemetry_repo.get_history(
        db,
        plant_id=plant_id,
        start_time=start_time,
        end_time=end_time,
        limit=10000,  # High limit for history queries
    )

    # Convert to response models
    records = [
        TelemetryRecord(
            time=r["time"],
            device_id=r["device_id"],
            plant_id=r["plant_id"],
            soil_moisture=r["soil_moisture"],
            temperature=r["temperature"],
            humidity=r["humidity"],
            light_level=r["light_level"],
        )
        for r in records_data
    ]

    return TelemetryHistoryResponse(
        records=records,
        count=len(records),
    )


@router.post("/{plant_id}/analyze", response_model=CarePlanResponse)
async def analyze_plant(
    plant_id: str,
    db: asyncpg.Connection = Depends(get_db),
) -> CarePlanResponse:
    """
    Generate a new care plan for a plant using LLM.

    This endpoint:
    1. Retrieves the plant details and current sensor data
    2. Analyzes 24-hour historical trends
    3. Uses the configured LLM to generate personalized care recommendations
    4. Stores the care plan in the database
    5. Returns the generated care plan

    Args:
        plant_id: Plant ID to analyze

    Returns:
        Generated care plan

    Raises:
        404: Plant not found
        503: LLM not configured or unavailable
    """
    # Verify plant exists
    plant = await plant_repo.get_plant_by_id(db, plant_id)
    if not plant:
        raise HTTPException(status_code=404, detail="Plant not found")

    # Get LLM configuration
    llm_config_str = await settings_repo.get_setting(db, "llm_config")
    if not llm_config_str:
        raise HTTPException(
            status_code=503,
            detail="LLM not configured. Please configure LLM settings first.",
        )

    # Decrypt LLM config
    encryption_key = os.getenv("ENCRYPTION_KEY", "default-encryption-key-for-dev")
    encryption_service = EncryptionService(encryption_key)

    try:
        llm_config = json.loads(encryption_service.decrypt(llm_config_str))
    except Exception as e:
        raise HTTPException(
            status_code=503,
            detail=f"Failed to decrypt LLM configuration: {str(e)}",
        )

    # Get current readings
    current_readings = {}
    latest_telemetry = await telemetry_repo.get_latest_by_plant(db, plant_id)
    if latest_telemetry:
        if latest_telemetry.get("soil_moisture") is not None:
            current_readings["soil_moisture"] = latest_telemetry["soil_moisture"]
        if latest_telemetry.get("temperature") is not None:
            current_readings["temperature"] = latest_telemetry["temperature"]
        if latest_telemetry.get("humidity") is not None:
            current_readings["humidity"] = latest_telemetry["humidity"]
        if latest_telemetry.get("light_level") is not None:
            current_readings["light_level"] = latest_telemetry["light_level"]

    # Get 24-hour history for trends
    end_time = datetime.now()
    start_time = end_time - timedelta(hours=24)
    history = await telemetry_repo.get_history(
        db,
        plant_id=plant_id,
        start_time=start_time,
        end_time=end_time,
        limit=10000,
    )

    # Calculate history summary
    history_summary = {}
    if history:
        # Calculate moisture stats
        moisture_values = [
            h["soil_moisture"] for h in history if h.get("soil_moisture") is not None
        ]
        if moisture_values:
            history_summary["moisture"] = {
                "avg": round(sum(moisture_values) / len(moisture_values), 1),
                "min": round(min(moisture_values), 1),
                "max": round(max(moisture_values), 1),
            }

        # Calculate temperature stats
        temp_values = [
            h["temperature"] for h in history if h.get("temperature") is not None
        ]
        if temp_values:
            history_summary["temperature"] = {
                "avg": round(sum(temp_values) / len(temp_values), 1),
                "min": round(min(temp_values), 1),
                "max": round(max(temp_values), 1),
            }

        # Calculate humidity stats
        humidity_values = [
            h["humidity"] for h in history if h.get("humidity") is not None
        ]
        if humidity_values:
            history_summary["humidity"] = {
                "avg": round(sum(humidity_values) / len(humidity_values), 1),
                "min": round(min(humidity_values), 1),
                "max": round(max(humidity_values), 1),
            }

    # Initialize LLM service
    try:
        llm_service = LLMService(
            provider=llm_config["provider"],
            api_key=llm_config["api_key"],
            model=llm_config["model"],
        )
    except Exception as e:
        raise HTTPException(
            status_code=503,
            detail=f"Failed to initialize LLM service: {str(e)}",
        )

    # Generate care plan
    try:
        care_plan = await llm_service.generate_care_plan(
            plant_name=plant["name"],
            species=plant.get("species"),
            current_readings=current_readings,
            history_summary=history_summary,
            thresholds=plant.get("thresholds"),
        )
    except TimeoutError:
        raise HTTPException(
            status_code=503,
            detail="LLM request timed out. Please try again.",
        )
    except Exception as e:
        raise HTTPException(
            status_code=503,
            detail=f"Failed to generate care plan: {str(e)}",
        )

    # Save care plan to database
    await care_plan_repo.save_care_plan(db, plant_id, care_plan)

    # Return response
    return CarePlanResponse(
        plant_id=plant["id"],
        plant_name=plant["name"],
        species=plant.get("species"),
        care_plan=care_plan,
        last_generated=care_plan.generated_at,
    )


@router.get("/{plant_id}/care-plan", response_model=CarePlanResponse)
async def get_care_plan(
    plant_id: str,
    db: asyncpg.Connection = Depends(get_db),
) -> CarePlanResponse:
    """
    Get the stored care plan for a plant.

    Args:
        plant_id: Plant ID

    Returns:
        Stored care plan or null if no plan exists

    Raises:
        404: Plant not found
    """
    # Verify plant exists
    plant = await plant_repo.get_plant_by_id(db, plant_id)
    if not plant:
        raise HTTPException(status_code=404, detail="Plant not found")

    # Get stored care plan
    care_plan = await care_plan_repo.get_care_plan(db, plant_id)

    return CarePlanResponse(
        plant_id=plant["id"],
        plant_name=plant["name"],
        species=plant.get("species"),
        care_plan=care_plan,
        last_generated=care_plan.generated_at if care_plan else None,
    )


@router.post("/{plant_id}/health-check", response_model=PlantHealthCheckResponse)
async def health_check_plant(
    plant_id: str,
    db: asyncpg.Connection = Depends(get_db),
) -> PlantHealthCheckResponse:
    """
    Perform a health check on a plant with historical trend analysis.

    This endpoint:
    1. Retrieves current and historical (24h) sensor readings
    2. Analyzes trends (rising/falling/stable)
    3. Compares against thresholds to identify issues
    4. Uses LLM for species-specific recommendations based on trends

    Args:
        plant_id: Plant ID to check

    Returns:
        Health check response with status, issues, and recommendations
    """
    # Verify plant exists
    plant = await plant_repo.get_plant_by_id(db, plant_id)
    if not plant:
        raise HTTPException(status_code=404, detail="Plant not found")

    # Get current readings
    latest_telemetry = await telemetry_repo.get_latest_by_plant(db, plant_id)

    # Get 24-hour history for trend analysis
    end_time = datetime.now()
    start_time = end_time - timedelta(hours=24)
    history = await telemetry_repo.get_history(
        db, plant_id=plant_id, start_time=start_time, end_time=end_time, limit=1000
    )

    # Analyze trends from historical data
    trends = _analyze_trends(history)

    # Get stored care plan
    care_plan = await care_plan_repo.get_care_plan(db, plant_id)
    has_care_plan = care_plan is not None
    care_plan_age_hours = None
    if care_plan:
        age = datetime.now() - care_plan.generated_at
        care_plan_age_hours = round(age.total_seconds() / 3600, 1)

    # Evaluate thresholds to identify issues
    issues = _evaluate_health_issues(
        telemetry=latest_telemetry,
        thresholds=plant.get("thresholds"),
    )

    # Determine overall status
    status = _determine_health_status(issues)

    # Generate recommendations with trend analysis
    recommendations = await _generate_recommendations_with_llm(
        db=db,
        plant_name=plant["name"],
        species=plant.get("species"),
        issues=issues,
        care_plan=care_plan,
        telemetry=latest_telemetry,
        thresholds=plant.get("thresholds"),
        trends=trends,
    )

    # Convert trends to TrendSummary objects for response
    trend_summaries = _format_trends_for_response(trends)

    return PlantHealthCheckResponse(
        plant_id=plant["id"],
        plant_name=plant["name"],
        status=status,
        issues=issues,
        recommendations=recommendations,
        trends=trend_summaries,
        checked_at=datetime.now(),
        has_care_plan=has_care_plan,
        care_plan_age_hours=care_plan_age_hours,
    )


def _format_trends_for_response(trends: dict) -> list[TrendSummary]:
    """Convert trends dict to list of TrendSummary objects with human-readable summaries."""
    if not trends:
        return []

    summaries = []
    metric_labels = {
        "soil_moisture": ("Soil Moisture", "%"),
        "temperature": ("Temperature", "°C"),
        "humidity": ("Humidity", "%"),
        "light_level": ("Light", " lux"),
    }

    for metric, data in trends.items():
        label, unit = metric_labels.get(metric, (metric.replace("_", " ").title(), ""))
        direction = data.get("direction", "stable")
        current = data.get("current", 0)
        min_v = data.get("min", 0)
        max_v = data.get("max", 0)
        change = data.get("change_percent", 0)

        # Build human-readable summary
        if direction == "stable":
            summary = f"Stable at {current}{unit} (24h range: {min_v}-{max_v}{unit})"
        elif direction == "rising":
            summary = f"Rising {abs(change):.0f}% to {current}{unit} (24h range: {min_v}-{max_v}{unit})"
        else:  # falling
            summary = f"Falling {abs(change):.0f}% to {current}{unit} (24h range: {min_v}-{max_v}{unit})"

        summaries.append(TrendSummary(
            metric=metric,
            direction=direction,
            change_percent=change,
            current=current,
            min_24h=min_v,
            max_24h=max_v,
            summary=summary,
        ))

    return summaries


def _analyze_trends(history: list[dict]) -> dict:
    """
    Analyze 24-hour trends from historical telemetry data.

    Returns dict with trend info for each metric:
    - direction: 'rising', 'falling', 'stable'
    - change_percent: percentage change over period
    - avg: average value
    - min: minimum value
    - max: maximum value
    """
    if not history or len(history) < 2:
        return {}

    trends = {}
    metrics = ["soil_moisture", "temperature", "humidity", "light_level"]

    for metric in metrics:
        values = [h[metric] for h in history if h.get(metric) is not None]
        if len(values) < 2:
            continue

        # Values are ordered DESC by time, so first is newest, last is oldest
        newest = values[0]
        oldest = values[-1]
        avg_val = sum(values) / len(values)
        min_val = min(values)
        max_val = max(values)

        # Calculate change
        if oldest != 0:
            change_pct = ((newest - oldest) / oldest) * 100
        else:
            change_pct = 0

        # Determine direction (>5% change = significant)
        if change_pct > 5:
            direction = "rising"
        elif change_pct < -5:
            direction = "falling"
        else:
            direction = "stable"

        trends[metric] = {
            "direction": direction,
            "change_percent": round(change_pct, 1),
            "current": newest,
            "avg": round(avg_val, 1),
            "min": round(min_val, 1),
            "max": round(max_val, 1),
        }

    return trends


def _evaluate_health_issues(
    telemetry: dict | None,
    thresholds: dict | None,
) -> list[HealthIssue]:
    """Evaluate current readings against thresholds to identify issues."""
    issues = []

    # Check if we have ANY sensor data
    has_any_reading = False
    if telemetry:
        for key in ["soil_moisture", "temperature", "humidity", "light_level"]:
            if telemetry.get(key) is not None:
                has_any_reading = True
                break

    if not has_any_reading:
        issues.append(HealthIssue(
            metric="data",
            severity="warning",
            current_value=None,
            threshold_violated=None,
            message="No sensor data received - check device connection",
        ))
        return issues

    # If no thresholds configured, we'll let LLM evaluate based on species
    # Only check against thresholds if they're explicitly set
    if not thresholds:
        return issues  # No issues from thresholds - LLM will provide guidance

    metric_configs = [
        ("soil_moisture", "soil_moisture", "%"),
        ("temperature", "temperature", "°C"),
        ("humidity", "humidity", "%"),
        ("light_level", "light_level", " lux"),
    ]

    for metric_key, threshold_key, unit in metric_configs:
        value = telemetry.get(metric_key)
        if value is None:
            continue  # Missing sensor is fine, not an issue

        threshold_config = thresholds.get(threshold_key, {})
        if not threshold_config:
            continue  # No threshold for this metric

        min_val = threshold_config.get("min")
        max_val = threshold_config.get("max")

        if min_val is not None and value < min_val:
            deviation = (min_val - value) / min_val if min_val != 0 else 0
            severity = "critical" if deviation > 0.3 else "warning"

            issues.append(HealthIssue(
                metric=metric_key,
                severity=severity,
                current_value=value,
                threshold_violated=f"below min ({min_val}{unit})",
                message=f"{metric_key.replace('_', ' ').title()} is {value}{unit}, below minimum of {min_val}{unit}",
            ))

        elif max_val is not None and value > max_val:
            deviation = (value - max_val) / max_val if max_val != 0 else 0
            severity = "critical" if deviation > 0.3 else "warning"

            issues.append(HealthIssue(
                metric=metric_key,
                severity=severity,
                current_value=value,
                threshold_violated=f"above max ({max_val}{unit})",
                message=f"{metric_key.replace('_', ' ').title()} is {value}{unit}, above maximum of {max_val}{unit}",
            ))

    return issues


def _determine_health_status(issues: list[HealthIssue]) -> HealthStatus:
    """Determine overall health status based on issues."""
    if not issues:
        return HealthStatus.OPTIMAL

    has_critical = any(i.severity == "critical" for i in issues)
    if has_critical:
        return HealthStatus.CRITICAL

    has_warning = any(i.severity == "warning" for i in issues)
    if has_warning:
        return HealthStatus.WARNING

    return HealthStatus.OPTIMAL


async def _generate_recommendations_with_llm(
    db: asyncpg.Connection,
    plant_name: str,
    species: str | None,
    issues: list[HealthIssue],
    care_plan: CarePlan | None,
    telemetry: dict | None,
    thresholds: dict | None,
    trends: dict | None,
) -> list[HealthRecommendation]:
    """
    Generate recommendations using LLM if configured, otherwise use rule-based.

    LLM Response Format (JSON array):
    [
        {"priority": "high|medium|low", "action": "Brief actionable recommendation"}
    ]
    """
    # Try LLM first if configured
    llm_configured = False
    try:
        llm_config_str = await settings_repo.get_setting(db, "llm_config")
        if llm_config_str:
            encryption = EncryptionService(os.getenv("ENCRYPTION_KEY", "dev-key-change-in-prod"))
            llm_config = json.loads(encryption.decrypt(llm_config_str))

            if llm_config.get("api_key"):
                llm_configured = True
                llm_service = LLMService(
                    provider=llm_config["provider"],
                    api_key=llm_config["api_key"],
                    model=llm_config.get("model"),
                )

                # Build current readings dict
                current_readings = {}
                if telemetry:
                    for key in ["soil_moisture", "temperature", "humidity", "light_level"]:
                        if telemetry.get(key) is not None:
                            current_readings[key] = telemetry[key]

                # Convert issues to dict format for LLM
                issues_dict = [
                    {
                        "metric": i.metric,
                        "severity": i.severity,
                        "message": i.message,
                        "current_value": i.current_value,
                    }
                    for i in issues
                ]

                llm_recommendations = await llm_service.generate_health_recommendations(
                    plant_name=plant_name,
                    species=species,
                    issues=issues_dict,
                    current_readings=current_readings,
                    trends=trends,
                )

                if llm_recommendations:
                    return [
                        HealthRecommendation(
                            priority=r.get("priority", "medium"),
                            action=r.get("action", ""),
                        )
                        for r in llm_recommendations
                        if r.get("action")
                    ]
    except Exception as e:
        logger.warning(f"LLM health recommendations failed, using rule-based: {e}")

    # Fall back to rule-based recommendations
    return _generate_recommendations_rule_based(issues, care_plan, trends, llm_configured)


def _generate_recommendations_rule_based(
    issues: list[HealthIssue],
    care_plan: CarePlan | None,
    trends: dict | None,
    llm_configured: bool = False,
) -> list[HealthRecommendation]:
    """
    Generate actionable recommendations based on trend analysis.

    Focuses on what user should DO, not repeating current values.
    """
    recommendations = []

    # Handle data/sensor issues first
    if issues and any(i.metric == "data" for i in issues):
        recommendations.append(HealthRecommendation(
            priority="warning",
            action="Check device connection - no sensor data received",
        ))

    # If we have trends, provide actionable recommendations based on them
    if trends:
        soil_trend = trends.get("soil_moisture", {})
        temp_trend = trends.get("temperature", {})
        humidity_trend = trends.get("humidity", {})

        # Soil moisture recommendations based on trend
        if soil_trend:
            direction = soil_trend.get("direction")
            current = soil_trend.get("current", 0)
            change = abs(soil_trend.get("change_percent", 0))

            if direction == "falling" and current < 40:
                recommendations.append(HealthRecommendation(
                    priority="high",
                    action=f"Water soon - soil moisture dropping ({change:.0f}% decrease in 24h)",
                ))
            elif direction == "falling" and change > 10:
                recommendations.append(HealthRecommendation(
                    priority="medium",
                    action=f"Monitor watering - soil drying faster than usual ({change:.0f}% drop)",
                ))
            elif direction == "rising" and current > 80:
                recommendations.append(HealthRecommendation(
                    priority="medium",
                    action="Reduce watering - soil staying very wet, check drainage",
                ))
            elif direction == "stable" and 40 <= current <= 70:
                recommendations.append(HealthRecommendation(
                    priority="info",
                    action="Watering schedule is working well - maintain current routine",
                ))

        # Temperature recommendations
        if temp_trend:
            current = temp_trend.get("current", 20)
            min_temp = temp_trend.get("min", current)
            max_temp = temp_trend.get("max", current)
            fluctuation = max_temp - min_temp

            if fluctuation > 10:
                recommendations.append(HealthRecommendation(
                    priority="medium",
                    action=f"Temperature fluctuating {fluctuation:.0f}°C in 24h - move away from drafts/vents",
                ))
            elif current < 15:
                recommendations.append(HealthRecommendation(
                    priority="high",
                    action="Too cold - move to warmer location or away from cold window",
                ))
            elif current > 30:
                recommendations.append(HealthRecommendation(
                    priority="high",
                    action="Too hot - move to cooler spot or improve ventilation",
                ))

        # Humidity recommendations
        if humidity_trend:
            current = humidity_trend.get("current", 50)
            direction = humidity_trend.get("direction")

            if current < 40:
                recommendations.append(HealthRecommendation(
                    priority="medium",
                    action="Low humidity - mist leaves or add a pebble tray with water",
                ))
            elif current > 80 and direction == "rising":
                recommendations.append(HealthRecommendation(
                    priority="medium",
                    action="High humidity rising - improve air circulation to prevent mold",
                ))

    # Add care plan tips if we don't have enough recommendations
    if len(recommendations) < 2 and care_plan and care_plan.tips:
        for tip in care_plan.tips[:2]:
            if len(recommendations) < 3:
                recommendations.append(HealthRecommendation(
                    priority="info",
                    action=tip,
                ))

    # If still nothing, suggest LLM for better advice
    if not recommendations and not llm_configured:
        recommendations.append(HealthRecommendation(
            priority="info",
            action="Configure LLM in Settings for species-specific care recommendations",
        ))

    return recommendations[:4]

"""Plant management endpoints."""
import uuid
from datetime import datetime, timedelta

import asyncpg
from fastapi import APIRouter, Depends, HTTPException, Response

from src.db.connection import get_db
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
    
    # Build response with device counts
    plants = []
    for p in plants_data:
        device_count = await plant_repo.get_plant_device_count(db, p["id"])
        plants.append(
            PlantResponse(
                id=p["id"],
                name=p["name"],
                species=p["species"],
                thresholds=p["thresholds"],
                created_at=p["created_at"],
                latest_telemetry=None,  # Not implemented yet (task-010)
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
    
    # Get device count
    device_count = await plant_repo.get_plant_device_count(db, plant_id)
    
    return PlantResponse(
        id=plant_data["id"],
        name=plant_data["name"],
        species=plant_data["species"],
        thresholds=plant_data["thresholds"],
        created_at=plant_data["created_at"],
        latest_telemetry=None,  # Not implemented yet (task-010)
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

"""Plant management endpoints."""
import uuid

import asyncpg
from fastapi import APIRouter, Depends, HTTPException, Response

from src.db.connection import get_db
from src.models.plant import (
    PlantCreate,
    PlantListResponse,
    PlantResponse,
    PlantUpdate,
)
from src.repositories import plant as plant_repo

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

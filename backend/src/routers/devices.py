"""Device registration and management endpoints."""
import secrets
import uuid

import asyncpg
import bcrypt
from fastapi import APIRouter, Depends, HTTPException

from src.config import settings
from src.db.connection import get_db
from src.models import (
    DeviceListResponse,
    DeviceRegisterRequest,
    DeviceRegisterResponse,
    DeviceResponse,
)
from src.repositories import device as device_repo

router = APIRouter(prefix="/api/devices", tags=["devices"])


@router.post("/register", response_model=DeviceRegisterResponse)
async def register_device(
    request: DeviceRegisterRequest,
    db: asyncpg.Connection = Depends(get_db),
) -> DeviceRegisterResponse:
    """
    Register a new IoT device and return MQTT credentials.
    
    This endpoint is idempotent - registering the same MAC address
    multiple times will return the same device credentials.
    """
    # Check if device with this MAC already exists
    existing = await device_repo.get_device_by_mac(db, request.mac_address)
    
    if existing:
        # Return existing device (idempotent)
        # Note: We cannot return the original password as it's hashed
        # This is a limitation - devices should save credentials on first registration
        return DeviceRegisterResponse(
            device_id=existing["id"],
            mqtt_username=existing["mqtt_username"],
            mqtt_password="<stored_securely>",  # Cannot retrieve hashed password
            mqtt_host=settings.mqtt_host,
            mqtt_port=settings.mqtt_port,
        )
    
    # Generate new device credentials
    device_id = str(uuid.uuid4())
    
    # Generate short ID for MQTT username (first 8 chars of UUID)
    short_id = device_id.replace("-", "")[:8]
    mqtt_username = f"device_{short_id}"
    
    # Generate random password (32 characters)
    mqtt_password = secrets.token_urlsafe(32)
    
    # Hash password with bcrypt
    password_hash = bcrypt.hashpw(
        mqtt_password.encode("utf-8"),
        bcrypt.gensalt(),
    ).decode("utf-8")
    
    # Create device in database
    await device_repo.create_device(
        db,
        device_id=device_id,
        mac_address=request.mac_address,
        mqtt_username=mqtt_username,
        mqtt_password_hash=password_hash,
        firmware_version=request.firmware_version,
        sensor_types=request.sensor_types,
    )
    
    # Return credentials (plaintext password only returned here)
    return DeviceRegisterResponse(
        device_id=device_id,
        mqtt_username=mqtt_username,
        mqtt_password=mqtt_password,
        mqtt_host=settings.mqtt_host,
        mqtt_port=settings.mqtt_port,
    )


@router.get("", response_model=DeviceListResponse)
async def list_devices(
    limit: int = 100,
    offset: int = 0,
    db: asyncpg.Connection = Depends(get_db),
) -> DeviceListResponse:
    """
    List all registered devices with pagination.
    
    Args:
        limit: Maximum number of devices to return (default: 100)
        offset: Number of devices to skip (default: 0)
    """
    devices_data, total = await device_repo.list_devices(db, limit=limit, offset=offset)
    
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
    
    return DeviceListResponse(devices=devices, total=total)


@router.delete("/{device_id}")
async def delete_device(
    device_id: str,
    db: asyncpg.Connection = Depends(get_db),
) -> dict:
    """
    Delete a device by ID.
    
    Args:
        device_id: Device ID to delete
    """
    deleted = await device_repo.delete_device(db, device_id)
    
    if not deleted:
        raise HTTPException(status_code=404, detail="Device not found")
    
    return {"message": "Device deleted successfully"}

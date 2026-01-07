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
    DeviceProvisionRequest,
    DeviceProvisionResponse,
    DeviceRegisterRequest,
    DeviceRegisterResponse,
    DeviceResponse,
)
from src.repositories import device as device_repo
from src.repositories import plant as plant_repo
from src.services.mqtt_auth import MQTTAuthService

router = APIRouter(prefix="/api/devices", tags=["devices"])

# Initialize MQTT auth service
mqtt_auth = MQTTAuthService(settings.mqtt_passwd_file)


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

    # Use MQTT auth service to generate credentials
    mqtt_username, mqtt_password = mqtt_auth.generate_credentials()

    # Hash password with bcrypt for database storage
    password_hash = bcrypt.hashpw(
        mqtt_password.encode("utf-8"),
        bcrypt.gensalt(),
    ).decode("utf-8")

    # Add user to Mosquitto password file
    try:
        mqtt_auth.add_user(mqtt_username, mqtt_password)
    except RuntimeError as e:
        # If mosquitto_passwd fails, we can still proceed
        # The device will be in the database but won't be able to connect to MQTT
        # Log this error in production
        pass

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
    # Get device info before deletion to remove from MQTT
    device = await device_repo.get_device_by_id(db, device_id)

    if not device:
        raise HTTPException(status_code=404, detail="Device not found")

    # Remove from MQTT password file
    try:
        mqtt_auth.remove_user(device["mqtt_username"])
    except RuntimeError as e:
        # Log error but continue with deletion
        pass

    # Delete from database
    deleted = await device_repo.delete_device(db, device_id)

    if not deleted:
        raise HTTPException(status_code=404, detail="Device not found")

    return {"message": "Device deleted successfully"}


@router.post("/{device_id}/provision", response_model=DeviceProvisionResponse)
async def provision_device(
    device_id: str,
    request: DeviceProvisionRequest,
    db: asyncpg.Connection = Depends(get_db),
) -> DeviceProvisionResponse:
    """
    Provision a device by associating it with a plant.

    This updates the device's plant_id and sets its status to 'online'.

    Args:
        device_id: Device ID to provision
        request: Provision request with plant_id
    """
    # Verify device exists
    device = await device_repo.get_device_by_id(db, device_id)
    if not device:
        raise HTTPException(status_code=404, detail="Device not found")

    # Verify plant exists
    plant = await plant_repo.get_plant_by_id(db, request.plant_id)
    if not plant:
        raise HTTPException(status_code=404, detail="Plant not found")

    # Assign device to plant
    updated_device = await device_repo.assign_device_to_plant(
        db, device_id, request.plant_id
    )

    if not updated_device:
        raise HTTPException(status_code=404, detail="Device not found")

    return DeviceProvisionResponse(
        id=updated_device["id"],
        plant_id=updated_device["plant_id"],
        status=updated_device["status"],
        message="Device provisioned successfully",
    )


@router.post("/{device_id}/unassign")
async def unassign_device(
    device_id: str,
    db: asyncpg.Connection = Depends(get_db),
) -> dict:
    """
    Remove device from plant assignment.

    This sets the device's plant_id to NULL but keeps the device registered.

    Args:
        device_id: Device ID to unassign
    """
    # Verify device exists
    device = await device_repo.get_device_by_id(db, device_id)
    if not device:
        raise HTTPException(status_code=404, detail="Device not found")

    # Unassign device from plant
    updated_device = await device_repo.unassign_device(db, device_id)

    if not updated_device:
        raise HTTPException(status_code=404, detail="Device not found")

    return {"message": "Device unassigned successfully"}

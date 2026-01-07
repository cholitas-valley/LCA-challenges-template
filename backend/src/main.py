"""PlantOps FastAPI application."""
import asyncio
import json
import logging
from contextlib import asynccontextmanager
from datetime import datetime

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from src.config import settings
from src.db.connection import close_pool, init_pool
from src.exceptions import AuthenticationError, NotFoundError, PlantOpsError, ValidationError
from src.models import ErrorResponse, HealthResponse
from src.routers import devices, plants
from src.services.heartbeat_handler import HeartbeatHandler
from src.services.mqtt_subscriber import MQTTSubscriber, parse_device_id
from src.services.telemetry_handler import TelemetryHandler

logger = logging.getLogger(__name__)

# Initialize handlers
telemetry_handler = TelemetryHandler()
heartbeat_handler = HeartbeatHandler()


async def handle_telemetry(topic: str, payload: bytes) -> None:
    """
    Handle telemetry messages from devices.

    Args:
        topic: MQTT topic (e.g., "devices/abc123/telemetry")
        payload: Message payload (JSON bytes)
    """
    try:
        # Extract device_id from topic
        device_id = parse_device_id(topic)
        if not device_id:
            logger.warning(f"Could not parse device_id from topic: {topic}")
            return

        # Parse JSON payload
        payload_dict = json.loads(payload.decode("utf-8"))

        # Process telemetry
        await telemetry_handler.handle_telemetry(device_id, payload_dict)

    except json.JSONDecodeError as e:
        logger.error(f"Invalid JSON in telemetry payload from {topic}: {e}")
    except Exception as e:
        logger.error(f"Error handling telemetry from {topic}: {e}")


async def handle_heartbeat(topic: str, payload: bytes) -> None:
    """
    Handle heartbeat messages from devices.

    Args:
        topic: MQTT topic (e.g., "devices/abc123/heartbeat")
        payload: Message payload (JSON bytes)
    """
    try:
        # Extract device_id from topic
        device_id = parse_device_id(topic)
        if not device_id:
            logger.warning(f"Could not parse device_id from topic: {topic}")
            return

        # Parse JSON payload (may be empty dict)
        payload_dict = {}
        if payload:
            try:
                payload_dict = json.loads(payload.decode("utf-8"))
            except json.JSONDecodeError:
                logger.warning(f"Invalid JSON in heartbeat from {topic}, using empty payload")

        # Process heartbeat
        await heartbeat_handler.handle_heartbeat(device_id, payload_dict)

    except Exception as e:
        logger.error(f"Error handling heartbeat from {topic}: {e}")


async def offline_checker_task():
    """
    Background task to periodically check for offline devices.

    Runs every 60 seconds and marks devices as offline if they haven't
    sent a heartbeat within the timeout threshold (default 180s).
    """
    while True:
        try:
            await asyncio.sleep(60)
            offline_ids = await heartbeat_handler.check_offline_devices()
            # Note: Alerting will be handled in task-013
            if offline_ids:
                logger.info(f"Detected {len(offline_ids)} offline devices")
        except asyncio.CancelledError:
            logger.info("Offline checker task cancelled")
            break
        except Exception as e:
            logger.error(f"Error in offline checker task: {e}")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan handler for startup and shutdown."""
    # Startup: Initialize database pool
    await init_pool()

    # Startup: Initialize MQTT subscriber
    mqtt = MQTTSubscriber(
        host=settings.mqtt_host,
        port=settings.mqtt_port,
        username=settings.mqtt_backend_username,
        password=settings.mqtt_backend_password,
    )

    try:
        await mqtt.connect()
        mqtt.register_handler("devices/+/telemetry", handle_telemetry)
        mqtt.register_handler("devices/+/heartbeat", handle_heartbeat)

        # Start MQTT listener in background
        mqtt_task = asyncio.create_task(mqtt.start())
        logger.info("MQTT subscriber started")

        # Start offline checker in background
        offline_task = asyncio.create_task(offline_checker_task())
        logger.info("Offline checker task started")

        # Store instances in app state for potential access
        app.state.mqtt = mqtt
        app.state.mqtt_task = mqtt_task
        app.state.offline_task = offline_task

        yield

        # Shutdown: Cancel offline checker
        offline_task.cancel()
        try:
            await offline_task
        except asyncio.CancelledError:
            pass

        # Shutdown: Disconnect MQTT
        await mqtt.disconnect()

    except Exception as e:
        logger.error(f"Failed to start MQTT subscriber: {e}")
        # Continue startup even if MQTT fails (allows API to run)
        yield

    # Shutdown: Close database pool
    await close_pool()


app = FastAPI(
    title="PlantOps API",
    description="IoT plant monitoring and care advisor",
    version="0.1.0",
    lifespan=lifespan,
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure appropriately for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Exception handlers
@app.exception_handler(NotFoundError)
async def not_found_handler(request: Request, exc: NotFoundError) -> JSONResponse:
    """Handle NotFoundError exceptions."""
    return JSONResponse(
        status_code=404,
        content=ErrorResponse(error="Not Found", detail=str(exc)).model_dump(),
    )


@app.exception_handler(ValidationError)
async def validation_error_handler(request: Request, exc: ValidationError) -> JSONResponse:
    """Handle ValidationError exceptions."""
    return JSONResponse(
        status_code=422,
        content=ErrorResponse(error="Validation Error", detail=str(exc)).model_dump(),
    )


@app.exception_handler(AuthenticationError)
async def authentication_error_handler(request: Request, exc: AuthenticationError) -> JSONResponse:
    """Handle AuthenticationError exceptions."""
    return JSONResponse(
        status_code=401,
        content=ErrorResponse(error="Authentication Failed", detail=str(exc)).model_dump(),
    )


@app.exception_handler(PlantOpsError)
async def plantops_error_handler(request: Request, exc: PlantOpsError) -> JSONResponse:
    """Handle generic PlantOpsError exceptions."""
    return JSONResponse(
        status_code=500,
        content=ErrorResponse(error="Internal Error", detail=str(exc)).model_dump(),
    )


# Include routers
app.include_router(devices.router)
app.include_router(plants.router)


# Health endpoint
@app.get("/api/health", response_model=HealthResponse)
async def health() -> HealthResponse:
    """Health check endpoint."""
    return HealthResponse(
        status="healthy",
        timestamp=datetime.now(),
        version="0.1.0",
    )

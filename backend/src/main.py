"""PlantOps FastAPI application."""
import asyncio
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
from src.services.mqtt_subscriber import MQTTSubscriber

logger = logging.getLogger(__name__)


async def handle_telemetry(topic: str, payload: bytes) -> None:
    """
    Handle telemetry messages from devices.

    Args:
        topic: MQTT topic (e.g., "devices/abc123/telemetry")
        payload: Message payload (JSON bytes)
    """
    # TODO: Implement in task-010
    logger.info(f"Received telemetry on {topic}: {len(payload)} bytes")


async def handle_heartbeat(topic: str, payload: bytes) -> None:
    """
    Handle heartbeat messages from devices.

    Args:
        topic: MQTT topic (e.g., "devices/abc123/heartbeat")
        payload: Message payload
    """
    # TODO: Implement heartbeat handling
    logger.info(f"Received heartbeat on {topic}: {len(payload)} bytes")


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

        # Store mqtt instance in app state for potential access
        app.state.mqtt = mqtt
        app.state.mqtt_task = mqtt_task

        yield

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

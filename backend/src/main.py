"""PlantOps FastAPI application."""
from contextlib import asynccontextmanager
from datetime import datetime

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from src.db.connection import close_pool, init_pool
from src.exceptions import AuthenticationError, NotFoundError, PlantOpsError, ValidationError
from src.models import ErrorResponse, HealthResponse
from src.routers import devices


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan handler for startup and shutdown."""
    # Startup: Initialize database pool
    await init_pool()
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


# Health endpoint
@app.get("/api/health", response_model=HealthResponse)
async def health() -> HealthResponse:
    """Health check endpoint."""
    return HealthResponse(
        status="healthy",
        timestamp=datetime.now(),
        version="0.1.0",
    )

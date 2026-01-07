"""Common Pydantic models for PlantOps API."""
from datetime import datetime

from pydantic import BaseModel


class HealthResponse(BaseModel):
    """Health check response model."""
    
    status: str
    timestamp: datetime
    version: str


class ErrorResponse(BaseModel):
    """Error response model."""
    
    error: str
    detail: str | None = None

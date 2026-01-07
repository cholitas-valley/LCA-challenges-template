"""Settings-related Pydantic models."""
from datetime import datetime
from enum import Enum

from pydantic import BaseModel


class LLMProvider(str, Enum):
    """Supported LLM providers."""
    ANTHROPIC = "anthropic"
    OPENAI = "openai"


class LLMSettingsUpdate(BaseModel):
    """Request model for updating LLM settings."""
    provider: LLMProvider
    api_key: str
    model: str | None = None  # Default based on provider


class LLMSettingsResponse(BaseModel):
    """Response model for LLM settings."""
    provider: LLMProvider
    model: str
    api_key_set: bool  # True if key is configured
    api_key_masked: str | None  # Last 4 chars only, e.g., "...abc123"
    updated_at: datetime | None


class LLMTestResponse(BaseModel):
    """Response model for LLM API test."""
    success: bool
    message: str
    latency_ms: int | None = None

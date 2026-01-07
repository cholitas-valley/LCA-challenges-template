"""Settings router for API endpoints."""
import json
import logging
import time
from datetime import datetime

import asyncpg
import httpx
from fastapi import APIRouter, Depends, HTTPException

from src.config import settings as app_settings
from src.db.connection import get_db
from src.models.settings import (
    LLMProvider,
    LLMSettingsResponse,
    LLMSettingsUpdate,
    LLMTestResponse,
)
from src.repositories import settings as settings_repo
from src.services.encryption import EncryptionService

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/settings", tags=["settings"])

# Default models for each provider
DEFAULT_MODELS = {
    LLMProvider.ANTHROPIC: "claude-sonnet-4-20250514",
    LLMProvider.OPENAI: "gpt-4o",
}

# Initialize encryption service
encryption = EncryptionService(app_settings.encryption_key)


def mask_api_key(api_key: str) -> str:
    """
    Mask API key, showing only last 4 characters.

    Args:
        api_key: Full API key

    Returns:
        Masked key like "...abc123"
    """
    if len(api_key) <= 4:
        return "..." + api_key
    return "..." + api_key[-4:]


@router.get("/llm", response_model=LLMSettingsResponse)
async def get_llm_settings(
    db: asyncpg.Connection = Depends(get_db),
) -> LLMSettingsResponse:
    """
    Get current LLM configuration.

    Returns LLM settings with masked API key. If no settings are configured,
    returns defaults (Anthropic with no key set).
    """
    result = await settings_repo.get_setting_with_timestamp(db, "llm_config")

    if result is None:
        # No settings configured, return defaults
        return LLMSettingsResponse(
            provider=LLMProvider.ANTHROPIC,
            model=DEFAULT_MODELS[LLMProvider.ANTHROPIC],
            api_key_set=False,
            api_key_masked=None,
            updated_at=None,
        )

    encrypted_value, updated_at = result

    try:
        # Decrypt and parse settings
        decrypted = encryption.decrypt(encrypted_value)
        config = json.loads(decrypted)

        provider = LLMProvider(config["provider"])
        model = config["model"]
        api_key = config["api_key"]

        return LLMSettingsResponse(
            provider=provider,
            model=model,
            api_key_set=True,
            api_key_masked=mask_api_key(api_key),
            updated_at=updated_at,
        )

    except Exception as e:
        logger.error(f"Failed to decrypt/parse LLM settings: {e}")
        raise HTTPException(
            status_code=500,
            detail="Failed to retrieve LLM settings",
        )


@router.put("/llm", response_model=LLMSettingsResponse)
async def update_llm_settings(
    settings_update: LLMSettingsUpdate,
    db: asyncpg.Connection = Depends(get_db),
) -> LLMSettingsResponse:
    """
    Update LLM provider and API key.

    API key is encrypted before storing in database.
    """
    # Determine model (use provided or default)
    model = settings_update.model
    if model is None:
        model = DEFAULT_MODELS[settings_update.provider]

    # Create config dict
    config = {
        "provider": settings_update.provider.value,
        "model": model,
        "api_key": settings_update.api_key,
    }

    try:
        # Encrypt config as JSON
        json_str = json.dumps(config)
        encrypted = encryption.encrypt(json_str)

        # Store in database
        await settings_repo.set_setting(db, "llm_config", encrypted)

        # Return response with masked key
        return LLMSettingsResponse(
            provider=settings_update.provider,
            model=model,
            api_key_set=True,
            api_key_masked=mask_api_key(settings_update.api_key),
            updated_at=datetime.now(),
        )

    except Exception as e:
        logger.error(f"Failed to update LLM settings: {e}")
        raise HTTPException(
            status_code=500,
            detail="Failed to update LLM settings",
        )


@router.post("/llm/test", response_model=LLMTestResponse)
async def test_llm_settings(
    settings_update: LLMSettingsUpdate,
) -> LLMTestResponse:
    """
    Test LLM API key by making a simple API call.

    Does not store the settings. Returns success/failure with timing.
    Timeout after 10 seconds.
    """
    provider = settings_update.provider
    api_key = settings_update.api_key
    model = settings_update.model or DEFAULT_MODELS[provider]

    start_time = time.time()

    try:
        if provider == LLMProvider.ANTHROPIC:
            # Test Anthropic API
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.post(
                    "https://api.anthropic.com/v1/messages",
                    headers={
                        "x-api-key": api_key,
                        "anthropic-version": "2023-06-01",
                        "content-type": "application/json",
                    },
                    json={
                        "model": model,
                        "max_tokens": 10,
                        "messages": [{"role": "user", "content": "Hi"}],
                    },
                )

                elapsed_ms = int((time.time() - start_time) * 1000)

                if response.status_code == 200:
                    return LLMTestResponse(
                        success=True,
                        message="Anthropic API key is valid",
                        latency_ms=elapsed_ms,
                    )
                elif response.status_code == 401:
                    return LLMTestResponse(
                        success=False,
                        message="Invalid API key",
                        latency_ms=elapsed_ms,
                    )
                else:
                    return LLMTestResponse(
                        success=False,
                        message=f"API error: {response.status_code}",
                        latency_ms=elapsed_ms,
                    )

        elif provider == LLMProvider.OPENAI:
            # Test OpenAI API
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.post(
                    "https://api.openai.com/v1/chat/completions",
                    headers={
                        "Authorization": f"Bearer {api_key}",
                        "Content-Type": "application/json",
                    },
                    json={
                        "model": model,
                        "max_tokens": 10,
                        "messages": [{"role": "user", "content": "Hi"}],
                    },
                )

                elapsed_ms = int((time.time() - start_time) * 1000)

                if response.status_code == 200:
                    return LLMTestResponse(
                        success=True,
                        message="OpenAI API key is valid",
                        latency_ms=elapsed_ms,
                    )
                elif response.status_code == 401:
                    return LLMTestResponse(
                        success=False,
                        message="Invalid API key",
                        latency_ms=elapsed_ms,
                    )
                else:
                    return LLMTestResponse(
                        success=False,
                        message=f"API error: {response.status_code}",
                        latency_ms=elapsed_ms,
                    )

        else:
            raise HTTPException(
                status_code=400,
                detail=f"Unsupported provider: {provider}",
            )

    except httpx.TimeoutException:
        elapsed_ms = int((time.time() - start_time) * 1000)
        return LLMTestResponse(
            success=False,
            message="Request timed out (>10s)",
            latency_ms=elapsed_ms,
        )
    except Exception as e:
        elapsed_ms = int((time.time() - start_time) * 1000)
        logger.error(f"Error testing LLM API: {e}")
        return LLMTestResponse(
            success=False,
            message=f"Error: {str(e)}",
            latency_ms=elapsed_ms,
        )

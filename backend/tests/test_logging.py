"""Tests for structured logging and correlation middleware."""
import uuid

import pytest
from httpx import AsyncClient

from src.logging_config import get_logger, setup_logging


def test_setup_logging_does_not_raise() -> None:
    """Test setup_logging configures without error."""
    setup_logging()


def test_get_logger_returns_bound_logger() -> None:
    """Test get_logger returns a structlog logger."""
    setup_logging()
    logger = get_logger("test")
    assert logger is not None
    # Logger should be callable
    logger.info("test_message", key="value")


@pytest.mark.asyncio
async def test_correlation_middleware_adds_header(async_client: AsyncClient) -> None:
    """Test correlation middleware adds X-Correlation-ID header."""
    response = await async_client.get("/api/health")
    assert "X-Correlation-ID" in response.headers
    # Should be a valid UUID
    correlation_id = response.headers["X-Correlation-ID"]
    uuid.UUID(correlation_id)  # Will raise ValueError if invalid


@pytest.mark.asyncio
async def test_correlation_middleware_preserves_incoming_id(async_client: AsyncClient) -> None:
    """Test correlation middleware preserves incoming correlation ID."""
    test_id = "test-correlation-123"
    response = await async_client.get("/api/health", headers={"X-Correlation-ID": test_id})
    assert response.headers["X-Correlation-ID"] == test_id

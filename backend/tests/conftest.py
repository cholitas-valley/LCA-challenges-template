"""Pytest configuration and fixtures."""
from unittest.mock import AsyncMock

import pytest
from httpx import ASGITransport, AsyncClient

from src.db.connection import get_db
from src.main import app


async def mock_get_db():
    """Override database dependency with a mock."""
    yield AsyncMock()


@pytest.fixture
async def async_client() -> AsyncClient:
    """Create an async test client for the FastAPI app."""
    # Override the database dependency
    app.dependency_overrides[get_db] = mock_get_db

    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://test"
    ) as client:
        yield client

    # Clean up
    app.dependency_overrides.clear()

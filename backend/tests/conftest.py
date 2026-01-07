"""Pytest configuration and fixtures."""
import pytest
from httpx import ASGITransport, AsyncClient

from src.main import app


@pytest.fixture
async def async_client() -> AsyncClient:
    """Create an async test client for the FastAPI app."""
    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://test"
    ) as client:
        yield client


@pytest.fixture
def test_client() -> AsyncClient:
    """Synchronous fixture that returns an async client instance."""
    return AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://test"
    )

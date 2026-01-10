"""Tests for plant CRUD endpoints."""
from datetime import datetime
from unittest.mock import patch

import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_create_plant_with_name_only(async_client: AsyncClient) -> None:
    """Test creating a plant with only a name."""
    with patch("src.repositories.plant.create_plant") as mock_create, \
         patch("src.repositories.plant.get_plant_device_count") as mock_count:
        # Mock database response
        mock_create.return_value = {
            "id": "plant-123",
            "name": "Basil",
            "species": None,
            "thresholds": None,
            "created_at": datetime.now(),
        }
        mock_count.return_value = 0

        response = await async_client.post(
            "/api/plants",
            json={"name": "Basil"},
        )

        assert response.status_code == 201
        data = response.json()
        assert data["name"] == "Basil"
        assert data["species"] is None
        assert data["thresholds"] is None
        assert "id" in data
        assert "created_at" in data
        assert data["device_count"] == 0
        assert data["latest_telemetry"] is None


@pytest.mark.asyncio
async def test_create_plant_with_species_and_thresholds(async_client: AsyncClient) -> None:
    """Test creating a plant with species and thresholds."""
    with patch("src.repositories.plant.create_plant") as mock_create, \
         patch("src.repositories.plant.get_plant_device_count") as mock_count:
        # Mock database response with thresholds
        mock_create.return_value = {
            "id": "plant-456",
            "name": "Tomato Plant",
            "species": "Solanum lycopersicum",
            "thresholds": {
                "soil_moisture": {"min": 30.0, "max": 70.0},
                "temperature": {"min": 15.0, "max": 30.0},
                "humidity": None,
                "light_level": None,
            },
            "created_at": datetime.now(),
        }
        mock_count.return_value = 0

        response = await async_client.post(
            "/api/plants",
            json={
                "name": "Tomato Plant",
                "species": "Solanum lycopersicum",
                "thresholds": {
                    "soil_moisture": {"min": 30.0, "max": 70.0},
                    "temperature": {"min": 15.0, "max": 30.0},
                },
            },
        )

        assert response.status_code == 201
        data = response.json()
        assert data["name"] == "Tomato Plant"
        assert data["species"] == "Solanum lycopersicum"
        assert data["thresholds"]["soil_moisture"]["min"] == 30.0
        assert data["thresholds"]["soil_moisture"]["max"] == 70.0
        assert data["thresholds"]["temperature"]["min"] == 15.0
        assert data["thresholds"]["temperature"]["max"] == 30.0


@pytest.mark.asyncio
async def test_list_plants_returns_created_plants(async_client: AsyncClient) -> None:
    """Test listing plants returns created plants."""
    with patch("src.repositories.plant.list_plants") as mock_list, \
         patch("src.repositories.plant.get_plant_device_count") as mock_count, \
         patch("src.repositories.telemetry.get_latest_by_plant") as mock_telemetry:
        # Mock database response with 2 plants
        mock_list.return_value = (
            [
                {
                    "id": "plant-1",
                    "name": "Plant 1",
                    "species": None,
                    "thresholds": None,
                    "created_at": datetime.now(),
                },
                {
                    "id": "plant-2",
                    "name": "Plant 2",
                    "species": None,
                    "thresholds": None,
                    "created_at": datetime.now(),
                },
            ],
            2,
        )
        mock_count.return_value = 0
        mock_telemetry.return_value = None

        response = await async_client.get("/api/plants")

        assert response.status_code == 200
        data = response.json()
        assert "plants" in data
        assert "total" in data
        assert data["total"] == 2
        assert len(data["plants"]) == 2


@pytest.mark.asyncio
async def test_get_single_plant_by_id(async_client: AsyncClient) -> None:
    """Test getting a single plant by ID."""
    with patch("src.repositories.plant.get_plant_by_id") as mock_get, \
         patch("src.repositories.plant.get_plant_device_count") as mock_count, \
         patch("src.repositories.telemetry.get_latest_by_plant") as mock_telemetry:
        # Mock database response
        mock_get.return_value = {
            "id": "plant-mint",
            "name": "Mint",
            "species": "Mentha",
            "thresholds": None,
            "created_at": datetime.now(),
        }
        mock_count.return_value = 0
        mock_telemetry.return_value = None

        response = await async_client.get("/api/plants/plant-mint")

        assert response.status_code == 200
        data = response.json()
        assert data["id"] == "plant-mint"
        assert data["name"] == "Mint"
        assert data["species"] == "Mentha"


@pytest.mark.asyncio
async def test_update_plant_name(async_client: AsyncClient) -> None:
    """Test updating a plant's name."""
    with patch("src.repositories.plant.update_plant") as mock_update, \
         patch("src.repositories.plant.get_plant_device_count") as mock_count:
        # Mock database response
        mock_update.return_value = {
            "id": "plant-abc",
            "name": "New Name",
            "species": None,
            "thresholds": None,
            "created_at": datetime.now(),
        }
        mock_count.return_value = 0

        response = await async_client.put(
            "/api/plants/plant-abc",
            json={"name": "New Name"},
        )

        assert response.status_code == 200
        data = response.json()
        assert data["id"] == "plant-abc"
        assert data["name"] == "New Name"


@pytest.mark.asyncio
async def test_update_plant_thresholds(async_client: AsyncClient) -> None:
    """Test updating a plant's thresholds."""
    with patch("src.repositories.plant.update_plant") as mock_update, \
         patch("src.repositories.plant.get_plant_device_count") as mock_count:
        # Mock database response
        mock_update.return_value = {
            "id": "plant-cactus",
            "name": "Cactus",
            "species": None,
            "thresholds": {
                "soil_moisture": {"min": 10.0, "max": 30.0},
                "light_level": {"min": 1000.0, "max": None},
                "temperature": None,
                "humidity": None,
            },
            "created_at": datetime.now(),
        }
        mock_count.return_value = 0

        response = await async_client.put(
            "/api/plants/plant-cactus",
            json={
                "thresholds": {
                    "soil_moisture": {"min": 10.0, "max": 30.0},
                    "light_level": {"min": 1000.0},
                },
            },
        )

        assert response.status_code == 200
        data = response.json()
        assert data["thresholds"]["soil_moisture"]["min"] == 10.0
        assert data["thresholds"]["soil_moisture"]["max"] == 30.0
        assert data["thresholds"]["light_level"]["min"] == 1000.0


@pytest.mark.asyncio
async def test_delete_plant_returns_204(async_client: AsyncClient) -> None:
    """Test deleting a plant returns 204."""
    with patch("src.repositories.plant.delete_plant") as mock_delete:
        # Mock successful deletion
        mock_delete.return_value = True

        response = await async_client.delete("/api/plants/plant-temp")

        assert response.status_code == 204


@pytest.mark.asyncio
async def test_get_deleted_plant_returns_404(async_client: AsyncClient) -> None:
    """Test getting a deleted plant returns 404."""
    with patch("src.repositories.plant.get_plant_by_id") as mock_get:
        # Mock plant not found
        mock_get.return_value = None

        response = await async_client.get("/api/plants/deleted-plant")

        assert response.status_code == 404


@pytest.mark.asyncio
async def test_get_nonexistent_plant_returns_404(async_client: AsyncClient) -> None:
    """Test getting a non-existent plant returns 404."""
    with patch("src.repositories.plant.get_plant_by_id") as mock_get:
        # Mock plant not found
        mock_get.return_value = None

        response = await async_client.get("/api/plants/nonexistent-id")

        assert response.status_code == 404


@pytest.mark.asyncio
async def test_update_nonexistent_plant_returns_404(async_client: AsyncClient) -> None:
    """Test updating a non-existent plant returns 404."""
    with patch("src.repositories.plant.update_plant") as mock_update:
        # Mock plant not found
        mock_update.return_value = None

        response = await async_client.put(
            "/api/plants/nonexistent-id",
            json={"name": "New Name"},
        )

        assert response.status_code == 404


@pytest.mark.asyncio
async def test_delete_nonexistent_plant_returns_404(async_client: AsyncClient) -> None:
    """Test deleting a non-existent plant returns 404."""
    with patch("src.repositories.plant.delete_plant") as mock_delete:
        # Mock plant not found
        mock_delete.return_value = False

        response = await async_client.delete("/api/plants/nonexistent-id")

        assert response.status_code == 404


@pytest.mark.asyncio
async def test_update_plant_position(async_client: AsyncClient) -> None:
    """Test setting plant position."""
    with patch("src.repositories.plant.update_plant_position") as mock_update_position, \
         patch("src.repositories.plant.get_plant_device_count") as mock_count, \
         patch("src.repositories.telemetry.get_latest_by_plant") as mock_telemetry:
        # Mock database response
        mock_update_position.return_value = {
            "id": "plant-positioned",
            "name": "Positioned Plant",
            "species": None,
            "thresholds": None,
            "position": {"x": 120.0, "y": 80.0},
            "created_at": datetime.now(),
        }
        mock_count.return_value = 0
        mock_telemetry.return_value = None

        response = await async_client.put(
            "/api/plants/plant-positioned/position",
            json={"x": 120.0, "y": 80.0},
        )

        assert response.status_code == 200
        data = response.json()
        assert data["id"] == "plant-positioned"
        assert data["position"]["x"] == 120.0
        assert data["position"]["y"] == 80.0


@pytest.mark.asyncio
async def test_update_position_nonexistent_plant(async_client: AsyncClient) -> None:
    """Test 404 for updating position of non-existent plant."""
    with patch("src.repositories.plant.update_plant_position") as mock_update_position:
        # Mock plant not found
        mock_update_position.return_value = None

        response = await async_client.put(
            "/api/plants/nonexistent-id/position",
            json={"x": 100.0, "y": 200.0},
        )

        assert response.status_code == 404


@pytest.mark.asyncio
async def test_get_plants_includes_position(async_client: AsyncClient) -> None:
    """Test GET /api/plants returns position field."""
    with patch("src.repositories.plant.list_plants") as mock_list, \
         patch("src.repositories.plant.get_plant_device_count") as mock_count, \
         patch("src.repositories.telemetry.get_latest_by_plant") as mock_telemetry:
        # Mock database response with one plant with position, one without
        mock_list.return_value = (
            [
                {
                    "id": "plant-1",
                    "name": "Plant With Position",
                    "species": None,
                    "thresholds": None,
                    "position": {"x": 150.0, "y": 100.0},
                    "created_at": datetime.now(),
                },
                {
                    "id": "plant-2",
                    "name": "Plant Without Position",
                    "species": None,
                    "thresholds": None,
                    "position": None,
                    "created_at": datetime.now(),
                },
            ],
            2,
        )
        mock_count.return_value = 0
        mock_telemetry.return_value = None

        response = await async_client.get("/api/plants")

        assert response.status_code == 200
        data = response.json()
        assert len(data["plants"]) == 2

        # First plant should have position
        assert data["plants"][0]["position"] is not None
        assert data["plants"][0]["position"]["x"] == 150.0
        assert data["plants"][0]["position"]["y"] == 100.0

        # Second plant should have null position
        assert data["plants"][1]["position"] is None

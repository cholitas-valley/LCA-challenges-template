"""Tests for care plan generation."""
import json
from datetime import datetime
from unittest.mock import AsyncMock, MagicMock, patch

import pytest


@pytest.mark.asyncio
async def test_generate_care_plan_success(async_client):
    """Test successful care plan generation."""
    plant_id = "test-plant-id"

    # Mock LLM response
    mock_llm_response = {
        "summary": "Your Snake Plant is healthy with good moisture levels.",
        "watering": {
            "frequency": "Every 2-3 weeks",
            "amount": "Water until it drains from bottom",
            "next_date": "2026-01-25",
        },
        "light": {
            "current": 500,
            "ideal": "Bright indirect light (500-1000 lux)",
            "recommendation": "Current light level is adequate.",
        },
        "humidity": {
            "current": 55.0,
            "ideal": "40-60%",
            "recommendation": "Humidity is perfect.",
        },
        "temperature": {
            "current": 22.5,
            "ideal": "18-30°C",
            "recommendation": "Temperature is in optimal range.",
        },
        "alerts": [],
        "tips": [
            "Snake plants prefer to dry out between waterings",
            "Tolerates low light but grows better in bright indirect light",
        ],
        "generated_at": "2026-01-08T12:00:00",
    }

    # Patch all repository and service calls
    with patch("src.repositories.plant.get_plant_by_id") as mock_get_plant:
        with patch("src.repositories.settings.get_setting") as mock_get_setting:
            with patch("src.repositories.telemetry.get_latest_by_plant") as mock_get_latest:
                with patch("src.repositories.telemetry.get_history") as mock_get_history:
                    with patch("src.repositories.care_plan.save_care_plan") as mock_save:
                        with patch("src.routers.plants.EncryptionService") as mock_enc_class:
                            with patch("src.routers.plants.LLMService") as mock_llm_class:
                                # Setup mocks
                                mock_get_plant.return_value = {
                                    "id": plant_id,
                                    "name": "Snake Plant",
                                    "species": "Sansevieria trifasciata",
                                    "thresholds": {"soil_moisture": {"min": 30, "max": 50}},
                                }

                                mock_get_setting.return_value = "encrypted_config"

                                mock_encryption = MagicMock()
                                mock_encryption.decrypt.return_value = json.dumps({
                                    "provider": "anthropic",
                                    "api_key": "sk-ant-test-key",
                                    "model": "claude-sonnet-4-20250514",
                                })
                                mock_enc_class.return_value = mock_encryption

                                mock_get_latest.return_value = {
                                    "soil_moisture": 45.0,
                                    "temperature": 22.5,
                                    "humidity": 55.0,
                                    "light_level": 500.0,
                                }

                                mock_get_history.return_value = [
                                    {"soil_moisture": 44.0, "temperature": 21.0, "humidity": 54.0},
                                    {"soil_moisture": 45.0, "temperature": 22.0, "humidity": 55.0},
                                ]

                                mock_save.return_value = None

                                # Mock LLM service
                                from src.models.care_plan import CarePlan, CarePlanWatering, CarePlanMetric
                                
                                mock_care_plan = CarePlan(
                                    summary=mock_llm_response["summary"],
                                    watering=CarePlanWatering(**mock_llm_response["watering"]),
                                    light=CarePlanMetric(**mock_llm_response["light"]),
                                    humidity=CarePlanMetric(**mock_llm_response["humidity"]),
                                    temperature=CarePlanMetric(**mock_llm_response["temperature"]),
                                    alerts=mock_llm_response["alerts"],
                                    tips=mock_llm_response["tips"],
                                    generated_at=datetime(2026, 1, 8, 12, 0, 0),
                                )

                                mock_llm_instance = MagicMock()
                                mock_llm_instance.generate_care_plan = AsyncMock(return_value=mock_care_plan)
                                mock_llm_class.return_value = mock_llm_instance

                                # Make request
                                response = await async_client.post(f"/api/plants/{plant_id}/analyze")

    # Verify response
    assert response.status_code == 200
    data = response.json()
    assert data["plant_id"] == plant_id
    assert data["plant_name"] == "Snake Plant"
    assert data["species"] == "Sansevieria trifasciata"
    assert data["care_plan"] is not None
    assert data["care_plan"]["summary"] == mock_llm_response["summary"]
    assert data["care_plan"]["watering"]["frequency"] == "Every 2-3 weeks"
    assert len(data["care_plan"]["tips"]) == 2


@pytest.mark.asyncio
async def test_generate_care_plan_plant_not_found(async_client):
    """Test care plan generation for non-existent plant."""
    plant_id = "non-existent-plant"

    with patch("src.repositories.plant.get_plant_by_id") as mock_get_plant:
        mock_get_plant.return_value = None

        response = await async_client.post(f"/api/plants/{plant_id}/analyze")

    assert response.status_code == 404
    assert response.json()["detail"] == "Plant not found"


@pytest.mark.asyncio
async def test_generate_care_plan_llm_not_configured(async_client):
    """Test care plan generation when LLM not configured."""
    plant_id = "test-plant-id"

    with patch("src.repositories.plant.get_plant_by_id") as mock_get_plant:
        with patch("src.repositories.settings.get_setting") as mock_get_setting:
            mock_get_plant.return_value = {
                "id": plant_id,
                "name": "Snake Plant",
                "species": "Sansevieria trifasciata",
            }

            mock_get_setting.return_value = None

            response = await async_client.post(f"/api/plants/{plant_id}/analyze")

    assert response.status_code == 503
    assert "LLM not configured" in response.json()["detail"]


@pytest.mark.asyncio
async def test_generate_care_plan_llm_timeout(async_client):
    """Test care plan generation when LLM times out."""
    plant_id = "test-plant-id"

    with patch("src.repositories.plant.get_plant_by_id") as mock_get_plant:
        with patch("src.repositories.settings.get_setting") as mock_get_setting:
            with patch("src.repositories.telemetry.get_latest_by_plant") as mock_get_latest:
                with patch("src.repositories.telemetry.get_history") as mock_get_history:
                    with patch("src.routers.plants.EncryptionService") as mock_enc_class:
                        with patch("src.routers.plants.LLMService") as mock_llm_class:
                            mock_get_plant.return_value = {
                                "id": plant_id,
                                "name": "Snake Plant",
                                "species": None,
                            }

                            mock_get_setting.return_value = "encrypted_config"

                            mock_encryption = MagicMock()
                            mock_encryption.decrypt.return_value = json.dumps({
                                "provider": "anthropic",
                                "api_key": "sk-ant-test-key",
                                "model": "claude-sonnet-4-20250514",
                            })
                            mock_enc_class.return_value = mock_encryption

                            mock_get_latest.return_value = {"soil_moisture": 45.0}
                            mock_get_history.return_value = []

                            # Mock LLM service that times out
                            mock_llm_instance = MagicMock()
                            mock_llm_instance.generate_care_plan = AsyncMock(
                                side_effect=TimeoutError("LLM request timed out")
                            )
                            mock_llm_class.return_value = mock_llm_instance

                            response = await async_client.post(f"/api/plants/{plant_id}/analyze")

    assert response.status_code == 503
    assert "timed out" in response.json()["detail"]


@pytest.mark.asyncio
async def test_get_care_plan_exists(async_client):
    """Test retrieving existing care plan."""
    plant_id = "test-plant-id"

    from src.models.care_plan import CarePlan, CarePlanWatering, CarePlanMetric

    care_plan = CarePlan(
        summary="Plant is healthy",
        watering=CarePlanWatering(frequency="Weekly", amount="200ml", next_date=None),
        light=CarePlanMetric(current=500, ideal="Bright", recommendation="Good"),
        humidity=CarePlanMetric(current=55, ideal="50-60%", recommendation="Perfect"),
        temperature=CarePlanMetric(current=22, ideal="18-30°C", recommendation="Optimal"),
        alerts=[],
        tips=["Keep soil moist"],
        generated_at=datetime(2026, 1, 8, 10, 0, 0),
    )

    with patch("src.repositories.plant.get_plant_by_id") as mock_get_plant:
        with patch("src.repositories.care_plan.get_care_plan") as mock_get_care_plan:
            mock_get_plant.return_value = {
                "id": plant_id,
                "name": "Snake Plant",
                "species": "Sansevieria trifasciata",
            }

            mock_get_care_plan.return_value = care_plan

            response = await async_client.get(f"/api/plants/{plant_id}/care-plan")

    assert response.status_code == 200
    data = response.json()
    assert data["plant_id"] == plant_id
    assert data["plant_name"] == "Snake Plant"
    assert data["care_plan"] is not None
    assert data["care_plan"]["summary"] == "Plant is healthy"
    assert data["last_generated"] is not None


@pytest.mark.asyncio
async def test_get_care_plan_not_exists(async_client):
    """Test retrieving care plan when none exists."""
    plant_id = "test-plant-id"

    with patch("src.repositories.plant.get_plant_by_id") as mock_get_plant:
        with patch("src.repositories.care_plan.get_care_plan") as mock_get_care_plan:
            mock_get_plant.return_value = {
                "id": plant_id,
                "name": "Snake Plant",
                "species": None,
            }

            mock_get_care_plan.return_value = None

            response = await async_client.get(f"/api/plants/{plant_id}/care-plan")

    assert response.status_code == 200
    data = response.json()
    assert data["plant_id"] == plant_id
    assert data["care_plan"] is None
    assert data["last_generated"] is None


@pytest.mark.asyncio
async def test_get_care_plan_plant_not_found(async_client):
    """Test retrieving care plan for non-existent plant."""
    plant_id = "non-existent-plant"

    with patch("src.repositories.plant.get_plant_by_id") as mock_get_plant:
        mock_get_plant.return_value = None

        response = await async_client.get(f"/api/plants/{plant_id}/care-plan")

    assert response.status_code == 404
    assert response.json()["detail"] == "Plant not found"


@pytest.mark.asyncio
async def test_llm_service_parse_json_response():
    """Test LLM service JSON parsing."""
    from src.services.llm import LLMService

    # Create service instance
    service = LLMService(
        provider="anthropic",
        api_key="test-key",
        model="claude-sonnet-4-20250514",
    )

    # Test parsing clean JSON
    response = json.dumps({"summary": "Test", "watering": {"frequency": "Daily", "amount": "100ml", "next_date": None}})
    parsed = service._parse_response(response)
    assert parsed["summary"] == "Test"

    # Test parsing JSON wrapped in markdown
    response_md = f"```json\n{response}\n```"
    parsed_md = service._parse_response(response_md)
    assert parsed_md["summary"] == "Test"

    # Test parsing JSON with just backticks
    response_backticks = f"```\n{response}\n```"
    parsed_backticks = service._parse_response(response_backticks)
    assert parsed_backticks["summary"] == "Test"


@pytest.mark.asyncio
async def test_llm_service_invalid_provider():
    """Test LLM service with invalid provider."""
    from src.services.llm import LLMService

    with pytest.raises(ValueError, match="Unsupported provider"):
        LLMService(
            provider="invalid_provider",
            api_key="test-key",
            model="test-model",
        )


@pytest.mark.asyncio
async def test_llm_service_openai_provider():
    """Test LLM service with OpenAI provider."""
    from src.services.llm import LLMService

    service = LLMService(
        provider="openai",
        api_key="sk-test-key",
        model="gpt-4o",
    )

    assert service.provider == "openai"
    assert service.openai_client is not None
    assert service.anthropic_client is None

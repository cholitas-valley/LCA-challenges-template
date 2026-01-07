"""Tests for threshold evaluation and alerting."""
import asyncio
from datetime import datetime, timedelta
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from src.models.plant import PlantThresholds, ThresholdConfig
from src.models.telemetry import TelemetryPayload
from src.repositories import alert as alert_repo
from src.services.threshold_evaluator import ThresholdEvaluator, ThresholdViolation


# Alert Repository Tests

@pytest.mark.asyncio
async def test_create_alert():
    """Test creating an alert in the database."""
    conn_mock = AsyncMock()
    now = datetime.now()

    # Mock the database insert
    conn_mock.fetchrow.return_value = {
        "id": 1,
        "plant_id": "plant-001",
        "device_id": "device-001",
        "metric": "soil_moisture",
        "value": 15.0,
        "threshold": 20.0,
        "direction": "min",
        "sent_at": now,
    }

    alert = await alert_repo.create_alert(
        conn_mock,
        plant_id="plant-001",
        device_id="device-001",
        metric="soil_moisture",
        value=15.0,
        threshold=20.0,
        direction="min",
    )

    assert alert["plant_id"] == "plant-001"
    assert alert["device_id"] == "device-001"
    assert alert["metric"] == "soil_moisture"
    assert alert["value"] == 15.0
    assert alert["threshold"] == 20.0
    assert alert["direction"] == "min"
    assert alert["sent_at"] is not None

    # Verify SQL was called
    conn_mock.fetchrow.assert_called_once()


@pytest.mark.asyncio
async def test_get_latest_alert():
    """Test getting the latest alert for a plant+metric."""
    conn_mock = AsyncMock()
    now = datetime.now()

    # Mock the database query
    conn_mock.fetchrow.return_value = {
        "id": 2,
        "plant_id": "plant-002",
        "device_id": "device-002",
        "metric": "temperature",
        "value": 36.0,
        "threshold": 30.0,
        "direction": "max",
        "sent_at": now,
    }

    latest = await alert_repo.get_latest_alert(conn_mock, "plant-002", "temperature")
    assert latest["value"] == 36.0
    assert latest["metric"] == "temperature"

    # Verify SQL was called with correct parameters
    conn_mock.fetchrow.assert_called_once()


@pytest.mark.asyncio
async def test_get_latest_alert_no_results():
    """Test getting latest alert when none exist."""
    conn_mock = AsyncMock()

    # Mock no results
    conn_mock.fetchrow.return_value = None

    latest = await alert_repo.get_latest_alert(conn_mock, "plant-003", "humidity")
    assert latest is None


@pytest.mark.asyncio
async def test_list_alerts():
    """Test listing alerts for a plant."""
    conn_mock = AsyncMock()
    now = datetime.now()

    # Mock multiple alerts
    conn_mock.fetch.return_value = [
        {
            "id": 2,
            "plant_id": "plant-004",
            "device_id": "device-004",
            "metric": "temperature",
            "value": 35.0,
            "threshold": 30.0,
            "direction": "max",
            "sent_at": now,
        },
        {
            "id": 1,
            "plant_id": "plant-004",
            "device_id": "device-004",
            "metric": "soil_moisture",
            "value": 15.0,
            "threshold": 20.0,
            "direction": "min",
            "sent_at": now - timedelta(seconds=10),
        },
    ]

    alerts = await alert_repo.list_alerts(conn_mock, "plant-004", limit=10)
    assert len(alerts) == 2
    # Should be ordered by sent_at DESC
    assert alerts[0]["metric"] == "temperature"  # More recent
    assert alerts[1]["metric"] == "soil_moisture"


# ThresholdEvaluator Tests

@pytest.mark.asyncio
async def test_evaluate_below_min_triggers_violation():
    """Test that value below minimum threshold triggers violation."""
    evaluator = ThresholdEvaluator()
    
    telemetry = TelemetryPayload(
        soil_moisture=15.0,  # Below min
        temperature=25.0,
        humidity=50.0,
        light_level=500.0,
    )
    
    thresholds = PlantThresholds(
        soil_moisture=ThresholdConfig(min=20.0, max=80.0),
        temperature=ThresholdConfig(min=15.0, max=30.0),
    )
    
    violations = await evaluator.evaluate(
        plant_id="plant-001",
        device_id="device-001",
        telemetry=telemetry,
        thresholds=thresholds,
    )
    
    assert len(violations) == 1
    assert violations[0].metric == "soil_moisture"
    assert violations[0].value == 15.0
    assert violations[0].threshold == 20.0
    assert violations[0].direction == "min"


@pytest.mark.asyncio
async def test_evaluate_above_max_triggers_violation():
    """Test that value above maximum threshold triggers violation."""
    evaluator = ThresholdEvaluator()
    
    telemetry = TelemetryPayload(
        temperature=35.0,  # Above max
        humidity=50.0,
    )
    
    thresholds = PlantThresholds(
        temperature=ThresholdConfig(min=15.0, max=30.0),
    )
    
    violations = await evaluator.evaluate(
        plant_id="plant-001",
        device_id="device-001",
        telemetry=telemetry,
        thresholds=thresholds,
    )
    
    assert len(violations) == 1
    assert violations[0].metric == "temperature"
    assert violations[0].value == 35.0
    assert violations[0].threshold == 30.0
    assert violations[0].direction == "max"


@pytest.mark.asyncio
async def test_evaluate_within_range_no_violation():
    """Test that values within range produce no violations."""
    evaluator = ThresholdEvaluator()
    
    telemetry = TelemetryPayload(
        soil_moisture=50.0,  # Within range
        temperature=25.0,     # Within range
        humidity=60.0,        # Within range
        light_level=800.0,    # Within range
    )
    
    thresholds = PlantThresholds(
        soil_moisture=ThresholdConfig(min=20.0, max=80.0),
        temperature=ThresholdConfig(min=15.0, max=30.0),
        humidity=ThresholdConfig(min=40.0, max=80.0),
        light_level=ThresholdConfig(min=500.0, max=1000.0),
    )
    
    violations = await evaluator.evaluate(
        plant_id="plant-001",
        device_id="device-001",
        telemetry=telemetry,
        thresholds=thresholds,
    )
    
    assert len(violations) == 0


@pytest.mark.asyncio
async def test_evaluate_missing_threshold_ignored():
    """Test that metrics without thresholds are ignored."""
    evaluator = ThresholdEvaluator()
    
    telemetry = TelemetryPayload(
        soil_moisture=10.0,   # Would violate if threshold existed
        temperature=100.0,    # Would violate if threshold existed
        humidity=5.0,         # Has threshold, violates
    )
    
    thresholds = PlantThresholds(
        # No soil_moisture threshold
        # No temperature threshold
        humidity=ThresholdConfig(min=40.0, max=80.0),
    )
    
    violations = await evaluator.evaluate(
        plant_id="plant-001",
        device_id="device-001",
        telemetry=telemetry,
        thresholds=thresholds,
    )
    
    # Only humidity should trigger violation
    assert len(violations) == 1
    assert violations[0].metric == "humidity"


@pytest.mark.asyncio
async def test_evaluate_null_telemetry_value_ignored():
    """Test that null telemetry values are ignored."""
    evaluator = ThresholdEvaluator()
    
    telemetry = TelemetryPayload(
        soil_moisture=None,  # Null value
        temperature=35.0,    # Above max
    )
    
    thresholds = PlantThresholds(
        soil_moisture=ThresholdConfig(min=20.0, max=80.0),
        temperature=ThresholdConfig(min=15.0, max=30.0),
    )
    
    violations = await evaluator.evaluate(
        plant_id="plant-001",
        device_id="device-001",
        telemetry=telemetry,
        thresholds=thresholds,
    )
    
    # Only temperature should trigger violation
    assert len(violations) == 1
    assert violations[0].metric == "temperature"


@pytest.mark.asyncio
async def test_evaluate_multiple_violations():
    """Test that multiple violations are detected independently."""
    evaluator = ThresholdEvaluator()
    
    telemetry = TelemetryPayload(
        soil_moisture=10.0,   # Below min
        temperature=35.0,     # Above max
        humidity=90.0,        # Above max
        light_level=50.0,     # Below min
    )
    
    thresholds = PlantThresholds(
        soil_moisture=ThresholdConfig(min=20.0, max=80.0),
        temperature=ThresholdConfig(min=15.0, max=30.0),
        humidity=ThresholdConfig(min=40.0, max=80.0),
        light_level=ThresholdConfig(min=500.0, max=1000.0),
    )
    
    violations = await evaluator.evaluate(
        plant_id="plant-001",
        device_id="device-001",
        telemetry=telemetry,
        thresholds=thresholds,
    )
    
    assert len(violations) == 4
    metrics = {v.metric for v in violations}
    assert metrics == {"soil_moisture", "temperature", "humidity", "light_level"}


# Cooldown Tests

class AsyncContextManagerMock:
    """Mock for async context managers (like pool.acquire())."""

    def __init__(self, conn_mock):
        self.conn_mock = conn_mock

    async def __aenter__(self):
        return self.conn_mock

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        pass


@pytest.mark.asyncio
async def test_cooldown_prevents_repeated_alerts():
    """Test that cooldown prevents alert spam."""
    evaluator = ThresholdEvaluator(cooldown_seconds=60)  # 1 minute cooldown
    now = datetime.now()

    violation = ThresholdViolation(
        plant_id="plant-cooldown-1",
        device_id="device-cooldown-1",
        metric="soil_moisture",
        value=15.0,
        threshold=20.0,
        direction="min",
    )

    # Mock pool and connection
    pool_mock = MagicMock()
    conn_mock = AsyncMock()
    pool_mock.acquire.return_value = AsyncContextManagerMock(conn_mock)

    # First call: no previous alert
    conn_mock.fetchrow.return_value = None

    with patch("src.services.threshold_evaluator.get_pool", return_value=pool_mock):
        # First alert should be allowed
        should_alert_1 = await evaluator.should_alert(violation)
        assert should_alert_1 is True

        # Record the alert
        await evaluator.record_alert(violation)

        # Second call: recent alert exists
        conn_mock.fetchrow.return_value = {
            "id": 1,
            "plant_id": "plant-cooldown-1",
            "device_id": "device-cooldown-1",
            "metric": "soil_moisture",
            "value": 15.0,
            "threshold": 20.0,
            "direction": "min",
            "sent_at": now,  # Just sent
        }

        # Second alert immediately after should be blocked
        should_alert_2 = await evaluator.should_alert(violation)
        assert should_alert_2 is False


@pytest.mark.asyncio
async def test_cooldown_allows_alert_after_timeout():
    """Test that alerts are allowed after cooldown expires."""
    evaluator = ThresholdEvaluator(cooldown_seconds=1)  # 1 second cooldown
    past_time = datetime.now() - timedelta(seconds=2)  # 2 seconds ago

    violation = ThresholdViolation(
        plant_id="plant-cooldown-2",
        device_id="device-cooldown-2",
        metric="temperature",
        value=35.0,
        threshold=30.0,
        direction="max",
    )

    # Mock pool and connection
    pool_mock = MagicMock()
    conn_mock = AsyncMock()
    pool_mock.acquire.return_value = AsyncContextManagerMock(conn_mock)

    # Mock an old alert (past cooldown)
    conn_mock.fetchrow.return_value = {
        "id": 1,
        "plant_id": "plant-cooldown-2",
        "device_id": "device-cooldown-2",
        "metric": "temperature",
        "value": 35.0,
        "threshold": 30.0,
        "direction": "max",
        "sent_at": past_time,  # More than cooldown ago
    }

    with patch("src.services.threshold_evaluator.get_pool", return_value=pool_mock):
        # Should be allowed (cooldown expired)
        should_alert = await evaluator.should_alert(violation)
        assert should_alert is True


@pytest.mark.asyncio
async def test_cooldown_per_metric_independent():
    """Test that cooldowns are independent per metric."""
    evaluator = ThresholdEvaluator(cooldown_seconds=60)
    now = datetime.now()

    violation_1 = ThresholdViolation(
        plant_id="plant-cooldown-3",
        device_id="device-cooldown-3",
        metric="soil_moisture",
        value=15.0,
        threshold=20.0,
        direction="min",
    )

    violation_2 = ThresholdViolation(
        plant_id="plant-cooldown-3",
        device_id="device-cooldown-3",
        metric="temperature",  # Different metric
        value=35.0,
        threshold=30.0,
        direction="max",
    )

    # Mock pool and connection
    pool_mock = MagicMock()
    conn_mock = AsyncMock()
    pool_mock.acquire.return_value = AsyncContextManagerMock(conn_mock)

    # Configure mock to return different results based on metric
    def get_latest_alert_side_effect(query, plant_id, metric):
        if metric == "soil_moisture":
            # Recent alert for soil_moisture
            return {
                "id": 1,
                "plant_id": "plant-cooldown-3",
                "metric": "soil_moisture",
                "sent_at": now,
            }
        else:
            # No alert for temperature
            return None

    conn_mock.fetchrow.side_effect = lambda q, p, m: get_latest_alert_side_effect(q, p, m)

    with patch("src.services.threshold_evaluator.get_pool", return_value=pool_mock):
        # Should block soil_moisture (recent alert)
        should_alert_1 = await evaluator.should_alert(violation_1)
        assert should_alert_1 is False

        # Should allow temperature (no recent alert)
        should_alert_2 = await evaluator.should_alert(violation_2)
        assert should_alert_2 is True

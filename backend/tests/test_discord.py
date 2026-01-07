"""Tests for Discord integration and alert worker."""
import asyncio
from datetime import datetime, timedelta
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from src.services.alert_worker import AlertWorker, DeviceOfflineEvent
from src.services.discord import DiscordService
from src.services.threshold_evaluator import ThresholdViolation


class TestDiscordService:
    """Tests for Discord webhook service."""

    @pytest.mark.asyncio
    async def test_send_threshold_alert_formats_correctly(self):
        """Test threshold alert message formatting."""
        service = DiscordService(webhook_url="https://discord.com/api/webhooks/test")
        
        # Create a mock violation
        violation = ThresholdViolation(
            plant_id="plant-123",
            device_id="device-456",
            metric="soil_moisture",
            value=15.2,
            threshold=20.0,
            direction="min",
        )
        
        # Mock httpx client
        with patch("src.services.discord.httpx.AsyncClient") as mock_client:
            mock_response = AsyncMock()
            mock_response.status_code = 204
            mock_response.headers = {}
            
            mock_context = AsyncMock()
            mock_context.__aenter__.return_value.post = AsyncMock(return_value=mock_response)
            mock_client.return_value = mock_context
            
            result = await service.send_threshold_alert(violation, "Monstera")
            
            assert result is True
            
            # Verify the call
            call_args = mock_context.__aenter__.return_value.post.call_args
            assert call_args[0][0] == "https://discord.com/api/webhooks/test"
            
            json_data = call_args[1]["json"]
            assert "embeds" in json_data
            assert len(json_data["embeds"]) == 1
            
            embed = json_data["embeds"][0]
            assert embed["title"] == "Plant Alert: Monstera"
            assert "soil moisture" in embed["description"].lower()
            assert "15.2" in embed["description"]
            assert embed["color"] == 15158332  # Red
            assert len(embed["fields"]) == 3
            assert embed["fields"][0]["name"] == "Metric"
            assert embed["fields"][0]["value"] == "soil_moisture"
            assert embed["fields"][1]["name"] == "Current"
            assert embed["fields"][1]["value"] == "15.2"

    @pytest.mark.asyncio
    async def test_send_offline_alert_formats_correctly(self):
        """Test offline alert message formatting."""
        service = DiscordService(webhook_url="https://discord.com/api/webhooks/test")
        
        last_seen = datetime.now() - timedelta(minutes=5)
        
        # Mock httpx client
        with patch("src.services.discord.httpx.AsyncClient") as mock_client:
            mock_response = AsyncMock()
            mock_response.status_code = 204
            mock_response.headers = {}
            
            mock_context = AsyncMock()
            mock_context.__aenter__.return_value.post = AsyncMock(return_value=mock_response)
            mock_client.return_value = mock_context
            
            result = await service.send_offline_alert("device-abc", "Monstera", last_seen)
            
            assert result is True
            
            # Verify the call
            call_args = mock_context.__aenter__.return_value.post.call_args
            json_data = call_args[1]["json"]
            
            embed = json_data["embeds"][0]
            assert embed["title"] == "Device Offline"
            assert "device-abc" in embed["description"]
            assert embed["color"] == 16776960  # Yellow
            assert len(embed["fields"]) == 3
            assert embed["fields"][0]["name"] == "Device ID"
            assert embed["fields"][0]["value"] == "device-abc"
            assert embed["fields"][1]["name"] == "Plant"
            assert embed["fields"][1]["value"] == "Monstera"
            assert "ago" in embed["fields"][2]["value"]

    @pytest.mark.asyncio
    async def test_missing_webhook_returns_false(self):
        """Test that missing webhook_url returns False without error."""
        service = DiscordService(webhook_url=None)
        
        violation = ThresholdViolation(
            plant_id="plant-123",
            device_id="device-456",
            metric="temperature",
            value=35.0,
            threshold=30.0,
            direction="max",
        )
        
        result = await service.send_threshold_alert(violation, "Test Plant")
        assert result is False
        
        result = await service.send_offline_alert("device-123", "Test Plant")
        assert result is False

    @pytest.mark.asyncio
    async def test_http_error_handled_gracefully(self):
        """Test that HTTP errors are handled without raising."""
        service = DiscordService(webhook_url="https://discord.com/api/webhooks/test")
        
        violation = ThresholdViolation(
            plant_id="plant-123",
            device_id="device-456",
            metric="humidity",
            value=80.0,
            threshold=70.0,
            direction="max",
        )
        
        # Mock httpx client to return error
        with patch("src.services.discord.httpx.AsyncClient") as mock_client:
            mock_response = AsyncMock()
            mock_response.status_code = 500
            mock_response.text = "Internal Server Error"
            mock_response.headers = {}
            
            mock_context = AsyncMock()
            mock_context.__aenter__.return_value.post = AsyncMock(return_value=mock_response)
            mock_client.return_value = mock_context
            
            result = await service.send_threshold_alert(violation, "Test Plant")
            
            assert result is False

    @pytest.mark.asyncio
    async def test_rate_limit_handling(self):
        """Test that rate limits are tracked and respected."""
        service = DiscordService(webhook_url="https://discord.com/api/webhooks/test")
        
        # Mock httpx client to return rate limit response
        with patch("src.services.discord.httpx.AsyncClient") as mock_client:
            mock_response = AsyncMock()
            mock_response.status_code = 429
            mock_response.headers = {
                "X-RateLimit-Remaining": "0",
                "X-RateLimit-Reset": str((datetime.now() + timedelta(seconds=60)).timestamp()),
            }
            
            mock_context = AsyncMock()
            mock_context.__aenter__.return_value.post = AsyncMock(return_value=mock_response)
            mock_client.return_value = mock_context
            
            result = await service.send_message({"title": "Test"})
            
            assert result is False

    @pytest.mark.asyncio
    async def test_timeout_handling(self):
        """Test that timeouts are handled gracefully."""
        service = DiscordService(webhook_url="https://discord.com/api/webhooks/test")
        
        # Mock httpx client to raise timeout
        with patch("src.services.discord.httpx.AsyncClient") as mock_client:
            from httpx import TimeoutException
            
            mock_context = AsyncMock()
            mock_context.__aenter__.return_value.post = AsyncMock(
                side_effect=TimeoutException("Request timed out")
            )
            mock_client.return_value = mock_context
            
            result = await service.send_message({"title": "Test"})
            
            assert result is False


class TestAlertWorker:
    """Tests for alert worker queue processing."""

    @pytest.mark.asyncio
    async def test_worker_processes_threshold_violations(self):
        """Test that worker processes threshold violations from queue."""
        discord = DiscordService(webhook_url="https://discord.com/api/webhooks/test")
        queue = asyncio.Queue()
        worker = AlertWorker(discord=discord, queue=queue)
        
        # Create violation with plant_name attribute
        violation = ThresholdViolation(
            plant_id="plant-123",
            device_id="device-456",
            metric="temperature",
            value=35.0,
            threshold=30.0,
            direction="max",
        )
        violation.plant_name = "Test Plant"
        
        # Mock Discord send
        with patch.object(discord, "send_threshold_alert", new_callable=AsyncMock) as mock_send:
            mock_send.return_value = True
            
            # Add violation to queue
            await queue.put(violation)
            
            # Run worker for a short time
            worker_task = asyncio.create_task(worker.run())
            await asyncio.sleep(0.1)
            
            worker.stop()
            worker_task.cancel()
            try:
                await worker_task
            except asyncio.CancelledError:
                pass
            
            # Verify send was called
            mock_send.assert_called_once()
            assert mock_send.call_args[0][0] == violation
            assert mock_send.call_args[0][1] == "Test Plant"

    @pytest.mark.asyncio
    async def test_worker_processes_offline_events(self):
        """Test that worker processes device offline events from queue."""
        discord = DiscordService(webhook_url="https://discord.com/api/webhooks/test")
        queue = asyncio.Queue()
        worker = AlertWorker(discord=discord, queue=queue)
        
        # Create offline event
        event = DeviceOfflineEvent(
            device_id="device-123",
            plant_name="Test Plant",
            last_seen=datetime.now() - timedelta(minutes=5),
        )
        
        # Mock Discord send
        with patch.object(discord, "send_offline_alert", new_callable=AsyncMock) as mock_send:
            mock_send.return_value = True
            
            # Add event to queue
            await queue.put(event)
            
            # Run worker for a short time
            worker_task = asyncio.create_task(worker.run())
            await asyncio.sleep(0.1)
            
            worker.stop()
            worker_task.cancel()
            try:
                await worker_task
            except asyncio.CancelledError:
                pass
            
            # Verify send was called
            mock_send.assert_called_once()
            assert mock_send.call_args[0][0] == "device-123"
            assert mock_send.call_args[0][1] == "Test Plant"

    @pytest.mark.asyncio
    async def test_worker_continues_on_error(self):
        """Test that worker continues processing after errors."""
        discord = DiscordService(webhook_url="https://discord.com/api/webhooks/test")
        queue = asyncio.Queue()
        worker = AlertWorker(discord=discord, queue=queue)
        
        # Create two violations
        violation1 = ThresholdViolation(
            plant_id="plant-1",
            device_id="device-1",
            metric="temperature",
            value=35.0,
            threshold=30.0,
            direction="max",
        )
        violation1.plant_name = "Plant 1"
        
        violation2 = ThresholdViolation(
            plant_id="plant-2",
            device_id="device-2",
            metric="humidity",
            value=80.0,
            threshold=70.0,
            direction="max",
        )
        violation2.plant_name = "Plant 2"
        
        # Mock Discord send to fail first, succeed second
        with patch.object(discord, "send_threshold_alert", new_callable=AsyncMock) as mock_send:
            mock_send.side_effect = [Exception("Network error"), True]
            
            # Add violations to queue
            await queue.put(violation1)
            await queue.put(violation2)
            
            # Run worker for a short time
            worker_task = asyncio.create_task(worker.run())
            await asyncio.sleep(0.2)
            
            worker.stop()
            worker_task.cancel()
            try:
                await worker_task
            except asyncio.CancelledError:
                pass
            
            # Verify both were attempted
            assert mock_send.call_count == 2

    @pytest.mark.asyncio
    async def test_worker_handles_empty_queue(self):
        """Test that worker handles empty queue gracefully."""
        discord = DiscordService(webhook_url=None)  # No webhook
        queue = asyncio.Queue()
        worker = AlertWorker(discord=discord, queue=queue)
        
        # Run worker with empty queue
        worker_task = asyncio.create_task(worker.run())
        await asyncio.sleep(0.1)
        
        worker.stop()
        worker_task.cancel()
        try:
            await worker_task
        except asyncio.CancelledError:
            pass
        
        # Should complete without error
        assert True

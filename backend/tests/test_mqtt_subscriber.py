"""Tests for MQTT subscriber service."""
import pytest

from src.services.mqtt_subscriber import MQTTSubscriber, parse_device_id


def test_mqtt_subscriber_instantiation():
    """Test that MQTTSubscriber can be instantiated."""
    subscriber = MQTTSubscriber(
        host="localhost",
        port=1883,
        username="test_user",
        password="test_password",
    )
    
    assert subscriber.host == "localhost"
    assert subscriber.port == 1883
    assert subscriber.username == "test_user"
    assert subscriber.password == "test_password"
    assert subscriber.client is None
    assert subscriber.handlers == {}
    assert subscriber._running is False


def test_parse_device_id_telemetry():
    """Test parsing device_id from telemetry topic."""
    topic = "devices/abc123/telemetry"
    device_id = parse_device_id(topic)
    assert device_id == "abc123"


def test_parse_device_id_heartbeat():
    """Test parsing device_id from heartbeat topic."""
    topic = "devices/xyz789/heartbeat"
    device_id = parse_device_id(topic)
    assert device_id == "xyz789"


def test_parse_device_id_with_long_id():
    """Test parsing device_id with longer identifier."""
    topic = "devices/device_a1b2c3d4/telemetry"
    device_id = parse_device_id(topic)
    assert device_id == "device_a1b2c3d4"


def test_parse_device_id_invalid_format():
    """Test that invalid topic format raises ValueError."""
    with pytest.raises(ValueError, match="Invalid topic format"):
        parse_device_id("invalid/topic")
    
    with pytest.raises(ValueError, match="Invalid topic format"):
        parse_device_id("sensors/abc123/telemetry")
    
    with pytest.raises(ValueError, match="Invalid topic format"):
        parse_device_id("devices/abc123")


def test_handler_registration():
    """Test that handlers can be registered."""
    subscriber = MQTTSubscriber(
        host="localhost",
        port=1883,
        username="test",
        password="test",
    )
    
    async def dummy_handler(topic: str, payload: bytes) -> None:
        """Dummy handler for testing."""
        pass
    
    subscriber.register_handler("devices/+/telemetry", dummy_handler)
    
    assert "devices/+/telemetry" in subscriber.handlers
    assert subscriber.handlers["devices/+/telemetry"] == dummy_handler


def test_multiple_handlers_registration():
    """Test registering multiple handlers."""
    subscriber = MQTTSubscriber(
        host="localhost",
        port=1883,
        username="test",
        password="test",
    )
    
    async def telemetry_handler(topic: str, payload: bytes) -> None:
        """Telemetry handler."""
        pass
    
    async def heartbeat_handler(topic: str, payload: bytes) -> None:
        """Heartbeat handler."""
        pass
    
    subscriber.register_handler("devices/+/telemetry", telemetry_handler)
    subscriber.register_handler("devices/+/heartbeat", heartbeat_handler)
    
    assert len(subscriber.handlers) == 2
    assert subscriber.handlers["devices/+/telemetry"] == telemetry_handler
    assert subscriber.handlers["devices/+/heartbeat"] == heartbeat_handler


def test_topic_matches_single_level_wildcard():
    """Test topic matching with single-level wildcard."""
    subscriber = MQTTSubscriber(
        host="localhost",
        port=1883,
        username="test",
        password="test",
    )
    
    # Test single-level wildcard (+)
    assert subscriber._topic_matches("devices/abc123/telemetry", "devices/+/telemetry")
    assert subscriber._topic_matches("devices/xyz789/telemetry", "devices/+/telemetry")
    assert not subscriber._topic_matches("devices/abc123/heartbeat", "devices/+/telemetry")
    assert not subscriber._topic_matches("sensors/abc123/telemetry", "devices/+/telemetry")


def test_topic_matches_multi_level_wildcard():
    """Test topic matching with multi-level wildcard."""
    subscriber = MQTTSubscriber(
        host="localhost",
        port=1883,
        username="test",
        password="test",
    )
    
    # Test multi-level wildcard (#)
    assert subscriber._topic_matches("devices/abc123/telemetry", "devices/#")
    assert subscriber._topic_matches("devices/abc123/heartbeat", "devices/#")
    assert subscriber._topic_matches("devices/abc123/telemetry/temp", "devices/#")
    assert not subscriber._topic_matches("sensors/abc123/telemetry", "devices/#")


def test_topic_matches_exact():
    """Test exact topic matching without wildcards."""
    subscriber = MQTTSubscriber(
        host="localhost",
        port=1883,
        username="test",
        password="test",
    )
    
    # Test exact match
    assert subscriber._topic_matches("devices/abc123/telemetry", "devices/abc123/telemetry")
    assert not subscriber._topic_matches("devices/xyz789/telemetry", "devices/abc123/telemetry")
    assert not subscriber._topic_matches("devices/abc123/heartbeat", "devices/abc123/telemetry")

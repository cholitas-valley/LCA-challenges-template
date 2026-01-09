"""MQTT subscriber service for receiving device telemetry and heartbeat messages."""
import asyncio
import logging
import ssl
from collections.abc import Callable
from typing import Any

import aiomqtt

logger = logging.getLogger(__name__)


class MQTTSubscriber:
    """MQTT subscriber that listens for device telemetry and heartbeat messages."""

    def __init__(
        self,
        host: str,
        port: int,
        username: str,
        password: str,
        use_tls: bool = False,
        ca_cert: str | None = None,
    ):
        """
        Initialize MQTT subscriber.

        Args:
            host: MQTT broker hostname
            port: MQTT broker port
            username: MQTT username for authentication
            password: MQTT password for authentication
            use_tls: Enable TLS encryption
            ca_cert: Path to CA certificate for TLS verification
        """
        self.host = host
        self.port = port
        self.username = username
        self.password = password
        self.use_tls = use_tls
        self.ca_cert = ca_cert
        self.client: aiomqtt.Client | None = None
        self.handlers: dict[str, Callable] = {}
        self._running = False
        self._connected = False
        self._task: asyncio.Task | None = None

    @property
    def is_connected(self) -> bool:
        """Return current connection state."""
        return self._connected
    
    async def connect(self) -> None:
        """Connect to MQTT broker with optional TLS."""
        tls_context = None
        if self.use_tls:
            tls_context = ssl.create_default_context(ssl.Purpose.SERVER_AUTH)
            if self.ca_cert:
                tls_context.load_verify_locations(self.ca_cert)
            logger.info(f"Connecting to MQTT broker with TLS at {self.host}:{self.port}")
        else:
            logger.info(f"Connecting to MQTT broker at {self.host}:{self.port}")

        self.client = aiomqtt.Client(
            hostname=self.host,
            port=self.port,
            username=self.username,
            password=self.password,
            tls_context=tls_context,
        )
        try:
            await self.client.__aenter__()
            self._connected = True
            logger.info("Connected to MQTT broker")
        except Exception as e:
            self._connected = False
            logger.error(f"Failed to connect to MQTT broker: {e}")
            raise
    
    async def disconnect(self) -> None:
        """Disconnect from MQTT broker."""
        logger.info("Disconnecting from MQTT broker")
        self._running = False
        self._connected = False

        # Cancel listening task if running
        if self._task and not self._task.done():
            self._task.cancel()
            try:
                await self._task
            except asyncio.CancelledError:
                pass

        if self.client:
            try:
                await self.client.__aexit__(None, None, None)
                logger.info("Disconnected from MQTT broker")
            except Exception as e:
                logger.error(f"Error disconnecting from MQTT broker: {e}")
            finally:
                self.client = None
    
    async def subscribe(self, topic: str, handler: Callable) -> None:
        """
        Subscribe to topic with handler callback.
        
        Args:
            topic: MQTT topic pattern (supports wildcards like devices/+/telemetry)
            handler: Async callback function(topic: str, payload: bytes)
        """
        if not self.client:
            raise RuntimeError("Must connect() before subscribing")
        
        logger.info(f"Subscribing to topic: {topic}")
        await self.client.subscribe(topic)
        self.handlers[topic] = handler
    
    def register_handler(self, topic_pattern: str, handler: Callable) -> None:
        """
        Register handler for topic pattern.
        
        This registers the handler but doesn't subscribe yet.
        Call start() to begin listening.
        
        Args:
            topic_pattern: MQTT topic pattern (e.g., "devices/+/telemetry")
            handler: Async callback function(topic: str, payload: bytes)
        """
        logger.info(f"Registered handler for topic pattern: {topic_pattern}")
        self.handlers[topic_pattern] = handler
    
    async def start(self) -> None:
        """Start listening for messages in background."""
        if not self.client:
            raise RuntimeError("Must connect() before starting")
        
        # Subscribe to all registered topic patterns
        for topic_pattern in self.handlers.keys():
            await self.client.subscribe(topic_pattern)
            logger.info(f"Subscribed to: {topic_pattern}")
        
        self._running = True
        logger.info("Starting MQTT message listener")
        
        await self._listen_loop()
    
    async def _listen_loop(self) -> None:
        """
        Internal message listening loop with reconnection logic.
        
        Handles reconnection with exponential backoff on connection failure.
        """
        reconnect_delay = 1  # Initial delay in seconds
        max_delay = 60  # Maximum delay between reconnections
        
        while self._running:
            try:
                async for message in self.client.messages:
                    topic = str(message.topic)
                    payload = message.payload
                    
                    logger.debug(f"Received message on topic: {topic}")
                    
                    # Find matching handler
                    handler = self._find_matching_handler(topic)
                    if handler:
                        try:
                            await handler(topic, payload)
                        except Exception as e:
                            logger.error(f"Error in message handler for {topic}: {e}")
                    else:
                        logger.warning(f"No handler found for topic: {topic}")
                
                # If we exit the loop normally, reset reconnect delay
                reconnect_delay = 1
                
            except aiomqtt.MqttError as e:
                if not self._running:
                    # Expected during shutdown
                    break

                self._connected = False
                logger.error(f"MQTT error: {e}. Reconnecting in {reconnect_delay}s...")
                await asyncio.sleep(reconnect_delay)

                # Exponential backoff
                reconnect_delay = min(reconnect_delay * 2, max_delay)

                try:
                    # Reconnect
                    await self.disconnect()
                    await self.connect()

                    # Re-subscribe to all topics
                    for topic_pattern in self.handlers.keys():
                        await self.client.subscribe(topic_pattern)
                        logger.info(f"Re-subscribed to: {topic_pattern}")

                except Exception as reconnect_error:
                    self._connected = False
                    logger.error(f"Reconnection failed: {reconnect_error}")
                    continue

            except Exception as e:
                self._connected = False
                logger.error(f"Unexpected error in MQTT listener: {e}")
                if self._running:
                    await asyncio.sleep(reconnect_delay)
                    reconnect_delay = min(reconnect_delay * 2, max_delay)
    
    def _find_matching_handler(self, topic: str) -> Callable | None:
        """
        Find handler that matches the given topic.
        
        Supports MQTT wildcard patterns:
        - + matches single level (devices/+/telemetry matches devices/abc/telemetry)
        - # matches multiple levels
        
        Args:
            topic: Actual topic from message
            
        Returns:
            Handler function if match found, None otherwise
        """
        for topic_pattern, handler in self.handlers.items():
            if self._topic_matches(topic, topic_pattern):
                return handler
        return None
    
    def _topic_matches(self, topic: str, pattern: str) -> bool:
        """
        Check if topic matches pattern with MQTT wildcards.
        
        Args:
            topic: Actual topic (e.g., "devices/abc123/telemetry")
            pattern: Pattern with wildcards (e.g., "devices/+/telemetry")
            
        Returns:
            True if topic matches pattern
        """
        topic_parts = topic.split('/')
        pattern_parts = pattern.split('/')
        
        # Multi-level wildcard
        if '#' in pattern_parts:
            hash_index = pattern_parts.index('#')
            # # must be last element
            if hash_index != len(pattern_parts) - 1:
                return False
            # Match up to the # wildcard
            return topic_parts[:hash_index] == pattern_parts[:hash_index]
        
        # Must have same number of parts if no multi-level wildcard
        if len(topic_parts) != len(pattern_parts):
            return False
        
        # Check each part
        for topic_part, pattern_part in zip(topic_parts, pattern_parts):
            if pattern_part == '+':
                # Single-level wildcard matches anything
                continue
            if topic_part != pattern_part:
                return False
        
        return True


def parse_device_id(topic: str) -> str:
    """
    Extract device_id from topic.
    
    Expected format: devices/{device_id}/telemetry or devices/{device_id}/heartbeat
    
    Args:
        topic: MQTT topic string
        
    Returns:
        device_id extracted from topic
        
    Raises:
        ValueError: If topic format is invalid
    """
    parts = topic.split('/')
    if len(parts) < 3 or parts[0] != 'devices':
        raise ValueError(f"Invalid topic format: {topic}")
    return parts[1]

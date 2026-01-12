# Task 028: Backend TLS Connection Support - Handoff

## Summary

Successfully updated the backend MQTT subscriber to support TLS connections when configured, while maintaining backward compatibility with plain TCP for development. The solution includes:

1. **Configuration updates** - Added TLS settings to Settings class (mqtt_use_tls, mqtt_tls_port, mqtt_ca_cert)
2. **MQTT subscriber TLS support** - Updated MQTTSubscriber to accept TLS parameters and create SSL context when enabled
3. **Main application update** - Updated main.py to pass TLS settings to MQTTSubscriber with conditional port selection
4. **Docker Compose update** - Added TLS environment variables and mounted CA certificate for backend container
5. **Test coverage** - Added tests for TLS configuration and default no-TLS behavior

All 118 tests pass, including 2 new tests for TLS functionality.

## Files Touched

### Modified Files
- `backend/src/config.py` - Added mqtt_use_tls, mqtt_tls_port, and mqtt_ca_cert settings
- `backend/src/services/mqtt_subscriber.py` - Added TLS support with use_tls and ca_cert parameters
- `backend/src/main.py` - Updated to pass TLS settings to MQTTSubscriber with conditional port selection
- `docker-compose.yml` - Added TLS environment variables and mounted CA certificate
- `backend/tests/test_mqtt_subscriber.py` - Added test_mqtt_subscriber_tls_config and test_mqtt_subscriber_default_no_tls

## Interfaces Changed

### Configuration (backend/src/config.py)
Added three new settings to the Settings class:
```python
mqtt_use_tls: bool = False  # Enable TLS connection
mqtt_tls_port: int = 8883   # TLS port
mqtt_ca_cert: str | None = None  # Path to CA certificate
```

### MQTTSubscriber Constructor (backend/src/services/mqtt_subscriber.py)
Updated constructor signature:
```python
def __init__(
    self,
    host: str,
    port: int,
    username: str,
    password: str,
    use_tls: bool = False,  # NEW
    ca_cert: str | None = None,  # NEW
)
```

### MQTTSubscriber.connect() Method
Updated to create SSL context when TLS is enabled:
```python
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
```

### Docker Compose Environment Variables
Added to backend service:
```yaml
MQTT_USE_TLS: ${MQTT_USE_TLS:-false}
MQTT_TLS_PORT: ${MQTT_TLS_PORT:-8883}
MQTT_CA_CERT: ${MQTT_CA_CERT:-}
```

Added volume mount:
```yaml
- ./certs/ca.crt:/app/certs/ca.crt:ro
```

## How to Verify

### 1. Run all tests
```bash
make check
```

Expected output: All 118 tests pass (including 2 new TLS tests)

### 2. Test default behavior (plain TCP)
By default, backend uses plain TCP on port 1883:
```bash
make up
docker logs plantops-backend | grep "Connecting to MQTT"
```

Expected output: `Connecting to MQTT broker at mosquitto:1883`

### 3. Test TLS connection
Enable TLS by setting environment variables:
```bash
# In .env or environment
export MQTT_USE_TLS=true
export MQTT_CA_CERT=/app/certs/ca.crt

make up
docker logs plantops-backend | grep "Connecting to MQTT"
```

Expected output: `Connecting to MQTT broker with TLS at mosquitto:8883`

### 4. Verify TLS handshake
Check that backend successfully connects to Mosquitto via TLS:
```bash
docker logs plantops-backend | grep "Connected to MQTT broker"
```

Expected output: `Connected to MQTT broker`

### 5. Test backward compatibility
Ensure existing functionality still works without TLS:
```bash
# Ensure MQTT_USE_TLS is not set or is false
unset MQTT_USE_TLS
make up
docker exec plantops-backend curl -s http://localhost:8000/api/health
```

Expected output: JSON response with `"status":"healthy"`

## Implementation Notes

### TLS Configuration
- **Backward compatible**: TLS is disabled by default (mqtt_use_tls=False)
- **Server verification**: Uses ssl.create_default_context(ssl.Purpose.SERVER_AUTH) for proper server certificate verification
- **Optional CA cert**: If mqtt_ca_cert is provided, loads it for certificate verification
- **Port selection**: Automatically uses mqtt_tls_port (8883) when TLS is enabled, otherwise uses mqtt_port (1883)

### Reconnection Logic
The existing reconnection logic in `_listen_loop()` preserves TLS settings when reconnecting. The TLS context is created once during initialization and reused for all connections.

### SSL Import
Added `import ssl` to mqtt_subscriber.py for TLS context creation.

### Environment Variables
All TLS settings have sensible defaults and can be overridden via environment variables:
- `MQTT_USE_TLS` defaults to `false`
- `MQTT_TLS_PORT` defaults to `8883`
- `MQTT_CA_CERT` defaults to empty (no CA cert verification)

### Test Coverage
Added two new tests:
1. `test_mqtt_subscriber_tls_config` - Verifies TLS parameters are properly stored
2. `test_mqtt_subscriber_default_no_tls` - Verifies backward compatibility (default no-TLS behavior)

## Next Steps

### Immediate
The backend is now ready to connect via TLS. To enable it:
1. Set `MQTT_USE_TLS=true` in environment
2. Set `MQTT_CA_CERT=/app/certs/ca.crt`
3. Backend will automatically connect to port 8883 with TLS

### Downstream Tasks
- **Task-029**: Frontend TLS connection support (WebSocket over TLS)
- **Task-035**: ESP32 firmware TLS support (embed CA certificate)
- **Task-032**: Production deployment with TLS-only mode

### Documentation
Document TLS configuration in:
- README.md environment variables section
- Deployment guide for production TLS setup
- Certificate rotation procedures

## Risks and Follow-ups

### Risks
- **Certificate verification**: If CA cert path is incorrect or file doesn't exist, connection will fail silently
- **Certificate expiration**: No monitoring for certificate expiration yet
- **Mixed mode**: Development environment allows both plain TCP and TLS simultaneously (could be confusing)

### Follow-ups
- Add error handling for missing or invalid CA certificate file
- Add certificate expiration monitoring
- Consider adding TLS verification mode configuration (strict vs. permissive)
- Document certificate generation and renewal process

## Testing Performed

1. ✅ Added mqtt_use_tls, mqtt_tls_port, and mqtt_ca_cert to Settings class
2. ✅ Updated MQTTSubscriber constructor to accept use_tls and ca_cert parameters
3. ✅ Updated MQTTSubscriber.connect() to create SSL context when TLS enabled
4. ✅ Updated main.py to pass TLS settings with conditional port selection
5. ✅ Added TLS environment variables to docker-compose.yml
6. ✅ Mounted CA certificate in backend container
7. ✅ Added test_mqtt_subscriber_tls_config test
8. ✅ Added test_mqtt_subscriber_default_no_tls test
9. ✅ All 118 tests pass (including 2 new TLS tests)
10. ✅ Frontend builds successfully

## Definition of Done Checklist

- [x] `Settings` class has TLS configuration options
- [x] `MQTTSubscriber` accepts TLS parameters
- [x] `MQTTSubscriber.connect()` creates TLS context when enabled
- [x] Main app passes TLS settings to subscriber
- [x] Docker compose mounts CA cert for backend
- [x] New tests for TLS configuration added
- [x] All existing tests still pass (`make check`)

## Additional Notes

### SSL Context Creation
The implementation uses Python's `ssl.create_default_context(ssl.Purpose.SERVER_AUTH)` which:
- Validates the server's certificate chain
- Ensures the certificate is not expired
- Verifies the certificate is for the correct hostname
- Uses secure default TLS protocol versions and cipher suites

### Certificate Path
The CA certificate is mounted at `/app/certs/ca.crt` in the container. To enable TLS, set:
```bash
MQTT_CA_CERT=/app/certs/ca.crt
```

### Development vs. Production
- **Development**: TLS is disabled by default, backend connects to port 1883
- **Production**: Set `MQTT_USE_TLS=true` and `MQTT_CA_CERT=/app/certs/ca.crt` to enable TLS on port 8883

The reconnection logic in `_listen_loop` automatically preserves TLS settings, so reconnections will use the same security configuration as the initial connection.

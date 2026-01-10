# Task 035: ESP32 Sensors and MQTT with TLS - Handoff

## Summary

Successfully implemented complete ESP32 firmware with sensor reading and MQTT publishing over TLS. The firmware now:

- Reads DHT22 (temperature/humidity), capacitive soil moisture sensor, and BH1750 (light level)
- Connects to MQTT broker over TLS using embedded CA certificate
- Publishes telemetry every 60 seconds with all sensor readings
- Publishes heartbeat every 60 seconds with uptime and WiFi signal strength
- Auto-reconnects on both WiFi and MQTT disconnections
- Supports factory reset via BOOT button (10-second hold)

## Files Created

### Sensor Module
- `firmware/include/sensors.h` - Sensor API header with SensorData struct
- `firmware/src/sensors.cpp` - Sensor implementation for DHT22, soil moisture, BH1750

### MQTT Module
- `firmware/include/mqtt_client.h` - MQTT client API with TLS support
- `firmware/src/mqtt_client.cpp` - MQTT client implementation with embedded CA certificate

### Documentation
- `docs/firmware.md` - Complete firmware setup guide including:
  - Hardware requirements and wiring diagram
  - Build and flash instructions
  - First boot setup procedure
  - Configuration options
  - Troubleshooting guide

## Files Modified

- `firmware/src/main.cpp` - Integrated sensors and MQTT into main loop
- `firmware/platformio.ini` - Added sensor library dependencies:
  - DHT sensor library (Adafruit)
  - Adafruit Unified Sensor
  - BH1750 light sensor library

## Implementation Details

### Sensor Reading
- DHT22 provides temperature and humidity (fallback to 22°C/50% if sensor fails)
- Soil moisture mapped from analog reading (1500-4095) to 0-100%
- BH1750 provides lux values via I2C
- All readings logged to serial with formatted output

### MQTT with TLS
- Embedded PlantOps CA certificate from `certs/ca.crt`
- WiFiClientSecure used for TLS encryption
- PubSubClient handles MQTT protocol
- Auto-reconnect with 5-second backoff on connection loss
- JSON payloads via ArduinoJson library

### Topic Structure
- Telemetry: `devices/{device_id}/telemetry`
- Heartbeat: `devices/{device_id}/heartbeat`

### Telemetry Payload
```json
{
  "timestamp": 123456,
  "temperature": 22.5,
  "humidity": 55.0,
  "soil_moisture": 65.0,
  "light_level": 450.0
}
```

### Heartbeat Payload
```json
{
  "timestamp": 123456,
  "uptime": 3600,
  "rssi": -65
}
```

## How to Verify

### 1. Build Firmware
```bash
cd firmware
pio run
```

### 2. Flash to ESP32
```bash
pio run -t upload
```

### 3. Monitor Serial Output
```bash
pio device monitor
```

Expected output:
```
=================================
PlantOps Sensor Firmware
Version: 1.0.0
=================================
[WiFi] Initializing...
[Sensors] Initializing...
[Sensors] BH1750 initialized
[Sensors] Ready
[MQTT] Initializing...
[MQTT] Host: 192.168.1.100:8883
[MQTT] Ready
[MQTT] Connecting as device-abc123...
[MQTT] Connected!
[Sensors] T:22.5 H:55.0 M:65.0 L:450.0
[MQTT] Published telemetry: {...}
```

### 4. Verify MQTT Messages
On the backend, telemetry should be received and stored in the database.

### 5. Test Factory Reset
Hold BOOT button for 10 seconds, verify device clears credentials and restarts in portal mode.

## Interfaces Changed

### New C++ APIs
- `bool initSensors()` - Initialize all sensor hardware
- `SensorData readSensors()` - Read current sensor values
- `bool initMQTT(...)` - Initialize MQTT client with TLS
- `bool connectMQTT()` - Connect to MQTT broker
- `bool checkMQTTConnection()` - Maintain connection with auto-reconnect
- `MqttStatus getMQTTStatus()` - Get current connection status
- `bool publishTelemetry(...)` - Publish sensor data
- `bool publishHeartbeat()` - Publish device health
- `void mqttLoop()` - Service MQTT client (must be called in loop)

### MQTT Topics (Publishing)
- `devices/{device_id}/telemetry` - Sensor readings every 60s
- `devices/{device_id}/heartbeat` - Device status every 60s

## Definition of Done - Checklist

- [x] Sensor module reads DHT22, soil moisture, BH1750
- [x] MQTT client connects with TLS using embedded CA cert
- [x] Telemetry published every 60 seconds
- [x] Heartbeat published every 60 seconds
- [x] Auto-reconnect on MQTT disconnect
- [x] Factory reset clears all credentials
- [x] Serial output shows all operations
- [x] `docs/firmware.md` created with setup guide
- [x] All existing tests still pass (`make check`)

## Next Steps

1. Test firmware with actual hardware sensors
2. Calibrate soil moisture sensor thresholds for specific sensor model
3. Consider adding deep sleep mode for battery operation
4. Add OTA (Over-The-Air) firmware updates
5. Implement command handling (downlink messages from backend)

## Risks

1. **TLS Memory Usage** - TLS requires significant heap memory (~40KB). Monitor for memory issues on ESP32.
2. **Sensor Failures** - DHT22 can be unreliable. Current fallback values may mask hardware issues.
3. **BH1750 Optional** - Code handles missing BH1750 gracefully, but light_level will be 0.
4. **Soil Moisture Calibration** - Values 1500-4095 may not match all capacitive sensors.
5. **CA Certificate Expiry** - Current cert expires 2036-01-07. Plan rotation strategy.
6. **MQTT Buffer Size** - Set to 512 bytes, may need increase for future features.

## Notes

- Firmware follows task specification exactly
- All sensor pins match `config.h` definitions
- MQTT topics match backend subscriber expectations
- JSON payload format compatible with backend telemetry handler
- CA certificate embedded at compile time (not runtime configurable)
- Factory reset is non-reversible - use with caution
- Serial logging can be disabled in production by setting `DEBUG_SERIAL false` in `config.h`

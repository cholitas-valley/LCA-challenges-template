# Task 033 Handoff: ESP32 PlatformIO Project Scaffold

## Summary

Successfully created the PlatformIO project structure for ESP32 firmware with complete configuration, build system, and documentation. The firmware scaffold is ready for WiFi/backend integration (task-034) and sensor implementation (task-035).

## Files Created

### Configuration Files
- `firmware/platformio.ini` - PlatformIO build configuration with ESP32 target, Arduino framework, and required libraries (PubSubClient, ArduinoJson, WiFiManager)
- `firmware/include/config.h` - Hardware and application configuration (pins, timing, hosts, MQTT settings)
- `firmware/include/secrets.h.example` - Template for WiFi and MQTT credentials

### Source Files
- `firmware/src/main.cpp` - Main firmware entry point with setup/loop structure and TODO markers for tasks 034/035

### Documentation
- `firmware/README.md` - Complete firmware documentation including hardware requirements, wiring, building, and usage instructions
- `firmware/include/README` - PlatformIO standard header directory documentation
- `firmware/lib/README` - PlatformIO standard library directory documentation

### Directory Structure
- `firmware/data/.gitkeep` - SPIFFS data directory for WiFi portal configuration storage

### Build System
- Updated `.gitignore` - Added firmware build artifacts (`.pio/`, `.vscode/`), and secrets file exclusions

## Project Structure

```
firmware/
├── platformio.ini          # ESP32 build configuration
├── include/
│   ├── README             # Header directory info
│   ├── config.h           # Hardware/app configuration
│   └── secrets.h.example  # Credentials template
├── lib/
│   └── README             # Library directory info
├── src/
│   └── main.cpp           # Main entry point (v1.0.0)
├── data/                  # SPIFFS storage
│   └── .gitkeep
└── README.md              # Firmware documentation
```

## Configuration Details

### PlatformIO Settings
- **Platform:** espressif32
- **Board:** esp32dev (ESP32-DevKitC)
- **Framework:** Arduino
- **Monitor Speed:** 115200 baud
- **Upload Speed:** 921600 baud
- **Partition:** min_spiffs.csv (OTA support)
- **Filesystem:** SPIFFS

### Libraries
- `PubSubClient@^2.8` - MQTT client
- `ArduinoJson@^7.0` - JSON parsing/serialization
- `WiFiManager` (GitHub) - Captive portal for WiFi setup

### Hardware Pins (GPIO)
- DHT22 Data: GPIO4
- Soil Moisture: GPIO34 (ADC)
- BH1750 SDA: GPIO21 (I2C)
- BH1750 SCL: GPIO22 (I2C)

### Timing Configuration
- Telemetry interval: 60 seconds
- Heartbeat interval: 60 seconds
- WiFi reconnect delay: 5 seconds
- MQTT reconnect delay: 5 seconds
- WiFi portal timeout: 180 seconds (3 minutes)

### Network Defaults
- Backend: 192.168.1.100:8000
- MQTT: 192.168.1.100:8883 (TLS)
- MQTT topic prefix: "devices"
- AP name: "PlantOps-Sensor"

## How to Verify

```bash
# Check project structure
tree firmware/

# Verify all tests pass
make check

# Check configuration files exist
ls firmware/platformio.ini
ls firmware/include/config.h
ls firmware/include/secrets.h.example
ls firmware/src/main.cpp
ls firmware/README.md

# Verify gitignore entries
grep "firmware/.pio/" .gitignore
grep "firmware/include/secrets.h" .gitignore
```

Expected results:
- All 139 backend tests pass
- Frontend builds successfully
- All firmware files present
- Gitignore properly configured

## Interfaces/Contracts

### Firmware Version
- Version constant: `FIRMWARE_VERSION = "1.0.0"`
- Printed on serial startup

### TODO Markers for Future Tasks
In `src/main.cpp`:
- `TODO: Initialize WiFi (task-034)` - WiFiManager setup
- `TODO: Initialize sensors (task-035)` - DHT22, soil moisture, BH1750 init
- `TODO: Register with backend (task-034)` - HTTP registration to get MQTT credentials
- `TODO: Connect to MQTT (task-035)` - TLS MQTT connection
- `TODO: Read sensors and publish telemetry (task-035)` - Sensor loop
- `TODO: Send heartbeat (task-035)` - Heartbeat messages
- `TODO: Handle reconnection (task-035)` - WiFi/MQTT recovery

### Configuration Contract
- `config.h` defines all pins, intervals, and network defaults
- `secrets.h` (copied from .example) provides WiFi credentials and overrides
- Backend URL configurable via secrets
- MQTT credentials obtained dynamically from backend (not hardcoded)

## Next Steps

### Task-034: WiFi Manager and Backend Registration
- Implement WiFiManager captive portal for first boot
- HTTP client to POST device registration to backend
- Receive and store MQTT credentials
- Handle WiFi reconnection logic

### Task-035: Sensor Reading and MQTT Publishing
- Initialize DHT22, soil moisture sensor, BH1750
- Read sensor values on interval
- Publish telemetry to MQTT topics
- Implement TLS for MQTT connection
- Send heartbeat messages
- Handle MQTT reconnection

## Risks and Follow-ups

### Build System
- PlatformIO libraries will download on first build (internet required)
- `min_spiffs.csv` partition scheme must exist in ESP32 platform (standard with espressif32)
- Build flags assume PSRAM-equipped ESP32 (non-PSRAM boards should remove `-DBOARD_HAS_PSRAM`)

### Security
- `secrets.h` excluded from git via `.gitignore`
- Users must manually copy `secrets.h.example` to `secrets.h` and populate
- MQTT credentials obtained dynamically (not stored in firmware)
- TLS configuration to be implemented in task-035

### Hardware Compatibility
- Pin assignments are for standard ESP32-DevKitC
- Other ESP32 boards may require pin adjustments in `config.h`
- BH1750 is optional (telemetry should handle missing sensor gracefully)

### Testing
- No firmware unit tests implemented (PlatformIO native testing not in scope)
- Manual testing required with actual hardware
- Serial output provides debugging via `DEBUG_SERIAL` flag

## Definition of Done Checklist

- [x] `firmware/platformio.ini` configured for ESP32
- [x] `firmware/src/main.cpp` compiles (with TODOs)
- [x] `firmware/include/config.h` has all configuration
- [x] `firmware/include/secrets.h.example` template created
- [x] `firmware/README.md` documents hardware and setup
- [x] `.gitignore` excludes PlatformIO build files
- [x] Project structure matches specification
- [x] All existing tests still pass (`make check`)

All requirements satisfied. Ready for WiFi/backend integration (task-034).

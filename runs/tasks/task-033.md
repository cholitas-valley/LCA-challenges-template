---
task_id: task-033
title: ESP32 PlatformIO Project Scaffold
role: lca-backend
follow_roles: []
post:
  - lca-recorder
  - code-simplifier
  - lca-gitops
depends_on: []
inputs:
  - objective.md
  - runs/plan.md
allowed_paths:
  - firmware/**
  - .gitignore
check_command: make check
handoff: runs/handoffs/task-033.md
---

# Task 033: ESP32 PlatformIO Project Scaffold

## Goal

Create the PlatformIO project structure for ESP32 firmware with basic configuration, build system, and project files.

## Requirements

### Project Structure

Create the following directory structure:

```
firmware/
├── platformio.ini          # PlatformIO configuration
├── include/
│   ├── README             # Include directory info
│   ├── config.h           # Configuration header
│   └── secrets.h.example  # Secrets template
├── lib/
│   └── README             # Library directory info
├── src/
│   └── main.cpp           # Main entry point
├── data/                   # SPIFFS data files (for WiFi portal)
│   └── .gitkeep
└── README.md              # Firmware documentation
```

### PlatformIO Configuration

Create `firmware/platformio.ini`:

```ini
[env:esp32dev]
platform = espressif32
board = esp32dev
framework = arduino
monitor_speed = 115200

; Library dependencies
lib_deps =
    knolleary/PubSubClient@^2.8
    bblanchon/ArduinoJson@^7.0
    https://github.com/tzapu/WiFiManager.git

; Build flags
build_flags =
    -DCORE_DEBUG_LEVEL=3
    -DBOARD_HAS_PSRAM

; Upload settings
upload_speed = 921600

; Partition scheme with OTA support
board_build.partitions = min_spiffs.csv

; SPIFFS for WiFi portal config storage
board_build.filesystem = spiffs
```

### Main Entry Point

Create `firmware/src/main.cpp`:

```cpp
/**
 * PlantOps ESP32 Sensor Firmware
 * 
 * This firmware:
 * 1. Connects to WiFi via captive portal (first boot) or stored credentials
 * 2. Registers with the PlantOps backend to get MQTT credentials
 * 3. Publishes sensor telemetry to MQTT
 * 4. Sends heartbeat messages every 60 seconds
 * 
 * Hardware Support:
 * - DHT22: Temperature and humidity
 * - Capacitive soil moisture sensor
 * - BH1750: Light level sensor
 */

#include <Arduino.h>

// Forward declarations
void setup();
void loop();

// Configuration
const char* FIRMWARE_VERSION = "1.0.0";

void setup() {
    Serial.begin(115200);
    delay(1000);
    
    Serial.println();
    Serial.println("=================================");
    Serial.println("PlantOps Sensor Firmware");
    Serial.printf("Version: %s\n", FIRMWARE_VERSION);
    Serial.println("=================================");
    
    // TODO: Initialize WiFi (task-034)
    // TODO: Initialize sensors (task-035)
    // TODO: Register with backend (task-034)
    // TODO: Connect to MQTT (task-035)
}

void loop() {
    // TODO: Read sensors and publish telemetry (task-035)
    // TODO: Send heartbeat (task-035)
    // TODO: Handle reconnection (task-035)
    
    delay(1000);
}
```

### Configuration Header

Create `firmware/include/config.h`:

```cpp
#ifndef CONFIG_H
#define CONFIG_H

// ===== Backend Configuration =====
// These are default values, can be overridden at runtime
#define DEFAULT_BACKEND_HOST "192.168.1.100"
#define DEFAULT_BACKEND_PORT 8000

// ===== MQTT Configuration =====
#define DEFAULT_MQTT_HOST "192.168.1.100"
#define DEFAULT_MQTT_PORT 8883  // TLS port
#define MQTT_TOPIC_PREFIX "devices"

// ===== Timing Configuration =====
#define TELEMETRY_INTERVAL_MS 60000   // 60 seconds
#define HEARTBEAT_INTERVAL_MS 60000   // 60 seconds
#define WIFI_RECONNECT_DELAY_MS 5000  // 5 seconds
#define MQTT_RECONNECT_DELAY_MS 5000  // 5 seconds

// ===== Sensor Pins =====
#define DHT_PIN 4           // DHT22 data pin
#define SOIL_MOISTURE_PIN 34 // Analog input for soil moisture
#define LIGHT_SENSOR_SDA 21  // I2C SDA for BH1750
#define LIGHT_SENSOR_SCL 22  // I2C SCL for BH1750

// ===== WiFi Manager =====
#define WIFI_PORTAL_TIMEOUT 180  // 3 minutes
#define AP_NAME "PlantOps-Sensor"

// ===== Debug =====
#define DEBUG_SERIAL true

#endif // CONFIG_H
```

### Secrets Template

Create `firmware/include/secrets.h.example`:

```cpp
#ifndef SECRETS_H
#define SECRETS_H

// ===== WiFi Credentials =====
// Leave empty to use WiFi Manager captive portal
#define WIFI_SSID ""
#define WIFI_PASSWORD ""

// ===== Backend =====
// Override default backend host/port if needed
#define BACKEND_HOST ""
#define BACKEND_PORT 8000

// ===== MQTT Credentials =====
// These are provided by the backend during registration
// Leave empty - will be populated after registration
#define MQTT_USERNAME ""
#define MQTT_PASSWORD ""

#endif // SECRETS_H
```

### Firmware README

Create `firmware/README.md`:

```markdown
# PlantOps ESP32 Firmware

ESP32-based plant monitoring sensor firmware for the PlantOps system.

## Hardware Requirements

- ESP32 development board
- DHT22 temperature/humidity sensor
- Capacitive soil moisture sensor
- BH1750 light level sensor (optional)

## Wiring

| Sensor | ESP32 Pin |
|--------|-----------|
| DHT22 Data | GPIO4 |
| Soil Moisture | GPIO34 (ADC) |
| BH1750 SDA | GPIO21 |
| BH1750 SCL | GPIO22 |

## Building

1. Install PlatformIO (VS Code extension or CLI)
2. Clone this repository
3. Copy `include/secrets.h.example` to `include/secrets.h`
4. Build and upload:
   ```bash
   pio run -t upload
   ```

## First Boot

1. Power on the ESP32
2. Connect to "PlantOps-Sensor" WiFi network
3. Configure WiFi credentials via captive portal
4. Device will auto-register with backend
5. Start monitoring!

## Configuration

Edit `include/config.h` to customize:
- Backend host/port
- MQTT host/port
- Sensor pins
- Timing intervals

## Serial Monitor

```bash
pio device monitor
```

## Factory Reset

Hold the BOOT button for 10 seconds to clear WiFi credentials.
```

### Git Configuration

Update `.gitignore` to include:

```
# Firmware
firmware/.pio/
firmware/.vscode/
firmware/include/secrets.h
```

## Constraints

- Use Arduino framework (not ESP-IDF directly)
- Use PlatformIO for build system
- Support ESP32-DevKitC and similar boards
- Keep secrets out of git
- Include placeholder comments for later tasks

## Definition of Done

- [ ] `firmware/platformio.ini` configured for ESP32
- [ ] `firmware/src/main.cpp` compiles (with TODOs)
- [ ] `firmware/include/config.h` has all configuration
- [ ] `firmware/include/secrets.h.example` template created
- [ ] `firmware/README.md` documents hardware and setup
- [ ] `.gitignore` excludes PlatformIO build files
- [ ] Project structure matches specification
- [ ] All existing tests still pass (`make check`)

## Notes

This task creates the project structure only. Actual functionality is implemented in:
- task-034: WiFi manager and backend registration
- task-035: Sensor reading, MQTT connection, and TLS

The firmware is designed for ESP32-DevKitC but should work with most ESP32 boards. Pin assignments can be customized in `config.h`.

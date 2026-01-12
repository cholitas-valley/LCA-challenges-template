---
task_id: task-035
title: ESP32 Sensors and MQTT with TLS
role: lca-backend
follow_roles: []
post:
  - lca-recorder
  - code-simplifier
  - lca-gitops
  - lca-docs
depends_on:
  - task-034
  - task-028
inputs:
  - objective.md
  - runs/plan.md
  - runs/handoffs/task-034.md
  - runs/handoffs/task-028.md
allowed_paths:
  - firmware/**
  - docs/**
check_command: make check
handoff: runs/handoffs/task-035.md
---

# Task 035: ESP32 Sensors and MQTT with TLS

## Goal

Complete the ESP32 firmware with sensor reading, MQTT publishing over TLS, and proper reconnection handling.

## Requirements

### Sensor Module

Create `firmware/src/sensors.cpp` and `firmware/include/sensors.h`:

```cpp
// sensors.h
#ifndef SENSORS_H
#define SENSORS_H

#include <Arduino.h>

// Sensor readings structure
struct SensorData {
    float temperature;      // Celsius
    float humidity;         // Percent
    float soilMoisture;     // Percent (0-100)
    float lightLevel;       // Lux
    bool valid;             // True if readings are valid
};

// Initialize all sensors
bool initSensors();

// Read all sensor values
SensorData readSensors();

#endif // SENSORS_H
```

```cpp
// sensors.cpp
#include "sensors.h"
#include "config.h"
#include <DHT.h>
#include <Wire.h>
#include <BH1750.h>

static DHT dht(DHT_PIN, DHT22);
static BH1750 lightMeter;
static bool sensorsInitialized = false;

bool initSensors() {
    Serial.println("[Sensors] Initializing...");
    
    // Initialize DHT22
    dht.begin();
    
    // Initialize I2C for BH1750
    Wire.begin(LIGHT_SENSOR_SDA, LIGHT_SENSOR_SCL);
    
    // Initialize BH1750
    if (lightMeter.begin(BH1750::CONTINUOUS_HIGH_RES_MODE)) {
        Serial.println("[Sensors] BH1750 initialized");
    } else {
        Serial.println("[Sensors] BH1750 not found (optional)");
    }
    
    sensorsInitialized = true;
    Serial.println("[Sensors] Ready");
    return true;
}

SensorData readSensors() {
    SensorData data;
    data.valid = false;
    
    if (!sensorsInitialized) {
        Serial.println("[Sensors] Not initialized!");
        return data;
    }
    
    // Read DHT22
    data.humidity = dht.readHumidity();
    data.temperature = dht.readTemperature();
    
    if (isnan(data.humidity) || isnan(data.temperature)) {
        Serial.println("[Sensors] DHT22 read failed");
        // Use placeholder values for testing
        data.temperature = 22.0;
        data.humidity = 50.0;
    }
    
    // Read soil moisture (analog)
    // Capacitive sensor: higher value = dryer soil
    // Calibrate these values for your specific sensor
    int rawMoisture = analogRead(SOIL_MOISTURE_PIN);
    // Map from ~4095 (dry) to ~1500 (wet) to 0-100%
    data.soilMoisture = map(constrain(rawMoisture, 1500, 4095), 4095, 1500, 0, 100);
    
    // Read light level
    float lux = lightMeter.readLightLevel();
    data.lightLevel = (lux >= 0) ? lux : 0;
    
    data.valid = true;
    
    Serial.printf("[Sensors] T:%.1f H:%.1f M:%.1f L:%.1f\n",
                  data.temperature, data.humidity, 
                  data.soilMoisture, data.lightLevel);
    
    return data;
}
```

### MQTT Module with TLS

Create `firmware/src/mqtt_client.cpp` and `firmware/include/mqtt_client.h`:

```cpp
// mqtt_client.h
#ifndef MQTT_CLIENT_H
#define MQTT_CLIENT_H

#include <Arduino.h>

// MQTT connection status
enum MqttStatus {
    MQTT_DISCONNECTED,
    MQTT_CONNECTING,
    MQTT_CONNECTED
};

// Initialize MQTT client with TLS
bool initMQTT(const String& host, int port, 
              const String& username, const String& password,
              const String& deviceId);

// Connect to MQTT broker
bool connectMQTT();

// Check and maintain MQTT connection
bool checkMQTTConnection();

// Get current MQTT status
MqttStatus getMQTTStatus();

// Publish telemetry data
bool publishTelemetry(float temperature, float humidity, 
                      float soilMoisture, float lightLevel);

// Publish heartbeat
bool publishHeartbeat();

// MQTT loop - call in main loop
void mqttLoop();

#endif // MQTT_CLIENT_H
```

```cpp
// mqtt_client.cpp
#include "mqtt_client.h"
#include "config.h"
#include <WiFiClientSecure.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>

// CA Certificate - embed from certs/ca.crt
// This is the PlantOps CA certificate
static const char* CA_CERT = R"EOF(
-----BEGIN CERTIFICATE-----
// CA certificate content will be added here
// Copy from certs/ca.crt after generation
-----END CERTIFICATE-----
)EOF";

static WiFiClientSecure espClient;
static PubSubClient mqttClient(espClient);
static MqttStatus currentStatus = MQTT_DISCONNECTED;

static String mqttHost;
static int mqttPort;
static String mqttUsername;
static String mqttPassword;
static String deviceId;
static String telemetryTopic;
static String heartbeatTopic;

static unsigned long lastReconnectAttempt = 0;

bool initMQTT(const String& host, int port,
              const String& username, const String& password,
              const String& devId) {
    Serial.println("[MQTT] Initializing...");
    
    mqttHost = host;
    mqttPort = port;
    mqttUsername = username;
    mqttPassword = password;
    deviceId = devId;
    
    // Build topic names
    telemetryTopic = String(MQTT_TOPIC_PREFIX) + "/" + deviceId + "/telemetry";
    heartbeatTopic = String(MQTT_TOPIC_PREFIX) + "/" + deviceId + "/heartbeat";
    
    Serial.printf("[MQTT] Host: %s:%d\n", mqttHost.c_str(), mqttPort);
    Serial.printf("[MQTT] Telemetry topic: %s\n", telemetryTopic.c_str());
    
    // Configure TLS
    espClient.setCACert(CA_CERT);
    
    // Configure MQTT client
    mqttClient.setServer(mqttHost.c_str(), mqttPort);
    mqttClient.setBufferSize(512);  // Increase buffer for JSON
    
    Serial.println("[MQTT] Ready");
    return true;
}

bool connectMQTT() {
    if (mqttClient.connected()) {
        currentStatus = MQTT_CONNECTED;
        return true;
    }
    
    currentStatus = MQTT_CONNECTING;
    Serial.printf("[MQTT] Connecting as %s...\n", mqttUsername.c_str());
    
    // Generate client ID
    String clientId = "plantops-" + deviceId;
    
    if (mqttClient.connect(clientId.c_str(), 
                           mqttUsername.c_str(), 
                           mqttPassword.c_str())) {
        currentStatus = MQTT_CONNECTED;
        Serial.println("[MQTT] Connected!");
        return true;
    } else {
        currentStatus = MQTT_DISCONNECTED;
        Serial.printf("[MQTT] Failed, rc=%d\n", mqttClient.state());
        return false;
    }
}

bool checkMQTTConnection() {
    if (mqttClient.connected()) {
        return true;
    }
    
    // Attempt reconnection with backoff
    unsigned long now = millis();
    if (now - lastReconnectAttempt > MQTT_RECONNECT_DELAY_MS) {
        lastReconnectAttempt = now;
        return connectMQTT();
    }
    
    return false;
}

MqttStatus getMQTTStatus() {
    return currentStatus;
}

bool publishTelemetry(float temperature, float humidity,
                      float soilMoisture, float lightLevel) {
    if (!mqttClient.connected()) {
        Serial.println("[MQTT] Not connected, cannot publish telemetry");
        return false;
    }
    
    // Build JSON payload
    JsonDocument doc;
    doc["timestamp"] = millis();  // Will be replaced by server timestamp
    doc["temperature"] = temperature;
    doc["humidity"] = humidity;
    doc["soil_moisture"] = soilMoisture;
    doc["light_level"] = lightLevel;
    
    String payload;
    serializeJson(doc, payload);
    
    bool success = mqttClient.publish(telemetryTopic.c_str(), payload.c_str());
    
    if (success) {
        Serial.printf("[MQTT] Published telemetry: %s\n", payload.c_str());
    } else {
        Serial.println("[MQTT] Publish failed");
    }
    
    return success;
}

bool publishHeartbeat() {
    if (!mqttClient.connected()) {
        return false;
    }
    
    JsonDocument doc;
    doc["timestamp"] = millis();
    doc["uptime"] = millis() / 1000;
    doc["rssi"] = WiFi.RSSI();
    
    String payload;
    serializeJson(doc, payload);
    
    bool success = mqttClient.publish(heartbeatTopic.c_str(), payload.c_str());
    
    if (success) {
        Serial.println("[MQTT] Heartbeat sent");
    }
    
    return success;
}

void mqttLoop() {
    mqttClient.loop();
}
```

### Complete Main Entry Point

Update `firmware/src/main.cpp`:

```cpp
#include <Arduino.h>
#include "config.h"
#include "wifi_manager.h"
#include "registration.h"
#include "sensors.h"
#include "mqtt_client.h"

const char* FIRMWARE_VERSION = "1.0.0";

// Global state
static RegistrationResult deviceCredentials;
static unsigned long lastTelemetryTime = 0;
static unsigned long lastHeartbeatTime = 0;
static unsigned long lastWifiCheck = 0;

// Factory reset button
#define RESET_BUTTON_PIN 0
#define RESET_HOLD_TIME_MS 10000

void checkFactoryReset() {
    static unsigned long buttonPressStart = 0;
    
    if (digitalRead(RESET_BUTTON_PIN) == LOW) {
        if (buttonPressStart == 0) {
            buttonPressStart = millis();
        } else if (millis() - buttonPressStart > RESET_HOLD_TIME_MS) {
            Serial.println("[Main] Factory reset!");
            clearStoredCredentials();
            resetWiFiCredentials();
        }
    } else {
        buttonPressStart = 0;
    }
}

void setup() {
    Serial.begin(115200);
    delay(1000);
    
    Serial.println();
    Serial.println("=================================");
    Serial.println("PlantOps Sensor Firmware");
    Serial.printf("Version: %s\n", FIRMWARE_VERSION);
    Serial.println("=================================");
    
    // Setup reset button
    pinMode(RESET_BUTTON_PIN, INPUT_PULLUP);
    
    // Initialize WiFi
    if (!initWiFi()) {
        Serial.println("[Main] WiFi failed, restarting...");
        delay(30000);
        ESP.restart();
    }
    
    // Register or load credentials
    if (isDeviceRegistered()) {
        deviceCredentials = loadStoredCredentials();
    } else {
        deviceCredentials = registerDevice(
            DEFAULT_BACKEND_HOST,
            DEFAULT_BACKEND_PORT,
            getDeviceMAC(),
            FIRMWARE_VERSION
        );
        
        if (deviceCredentials.success) {
            storeCredentials(deviceCredentials);
        } else {
            Serial.println("[Main] Registration failed, restarting...");
            delay(30000);
            ESP.restart();
        }
    }
    
    // Initialize sensors
    initSensors();
    
    // Initialize MQTT with TLS
    initMQTT(
        DEFAULT_MQTT_HOST,
        DEFAULT_MQTT_PORT,
        deviceCredentials.mqttUsername,
        deviceCredentials.mqttPassword,
        deviceCredentials.deviceId
    );
    
    // Connect to MQTT
    connectMQTT();
    
    Serial.println("[Main] Setup complete!");
}

void loop() {
    unsigned long now = millis();
    
    // Check factory reset button
    checkFactoryReset();
    
    // Check WiFi connection periodically
    if (now - lastWifiCheck > 10000) {
        lastWifiCheck = now;
        if (getWiFiStatus() != WIFI_CONNECTED) {
            checkWiFiConnection();
        }
    }
    
    // Maintain MQTT connection
    checkMQTTConnection();
    mqttLoop();
    
    // Publish telemetry
    if (now - lastTelemetryTime > TELEMETRY_INTERVAL_MS) {
        lastTelemetryTime = now;
        
        if (getMQTTStatus() == MQTT_CONNECTED) {
            SensorData data = readSensors();
            if (data.valid) {
                publishTelemetry(
                    data.temperature,
                    data.humidity,
                    data.soilMoisture,
                    data.lightLevel
                );
            }
        }
    }
    
    // Publish heartbeat
    if (now - lastHeartbeatTime > HEARTBEAT_INTERVAL_MS) {
        lastHeartbeatTime = now;
        publishHeartbeat();
    }
    
    delay(100);
}
```

### Update PlatformIO Dependencies

Update `firmware/platformio.ini`:

```ini
lib_deps =
    knolleary/PubSubClient@^2.8
    bblanchon/ArduinoJson@^7.0
    https://github.com/tzapu/WiFiManager.git
    adafruit/DHT sensor library@^1.4.6
    adafruit/Adafruit Unified Sensor@^1.1.14
    claws/BH1750@^1.3.0
```

### Create Firmware Documentation

Create `docs/firmware.md`:

```markdown
# PlantOps ESP32 Firmware Guide

## Hardware Requirements

| Component | Description | Purchase Link |
|-----------|-------------|---------------|
| ESP32-DevKitC | Main controller | [Amazon](https://amazon.com/...) |
| DHT22 | Temperature & humidity | [Amazon](https://amazon.com/...) |
| Capacitive Soil Sensor | Soil moisture | [Amazon](https://amazon.com/...) |
| BH1750 | Light level (optional) | [Amazon](https://amazon.com/...) |

## Wiring Diagram

```
ESP32-DevKitC
├── GPIO4  ─────── DHT22 Data
├── GPIO34 ─────── Soil Moisture Signal
├── GPIO21 (SDA) ─ BH1750 SDA
├── GPIO22 (SCL) ─ BH1750 SCL
├── 3.3V ───────── DHT22 VCC, BH1750 VCC
├── 5V ─────────── Soil Moisture VCC
└── GND ────────── All GNDs
```

## Building & Flashing

### Prerequisites

1. Install PlatformIO:
   - VS Code: Install "PlatformIO IDE" extension
   - CLI: `pip install platformio`

2. Clone repository and navigate to firmware:
   ```bash
   cd firmware
   ```

### Build

```bash
pio run
```

### Flash

```bash
pio run -t upload
```

### Monitor Serial Output

```bash
pio device monitor
```

## First Boot Setup

1. **Power on ESP32** - LED blinks rapidly

2. **Connect to WiFi Portal**:
   - Find "PlantOps-Sensor" network on your phone/computer
   - Connect (no password)
   - Browser should open captive portal

3. **Configure WiFi**:
   - Select your home WiFi network
   - Enter password
   - Device will restart

4. **Automatic Registration**:
   - Device connects to configured WiFi
   - Registers with PlantOps backend
   - Receives MQTT credentials
   - Starts publishing telemetry

## Configuration

### Backend Address

Edit `firmware/include/config.h`:

```cpp
#define DEFAULT_BACKEND_HOST "192.168.1.100"
#define DEFAULT_BACKEND_PORT 8000
#define DEFAULT_MQTT_HOST "192.168.1.100"
#define DEFAULT_MQTT_PORT 8883
```

### Sensor Pins

```cpp
#define DHT_PIN 4
#define SOIL_MOISTURE_PIN 34
#define LIGHT_SENSOR_SDA 21
#define LIGHT_SENSOR_SCL 22
```

### Timing

```cpp
#define TELEMETRY_INTERVAL_MS 60000   // 1 minute
#define HEARTBEAT_INTERVAL_MS 60000   // 1 minute
```

## Factory Reset

Hold the BOOT button for 10 seconds to:
- Clear WiFi credentials
- Clear device registration
- Restart in setup mode

## Troubleshooting

### WiFi Portal Doesn't Appear

1. Hold BOOT button for 10 seconds (factory reset)
2. Check serial output for errors
3. Ensure ESP32 is powered correctly

### Registration Fails

1. Check backend is running
2. Verify backend IP in config.h
3. Check serial output for HTTP errors
4. Ensure ESP32 can reach backend network

### MQTT Connection Fails

1. Verify Mosquitto is running
2. Check TLS certificate is valid
3. Ensure port 8883 is accessible
4. Check serial output for connection errors

### Sensor Readings Invalid

1. Check wiring connections
2. Verify sensor power (3.3V or 5V)
3. Test sensors individually
4. Check serial output for sensor errors

## LED Status Codes

| Pattern | Meaning |
|---------|---------|
| Fast blink | WiFi portal active |
| Slow blink | Connecting |
| Solid | Connected and working |
| Off | Error or deep sleep |

## Power Consumption

| State | Current |
|-------|---------|
| Active | ~80mA |
| WiFi Transmit | ~200mA |
| Deep Sleep | ~10uA |

For battery operation, consider implementing deep sleep between readings.
```

## Constraints

- Use WiFiClientSecure for TLS
- Embed CA certificate in firmware
- Support reconnection on both WiFi and MQTT
- Gracefully handle sensor failures
- Keep memory usage reasonable

## Definition of Done

- [ ] Sensor module reads DHT22, soil moisture, BH1750
- [ ] MQTT client connects with TLS using embedded CA cert
- [ ] Telemetry published every 60 seconds
- [ ] Heartbeat published every 60 seconds
- [ ] Auto-reconnect on MQTT disconnect
- [ ] Factory reset clears all credentials
- [ ] Serial output shows all operations
- [ ] `docs/firmware.md` created with setup guide
- [ ] All existing tests still pass (`make check`)

## Notes

To embed the CA certificate:
1. Generate certificates: `make certs`
2. Copy content of `certs/ca.crt`
3. Paste into `mqtt_client.cpp` CA_CERT constant

The MQTT topics match the backend expectations:
- Telemetry: `devices/{device_id}/telemetry`
- Heartbeat: `devices/{device_id}/heartbeat`

The JSON payload format matches what the backend expects from run/003.

---
task_id: task-034
title: ESP32 WiFi Manager and Backend Registration
role: lca-backend
follow_roles: []
post:
  - lca-recorder
  - code-simplifier
  - lca-gitops
depends_on:
  - task-033
inputs:
  - objective.md
  - runs/plan.md
  - runs/handoffs/task-033.md
allowed_paths:
  - firmware/**
check_command: make check
handoff: runs/handoffs/task-034.md
---

# Task 034: ESP32 WiFi Manager and Backend Registration

## Goal

Implement WiFi connectivity with captive portal configuration and automatic device registration with the PlantOps backend.

## Requirements

### WiFi Manager Module

Create `firmware/src/wifi_manager.cpp` and `firmware/include/wifi_manager.h`:

```cpp
// wifi_manager.h
#ifndef WIFI_MANAGER_H
#define WIFI_MANAGER_H

#include <Arduino.h>

// WiFi status
enum WifiStatus {
    WIFI_DISCONNECTED,
    WIFI_CONNECTING,
    WIFI_CONNECTED,
    WIFI_PORTAL_ACTIVE
};

// Initialize WiFi with manager (captive portal on first boot)
bool initWiFi();

// Check and maintain WiFi connection
bool checkWiFiConnection();

// Get current WiFi status
WifiStatus getWiFiStatus();

// Get device MAC address (used as device ID)
String getDeviceMAC();

// Reset WiFi credentials (factory reset)
void resetWiFiCredentials();

#endif // WIFI_MANAGER_H
```

```cpp
// wifi_manager.cpp
#include "wifi_manager.h"
#include "config.h"
#include <WiFiManager.h>

static WiFiManager wm;
static WifiStatus currentStatus = WIFI_DISCONNECTED;
static String deviceMAC;

bool initWiFi() {
    Serial.println("[WiFi] Initializing...");
    
    // Get MAC address
    uint8_t mac[6];
    WiFi.macAddress(mac);
    char macStr[18];
    snprintf(macStr, sizeof(macStr), "%02X:%02X:%02X:%02X:%02X:%02X",
             mac[0], mac[1], mac[2], mac[3], mac[4], mac[5]);
    deviceMAC = String(macStr);
    Serial.printf("[WiFi] Device MAC: %s\n", deviceMAC.c_str());
    
    // Configure WiFi Manager
    wm.setConfigPortalTimeout(WIFI_PORTAL_TIMEOUT);
    wm.setAPCallback([](WiFiManager* wm) {
        currentStatus = WIFI_PORTAL_ACTIVE;
        Serial.println("[WiFi] Config portal started");
        Serial.printf("[WiFi] Connect to AP: %s\n", AP_NAME);
    });
    
    // Try to connect, open portal if needed
    currentStatus = WIFI_CONNECTING;
    bool connected = wm.autoConnect(AP_NAME);
    
    if (connected) {
        currentStatus = WIFI_CONNECTED;
        Serial.println("[WiFi] Connected!");
        Serial.printf("[WiFi] IP: %s\n", WiFi.localIP().toString().c_str());
        return true;
    } else {
        currentStatus = WIFI_DISCONNECTED;
        Serial.println("[WiFi] Failed to connect");
        return false;
    }
}

bool checkWiFiConnection() {
    if (WiFi.status() == WL_CONNECTED) {
        currentStatus = WIFI_CONNECTED;
        return true;
    }
    
    currentStatus = WIFI_DISCONNECTED;
    Serial.println("[WiFi] Reconnecting...");
    
    // Try to reconnect
    WiFi.reconnect();
    delay(WIFI_RECONNECT_DELAY_MS);
    
    return WiFi.status() == WL_CONNECTED;
}

WifiStatus getWiFiStatus() {
    return currentStatus;
}

String getDeviceMAC() {
    return deviceMAC;
}

void resetWiFiCredentials() {
    Serial.println("[WiFi] Resetting credentials...");
    wm.resetSettings();
    ESP.restart();
}
```

### Backend Registration Module

Create `firmware/src/registration.cpp` and `firmware/include/registration.h`:

```cpp
// registration.h
#ifndef REGISTRATION_H
#define REGISTRATION_H

#include <Arduino.h>

// Registration result
struct RegistrationResult {
    bool success;
    String deviceId;
    String mqttUsername;
    String mqttPassword;
    String errorMessage;
};

// Register device with backend
RegistrationResult registerDevice(const String& backendHost, int backendPort, 
                                   const String& macAddress, const String& firmwareVersion);

// Check if device is already registered (has stored credentials)
bool isDeviceRegistered();

// Store registration credentials to NVS
void storeCredentials(const RegistrationResult& result);

// Load stored credentials
RegistrationResult loadStoredCredentials();

// Clear stored credentials
void clearStoredCredentials();

#endif // REGISTRATION_H
```

```cpp
// registration.cpp
#include "registration.h"
#include "config.h"
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <Preferences.h>

static Preferences preferences;
static const char* NVS_NAMESPACE = "plantops";

RegistrationResult registerDevice(const String& backendHost, int backendPort,
                                   const String& macAddress, const String& firmwareVersion) {
    RegistrationResult result;
    result.success = false;
    
    Serial.printf("[Reg] Registering with backend at %s:%d\n", 
                  backendHost.c_str(), backendPort);
    
    HTTPClient http;
    String url = "http://" + backendHost + ":" + String(backendPort) + "/api/devices/register";
    
    http.begin(url);
    http.addHeader("Content-Type", "application/json");
    
    // Build JSON payload
    JsonDocument doc;
    doc["mac_address"] = macAddress;
    doc["firmware_version"] = firmwareVersion;
    
    String payload;
    serializeJson(doc, payload);
    
    Serial.printf("[Reg] POST %s\n", url.c_str());
    Serial.printf("[Reg] Payload: %s\n", payload.c_str());
    
    int httpCode = http.POST(payload);
    
    if (httpCode == 200 || httpCode == 201) {
        String response = http.getString();
        Serial.printf("[Reg] Response: %s\n", response.c_str());
        
        JsonDocument responseDoc;
        DeserializationError error = deserializeJson(responseDoc, response);
        
        if (!error) {
            result.success = true;
            result.deviceId = responseDoc["device_id"].as<String>();
            result.mqttUsername = responseDoc["mqtt_username"].as<String>();
            result.mqttPassword = responseDoc["mqtt_password"].as<String>();
            
            Serial.printf("[Reg] Success! Device ID: %s\n", result.deviceId.c_str());
        } else {
            result.errorMessage = "JSON parse error";
            Serial.printf("[Reg] JSON error: %s\n", error.c_str());
        }
    } else {
        result.errorMessage = "HTTP " + String(httpCode);
        Serial.printf("[Reg] HTTP error: %d\n", httpCode);
    }
    
    http.end();
    return result;
}

bool isDeviceRegistered() {
    preferences.begin(NVS_NAMESPACE, true);
    bool hasCredentials = preferences.isKey("device_id");
    preferences.end();
    return hasCredentials;
}

void storeCredentials(const RegistrationResult& result) {
    preferences.begin(NVS_NAMESPACE, false);
    preferences.putString("device_id", result.deviceId);
    preferences.putString("mqtt_user", result.mqttUsername);
    preferences.putString("mqtt_pass", result.mqttPassword);
    preferences.end();
    Serial.println("[Reg] Credentials stored to NVS");
}

RegistrationResult loadStoredCredentials() {
    RegistrationResult result;
    result.success = false;
    
    preferences.begin(NVS_NAMESPACE, true);
    
    if (preferences.isKey("device_id")) {
        result.success = true;
        result.deviceId = preferences.getString("device_id", "");
        result.mqttUsername = preferences.getString("mqtt_user", "");
        result.mqttPassword = preferences.getString("mqtt_pass", "");
        Serial.printf("[Reg] Loaded stored credentials for: %s\n", result.deviceId.c_str());
    }
    
    preferences.end();
    return result;
}

void clearStoredCredentials() {
    preferences.begin(NVS_NAMESPACE, false);
    preferences.clear();
    preferences.end();
    Serial.println("[Reg] Credentials cleared");
}
```

### Update Main Entry Point

Update `firmware/src/main.cpp`:

```cpp
#include <Arduino.h>
#include "config.h"
#include "wifi_manager.h"
#include "registration.h"

const char* FIRMWARE_VERSION = "1.0.0";

// Global state
static RegistrationResult deviceCredentials;
static unsigned long lastReconnectAttempt = 0;

void setup() {
    Serial.begin(115200);
    delay(1000);
    
    Serial.println();
    Serial.println("=================================");
    Serial.println("PlantOps Sensor Firmware");
    Serial.printf("Version: %s\n", FIRMWARE_VERSION);
    Serial.println("=================================");
    
    // Initialize WiFi
    if (!initWiFi()) {
        Serial.println("[Main] WiFi failed, restarting in 30s...");
        delay(30000);
        ESP.restart();
    }
    
    // Check for stored credentials or register
    if (isDeviceRegistered()) {
        Serial.println("[Main] Device already registered");
        deviceCredentials = loadStoredCredentials();
    } else {
        Serial.println("[Main] New device, registering...");
        deviceCredentials = registerDevice(
            DEFAULT_BACKEND_HOST,
            DEFAULT_BACKEND_PORT,
            getDeviceMAC(),
            FIRMWARE_VERSION
        );
        
        if (deviceCredentials.success) {
            storeCredentials(deviceCredentials);
        } else {
            Serial.println("[Main] Registration failed, restarting in 30s...");
            delay(30000);
            ESP.restart();
        }
    }
    
    Serial.printf("[Main] Device ID: %s\n", deviceCredentials.deviceId.c_str());
    
    // TODO: Initialize sensors (task-035)
    // TODO: Connect to MQTT (task-035)
}

void loop() {
    // Check WiFi connection
    if (getWiFiStatus() != WIFI_CONNECTED) {
        if (millis() - lastReconnectAttempt > WIFI_RECONNECT_DELAY_MS) {
            lastReconnectAttempt = millis();
            checkWiFiConnection();
        }
    }
    
    // TODO: Read sensors and publish telemetry (task-035)
    // TODO: Send heartbeat (task-035)
    // TODO: Handle MQTT reconnection (task-035)
    
    delay(100);
}
```

### Factory Reset Handler

Add button handler for factory reset:

```cpp
// In main.cpp or separate module
#define RESET_BUTTON_PIN 0  // BOOT button on most ESP32 boards
#define RESET_HOLD_TIME_MS 10000

void checkFactoryReset() {
    static unsigned long buttonPressStart = 0;
    
    if (digitalRead(RESET_BUTTON_PIN) == LOW) {
        if (buttonPressStart == 0) {
            buttonPressStart = millis();
        } else if (millis() - buttonPressStart > RESET_HOLD_TIME_MS) {
            Serial.println("[Main] Factory reset triggered!");
            clearStoredCredentials();
            resetWiFiCredentials();
            // resetWiFiCredentials() calls ESP.restart()
        }
    } else {
        buttonPressStart = 0;
    }
}
```

## Constraints

- Use WiFiManager library for captive portal
- Use Preferences library for NVS storage
- Use ArduinoJson for JSON handling
- Registration endpoint matches backend API
- Store credentials securely in NVS (encrypted flash)

## Definition of Done

- [ ] WiFi Manager initializes and creates captive portal on first boot
- [ ] WiFi credentials stored and used on subsequent boots
- [ ] Device registers with backend using MAC address
- [ ] MQTT credentials received and stored in NVS
- [ ] Factory reset clears all credentials
- [ ] Auto-reconnect on WiFi disconnect
- [ ] Registration retries on failure
- [ ] All existing tests still pass (`make check`)

## Notes

The registration flow:
1. ESP32 boots with no credentials
2. Creates "PlantOps-Sensor" WiFi AP
3. User connects and configures WiFi via captive portal
4. Device connects to configured WiFi
5. Device sends POST to `/api/devices/register` with MAC address
6. Backend returns device_id, mqtt_username, mqtt_password
7. Credentials stored in ESP32 NVS
8. On reboot, uses stored credentials

The backend registration API was implemented in run/003 and returns:
```json
{
  "device_id": "dev-abc123",
  "mqtt_username": "dev_abc123",
  "mqtt_password": "random_secure_password"
}
```

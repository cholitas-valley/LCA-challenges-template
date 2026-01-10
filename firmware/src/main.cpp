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
#include "config.h"
#include "wifi_manager.h"
#include "registration.h"

// Forward declarations
void setup();
void loop();
void checkFactoryReset();

// Configuration
const char* FIRMWARE_VERSION = "1.0.0";

// Factory reset button configuration
#define RESET_BUTTON_PIN 0  // BOOT button on most ESP32 boards
#define RESET_HOLD_TIME_MS 10000

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

    // Initialize factory reset button
    pinMode(RESET_BUTTON_PIN, INPUT_PULLUP);

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
    // Check for factory reset button
    checkFactoryReset();

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

void checkFactoryReset() {
    static unsigned long buttonPressStart = 0;

    if (digitalRead(RESET_BUTTON_PIN) == LOW) {
        if (buttonPressStart == 0) {
            buttonPressStart = millis();
            Serial.println("[Main] Factory reset button pressed...");
        } else if (millis() - buttonPressStart > RESET_HOLD_TIME_MS) {
            Serial.println("[Main] Factory reset triggered!");
            clearStoredCredentials();
            resetWiFiCredentials();
            // resetWiFiCredentials() calls ESP.restart()
        }
    } else {
        if (buttonPressStart != 0) {
            Serial.println("[Main] Factory reset button released");
        }
        buttonPressStart = 0;
    }
}

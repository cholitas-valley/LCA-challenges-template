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
#define WIFI_CHECK_INTERVAL_MS 10000

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

    // Check for factory reset button
    checkFactoryReset();

    // Check WiFi connection periodically
    if (now - lastWifiCheck > WIFI_CHECK_INTERVAL_MS) {
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

void checkFactoryReset() {
    static unsigned long buttonPressStart = 0;

    bool buttonPressed = digitalRead(RESET_BUTTON_PIN) == LOW;

    if (!buttonPressed) {
        buttonPressStart = 0;
        return;
    }

    if (buttonPressStart == 0) {
        buttonPressStart = millis();
        return;
    }

    if (millis() - buttonPressStart > RESET_HOLD_TIME_MS) {
        Serial.println("[Main] Factory reset!");
        clearStoredCredentials();
        resetWiFiCredentials();
    }
}

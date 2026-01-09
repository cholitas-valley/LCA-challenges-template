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

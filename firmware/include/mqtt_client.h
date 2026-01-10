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

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

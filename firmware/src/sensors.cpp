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

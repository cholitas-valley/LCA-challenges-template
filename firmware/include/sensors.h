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

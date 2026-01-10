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

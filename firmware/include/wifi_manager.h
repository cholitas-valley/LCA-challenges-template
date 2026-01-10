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

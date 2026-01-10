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

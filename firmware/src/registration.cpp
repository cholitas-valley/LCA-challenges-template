#include "registration.h"
#include "config.h"
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <Preferences.h>

static Preferences preferences;
static const char* NVS_NAMESPACE = "plantops";

RegistrationResult registerDevice(const String& backendHost, int backendPort,
                                   const String& macAddress, const String& firmwareVersion) {
    RegistrationResult result;
    result.success = false;
    
    Serial.printf("[Reg] Registering with backend at %s:%d\n", 
                  backendHost.c_str(), backendPort);
    
    HTTPClient http;
    String url = "http://" + backendHost + ":" + String(backendPort) + "/api/devices/register";
    
    http.begin(url);
    http.addHeader("Content-Type", "application/json");
    
    // Build JSON payload
    JsonDocument doc;
    doc["mac_address"] = macAddress;
    doc["firmware_version"] = firmwareVersion;
    
    String payload;
    serializeJson(doc, payload);
    
    Serial.printf("[Reg] POST %s\n", url.c_str());
    Serial.printf("[Reg] Payload: %s\n", payload.c_str());
    
    int httpCode = http.POST(payload);
    
    if (httpCode == 200 || httpCode == 201) {
        String response = http.getString();
        Serial.printf("[Reg] Response: %s\n", response.c_str());
        
        JsonDocument responseDoc;
        DeserializationError error = deserializeJson(responseDoc, response);
        
        if (!error) {
            result.success = true;
            result.deviceId = responseDoc["device_id"].as<String>();
            result.mqttUsername = responseDoc["mqtt_username"].as<String>();
            result.mqttPassword = responseDoc["mqtt_password"].as<String>();
            
            Serial.printf("[Reg] Success! Device ID: %s\n", result.deviceId.c_str());
        } else {
            result.errorMessage = "JSON parse error";
            Serial.printf("[Reg] JSON error: %s\n", error.c_str());
        }
    } else {
        result.errorMessage = "HTTP " + String(httpCode);
        Serial.printf("[Reg] HTTP error: %d\n", httpCode);
    }
    
    http.end();
    return result;
}

bool isDeviceRegistered() {
    preferences.begin(NVS_NAMESPACE, true);
    bool hasCredentials = preferences.isKey("device_id");
    preferences.end();
    return hasCredentials;
}

void storeCredentials(const RegistrationResult& result) {
    preferences.begin(NVS_NAMESPACE, false);
    preferences.putString("device_id", result.deviceId);
    preferences.putString("mqtt_user", result.mqttUsername);
    preferences.putString("mqtt_pass", result.mqttPassword);
    preferences.end();
    Serial.println("[Reg] Credentials stored to NVS");
}

RegistrationResult loadStoredCredentials() {
    RegistrationResult result;
    result.success = false;
    
    preferences.begin(NVS_NAMESPACE, true);
    
    if (preferences.isKey("device_id")) {
        result.success = true;
        result.deviceId = preferences.getString("device_id", "");
        result.mqttUsername = preferences.getString("mqtt_user", "");
        result.mqttPassword = preferences.getString("mqtt_pass", "");
        Serial.printf("[Reg] Loaded stored credentials for: %s\n", result.deviceId.c_str());
    }
    
    preferences.end();
    return result;
}

void clearStoredCredentials() {
    preferences.begin(NVS_NAMESPACE, false);
    preferences.clear();
    preferences.end();
    Serial.println("[Reg] Credentials cleared");
}

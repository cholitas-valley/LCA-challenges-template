#include "mqtt_client.h"
#include "config.h"
#include <WiFiClientSecure.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>

// CA Certificate - embed from certs/ca.crt
// This is the PlantOps CA certificate
static const char* CA_CERT = R"EOF(
-----BEGIN CERTIFICATE-----
MIIFpzCCA4+gAwIBAgIUf3dZVOsnmA2JyUj0yZWmBEiKRDQwDQYJKoZIhvcNAQEL
BQAwYzELMAkGA1UEBhMCVVMxEzARBgNVBAgMCkNhbGlmb3JuaWExFjAUBgNVBAcM
DVNhbiBGcmFuY2lzY28xETAPBgNVBAoMCFBsYW50T3BzMRQwEgYDVQQDDAtQbGFu
dE9wcyBDQTAeFw0yNjAxMDkyMjU5MDVaFw0zNjAxMDcyMjU5MDVaMGMxCzAJBgNV
BAYTAlVTMRMwEQYDVQQIDApDYWxpZm9ybmlhMRYwFAYDVQQHDA1TYW4gRnJhbmNp
c2NvMREwDwYDVQQKDAhQbGFudE9wczEUMBIGA1UEAwwLUGxhbnRPcHMgQ0EwggIi
MA0GCSqGSIb3DQEBAQUAA4ICDwAwggIKAoICAQDA84qjwfnfMc2ozdYh9qdvVLls
mnRmFsENmPNsJn/pduq/YjRu0oP+K02qhHYTtq4vh6HoAUc5xAU/G62gnJv5nlF4
Gv+bw20ud/d4BMxdt8pWwLv8vdbKb8ipMzCSBDJQ4AD2LdnndPcVu1REDCKSam3p
qb+K754QxwVgBAF62krsGPlAAcUmUScRccZLZD5yddog6SDNK719D2O7w8F3PYix
KOO7veKrNzf4CCk81cApvu3Y6IpSnm/4NUkrWOecKgPcCV4ChX6REn6FyZOeEywz
BSQ5OH0A6AEx9JFJarkk93w7LFLaejGVsHWHLScCYMJCPzsliR0X8FHskcQbJ12y
I5a0EDgvbVqTJCVEKhmsxinO+f+zDRyClo+sJO4Bjo8kq0PHiCDavqofM5EKHGCN
MSS42lCBDRln6MMhFvGyJw9ZjhA3TCZbR2BZabcs66Uy/VBAKa7aQRegIgnkBedB
6rnCrhTEXFGkLXpHN1M7IEM+H5xaHjHBADMFmNy34B25uks3z6/v6stUPrLV0xZT
ZPeijI9FfIZ39axm7QuCMH9I3kYfdMs1NFFYsZ17cAsnxpjx6L8b91ALGVqg+xv/
GZ5wXhE5gE5pDkoPSPZaNtHMmc2N2rQ4gtPR+rgfn+wCf18cPgKLmGMkZX84UXR7
Pk+127YJwczG8kQdbQIDAQABo1MwUTAdBgNVHQ4EFgQUUCmPKIjkqsDyigXe488w
SB2WGcUwHwYDVR0jBBgwFoAUUCmPKIjkqsDyigXe488wSB2WGcUwDwYDVR0TAQH/
BAUwAwEB/zANBgkqhkiG9w0BAQsFAAOCAgEAuZG7NzFS4b4YxPuEzoaJ+B/8y2Kc
QmVkKKfnqk78M/jTyFIJ9xbeAq3GSbCk7SosePtrlrEJ5K9MmoNbjzFI7m7xz6jN
TYY8uuMvL52HebEOiDvnhioMpM4qAbiip8LWR7W2A4wc6gGtOATGk8nDZob6IGt7
sXc/UaAWPYdnRudfpZOJKYUVLwxz5Mh9UetnucuWUpr6b/9Mo4h/hg6G7XEgHjVi
OhkbHGynbm2+9jqQSAmN3k3d/O9SSpEGVTlzI55P51ZPPP3n+Lqj6xPk8SiajzBD
+5wu0O+Qv9EtbN9GBjF+0ylXtZBUnD6ZsVT38INgLqgD5rnk+iTHcEgf08bCXVyj
hPTHDREOFAyFg3zsV9dX+QRJ8KKvwsl3v9SWLvjdBcHyOVC/ByJb9DSaXKeZ2Mg+
WwD3iY8H0YFlSXuFtrgkOHkkHiKsFUW/q5iL7mcDlZVeOuybojmSUxId9QAVtR+W
kn+LNL3JSh44NPQ4/3GqcipPBK3Fwit7sAKNjmk15SBqcOzB3zZ4TrGRcv+Yc1DQ
5Upk2bAN0eRp815Bet63YhGPQFdKemHNde1TyiH55W5yBglYlvyduqNE/xB6W+/X
F1J10nYPPvo13Ijchn3Fp5ZU4M1xLO847o7fr5xfplNwhcyXLMMhCFu7s0f+GgMH
VyumDtO+494tUbU=
-----END CERTIFICATE-----
)EOF";

static WiFiClientSecure espClient;
static PubSubClient mqttClient(espClient);
static MqttStatus currentStatus = MQTT_DISCONNECTED;

static String mqttHost;
static int mqttPort;
static String mqttUsername;
static String mqttPassword;
static String deviceId;
static String telemetryTopic;
static String heartbeatTopic;

static unsigned long lastReconnectAttempt = 0;

bool initMQTT(const String& host, int port,
              const String& username, const String& password,
              const String& devId) {
    Serial.println("[MQTT] Initializing...");
    
    mqttHost = host;
    mqttPort = port;
    mqttUsername = username;
    mqttPassword = password;
    deviceId = devId;
    
    // Build topic names
    telemetryTopic = String(MQTT_TOPIC_PREFIX) + "/" + deviceId + "/telemetry";
    heartbeatTopic = String(MQTT_TOPIC_PREFIX) + "/" + deviceId + "/heartbeat";
    
    Serial.printf("[MQTT] Host: %s:%d\n", mqttHost.c_str(), mqttPort);
    Serial.printf("[MQTT] Telemetry topic: %s\n", telemetryTopic.c_str());
    
    // Configure TLS
    espClient.setCACert(CA_CERT);
    
    // Configure MQTT client
    mqttClient.setServer(mqttHost.c_str(), mqttPort);
    mqttClient.setBufferSize(512);  // Increase buffer for JSON
    
    Serial.println("[MQTT] Ready");
    return true;
}

bool connectMQTT() {
    if (mqttClient.connected()) {
        currentStatus = MQTT_CONNECTED;
        return true;
    }
    
    currentStatus = MQTT_CONNECTING;
    Serial.printf("[MQTT] Connecting as %s...\n", mqttUsername.c_str());
    
    // Generate client ID
    String clientId = "plantops-" + deviceId;
    
    if (mqttClient.connect(clientId.c_str(), 
                           mqttUsername.c_str(), 
                           mqttPassword.c_str())) {
        currentStatus = MQTT_CONNECTED;
        Serial.println("[MQTT] Connected!");
        return true;
    } else {
        currentStatus = MQTT_DISCONNECTED;
        Serial.printf("[MQTT] Failed, rc=%d\n", mqttClient.state());
        return false;
    }
}

bool checkMQTTConnection() {
    if (mqttClient.connected()) {
        return true;
    }
    
    // Attempt reconnection with backoff
    unsigned long now = millis();
    if (now - lastReconnectAttempt > MQTT_RECONNECT_DELAY_MS) {
        lastReconnectAttempt = now;
        return connectMQTT();
    }
    
    return false;
}

MqttStatus getMQTTStatus() {
    return currentStatus;
}

bool publishTelemetry(float temperature, float humidity,
                      float soilMoisture, float lightLevel) {
    if (!mqttClient.connected()) {
        Serial.println("[MQTT] Not connected, cannot publish telemetry");
        return false;
    }
    
    // Build JSON payload
    JsonDocument doc;
    doc["timestamp"] = millis();  // Will be replaced by server timestamp
    doc["temperature"] = temperature;
    doc["humidity"] = humidity;
    doc["soil_moisture"] = soilMoisture;
    doc["light_level"] = lightLevel;
    
    String payload;
    serializeJson(doc, payload);
    
    if (!mqttClient.publish(telemetryTopic.c_str(), payload.c_str())) {
        Serial.println("[MQTT] Publish failed");
        return false;
    }

    Serial.printf("[MQTT] Published telemetry: %s\n", payload.c_str());
    return true;
}

bool publishHeartbeat() {
    if (!mqttClient.connected()) {
        return false;
    }
    
    JsonDocument doc;
    doc["timestamp"] = millis();
    doc["uptime"] = millis() / 1000;
    doc["rssi"] = WiFi.RSSI();
    
    String payload;
    serializeJson(doc, payload);

    if (!mqttClient.publish(heartbeatTopic.c_str(), payload.c_str())) {
        return false;
    }

    Serial.println("[MQTT] Heartbeat sent");
    return true;
}

void mqttLoop() {
    mqttClient.loop();
}

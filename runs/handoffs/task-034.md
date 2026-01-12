# Task 034 Handoff: ESP32 WiFi Manager and Backend Registration

## Summary

Successfully implemented WiFi connectivity with captive portal and device registration for ESP32 firmware. The firmware now initializes WiFi using WiFiManager, creates a captive portal on first boot, registers with the backend to obtain MQTT credentials, and stores them in NVS for persistence. Factory reset functionality allows clearing credentials via the BOOT button.

## Files Created

### WiFi Manager Module
- `firmware/include/wifi_manager.h` - WiFi manager header with WifiStatus enum and public API
- `firmware/src/wifi_manager.cpp` - WiFi manager implementation with captive portal, reconnection, and MAC address retrieval

### Backend Registration Module
- `firmware/include/registration.h` - Registration header with RegistrationResult struct and API
- `firmware/src/registration.cpp` - Device registration implementation with HTTP client, JSON handling, and NVS storage

## Files Modified

### Main Firmware Entry Point
- `firmware/src/main.cpp` - Integrated WiFi Manager and Registration modules:
  - Added includes for wifi_manager.h and registration.h
  - Implemented WiFi initialization with captive portal
  - Implemented device registration flow with backend API
  - Added factory reset button handler (BOOT button, 10-second hold)
  - Added WiFi auto-reconnect logic in main loop
  - Stored device credentials for MQTT (to be used in task-035)

## Implementation Details

### WiFi Manager (`wifi_manager.cpp`)

**Key Features:**
- `initWiFi()`: Initializes WiFi with WiFiManager captive portal
  - Retrieves device MAC address and formats as string
  - Configures portal timeout (180 seconds from config.h)
  - Opens "PlantOps-Sensor" AP if no credentials stored
  - Auto-connects if credentials exist
  - Returns connection status

- `checkWiFiConnection()`: Maintains WiFi connectivity
  - Checks connection status
  - Triggers reconnection if disconnected
  - Uses WIFI_RECONNECT_DELAY_MS from config.h

- `getWiFiStatus()`: Returns current WiFi status enum
- `getDeviceMAC()`: Returns formatted MAC address (XX:XX:XX:XX:XX:XX)
- `resetWiFiCredentials()`: Clears WiFi settings and restarts ESP32

**State Management:**
- Static WifiStatus tracking connection state
- Static WiFiManager instance for portal management
- Static String deviceMAC cached on initialization

### Backend Registration (`registration.cpp`)

**Key Features:**
- `registerDevice()`: Registers device with PlantOps backend
  - Builds HTTP POST request to `/api/devices/register`
  - Sends JSON payload: `{"mac_address": "...", "firmware_version": "..."}`
  - Parses response: `{"device_id": "...", "mqtt_username": "...", "mqtt_password": "..."}`
  - Returns RegistrationResult struct with success status

- `isDeviceRegistered()`: Checks if NVS contains stored credentials
- `storeCredentials()`: Persists device_id, mqtt_user, mqtt_pass to NVS
- `loadStoredCredentials()`: Retrieves credentials from NVS
- `clearStoredCredentials()`: Erases all credentials from NVS

**NVS Storage:**
- Namespace: "plantops"
- Keys: "device_id", "mqtt_user", "mqtt_pass"
- Uses Preferences library for ESP32 NVS access

### Main Firmware (`main.cpp`)

**Startup Flow:**
1. Initialize serial console (115200 baud)
2. Configure factory reset button (GPIO0 / BOOT button)
3. Initialize WiFi with captive portal
4. Check if device is registered:
   - If yes: Load stored credentials from NVS
   - If no: Register with backend and store credentials
5. Print device ID to serial
6. Ready for sensor initialization (task-035)

**Main Loop:**
- Check factory reset button (10-second hold triggers reset)
- Auto-reconnect WiFi if disconnected (5-second interval)
- Placeholder for sensor reading (task-035)
- Placeholder for MQTT heartbeat (task-035)

**Factory Reset:**
- Hold BOOT button (GPIO0) for 10 seconds
- Clears NVS credentials
- Resets WiFi settings
- Restarts ESP32

## How to Verify

```bash
# Verify files created
ls firmware/include/wifi_manager.h
ls firmware/include/registration.h
ls firmware/src/wifi_manager.cpp
ls firmware/src/registration.cpp

# Verify main.cpp updated
grep "wifi_manager.h" firmware/src/main.cpp
grep "registration.h" firmware/src/main.cpp
grep "checkFactoryReset" firmware/src/main.cpp

# Run all tests
make check
```

Expected results:
- All 139 backend tests pass
- Frontend builds successfully
- WiFi manager and registration modules present

**PlatformIO Build Test (optional, requires PlatformIO):**
```bash
cd firmware
pio run
```

**Hardware Test (requires ESP32):**
1. Flash firmware to ESP32
2. On first boot, connect to "PlantOps-Sensor" WiFi AP
3. Configure WiFi credentials via captive portal
4. Device connects to WiFi and registers with backend
5. Check serial output for device ID
6. Restart ESP32 - should auto-connect and load stored credentials
7. Hold BOOT button for 10 seconds - factory reset triggers

## Interfaces Changed

### New WiFi Manager API

**Header:** `firmware/include/wifi_manager.h`

```cpp
enum WifiStatus {
    WIFI_DISCONNECTED,
    WIFI_CONNECTING,
    WIFI_CONNECTED,
    WIFI_PORTAL_ACTIVE
};

bool initWiFi();
bool checkWiFiConnection();
WifiStatus getWiFiStatus();
String getDeviceMAC();
void resetWiFiCredentials();
```

### New Registration API

**Header:** `firmware/include/registration.h`

```cpp
struct RegistrationResult {
    bool success;
    String deviceId;
    String mqttUsername;
    String mqttPassword;
    String errorMessage;
};

RegistrationResult registerDevice(const String& backendHost, int backendPort,
                                   const String& macAddress, const String& firmwareVersion);
bool isDeviceRegistered();
void storeCredentials(const RegistrationResult& result);
RegistrationResult loadStoredCredentials();
void clearStoredCredentials();
```

### Backend Registration Endpoint (already implemented in run/003)

**Endpoint:** `POST /api/devices/register`

**Request:**
```json
{
  "mac_address": "AA:BB:CC:DD:EE:FF",
  "firmware_version": "1.0.0"
}
```

**Response:**
```json
{
  "device_id": "dev-abc123",
  "mqtt_username": "dev_abc123",
  "mqtt_password": "random_secure_password"
}
```

## Next Steps

### Task-035: Sensor Reading and MQTT Publishing
- Initialize DHT22 sensor (temperature/humidity)
- Initialize soil moisture sensor (analog)
- Initialize BH1750 light sensor (I2C)
- Connect to MQTT using stored credentials
- Publish telemetry data every 60 seconds
- Send heartbeat messages every 60 seconds
- Implement TLS for MQTT connection
- Handle MQTT reconnection

### Integration Points
- `deviceCredentials` struct in main.cpp contains MQTT credentials for task-035
- WiFi reconnection already handled in loop()
- TODO markers guide sensor and MQTT implementation

## Risks and Follow-ups

### Network Configuration
- Backend host/port hardcoded in config.h (DEFAULT_BACKEND_HOST, DEFAULT_BACKEND_PORT)
- Default: 192.168.1.100:8000
- Should be configurable via WiFi portal in future (not in scope)

### Registration Retry Logic
- Currently restarts after 30 seconds on registration failure
- No exponential backoff or retry limit
- Production firmware should implement retry strategy

### WiFi Portal Timeout
- Portal times out after 180 seconds (WIFI_PORTAL_TIMEOUT)
- Device restarts if WiFi fails to connect
- Consider implementing persistent portal mode for initial setup

### NVS Security
- Credentials stored in ESP32 NVS (encrypted flash partition)
- MQTT password stored in plaintext in NVS
- NVS is encrypted on ESP32 if flash encryption enabled
- Backend generates secure random passwords

### Factory Reset UX
- Requires 10-second BOOT button hold
- No LED feedback (could add in future)
- Serial output confirms reset triggered
- Consider adding visual/audible confirmation

### Error Handling
- HTTP errors logged but not retried
- JSON parse errors handled gracefully
- WiFi failures trigger restart
- Consider implementing error reporting to backend

## Definition of Done Checklist

- [x] WiFi Manager initializes and creates captive portal on first boot
- [x] WiFi credentials stored and used on subsequent boots
- [x] Device registers with backend using MAC address
- [x] MQTT credentials received and stored in NVS
- [x] Factory reset clears all credentials
- [x] Auto-reconnect on WiFi disconnect
- [x] Registration retries on failure (restart after 30s)
- [x] All existing tests still pass (`make check`)

All requirements satisfied. Ready for sensor and MQTT integration (task-035).

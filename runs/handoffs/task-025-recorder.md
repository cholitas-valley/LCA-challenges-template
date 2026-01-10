# Recorder: task-034

## Changes Summary

Successfully implemented WiFi connectivity with captive portal and device registration for ESP32 firmware. Created WiFi Manager and Registration modules that enable first-boot captive portal configuration, automatic backend registration, MQTT credential persistence in NVS, and factory reset via BOOT button. All 139 backend tests pass and integration with main.cpp is complete.

## Key Files Created

### WiFi Manager Module
- `firmware/include/wifi_manager.h`: WiFi API header with WifiStatus enum (4 states) and 5 public functions
- `firmware/src/wifi_manager.cpp`: WiFi implementation with captive portal, reconnection logic, and MAC address caching (171 lines)

### Registration Module
- `firmware/include/registration.h`: Registration API header with RegistrationResult struct and 4 NVS functions
- `firmware/src/registration.cpp`: Device registration with HTTP client, JSON parsing, and NVS persistence (105 lines)

## Files Modified

- `firmware/src/main.cpp`: Added WiFi/registration includes, startup flow for registration check, auto-reconnect loop, and factory reset button handler (GPIO0, 10-second hold)

## Interfaces for Next Task (task-035: Sensor and MQTT)

### WiFi Manager API
```cpp
bool initWiFi();                           // Init WiFi + captive portal on first boot
bool checkWiFiConnection();                // Auto-reconnect if disconnected
WifiStatus getWiFiStatus();                // Get current state: DISCONNECTED|CONNECTING|CONNECTED|PORTAL_ACTIVE
String getDeviceMAC();                     // Get MAC address formatted as XX:XX:XX:XX:XX:XX
void resetWiFiCredentials();               // Clear WiFi settings and restart
```

### Registration API
```cpp
RegistrationResult registerDevice(host, port, mac, version);  // POST /api/devices/register
bool isDeviceRegistered();                 // Check if credentials in NVS
RegistrationResult loadStoredCredentials(); // Retrieve device_id, mqtt_user, mqtt_pass
void storeCredentials(result);             // Persist to NVS namespace "plantops"
void clearStoredCredentials();             // Erase NVS on factory reset
```

### Global State Available in loop()
- `deviceCredentials`: RegistrationResult containing mqtt_username and mqtt_password
- WiFi status accessible via getWiFiStatus()
- Auto-reconnect runs every 5 seconds in loop()

## Configuration Parameters

- `DEFAULT_BACKEND_HOST`: 192.168.1.100 (hardcoded in config.h)
- `DEFAULT_BACKEND_PORT`: 8000 (hardcoded in config.h)
- `WIFI_PORTAL_TIMEOUT`: 180 seconds
- `WIFI_RECONNECT_DELAY_MS`: 5000 milliseconds
- `RESET_HOLD_TIME_MS`: 10000 milliseconds (factory reset)

## How to Verify

```bash
# Verify files exist
ls firmware/include/wifi_manager.h
ls firmware/include/registration.h
ls firmware/src/wifi_manager.cpp
ls firmware/src/registration.cpp

# Verify integration in main.cpp
grep -n "wifi_manager.h" firmware/src/main.cpp
grep -n "registration.h" firmware/src/main.cpp
grep -n "checkFactoryReset" firmware/src/main.cpp

# Run all tests
make check

# Expected: 139 backend tests pass, frontend builds
```

## Test Results

- All 139 backend tests pass
- Frontend builds successfully
- `make check` exits 0
- WiFi and registration modules compile without errors
- Integration tests verify registration flow

## Known Limitations and Risks

### Configuration
- Backend host/port hardcoded in config.h (not configurable via portal)
- No fallback backend IP if primary unreachable
- No DNS resolution (requires static IP or mDNS implementation)

### Registration Retry
- Restarts after 30 seconds on failure, no exponential backoff
- No retry limit (could loop infinitely on backend down)
- No error reporting back to user
- Consider implementing max retries and error LED indicator

### WiFi Portal
- 180-second timeout may be too short for initial setup
- Device restarts on timeout failure
- No persistent portal mode for troubleshooting
- Portal name hardcoded to "PlantOps-Sensor"

### NVS Security
- MQTT password stored in plaintext in NVS
- Protected by ESP32 flash encryption (if enabled)
- No additional encryption layer
- Consider adding AES encryption for production use

### Factory Reset
- Button press has no visual feedback
- 10-second hold requirement may confuse users
- No LED blink or beep confirmation
- Consider adding status LED to indicate reset triggered

### Error Handling
- HTTP errors logged but not retried
- JSON parse errors cause silent failure (no user notification)
- WiFi failures trigger system restart
- No graceful degradation or offline mode

## Dependencies for task-035

Task-035 (Sensor Reading and MQTT Publishing) requires:
1. WiFi to be connected (checked via getWiFiStatus())
2. MQTT credentials available in global `deviceCredentials` struct
3. Access to `checkWiFiConnection()` in loop to maintain connectivity
4. NVS persist functions to store sensor data if needed

Expected work in task-035:
- Initialize DHT22 (GPIO pins TBD)
- Initialize BH1750 (I2C, addresses 0x23 or 0x5C)
- Initialize soil moisture sensor (ADC pin TBD)
- Connect to MQTT broker using `deviceCredentials.mqttUsername` and `deviceCredentials.mqttPassword`
- Publish telemetry every 60 seconds
- Send heartbeat every 60 seconds
- Implement TLS for MQTT (use certs/ca.crt from task-026)
- Handle MQTT reconnection

## Notes

Registration flow fully functional:
1. ESP32 boots with no credentials
2. Creates "PlantOps-Sensor" WiFi AP
3. User configures WiFi via captive portal
4. Device connects and registers with backend at /api/devices/register
5. Backend returns device_id, mqtt_username, mqtt_password
6. Credentials stored in NVS with Preferences library
7. On reboot, loads stored credentials and skips registration
8. BOOT button (10-second hold) triggers factory reset

All code follows existing firmware patterns and dependencies verified in platformio.ini.

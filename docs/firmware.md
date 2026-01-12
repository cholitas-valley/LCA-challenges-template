# PlantOps ESP32 Firmware Guide

## Hardware Requirements

| Component | Description |
|-----------|-------------|
| ESP32-DevKitC | Main controller |
| DHT22 | Temperature and humidity sensor |
| Capacitive Soil Sensor | Soil moisture sensor |
| BH1750 | Light level sensor (optional) |

## Wiring Diagram

```
ESP32-DevKitC
├── GPIO4  ─────── DHT22 Data
├── GPIO34 ─────── Soil Moisture Signal
├── GPIO21 (SDA) ─ BH1750 SDA
├── GPIO22 (SCL) ─ BH1750 SCL
├── 3.3V ───────── DHT22 VCC, BH1750 VCC
├── 5V ─────────── Soil Moisture VCC
└── GND ────────── All GNDs
```

## Building & Flashing

### Prerequisites

1. Install PlatformIO:
   - VS Code: Install "PlatformIO IDE" extension
   - CLI: `pip install platformio`

2. Clone repository and navigate to firmware:
   ```bash
   cd firmware
   ```

### Build

```bash
pio run
```

### Flash

```bash
pio run -t upload
```

### Monitor Serial Output

```bash
pio device monitor
```

## First Boot Setup

1. **Power on ESP32** - LED blinks rapidly

2. **Connect to WiFi Portal**:
   - Find "PlantOps-Sensor" network on your phone/computer
   - Connect (no password)
   - Browser should open captive portal

3. **Configure WiFi**:
   - Select your home WiFi network
   - Enter password
   - Device will restart

4. **Automatic Registration**:
   - Device connects to configured WiFi
   - Registers with PlantOps backend
   - Receives MQTT credentials
   - Starts publishing telemetry

## Configuration

### Backend Address

Edit `firmware/include/config.h`:

```cpp
#define DEFAULT_BACKEND_HOST "192.168.1.100"
#define DEFAULT_BACKEND_PORT 8000
#define DEFAULT_MQTT_HOST "192.168.1.100"
#define DEFAULT_MQTT_PORT 8883
```

### Sensor Pins

```cpp
#define DHT_PIN 4
#define SOIL_MOISTURE_PIN 34
#define LIGHT_SENSOR_SDA 21
#define LIGHT_SENSOR_SCL 22
```

### Timing

```cpp
#define TELEMETRY_INTERVAL_MS 60000   // 1 minute
#define HEARTBEAT_INTERVAL_MS 60000   // 1 minute
```

## Factory Reset

Hold the BOOT button for 10 seconds to:
- Clear WiFi credentials
- Clear device registration
- Restart in setup mode

## Troubleshooting

### WiFi Portal Doesn't Appear

1. Hold BOOT button for 10 seconds (factory reset)
2. Check serial output for errors
3. Ensure ESP32 is powered correctly

### Registration Fails

1. Check backend is running
2. Verify backend IP in config.h
3. Check serial output for HTTP errors
4. Ensure ESP32 can reach backend network

### MQTT Connection Fails

1. Verify Mosquitto is running
2. Check TLS certificate is valid
3. Ensure port 8883 is accessible
4. Check serial output for connection errors

### Sensor Readings Invalid

1. Check wiring connections
2. Verify sensor power (3.3V or 5V)
3. Test sensors individually
4. Check serial output for sensor errors

## LED Status Codes

| Pattern | Meaning |
|---------|---------|
| Fast blink | WiFi portal active |
| Slow blink | Connecting |
| Solid | Connected and working |
| Off | Error or deep sleep |

## Power Consumption

| State | Current |
|-------|---------|
| Active | ~80mA |
| WiFi Transmit | ~200mA |
| Deep Sleep | ~10uA |

For battery operation, consider implementing deep sleep between readings.

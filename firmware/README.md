# PlantOps ESP32 Firmware

ESP32-based plant monitoring sensor firmware for the PlantOps system.

## Hardware Requirements

- ESP32 development board
- DHT22 temperature/humidity sensor
- Capacitive soil moisture sensor
- BH1750 light level sensor (optional)

## Wiring

| Sensor | ESP32 Pin |
|--------|-----------|
| DHT22 Data | GPIO4 |
| Soil Moisture | GPIO34 (ADC) |
| BH1750 SDA | GPIO21 |
| BH1750 SCL | GPIO22 |

## Building

1. Install PlatformIO (VS Code extension or CLI)
2. Clone this repository
3. Copy `include/secrets.h.example` to `include/secrets.h`
4. Build and upload:
   ```bash
   pio run -t upload
   ```

## First Boot

1. Power on the ESP32
2. Connect to "PlantOps-Sensor" WiFi network
3. Configure WiFi credentials via captive portal
4. Device will auto-register with backend
5. Start monitoring!

## Configuration

Edit `include/config.h` to customize:
- Backend host/port
- MQTT host/port
- Sensor pins
- Timing intervals

## Serial Monitor

```bash
pio device monitor
```

## Factory Reset

Hold the BOOT button for 10 seconds to clear WiFi credentials.

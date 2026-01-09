#!/usr/bin/env python3
"""
PlantOps Device Simulator

Simulates an IoT sensor device that:
1. Registers with the backend (or uses existing credentials)
2. Connects to MQTT broker
3. Publishes fake telemetry data periodically

Usage:
    python3 scripts/simulator.py [--mac MAC_ADDRESS] [--interval SECONDS]

Examples:
    python3 scripts/simulator.py
    python3 scripts/simulator.py --mac aa:bb:cc:dd:ee:ff --interval 5
"""

import argparse
import json
import random
import time
from datetime import datetime

import paho.mqtt.client as mqtt
import requests

API_URL = "http://localhost:8000/api"
MQTT_HOST = "localhost"
MQTT_PORT = 1883


def generate_mac():
    """Generate a random MAC address."""
    return ":".join(f"{random.randint(0, 255):02x}" for _ in range(6))


def register_device(mac_address: str) -> dict:
    """Register device and get MQTT credentials."""
    print(f"Registering device with MAC: {mac_address}")

    response = requests.post(
        f"{API_URL}/devices/register",
        json={"mac_address": mac_address},
    )
    response.raise_for_status()

    data = response.json()
    print(f"Device ID: {data['device_id']}")
    print(f"MQTT Username: {data['mqtt_username']}")

    return data


def generate_telemetry() -> dict:
    """Generate realistic fake sensor readings."""
    return {
        "temperature": round(random.uniform(18.0, 28.0), 1),
        "humidity": round(random.uniform(40.0, 80.0), 1),
        "soil_moisture": round(random.uniform(20.0, 90.0), 1),
        "light": random.randint(100, 2000),
        "timestamp": datetime.utcnow().isoformat() + "Z",
    }


def on_connect(client, userdata, flags, rc, properties=None):
    """MQTT connection callback."""
    if rc == 0:
        print("Connected to MQTT broker")
    else:
        print(f"Failed to connect, return code: {rc}")


def on_publish(client, userdata, mid, properties=None, reason_code=None):
    """MQTT publish callback."""
    pass


def main():
    parser = argparse.ArgumentParser(description="PlantOps Device Simulator")
    parser.add_argument("--mac", help="MAC address (default: random)")
    parser.add_argument("--interval", type=int, default=10, help="Publish interval in seconds (default: 10)")
    args = parser.parse_args()

    mac_address = args.mac or generate_mac()

    # Register device
    try:
        creds = register_device(mac_address)
    except requests.exceptions.RequestException as e:
        print(f"Failed to register device: {e}")
        return 1

    device_id = creds["device_id"]
    mqtt_username = creds["mqtt_username"]
    mqtt_password = creds["mqtt_password"]

    if mqtt_password == "<stored_securely>":
        print("\nThis device was already registered. The password is stored securely and cannot be retrieved.")
        print("Please register a new device with a different MAC address, or delete this device first.")
        return 1

    # Wait for Mosquitto to reload password file
    print("Waiting for MQTT credentials to propagate...")
    time.sleep(2)

    # Connect to MQTT
    print(f"\nConnecting to MQTT broker at {MQTT_HOST}:{MQTT_PORT}...")

    client = mqtt.Client(mqtt.CallbackAPIVersion.VERSION2, client_id=device_id)
    client.username_pw_set(mqtt_username, mqtt_password)
    client.on_connect = on_connect
    client.on_publish = on_publish

    try:
        client.connect(MQTT_HOST, MQTT_PORT, 60)
    except Exception as e:
        print(f"Failed to connect to MQTT: {e}")
        return 1

    client.loop_start()
    time.sleep(1)  # Wait for connection

    telemetry_topic = f"devices/{device_id}/telemetry"
    heartbeat_topic = f"devices/{device_id}/heartbeat"

    print(f"\nPublishing to: {telemetry_topic}")
    print(f"Interval: {args.interval} seconds")
    print("Press Ctrl+C to stop\n")

    try:
        while True:
            # Publish telemetry
            telemetry = generate_telemetry()
            payload = json.dumps(telemetry)
            result = client.publish(telemetry_topic, payload)

            print(f"[{datetime.now().strftime('%H:%M:%S')}] "
                  f"temp={telemetry['temperature']}C "
                  f"humidity={telemetry['humidity']}% "
                  f"soil={telemetry['soil_moisture']}% "
                  f"light={telemetry['light']}lux")

            # Publish heartbeat
            client.publish(heartbeat_topic, json.dumps({"status": "online"}))

            time.sleep(args.interval)

    except KeyboardInterrupt:
        print("\nStopping simulator...")
    finally:
        client.loop_stop()
        client.disconnect()

    return 0


if __name__ == "__main__":
    exit(main())

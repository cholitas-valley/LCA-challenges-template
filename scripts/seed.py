#!/usr/bin/env python3
"""
PlantOps Test Data Seeder

Creates sample plants, registers devices, assigns them, and generates telemetry.
Run this after `make up` to populate the system with test data.

Usage:
    python3 scripts/seed.py
"""

import json
import random
import time
from datetime import datetime

import paho.mqtt.client as mqtt
import requests

API_URL = "http://localhost:8000/api"
MQTT_HOST = "localhost"
MQTT_PORT = 1883

# Test plants
PLANTS = [
    {"name": "Monstera Deliciosa", "species": "Monstera deliciosa"},
    {"name": "Snake Plant", "species": "Sansevieria trifasciata"},
    {"name": "Pothos", "species": "Epipremnum aureum"},
]

# Test devices (MAC addresses)
DEVICES = [
    "aa:bb:cc:00:00:01",
    "aa:bb:cc:00:00:02",
    "aa:bb:cc:00:00:03",
]


def create_plants():
    """Create test plants."""
    print("\n=== Creating Plants ===")
    plant_ids = []

    for plant in PLANTS:
        # Check if plant already exists
        response = requests.get(f"{API_URL}/plants")
        existing = [p for p in response.json()["plants"] if p["name"] == plant["name"]]

        if existing:
            print(f"  Plant '{plant['name']}' already exists")
            plant_ids.append(existing[0]["id"])
        else:
            response = requests.post(f"{API_URL}/plants", json=plant)
            if response.status_code == 201:
                plant_id = response.json()["id"]
                plant_ids.append(plant_id)
                print(f"  Created: {plant['name']} (id={plant_id[:8]}...)")
            else:
                print(f"  Failed to create {plant['name']}: {response.text}")

    return plant_ids


def register_devices():
    """Register test devices and get MQTT credentials."""
    print("\n=== Registering Devices ===")
    devices = []

    for mac in DEVICES:
        response = requests.post(
            f"{API_URL}/devices/register",
            json={"mac_address": mac},
        )

        if response.status_code == 200:
            data = response.json()
            device_id = data["device_id"]
            password = data["mqtt_password"]

            if password == "<stored_securely>":
                print(f"  Device {mac} already registered (can't get password)")
                # Try to get device info
                dev_response = requests.get(f"{API_URL}/devices")
                for d in dev_response.json()["devices"]:
                    if d["mac_address"] == mac:
                        devices.append({
                            "id": d["id"],
                            "mac": mac,
                            "username": d["mqtt_username"],
                            "password": None,  # Can't retrieve
                        })
                        break
            else:
                devices.append({
                    "id": device_id,
                    "mac": mac,
                    "username": data["mqtt_username"],
                    "password": password,
                })
                print(f"  Registered: {mac} -> {data['mqtt_username']}")
        else:
            print(f"  Failed to register {mac}: {response.text}")

    return devices


def assign_devices_to_plants(devices, plant_ids):
    """Assign each device to a plant."""
    print("\n=== Assigning Devices to Plants ===")

    for i, device in enumerate(devices):
        if i >= len(plant_ids):
            break

        plant_id = plant_ids[i]
        response = requests.post(
            f"{API_URL}/devices/{device['id']}/provision",
            json={"plant_id": plant_id},
        )

        if response.status_code == 200:
            print(f"  Assigned device {device['id'][:8]}... to plant {plant_id[:8]}...")
        else:
            print(f"  Failed to assign: {response.text}")


def send_telemetry(devices, count=10, interval=2):
    """Send test telemetry data via MQTT."""
    print(f"\n=== Sending Telemetry ({count} readings per device) ===")

    # Filter devices with passwords
    active_devices = [d for d in devices if d.get("password")]

    if not active_devices:
        print("  No devices with known passwords. Please re-register devices.")
        print("  Run: make down && make up && python3 scripts/seed.py")
        return

    # Wait for Mosquitto to reload
    print("  Waiting for MQTT credentials to propagate...")
    time.sleep(3)

    # Connect each device
    clients = []
    for device in active_devices:
        client = mqtt.Client(mqtt.CallbackAPIVersion.VERSION2, client_id=device["id"])
        client.username_pw_set(device["username"], device["password"])

        try:
            client.connect(MQTT_HOST, MQTT_PORT, 60)
            client.loop_start()
            clients.append((device, client))
            print(f"  Connected: {device['username']}")
        except Exception as e:
            print(f"  Failed to connect {device['username']}: {e}")

    if not clients:
        print("  No devices connected. Check MQTT credentials.")
        return

    time.sleep(1)

    # Send telemetry
    for i in range(count):
        for device, client in clients:
            telemetry = {
                "temperature": round(random.uniform(18.0, 28.0), 1),
                "humidity": round(random.uniform(40.0, 80.0), 1),
                "soil_moisture": round(random.uniform(30.0, 70.0), 1),
                "light": random.randint(200, 1500),
                "timestamp": datetime.utcnow().isoformat() + "Z",
            }

            topic = f"devices/{device['id']}/telemetry"
            client.publish(topic, json.dumps(telemetry))

            heartbeat_topic = f"devices/{device['id']}/heartbeat"
            client.publish(heartbeat_topic, json.dumps({"status": "online"}))

        print(f"  Sent reading {i + 1}/{count}")
        if i < count - 1:
            time.sleep(interval)

    # Cleanup
    for _, client in clients:
        client.loop_stop()
        client.disconnect()

    print("  Done!")


def reload_services():
    """Restart Mosquitto and backend to reload credentials."""
    print("\n=== Reloading Services ===")
    import subprocess
    try:
        # Restart Mosquitto to load new passwords
        result = subprocess.run(
            ["docker", "compose", "restart", "mosquitto"],
            capture_output=True,
            text=True,
            timeout=30,
        )
        if result.returncode == 0:
            print("  Mosquitto restarted")
        else:
            print(f"  Warning: {result.stderr}")

        time.sleep(2)

        # Restart backend to reconnect to MQTT
        result = subprocess.run(
            ["docker", "compose", "restart", "backend"],
            capture_output=True,
            text=True,
            timeout=30,
        )
        if result.returncode == 0:
            print("  Backend restarted")
            time.sleep(3)  # Wait for backend to start
        else:
            print(f"  Warning: {result.stderr}")

    except Exception as e:
        print(f"  Warning: Could not restart services: {e}")


def main():
    print("PlantOps Test Data Seeder")
    print("=" * 40)

    # Create plants
    plant_ids = create_plants()

    # Register devices
    devices = register_devices()

    # Reload services to pick up new credentials
    reload_services()

    # Assign devices to plants
    assign_devices_to_plants(devices, plant_ids)

    # Send telemetry
    send_telemetry(devices, count=5, interval=2)

    print("\n" + "=" * 40)
    print("Seeding complete!")
    print(f"  Plants: {len(plant_ids)}")
    print(f"  Devices: {len(devices)}")
    print("\nOpen http://localhost:5173 to view the dashboard")


if __name__ == "__main__":
    main()

#!/bin/bash
# Test MQTT TLS connection

set -e

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo "Testing MQTT connections..."
echo

# Check if MQTT_BACKEND_PASSWORD is set
if [ -z "$MQTT_BACKEND_PASSWORD" ]; then
  echo "Error: MQTT_BACKEND_PASSWORD environment variable not set"
  echo "Usage: MQTT_BACKEND_PASSWORD=your_password $0"
  exit 1
fi

# Test plain TCP (should work)
echo -n "Testing plain TCP (port 1883): "
if mosquitto_pub -h localhost -p 1883 -u plantops_backend -P "$MQTT_BACKEND_PASSWORD" \
  -t "test/hello" -m "plain tcp test" 2>/dev/null; then
  echo -e "${GREEN}OK${NC}"
else
  echo -e "${RED}FAILED${NC}"
  exit 1
fi

# Test TLS (should work)
echo -n "Testing TLS (port 8883): "
if mosquitto_pub -h localhost -p 8883 -u plantops_backend -P "$MQTT_BACKEND_PASSWORD" \
  --cafile certs/ca.crt \
  -t "test/hello" -m "tls test" 2>/dev/null; then
  echo -e "${GREEN}OK${NC}"
else
  echo -e "${RED}FAILED${NC}"
  exit 1
fi

echo
echo "All MQTT tests passed!"

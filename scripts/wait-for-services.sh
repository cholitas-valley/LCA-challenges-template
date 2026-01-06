#!/bin/bash
set -e

MAX_WAIT=60
ELAPSED=0

echo "Checking Docker Compose services..."

while [ $ELAPSED -lt $MAX_WAIT ]; do
  # Check if all required services are running
  if docker compose ps --format json 2>/dev/null | grep -q "running"; then
    # Check backend health endpoint
    if curl -sf http://localhost:3000/api/health > /dev/null 2>&1; then
      # Check frontend is responding
      if curl -sf http://localhost:3001 > /dev/null 2>&1; then
        echo "All services are ready!"
        exit 0
      fi
    fi
  fi

  echo "Waiting for services... ($ELAPSED/$MAX_WAIT seconds)"
  sleep 2
  ELAPSED=$((ELAPSED + 2))
done

echo "ERROR: Services not ready after $MAX_WAIT seconds"
echo "Service status:"
docker compose ps
exit 1

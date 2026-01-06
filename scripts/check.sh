#!/usr/bin/env bash
set -e

echo "================================"
echo "Running Quality Gate Checks"
echo "================================"
echo ""

echo "[1/4] Running lint..."
make lint
echo ""

echo "[2/4] Running typecheck..."
make typecheck
echo ""

echo "[3/4] Running tests..."
make test
echo ""

echo "[4/4] Running e2e tests..."
make e2e
echo ""

echo "================================"
echo "All quality gates passed!"
echo "================================"

---
task_id: task-026
title: TLS Certificate Generation
role: lca-backend
follow_roles: []
post:
  - lca-recorder
  - code-simplifier
  - lca-gitops
depends_on: []
inputs:
  - objective.md
  - runs/plan.md
allowed_paths:
  - certs/**
  - scripts/**
  - Makefile
check_command: make check
handoff: runs/handoffs/task-026.md
---

# Task 026: TLS Certificate Generation

## Goal

Create a certificate generation script and initial TLS certificates for securing MQTT connections. The certificates will be self-signed, suitable for home production use.

## Requirements

### Certificate Structure

Create the following certificate hierarchy:

```
certs/
  ca.crt           # Certificate Authority (self-signed root)
  ca.key           # CA private key (keep secure)
  server.crt       # Mosquitto server certificate (signed by CA)
  server.key       # Server private key
  server.csr       # Server certificate signing request (intermediate)
  README.md        # Documentation for certificate management
```

### Generation Script

Create `scripts/generate_certs.sh`:

```bash
#!/bin/bash
# Generate self-signed TLS certificates for PlantOps MQTT

CERT_DIR="certs"
DAYS_VALID=3650  # 10 years for home use
COUNTRY="US"
STATE="California"
CITY="San Francisco"
ORG="PlantOps"
CN_CA="PlantOps CA"
CN_SERVER="mosquitto"  # Must match hostname

# ... implementation
```

Requirements:
- Use OpenSSL for certificate generation
- CA certificate valid for 10 years
- Server certificate valid for 10 years
- RSA 4096-bit keys for security
- Server cert must have Subject Alternative Names (SAN) for:
  - `localhost`
  - `mosquitto` (Docker service name)
  - `127.0.0.1`
- Script should be idempotent (skip if certs exist, with --force to regenerate)
- Print clear instructions after generation

### Makefile Target

Add to Makefile:

```makefile
certs: ## Generate TLS certificates
	./scripts/generate_certs.sh

certs-force: ## Regenerate TLS certificates (overwrites existing)
	./scripts/generate_certs.sh --force
```

### Certificate Documentation

Create `certs/README.md` with:
- Purpose of each file
- How to regenerate certificates
- How to add CA to client trust stores
- Security notes (don't commit ca.key to git)

### Git Configuration

Update `.gitignore` to:
- Track `ca.crt` (needed by clients)
- Track `server.crt` (needed by Mosquitto)
- Ignore `*.key` files (private keys)
- Ignore `*.csr` files (intermediate)

## Constraints

- Do not modify backend Python code in this task
- Do not configure Mosquitto yet (task-027)
- Certificates must work with ESP32's mbedTLS library
- Use standard OpenSSL commands (no custom tools)

## Definition of Done

- [ ] `scripts/generate_certs.sh` exists and is executable
- [ ] Running `make certs` generates all certificate files
- [ ] CA and server certificates are valid (openssl verify passes)
- [ ] Server cert has correct SANs (localhost, mosquitto, 127.0.0.1)
- [ ] `certs/README.md` documents the certificate structure
- [ ] `.gitignore` excludes private keys
- [ ] Existing tests still pass (`make check`)

## Notes

The ESP32 firmware (task-035) will embed `ca.crt` to verify the server certificate. The CA private key (`ca.key`) should be kept secure and never committed to git.

For home use, 10-year validity is acceptable. Production deployments should use shorter-lived certificates with automated renewal.

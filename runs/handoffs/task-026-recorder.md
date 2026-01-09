# Recorder: task-026

## Changes Summary

Implemented complete TLS certificate generation infrastructure for securing MQTT connections. Created self-signed CA and server certificates suitable for home production use with comprehensive documentation and Makefile targets.

## Key Files

- `scripts/generate_certs.sh`: Idempotent OpenSSL certificate generation script (107 lines)
- `certs/README.md`: Comprehensive certificate documentation (213 lines)
- `certs/ca.crt`: Self-signed CA certificate (tracked in git)
- `certs/ca.key`: CA private key (excluded from git)
- `certs/server.crt`: Server certificate signed by CA (tracked in git)
- `certs/server.key`: Server private key (excluded from git)
- `certs/server.csr`: Certificate signing request (excluded from git)

## Files Modified

- `Makefile`: Added `certs` and `certs-force` targets and updated `.PHONY` declaration
- `.gitignore`: Added `*.key` and `*.csr` exclusions

## Interfaces for Next Task (task-027: Mosquitto TLS Configuration)

### Makefile Targets
```bash
make certs        # Generate TLS certificates (idempotent)
make certs-force  # Regenerate certificates (overwrites existing)
```

### Certificate Files Available
- `certs/server.crt`: Server certificate for Mosquitto TLS
- `certs/server.key`: Server private key
- `certs/ca.crt`: CA certificate for client verification

### Certificate Properties
- **Key Type:** RSA 4096-bit
- **Validity:** 10 years (3650 days)
- **CA Subject:** CN=PlantOps CA, O=PlantOps, L=San Francisco, ST=California, C=US
- **Server Subject:** CN=mosquitto, O=PlantOps, L=San Francisco, ST=California, C=US
- **Server SANs:** localhost, mosquitto, 127.0.0.1

## How to Verify

```bash
# Generate certificates
make certs

# Verify chain
openssl verify -CAfile certs/ca.crt certs/server.crt

# Check SANs
openssl x509 -in certs/server.crt -noout -text | grep -A1 "Subject Alternative Name"

# Verify key strength
openssl rsa -in certs/ca.key -noout -text 2>/dev/null | head -1

# Run tests
make check
```

## Test Results

- All 116 backend tests pass
- Frontend builds successfully
- `make check` exits 0
- Certificate chain validates: `certs/server.crt: OK`
- SANs correctly include: DNS:localhost, DNS:mosquitto, IP Address:127.0.0.1
- Idempotency verified: second `make certs` skips generation
- Force regeneration works: `make certs-force` creates new certificates
- Git correctly excludes private keys and CSRs

## Dependencies for Downstream Tasks

### Task 027 (Mosquitto TLS Configuration)
- Requires: certs/server.crt, certs/server.key
- Use certificates in mosquitto.conf
- Mount certs/ directory in docker-compose.yml

### Backend MQTT Client (Future)
- Requires: certs/ca.crt
- Configure paho-mqtt with tls_set("certs/ca.crt")

### Task 035 (ESP32 Firmware)
- Requires: certs/ca.crt content embedded as C string
- Use ca_cert in WiFiClientSecure.setCACert()

## Known Limitations

- 10-year validity suitable for home use only
- No automated certificate rotation mechanism
- No certificate expiration monitoring
- No key backup procedures documented
- Production deployments should use Let's Encrypt or similar

## Notes

Task 027 will configure Mosquitto to use these certificates:
1. Mount certs/ directory in docker-compose.yml
2. Set certfile, keyfile, cafile in Mosquitto config
3. Enable TLS listener on port 8883
4. Test with openssl s_client

All certificate generation and verification commands are documented in certs/README.md for future reference.
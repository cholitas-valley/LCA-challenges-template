# Task 026: TLS Certificate Generation - Handoff

## Summary

Successfully created TLS certificate generation infrastructure for securing MQTT connections. The solution includes:

1. **Certificate generation script** (`scripts/generate_certs.sh`) that creates a self-signed CA and server certificates
2. **Comprehensive documentation** (`certs/README.md`) covering certificate structure, usage, and security
3. **Makefile targets** (`certs`, `certs-force`) for easy certificate management
4. **Git configuration** to exclude private keys from version control

## Files Touched

### Created Files
- `scripts/generate_certs.sh` - Bash script for generating TLS certificates
- `certs/README.md` - Certificate documentation and management guide
- `certs/ca.crt` - CA certificate (generated, tracked in git)
- `certs/ca.key` - CA private key (generated, excluded from git)
- `certs/server.crt` - Server certificate (generated, tracked in git)
- `certs/server.key` - Server private key (generated, excluded from git)
- `certs/server.csr` - Certificate signing request (generated, excluded from git)

### Modified Files
- `Makefile` - Added `certs` and `certs-force` targets, updated help text and .PHONY
- `.gitignore` - Added exclusions for `*.key` and `*.csr` files

## Interfaces Changed

### New Makefile Targets
- `make certs` - Generate TLS certificates (idempotent, skips if exists)
- `make certs-force` - Regenerate TLS certificates (overwrites existing)

### Certificate Structure
```
certs/
  ca.crt           # Certificate Authority (self-signed root)
  ca.key           # CA private key (keep secure)
  server.crt       # Mosquitto server certificate (signed by CA)
  server.key       # Server private key
  server.csr       # Certificate signing request (intermediate)
  README.md        # Documentation
```

### Certificate Properties
- **Key Type**: RSA 4096-bit
- **Validity**: 10 years (3650 days)
- **CA Subject**: CN=PlantOps CA, O=PlantOps, L=San Francisco, ST=California, C=US
- **Server Subject**: CN=mosquitto, O=PlantOps, L=San Francisco, ST=California, C=US
- **Server SANs**: localhost, mosquitto, 127.0.0.1

## How to Verify

### 1. Generate certificates
```bash
make certs
```

Expected output: Successfully generates all certificate files

### 2. Verify idempotency
```bash
make certs
```

Expected output: "Certificates already exist in certs/"

### 3. Verify certificate validity
```bash
openssl verify -CAfile certs/ca.crt certs/server.crt
```

Expected output: `certs/server.crt: OK`

### 4. Check Subject Alternative Names
```bash
openssl x509 -in certs/server.crt -noout -text | grep -A1 "Subject Alternative Name"
```

Expected output: DNS:localhost, DNS:mosquitto, IP Address:127.0.0.1

### 5. Verify key strength
```bash
openssl rsa -in certs/ca.key -noout -text 2>/dev/null | head -1
openssl rsa -in certs/server.key -noout -text 2>/dev/null | head -1
```

Expected output: "Private-Key: (4096 bit, 2 primes)" for both

### 6. Check git exclusions
```bash
git add -n certs/
```

Expected output: Only adds ca.crt, server.crt, and README.md (excludes *.key and *.csr)

### 7. Run existing tests
```bash
make check
```

Expected output: All 116 tests pass, frontend builds successfully

## Implementation Notes

### Certificate Generation Script
- Uses OpenSSL for all certificate operations
- Implements idempotency: skips generation if certs exist
- Supports `--force` flag to regenerate certificates
- Creates temporary OpenSSL config file for SANs
- Sets secure file permissions (600 for private keys, 644 for public certs)
- Provides clear instructions after generation

### Security Features
- Private keys (*.key) excluded from git via .gitignore
- CSR files (*.csr) excluded from git
- CA and server certificates tracked in git (public, safe to distribute)
- 4096-bit RSA keys for long-term security
- 10-year validity suitable for home use

### Documentation
The `certs/README.md` includes:
- Certificate hierarchy and file descriptions
- How to generate and regenerate certificates
- How to verify certificates with OpenSSL
- How to add CA to various client trust stores (ESP32, Python, Linux, macOS)
- Security considerations and best practices
- Troubleshooting common issues
- References to relevant documentation

## Next Steps

### Immediate (task-027)
Configure Mosquitto to use the generated certificates:
- Set `certfile` to `certs/server.crt`
- Set `keyfile` to `certs/server.key`
- Set `cafile` to `certs/ca.crt`
- Enable TLS listener on port 8883

### Downstream Tasks
- **ESP32 firmware** (task-035): Embed `ca.crt` to verify server certificate
- **Backend MQTT client**: Configure to use `ca.crt` for server verification
- **Device provisioning**: Include CA certificate in provisioning workflow

## Risks and Follow-ups

### Risks
- **Certificate expiration**: 10-year certificates are suitable for home use but will need renewal in 2036
- **Key compromise**: If `ca.key` is compromised, all certificates must be regenerated
- **No certificate rotation**: Current implementation doesn't support gradual certificate rotation

### Follow-ups
- Consider adding certificate expiration monitoring
- Document key backup procedures for disaster recovery
- For production deployments, implement shorter validity periods and automated renewal

## Testing Performed

1. ✅ Generated certificates successfully with `make certs`
2. ✅ Verified idempotency - second run skipped generation
3. ✅ Verified certificate chain with `openssl verify`
4. ✅ Confirmed SANs include localhost, mosquitto, 127.0.0.1
5. ✅ Confirmed RSA 4096-bit keys
6. ✅ Verified 10-year validity period
7. ✅ Tested force regeneration with `make certs-force`
8. ✅ Confirmed git excludes private keys and CSRs
9. ✅ All existing tests pass (116 tests)
10. ✅ Frontend builds successfully

## Definition of Done Checklist

- [x] `scripts/generate_certs.sh` exists and is executable
- [x] Running `make certs` generates all certificate files
- [x] CA and server certificates are valid (openssl verify passes)
- [x] Server cert has correct SANs (localhost, mosquitto, 127.0.0.1)
- [x] `certs/README.md` documents the certificate structure
- [x] `.gitignore` excludes private keys
- [x] Existing tests still pass (`make check`)

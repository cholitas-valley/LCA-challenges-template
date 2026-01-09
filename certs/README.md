# PlantOps TLS Certificates

This directory contains TLS certificates for securing MQTT connections between ESP32 devices, the Mosquitto broker, and the backend service.

## Certificate Structure

```
certs/
  ca.crt           Certificate Authority (self-signed root) - TRACK IN GIT
  ca.key           CA private key - DO NOT COMMIT
  server.crt       Mosquitto server certificate (signed by CA) - TRACK IN GIT
  server.key       Server private key - DO NOT COMMIT
  server.csr       Server certificate signing request (intermediate) - DO NOT COMMIT
  README.md        This file
```

## Certificate Hierarchy

```
ca.crt (PlantOps CA)
  └─ server.crt (mosquitto)
```

The CA certificate is self-signed and acts as the root of trust. The server certificate is signed by the CA and used by Mosquitto for TLS connections.

## Files

### ca.crt - Certificate Authority
- **Purpose**: Root certificate for the PlantOps MQTT infrastructure
- **Usage**: 
  - Embedded in ESP32 firmware to verify server certificate
  - Added to backend MQTT client trust store
  - Distributed to any client needing to connect to Mosquitto
- **Security**: Safe to commit to git and distribute publicly
- **Validity**: 10 years (home use)

### ca.key - CA Private Key
- **Purpose**: Signs server certificates
- **Usage**: Only used when generating/renewing server certificates
- **Security**: **NEVER COMMIT TO GIT** - If compromised, attackers can issue trusted certificates
- **Storage**: Keep secure, back up offline

### server.crt - Server Certificate
- **Purpose**: Identifies the Mosquitto MQTT broker
- **Subject**: CN=mosquitto
- **SANs**: localhost, mosquitto, 127.0.0.1
- **Usage**: Presented by Mosquitto during TLS handshake
- **Security**: Safe to commit to git
- **Validity**: 10 years (home use)

### server.key - Server Private Key
- **Purpose**: Private key for server certificate
- **Usage**: Used by Mosquitto to establish TLS connections
- **Security**: **NEVER COMMIT TO GIT** - If compromised, attackers can impersonate the broker
- **Permissions**: Readable only by Mosquitto (chmod 600)

### server.csr - Certificate Signing Request
- **Purpose**: Intermediate file used during certificate generation
- **Usage**: Submitted to CA for signing
- **Security**: No sensitive data, but not needed after generation
- **Status**: Excluded from git

## Generating Certificates

### Initial Generation

```bash
make certs
```

This runs `scripts/generate_certs.sh` which:
1. Generates a 4096-bit RSA CA certificate (self-signed, 10-year validity)
2. Generates a 4096-bit RSA server key pair
3. Creates a CSR with Subject Alternative Names
4. Signs the server certificate with the CA
5. Sets appropriate file permissions

### Regenerating Certificates

If certificates expire or need to be regenerated:

```bash
make certs-force
```

**Warning**: This will overwrite existing certificates. Update all clients with the new `ca.crt` before restarting services.

### Manual Generation

If you need custom parameters:

```bash
./scripts/generate_certs.sh --force
```

## Verifying Certificates

### Verify server certificate is signed by CA

```bash
openssl verify -CAfile certs/ca.crt certs/server.crt
```

Should output: `certs/server.crt: OK`

### View certificate details

```bash
openssl x509 -in certs/server.crt -noout -text
```

### Check Subject Alternative Names

```bash
openssl x509 -in certs/server.crt -noout -text | grep -A1 "Subject Alternative Name"
```

Should include: `DNS:localhost, DNS:mosquitto, IP Address:127.0.0.1`

## Adding CA to Client Trust Stores

### ESP32 Firmware

Embed `ca.crt` in the firmware as a C string:

```c
const char* ca_cert = 
  "-----BEGIN CERTIFICATE-----\n"
  "...\n"
  "-----END CERTIFICATE-----\n";
```

Then configure WiFiClientSecure:

```c
client.setCACert(ca_cert);
```

### Python Backend

Configure paho-mqtt client:

```python
client.tls_set(ca_certs="certs/ca.crt")
```

### System Trust Store (Linux)

```bash
sudo cp certs/ca.crt /usr/local/share/ca-certificates/plantops-ca.crt
sudo update-ca-certificates
```

### System Trust Store (macOS)

```bash
sudo security add-trusted-cert -d -r trustRoot -k /Library/Keychains/System.keychain certs/ca.crt
```

## Certificate Expiration

Certificates are valid for 10 years from generation. For home use, this is acceptable. Production deployments should use:
- Shorter validity periods (90 days)
- Automated certificate renewal (Let's Encrypt, cert-manager)
- Certificate rotation procedures

Check expiration date:

```bash
openssl x509 -in certs/server.crt -noout -dates
```

## Security Considerations

### Private Keys
- **Never commit private keys (*.key) to git**
- Store securely with restricted permissions (chmod 600)
- Back up offline in encrypted storage
- If compromised, regenerate immediately

### Self-Signed Certificates
- Suitable for home/internal use
- Not trusted by default in browsers or client devices
- Requires manual CA distribution to all clients
- Consider proper PKI (Let's Encrypt) for production

### Key Strength
- 4096-bit RSA provides strong security for long-term use
- Consider ECDSA (secp384r1) for lower-power devices if RSA verification is too slow

## Troubleshooting

### ESP32 Connection Fails with "certificate verify failed"
- Ensure `ca.crt` is correctly embedded in firmware
- Check clock is synchronized (mbedTLS validates certificate dates)
- Verify server hostname matches CN or SAN (use "mosquitto" as hostname)

### Mosquitto Won't Start
- Check file permissions on server.key (must be readable by mosquitto user)
- Verify certificate files exist in expected location
- Check Mosquitto logs: `docker compose logs mosquitto`

### "unable to get local issuer certificate"
- CA certificate not in client trust store
- Wrong CA certificate (regenerated without updating clients)

## References

- [Mosquitto TLS Configuration](https://mosquitto.org/man/mosquitto-conf-5.html)
- [OpenSSL Command Reference](https://www.openssl.org/docs/manmaster/man1/)
- [ESP32 WiFiClientSecure](https://github.com/espressif/arduino-esp32/tree/master/libraries/WiFiClientSecure)
- [paho-mqtt TLS](https://eclipse.dev/paho/files/paho.mqtt.python/html/client.html#tls-set)

#!/bin/bash
# Generate self-signed TLS certificates for PlantOps MQTT

set -e

CERT_DIR="certs"
DAYS_VALID=3650  # 10 years for home use
COUNTRY="US"
STATE="California"
CITY="San Francisco"
ORG="PlantOps"
CN_CA="PlantOps CA"
CN_SERVER="mosquitto"  # Must match hostname

FORCE=false
if [[ "$1" == "--force" ]]; then
    FORCE=true
fi

# Create cert directory if it doesn't exist
mkdir -p "$CERT_DIR"

# Check if certificates already exist
if [[ -f "$CERT_DIR/ca.crt" ]] && [[ -f "$CERT_DIR/server.crt" ]] && [[ "$FORCE" == "false" ]]; then
    echo "✓ Certificates already exist in $CERT_DIR/"
    echo "  Use 'make certs-force' to regenerate"
    exit 0
fi

echo "Generating TLS certificates for PlantOps MQTT..."

# Generate CA private key and certificate (self-signed root)
echo ""
echo "1. Generating CA certificate..."
openssl genrsa -out "$CERT_DIR/ca.key" 4096 2>/dev/null
openssl req -new -x509 -days "$DAYS_VALID" -key "$CERT_DIR/ca.key" -out "$CERT_DIR/ca.crt" \
    -subj "/C=$COUNTRY/ST=$STATE/L=$CITY/O=$ORG/CN=$CN_CA" 2>/dev/null

# Generate server private key
echo "2. Generating server private key..."
openssl genrsa -out "$CERT_DIR/server.key" 4096 2>/dev/null

# Create OpenSSL config for Subject Alternative Names
cat > "$CERT_DIR/server.cnf" << SSLEOF
[req]
default_bits = 4096
prompt = no
default_md = sha256
distinguished_name = dn
req_extensions = v3_req

[dn]
C=$COUNTRY
ST=$STATE
L=$CITY
O=$ORG
CN=$CN_SERVER

[v3_req]
keyUsage = keyEncipherment, dataEncipherment
extendedKeyUsage = serverAuth
subjectAltName = @alt_names

[alt_names]
DNS.1 = localhost
DNS.2 = mosquitto
IP.1 = 127.0.0.1
SSLEOF

# Generate server certificate signing request
echo "3. Generating server certificate signing request..."
openssl req -new -key "$CERT_DIR/server.key" -out "$CERT_DIR/server.csr" \
    -config "$CERT_DIR/server.cnf" 2>/dev/null

# Sign server certificate with CA
echo "4. Signing server certificate with CA..."
openssl x509 -req -in "$CERT_DIR/server.csr" -CA "$CERT_DIR/ca.crt" -CAkey "$CERT_DIR/ca.key" \
    -CAcreateserial -out "$CERT_DIR/server.crt" -days "$DAYS_VALID" \
    -extensions v3_req -extfile "$CERT_DIR/server.cnf" 2>/dev/null

# Clean up temporary files
rm -f "$CERT_DIR/server.cnf" "$CERT_DIR/ca.srl"

# Set appropriate permissions
chmod 600 "$CERT_DIR/ca.key" "$CERT_DIR/server.key"
chmod 644 "$CERT_DIR/ca.crt" "$CERT_DIR/server.crt" "$CERT_DIR/server.csr"

echo ""
echo "✓ Certificate generation complete!"
echo ""
echo "Generated files in $CERT_DIR/:"
echo "  ca.crt        - CA certificate (add to client trust stores)"
echo "  ca.key        - CA private key (keep secure, do not commit)"
echo "  server.crt    - Mosquitto server certificate"
echo "  server.key    - Server private key (keep secure, do not commit)"
echo "  server.csr    - Certificate signing request (intermediate)"
echo ""
echo "Verify certificates:"
echo "  openssl verify -CAfile $CERT_DIR/ca.crt $CERT_DIR/server.crt"
echo "  openssl x509 -in $CERT_DIR/server.crt -noout -text | grep -A1 'Subject Alternative Name'"
echo ""
echo "Next steps:"
echo "  1. Configure Mosquitto to use server.crt and server.key"
echo "  2. Add ca.crt to ESP32 firmware for server verification"
echo "  3. Add ca.crt to backend MQTT client trust store"
echo ""

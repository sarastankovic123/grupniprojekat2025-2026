#!/bin/sh
set -eu

CERT_DIR="${CERT_DIR:-/certs}"
CERT_FILE="${CERT_FILE:-$CERT_DIR/tls.crt}"
KEY_FILE="${KEY_FILE:-$CERT_DIR/tls.key}"
CONF_FILE="${CONF_FILE:-/tls/openssl.cnf}"

mkdir -p "$CERT_DIR"

if [ -f "$CERT_FILE" ] && [ -f "$KEY_FILE" ]; then
  echo "TLS certs already exist in $CERT_DIR"
  exit 0
fi

echo "Generating self-signed TLS certs in $CERT_DIR"

openssl req -x509 -nodes -days 365 \
  -newkey rsa:2048 \
  -keyout "$KEY_FILE" \
  -out "$CERT_FILE" \
  -config "$CONF_FILE"

chmod 600 "$KEY_FILE" || true
chmod 644 "$CERT_FILE" || true

echo "Done"


#!/bin/bash

#!/bin/bash

set -e

# ==========================================
# Loki Installation Script
# Ubuntu EC2
# Loki Port: 3100
# ==========================================

LOKI_VERSION="3.6.0"
LOKI_USER="loki"
LOKI_BINARY="/usr/local/bin/loki"
LOKI_CONFIG_DIR="/etc/loki"
LOKI_DATA_DIR="/var/lib/loki"
LOKI_CONFIG="${LOKI_CONFIG_DIR}/loki-config.yaml"

echo "=========================================="
echo " Installing Grafana Loki"
echo "=========================================="

# ------------------------------------------
# 1. Update package index
# ------------------------------------------

echo "[1/8] Updating package index..."

sudo apt update

# ------------------------------------------
# 2. Install required packages
# ------------------------------------------

echo "[2/8] Installing dependencies..."

sudo apt install -y curl unzip

# ------------------------------------------
# 3. Create Loki user
# ------------------------------------------

echo "[3/8] Creating Loki user..."

if ! id "${LOKI_USER}" >/dev/null 2>&1; then
    sudo useradd \
        --system \
        --no-create-home \
        --shell /usr/sbin/nologin \
        "${LOKI_USER}"
else
    echo "Loki user already exists."
fi

# ------------------------------------------
# 4. Download Loki
# ------------------------------------------

echo "[4/8] Downloading Loki ${LOKI_VERSION}..."

cd /tmp

rm -f loki-linux-amd64.zip

curl -fL -o loki-linux-amd64.zip \
"https://github.com/grafana/loki/releases/download/v${LOKI_VERSION}/loki-linux-amd64.zip"

# ------------------------------------------
# 5. Install Loki binary
# ------------------------------------------

echo "[5/8] Installing Loki binary..."

unzip -o loki-linux-amd64.zip

sudo mv loki-linux-amd64 "${LOKI_BINARY}"

sudo chmod +x "${LOKI_BINARY}"

# ------------------------------------------
# 6. Create Loki directories
# ------------------------------------------

echo "[6/8] Creating Loki directories..."

sudo mkdir -p "${LOKI_CONFIG_DIR}"
sudo mkdir -p "${LOKI_DATA_DIR}/chunks"
sudo mkdir -p "${LOKI_DATA_DIR}/rules"
sudo mkdir -p "${LOKI_DATA_DIR}/compactor"

sudo chown -R "${LOKI_USER}:${LOKI_USER}" "${LOKI_CONFIG_DIR}"
sudo chown -R "${LOKI_USER}:${LOKI_USER}" "${LOKI_DATA_DIR}"

# ------------------------------------------
# 7. Create Loki configuration
# ------------------------------------------

echo "[7/8] Creating Loki configuration..."

sudo tee "${LOKI_CONFIG}" > /dev/null <<'EOF'
auth_enabled: false

server:
  http_listen_port: 3100
  grpc_listen_port: 9096

common:
  instance_addr: 127.0.0.1
  path_prefix: /var/lib/loki

  replication_factor: 1

  ring:
    kvstore:
      store: inmemory

  storage:
    filesystem:
      chunks_directory: /var/lib/loki/chunks
      rules_directory: /var/lib/loki/rules

schema_config:
  configs:
    - from: 2024-01-01
      store: tsdb
      object_store: filesystem
      schema: v13

      index:
        prefix: index_
        period: 24h

limits_config:
  allow_structured_metadata: true
  volume_enabled: true

compactor:
  working_directory: /var/lib/loki/compactor
  retention_enabled: false
EOF

sudo chown "${LOKI_USER}:${LOKI_USER}" "${LOKI_CONFIG}"

# ------------------------------------------
# 8. Create systemd service
# ------------------------------------------

echo "[8/8] Creating Loki systemd service..."

sudo tee /etc/systemd/system/loki.service > /dev/null <<'EOF'
[Unit]
Description=Grafana Loki
Wants=network-online.target
After=network-online.target

[Service]
User=loki
Group=loki
Type=simple

ExecStart=/usr/local/bin/loki \
    -config.file=/etc/loki/loki-config.yaml

Restart=always
RestartSec=5

LimitNOFILE=65536

[Install]
WantedBy=multi-user.target
EOF

# ------------------------------------------
# Reload systemd
# ------------------------------------------

sudo systemctl daemon-reload

# ------------------------------------------
# Enable and start Loki
# ------------------------------------------

sudo systemctl enable loki
sudo systemctl restart loki

# ------------------------------------------
# Verify service
# ------------------------------------------

echo ""
echo "=========================================="
echo " Checking Loki service"
echo "=========================================="

sudo systemctl --no-pager --full status loki

echo ""
echo "=========================================="
echo " Testing Loki"
echo "=========================================="


echo "Waiting for Loki to become ready..."

for i in {1..30}; do
    if curl -fsS http://localhost:3100/ready > /dev/null; then
        echo ""
        echo "=========================================="
        echo " Loki installed successfully!"
        echo " Port: 3100"
        echo " Status: Ready"
        echo "=========================================="
        exit 0
    fi

    echo "Loki is not ready yet... attempt $i/30"
    sleep 2
done

echo ""
echo "=========================================="
echo " Loki failed to become ready"
echo "=========================================="

sudo journalctl -u loki -n 100 --no-pager

exit 1

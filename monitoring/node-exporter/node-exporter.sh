```bash
#!/bin/bash

set -e

# ==========================================
# Node Exporter Installation Script
# ==========================================

NODE_EXPORTER_VERSION="1.10.2"
NODE_EXPORTER_USER="node_exporter"
NODE_EXPORTER_PORT="9100"

echo "=========================================="
echo " Installing Prometheus Node Exporter"
echo "=========================================="

# ------------------------------------------
# 1. Update package index
# ------------------------------------------

echo "[1/8] Updating package index..."

apt-get update -y

# ------------------------------------------
# 2. Install dependencies
# ------------------------------------------

echo "[2/8] Installing dependencies..."

apt-get install -y curl tar

# ------------------------------------------
# 3. Create Node Exporter user
# ------------------------------------------

echo "[3/8] Creating Node Exporter user..."

if id "${NODE_EXPORTER_USER}" >/dev/null 2>&1; then
    echo "User ${NODE_EXPORTER_USER} already exists."
else
    useradd \
        --system \
        --no-create-home \
        --shell /usr/sbin/nologin \
        "${NODE_EXPORTER_USER}"

    echo "User ${NODE_EXPORTER_USER} created."
fi

# ------------------------------------------
# 4. Download Node Exporter
# ------------------------------------------

echo "[4/8] Downloading Node Exporter ${NODE_EXPORTER_VERSION}..."

cd /tmp

ARCHIVE="node_exporter-${NODE_EXPORTER_VERSION}.linux-amd64.tar.gz"
DOWNLOAD_URL="https://github.com/prometheus/node_exporter/releases/download/v${NODE_EXPORTER_VERSION}/${ARCHIVE}"

rm -f "${ARCHIVE}"

curl -fL -o "${ARCHIVE}" "${DOWNLOAD_URL}"

echo "Download completed."

# ------------------------------------------
# 5. Extract and install binary
# ------------------------------------------

echo "[5/8] Installing Node Exporter binary..."

rm -rf "node_exporter-${NODE_EXPORTER_VERSION}.linux-amd64"

tar -xzf "${ARCHIVE}"

install -m 0755 \
    "node_exporter-${NODE_EXPORTER_VERSION}.linux-amd64/node_exporter" \
    /usr/local/bin/node_exporter

chown "${NODE_EXPORTER_USER}:${NODE_EXPORTER_USER}" \
    /usr/local/bin/node_exporter

echo "Node Exporter binary installed."

# ------------------------------------------
# 6. Create systemd service
# ------------------------------------------

echo "[6/8] Creating Node Exporter systemd service..."

cat > /etc/systemd/system/node_exporter.service <<EOF
[Unit]
Description=Prometheus Node Exporter
Documentation=https://github.com/prometheus/node_exporter
After=network-online.target
Wants=network-online.target

[Service]
User=${NODE_EXPORTER_USER}
Group=${NODE_EXPORTER_USER}
Type=simple

ExecStart=/usr/local/bin/node_exporter \
    --web.listen-address=0.0.0.0:${NODE_EXPORTER_PORT}

Restart=on-failure
RestartSec=5

[Install]
WantedBy=multi-user.target
EOF

# ------------------------------------------
# 7. Enable and start service
# ------------------------------------------

echo "[7/8] Enabling and starting Node Exporter..."

systemctl daemon-reload

systemctl enable node_exporter

systemctl restart node_exporter

sleep 3

# ------------------------------------------
# 8. Verify installation
# ------------------------------------------

echo "[8/8] Verifying Node Exporter..."

if systemctl is-active --quiet node_exporter; then
    echo "Node Exporter service is RUNNING."
else
    echo "ERROR: Node Exporter failed to start."
    systemctl status node_exporter --no-pager
    exit 1
fi

echo ""
echo "Checking port ${NODE_EXPORTER_PORT}..."

if curl -fsS "http://localhost:${NODE_EXPORTER_PORT}/metrics" > /dev/null; then
    echo "Node Exporter metrics endpoint is working."
else
    echo "ERROR: Node Exporter metrics endpoint is not responding."
    exit 1
fi

echo ""
echo "Checking node_cpu metrics..."

if curl -fsS "http://localhost:${NODE_EXPORTER_PORT}/metrics" | grep -q "^node_cpu_seconds_total"; then
    echo "node_cpu_seconds_total: OK"
else
    echo "WARNING: node_cpu_seconds_total was not found."
fi

echo ""
echo "Checking node_memory metrics..."

if curl -fsS "http://localhost:${NODE_EXPORTER_PORT}/metrics" | grep -q "^node_memory_MemTotal_bytes"; then
    echo "node_memory_MemTotal_bytes: OK"
else
    echo "WARNING: node_memory_MemTotal_bytes was not found."
fi

echo ""
echo "=========================================="
echo " Node Exporter Installation Complete"
echo "=========================================="

echo ""
echo "Service:"
echo "  systemctl status node_exporter"

echo ""
echo "Metrics:"
echo "  http://localhost:${NODE_EXPORTER_PORT}/metrics"

echo ""
echo "Useful test:"
echo "  curl http://localhost:${NODE_EXPORTER_PORT}/metrics | grep '^node_' | head"

echo ""
echo "Node Exporter is listening on port ${NODE_EXPORTER_PORT}."
```

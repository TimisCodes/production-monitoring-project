#!/bin/bash

set -e

# ============================================================
# Prometheus Installation Script
# ============================================================

PROMETHEUS_VERSION="3.6.0"

PROMETHEUS_USER="prometheus"

PROMETHEUS_PORT="9090"

PROMETHEUS_INSTALL_DIR="/usr/local/bin"

PROMETHEUS_CONFIG_DIR="/etc/prometheus"

PROMETHEUS_DATA_DIR="/var/lib/prometheus"

PROMETHEUS_ARCHIVE="prometheus-${PROMETHEUS_VERSION}.linux-amd64.tar.gz"

PROMETHEUS_DOWNLOAD_URL="https://github.com/prometheus/prometheus/releases/download/v${PROMETHEUS_VERSION}/${PROMETHEUS_ARCHIVE}"


echo "============================================================"
echo " Installing Prometheus"
echo "============================================================"


# ------------------------------------------------------------
# 1. Check operating system
# ------------------------------------------------------------

echo ""
echo "[1/10] Checking operating system..."

if [ -f /etc/os-release ]; then

    . /etc/os-release

    echo "OS: ${PRETTY_NAME}"

else

    echo "ERROR: Cannot determine operating system."

    exit 1

fi


# ------------------------------------------------------------
# 2. Update package index
# ------------------------------------------------------------

echo ""
echo "[2/10] Updating package index..."

apt-get update -y


# ------------------------------------------------------------
# 3. Install dependencies
# ------------------------------------------------------------

echo ""
echo "[3/10] Installing dependencies..."

apt-get install -y \
    curl \
    wget \
    tar


# ------------------------------------------------------------
# 4. Create Prometheus user
# ------------------------------------------------------------

echo ""
echo "[4/10] Creating Prometheus user..."

if id "${PROMETHEUS_USER}" >/dev/null 2>&1; then

    echo "User ${PROMETHEUS_USER} already exists."

else

    useradd \
        --system \
        --no-create-home \
        --shell /usr/sbin/nologin \
        "${PROMETHEUS_USER}"

    echo "User ${PROMETHEUS_USER} created."

fi


# ------------------------------------------------------------
# 5. Create directories
# ------------------------------------------------------------

echo ""
echo "[5/10] Creating Prometheus directories..."

mkdir -p "${PROMETHEUS_CONFIG_DIR}"

mkdir -p "${PROMETHEUS_DATA_DIR}"

mkdir -p "${PROMETHEUS_INSTALL_DIR}"

mkdir -p /tmp/prometheus-install


# ------------------------------------------------------------
# 6. Download Prometheus
# ------------------------------------------------------------

echo ""
echo "[6/10] Downloading Prometheus ${PROMETHEUS_VERSION}..."

cd /tmp/prometheus-install

rm -f "${PROMETHEUS_ARCHIVE}"

curl -fL \
    -o "${PROMETHEUS_ARCHIVE}" \
    "${PROMETHEUS_DOWNLOAD_URL}"

echo "Prometheus download completed."


# ------------------------------------------------------------
# 7. Extract and install Prometheus
# ------------------------------------------------------------

echo ""
echo "[7/10] Installing Prometheus binaries..."

rm -rf "prometheus-${PROMETHEUS_VERSION}.linux-amd64"

tar -xzf "${PROMETHEUS_ARCHIVE}"


# Install Prometheus binary

install -m 0755 \
    "prometheus-${PROMETHEUS_VERSION}.linux-amd64/prometheus" \
    "${PROMETHEUS_INSTALL_DIR}/prometheus"


# Install promtool

install -m 0755 \
    "prometheus-${PROMETHEUS_VERSION}.linux-amd64/promtool" \
    "${PROMETHEUS_INSTALL_DIR}/promtool"


# Copy Prometheus configuration files

cp \
    "prometheus-${PROMETHEUS_VERSION}.linux-amd64/prometheus.yml" \
    "${PROMETHEUS_CONFIG_DIR}/prometheus.yml"


# Copy console files

cp -r \
    "prometheus-${PROMETHEUS_VERSION}.linux-amd64/consoles" \
    "${PROMETHEUS_CONFIG_DIR}/"


cp -r \
    "prometheus-${PROMETHEUS_VERSION}.linux-amd64/console_libraries" \
    "${PROMETHEUS_CONFIG_DIR}/"


echo "Prometheus binaries installed."


# ------------------------------------------------------------
# 8. Configure Prometheus
# ------------------------------------------------------------

echo ""
echo "[8/10] Creating Prometheus configuration..."


cat > "${PROMETHEUS_CONFIG_DIR}/prometheus.yml" <<'EOF'
global:

  scrape_interval: 15s

  evaluation_interval: 15s


# ============================================================
# Alerting configuration
# ============================================================

alerting:

  alertmanagers:
    - static_configs:
        - targets: []


# ============================================================
# Rule files
# ============================================================

rule_files:

  # - "first_rules.yml"
  # - "second_rules.yml"


# ============================================================
# Scrape configurations
# ============================================================

scrape_configs:


  # ----------------------------------------------------------
  # Prometheus itself
  # ----------------------------------------------------------

  - job_name: "prometheus"

    static_configs:

      - targets:
          - "localhost:9090"


  # ----------------------------------------------------------
  # Node Exporter
  # ----------------------------------------------------------

  - job_name: "node-exporter"

    static_configs:

      - targets:
          - "localhost:9100"

EOF


echo "Prometheus configuration created."


# ------------------------------------------------------------
# Set ownership
# ------------------------------------------------------------

echo ""
echo "Setting Prometheus permissions..."


chown -R \
    "${PROMETHEUS_USER}:${PROMETHEUS_USER}" \
    "${PROMETHEUS_CONFIG_DIR}"


chown -R \
    "${PROMETHEUS_USER}:${PROMETHEUS_USER}" \
    "${PROMETHEUS_DATA_DIR}"


chown \
    "${PROMETHEUS_USER}:${PROMETHEUS_USER}" \
    "${PROMETHEUS_INSTALL_DIR}/prometheus"


chown \
    "${PROMETHEUS_USER}:${PROMETHEUS_USER}" \
    "${PROMETHEUS_INSTALL_DIR}/promtool"


# ------------------------------------------------------------
# Create systemd service
# ------------------------------------------------------------

echo ""
echo "Creating Prometheus systemd service..."


cat > /etc/systemd/system/prometheus.service <<'EOF'
[Unit]

Description=Prometheus Monitoring System

Documentation=https://prometheus.io/docs/

Wants=network-online.target

After=network-online.target


[Service]

User=prometheus

Group=prometheus

Type=simple


ExecStart=/usr/local/bin/prometheus \
    --config.file=/etc/prometheus/prometheus.yml \
    --storage.tsdb.path=/var/lib/prometheus \
    --web.listen-address=0.0.0.0:9090


Restart=on-failure

RestartSec=5


[Install]

WantedBy=multi-user.target
EOF


# ------------------------------------------------------------
# 9. Enable and start Prometheus
# ------------------------------------------------------------

echo ""
echo "[9/10] Starting Prometheus..."


systemctl daemon-reload


systemctl enable prometheus


systemctl restart prometheus


sleep 5


# ------------------------------------------------------------
# Verify service
# ------------------------------------------------------------

echo ""
echo "Checking Prometheus service..."


if systemctl is-active --quiet prometheus; then

    echo ""
    echo "Prometheus service is RUNNING."

else

    echo ""
    echo "ERROR: Prometheus failed to start."

    echo ""
    echo "Prometheus status:"

    systemctl status prometheus --no-pager


    echo ""
    echo "Prometheus logs:"

    journalctl \
        -u prometheus \
        -n 100 \
        --no-pager


    exit 1

fi


# ------------------------------------------------------------
# 10. Test Prometheus HTTP endpoint
# ------------------------------------------------------------

echo ""
echo "[10/10] Testing Prometheus HTTP endpoint..."


if curl -fsS \
    http://localhost:${PROMETHEUS_PORT}/-/healthy \
    > /dev/null; then

    echo ""
    echo "Prometheus HTTP endpoint is working."

else

    echo ""
    echo "ERROR: Prometheus HTTP endpoint is not responding."

    echo ""
    echo "Checking port ${PROMETHEUS_PORT}..."

    ss -tulpn | grep ":${PROMETHEUS_PORT}" || true


    echo ""
    echo "Prometheus logs:"

    journalctl \
        -u prometheus \
        -n 100 \
        --no-pager


    exit 1

fi


# ------------------------------------------------------------
# Check configuration
# ------------------------------------------------------------

echo ""
echo "Validating Prometheus configuration..."


if /usr/local/bin/promtool \
    check config \
    /etc/prometheus/prometheus.yml; then

    echo ""
    echo "Prometheus configuration is VALID."

else

    echo ""
    echo "ERROR: Prometheus configuration is invalid."

    exit 1

fi


# ------------------------------------------------------------
# Display installation information
# ------------------------------------------------------------

echo ""
echo "============================================================"
echo " Prometheus Installation Complete"
echo "============================================================"


echo ""
echo "Prometheus version:"

prometheus --version


echo ""
echo "Prometheus service:"

echo "  sudo systemctl status prometheus"


echo ""
echo "Start Prometheus:"

echo "  sudo systemctl start prometheus"


echo ""
echo "Stop Prometheus:"

echo "  sudo systemctl stop prometheus"


echo ""
echo "Restart Prometheus:"

echo "  sudo systemctl restart prometheus"


echo ""
echo "Prometheus logs:"

echo "  sudo journalctl -u prometheus -f"


echo ""
echo "Configuration:"

echo "  /etc/prometheus/prometheus.yml"


echo ""
echo "Prometheus data:"

echo "  /var/lib/prometheus"


echo ""
echo "Prometheus web interface:"

echo "  http://localhost:${PROMETHEUS_PORT}"


echo ""
echo "Health check:"

echo "  curl http://localhost:${PROMETHEUS_PORT}/-/healthy"


echo ""
echo "============================================================"
echo " Monitoring Targets"
echo "============================================================"


echo ""
echo "Prometheus:"
echo "  localhost:9090"


echo ""
echo "Node Exporter:"
echo "  localhost:9100"


echo ""
echo "Prometheus Targets page:"
echo "  http://localhost:${PROMETHEUS_PORT}/targets"


echo ""
echo "============================================================"
echo " Installation completed successfully!"
echo "============================================================"
```

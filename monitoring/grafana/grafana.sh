#!/bin/bash

set -e

# ============================================================
# Grafana Installation Script
# ============================================================

GRAFANA_USER="grafana"
GRAFANA_PORT="3000"

echo "============================================================"
echo " Installing Grafana"
echo "============================================================"

# ------------------------------------------------------------
# 1. Check OS
# ------------------------------------------------------------

echo ""
echo "[1/9] Checking operating system..."

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
echo "[2/9] Updating package index..."

apt-get update -y

# ------------------------------------------------------------
# 3. Install required dependencies
# ------------------------------------------------------------

echo ""
echo "[3/9] Installing dependencies..."

apt-get install -y \
    apt-transport-https \
    software-properties-common \
    wget \
    curl \
    gpg \
    ca-certificates

# ------------------------------------------------------------
# 4. Add Grafana GPG key
# ------------------------------------------------------------

echo ""
echo "[4/9] Adding Grafana repository key..."

mkdir -p /etc/apt/keyrings

wget -q -O - https://apt.grafana.com/gpg.key \
    | gpg --dearmor \
    > /etc/apt/keyrings/grafana.gpg

chmod 644 /etc/apt/keyrings/grafana.gpg

echo "Grafana GPG key installed."

# ------------------------------------------------------------
# 5. Add Grafana repository
# ------------------------------------------------------------

echo ""
echo "[5/9] Adding Grafana APT repository..."

cat > /etc/apt/sources.list.d/grafana.list <<'EOF'
deb [signed-by=/etc/apt/keyrings/grafana.gpg] https://apt.grafana.com stable main
EOF

apt-get update -y

echo "Grafana repository added."

# ------------------------------------------------------------
# 6. Install Grafana
# ------------------------------------------------------------

echo ""
echo "[6/9] Installing Grafana..."

apt-get install -y grafana

echo "Grafana installed."

# ------------------------------------------------------------
# 7. Enable and start Grafana
# ------------------------------------------------------------

echo ""
echo "[7/9] Starting Grafana..."

systemctl daemon-reload

systemctl enable grafana-server

systemctl restart grafana-server

sleep 5

# ------------------------------------------------------------
# 8. Verify Grafana service
# ------------------------------------------------------------

echo ""
echo "[8/9] Verifying Grafana service..."

if systemctl is-active --quiet grafana-server; then

    echo ""
    echo "Grafana service is RUNNING."

else

    echo ""
    echo "ERROR: Grafana failed to start."
    echo ""
    echo "Checking Grafana status..."
    systemctl status grafana-server --no-pager

    echo ""
    echo "Checking Grafana logs..."
    journalctl -u grafana-server -n 100 --no-pager

    exit 1
fi

# ------------------------------------------------------------
# 9. Test Grafana HTTP endpoint
# ------------------------------------------------------------

echo ""
echo "[9/9] Testing Grafana HTTP endpoint..."

if curl -fsS http://localhost:${GRAFANA_PORT}/api/health > /tmp/grafana-health.json; then

    echo ""
    echo "Grafana HTTP endpoint is working."

    echo ""
    echo "Grafana health response:"
    cat /tmp/grafana-health.json

else

    echo ""
    echo "ERROR: Grafana HTTP endpoint is not responding."

    echo ""
    echo "Checking whether port ${GRAFANA_PORT} is listening..."

    ss -tulpn | grep ":${GRAFANA_PORT}" || true

    echo ""
    echo "Checking Grafana logs..."

    journalctl -u grafana-server -n 100 --no-pager

    exit 1
fi

# ------------------------------------------------------------
# Installation completed
# ------------------------------------------------------------

echo ""
echo "============================================================"
echo " Grafana Installation Complete"
echo "============================================================"

echo ""
echo "Service:"
echo "  sudo systemctl status grafana-server"

echo ""
echo "Start Grafana:"
echo "  sudo systemctl start grafana-server"

echo ""
echo "Stop Grafana:"
echo "  sudo systemctl stop grafana-server"

echo ""
echo "Restart Grafana:"
echo "  sudo systemctl restart grafana-server"

echo ""
echo "Grafana logs:"
echo "  sudo journalctl -u grafana-server -f"

echo ""
echo "Health check:"
echo "  curl http://localhost:${GRAFANA_PORT}/api/health"

echo ""
echo "Grafana is listening on:"
echo "  Port ${GRAFANA_PORT}"

echo ""
echo "============================================================"
echo " Access Grafana"
echo "============================================================"

echo ""
echo "From the server:"
echo "  http://localhost:${GRAFANA_PORT}"

echo ""
echo "From another machine:"
echo "  http://<SERVER-IP>:${GRAFANA_PORT}"

echo ""
echo "Default Grafana login:"
echo "  Username: admin"
echo "  Password: admin"
echo ""
echo "You will normally be prompted to change the password"
echo "during the first login."

echo ""
echo "============================================================"
```

#!/bin/bash

curl -fL -o node_exporter.tar.gz \
https://github.com/prometheus/node_exporter/releases/download/v1.10.2/node_exporter-1.10.2.linux-amd64.tar.gz

tar -xvf node_exporter.tar.gz

sudo mv node_exporter-1.10.2.linux-amd64/node_exporter /usr/local/bin/

if ! id node_exporter >/dev/null 2>&1; then
    sudo useradd \
      --no-create-home \
      --shell /usr/sbin/nologin \
      node_exporter
fi

echo "Node Exporter installed successfully."
root@myvm:/tmp#

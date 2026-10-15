#!/bin/bash

# Menjalankan MongoDB lokal untuk project ini.
PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
MONGOD="/Users/fano/.local/share/ruang-kreasi/mongodb-8.0.34/bin/mongod"
DATA_DIR="$PROJECT_DIR/.local-mongodb-data"

if [ ! -x "$MONGOD" ]; then
  echo "MongoDB Community belum terpasang di komputer ini."
  exit 1
fi

mkdir -p "$DATA_DIR"
exec "$MONGOD" --dbpath "$DATA_DIR" --bind_ip 127.0.0.1 --port 27017 --nounixsocket

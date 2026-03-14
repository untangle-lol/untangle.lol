#!/usr/bin/env bash
set -euo pipefail

REPO_DIR="/home/deploy/sites/untangle.lol"
COMPOSE_FILE="$REPO_DIR/docker-compose.yml"
ENV_FILE="$REPO_DIR/.env"

echo "[deploy] pulling latest code..."
git -C "$REPO_DIR" pull origin main

echo "[deploy] rebuilding and restarting container..."
docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" up -d --build

echo "[deploy] done — $(date -u +%Y-%m-%dT%H:%M:%SZ)"

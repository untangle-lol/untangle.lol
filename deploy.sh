#!/usr/bin/env bash
set -euo pipefail

REPO_DIR="/home/deploy/sites/untangle"
ENV_FILE="$REPO_DIR/.env"
IMAGE="untanglelol-web"
NEW_CONTAINER="untangle_web_new"
OLD_CONTAINER="untangle_web"
LOCK_FILE="/tmp/untangle-deploy.lock"

# Serialize concurrent deploys — wait up to 10 min for any in-flight deploy to finish
exec 9>"$LOCK_FILE"
if ! flock -w 600 9; then
  echo "[deploy] ERROR: could not acquire deploy lock after 10 minutes, aborting"
  exit 1
fi

# Clean up any stale new container left by a previous failed/interrupted deploy
if docker inspect "$NEW_CONTAINER" &>/dev/null; then
  echo "[deploy] cleaning up stale $NEW_CONTAINER from previous run..."
  docker rm -f "$NEW_CONTAINER" || true
fi

echo "[deploy] pulling latest code..."
export GIT_SSH_COMMAND="ssh -i /home/deploy/.ssh/github_actions_deploy -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null"
git -C "$REPO_DIR" pull origin main

echo "[deploy] building new image..."
docker build -t "$IMAGE:new" "$REPO_DIR"

echo "[deploy] starting new container alongside old one..."
docker run -d \
  --name "$NEW_CONTAINER" \
  --restart unless-stopped \
  --network proxy \
  --env-file "$ENV_FILE" \
  --mount source=untanglelol_suggestions_data,target=/data \
  --security-opt no-new-privileges:true \
  --label "traefik.enable=true" \
  --label "traefik.http.routers.untangle.rule=Host(\`untangle.lol\`)" \
  --label "traefik.http.routers.untangle.entrypoints=websecure" \
  --label "traefik.http.routers.untangle.tls.certresolver=letsencrypt" \
  --label "traefik.http.services.untangle.loadbalancer.server.port=3000" \
  --label "traefik.http.routers.untangle-www.rule=Host(\`www.untangle.lol\`)" \
  --label "traefik.http.routers.untangle-www.entrypoints=websecure" \
  --label "traefik.http.routers.untangle-www.tls.certresolver=letsencrypt" \
  --label "traefik.http.routers.untangle-www.middlewares=untangle-www-redirect" \
  --label "traefik.http.middlewares.untangle-www-redirect.redirectregex.regex=^https?://www\\.untangle\\.lol(.*)" \
  --label "traefik.http.middlewares.untangle-www-redirect.redirectregex.replacement=https://untangle.lol\${1}" \
  --label "traefik.http.middlewares.untangle-www-redirect.redirectregex.permanent=true" \
  "$IMAGE:new"

echo "[deploy] waiting for new container to be healthy..."
for i in $(seq 1 30); do
  STATUS=$(docker inspect --format='{{.State.Status}}' "$NEW_CONTAINER" 2>/dev/null || echo "missing")
  if [ "$STATUS" = "running" ]; then
    # Give Next.js a moment to fully boot before cutting over
    sleep 3
    break
  fi
  if [ "$i" -eq 30 ]; then
    echo "[deploy] ERROR: new container did not start in time, aborting"
    docker rm -f "$NEW_CONTAINER" || true
    exit 1
  fi
  sleep 1
done

echo "[deploy] stopping old container..."
docker stop "$OLD_CONTAINER" && docker rm "$OLD_CONTAINER"

echo "[deploy] renaming new container to canonical name..."
docker rename "$NEW_CONTAINER" "$OLD_CONTAINER"

echo "[deploy] tagging image..."
docker tag "$IMAGE:new" "$IMAGE:latest"
docker rmi "$IMAGE:new" 2>/dev/null || true

echo "[deploy] done — $(date -u +%Y-%m-%dT%H:%M:%SZ)"

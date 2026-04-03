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
STASHED=0
if ! git -C "$REPO_DIR" diff --quiet || ! git -C "$REPO_DIR" diff --cached --quiet; then
  echo "[deploy] stashing local changes..."
  git -C "$REPO_DIR" stash push -m "deploy-autostash"
  STASHED=1
fi
git -C "$REPO_DIR" pull origin main
if [ "$STASHED" -eq 1 ]; then
  echo "[deploy] restoring local changes..."
  git -C "$REPO_DIR" stash pop || echo "[deploy] WARNING: stash pop had conflicts, continuing anyway"
fi

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
CONTAINER_IP=$(docker inspect --format='{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}' "$NEW_CONTAINER" 2>/dev/null || echo "")
for i in $(seq 1 60); do
  STATUS=$(docker inspect --format='{{.State.Status}}' "$NEW_CONTAINER" 2>/dev/null || echo "missing")
  if [ "$STATUS" = "exited" ] || [ "$STATUS" = "missing" ]; then
    echo "[deploy] ERROR: new container crashed (status: $STATUS), aborting"
    docker logs --tail=20 "$NEW_CONTAINER" 2>/dev/null || true
    docker rm -f "$NEW_CONTAINER" || true
    exit 1
  fi
  if [ -n "$CONTAINER_IP" ] && curl -sf --max-time 2 "http://$CONTAINER_IP:3000/" -o /dev/null 2>/dev/null; then
    echo "[deploy] new container is healthy after ${i}s"
    break
  fi
  if [ "$i" -eq 60 ]; then
    echo "[deploy] ERROR: new container did not become healthy in 60s, aborting"
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

#!/usr/bin/env bash
# local-deploy.sh — commit, push, and deploy directly via SSH (no GitHub Actions queue)
set -euo pipefail

REMOTE_USER="deploy"
REMOTE_HOST="87.106.11.229"
REMOTE_SCRIPT="/home/deploy/sites/untangle/deploy.sh"

# ── 1. optional auto-commit ───────────────────────────────────────────────────
if ! git diff --quiet || ! git diff --cached --quiet; then
  if [ "${1:-}" = "" ]; then
    echo "You have uncommitted changes. Provide a commit message:"
    echo "  ./local-deploy.sh \"your message\""
    echo "Or commit manually first, then run ./local-deploy.sh"
    exit 1
  fi
  echo "[local-deploy] committing: $1"
  git add -A
  git commit -m "$1"
fi

# ── 2. push ───────────────────────────────────────────────────────────────────
echo "[local-deploy] pushing to main..."
git push origin main

# ── 3. deploy via SSH ─────────────────────────────────────────────────────────
echo "[local-deploy] connecting to $REMOTE_HOST..."
ssh -o StrictHostKeyChecking=no "${REMOTE_USER}@${REMOTE_HOST}" "bash $REMOTE_SCRIPT"

echo ""
echo "[local-deploy] done ✓"

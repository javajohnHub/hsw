#!/usr/bin/env bash
set -euo pipefail

# Post-unzip deploy script for Edwards Web Development
# - Installs backend deps
# - Starts/updates PM2 process
# - Enables PM2 startup on boot

APP_DIR="${APP_DIR:-$(pwd)}"

# Detect backend directory: support both repo layout (backend/) and flat layout (dist/public/data at root)
if [ -d "$APP_DIR/backend" ]; then
  BACKEND_DIR="$APP_DIR/backend"
elif [ -f "$APP_DIR/dist/server.js" ] && [ -f "$APP_DIR/package.json" ]; then
  BACKEND_DIR="$APP_DIR"
else
  BACKEND_DIR="$APP_DIR/backend" # fallback
fi

ENV_FILE="$BACKEND_DIR/.env"
PM2_NAME="${PM2_NAME:-edwards-webdev-api}"

echo "[deploy] App dir: $APP_DIR"
echo "[deploy] Backend dir: $BACKEND_DIR"

if [ ! -d "$BACKEND_DIR" ]; then
  echo "[deploy] ERROR: backend directory not found at $BACKEND_DIR" >&2
  exit 1
fi

if ! command -v node >/dev/null 2>&1; then
  echo "[deploy] ERROR: Node.js not found in PATH. Install Node 18+ and retry." >&2
  exit 1
fi
if ! command -v npm >/dev/null 2>&1; then
  echo "[deploy] ERROR: npm not found in PATH." >&2
  exit 1
fi
if ! command -v pm2 >/dev/null 2>&1; then
  echo "[deploy] Installing pm2 globally..."
  npm i -g pm2
fi

pushd "$BACKEND_DIR" >/dev/null
echo "[deploy] Installing backend dependencies (omit dev)..."
if [ -f package-lock.json ]; then
  npm ci --omit=dev
else
  npm install --omit=dev
fi

# Load env (if present) to pick up PORT and other settings
PORT="${PORT:-3000}"
if [ -f "$ENV_FILE" ]; then
  echo "[deploy] Loading env from $ENV_FILE"
  # Normalize CRLF to LF and export key=value pairs
  # shellcheck disable=SC2046
  export $(tr -d '\r' < "$ENV_FILE" | grep -E '^[A-Za-z_][A-Za-z0-9_]*=' | xargs -d '\n' -r)
  PORT="${PORT:-3000}"
fi

echo "[deploy] Ensuring data dir exists..."
mkdir -p "$BACKEND_DIR/data"

# Ensure production mode for static SPA hosting and optimized middleware
if [ -z "${NODE_ENV:-}" ]; then
  export NODE_ENV=production
fi
export NODE_ENV=$(printf "%s" "$NODE_ENV" | tr -d '\r')
echo "[deploy] Using NODE_ENV=${NODE_ENV}"

echo "[deploy] Starting (or restarting) with PM2 (name=$PM2_NAME, port=$PORT)..."
if pm2 describe "$PM2_NAME" >/dev/null 2>&1; then
  pm2 restart "$PM2_NAME" --update-env
else
  pm2 start dist/server.js \
    --name "$PM2_NAME" \
    --cwd "$BACKEND_DIR" \
    --update-env
fi

echo "[deploy] Saving PM2 process list..."
pm2 save

echo "[deploy] Configuring PM2 startup on boot (systemd if available)..."
if command -v systemctl >/dev/null 2>&1; then
  pm2 startup systemd -u "$USER" --hp "$HOME" || true
else
  pm2 startup || true
fi
pm2 save

popd >/dev/null

echo "[deploy] Done. Health check (optional):"
echo "  curl http://127.0.0.1:${PORT}/health"

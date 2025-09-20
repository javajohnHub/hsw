#!/usr/bin/env bash
set -euo pipefail

# prepare-release-and-deploy.sh
# - Builds frontend and backend (if present)
# - Copies build artifacts into backend/public (and backend/public/tournaments if tournaments build exists)
# - Calls ensure-cert-and-deploy.sh to ensure cert and start PM2
#
# Usage:
#   sudo bash scripts/prepare-release-and-deploy.sh -d example.com [-w] [-e you@example.com] [--prod]

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
FRONTEND_DIR="$ROOT_DIR/frontend"
TOURNAMENTS_DIR="$ROOT_DIR/tournament-app" # if present
BACKEND_DIR="$ROOT_DIR/backend"

DOMAIN=""
INCLUDE_WWW=false
EMAIL=""
PRODUCTION=false

while [[ $# -gt 0 ]]; do
  case "$1" in
    -d|--domain) DOMAIN="$2"; shift 2 ;;
    -w|--with-www) INCLUDE_WWW=true; shift ;;
    -e|--email) EMAIL="$2"; shift 2 ;;
    --prod) PRODUCTION=true; shift ;;
    --help|-h) echo "Usage: $0 -d DOMAIN [-w] [-e EMAIL] [--prod]"; exit 0 ;;
    *) echo "Unknown option $1"; exit 1 ;;
  esac
done

if [[ -z "$DOMAIN" ]]; then
  echo "Error: domain is required. Use -d example.com" >&2
  exit 1
fi

echo "[release] Root: $ROOT_DIR"

# Build frontend (Angular) if exists
if [[ -d "$FRONTEND_DIR" && -f "$FRONTEND_DIR/package.json" ]]; then
  echo "[release] Building frontend..."
  pushd "$FRONTEND_DIR" >/dev/null
  npm ci
  npm run build --silent
  popd >/dev/null
else
  echo "[release] No frontend to build (skipping)"
fi

# Build tournaments app (if present and has build script)
if [[ -d "$TOURNAMENTS_DIR" && -f "$TOURNAMENTS_DIR/package.json" ]]; then
  echo "[release] Building tournament-app (client/server) if applicable..."
  pushd "$TOURNAMENTS_DIR" >/dev/null
  npm ci
  # If tournament-app has build scripts, run them. Try common ones.
  if npm run | grep -q "build"; then
    npm run build --silent || true
  fi
  popd >/dev/null
fi

# Ensure backend exists
if [[ ! -d "$BACKEND_DIR" ]]; then
  echo "[release] ERROR: backend directory not found at $BACKEND_DIR" >&2
  exit 1
fi

echo "[release] Preparing backend/public"
rm -rf "$BACKEND_DIR/public"
mkdir -p "$BACKEND_DIR/public"

# Copy frontend build into backend/public if it exists
if [[ -d "$FRONTEND_DIR/dist" ]]; then
  echo "[release] Copying frontend/dist to backend/public"
  cp -r "$FRONTEND_DIR/dist/"* "$BACKEND_DIR/public/"
fi

# Copy tournaments build into backend/public/tournaments if present
if [[ -d "$TOURNAMENTS_DIR/dist" ]]; then
  echo "[release] Copying tournaments dist into backend/public/tournaments"
  mkdir -p "$BACKEND_DIR/public/tournaments"
  cp -r "$TOURNAMENTS_DIR/dist/"* "$BACKEND_DIR/public/tournaments/"
fi

echo "[release] Syncing backend package files"
pushd "$BACKEND_DIR" >/dev/null
npm ci --omit=dev
popd >/dev/null

echo "[release] Calling ensure-cert-and-deploy.sh (staging by default)"
if [[ "$PRODUCTION" == true ]]; then
  sudo bash "$ROOT_DIR/scripts/ensure-cert-and-deploy.sh" -d "$DOMAIN" $( [[ "$INCLUDE_WWW" == true ]] && echo -w ) $( [[ -n "$EMAIL" ]] && echo -e "$EMAIL" ) --prod
else
  sudo bash "$ROOT_DIR/scripts/ensure-cert-and-deploy.sh" -d "$DOMAIN" $( [[ "$INCLUDE_WWW" == true ]] && echo -w ) $( [[ -n "$EMAIL" ]] && echo -e "$EMAIL" )
fi

echo "[release] Done."

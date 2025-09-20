#!/usr/bin/env bash
set -euo pipefail

# ensure-cert-and-deploy.sh
# - Checks for an existing certificate for the domain(s) in BACKEND_DIR/.env
# - Runs scripts/setup-certbot.sh if no cert is found (uses staging by default)
# - Calls scripts/deploy-server.sh to install deps and start PM2
#
# Usage:
#   sudo bash scripts/ensure-cert-and-deploy.sh -d example.com [-w] [-e you@example.com] [--prod]

BACKEND_DIR="${BACKEND_DIR:-$(pwd)/backend}"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

DOMAIN=""
INCLUDE_WWW=false
EMAIL=""
PRODUCTION=false
STANDALONE=false

while [[ $# -gt 0 ]]; do
  case "$1" in
    -d|--domain) DOMAIN="$2"; shift 2 ;;
    -w|--with-www) INCLUDE_WWW=true; shift ;;
    -e|--email) EMAIL="$2"; shift 2 ;;
    --prod) PRODUCTION=true; shift ;;
  --standalone) STANDALONE=true; shift ;;
    --backend-dir) BACKEND_DIR="$2"; shift 2 ;;
    -h|--help) echo "Usage: $0 -d DOMAIN [-w] [-e EMAIL] [--prod]"; exit 0 ;;
    *) echo "Unknown option $1"; exit 1 ;;
  esac
done

if [[ -z "$DOMAIN" ]]; then
  echo "Error: domain is required. Use -d example.com" >&2
  exit 1
fi

if [[ ! -d "$BACKEND_DIR" ]]; then
  echo "Error: backend directory not found at $BACKEND_DIR" >&2
  exit 1
fi

CERT_PATH="/etc/letsencrypt/live/$DOMAIN/fullchain.pem"

echo "[deploy] Using backend: $BACKEND_DIR"
echo "[deploy] Domain: $DOMAIN (www: $INCLUDE_WWW)"

if [[ -f "$CERT_PATH" ]]; then
  echo "[deploy] Certificate already exists at $CERT_PATH"
else
  echo "[deploy] Certificate not found. Running certbot setup..."
  CMD=("sudo" "bash" "$SCRIPT_DIR/setup-certbot.sh" -d "$DOMAIN")
  if [[ "$INCLUDE_WWW" == true ]]; then
    CMD+=( -w )
  fi
  if [[ -n "$EMAIL" ]]; then
    CMD+=( -e "$EMAIL" )
  fi
  if [[ "$PRODUCTION" != true ]]; then
    echo "[deploy] Running certbot in STAGING mode (use --prod to request production cert)"
    CMD+=( --staging )
  fi
  if [[ "$STANDALONE" == true ]]; then
    echo "[deploy] Forwarding --standalone to setup-certbot.sh"
    CMD+=( --standalone )
  fi

  echo "[deploy] Running: ${CMD[*]}"
  "${CMD[@]}"
fi

echo "[deploy] Calling deploy script to install and start app with PM2"
sudo bash "$SCRIPT_DIR/deploy-server.sh"

echo "[deploy] Done. Check PM2 status and health endpoint."
echo "  pm2 status"
echo "  curl http://127.0.0.1:3000/health"

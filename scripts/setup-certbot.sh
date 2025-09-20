#!/usr/bin/env bash
set -euo pipefail

# Setup Let's Encrypt (Certbot) for Nginx on Ubuntu
# Usage:
#   sudo bash scripts/setup-certbot.sh -d example.com [-w] [-e you@example.com] [--staging] [--standalone]
#
# -d   Primary domain (required)
# -w   Also include www.<domain>
# -e   Contact email (for non-interactive mode)
# --staging  Use Let's Encrypt staging (rate-limit safe test)
# --standalone Run certbot in standalone mode (stops nginx temporarily)

DOMAIN=""
INCLUDE_WWW=false
EMAIL=""
STAGING=false
STANDALONE=false

while [[ $# -gt 0 ]]; do
  case "$1" in
    -d|--domain)
      DOMAIN="$2"; shift 2 ;;
    -w|--with-www)
      INCLUDE_WWW=true; shift ;;
    -e|--email)
      EMAIL="$2"; shift 2 ;;
    --staging)
      STAGING=true; shift ;;
    --standalone)
      STANDALONE=true; shift ;;
    *)
      echo "Unknown option: $1" >&2; exit 1 ;;
  esac
done

if [[ -z "$DOMAIN" ]]; then
  echo "Usage: $0 -d example.com [-w] [-e you@example.com] [--staging]" >&2
  exit 1
fi

echo "[certbot] Domain: $DOMAIN (www: $INCLUDE_WWW)"
if [[ -n "$EMAIL" ]]; then echo "[certbot] Email: $EMAIL"; fi
if [[ "$STAGING" == true ]]; then echo "[certbot] Using STAGING (test) endpoint"; fi
if [[ "$STANDALONE" == true ]]; then echo "[certbot] Using STANDALONE mode (nginx will be stopped temporarily)"; fi

require_cmd() { command -v "$1" >/dev/null 2>&1; }

if [[ "$STANDALONE" != true ]]; then
  if ! require_cmd nginx; then
    echo "[certbot] Installing nginx..."
    apt-get update -y
    apt-get install -y nginx
  fi
fi

if ! require_cmd snap; then
  echo "[certbot] Installing snapd..."
  apt-get update -y
  apt-get install -y snapd
fi

echo "[certbot] Installing/refreshing certbot via snap..."
snap install core >/dev/null || true
snap refresh core >/dev/null || true
snap install --classic certbot >/dev/null || true
ln -sf /snap/bin/certbot /usr/bin/certbot

# Open firewall if ufw is available
if require_cmd ufw && ufw status | grep -qi active; then
  echo "[certbot] Configuring UFW for Nginx Full"
  ufw allow 'Nginx Full' || true
  ufw delete allow 'Nginx HTTP' || true
fi

if [[ "$STANDALONE" != true ]]; then
  # Ensure the nginx site with correct server_name is enabled before running certbot
  echo "[certbot] Ensure your Nginx site is enabled and server_name is set to $DOMAIN"
  echo "           Example: /etc/nginx/sites-enabled/edwards-webdev -> server_name $DOMAIN;"
  nginx -t
  systemctl reload nginx
fi

DOMAINS=(-d "$DOMAIN")
if [[ "$INCLUDE_WWW" == true ]]; then
  DOMAINS+=( -d "www.$DOMAIN" )
fi

EXTRA=()
if [[ "$STAGING" == true ]]; then
  EXTRA+=( --staging )
fi

if [[ "$STANDALONE" == true ]]; then
  echo "[certbot] Running certbot in standalone mode. Stopping nginx temporarily..."
  systemctl stop nginx || true
  trap 'echo "[certbot] Restoring nginx..."; systemctl start nginx || true' EXIT
  if [[ -n "$EMAIL" ]]; then
    certbot certonly --standalone "${DOMAINS[@]}" --agree-tos -m "$EMAIL" "${EXTRA[@]}"
  else
    certbot certonly --standalone "${DOMAINS[@]}" "${EXTRA[@]}"
  fi
  echo "[certbot] Standalone certbot finished. Starting nginx..."
  systemctl start nginx || true
  trap - EXIT
else
  if [[ -n "$EMAIL" ]]; then
    echo "[certbot] Requesting certificate (non-interactive)"
    certbot --nginx "${DOMAINS[@]}" --redirect --agree-tos -m "$EMAIL" "${EXTRA[@]}"
  else
    echo "[certbot] Requesting certificate (interactive)"
    certbot --nginx "${DOMAINS[@]}" --redirect "${EXTRA[@]}"
  fi
fi

echo "[certbot] Testing auto-renewal (dry run)"
certbot renew --dry-run || true

echo "[certbot] Done. SSL enabled with automatic renewal via systemd timer."

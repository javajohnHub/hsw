#!/usr/bin/env bash
set -euo pipefail

# auto-deploy.sh
# - Automates common deploy steps for this repo for a given domain:
#   1) installs nginx if missing
#   2) enables example nginx site with the provided domain
#   3) opens UFW for Nginx (if present)
#   4) runs the repo's prepare-release-and-deploy script (builds, certbot, pm2)
#
# Usage:
#   sudo bash scripts/auto-deploy.sh -d highscorewins.com -e you@example.com [-w] [--prod]

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
SCRIPT_DIR="$ROOT_DIR/scripts"

DOMAIN=""
INCLUDE_WWW=false
EMAIL=""
PRODUCTION=false

usage(){
  cat <<EOF
Usage: $0 -d DOMAIN [-w] [-e EMAIL] [--prod]

  -d, --domain     Primary domain (required) e.g. highscorewins.com
  -w, --with-www   Also include www.<domain>
  -e, --email      Contact email for Certbot (optional)
  --prod           Request production certificates (default: staging)
  -h, --help       Show this help
EOF
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    -d|--domain) DOMAIN="$2"; shift 2 ;;
    -w|--with-www) INCLUDE_WWW=true; shift ;;
    -e|--email) EMAIL="$2"; shift 2 ;;
    --prod) PRODUCTION=true; shift ;;
    -h|--help) usage; exit 0 ;;
    *) echo "Unknown option: $1"; usage; exit 1 ;;
  esac
done

if [[ -z "$DOMAIN" ]]; then
  echo "Error: domain is required." >&2
  usage
  exit 1
fi

echo "[auto-deploy] Root: $ROOT_DIR"
echo "[auto-deploy] Domain: $DOMAIN (www: $INCLUDE_WWW)"

ensure_nginx(){
  if ! command -v nginx >/dev/null 2>&1; then
    echo "[auto-deploy] Installing nginx..."
    apt update
    apt install -y nginx
  else
    echo "[auto-deploy] nginx already installed"
  fi

  echo "[auto-deploy] Enabling and starting nginx"
  systemctl enable --now nginx
  nginx -t
}

enable_site(){
  local site_name="highscorewins"
  local available="/etc/nginx/sites-available/$site_name"
  local enabled="/etc/nginx/sites-enabled/$site_name"

  if [[ -f "$available" ]]; then
    echo "[auto-deploy] Backing up existing $available"
    cp -a "$available" "$available.bak.$(date +%s)"
  fi

  if [[ -f "$ROOT_DIR/scripts/nginx-site-example.conf" ]]; then
    echo "[auto-deploy] Installing example site to $available"
    cp "$ROOT_DIR/scripts/nginx-site-example.conf" "$available"
    # Replace placeholder server_name if present
    sed -i "s/server_name your.domain.com;/server_name $DOMAIN; /; s/server_name your.domain.com;/server_name $DOMAIN www.$DOMAIN;/" "$available" || true
    if [[ "$INCLUDE_WWW" == true ]]; then
      sed -i "s/server_name $DOMAIN;/server_name $DOMAIN www.$DOMAIN;/" "$available" || true
    fi
  else
    echo "[auto-deploy] Warning: example site not found, writing minimal proxy site"
    cat > "$available" <<EOF
server {
  listen 80;
  server_name $DOMAIN ${INCLUDE_WWW:+www.$DOMAIN};
  location ~ /.well-known/acme-challenge/ { root /var/www/html; allow all; }
  location / { proxy_pass http://127.0.0.1:3000; proxy_set_header Host \$host; proxy_set_header X-Real-IP \$remote_addr; proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for; proxy_set_header X-Forwarded-Proto \$scheme; }
}
EOF
  fi

  ln -sf "$available" "$enabled"
  nginx -t
  systemctl reload nginx
  echo "[auto-deploy] Site enabled"
}

open_firewall(){
  if command -v ufw >/dev/null 2>&1; then
    if ufw status | grep -qi inactive; then
      echo "[auto-deploy] UFW inactive, skipping firewall open"
    else
      echo "[auto-deploy] Allowing 'Nginx Full' through UFW"
      ufw allow 'Nginx Full' || ufw allow 80/tcp || true
    fi
  else
    echo "[auto-deploy] UFW not present, skip firewall step"
  fi
}

run_prepare(){
  echo "[auto-deploy] Running prepare-release-and-deploy.sh (build, certbot, pm2)"
  local cmd=("bash" "$SCRIPT_DIR/prepare-release-and-deploy.sh" -d "$DOMAIN")
  if [[ "$INCLUDE_WWW" == true ]]; then
    cmd+=( -w )
  fi
  if [[ -n "$EMAIL" ]]; then
    cmd+=( -e "$EMAIL" )
  fi
  if [[ "$PRODUCTION" == true ]]; then
    cmd+=( --prod )
  fi

  echo "[auto-deploy] Executing: ${cmd[*]}"
  "${cmd[@]}"
}

# Run steps
ensure_nginx
enable_site
open_firewall
run_prepare

echo "[auto-deploy] Finished. Verify with: sudo nginx -t; pm2 status; curl -I https://$DOMAIN"

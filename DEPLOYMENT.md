# Edwards Web Development – Deployment Guide

## Quick Start (after unzip on server)

1) Install prerequisites (once): Node 18+, npm, pm2, nginx
2) From the unzipped folder root, run:

```bash
bash scripts/deploy-server.sh
```

- This installs backend deps, starts the server with PM2 (port 3000), saves PM2, and enables startup on boot.
- Ensure `backend/.env` contains your production values (PORT=3000 recommended).

3) Nginx (optional) – copy and enable site:

```bash
sudo cp scripts/nginx-site-example.conf /etc/nginx/sites-available/edwards-webdev
sudo ln -s /etc/nginx/sites-available/edwards-webdev /etc/nginx/sites-enabled/edwards-webdev
sudo nginx -t && sudo systemctl reload nginx
```

Replace `server_name` in the conf as needed. Example:

```
server_name edwardswebdevelopment.com www.edwardswebdevelopment.com;
```

Ensure port 80/443 are open in your cloud firewall and on the host (e.g., `sudo ufw allow 'Nginx Full'`).

4) HTTPS with Certbot (Let's Encrypt)

Option A – automated helper

```bash
sudo bash scripts/setup-certbot.sh -d your.domain.com -w -e you@example.com
```

Option B – manual steps

```bash
# Install certbot via snap (Ubuntu)
sudo apt-get update -y
sudo apt-get install -y snapd
sudo snap install core && sudo snap refresh core
sudo snap install --classic certbot
sudo ln -sf /snap/bin/certbot /usr/bin/certbot

# Ensure your nginx site is enabled and server_name matches your domain
sudo nginx -t && sudo systemctl reload nginx

# Obtain cert and auto-configure nginx with HTTP->HTTPS redirect
sudo certbot --nginx -d your.domain.com -d www.your.domain.com --redirect

# Test auto-renew
sudo certbot renew --dry-run
```

Notes
- The backend expects `NODE_ENV=production` in production so Express serves the built SPAs from `backend/public` and `backend/public/tournaments`. The deploy script now sets `NODE_ENV=production` automatically when starting with PM2.
- Verify the app is listening internally before testing via Nginx:
  - `curl -I http://127.0.0.1:3000/health`
  - `pm2 logs edwards-webdev-api --lines 50`

## Notes
- App serves SPAs at `/` and `/tournaments` from Express.
- Data persists in `backend/data`.
- PM2 commands:
  - `pm2 status`
  - `pm2 logs edwards-webdev-api`
  - `pm2 restart edwards-webdev-api`

### Authentication rate limiting (tunable)
- Defaults: 20 attempts per 5 minutes per IP, and successful logins don’t count.
- Tune via environment variables in `backend/.env`:
  - `AUTH_RATE_WINDOW_MS=300000`  (window in ms)
  - `AUTH_RATE_MAX=20`            (max attempts per window per IP)
  - `AUTH_RATE_SKIP_SUCCESSFUL=true` (do not count successful logins)
After changes: `pm2 restart edwards-webdev-api --update-env`.

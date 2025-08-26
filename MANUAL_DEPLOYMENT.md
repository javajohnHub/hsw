# Manual Deployment Instructions

Since SSH tools aren't available in your Windows environment, here's how to deploy manually:

## 1. Upload Files
Upload the `deploy.zip` file to your server using one of these methods:
- **WinSCP** (free SFTP client): Download from https://winscp.net/
- **FileZilla** (free FTP client): Download from https://filezilla-project.org/
- **VS Code Extensions**: Use "SFTP" extension

**Upload Location:** `/var/www/edwards-webdev/`

## 2. SSH into Your Server
Use a tool like:
- **PuTTY** (free SSH client): Download from https://www.putty.org/
- **Windows Terminal** with OpenSSH: `winget install Microsoft.OpenSSH.Beta`

Connect to: `root@165.227.185.255`

## 3. Run These Commands on Your Server

```bash
cd /var/www/edwards-webdev

# Extract files
unzip -o deploy.zip

# Install dependencies
npm install --production
cd backend && npm install --production && cd ..

# Setup environment
cp backend/.env.production backend/.env
sed -i 's/your-domain.com/edwardswebdevelopment.com/g' backend/.env

# Install required packages
if ! command -v nginx &> /dev/null; then
    echo "Installing Nginx..."
    apt update
    apt install -y nginx
fi

if ! command -v certbot &> /dev/null; then
    echo "Installing Certbot..."
    apt install -y certbot python3-certbot-nginx
fi

if ! command -v pm2 &> /dev/null; then
    echo "Installing PM2..."
    npm install -g pm2
fi

# Configure Nginx
cat > /etc/nginx/sites-available/edwardswebdevelopment.com << 'EOF'
server {
    listen 80;
    server_name edwardswebdevelopment.com www.edwardswebdevelopment.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name edwardswebdevelopment.com www.edwardswebdevelopment.com;
    
    location / {
        proxy_pass http://localhost:4200;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        try_files $uri $uri/ /index.html;
    }
    
    location /api {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
EOF

# Enable site
ln -sf /etc/nginx/sites-available/edwardswebdevelopment.com /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Test Nginx config
nginx -t

# Start applications
pm2 restart ecosystem.config.js --env production
pm2 save
pm2 startup systemd -u root --hp /root

# Reload Nginx
systemctl reload nginx

# Get SSL certificate
certbot --nginx -d edwardswebdevelopment.com -d www.edwardswebdevelopment.com --non-interactive --agree-tos --email admin@edwardswebdevelopment.com

# Setup auto-renewal
echo "0 12 * * * /usr/bin/certbot renew --quiet" | crontab -

# Clean up
rm -f deploy.zip

echo "✅ Deployment complete!"
echo "🔒 SSL certificate installed!"
echo "🌐 Your website is now available at https://edwardswebdevelopment.com"
pm2 status
```

## 4. Alternative: Install OpenSSH on Windows

To use the automated script, install OpenSSH:

```cmd
winget install Microsoft.OpenSSH.Beta
```

Then restart your terminal and run `quick-deploy.bat` again.

## 5. Verify Deployment

After deployment, check:
- https://edwardswebdevelopment.com
- https://www.edwardswebdevelopment.com

Both should show your website with SSL certificates!

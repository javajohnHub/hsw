#!/bin/bash
# Edwards Web Development - Nginx Reverse Proxy Setup Script

echo "🚀 Setting up Nginx Reverse Proxy for Edwards Web Development"
echo "=================================================="

# Update system
echo "📦 Updating system packages..."
sudo apt update

# Install Nginx
echo "🌐 Installing Nginx..."
sudo apt install nginx -y

# Stop Nginx to configure it
sudo systemctl stop nginx

# Backup existing default config
echo "💾 Backing up existing Nginx config..."
sudo cp /etc/nginx/sites-available/default /etc/nginx/sites-available/default.backup

# Create Edwards Web Development Nginx configuration
echo "⚙️  Creating Nginx configuration..."
sudo tee /etc/nginx/sites-available/edwards-webdev > /dev/null << 'EOF'
server {
    listen 80;
    server_name 165.227.185.255 edwardswebdevelopment.com www.edwardswebdevelopment.com;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Main Edwards Web Development website
    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # WebSocket support (if needed)
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Tournament Project
    location /tournament/ {
        proxy_pass http://localhost:4000/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Remove /tournament from the path when forwarding
        rewrite ^/tournament/(.*)$ /$1 break;
    }

    # Portfolio Project (future)
    location /portfolio/ {
        proxy_pass http://localhost:5000/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        rewrite ^/portfolio/(.*)$ /$1 break;
    }

    # E-commerce Project (future)
    location /ecommerce/ {
        proxy_pass http://localhost:6000/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        rewrite ^/ecommerce/(.*)$ /$1 break;
    }

    # API endpoints (explicitly handle these)
    location /api/ {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Health check endpoint
    location /health {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # Static assets with caching
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;
}
EOF

# Disable default site
echo "🔧 Configuring Nginx sites..."
sudo unlink /etc/nginx/sites-enabled/default 2>/dev/null || true

# Enable Edwards Web Development site
sudo ln -s /etc/nginx/sites-available/edwards-webdev /etc/nginx/sites-enabled/

# Test Nginx configuration
echo "🧪 Testing Nginx configuration..."
if sudo nginx -t; then
    echo "✅ Nginx configuration is valid!"
else
    echo "❌ Nginx configuration error! Check the config."
    exit 1
fi

# Configure firewall
echo "🔥 Configuring UFW firewall..."
sudo ufw allow 'Nginx Full'
sudo ufw allow ssh

# Start and enable Nginx
echo "🚀 Starting Nginx..."
sudo systemctl start nginx
sudo systemctl enable nginx

# Display status
echo ""
echo "🎉 Setup Complete!"
echo "=================================================="
echo "✅ Nginx is now running as a reverse proxy"
echo ""
echo "📍 Your websites are now accessible at:"
echo "   • Main site: http://165.227.185.255/"
echo "   • Tournament: http://165.227.185.255/tournament/"
echo "   • Portfolio: http://165.227.185.255/portfolio/ (when ready)"
echo "   • E-commerce: http://165.227.185.255/ecommerce/ (when ready)"
echo ""
echo "🔧 Nginx Status:"
sudo systemctl status nginx --no-pager -l

echo ""
echo "📋 Next Steps:"
echo "1. Make sure your apps are running:"
echo "   pm2 list"
echo "2. Test the main site: curl -I http://localhost/"
echo "3. Test tournament: curl -I http://localhost/tournament/"
echo ""
echo "🛠️  Useful Commands:"
echo "   • Restart Nginx: sudo systemctl restart nginx"
echo "   • Check logs: sudo tail -f /var/log/nginx/error.log"
echo "   • Edit config: sudo nano /etc/nginx/sites-available/edwards-webdev"
echo "   • Test config: sudo nginx -t"
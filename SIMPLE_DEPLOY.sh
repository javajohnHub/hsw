#!/bin/bash

# SIMPLE DEPLOYMENT - No overcomplicated setup
# This will use PM2 to serve both frontend and backend properly

echo "🚀 SIMPLE DEPLOYMENT - Starting fresh..."

# Stop all processes
pm2 delete all 2>/dev/null || true

# Kill anything on the ports we need
sudo fuser -k 3000/tcp 2>/dev/null || true
sudo fuser -k 4200/tcp 2>/dev/null || true

# Simple PM2 configuration - serve frontend with PM2, not Nginx
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [
    {
      name: 'backend',
      script: 'backend/dist/server.js',
      instances: 1,
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      }
    },
    {
      name: 'frontend',
      script: 'serve',
      args: '-s frontend/dist/edwards-webdev -l 4200',
      instances: 1,
      env: {
        NODE_ENV: 'production'
      }
    }
  ]
};
EOF

# Start with PM2
pm2 start ecosystem.config.js

# Simple Nginx - just proxy to PM2 processes
cat > /etc/nginx/sites-available/edwardswebdevelopment.com << 'EOF'
server {
    listen 80;
    server_name edwardswebdevelopment.com www.edwardswebdevelopment.com;
    
    # Frontend - proxy to PM2
    location / {
        proxy_pass http://localhost:4200;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # Backend API - proxy to PM2
    location /api {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
EOF

# Test and reload nginx
nginx -t && systemctl reload nginx

# Show status
echo "✅ SIMPLE SETUP COMPLETE"
echo "📊 PM2 Status:"
pm2 status

echo "🌐 Your site should now work at: http://edwardswebdevelopment.com"
echo "🔧 Backend API: http://edwardswebdevelopment.com/api"

# Save PM2 configuration
pm2 save
pm2 startup systemd -u root --hp /root

echo "🎯 DONE - Simple and working!"

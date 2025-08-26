#!/bin/bash

# Install Node.js and npm first, then deploy
echo "🚀 Installing Node.js and setting up deployment..."

# Install Node.js and npm
echo "📦 Installing Node.js and npm..."
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
apt-get install -y nodejs

# Verify installation
if ! command -v node &> /dev/null; then
    echo "❌ Node.js installation failed"
    exit 1
fi

echo "✅ Node.js $(node --version) installed"
echo "✅ npm $(npm --version) installed"

# Now fix the directory structure (assuming you're in /var/www/edwards-webdev)
echo "🏗️ Setting up directory structure..."
mkdir -p frontend/dist backend/dist

# Move files to correct locations if they exist
if [ -d "dist/edwards-webdev" ]; then
    echo "📁 Moving frontend files..."
    mv dist/edwards-webdev/* frontend/dist/ 2>/dev/null || true
    rmdir dist/edwards-webdev 2>/dev/null || true
fi

if [ -f "dist/server.js" ]; then
    echo "📁 Moving backend files..."
    mv dist/* backend/dist/ 2>/dev/null || true
    rmdir dist 2>/dev/null || true
fi

# Move environment file to backend directory
if [ -f ".env.production" ]; then
    echo "📁 Moving environment file..."
    mkdir -p backend
    mv .env.production backend/
fi

# Create backend package.json if it doesn't exist
if [ ! -f "backend/package.json" ]; then
    echo "📄 Creating backend package.json..."
    cat > backend/package.json << 'EOF'
{
  "name": "edwards-webdev-backend",
  "version": "1.0.0",
  "description": "Edwards Web Development Backend",
  "main": "dist/server.js",
  "scripts": {
    "start": "node dist/server.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "cors": "^2.8.5",
    "helmet": "^7.0.0",
    "express-rate-limit": "^6.7.0",
    "express-validator": "^6.15.0"
  }
}
EOF
fi

# Setup environment file
if [ -f "backend/.env.production" ]; then
    echo "🔧 Setting up environment..."
    cp backend/.env.production backend/.env
    sed -i 's/your-domain.com/edwardswebdevelopment.com/g' backend/.env
fi

# Install dependencies
echo "📚 Installing dependencies..."
if [ -f "package.json" ]; then
    npm install --production
fi

if [ -f "backend/package.json" ]; then
    cd backend
    npm install --production
    cd ..
fi

# Install PM2 and serve globally
echo "📦 Installing PM2 and serve..."
npm install -g pm2 serve

# Start applications with PM2
echo "🚀 Starting applications with PM2..."
pm2 delete all 2>/dev/null || true
pm2 start ecosystem.config.js --env production
pm2 save
pm2 startup systemd -u root --hp /root

# Install Nginx
echo "📦 Installing Nginx..."
apt update
apt install -y nginx

# Configure Nginx (HTTP only)
echo "🔧 Configuring Nginx..."
cat > /etc/nginx/sites-available/edwardswebdevelopment.com << 'EOF'
server {
    listen 80;
    server_name edwardswebdevelopment.com www.edwardswebdevelopment.com;
    
    # Frontend (Angular app)
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
    
    # Backend API
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

# Enable the site
echo "🔧 Enabling Nginx site..."
ln -sf /etc/nginx/sites-available/edwardswebdevelopment.com /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Test and start Nginx
echo "🧪 Testing Nginx configuration..."
nginx -t
systemctl restart nginx

# Clean up
echo "🧹 Cleaning up..."
rm -f deploy.zip

# Show final status
echo ""
echo "✅ DEPLOYMENT COMPLETE!"
echo "=========================================="
echo "🌐 Your website is now available at:"
echo "    http://edwardswebdevelopment.com"
echo "    http://www.edwardswebdevelopment.com"
echo ""
echo "📊 PM2 Status:"
pm2 status

echo ""
echo "📡 Nginx Status:"
systemctl status nginx --no-pager -l | head -5

echo ""
echo "🎉 Deployment finished successfully!"
echo ""
echo "To add SSL later, run:"
echo "    apt install -y certbot python3-certbot-nginx"
echo "    certbot --nginx -d edwardswebdevelopment.com -d www.edwardswebdevelopment.com"

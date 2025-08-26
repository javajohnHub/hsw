#!/bin/bash

# Server cleanup script - removes old deployment files and scripts
# Usage: chmod +x cleanup-server.sh && ./cleanup-server.sh

set -e

echo "🧹 Starting server cleanup..."

# Stop all PM2 processes first
echo "🛑 Stopping all PM2 processes..."
pm2 stop all || true
pm2 delete all || true

# Remove old deployment scripts and files
echo "🗑️ Removing old deployment files..."
rm -f SIMPLE_DEPLOY_FINAL.sh
rm -f debug.sh
rm -f deploy-server.sh
rm -f deploy.zip
rm -f edwards-webdev-deploy.zip
rm -f fix-build-loop.sh
rm -f fix-dpkg-lock.sh
rm -f fix-routing.sh
rm -f fix-serve.sh
rm -f make-persistent.sh
rm -f manual-deploy.sh
rm -f nginx-fix.sh
rm -f quick-fix-deploy.sh
rm -f server-setup-after-unzip.sh
rm -f simple-deploy.sh
rm -f use-http-server.sh
rm -f ecosystem.config.js.backup

# Remove all the other bullshit files
echo "🗑️ Removing all the extra deployment files..."
rm -f ACCESSIBILITY_GUIDE.md
rm -f DEPLOYMENT.md
rm -f DEPLOYMENT_CHECKLIST.md
rm -f Dockerfile
rm -f MANUAL_DEPLOYMENT.md
rm -f PERFORMANCE_GUIDE.md
rm -f README.md
rm -f SIMPLE_DEPLOY.md
rm -f SIMPLE_DEPLOY.sh
rm -f UBUNTU_DEPLOYMENT.md
rm -f debug-404.sh
rm -f deploy-digital-ocean.sh
rm -f deploy-now.sh
rm -f deploy.bat
rm -f deploy.sh
rm -f emergency-commands.sh
rm -f fix-502-error.sh
rm -f nginx-config.conf
rm -f prepare-deploy.bat
rm -f prepare-deploy.sh
rm -f quick-deploy.bat
rm -f quick-deploy.ps1
rm -f quick-deploy.sh
rm -f quick-fix-502.sh
rm -f quick-fix.sh
rm -f server-commands-reference.sh
rm -f server-deploy-commands.sh
rm -f server-troubleshooting.sh
rm -f setup-nodejs-deploy.sh
rm -rf edwards-webdev-deploy

# Remove old node_modules if they exist
echo "🗑️ Removing old node_modules..."
rm -rf node_modules

# Clean up old logs but keep the directory
echo "🗑️ Cleaning up old logs..."
rm -rf logs/*.log || true
mkdir -p logs

# Remove any leftover package files (but keep snap directory)
echo "🗑️ Removing old package files..."
rm -f package-lock.json
rm -f package.json

# Remove backend and frontend directories if they exist
echo "🗑️ Removing old backend and frontend directories..."
rm -rf backend
rm -rf frontend

# Remove any other temporary files but keep system files
echo "🗑️ Removing temporary files..."
rm -f *.log
rm -f *.tar.gz
rm -f *.zip

# Keep snap directory - it's system related
echo "⚠️  Keeping snap directory (system files)"

# Show what's left
echo "📋 Remaining files after cleanup:"
ls -la

echo "✅ Server cleanup complete!"
echo "🎯 Ready for fresh deployment"
echo ""
echo "Next steps:"
echo "1. Upload your new edwards-webdev-FINAL.tar.gz"
echo "2. Extract it: tar -xzf edwards-webdev-FINAL.tar.gz"
echo "3. Run deployment: chmod +x final-deploy.sh && ./final-deploy.sh"

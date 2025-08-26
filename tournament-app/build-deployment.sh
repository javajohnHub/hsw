#!/bin/bash

echo "🚀 Building RND Tournament Management for Server Deployment"
echo "============================================================"

# Create deployment directory
rm -rf deployment
mkdir -p deployment/server
mkdir -p deployment/client
mkdir -p deployment/logs

echo "📦 Copying server files..."
cp -r server/* deployment/server/
cp package.json deployment/
cp ecosystem.config.js deployment/
cp ecosystem.production.config.js deployment/
cp pm2-control.cmd deployment/
cp pm2-control.sh deployment/
cp server-deploy.sh deployment/
cp PM2-DEPLOYMENT.md deployment/

echo "📦 Copying client build files..."
if [ -d "client/dist/retro-never-dies-client" ]; then
    mkdir -p deployment/client/dist
    cp -r client/dist/retro-never-dies-client/* deployment/client/dist/retro-never-dies-client/
    echo "✅ Client build files copied"
else
    echo "❌ Client dist folder not found. Make sure to run 'npm run build' in client folder first."
    echo "    Expected: client/dist/retro-never-dies-client/"
    exit 1
fi

echo "📦 Creating production server configuration..."
cat > deployment/server/production.config.js << EOF
module.exports = {
  staticPath: '../client/dist',
  port: process.env.PORT || 4000
};
EOF

echo "📦 Copying additional files..."
cp README.md deployment/ 2>/dev/null || true
if [ -f "client/package.json" ]; then
    cp client/package.json deployment/client/
fi

echo "📝 Creating deployment info..."
cat > deployment/DEPLOYMENT-INFO.txt << EOF
Deployment Package Created: $(date)
Angular Build: Production
Server: Node.js with Express
Process Manager: PM2

Instructions:
1. Extract this package on your server
2. Install Node.js 18+ if not already installed
3. Run: npm install
4. Run: pm2-control.cmd prod (Windows) or ./pm2-control.sh prod (Linux)
5. Access application at http://your-server:4000
EOF

echo "🗜️ Creating ZIP archive..."
rm -f RND-Tournament-Management-Server.zip

if command -v zip &> /dev/null; then
    cd deployment
    zip -r ../RND-Tournament-Management-Server.zip .
    cd ..
else
    echo "⚠️ zip command not found. Creating tar.gz instead..."
    tar -czf RND-Tournament-Management-Server.tar.gz -C deployment .
fi

if [ -f "RND-Tournament-Management-Server.zip" ] || [ -f "RND-Tournament-Management-Server.tar.gz" ]; then
    echo "✅ Deployment package created successfully"
    echo "📊 Package contents:"
    ls -la deployment/
else
    echo "❌ Failed to create archive package"
    echo "📁 Deployment files are available in the 'deployment' folder"
fi

echo ""
echo "🎉 Build completed successfully!"
if [ -f "RND-Tournament-Management-Server.zip" ]; then
    echo "📦 Deployment package: RND-Tournament-Management-Server.zip"
elif [ -f "RND-Tournament-Management-Server.tar.gz" ]; then
    echo "📦 Deployment package: RND-Tournament-Management-Server.tar.gz"
fi
echo "📁 Deployment folder: deployment/"
echo ""
echo "🚀 To deploy on server:"
echo "1. Upload the package to your server"
echo "2. Extract the archive"
echo "3. Run: npm install"
echo "4. Run: pm2-control.cmd prod (Windows) or ./pm2-control.sh prod (Linux)"
echo ""

#!/bin/bash

echo "🚀 Complete Build and Deploy to Server"
echo "======================================"

SERVER_IP="165.227.185.255"
SSH_USER="root"
REMOTE_PATH="/home/deploy/"

echo "🔨 Step 1: Building Angular application..."
cd client
npm run build
if [ $? -ne 0 ]; then
    echo "❌ Angular build failed!"
    exit 1
fi
cd ..

echo "📦 Step 2: Creating deployment package..."
./build-deployment.sh
if [ $? -ne 0 ]; then
    echo "❌ Deployment packaging failed!"
    exit 1
fi

echo "📤 Step 3: Uploading to server..."
./upload-to-server.sh

echo ""
echo "🎉 Build and deployment process completed!"
echo ""
echo "🌐 Your application should be accessible at:"
echo "   Public: http://$SERVER_IP:4000"
echo "   Admin:  http://$SERVER_IP:4000?admin=1"
echo ""

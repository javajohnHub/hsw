#!/bin/bash

echo "🚀 Uploading RND Tournament Management to Server"
echo "================================================"

SERVER_IP="165.227.185.255"
ZIP_FILE="RND-Tournament-Management-Server.zip"
REMOTE_PATH="/home/deploy/"
SSH_USER="root"

# Check if ZIP file exists
if [ ! -f "$ZIP_FILE" ]; then
    echo "❌ Deployment package not found: $ZIP_FILE"
    echo "   Please run ./build-deployment.sh first"
    exit 1
fi

echo "📦 Found deployment package: $ZIP_FILE"
echo "🎯 Target server: $SERVER_IP"
echo "👤 SSH user: $SSH_USER"
echo "📁 Remote path: $REMOTE_PATH"
echo ""

# Check if we have SCP available
if ! command -v scp &> /dev/null; then
    echo "❌ SCP not found. Please install openssh-client:"
    echo "   Ubuntu/Debian: sudo apt install openssh-client"
    echo "   macOS: SSH tools are included by default"
    echo "   CentOS/RHEL: sudo yum install openssh-clients"
    exit 1
fi

echo "📤 Uploading deployment package..."
echo "Command: scp \"$ZIP_FILE\" $SSH_USER@$SERVER_IP:$REMOTE_PATH"
echo ""

# Upload the file
scp "$ZIP_FILE" "$SSH_USER@$SERVER_IP:$REMOTE_PATH"

if [ $? -eq 0 ]; then
    echo "✅ Upload completed successfully!"
    echo ""
    echo "🚀 Next steps on the server:"
    echo "   1. SSH to server: ssh $SSH_USER@$SERVER_IP"
    echo "   2. Extract package: unzip $REMOTE_PATH$ZIP_FILE"
    echo "   3. Install dependencies: npm install"
    echo "   4. Start application: ./pm2-control.sh prod"
    echo "   5. Access at: http://$SERVER_IP:4000"
    echo ""
    echo "🔧 Server management commands:"
    echo "   - Check status: ./pm2-control.sh status"
    echo "   - View logs: ./pm2-control.sh logs"
    echo "   - Restart: ./pm2-control.sh restart"
    echo "   - Stop: ./pm2-control.sh stop"
    echo ""
    
    read -p "Would you like to SSH and deploy now? (y/n): " DEPLOY_NOW
    if [ "$DEPLOY_NOW" = "y" ] || [ "$DEPLOY_NOW" = "Y" ]; then
        echo "🔗 Connecting to server..."
        ssh "$SSH_USER@$SERVER_IP"
    fi
else
    echo "❌ Upload failed!"
    echo ""
    echo "🔧 Troubleshooting:"
    echo "   - Verify server IP: $SERVER_IP"
    echo "   - Check SSH access: ssh $SSH_USER@$SERVER_IP"
    echo "   - Ensure remote directory exists: $REMOTE_PATH"
    echo "   - Check network connectivity"
    echo ""
    echo "📝 Manual upload options:"
    echo "   - Use rsync: rsync -avz $ZIP_FILE $SSH_USER@$SERVER_IP:$REMOTE_PATH"
    echo "   - Use SFTP: sftp $SSH_USER@$SERVER_IP"
fi

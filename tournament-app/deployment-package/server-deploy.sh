#!/bin/bash

echo "🚀 RND Tournament Management - Server Deployment"
echo "================================================"

ZIP_FILE="RND-Tournament-Management-Server.zip"
EXTRACT_DIR="rnd-tournament"

# Check if ZIP file exists
if [ ! -f "$ZIP_FILE" ]; then
    echo "❌ Deployment package not found: $ZIP_FILE"
    echo "   Please upload the package first"
    exit 1
fi

echo "📦 Found deployment package: $ZIP_FILE"

# Create extraction directory
if [ -d "$EXTRACT_DIR" ]; then
    echo "🗑️  Removing existing deployment directory..."
    rm -rf "$EXTRACT_DIR"
fi

mkdir -p "$EXTRACT_DIR"
echo "📁 Created extraction directory: $EXTRACT_DIR"

# Extract the ZIP file
echo "📤 Extracting deployment package..."
unzip -q "$ZIP_FILE" -d "$EXTRACT_DIR"

if [ $? -eq 0 ]; then
    echo "✅ Package extracted successfully"
else
    echo "❌ Failed to extract package"
    exit 1
fi

# Change to deployment directory
cd "$EXTRACT_DIR"

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found. Installing Node.js..."
    
    # Detect OS and install Node.js
    if [ -f /etc/debian_version ]; then
        # Debian/Ubuntu
        curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
        sudo apt-get install -y nodejs
    elif [ -f /etc/redhat-release ]; then
        # CentOS/RHEL
        curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
        sudo yum install -y nodejs
    else
        echo "❌ Unsupported OS. Please install Node.js 18+ manually"
        exit 1
    fi
fi

# Check Node.js version
NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version $NODE_VERSION is too old. Please upgrade to Node.js 18+"
    exit 1
fi

echo "✅ Node.js $(node --version) is available"

# Install dependencies
echo "📥 Installing dependencies..."
npm install

if [ $? -eq 0 ]; then
    echo "✅ Dependencies installed successfully"
else
    echo "❌ Failed to install dependencies"
    exit 1
fi

# Check if PM2 is installed globally
if ! command -v pm2 &> /dev/null; then
    echo "📦 Installing PM2 globally..."
    npm install -g pm2
fi

echo "✅ PM2 $(pm2 --version) is available"

# Make control script executable
chmod +x pm2-control.sh

# Start the application in production mode
echo "🚀 Starting application in production mode..."
./pm2-control.sh prod

if [ $? -eq 0 ]; then
    echo ""
    echo "🎉 Deployment completed successfully!"
    echo ""
    echo "🌐 Application is now running at:"
    echo "   Public: http://$(hostname -I | awk '{print $1}'):4000"
    echo "   Admin:  http://$(hostname -I | awk '{print $1}'):4000?admin=1"
    echo ""
    echo "🔧 Management commands:"
    echo "   Status:  ./pm2-control.sh status"
    echo "   Logs:    ./pm2-control.sh logs"
    echo "   Restart: ./pm2-control.sh restart"
    echo "   Stop:    ./pm2-control.sh stop"
    echo ""
    echo "📊 Monitor processes:"
    echo "   pm2 monit"
    echo ""
    
    # Setup PM2 startup script
    echo "⚙️  Setting up PM2 to start on boot..."
    pm2 startup
    echo ""
    echo "⚠️  Please run the command above (if shown) to enable startup on boot"
    
else
    echo "❌ Failed to start application"
    echo "🔍 Check logs with: ./pm2-control.sh logs"
    exit 1
fi

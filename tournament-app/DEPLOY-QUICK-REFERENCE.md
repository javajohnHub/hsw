# 🚀 Quick Deployment Guide

## Server Info
- **IP**: 165.227.185.255
- **User**: root
- **Port**: 4000 (application)

## 📦 Local Commands (Windows)

### Option 1: Complete Deploy
```cmd
deploy-full.cmd
```

### Option 2: Step by Step
```cmd
REM 1. Build the app
cd client && npm run build && cd ..

REM 2. Package for deployment
build-deployment.cmd

REM 3. Upload to server
upload-to-server.cmd
```

## 🖥️ Server Commands (Linux)

### After Upload
```bash
# 1. Connect to server
ssh root@165.227.185.255

# 2. Auto-deploy (recommended)
chmod +x server-deploy.sh
./server-deploy.sh

# OR Manual deployment:
unzip RND-Tournament-Management-Server.zip -d rnd-tournament
cd rnd-tournament
npm install
chmod +x pm2-control.sh
./pm2-control.sh prod
```

## 🔧 Management Commands
```bash
./pm2-control.sh status    # Check status
./pm2-control.sh logs      # View logs
./pm2-control.sh restart   # Restart app
./pm2-control.sh stop      # Stop app
pm2 monit                  # Real-time monitoring
```

## 🌐 Access URLs
- **Public**: http://165.227.185.255:4000
- **Admin**: http://165.227.185.255:4000?admin=1

## 🔥 Firewall (if needed)
```bash
sudo ufw allow 4000
sudo ufw enable
```

## ⚙️ Auto-start on Boot
```bash
pm2 startup
pm2 save
# Run the command shown by pm2 startup
```

## 🔄 Update Deployment
```bash
# On local machine
deploy-full.cmd

# On server
./pm2-control.sh stop
./server-deploy.sh
```

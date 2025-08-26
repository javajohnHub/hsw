# Ubuntu Server Deployment Instructions

## 📦 What You Need to Upload

1. **deploy.zip** - Created by running `quick-deploy.bat`
2. **deploy-server.sh** - The Ubuntu deployment script (included in deploy.zip)

## 🚀 Deployment Steps

### Step 1: Run the Local Script
On your Windows machine:
```cmd
cd C:\Users\joedw\OneDrive\Desktop\mybizsite
quick-deploy.bat
```

This creates `deploy.zip` with everything needed.

### Step 2: Upload to Server
Use WinSCP or FileZilla to upload `deploy.zip` to:
- **Server:** `165.227.185.255`
- **Username:** `root`
- **Location:** `/var/www/edwards-webdev/`

### Step 3: Connect to Server
Use PuTTY or WinSCP terminal to connect to your server:
- **Host:** `165.227.185.255`
- **Username:** `root`
- **Port:** `22`

### Step 4: Navigate and Run
On your Ubuntu server, run these commands:
```bash
cd /var/www/edwards-webdev
chmod +x deploy-server.sh
./deploy-server.sh
```

## 🎯 What the Script Does

The `deploy-server.sh` script will:
- ✅ Extract deploy.zip
- ✅ Install dependencies (root + backend)
- ✅ Setup environment variables
- ✅ Install PM2, Nginx, Certbot
- ✅ Start both frontend and backend with PM2
- ✅ Configure Nginx reverse proxy
- ✅ Get SSL certificates for edwardswebdevelopment.com
- ✅ Setup automatic SSL renewal

## 📋 Final Result

Your website will be available at:
- **https://edwardswebdevelopment.com** (with SSL)
- **https://www.edwardswebdevelopment.com** (with SSL)

## 🔧 Troubleshooting

If something goes wrong:
```bash
# Check PM2 status
pm2 status

# Check PM2 logs
pm2 logs

# Check Nginx status
systemctl status nginx

# Restart services
pm2 restart all
systemctl restart nginx
```

## 📝 Quick Summary

1. Run `quick-deploy.bat` on Windows
2. Upload `deploy.zip` to `/var/www/edwards-webdev/`
3. SSH into server and run `./deploy-server.sh`
4. Visit https://edwardswebdevelopment.com

That's it! 🎉

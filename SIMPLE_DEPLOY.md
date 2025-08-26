# Simple Deployment Instructions

## 🚀 Easy 3-Step Deployment

### Step 1: Create Deployment Package
Run on your local Windows machine:
```cmd
cd C:\Users\joedw\OneDrive\Desktop\mybizsite
quick-deploy.bat
```

This will:
- Build your application
- Create `deploy.zip` with everything needed
- Include the server deployment script

### Step 2: Upload Files to Server
Use WinSCP to upload **both files** to `/var/www/edwards-webdev/`:
- `deploy.zip`
- `deploy-server.sh`

### Step 3: Run Deployment on Server
SSH into your server and run:
```bash
cd /var/www/edwards-webdev
chmod +x deploy-server.sh
./deploy-server.sh
```

That's it! The script will automatically:
- ✅ Extract all files
- ✅ Install dependencies
- ✅ Configure PM2 for frontend and backend
- ✅ Setup Nginx reverse proxy
- ✅ Install SSL certificates
- ✅ Configure auto-renewal

## 🌐 Result
Your website will be live at:
- **https://edwardswebdevelopment.com**
- **https://www.edwardswebdevelopment.com**

## 🔧 Server Requirements
- Ubuntu 20.04+ or similar
- Node.js 18+ installed
- Root access

## 📞 If You Need Help
The deployment script shows detailed progress and error messages. If something fails, the script will tell you exactly what went wrong.

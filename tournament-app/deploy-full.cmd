@echo off
echo 🚀 Complete Build and Deploy to Server
echo ======================================

set SERVER_IP=165.227.185.255
set SSH_USER=root
set REMOTE_PATH=/home/deploy/

echo 🔨 Step 1: Building Angular application...
cd client
call npm run build
if %errorlevel% neq 0 (
    echo ❌ Angular build failed!
    pause
    exit /b 1
)
cd ..

echo 📦 Step 2: Creating deployment package...
call build-deployment.cmd
if %errorlevel% neq 0 (
    echo ❌ Deployment packaging failed!
    pause
    exit /b 1
)

echo 📤 Step 3: Uploading to server...
call upload-to-server.cmd

echo.
echo 🎉 Build and deployment process completed!
echo.
echo 🌐 Your application should be accessible at:
echo    Public: http://%SERVER_IP%:4000
echo    Admin:  http://%SERVER_IP%:4000?admin=1
echo.
pause

@echo off
echo ==========================================
echo  Complete Deployment Guide
echo ==========================================

echo.
echo 🎯 Deployment Options:
echo.
echo  1. Quick Deploy    - Build ^+ Upload ^+ Deploy
echo  2. Build Only      - Create deployment package  
echo  3. Upload Only     - Upload existing package
echo  4. Connect SSH     - Connect to server
echo  5. View Status     - Check deployment status
echo.

set /p choice="Select option (1-5): "

if "%choice%"=="1" (
    echo.
    echo 🚀 Starting Quick Deploy...
    call quick-deploy.cmd
    goto :end
)

if "%choice%"=="2" (
    echo.
    echo 🔨 Building deployment package...
    call build-and-deploy.cmd
    goto :end
)

if "%choice%"=="3" (
    echo.
    echo 📤 Uploading to server...
    call upload-server-deploy.cmd
    goto :end
)

if "%choice%"=="4" (
    echo.
    echo 🔌 Connecting to server...
    call connect-to-server.cmd
    goto :end
)

if "%choice%"=="5" (
    echo.
    echo 📊 Checking server status...
    echo Connecting to check PM2 status...
    "C:\Program Files\Git\usr\bin\ssh.exe" root@165.227.185.255 "pm2 status; echo ''; echo 'Recent logs:'; pm2 logs tournament-app --lines 10"
    goto :end
)

echo ❌ Invalid choice. Please select 1-5.
pause
goto :start

:end
pause

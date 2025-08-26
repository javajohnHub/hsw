@echo off
echo ======================================
echo  Building RND Tournament Management
echo  for Server Deployment
echo ======================================

REM Check if Angular build exists
if not exist "client\dist\retro-never-dies-client" (
    echo Angular build not found. Building now...
    cd client
    call npm run build
    cd ..
    if not exist "client\dist\retro-never-dies-client" (
        echo ERROR: Angular build failed
        pause
        exit /b 1
    )
)

echo ✅ Angular build found

REM Create deployment directory
if exist "deployment-package" rmdir /s /q "deployment-package"
mkdir "deployment-package"

echo 📦 Creating deployment package...

REM Copy server files
xcopy "server" "deployment-package\server\" /E /I /Y
xcopy "client\dist" "deployment-package\client\dist\" /E /I /Y

REM Copy configuration files
copy "ecosystem.production.config.js" "deployment-package\"
copy "pm2-control.sh" "deployment-package\"
copy "pm2-control.cmd" "deployment-package\"
copy "server-deploy.sh" "deployment-package\"

REM Copy package.json files
copy "package.json" "deployment-package\"
copy "server\package.json" "deployment-package\server\"

REM Create logs directory
mkdir "deployment-package\logs"

echo 🗜️ Creating ZIP file...

REM Create ZIP using PowerShell
powershell -Command "Compress-Archive -Path 'deployment-package\*' -DestinationPath 'RND-Tournament-Server-Deploy.zip' -Force"

if exist "RND-Tournament-Server-Deploy.zip" (
    echo ✅ Deployment package created: RND-Tournament-Server-Deploy.zip
    echo 📊 Package size:
    dir "RND-Tournament-Server-Deploy.zip"
    
    echo.
    echo 🚀 Ready to upload to server!
    echo.
    choice /M "Upload to server now"
    if %ERRORLEVEL%==1 (
        call upload-server-deploy.cmd
    )
) else (
    echo ❌ Failed to create deployment package
    pause
    exit /b 1
)

echo.
echo 🎯 Deployment package ready!
echo    File: RND-Tournament-Server-Deploy.zip
echo    Target: 165.227.185.255:4000
echo.
pause

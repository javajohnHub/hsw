@echo off
echo 🚀 Building RND Tournament Management for Server Deployment
echo ============================================================

REM Create deployment directory
if exist "deployment" rmdir /s /q deployment
mkdir deployment
mkdir deployment\server
mkdir deployment\client
mkdir deployment\logs

echo 📦 Copying server files...
xcopy /s /e server\*.* deployment\server\
copy package.json deployment\
copy ecosystem.config.js deployment\
copy ecosystem.production.config.js deployment\
copy pm2-control.cmd deployment\
copy pm2-control.sh deployment\
copy server-deploy.sh deployment\
copy PM2-DEPLOYMENT.md deployment\

echo 📦 Copying client build files...
if exist "client\dist\retro-never-dies-client" (
    xcopy /s /e client\dist\retro-never-dies-client\*.* deployment\client\dist\retro-never-dies-client\
    echo ✅ Client build files copied
) else (
    echo ❌ Client dist folder not found. Make sure to run 'npm run build' in client folder first.
    echo    Expected: client\dist\retro-never-dies-client\
    pause
    exit /b 1
)

echo 📦 Creating production server configuration...
echo module.exports = { > deployment\server\production.config.js
echo   staticPath: '../client/dist', >> deployment\server\production.config.js
echo   port: process.env.PORT ^|^| 4000 >> deployment\server\production.config.js
echo }; >> deployment\server\production.config.js

echo 📦 Copying additional files...
copy README.md deployment\ 2>nul
if exist "client\package.json" copy client\package.json deployment\client\

echo 📝 Creating deployment info...
echo Deployment Package Created: %date% %time% > deployment\DEPLOYMENT-INFO.txt
echo Angular Build: Production >> deployment\DEPLOYMENT-INFO.txt
echo Server: Node.js with Express >> deployment\DEPLOYMENT-INFO.txt
echo Process Manager: PM2 >> deployment\DEPLOYMENT-INFO.txt
echo. >> deployment\DEPLOYMENT-INFO.txt
echo Instructions: >> deployment\DEPLOYMENT-INFO.txt
echo 1. Extract this package on your server >> deployment\DEPLOYMENT-INFO.txt
echo 2. Install Node.js 18+ if not already installed >> deployment\DEPLOYMENT-INFO.txt
echo 3. Run: npm install >> deployment\DEPLOYMENT-INFO.txt
echo 4. Run: pm2-control.cmd prod (Windows) or ./pm2-control.sh prod (Linux) >> deployment\DEPLOYMENT-INFO.txt
echo 5. Access application at http://your-server:4000 >> deployment\DEPLOYMENT-INFO.txt

echo 🗜️ Creating ZIP archive...
if exist "RND-Tournament-Management-Server.zip" del "RND-Tournament-Management-Server.zip"

REM Use PowerShell to create ZIP (available on Windows 10+)
powershell -command "Compress-Archive -Path 'deployment\*' -DestinationPath 'RND-Tournament-Management-Server.zip' -Force"

if exist "RND-Tournament-Management-Server.zip" (
    echo ✅ Deployment package created: RND-Tournament-Management-Server.zip
    echo 📊 Package contents:
    powershell -command "Get-ChildItem 'deployment' -Recurse | Select-Object Name, Length | Format-Table -AutoSize"
) else (
    echo ❌ Failed to create ZIP package
    echo 📁 Deployment files are available in the 'deployment' folder
)

echo.
echo 🎉 Build completed successfully!
echo 📦 Deployment package: RND-Tournament-Management-Server.zip
echo 📁 Deployment folder: deployment\
echo.
echo 🚀 To deploy on server:
echo 1. Upload RND-Tournament-Management-Server.zip to your server
echo 2. Extract the ZIP file
echo 3. Run: npm install
echo 4. Run: pm2-control.cmd prod (Windows) or ./pm2-control.sh prod (Linux)
echo.
pause

@echo off
echo 📤 Uploading using Git SCP
echo ==========================

set SERVER_IP=165.227.185.255
set SSH_USER=root
set ZIP_FILE=RND-Tournament-Management-Server.zip
set REMOTE_PATH=/root/
set GIT_SCP="C:\Program Files\Git\usr\bin\scp.exe"

if not exist "%ZIP_FILE%" (
    echo ❌ File not found: %ZIP_FILE%
    echo Please run build-deployment.cmd first
    pause
    exit /b 1
)

if not exist %GIT_SCP% (
    echo ❌ Git SCP not found at: %GIT_SCP%
    echo Please check your Git installation
    pause
    exit /b 1
)

echo 📦 File: %ZIP_FILE%
echo 🎯 Server: %SERVER_IP%
echo 👤 User: %SSH_USER%
echo 📁 Path: %REMOTE_PATH%
echo.

echo 📤 Uploading...
%GIT_SCP% "%ZIP_FILE%" %SSH_USER%@%SERVER_IP%:%REMOTE_PATH%

if %errorlevel% equ 0 (
    echo ✅ Upload successful!
    echo.
    echo 🚀 Next: Connect to server and deploy
    echo Command: ssh-to-server.cmd
    echo.
    set /p CONNECT="Connect now? (y/n): "
    if /i "!CONNECT!"=="y" (
        call ssh-to-server.cmd
    )
) else (
    echo ❌ Upload failed!
    echo Check your connection and try again
)

pause

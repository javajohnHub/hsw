@echo off
echo ======================================
echo  Uploading to Server: 165.227.185.255
echo ======================================

if not exist "RND-Tournament-Server-Deploy.zip" (
    echo ❌ Deployment package not found!
    echo Run build-and-deploy.cmd first
    pause
    exit /b 1
)

echo 📤 Uploading RND-Tournament-Server-Deploy.zip...

REM Try to upload using Git SSH tools
"C:\Program Files\Git\usr\bin\scp.exe" "RND-Tournament-Server-Deploy.zip" root@165.227.185.255:/root/

if %ERRORLEVEL% == 0 (
    echo ✅ Upload successful!
    echo.
    echo 🚀 Next steps on server:
    echo    1. cd /root/
    echo    2. unzip RND-Tournament-Server-Deploy.zip
    echo    3. chmod +x server-deploy.sh
    echo    4. ./server-deploy.sh
    echo.
    choice /M "Connect to server now to deploy"
    if !ERRORLEVEL!==1 (
        "C:\Program Files\Git\usr\bin\ssh.exe" root@165.227.185.255
    )
) else (
    echo ❌ Upload failed
    echo.
    echo 🔧 Manual upload options:
    echo    - Use WinSCP: https://winscp.net/
    echo    - Use FileZilla: https://filezilla-project.org/
    echo.
)

pause

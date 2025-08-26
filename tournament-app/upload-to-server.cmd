@echo off
setlocal enabledelayedexpansion

echo 🚀 Uploading RND Tournament Management to Server
echo ================================================

set SERVER_IP=165.227.185.255
set ZIP_FILE=RND-Tournament-Management-Server.zip
set REMOTE_PATH=/root/
set SSH_USER=root

REM Check if ZIP file exists
if not exist "%ZIP_FILE%" (
    echo ❌ Deployment package not found: %ZIP_FILE%
    echo    Please run build-deployment.cmd first
    pause
    exit /b 1
)

echo 📦 Found deployment package: %ZIP_FILE%
echo 🎯 Target server: %SERVER_IP%
echo 👤 SSH user: %SSH_USER%
echo 📁 Remote path: %REMOTE_PATH%
echo.

REM Check if we have SCP available and find the best option
set SCP_CMD=
set SSH_CMD=

REM Method 1: Check Windows OpenSSH
where scp >nul 2>nul
if %errorlevel% equ 0 (
    set SCP_CMD=scp
    set SSH_CMD=ssh
    echo ✅ Using Windows OpenSSH Client
    goto :upload
)

REM Method 2: Check Git Bash
if exist "C:\Program Files\Git\usr\bin\scp.exe" (
    set SCP_CMD="C:\Program Files\Git\usr\bin\scp.exe"
    set SSH_CMD="C:\Program Files\Git\usr\bin\ssh.exe"
    echo ✅ Using Git Bash SSH tools
    goto :upload
)

if exist "C:\Program Files (x86)\Git\usr\bin\scp.exe" (
    set SCP_CMD="C:\Program Files (x86)\Git\usr\bin\scp.exe"
    set SSH_CMD="C:\Program Files (x86)\Git\usr\bin\ssh.exe"
    echo ✅ Using Git Bash SSH tools (x86)
    goto :upload
)

REM Method 3: Check WSL
where wsl >nul 2>nul
if %errorlevel% equ 0 (
    set SCP_CMD=wsl scp
    set SSH_CMD=wsl ssh
    echo ✅ Using Windows Subsystem for Linux
    goto :upload
)

REM If no SCP found, provide alternatives
echo ❌ SCP not found. Options available:
echo.
echo 🔧 Quick Install Options:
echo    1. Git for Windows: https://git-scm.com/download/win
echo    2. Enable OpenSSH: Settings ^> Apps ^> Optional Features ^> Add OpenSSH Client
echo    3. Install WSL: Run 'wsl --install' in admin PowerShell
echo.
echo 📤 Manual Upload Options:
echo    WinSCP (Recommended): https://winscp.net/
echo    - Protocol: SCP or SFTP
echo    - Host: %SERVER_IP%
echo    - Username: %SSH_USER%
echo    - Port: 22
echo    - Upload: %ZIP_FILE% to %REMOTE_PATH%
echo.
echo    FileZilla: https://filezilla-project.org/
echo    - Protocol: SFTP
echo    - Host: %SERVER_IP%
echo    - Username: %SSH_USER%
echo    - Port: 22
echo.
set /p MANUAL="Continue with manual upload? (y/n): "
if /i "!MANUAL!"=="y" (
    start https://winscp.net/
    echo Opening WinSCP download page...
)
pause
exit /b 1

:upload

echo 📤 Uploading deployment package...
echo Command: %SCP_CMD% "%ZIP_FILE%" %SSH_USER%@%SERVER_IP%:%REMOTE_PATH%
echo.

%SCP_CMD% "%ZIP_FILE%" %SSH_USER%@%SERVER_IP%:%REMOTE_PATH%

if %errorlevel% equ 0 (
    echo ✅ Upload completed successfully!
    echo.
    echo 🚀 Next steps on the server:
    echo    1. SSH to server: ssh %SSH_USER%@%SERVER_IP%
    echo    2. Extract package: unzip %REMOTE_PATH%%ZIP_FILE%
    echo    3. Install dependencies: npm install
    echo    4. Start application: ./pm2-control.sh prod
    echo    5. Access at: http://%SERVER_IP%:4000
    echo.
    echo 🔧 Server management commands:
    echo    - Check status: ./pm2-control.sh status
    echo    - View logs: ./pm2-control.sh logs
    echo    - Restart: ./pm2-control.sh restart
    echo    - Stop: ./pm2-control.sh stop
    echo.
    
    set /p DEPLOY_NOW="Would you like to SSH and deploy now? (y/n): "
    if /i "!DEPLOY_NOW!"=="y" (
        echo 🔗 Connecting to server...
        %SSH_CMD% %SSH_USER%@%SERVER_IP%
    )
) else (
    echo ❌ Upload failed!
    echo.
    echo 🔧 Troubleshooting:
    echo    - Verify server IP: %SERVER_IP%
    echo    - Check SSH access: %SSH_CMD% %SSH_USER%@%SERVER_IP%
    echo    - Ensure remote directory exists: %REMOTE_PATH%
    echo    - Check network connectivity
    echo.
    echo 📝 Manual upload options:
    echo    - Use WinSCP: https://winscp.net/
    echo    - Use FileZilla: https://filezilla-project.org/
    echo    - Use VS Code SSH extension
)

pause

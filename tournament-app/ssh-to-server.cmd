@echo off
echo 🔗 Connecting to Server using Git SSH
echo =====================================

set SERVER_IP=165.227.185.255
set SSH_USER=root
set GIT_SSH="C:\Program Files\Git\usr\bin\ssh.exe"

echo Connecting to: %SSH_USER%@%SERVER_IP%
echo Using: Git SSH (%GIT_SSH%)
echo.

if exist %GIT_SSH% (
    %GIT_SSH% %SSH_USER%@%SERVER_IP%
) else (
    echo ❌ Git SSH not found at expected location
    echo Please check your Git installation
    pause
)

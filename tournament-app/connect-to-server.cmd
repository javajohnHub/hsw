@echo off
echo 🔧 SSH Connection Helper for Windows
echo ===================================

set SERVER_IP=165.227.185.255
set SSH_USER=root

echo Attempting to connect to: %SSH_USER%@%SERVER_IP%
echo.

REM Try different SSH methods in order of preference

REM Method 1: Check if OpenSSH is available (Windows 10/11)
where ssh >nul 2>nul
if %errorlevel% equ 0 (
    echo ✅ Using Windows OpenSSH Client
    ssh %SSH_USER%@%SERVER_IP%
    goto :end
)

REM Method 2: Try Git Bash SSH
if exist "C:\Program Files\Git\usr\bin\ssh.exe" (
    echo ✅ Using Git Bash SSH
    "C:\Program Files\Git\usr\bin\ssh.exe" %SSH_USER%@%SERVER_IP%
    goto :end
)

if exist "C:\Program Files (x86)\Git\usr\bin\ssh.exe" (
    echo ✅ Using Git Bash SSH (x86)
    "C:\Program Files (x86)\Git\usr\bin\ssh.exe" %SSH_USER%@%SERVER_IP%
    goto :end
)

REM Method 3: Try WSL
where wsl >nul 2>nul
if %errorlevel% equ 0 (
    echo ✅ Using Windows Subsystem for Linux
    wsl ssh %SSH_USER%@%SERVER_IP%
    goto :end
)

REM Method 4: If nothing works, provide instructions
echo ❌ SSH client not found. Please choose an option:
echo.
echo 🔧 Option 1: Install OpenSSH Client (Windows 10/11)
echo    1. Open Settings ^> Apps ^> Optional Features
echo    2. Click "Add a feature"
echo    3. Find and install "OpenSSH Client"
echo    4. Restart this script
echo.
echo 🔧 Option 2: Use Git Bash (Recommended)
echo    1. Download Git for Windows: https://git-scm.com/download/win
echo    2. Install with default options
echo    3. Restart this script
echo.
echo 🔧 Option 3: Use PuTTY
echo    1. Download PuTTY: https://www.putty.org/
echo    2. Install and run PuTTY
echo    3. Enter Host: %SERVER_IP%
echo    4. Port: 22
echo    5. Connection Type: SSH
echo    6. Click Open and login as: %SSH_USER%
echo.
echo 🔧 Option 4: Use Windows Terminal (if available)
echo    - Windows Terminal often includes SSH support
echo.
echo 🔧 Option 5: Enable WSL
echo    1. Open PowerShell as Administrator
echo    2. Run: wsl --install
echo    3. Restart computer
echo    4. Restart this script

:end
pause

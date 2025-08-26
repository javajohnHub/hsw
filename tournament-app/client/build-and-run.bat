@echo off
echo Building Angular application...
call ng build --configuration development
if %errorlevel% neq 0 (
    echo Build failed!
    pause
    exit /b 1
)

echo Starting Electron...
call electron .

@echo off
echo Building Electron main process...
call npm run build:electron
if %ERRORLEVEL% neq 0 (
    echo Failed to build Electron main process
    pause
    exit /b 1
)
    @echo off
    echo Electron packaging has been removed from this branch. Restore from git history if needed.
    exit /b 0
    exit /b 1
)

echo Starting Electron application...
call npm run electron
if %ERRORLEVEL% neq 0 (
    echo Failed to start Electron application
    pause
    exit /b 1
)

pause

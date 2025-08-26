@echo off
echo Building RND Overlay Tournament Management for distribution...

echo Step 1: Installing dependencies...
call npm install
if %ERRORLEVEL% neq 0 (
    echo Failed to install dependencies
    pause
    exit /b 1
)

echo Step 2: Building Electron main process...

echo Step 3: Building Angular application...
call npm run build
if %ERRORLEVEL% neq 0 (
    echo Failed to build Angular application
    pause
    exit /b 1
)

echo Step 4: Creating Electron distribution...

echo Build completed successfully!
echo Check the 'release' folder for the distributable files.
pause
@echo off
echo Electron packaging has been removed from this branch. Restore from git history if needed.
exit /b 0

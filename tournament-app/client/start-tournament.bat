@echo off
echo Starting RND Overlay Tournament Management (Electron)
echo.
echo Step 1: Starting Angular dev server...
cd /d "c:\Users\joedw\OneDrive\Desktop\rndoverlay\client"
@echo off
echo Electron packaging has been removed from this branch. Restore from git history if needed.
exit /b 0

echo.
echo Step 2: Waiting for Angular to start...
timeout /t 15 /nobreak

echo.
echo Step 3: Starting Electron application...
set NODE_ENV=development
electron .

pause

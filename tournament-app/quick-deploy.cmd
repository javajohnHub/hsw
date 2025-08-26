@echo off
echo =======================================
echo  Quick Deploy - RND Tournament
echo =======================================

echo 🔨 Building and uploading in one step...

call build-and-deploy.cmd

if %ERRORLEVEL% == 0 (
    echo.
    echo 📤 Now uploading to server...
    call upload-server-deploy.cmd
) else (
    echo ❌ Build failed - cancelling upload
    pause
    exit /b 1
)

echo.
echo ✅ Quick deploy completed!

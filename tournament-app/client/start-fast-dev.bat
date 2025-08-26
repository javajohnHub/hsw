@echo off
echo Optimizing Angular for faster startup...

cd /d "c:\Users\joedw\OneDrive\Desktop\rndoverlay\client"

echo Clearing caches...
if exist .angular rmdir /s /q .angular
if exist node_modules\.cache rmdir /s /q node_modules\.cache
if exist dist rmdir /s /q dist

echo Starting optimized Angular development server...
ng serve --configuration development --watch=true --poll=1000

pause

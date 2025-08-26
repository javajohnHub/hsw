@echo off
REM Copy edwards frontend dist and server files into this package (Windows)
if not exist "..\..\frontend\dist" (
  echo Source frontend dist not found: ..\..\frontend\dist
  exit /b 1
)
mkdir frontend 2>nul
mkdir frontend\dist 2>nul
xcopy /s /e /y "..\..\frontend\dist\*" "frontend\dist\"
echo Copied edwards frontend dist.
REM Optionally copy server files
if exist "..\..\server\index.js" (
  mkdir server 2>nul
  xcopy /s /e /y "..\..\server\*" "server\"
  echo Copied server files.
)

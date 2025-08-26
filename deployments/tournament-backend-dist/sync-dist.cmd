@echo off
REM Copy tournament client dist into this package (Windows)
if not exist "..\..\tournament-app\client\dist\retro-never-dies-client" (
  echo Source dist not found: ..\..\tournament-app\client\dist\retro-never-dies-client
  exit /b 1
)
mkdir client 2>nul
mkdir client\dist 2>nul
mkdir client\dist\retro-never-dies-client 2>nul
xcopy /s /e /y "..\..\tournament-app\client\dist\retro-never-dies-client\*" "client\dist\retro-never-dies-client\"
echo Copied tournament client dist.

REM Also copy backend data if present into this package so the wrapper can serve it at /data
if exist "..\..\..\backend\data" (
  mkdir data 2>nul
  xcopy /s /e /y "..\..\..\backend\data\*" "data\"
  echo Copied backend data into package data\
) else (
  echo No backend data folder found at ..\..\..\backend\data
)

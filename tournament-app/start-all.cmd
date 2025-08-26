@echo off
REM Start Angular UI
start cmd /k "cd client && ng serve"
REM Start Node backend
start cmd /k "cd server && node index.js"

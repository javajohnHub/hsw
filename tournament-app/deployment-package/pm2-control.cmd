@echo off
setlocal enabledelayedexpansion

REM RND Tournament Management - PM2 Management Scripts

echo 🚀 RND Tournament Management - PM2 Control
echo ===========================================

if "%1"=="" goto :show_help

REM Function to check if PM2 is installed
:check_pm2
where pm2 >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ PM2 is not installed. Installing PM2...
    npm install -g pm2
) else (
    echo ✅ PM2 is already installed
)
goto :eof

REM Function to create logs directory
:create_logs_dir
if not exist "logs" (
    mkdir logs
    echo 📁 Created logs directory
)
goto :eof

REM Function to build the application
:build_app
echo 🔨 Building Angular application...
cd client
call npm run build
cd ..
echo ✅ Build completed
goto :eof

REM Function to start development environment
:start_dev
echo 🔧 Starting development environment...
call :check_pm2
call :create_logs_dir
pm2 start ecosystem.config.js --env development
pm2 save
echo ✅ Development environment started
echo 📊 Use 'pm2 monit' to monitor processes
goto :eof

REM Function to start production environment
:start_prod
echo 🚀 Starting production environment...
call :check_pm2
call :create_logs_dir
call :build_app
pm2 start ecosystem.production.config.js --env production
pm2 save
echo ✅ Production environment started
echo 📊 Use 'pm2 monit' to monitor processes
goto :eof

REM Function to stop all processes
:stop_all
echo 🛑 Stopping all RND Tournament processes...
pm2 stop rnd-tournament-backend 2>nul
pm2 stop rnd-tournament-frontend 2>nul
echo ✅ All processes stopped
goto :eof

REM Function to restart all processes
:restart_all
echo 🔄 Restarting all RND Tournament processes...
pm2 restart rnd-tournament-backend 2>nul
pm2 restart rnd-tournament-frontend 2>nul
echo ✅ All processes restarted
goto :eof

REM Function to show status
:show_status
echo 📊 Current PM2 Status:
pm2 list
goto :eof

REM Function to show logs
:show_logs
echo 📝 Showing logs for all RND Tournament processes...
pm2 logs rnd-tournament
goto :eof

REM Function to delete all processes
:delete_all
echo 🗑️ Removing all RND Tournament processes from PM2...
pm2 delete rnd-tournament-backend 2>nul
pm2 delete rnd-tournament-frontend 2>nul
pm2 save
echo ✅ All processes removed
goto :eof

REM Main command routing
if "%1"=="dev" call :start_dev
if "%1"=="prod" call :start_prod
if "%1"=="stop" call :stop_all
if "%1"=="restart" call :restart_all
if "%1"=="status" call :show_status
if "%1"=="logs" call :show_logs
if "%1"=="delete" call :delete_all
if "%1"=="build" call :build_app
if "%1"=="help" goto :show_help

goto :end

:show_help
echo Usage: %0 {dev^|prod^|stop^|restart^|status^|logs^|delete^|build}
echo.
echo Commands:
echo   dev     - Start development environment (frontend + backend)
echo   prod    - Start production environment (build + serve)
echo   stop    - Stop all processes
echo   restart - Restart all processes
echo   status  - Show PM2 process status
echo   logs    - Show logs for all processes
echo   delete  - Remove all processes from PM2
echo   build   - Build the Angular application
echo.
echo Examples:
echo   %0 dev     # Start development
echo   %0 prod    # Start production
echo   %0 status  # Check status

:end

#!/bin/bash

# RND Tournament Management - PM2 Management Scripts

echo "🚀 RND Tournament Management - PM2 Control"
echo "==========================================="

# Function to check if PM2 is installed
check_pm2() {
    if ! command -v pm2 &> /dev/null; then
        echo "❌ PM2 is not installed. Installing PM2..."
        npm install -g pm2
    else
        echo "✅ PM2 is already installed"
    fi
}

# Function to create logs directory
create_logs_dir() {
    if [ ! -d "logs" ]; then
        mkdir logs
        echo "📁 Created logs directory"
    fi
}

# Function to build the application
build_app() {
    echo "🔨 Building Angular application..."
    cd client
    npm run build
    cd ..
    echo "✅ Build completed"
}

# Function to start development environment
start_dev() {
    echo "🔧 Starting development environment..."
    check_pm2
    create_logs_dir
    pm2 start ecosystem.config.js --env development
    pm2 save
    echo "✅ Development environment started"
    echo "📊 Use 'pm2 monit' to monitor processes"
}

# Function to start production environment
start_prod() {
    echo "🚀 Starting production environment..."
    check_pm2
    create_logs_dir
    build_app
    pm2 start ecosystem.production.config.js --env production
    pm2 save
    echo "✅ Production environment started"
    echo "📊 Use 'pm2 monit' to monitor processes"
}

# Function to stop all processes
stop_all() {
    echo "🛑 Stopping all RND Tournament processes..."
    pm2 stop rnd-tournament-backend 2>/dev/null || true
    pm2 stop rnd-tournament-frontend 2>/dev/null || true
    echo "✅ All processes stopped"
}

# Function to restart all processes
restart_all() {
    echo "🔄 Restarting all RND Tournament processes..."
    pm2 restart rnd-tournament-backend 2>/dev/null || true
    pm2 restart rnd-tournament-frontend 2>/dev/null || true
    echo "✅ All processes restarted"
}

# Function to show status
show_status() {
    echo "📊 Current PM2 Status:"
    pm2 list
}

# Function to show logs
show_logs() {
    echo "📝 Showing logs for all RND Tournament processes..."
    pm2 logs rnd-tournament
}

# Function to delete all processes
delete_all() {
    echo "🗑️ Removing all RND Tournament processes from PM2..."
    pm2 delete rnd-tournament-backend 2>/dev/null || true
    pm2 delete rnd-tournament-frontend 2>/dev/null || true
    pm2 save
    echo "✅ All processes removed"
}

# Main menu
case "$1" in
    "dev")
        start_dev
        ;;
    "prod")
        start_prod
        ;;
    "stop")
        stop_all
        ;;
    "restart")
        restart_all
        ;;
    "status")
        show_status
        ;;
    "logs")
        show_logs
        ;;
    "delete")
        delete_all
        ;;
    "build")
        build_app
        ;;
    *)
        echo "Usage: $0 {dev|prod|stop|restart|status|logs|delete|build}"
        echo ""
        echo "Commands:"
        echo "  dev     - Start development environment (frontend + backend)"
        echo "  prod    - Start production environment (build + serve)"
        echo "  stop    - Stop all processes"
        echo "  restart - Restart all processes"
        echo "  status  - Show PM2 process status"
        echo "  logs    - Show logs for all processes"
        echo "  delete  - Remove all processes from PM2"
        echo "  build   - Build the Angular application"
        echo ""
        echo "Examples:"
        echo "  ./pm2-control.sh dev     # Start development"
        echo "  ./pm2-control.sh prod    # Start production"
        echo "  ./pm2-control.sh status  # Check status"
        exit 1
        ;;
esac

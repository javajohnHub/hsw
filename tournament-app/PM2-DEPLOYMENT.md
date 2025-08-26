# RND Tournament Management - PM2 Deployment Guide

This guide explains how to deploy and manage the RND Tournament Management system using PM2 process manager.

## Prerequisites

- Node.js 18+ installed
- npm or yarn package manager
- PM2 process manager (will be installed automatically if missing)

## Quick Start

### 1. Install Dependencies

```bash
# Install root dependencies
npm install

# Install all project dependencies
npm run install:all
```

### 2. Development Deployment

```bash
# Using the control script (Windows)
pm2-control.cmd dev

# Or using npm scripts
npm run pm2:dev
```

### 3. Production Deployment

```bash
# Using the control script (Windows)
pm2-control.cmd prod

# Or using npm scripts
npm run pm2:prod
```

## Control Scripts

### Windows (`pm2-control.cmd`)

```cmd
pm2-control.cmd dev      # Start development environment
pm2-control.cmd prod     # Start production environment
pm2-control.cmd stop     # Stop all processes
pm2-control.cmd restart  # Restart all processes
pm2-control.cmd status   # Show process status
pm2-control.cmd logs     # Show logs
pm2-control.cmd delete   # Remove all processes
pm2-control.cmd build    # Build Angular app
```

### Linux/macOS (`pm2-control.sh`)

```bash
chmod +x pm2-control.sh
./pm2-control.sh dev     # Start development environment
./pm2-control.sh prod    # Start production environment
./pm2-control.sh stop    # Stop all processes
./pm2-control.sh restart # Restart all processes
./pm2-control.sh status  # Show process status
./pm2-control.sh logs    # Show logs
./pm2-control.sh delete  # Remove all processes
./pm2-control.sh build   # Build Angular app
```

## PM2 Configuration Files

### Development (`ecosystem.config.js`)
- Runs Angular dev server on port 4300
- Runs Node.js backend on port 4000
- Includes hot reloading for development

### Production (`ecosystem.production.config.js`)
- Builds Angular app for production
- Serves static files through Node.js backend
- Optimized for production deployment

## Process Management

### Check Status
```bash
pm2 list
pm2 status
```

### Monitor Processes
```bash
pm2 monit
```

### View Logs
```bash
pm2 logs                    # All logs
pm2 logs rnd-tournament-backend   # Backend logs only
pm2 logs rnd-tournament-frontend  # Frontend logs only
```

### Restart Processes
```bash
pm2 restart all
pm2 restart rnd-tournament-backend
pm2 restart rnd-tournament-frontend
```

### Stop Processes
```bash
pm2 stop all
pm2 stop rnd-tournament-backend
pm2 stop rnd-tournament-frontend
```

### Delete Processes
```bash
pm2 delete all
pm2 delete rnd-tournament-backend
pm2 delete rnd-tournament-frontend
```

## Log Files

Logs are stored in the `logs/` directory:
- `backend-error.log` - Backend error logs
- `backend-out.log` - Backend output logs
- `backend-combined.log` - Backend combined logs
- `frontend-error.log` - Frontend error logs
- `frontend-out.log` - Frontend output logs
- `frontend-combined.log` - Frontend combined logs

## Startup on Boot

To automatically start the application on server boot:

```bash
# Save current PM2 processes
pm2 save

# Generate startup script
pm2 startup

# Follow the instructions provided by PM2
```

## Environment Variables

### Backend Environment Variables
- `NODE_ENV` - Environment (development/production)
- `PORT` - Backend port (default: 4000)
- `STATIC_PATH` - Path to Angular build files

### Frontend Environment Variables
- `NODE_ENV` - Environment (development/production)

## Troubleshooting

### Common Issues

1. **Port already in use**
   ```bash
   pm2 kill  # Kill all PM2 processes
   pm2-control.cmd delete  # Remove all processes
   ```

2. **Build failures**
   ```bash
   cd client
   npm install
   npm run build
   ```

3. **Permission issues (Linux/macOS)**
   ```bash
   chmod +x pm2-control.sh
   ```

### Debug Mode

To run with debug output:
```bash
pm2 start ecosystem.config.js --env development --log-type json
pm2 logs --json
```

## Production Deployment Checklist

- [ ] Install Node.js 18+
- [ ] Install PM2 globally: `npm install -g pm2`
- [ ] Clone repository
- [ ] Run `npm run install:all`
- [ ] Configure environment variables
- [ ] Run `pm2-control.cmd prod` or `./pm2-control.sh prod`
- [ ] Setup PM2 startup script
- [ ] Configure reverse proxy (nginx/apache) if needed
- [ ] Setup SSL certificates if required

## Monitoring and Maintenance

### Health Checks
```bash
pm2 status
curl http://localhost:4000/health  # If health endpoint exists
```

### Updates
```bash
git pull
pm2-control.cmd stop
npm run install:all
pm2-control.cmd prod
```

### Backup
- Backup `server/` directory (contains JSON data files)
- Backup logs if needed
- Consider database backups if using external DB

## Support

For issues related to:
- PM2: Check PM2 documentation at https://pm2.keymetrics.io/
- Angular: Check Angular documentation
- Node.js: Check Node.js documentation

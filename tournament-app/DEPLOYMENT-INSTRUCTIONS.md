# 🚀 Server Deployment Instructions

## Quick Deploy

After the Angular build completes, run one of these commands:

### Windows:
```cmd
build-deployment.cmd
```

### Linux/macOS:
```bash
chmod +x build-deployment.sh
./build-deployment.sh
```

## What the build script does:

1. **Creates deployment folder** with proper structure
2. **Copies server files** (Node.js backend)
3. **Copies built Angular files** (from client/dist)
4. **Includes PM2 configuration** files
5. **Adds control scripts** for easy management
6. **Creates ZIP package** ready for server upload

## Deployment Package Contents:

```
RND-Tournament-Management-Server.zip
├── server/                 # Node.js backend
├── client/dist/           # Built Angular app
├── logs/                  # Log directory
├── package.json           # Root dependencies
├── ecosystem.config.js    # PM2 dev config
├── ecosystem.production.config.js  # PM2 prod config
├── pm2-control.cmd        # Windows control script
├── pm2-control.sh         # Linux control script
├── PM2-DEPLOYMENT.md      # Detailed deployment guide
└── DEPLOYMENT-INFO.txt    # Build information
```

## Server Setup:

1. **Upload** `RND-Tournament-Management-Server.zip` to your server
2. **Extract** the ZIP file
3. **Install dependencies**: `npm install`
4. **Start application**: 
   - Windows: `pm2-control.cmd prod`
   - Linux: `./pm2-control.sh prod`
5. **Access**: Open `http://your-server:4000`

## Admin Access:

- **Regular users**: `http://your-server:4000`
- **Admin users**: `http://your-server:4000?admin=1`

## Process Management:

```bash
pm2-control.cmd status    # Check status
pm2-control.cmd logs      # View logs
pm2-control.cmd restart   # Restart services
pm2-control.cmd stop      # Stop services
```

The application will automatically restart if it crashes and start on server boot (after running `pm2 startup`).

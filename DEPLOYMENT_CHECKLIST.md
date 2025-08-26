# Deployment Checklist for 165.227.185.255

## Pre-Deployment (Local)

- [ ] All code committed and tested locally
- [ ] Dependencies installed and working
- [ ] Environment variables configured
- [ ] Build process tested
- [ ] Contact form tested locally

## Package Preparation

- [ ] Run `prepare-deploy.bat` (Windows) or `prepare-deploy.sh` (Linux/Mac)
- [ ] Verify `edwards-webdev-deploy.zip` or `edwards-webdev-deploy.tar.gz` created
- [ ] Check package contents

## Server Requirements

- [ ] Node.js v18+ installed
- [ ] PM2 installed globally
- [ ] Firewall configured (ports 22, 80, 443, 3000, 4200)
- [ ] Sufficient disk space (at least 1GB free)
- [ ] Root or sudo access

## Deployment Steps

1. **Upload Package**
   ```bash
   scp edwards-webdev-deploy.zip root@165.227.185.255:/tmp/
   ```

2. **Connect to Server**
   ```bash
   ssh root@165.227.185.255
   ```

3. **Extract and Setup**
   ```bash
   cd /var/www
   unzip /tmp/edwards-webdev-deploy.zip
   mv edwards-webdev-deploy edwards-webdev
   cd edwards-webdev
   ```

4. **Deploy**
   ```bash
   chmod +x server-deploy.sh
   ./server-deploy.sh
   ```

## Post-Deployment Verification

- [ ] Frontend accessible at `http://165.227.185.255:4200`
- [ ] Backend API accessible at `http://165.227.185.255:3000/health`
- [ ] Contact form working
- [ ] PM2 processes running (`pm2 status`)
- [ ] No errors in logs (`pm2 logs`)

## Optional Enhancements

- [ ] Setup Nginx reverse proxy
- [ ] Configure SSL certificate
- [ ] Setup domain name
- [ ] Configure backup strategy
- [ ] Setup monitoring

## Troubleshooting

If deployment fails:

1. Check PM2 logs: `pm2 logs`
2. Check build output: `npm run build`
3. Verify environment variables: `cat backend/.env`
4. Check port availability: `netstat -tlnp | grep :3000`
5. Restart PM2: `pm2 restart all`

## Useful Commands

```bash
# Check application status
pm2 status

# View logs
pm2 logs

# Monitor applications
pm2 monit

# Restart applications
pm2 restart all

# Stop applications
pm2 stop all

# Check disk space
df -h

# Check memory usage
free -h
```

## Contact Information

If you need support:
- Email: 419webdev@gmail.com
- Server IP: 165.227.185.255
